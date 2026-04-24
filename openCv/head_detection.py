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
log = logging.getLogger("FaceEyeEmotionHeadDetector")

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

# ─── Head Movement Detector ───────────────────────────────────────
class HeadMovementDetector:
    """
    Detects head movement direction by comparing
    current face center to a rolling average position.
    """
    def __init__(self, threshold=20, history=10):
        self.threshold = threshold   # pixels to trigger movement
        self.history   = history     # frames to average over
        self._positions = []         # rolling center history
        self.last_move  = "CENTER"
        self.move_count = {
            "LEFT": 0, "RIGHT": 0,
            "UP": 0,   "DOWN": 0, "CENTER": 0
        }

    def update(self, faces):
        if len(faces) == 0:
            return self.last_move

        # Use the largest face
        (fx, fy, fw, fh) = max(faces, key=lambda f: f[2] * f[3])
        cx = fx + fw // 2
        cy = fy + fh // 2

        self._positions.append((cx, cy))
        if len(self._positions) > self.history:
            self._positions.pop(0)

        if len(self._positions) < 3:
            return "CENTER"

        # Average of older positions
        avg_x = sum(p[0] for p in self._positions[:-1]) / (len(self._positions) - 1)
        avg_y = sum(p[1] for p in self._positions[:-1]) / (len(self._positions) - 1)

        dx = cx - avg_x
        dy = cy - avg_y

        if abs(dx) < self.threshold and abs(dy) < self.threshold:
            movement = "CENTER"
        elif abs(dx) >= abs(dy):
            movement = "RIGHT" if dx > 0 else "LEFT"
        else:
            movement = "DOWN" if dy > 0 else "UP"

        if movement != self.last_move:
            log.info(f"Head movement → {movement}  (dx={dx:.1f}, dy={dy:.1f})")
            self.move_count[movement] += 1

        self.last_move = movement
        return movement


# ─── Stable Face Tracker ──────────────────────────────────────────
class StableFaceTracker:
    def __init__(self, confirm_frames=3, persist_frames=5):
        self.confirm_frames = confirm_frames
        self.persist_frames = persist_frames
        self._candidates    = {}
        self._frame_id      = 0

    def update(self, rects):
        self._frame_id += 1

        for (x, y, w, h) in rects:
            matched = False
            for fid, data in self._candidates.items():
                px, py, pw, ph = data["rect"]
                cx,  cy  = x + w//2,  y + h//2
                pcx, pcy = px + pw//2, py + ph//2
                if abs(cx - pcx) < pw * 0.4 and abs(cy - pcy) < ph * 0.4:
                    data["count"]    += 1
                    data["last_seen"] = self._frame_id
                    data["rect"]      = (x, y, w, h)
                    matched = True
                    break
            if not matched:
                new_id = self._frame_id * 100 + len(self._candidates)
                self._candidates[new_id] = {
                    "rect": (x, y, w, h), "count": 1,
                    "last_seen": self._frame_id
                }

        self._candidates = {
            fid: d for fid, d in self._candidates.items()
            if self._frame_id - d["last_seen"] <= self.persist_frames
        }

        return [d["rect"] for d in self._candidates.values()
                if d["count"] >= self.confirm_frames]


# ─── Head Movement Arrow Overlay ──────────────────────────────────
def draw_head_movement(frame, movement):
    h, w = frame.shape[:2]
    cx, cy = w - 80, 80   # top-right corner indicator

    arrow_map = {
        "LEFT":   ((cx + 30, cy), (cx - 30, cy)),
        "RIGHT":  ((cx - 30, cy), (cx + 30, cy)),
        "UP":     ((cx, cy + 30), (cx, cy - 30)),
        "DOWN":   ((cx, cy - 30), (cx, cy + 30)),
        "CENTER": None
    }

    color = (0, 255, 255) if movement != "CENTER" else (100, 100, 100)

    # Circle background
    cv2.circle(frame, (cx, cy), 35, (40, 40, 40), -1)
    cv2.circle(frame, (cx, cy), 35, color, 2)

    # Arrow
    arrow = arrow_map.get(movement)
    if arrow:
        cv2.arrowedLine(frame, arrow[0], arrow[1], color, 3, tipLength=0.4)
    else:
        cv2.putText(frame, "•", (cx - 7, cy + 7),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.0, color, 2)

    # Label
    cv2.putText(frame, movement, (cx - 35, cy + 52),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)


# ─── Main Detection Function ──────────────────────────────────────
def detect(frame, tracker, head_detector, frame_count, current_emotion, current_color):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    gray = cv2.equalizeHist(gray)

    raw_faces = face_cascade.detectMultiScale(
        gray, scaleFactor=1.1, minNeighbors=6,
        minSize=(60, 60), flags=cv2.CASCADE_SCALE_IMAGE
    )

    stable_faces = tracker.update(raw_faces if len(raw_faces) > 0 else [])

    # Head movement
    movement = head_detector.update(stable_faces)

    total_eyes = 0
    for (fx, fy, fw, fh) in stable_faces:

        # Face bounding box
        cv2.rectangle(frame, (fx, fy), (fx+fw, fy+fh), current_color, 2)

        # Emotion label
        cv2.putText(frame, current_emotion, (fx, fy - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.85, current_color, 2)

        # Head movement label on face
        cv2.putText(frame, f"Head: {movement}", (fx, fy + fh + 22),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 220, 255), 2)

        # Eye detection — top half ROI only
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
            f"Emotion: {current_emotion} | "
            f"Head: {movement}"
        )

    if len(stable_faces) == 0:
        log.debug(f"Frame {frame_count:05d} | No stable faces")

    # Arrow indicator
    draw_head_movement(frame, movement)

    # HUD
    cv2.putText(frame,
                f"Faces: {len(stable_faces)}  Eyes: {total_eyes}  Frame: {frame_count}",
                (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 220, 255), 2)
    cv2.putText(frame,
                f"Move: {movement}  L:{head_detector.move_count['LEFT']} "
                f"R:{head_detector.move_count['RIGHT']} "
                f"U:{head_detector.move_count['UP']} "
                f"D:{head_detector.move_count['DOWN']}",
                (10, 58), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (180, 180, 180), 1)
    cv2.putText(frame, "Press 'q' to quit",
                (10, 82), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)

    return frame, len(stable_faces)


# ─── Main ─────────────────────────────────────────────────────────
def main():
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        log.error("Cannot open webcam.")
        return

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    tracker       = StableFaceTracker(confirm_frames=3, persist_frames=5)
    head_detector = HeadMovementDetector(threshold=20, history=10)

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

        # Emotion every 10 frames
        if frame_count % 10 == 0:
            try:
                result = DeepFace.analyze(
                    frame, actions=["emotion"],
                    enforce_detection=False, silent=True
                )
                if isinstance(result, list):
                    result = result[0]

                emotion_key     = result["dominant_emotion"]
                current_emotion = emotion_key.upper()
                current_color   = EMOTION_COLORS.get(emotion_key, (255, 255, 255))
                log.info(f"Emotion → {current_emotion}")

            except Exception as e:
                log.error(f"Emotion error: {e}")

        output, _ = detect(
            frame, tracker, head_detector,
            frame_count, current_emotion, current_color
        )

        cv2.imshow("Mock Interview — Face + Eyes + Emotion + Head", output)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    # ── Session summary ──
    log.info(f"Session ended. Frames: {frame_count}")
    log.info(f"Head movement summary: {head_detector.move_count}")

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()