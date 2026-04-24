import cv2

# Load the pre-trained face detector
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

# Open your real webcam (0 = default camera)
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("[ERROR] Cannot open camera. Check if your webcam is connected.")
    exit()

print("[INFO] Camera opened successfully! Press 'q' to quit.")

while True:
    # Read frame from camera
    ret, frame = cap.read()

    if not ret:
        print("[ERROR] Failed to read from camera.")
        break

    # Convert to grayscale for detection
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # Detect faces
    faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(80, 80)
    )

    # Draw bounding box on each detected face
    for (x, y, w, h) in faces:
        # Green rectangle around face
        cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)

        # "Face" label above the box
        cv2.putText(frame, "Face Detected", (x, y - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

    # Show face count on screen
    cv2.putText(frame, f"Faces: {len(faces)}", (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 0), 2)

    # Show the live frame
    cv2.imshow("Mock Interview - Face Detection", frame)

    # Press 'q' to quit
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Release camera and close window
cap.release()
cv2.destroyAllWindows()
print("[INFO] Camera closed.")