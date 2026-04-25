import cv2
import logging
import time
from datetime import datetime

# ─── Logging Setup ───────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("detection_log.txt")
    ]
)
log = logging.getLogger("FaceEyeDetector")

# ─── Load Cascades ───────────────────────────────────────────────
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
eye_cascade  = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_eye.xml")

if face_cascade.empty() or eye_cascade.empty():
    log.error("Failed to load cascade classifiers.")
    raise IOError("Cascade files not found.")

# ─── Stability: Temporal Smoothing State ─────────────────────────
class StableFaceTracker:
    """
    Reduces jitter by requiring a face to appear in N consecutive
    frames before being reported, and persisting it for M frames
    after it disappears (debouncing).
    """
    def __init__(self, confirm_frames=3, persist_frames=5):
        self.confirm_frames = confirm_frames
        self.persist_frames = persist_frames
        self._candidates = {}   # id -> {rect, count, last_seen}
        self._frame_id = 0

    def update(self, rects):
        self._frame_id += 1
        confirmed = []

        for (x, y, w, h) in rects:
            matched = False
            for fid, data in self._candidates.items():
                px, py, pw, ph = data["rect"]
                # IoU-lite: center distance check
                cx, cy = x + w//2, y + h//2
                pcx, pcy = px + pw//2, py + ph//2
                if abs(cx - pcx) < pw * 0.4 and abs(cy - pcy) < ph * 0.4:
                    data["count"] += 1
                    data["last_seen"] = self._frame_id
                    data["rect"] = (x, y, w, h)  # update position
                    matched = True
                    break
            if not matched:
                new_id = self._frame_id * 100 + len(self._candidates)
                self._candidates[new_id] = {
                    "rect": (x, y, w, h),
                    "count": 1,
                    "last_seen": self._frame_id
                }

        # Prune stale candidates
        self._candidates = {
            fid: d for fid, d in self._candidates.items()
            if self._frame_id - d["last_seen"] <= self.persist_frames
        }

        # Return only confirmed faces
        for fid, d in self._candidates.items():
            if d["count"] >= self.confirm_frames:
                confirmed.append(d["rect"])

        return confirmed


# ─── Detection Function ───────────────────────────────────────────
def detect(frame, tracker, frame_count):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    gray = cv2.equalizeHist(gray)  # improves contrast → better detection

    # Face detection with tuned params for stability
    raw_faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,       # smaller = more thorough, slower
        minNeighbors=6,        # higher = fewer false positives
        minSize=(60, 60),      # ignore tiny detections
        flags=cv2.CASCADE_SCALE_IMAGE
    )

    stable_faces = tracker.update(raw_faces if len(raw_faces) > 0 else [])

    total_eyes = 0
    for (fx, fy, fw, fh) in stable_faces:
        cv2.rectangle(frame, (fx, fy), (fx+fw, fy+fh), (0, 255, 0), 2)
        cv2.putText(frame, "Face", (fx, fy - 8),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

        # Eye detection WITHIN the face ROI only (top half = more accurate)
        roi_gray  = gray[fy:fy+fh//2, fx:fx+fw]
        roi_color = frame[fy:fy+fh//2, fx:fx+fw]

        eyes = eye_cascade.detectMultiScale(
            roi_gray,
            scaleFactor=1.1,
            minNeighbors=10,
            minSize=(20, 20)
        )

        eye_count = len(eyes)
        total_eyes += eye_count

        for (ex, ey, ew, eh) in eyes:
            cv2.rectangle(roi_color, (ex, ey), (ex+ew, ey+eh), (255, 100, 0), 2)
            cv2.putText(roi_color, "Eye", (ex, ey - 4),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 100, 0), 1)

        log.info(
            f"Frame {frame_count:05d} | "
            f"Face @ ({fx},{fy}) size={fw}x{fh} | "
            f"Eyes detected: {eye_count}"
        )

    if len(stable_faces) == 0:
        log.debug(f"Frame {frame_count:05d} | No stable faces detected")

    # HUD overlay
    cv2.putText(frame,
                f"Faces: {len(stable_faces)}  Eyes: {total_eyes}  Frame: {frame_count}",
                (10, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 220, 255), 2)

    return frame


# ─── Main Loop ───────────────────────────────────────────────────
def main():
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        log.error("Cannot open webcam.")
        return

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    tracker = StableFaceTracker(confirm_frames=3, persist_frames=5)
    frame_count = 0
    log.info("Detection started. Press 'q' to quit.")

    while True:
        ret, frame = cap.read()
        if not ret:
            log.warning("Frame grab failed, retrying...")
            time.sleep(0.05)
            continue

        frame_count += 1
        output = detect(frame, tracker, frame_count)

        cv2.imshow("Face + Eye Detection", output)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()
    log.info(f"Session ended. Total frames processed: {frame_count}")


if __name__ == "__main__":
    main()