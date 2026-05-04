"""
proctor_vision.py — Reusable Proctoring Vision Module (Phase 2 Final)
======================================================================
Usage (from backend):
    from proctor_vision import ProctoringVision
    vision = ProctoringVision()
    status = vision.analyze_frame(frame)   # pass any OpenCV BGR frame
    print(status)
    # {
    #   "face_detected": True,
    #   "eyes_detected": True,
    #   "gaze": "looking_center",
    #   "looking_away": False
    # }

No external dependencies beyond opencv-python and numpy.
"""

import cv2
import numpy as np
from collections import deque
import datetime


# ─────────────────────────────────────────────────────────────────
# Internal Helpers
# ─────────────────────────────────────────────────────────────────

class _BoxSmoother:
    """Exponential moving average smoother for bounding boxes."""
    def __init__(self, alpha=0.5):
        self.alpha = alpha
        self.prev  = None

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

    def reset(self):
        self.prev = None


def _detect_iris_center(eye_region):
    """
    Detects iris center x-position within an eye crop.
    Returns (cx, eye_width) or (None, None) on failure.
    """
    if eye_region is None or eye_region.size == 0:
        return None, None

    gray = cv2.cvtColor(eye_region, cv2.COLOR_BGR2GRAY)
    gray = cv2.equalizeHist(gray)
    gray = cv2.GaussianBlur(gray, (7, 7), 1.5)
    h, w = gray.shape

    # Primary: Hough circles
    circles = cv2.HoughCircles(
        gray,
        cv2.HOUGH_GRADIENT,
        dp=1,
        minDist=w // 2,
        param1=50,
        param2=25,
        minRadius=int(h * 0.15),
        maxRadius=int(h * 0.55)
    )
    if circles is not None:
        cx = int(np.round(circles[0, 0, 0]))
        return cx, w

    # Fallback: Otsu threshold + contour
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)
    contours, _ = cv2.findContours(thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    if contours:
        largest = max(contours, key=cv2.contourArea)
        if cv2.contourArea(largest) > 20:
            M = cv2.moments(largest)
            if M["m00"] != 0:
                return int(M["m10"] / M["m00"]), w

    return None, None


# ─────────────────────────────────────────────────────────────────
# Main Module Class
# ─────────────────────────────────────────────────────────────────

class ProctoringVision:
    """
    Drop-in proctoring vision module.

    Parameters
    ----------
    log_to_file : bool   — write logs to proctor_log.txt (default True)
    log_interval : int   — log every N frames (default 10)
    gaze_history : int   — smoothing window in frames (default 9)
    draw : bool          — draw overlays on the frame (default True)
    """

    def __init__(
        self,
        log_to_file=True,
        log_interval=10,
        gaze_history_size=9,
        draw=True
    ):
        self.log_to_file        = log_to_file
        self.log_interval       = log_interval
        self.draw               = draw

        self._face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        self._eye_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_eye.xml'
        )
        self._face_smoother  = _BoxSmoother(alpha=0.5)
        self._gaze_history   = deque(maxlen=gaze_history_size)
        self._frame_count    = 0

        self._GAZE_COLOR = {
            "looking_center": (0, 255, 0),
            "looking_left":   (0, 165, 255),
            "looking_right":  (0, 165, 255),
            "unknown":        (150, 150, 150),
        }

    # ── Public API ────────────────────────────────────────────────

    def analyze_frame(self, frame):
        """
        Analyze a single BGR frame.

        Parameters
        ----------
        frame : np.ndarray — BGR frame from cv2.VideoCapture

        Returns
        -------
        dict with keys:
            face_detected : bool
            eyes_detected : bool
            gaze          : str  ("looking_center" | "looking_left" |
                                  "looking_right"  | "unknown")
            looking_away  : bool
        """
        self._frame_count += 1

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray = cv2.equalizeHist(gray)

        faces = self._face_cascade.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=5, minSize=(100, 100)
        )

        status = {
            "face_detected": len(faces) > 0,
            "eyes_detected": False,
            "gaze":          "unknown",
            "looking_away":  False
        }

        if status["face_detected"]:
            (fx, fy, fw, fh) = self._face_smoother.smooth(faces[0])
            status = self._process_face(frame, gray, fx, fy, fw, fh, status)
        else:
            self._face_smoother.reset()

        if self._frame_count % self.log_interval == 0:
            self._log(status)

        return status

    def reset(self):
        """Reset all internal state (call between interview sessions)."""
        self._gaze_history.clear()
        self._face_smoother.reset()
        self._frame_count = 0

    # ── Internal Methods ──────────────────────────────────────────

    def _process_face(self, frame, gray, fx, fy, fw, fh, status):
        if self.draw:
            cv2.rectangle(frame, (fx, fy), (fx+fw, fy+fh), (255, 80, 0), 2)
            cv2.putText(frame, "Face", (fx, fy - 8),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 80, 0), 1)

        # Use only top half of face for eye detection
        top_gray  = gray[fy : fy + fh//2, fx : fx + fw]
        top_color = frame[fy : fy + fh//2, fx : fx + fw]

        eyes = self._eye_cascade.detectMultiScale(
            top_gray, scaleFactor=1.1, minNeighbors=8, minSize=(25, 25)
        )

        if len(eyes) >= 1:
            status["eyes_detected"] = True
            eyes = sorted(eyes, key=lambda e: e[2]*e[3], reverse=True)[:2]

            ratios = []
            for (ex, ey, ew, eh) in eyes:
                eye_region = top_color[ey:ey+eh, ex:ex+ew]

                if self.draw:
                    cv2.rectangle(
                        frame,
                        (fx+ex, fy+ey), (fx+ex+ew, fy+ey+eh),
                        (0, 255, 255), 1
                    )

                cx, eye_width = _detect_iris_center(eye_region)
                if cx is not None:
                    ratios.append(cx / eye_width)
                    if self.draw:
                        cv2.circle(
                            frame,
                            (fx + ex + cx, fy + ey + eh // 2),
                            4, (0, 0, 255), -1
                        )

            if ratios:
                avg = sum(ratios) / len(ratios)
                if avg < 0.38:
                    raw_gaze = "looking_left"
                elif avg > 0.62:
                    raw_gaze = "looking_right"
                else:
                    raw_gaze = "looking_center"

                status["gaze"]         = self._stable_gaze(raw_gaze)
                status["looking_away"] = status["gaze"] not in ["looking_center", "unknown"]

        if self.draw:
            self._draw_labels(frame, status)

        return status

    def _stable_gaze(self, current_gaze):
        self._gaze_history.append(current_gaze)
        valid = [g for g in self._gaze_history if g != "unknown"]
        if not valid:
            return "unknown"
        return max(set(valid), key=valid.count)

    def _draw_labels(self, frame, status):
        gaze  = status["gaze"]
        color = self._GAZE_COLOR.get(gaze, (255, 255, 255))
        cv2.putText(frame, gaze.upper(), (30, 50),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.2, color, 2)
        if status["looking_away"]:
            cv2.putText(frame, "LOOKING AWAY!", (30, 95),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)
        if not status["face_detected"]:
            cv2.putText(frame, "NO FACE DETECTED", (30, 95),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)

    def _log(self, status):
        ts   = datetime.datetime.now().strftime("%H:%M:%S.%f")[:-3]
        line = (f"{ts} | Face: {status['face_detected']} | "
                f"Eyes: {status['eyes_detected']} | "
                f"Gaze: {status['gaze']} | "
                f"Away: {status['looking_away']}")
        print(line)
        if self.log_to_file:
            with open("proctor_log.txt", "a") as f:
                f.write(line + "\n")


# ─────────────────────────────────────────────────────────────────
# Standalone test — run this file directly to test with webcam
# ─────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    cap    = cv2.VideoCapture(0)
    vision = ProctoringVision(draw=True)

    print("✅ ProctoringVision module test. Press Q to quit.")

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame  = cv2.flip(frame, 1)
        status = vision.analyze_frame(frame)

        cv2.imshow("ProctoringVision Module Test", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()