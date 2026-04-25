import cv2
import logging
import time
from deepface import DeepFace

# ─── Logging Setup ────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("detection_log.txt")
    ]
)
log = logging.getLogger("FaceEyeEmotionDetector")

# ─── Load Cascades ────────────────────────────────────────────────
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
eye_cascade  = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_eye.xml")

if face_cascade.empty() or eye_cascade.empty():
    log.error("Failed to load cascade classifiers.")
    raise IOError("Cascade files not found.")

# ─── Emotion Color Mapping ────────────────────────────────────────
EMOTION_COLORS = {
    "happy":    (0, 255, 0),
    "neutral":  (255, 255, 0),
    "sad":      (255, 0, 0),
    "fear":     (0, 0, 255),
    "angry":    (0, 0, 200),
    "disgust":  (0, 140, 255),
    "surprise": (255, 0, 255),
}

# ─── Stable Face Tracker ──────────────────────────────────────────
class StableFaceTracker:
    def __init__(self, confirm_frames=3, persist_frames=5):
        self.confirm_frames = confirm_frames
        self.persist_frames = persist_frames
        self._candidates = {}
        self._frame_id = 0

    def update(self, rects):
        self._frame_id += 1

        for (x, y, w, h) in rects:
            matched = False
            for fid, data in self._candidates.items():
                px, py, pw, ph = data["rect"]
                cx,  cy  = x + w//2,  y + h//2
                pcx, pcy = px + pw//2, py + ph//2
                if abs(cx - pcx) < pw * 0.4 and abs(cy - pcy) < ph * 0.4:
                    data["count"]     += 1
                    data["last_seen"]  = self._frame_id
                    data["rect"]       = (x, y, w, h)
                    matched = True
                    break
            if not matched:
                new_id = self._frame_id * 100 + len(self._candidates)
                self._candidates[new_id] = {
                    "rect": (x, y, w, h), "count": 1,
                    "last_seen": self._frame_id
                }

        # Prune stale
        self._candidates = {
            fid: d for fid, d in self._candidates.items()
            if self._frame_id - d["last_seen"] <= self.persist_frames
        }

        return [d["rect"] for d in self._candidates.values()
                if d["count"] >= self.confirm_frames]


# ─── Detection + Draw ─────────────────────────────────────────────
def detect(frame, tracker, frame_count, current_emotion, current_color):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    gray = cv2.equalizeHist(gray)

    raw_faces = face_cascade.detectMultiScale(
        gray, scaleFactor=1.1, minNeighbors=6,
        minSize=(60, 60), flags=cv2.CASCADE_SCALE_IMAGE
    )

    stable_faces = tracker.update(raw_faces if len(raw_faces) > 0 else [])

    total_eyes = 0
    for (fx, fy, fw, fh) in stable_faces:

        # ── Face bounding box (emotion color) ──
        cv2.rectangle(frame, (fx, fy), (fx+fw, fy+fh), current_color, 2)

        # ── Emotion label above face box ──
        cv2.putText(frame, current_emotion, (fx, fy - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.9, current_color, 2)

        # ── Eye detection in top-half ROI ──
        roi_gray  = gray[fy:fy+fh//2, fx:fx+fw]
        roi_color = frame[fy:fy+fh//2, fx:fx+fw]

        eyes = eye_cascade.detectMultiScale(
            roi_gray, scaleFactor=1.1,
            minNeighbors=10, minSize=(20, 20)
        )
        total_eyes += len(eyes)

        for (ex, ey, ew, eh) in eyes:
            cv2.rectangle(roi_color, (ex, ey), (ex+ew, ey+eh), (255, 255, 255), 2)
            cv2.putText(roi_color, "Eye", (ex, ey - 4),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1)

        log.info(
            f"Frame {frame_count:05d} | "
            f"Face@({fx},{fy}) size={fw}x{fh} | "
            f"Eyes: {len(eyes)} | "
            f"Emotion: {current_emotion}"
        )

    if len(stable_faces) == 0:
        log.debug(f"Frame {frame_count:05d} | No stable faces detected")

    # ── HUD ──
    cv2.putText(frame,
                f"Faces: {len(stable_faces)}  Eyes: {total_eyes}  Frame: {frame_count}",
                (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 220, 255), 2)
    cv2.putText(frame, "Press 'q' to quit",
                (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (200, 200, 200), 1)

    return frame, len(stable_faces)


# ─── Main ─────────────────────────────────────────────────────────
def main():
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        log.error("Cannot open webcam.")
        return

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    tracker         = StableFaceTracker(confirm_frames=3, persist_frames=5)
    frame_count     = 0
    current_emotion = "Analyzing..."
    current_color   = (255, 255, 255)

    log.info("System started. Press 'q' to quit.")

    while True:
        ret, frame = cap.read()
        if not ret:
            log.warning("Frame grab failed, retrying...")
            time.sleep(0.05)
            continue

        frame_count += 1

        # ── Emotion analysis every 10 frames ──
        if frame_count % 10 == 0:
            try:
                result = DeepFace.analyze(
                    frame,
                    actions=["emotion"],
                    enforce_detection=False,
                    silent=True
                )
                if isinstance(result, list):
                    result = result[0]

                emotion_key     = result["dominant_emotion"]
                current_emotion = emotion_key.upper()
                current_color   = EMOTION_COLORS.get(emotion_key, (255, 255, 255))
                log.info(f"Emotion updated → {current_emotion}")

            except Exception as e:
                log.error(f"Emotion analysis error: {e}")

        # ── Detect + Draw ──
        output, face_count = detect(
            frame, tracker, frame_count,
            current_emotion, current_color
        )

        cv2.imshow("Mock Interview — Face + Eyes + Emotion", output)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()
    log.info(f"Session ended. Total frames processed: {frame_count}")


if __name__ == "__main__":
    main()