import cv2
from deepface import DeepFace

# Load face detector
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

# Open real webcam
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("[ERROR] Cannot open camera.")
    exit()

print("[INFO] Camera opened! Press 'q' to quit.")

# Emotion color mapping
EMOTION_COLORS = {
    "happy":    (0, 255, 0),      # Green
    "neutral":  (255, 255, 0),    # Yellow
    "sad":      (255, 0, 0),      # Blue
    "fear":     (0, 0, 255),      # Red
    "angry":    (0, 0, 200),      # Dark Red
    "disgust":  (0, 140, 255),    # Orange
    "surprised":(255, 0, 255),    # Purple
}

frame_count = 0
current_emotion = "Analyzing..."
current_color = (255, 255, 255)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame_count += 1
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # Detect faces
    faces = face_cascade.detectMultiScale(
        gray, scaleFactor=1.1, minNeighbors=5, minSize=(80, 80)
    )

    # Analyze emotion every 10 frames (for smooth performance)
    if frame_count % 10 == 0 and len(faces) > 0:
        try:
            result = DeepFace.analyze(
                frame,
                actions=["emotion"],
                enforce_detection=False,
                silent=True
            )
            if isinstance(result, list):
                result = result[0]

            current_emotion = result["dominant_emotion"].upper()
            current_color = EMOTION_COLORS.get(
                result["dominant_emotion"], (255, 255, 255)
            )
            print(f"[Emotion Detected]: {current_emotion}")

        except Exception as e:
            print(f"[Error]: {e}")

    # Draw bounding box and emotion on each face
    for (x, y, w, h) in faces:
        # Colored box based on emotion
        cv2.rectangle(frame, (x, y), (x+w, y+h), current_color, 2)

        # Emotion label above box
        cv2.putText(frame, current_emotion, (x, y - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.9, current_color, 2)

    # Show face count
    cv2.putText(frame, f"Faces: {len(faces)}", (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 0), 2)

    # Show instructions
    cv2.putText(frame, "Press 'q' to quit", (10, 60),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 1)

    cv2.imshow("Mock Interview - Emotion Detection", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
print("[INFO] Session ended.")