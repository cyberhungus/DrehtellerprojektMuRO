import cv2
import cv2.aruco as aruco
import numpy as np
import threading
from flask import Flask, render_template, Response


from flask_cors import CORS



class MarkerBuffer:
    def __init__(self, size=10):
        self.size = size
        self.buffer = []

    def add(self, detected_ids):
        if len(self.buffer) >= self.size:
            self.buffer.pop(0)
        self.buffer.append(detected_ids)

    def get_average_ids(self):
        if not self.buffer:
            return []

        id_counts = {}
        # Flatten the buffer list and count ids
        for ids in self.buffer:
            for id in ids:
                id_counts[id] = id_counts.get(id, 0) + 1

        # Only return ids seen in more than half the frames
        threshold = len(self.buffer) // 2
        stable_ids = [id for id, count in id_counts.items() if count > threshold]

        return stable_ids


# Global buffer to store the history of detected IDs
marker_buffer = MarkerBuffer(size=10)
app = Flask(__name__,
            static_folder='static',
            template_folder='templates')
CORS(app)
# Global variable to store the latest detected markers
detected_markers = []
def detect_markers(image):
    if image is None:
        raise ValueError("Image not loaded. Please check the source.")

    # Convert the image to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Define the ArUco dictionary and parameters
    aruco_dict = aruco.getPredefinedDictionary(aruco.DICT_6X6_1000)
    parameters = aruco.DetectorParameters()

    # Create the ArUco detector
    detector = aruco.ArucoDetector(aruco_dict, parameters)

    # Detect the markers
    corners, ids, _ = detector.detectMarkers(gray)
    global detected_markers
    if ids is not None:
        detected_ids = ids.flatten().tolist()
        marker_buffer.add(detected_ids)
        detected_markers = marker_buffer.get_average_ids()
        print("Detected markers:", detected_markers)
    else:
        detected_markers = []
        marker_buffer.add([])

    # Optionally draw the markers
    if ids is not None:
        aruco.drawDetectedMarkers(image, corners, ids)


def camera_thread():
    # Capture from the camera
    cap = cv2.VideoCapture(1)

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
            threading.Event().wait(0.005)  # Wait before checking for updates again

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