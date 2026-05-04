"""
Interview Proctoring System — Phase 2: OpenCV Integration
=========================================================
Features:
  - Face detection
  - Eye detection with left/right split cascades
  - Gaze direction estimation (looking away detection)
  - Detection stability (avoids noisy flickering alerts)
  - Structured console logging
  - Modular design ready for Phase 3 backend integration
"""

import cv2
import time
import logging
from dataclasses import dataclass, field
from collections import deque

# ─────────────────────────────────────────────
# LOGGING SETUP
# ─────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("proctoring")


# ─────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────

@dataclass
class Config:
    # Cascade paths
    face_cascade_path: str = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    left_eye_cascade_path: str = cv2.data.haarcascades + "haarcascade_lefteye_2splits.xml"
    right_eye_cascade_path: str = cv2.data.haarcascades + "haarcascade_righteye_2splits.xml"

    # Detection params
    face_scale_factor: float = 1.1
    face_min_neighbors: int = 5
    eye_scale_factor: float = 1.1
    eye_min_neighbors: int = 10

    # Gaze thresholds
    # Eye must be in outer N% of face width to count as "looking away"
    gaze_outer_ratio: float = 0.30   # 30% from the edge

    # Stability — require N consecutive frames before logging state change
    stability_frames: int = 8

    # Frame rate control
    target_fps: int = 15

    # Display
    show_window: bool = True
    window_name: str = "Proctoring Feed"


# ─────────────────────────────────────────────
# DETECTION STATE
# ─────────────────────────────────────────────

@dataclass
class DetectionState:
    """Tracks current stable detection results."""
    face_detected: bool = False
    eyes_detected: bool = False
    gaze_status: str = "unknown"      # "forward" | "looking_away" | "eyes_not_found" | "no_face"

    # History queues for stability smoothing
    _face_history: deque = field(default_factory=lambda: deque(maxlen=8))
    _eyes_history: deque = field(default_factory=lambda: deque(maxlen=8))
    _gaze_history: deque = field(default_factory=lambda: deque(maxlen=8))

    # Last logged state — avoids spamming duplicate log lines
    _last_logged: dict = field(default_factory=dict)

    def update(self, face: bool, eyes: bool, gaze: str, stability: int):
        """Update histories and compute stable values via majority vote."""
        self._face_history.append(face)
        self._eyes_history.append(eyes)
        self._gaze_history.append(gaze)

        if len(self._face_history) >= stability:
            self.face_detected = sum(self._face_history) > stability // 2
            self.eyes_detected = sum(self._eyes_history) > stability // 2

            # Majority gaze vote
            gaze_counts: dict[str, int] = {}
            for g in self._gaze_history:
                gaze_counts[g] = gaze_counts.get(g, 0) + 1
            self.gaze_status = max(gaze_counts, key=gaze_counts.get)

    def log_changes(self):
        """Log only when stable state actually changes."""
        current = {
            "face": self.face_detected,
            "eyes": self.eyes_detected,
            "gaze": self.gaze_status,
        }

        if current == self._last_logged:
            return  # Nothing new to log

        if current["face"] != self._last_logged.get("face"):
            if current["face"]:
                log.info("Face detected")
            else:
                log.warning("Face not detected — candidate may have left frame")

        if current["eyes"] != self._last_logged.get("eyes"):
            if current["eyes"]:
                log.info("Eyes detected")
            else:
                log.warning("Eyes not detected")

        if current["gaze"] != self._last_logged.get("gaze"):
            if current["gaze"] == "looking_away":
                log.warning("Looking away")
            elif current["gaze"] == "forward":
                log.info("Looking forward")
            elif current["gaze"] == "eyes_not_found":
                log.info("Gaze undetermined — eyes not found in face region")
            elif current["gaze"] == "no_face":
                log.info("Gaze undetermined — no face in frame")

        self._last_logged = current


# ─────────────────────────────────────────────
# DETECTOR
# ─────────────────────────────────────────────

