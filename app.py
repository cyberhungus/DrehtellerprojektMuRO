import cv2
import cv2.aruco as aruco
import numpy as np
import threading
from flask import Flask, render_template, Response

app = Flask(__name__)

# Global variable to store the latest detected markers
detected_markers = []


def detect_markers(image):
    if image is None:
        raise ValueError("Image not loaded. Please check the source.")

    # Convert the image to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Define the ArUco dictionary and parameters
    aruco_dict = aruco.getPredefinedDictionary(aruco.DICT_6X6_250)
    parameters = aruco.DetectorParameters()

    # Create the ArUco detector
    detector = aruco.ArucoDetector(aruco_dict, parameters)

    # Detect the markers
    corners, ids, _ = detector.detectMarkers(gray)
    global detected_markers
    if ids is not None:
        detected_markers = ids.flatten().tolist()
        print("Detected markers:", detected_markers)
    else:
        detected_markers = []


    # Optionally draw the markers
    if ids is not None:
        aruco.drawDetectedMarkers(image, corners, ids)


def camera_thread():
    # Capture from the camera
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("Error: Could not open camera.")
        return

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Error: Could not read frame.")
            break

        detect_markers(frame)

    cap.release()


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/stream')
def stream():
    def event_stream():
        while True:
            if detected_markers:
                yield f"data: {detected_markers}\n\n"
            threading.Event().wait(0.05)  # Wait before checking for updates again

    return Response(event_stream(), mimetype="text/event-stream")


def run_flask():
    # Start the Flask application
    app.run(port=5000, debug=False, use_reloader=False)


def main():
    # Create and start the Flask server thread
    flask_thread = threading.Thread(target=run_flask)
    flask_thread.start()

    # Create and start the camera thread
    cam_thread = threading.Thread(target=camera_thread)
    cam_thread.start()

    # Join threads to wait for them to finish
    cam_thread.join()
    flask_thread.join()


if __name__ == "__main__":
    main()