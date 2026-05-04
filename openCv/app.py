"""
app.py — Backend Flask endpoint for Interview Proctoring System
===============================================================
Your teammate integrates this into their existing Flask backend.

Install: pip install flask opencv-python numpy
Run:     python app.py

Frontend sends a frame (as JPEG) to POST /analyze
Backend returns JSON with gaze status.
"""

from flask import Flask, request, jsonify
import numpy as np
import cv2
from proctor_vision import ProctoringVision

app = Flask(__name__)

# One shared vision instance (persists state across frames)
vision = ProctoringVision(draw=False, log_to_file=True)


@app.route("/analyze", methods=["POST"])
def analyze():
    """
    Accepts a JPEG frame from the frontend.
    Returns gaze status as JSON.

    Frontend usage (JavaScript):
        const blob = await captureFrameAsBlob();   // from <video> element
        const form = new FormData();
        form.append("frame", blob, "frame.jpg");
        const res  = await fetch("/analyze", { method: "POST", body: form });
        const data = await res.json();
        console.log(data.gaze);  // "looking_center" | "looking_left" | ...
    """
    if "frame" not in request.files:
        return jsonify({"error": "No frame provided"}), 400

    file  = request.files["frame"]
    npimg = np.frombuffer(file.read(), np.uint8)
    frame = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

    if frame is None:
        return jsonify({"error": "Invalid image"}), 400

    status = vision.analyze_frame(frame)
    return jsonify(status)


@app.route("/reset", methods=["POST"])
def reset():
    """Call this between interview sessions to reset gaze history."""
    vision.reset()
    return jsonify({"message": "Vision state reset."})


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