class GazeDetector:
    def __init__(self, config: Config):
        self.cfg = config
        self.face_cascade = self._load_cascade(config.face_cascade_path, "face")
        self.left_eye_cascade = self._load_cascade(config.left_eye_cascade_path, "left eye")
        self.right_eye_cascade = self._load_cascade(config.right_eye_cascade_path, "right eye")

    def _load_cascade(self, path: str, name: str) -> cv2.CascadeClassifier:
        cascade = cv2.CascadeClassifier(path)
        if cascade.empty():
            raise RuntimeError(f"Failed to load {name} cascade from: {path}")
        log.info(f"Loaded {name} cascade OK")
        return cascade

    def detect_faces(self, gray_frame) -> list:
        """Return list of face bounding boxes (x, y, w, h)."""
        faces = self.face_cascade.detectMultiScale(
            gray_frame,
            scaleFactor=self.cfg.face_scale_factor,
            minNeighbors=self.cfg.face_min_neighbors,
            minSize=(80, 80),
        )
        return faces if len(faces) > 0 else []

    def detect_eyes_in_face(self, gray_frame, fx, fy, fw, fh) -> dict:
        """
        Detect left and right eyes within the upper half of the face ROI.
        Returns {"left": [(x,y,w,h)...], "right": [...]}
        """
        # Only search upper portion of face (eyes are in the top ~60%)
        roi_y_end = fy + int(fh * 0.6)
        roi = gray_frame[fy:roi_y_end, fx:fx + fw]

        left_eyes = self.left_eye_cascade.detectMultiScale(
            roi,
            scaleFactor=self.cfg.eye_scale_factor,
            minNeighbors=self.cfg.eye_min_neighbors,
            minSize=(20, 20),
        )
        right_eyes = self.right_eye_cascade.detectMultiScale(
            roi,
            scaleFactor=self.cfg.eye_scale_factor,
            minNeighbors=self.cfg.eye_min_neighbors,
            minSize=(20, 20),
        )

        return {
            "left": list(left_eyes) if len(left_eyes) > 0 else [],
            "right": list(right_eyes) if len(right_eyes) > 0 else [],
        }

    def estimate_gaze(self, fx, fw, eyes: dict) -> str:
        """
        Estimate gaze from eye positions within the face.
        Logic:
          - Compute eye centre X relative to face width
          - If centre is too far to either edge → looking away
        Returns: "forward" | "looking_away" | "eyes_not_found"
        """
        all_eyes = eyes["left"] + eyes["right"]
        if not all_eyes:
            return "eyes_not_found"

        # Take the eye closest to the face centre horizontally
        face_centre_x = fw / 2
        best_eye = min(all_eyes, key=lambda e: abs((e[0] + e[2] / 2) - face_centre_x))
        ex, ey, ew, eh = best_eye
        eye_centre_x = ex + ew / 2   # relative to face ROI

        outer = self.cfg.gaze_outer_ratio * fw
        if eye_centre_x < outer or eye_centre_x > fw - outer:
            return "looking_away"
        return "forward"

    def process_frame(self, gray_frame) -> tuple[bool, bool, str, list, list]:
        """
        Full pipeline for one frame.
        Returns:
            face_found (bool), eyes_found (bool), gaze (str),
            face_boxes (list), eye_boxes_abs (list)
        """
        faces = self.detect_faces(gray_frame)

        if len(faces) == 0:
            return False, False, "no_face", [], []

        # Use the largest face (most prominent candidate)
        largest = max(faces, key=lambda f: f[2] * f[3])
        fx, fy, fw, fh = largest

        eyes = self.detect_eyes_in_face(gray_frame, fx, fy, fw, fh)
        eyes_found = bool(eyes["left"] or eyes["right"])
        gaze = self.estimate_gaze(fx, fw, eyes)

        # Convert eye coords back to frame absolute for drawing
        eye_boxes_abs = []
        for (ex, ey, ew, eh) in (eyes["left"] + eyes["right"]):
            eye_boxes_abs.append((fx + ex, fy + ey, ew, eh))

        return True, eyes_found, gaze, [largest], eye_boxes_abs


# ─────────────────────────────────────────────
# DISPLAY
# ─────────────────────────────────────────────

