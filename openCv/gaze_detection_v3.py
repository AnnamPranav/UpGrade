"""
Gaze Detection v3 - Pure OpenCV, NO MediaPipe, NO TensorFlow
Uses: Histogram Equalization + Hough Circles for iris detection
Install: pip install opencv-python numpy  (that's it!)
"""

import cv2
import numpy as np
from collections import deque
import datetime

# ─────────────────────────────────────────
# Load Cascades
# ─────────────────────────────────────────
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
eye_cascade  = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')

# ─────────────────────────────────────────
# Iris Detection using Hough Circles
# ─────────────────────────────────────────

def detect_iris_center(eye_region):
    """
    Returns (cx, eye_width) — iris x-center and eye width.
    Uses histogram equalization + Hough circles to find the iris.
    """
    if eye_region is None or eye_region.size == 0:
        return None, None

    gray = cv2.cvtColor(eye_region, cv2.COLOR_BGR2GRAY)

    # Equalize histogram to normalize lighting
    gray = cv2.equalizeHist(gray)

    # Blur to reduce noise
    gray = cv2.GaussianBlur(gray, (7, 7), 1.5)

    h, w = gray.shape

    # Hough circle detection for iris
    circles = cv2.HoughCircles(
        gray,
        cv2.HOUGH_GRADIENT,
        dp=1,
        minDist=w // 2,       # only one circle per eye
        param1=50,
        param2=25,            # lower = more permissive
        minRadius=int(h * 0.15),
        maxRadius=int(h * 0.55)
    )

    if circles is not None:
        circles = np.round(circles[0, :]).astype(int)
        cx, cy, r = circles[0]  # take first detected circle
        return cx, w

    # Fallback: use threshold + contour if Hough fails
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)
    contours, _ = cv2.findContours(thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

    if contours:
        largest = max(contours, key=cv2.contourArea)
        if cv2.contourArea(largest) > 20:
            M = cv2.moments(largest)
            if M["m00"] != 0:
                cx = int(M["m10"] / M["m00"])
                return cx, w

    return None, None


# ─────────────────────────────────────────
# Gaze Direction from iris position
# ─────────────────────────────────────────

def get_gaze_direction(cx, eye_width):
    """Divide eye into thirds and classify gaze."""
    if cx is None:
        return "unknown"
    third = eye_width // 3
    if cx < third:
        return "looking_left"
    elif cx > 2 * third:
        return "looking_right"
    else:
        return "looking_center"


# ─────────────────────────────────────────
# Stability
# ─────────────────────────────────────────

gaze_history = deque(maxlen=9)

def stable_gaze(current_gaze):
    gaze_history.append(current_gaze)
    valid = [g for g in gaze_history if g != "unknown"]
    if not valid:
        return "unknown"
    return max(set(valid), key=valid.count)


class BoxSmoother:
    def __init__(self, alpha=0.5):
        self.alpha = alpha
        self.prev = None

    def smooth(self, box):
        if self.prev is None:
            self.prev = box
            return box
        smoothed = tuple(
            int(self.alpha * b + (1 - self.alpha) * p)
            for b, p in zip(box, self.prev)
        )
        self.prev = smoothed
        return smoothed


# ─────────────────────────────────────────
# Logging
# ─────────────────────────────────────────

frame_count = 0

def log_status(face_detected, eyes_detected, gaze):
    global frame_count
    frame_count += 1
    if frame_count % 10 != 0:
        return
    looking_away = gaze not in ["looking_center", "unknown"]
    ts = datetime.datetime.now().strftime("%H:%M:%S.%f")[:-3]
    line = f"{ts} | Face: {face_detected} | Eyes: {eyes_detected} | Gaze: {gaze} | Away: {looking_away}"
    print(line)
    with open("proctor_log.txt", "a") as f:
        f.write(line + "\n")


# ─────────────────────────────────────────
# Main Camera Loop
# ─────────────────────────────────────────

cap = cv2.VideoCapture(0)
face_smoother = BoxSmoother()

GAZE_COLOR = {
    "looking_center": (0, 255, 0),
    "looking_left":   (0, 165, 255),
    "looking_right":  (0, 165, 255),
    "unknown":        (150, 150, 150),
}

print("✅ Gaze Detection v3 started (Pure OpenCV). Press Q to quit.")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame = cv2.flip(frame, 1)
    gray  = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    gray  = cv2.equalizeHist(gray)   # normalize lighting on full frame

    # ── Face Detection ──
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(100, 100))

    face_detected = len(faces) > 0
    eyes_detected = False
    gaze = "unknown"

    if face_detected:
        (fx, fy, fw, fh) = face_smoother.smooth(faces[0])

        # Draw face box
        cv2.rectangle(frame, (fx, fy), (fx+fw, fy+fh), (255, 80, 0), 2)

        # ── Eye Detection inside face ROI ──
        # Use only top half of face — avoids detecting nostrils/mouth as eyes
        top_half_gray  = gray[fy : fy + fh//2, fx : fx + fw]
        top_half_color = frame[fy : fy + fh//2, fx : fx + fw]

        eyes = eye_cascade.detectMultiScale(
            top_half_gray,
            scaleFactor=1.1,
            minNeighbors=8,
            minSize=(25, 25)
        )

        if len(eyes) >= 1:
            eyes_detected = True
            # Sort eyes by size, take the two largest
            eyes = sorted(eyes, key=lambda e: e[2]*e[3], reverse=True)[:2]

            iris_centers = []
            for (ex, ey, ew, eh) in eyes:
                eye_region = top_half_color[ey:ey+eh, ex:ex+ew]

                # Draw eye box (in full frame coords)
                cv2.rectangle(
                    frame,
                    (fx + ex, fy + ey),
                    (fx + ex + ew, fy + ey + eh),
                    (0, 255, 255), 1
                )

                cx, eye_width = detect_iris_center(eye_region)

                if cx is not None:
                    iris_centers.append((cx, eye_width))
                    # Draw iris dot
                    iris_x_full = fx + ex + cx
                    iris_y_full = fy + ey + eh // 2
                    cv2.circle(frame, (iris_x_full, iris_y_full), 4, (0, 0, 255), -1)

            if iris_centers:
                # Average gaze ratio across both eyes
                ratios = [cx / ew for cx, ew in iris_centers]
                avg_ratio = sum(ratios) / len(ratios)

                if avg_ratio < 0.38:
                    raw_gaze = "looking_left"
                elif avg_ratio > 0.62:
                    raw_gaze = "looking_right"
                else:
                    raw_gaze = "looking_center"

                gaze = stable_gaze(raw_gaze)

    # ── Draw Labels ──
    color = GAZE_COLOR.get(gaze, (255, 255, 255))
    cv2.putText(frame, gaze.upper(), (30, 50),
                cv2.FONT_HERSHEY_SIMPLEX, 1.2, color, 2)

    if gaze in ["looking_left", "looking_right"]:
        cv2.putText(frame, "LOOKING AWAY!", (30, 95),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)

    if not face_detected:
        cv2.putText(frame, "NO FACE DETECTED", (30, 95),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)

    log_status(face_detected, eyes_detected, gaze)

    cv2.imshow("Proctoring Vision - Gaze v3", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
