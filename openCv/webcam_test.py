import cv2

# Load a sample image instead of webcam
frame = cv2.imread("test_face.jpg")

if frame is None:
    print("[ERROR] Image not found. Make sure test_face.jpg is in the same folder.")
else:
    print("[SUCCESS] Image loaded!")
    print(f"  Image size: {frame.shape[1]}x{frame.shape[0]} pixels")

    # Save it to confirm OpenCV is working
    cv2.imwrite("output_webcam_test.jpg", frame)
    print("[SUCCESS] Output saved as output_webcam_test.jpg")