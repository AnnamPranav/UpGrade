import cv2

# Load face detector
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

# Load image instead of webcam
frame = cv2.imread("test_face.jpg")

if frame is None:
    print("[ERROR] Image not found!")
else:
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # Detect faces
    faces = face_cascade.detectMultiScale(
        gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30)
    )

    print(f"[SUCCESS] Faces detected: {len(faces)}")

    # Draw bounding box on each face
    for (x, y, w, h) in faces:
        cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
        cv2.putText(frame, "Face", (x, y-10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

    # Save output instead of imshow
    cv2.imwrite("output_face_detection.jpg", frame)
    print("[SUCCESS] Output saved as output_face_detection.jpg")
    print("  Open the file in VS Code to see the bounding box!")