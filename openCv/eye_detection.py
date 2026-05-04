"""
Gaze Detection v2 - Uses MediaPipe Face Mesh + Iris Landmarks
Much more accurate than Haar cascade for gaze direction.
Install: pip install mediapipe opencv-python
"""

import cv2
import mediapipe as mp
import numpy as np
from collections import deque
import datetime

# ─────────────────────────────────────────
# MediaPipe Setup
# ─────────────────────────────────────────
mp_face_mesh = mp.solutions.face_mesh
mp_drawing  = mp.solutions.drawing_utils

# Iris landmark indices (MediaPipe Face Mesh)
# Left eye iris center  = 468
# Right eye iris center = 473
# Left eye corners:  left=33,  right=133
# Right eye corners: left=362, right=263

LEFT_IRIS   = 468
RIGHT_IRIS  = 473
LEFT_EYE_L  = 33
LEFT_EYE_R  = 133
RIGHT_EYE_L = 362
RIGHT_EYE_R = 263

# ─────────────────────────────────────────
# Gaze Direction from Iris Position
# ─────────────────────────────────────────

def get_gaze_ratio(iris_x, eye_left_x, eye_right_x):
    """
    Returns a ratio 0.0 → 1.0:
      0.0 = iris all the way left
      0.5 = iris centered
      1.0 = iris all the way right
    """
    eye_width = eye_right_x - eye_left_x
    if eye_width == 0:
        return 0.5
    return (iris_x - eye_left_x) / eye_width


def get_gaze_direction(left_ratio, right_ratio):
    """Average both eyes for stable direction."""
    avg_ratio = (left_ratio + right_ratio) / 2.0

    if avg_ratio < 0.40:
        return "looking_left"
    elif avg_ratio > 0.60:
        return "looking_right"
    else:
        return "looking_center"


# ─────────────────────────────────────────
# Stability (same as before)
# ─────────────────────────────────────────

gaze_history = deque(maxlen=7)

def stable_gaze(current_gaze):
    gaze_history.append(current_gaze)
    return max(set(gaze_history), key=list(gaze_history).count)


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
# Main Loop
# ─────────────────────────────────────────

cap = cv2.VideoCapture(0)

GAZE_COLOR = {
    "looking_center": (0, 255, 0),
    "looking_left":   (0, 165, 255),
    "looking_right":  (0, 165, 255),
    "unknown":        (128, 128, 128),
}

print("✅ Starting gaze detection. Press Q to quit.")

with mp_face_mesh.FaceMesh(
    max_num_faces=1,
    refine_landmarks=True,   # REQUIRED for iris landmarks
    min_detection_confidence=0.7,
    min_tracking_confidence=0.7
) as face_mesh:

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame = cv2.flip(frame, 1)
        h, w = frame.shape[:2]
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(rgb)

        face_detected = False
        eyes_detected = False
        gaze = "unknown"

        if results.multi_face_landmarks:
            face_detected = True
            lm = results.multi_face_landmarks[0].landmark

            # ── Get iris & eye corner positions in pixels ──
            def pt(idx):
                return int(lm[idx].x * w), int(lm[idx].y * h)

            left_iris_pt  = pt(LEFT_IRIS)
            right_iris_pt = pt(RIGHT_IRIS)
            left_eye_l    = pt(LEFT_EYE_L)
            left_eye_r    = pt(LEFT_EYE_R)
            right_eye_l   = pt(RIGHT_EYE_L)
            right_eye_r   = pt(RIGHT_EYE_R)

            eyes_detected = True

            # ── Calculate gaze ratios ──
            left_ratio  = get_gaze_ratio(left_iris_pt[0],  left_eye_l[0],  left_eye_r[0])
            right_ratio = get_gaze_ratio(right_iris_pt[0], right_eye_l[0], right_eye_r[0])

            raw_gaze = get_gaze_direction(left_ratio, right_ratio)
            gaze     = stable_gaze(raw_gaze)

            # ── Draw iris dots ──
            cv2.circle(frame, left_iris_pt,  4, (0, 255, 255), -1)
            cv2.circle(frame, right_iris_pt, 4, (0, 255, 255), -1)

            # ── Draw eye corner dots ──
            for p in [left_eye_l, left_eye_r, right_eye_l, right_eye_r]:
                cv2.circle(frame, p, 3, (255, 0, 255), -1)

            # ── Draw face bounding box from landmarks ──
            xs = [int(lm[i].x * w) for i in range(468)]
            ys = [int(lm[i].y * h) for i in range(468)]
            x1, y1, x2, y2 = min(xs), min(ys), max(xs), max(ys)
            cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 80, 0), 2)

        # ── Gaze label ──
        color = GAZE_COLOR.get(gaze, (255, 255, 255))
        cv2.putText(frame, gaze.upper(), (30, 50),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.2, color, 2)

        if gaze in ["looking_left", "looking_right"]:
            cv2.putText(frame, "⚠ LOOKING AWAY", (30, 95),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)

        if not face_detected:
            cv2.putText(frame, "NO FACE DETECTED", (30, 95),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)

        log_status(face_detected, eyes_detected, gaze)

        cv2.imshow("Proctoring Vision - Gaze Detection", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

cap.release()
cv2.destroyAllWindows()