# Status color map  (BGR)
STATUS_COLORS = {
    "forward":        (0, 200, 0),     # green
    "looking_away":   (0, 0, 220),     # red
    "eyes_not_found": (0, 165, 255),   # orange
    "no_face":        (180, 180, 180), # grey
    "unknown":        (180, 180, 180),
}


def draw_overlay(frame, state: DetectionState, face_boxes, eye_boxes):
    """Draw bounding boxes and HUD text on the display frame."""
    for (fx, fy, fw, fh) in face_boxes:
        cv2.rectangle(frame, (fx, fy), (fx + fw, fy + fh), (255, 200, 0), 2)

    for (ex, ey, ew, eh) in eye_boxes:
        cv2.rectangle(frame, (ex, ey), (ex + ew, ey + eh), (200, 255, 0), 1)

    color = STATUS_COLORS.get(state.gaze_status, (200, 200, 200))

    # HUD lines
    hud = [
        f"Face:  {'YES' if state.face_detected else 'NO'}",
        f"Eyes:  {'YES' if state.eyes_detected else 'NO'}",
        f"Gaze:  {state.gaze_status.replace('_', ' ').title()}",
    ]
    for i, line in enumerate(hud):
        cv2.putText(frame, line, (10, 30 + i * 28),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.75, color, 2)

    return frame


# ─────────────────────────────────────────────
# LOGGER HOOK  (Phase 3 integration point)
# ─────────────────────────────────────────────

def send_event_to_backend(event: dict):
    """
    Phase 3 hook — replace body with HTTP POST or WebSocket emit.
    Called only on stable state changes.

    Example event:
        {
          "timestamp": 1714900000.0,
          "face_detected": True,
          "eyes_detected": False,
          "gaze_status": "looking_away"
        }
    """
    # Placeholder — will be wired to backend in Phase 3
    log.debug(f"[backend stub] event: {event}")


# ─────────────────────────────────────────────
# MAIN LOOP
# ─────────────────────────────────────────────

def run_proctoring(camera_index: int = 0, config: Config = None):
    if config is None:
        config = Config()

    detector = GazeDetector(config)
    state = DetectionState(
        _face_history=deque(maxlen=config.stability_frames),
        _eyes_history=deque(maxlen=config.stability_frames),
        _gaze_history=deque(maxlen=config.stability_frames),
    )

    cap = cv2.VideoCapture(camera_index)
    if not cap.isOpened():
        log.error(f"Cannot open camera index {camera_index}")
        return

    log.info("Proctoring started — press Q to quit")

    frame_interval = 1.0 / config.target_fps
    last_event_state = {}

    try:
        while True:
            t_start = time.monotonic()

            ret, frame = cap.read()
            if not ret:
                log.warning("Empty frame received, retrying...")
                continue

            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            gray = cv2.equalizeHist(gray)   # improves detection in poor lighting

            face_found, eyes_found, gaze, face_boxes, eye_boxes = detector.process_frame(gray)

            # Update stable state
            state.update(face_found, eyes_found, gaze, config.stability_frames)
            state.log_changes()

            # Phase 3 hook — fire only on change
            current_event = {
                "face_detected": state.face_detected,
                "eyes_detected": state.eyes_detected,
                "gaze_status": state.gaze_status,
            }
            if current_event != last_event_state:
                send_event_to_backend({**current_event, "timestamp": time.time()})
                last_event_state = current_event.copy()

            # Display
            if config.show_window:
                draw_overlay(frame, state, face_boxes, eye_boxes)
                cv2.imshow(config.window_name, frame)
                if cv2.waitKey(1) & 0xFF == ord("q"):
                    log.info("Quit key pressed — stopping")
                    break

            # Frame rate cap
            elapsed = time.monotonic() - t_start
            sleep_time = frame_interval - elapsed
            if sleep_time > 0:
                time.sleep(sleep_time)

    finally:
        cap.release()
        cv2.destroyAllWindows()
        log.info("Proctoring stopped")


# ─────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────

if __name__ == "__main__":
    cfg = Config(
        show_window=True,
        stability_frames=8,
        target_fps=15,
        gaze_outer_ratio=0.30,
    )
    run_proctoring(camera_index=0, config=cfg)