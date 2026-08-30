import cv2
import cv2.aruco as aruco
import numpy as np
import threading
import time
import serial
import serial.tools.list_ports

from flask import Flask, render_template, Response, jsonify, request
from flask_cors import CORS


# ---- Serial / encoder configuration ----
SERIAL_BAUD = 115200


MARKER_STALE_AFTER = 0.2
SERIAL_PORT_FILTER = None
HEARTBEAT_INTERVAL = 0.5

# ---- Camera configuration (kept here so the debug page can display them) ----
CAMERA_INDEX = 0
CAMERA_WIDTH = 1600
CAMERA_HEIGHT = 1200
CAMERA_EXPOSURE = -9
CAMERA_GAIN = 100



ENCODER_PPR = 600                      # from encoder datasheet — verify counts vs pulses distinction
FRICTION_WHEEL_DIAMETER_MM = 20        # diameter of the wheel touching the rotating plane
CONTACT_RADIUS_MM = 150                # distance from plane's center to where the wheel touches its edge

DEGREES_PER_STEP = (FRICTION_WHEEL_DIAMETER_MM / (2 * CONTACT_RADIUS_MM)) * (360 / ENCODER_PPR)

# ---- Marker layout configuration ----
# Number of AprilTag markers physically mounted around the object, evenly
# spaced on a 360-degree circle. Marker IDs are expected to run 0..N-1 in
# angular order (marker 0 at 0 degrees, marker 1 at 360/N degrees, etc.).
# Live-tunable via /api/settings, same as ROTATION_MULTIPLIER.
TOTAL_MARKERS = 360


def marker_id_to_angle(marker_id, total_markers):
    """Map a marker ID to its absolute position on a 360-degree circle.

    Assumes markers are evenly spaced and numbered sequentially in angular
    order starting at 0 degrees. Returns None if total_markers is invalid.
    """
    if not total_markers or total_markers <= 0:
        return None

    degrees_per_marker = 360.0 / total_markers
    return (marker_id % total_markers) * degrees_per_marker


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
        for ids in self.buffer:
            for id in ids:
                id_counts[id] = id_counts.get(id, 0) + 1

        threshold = len(self.buffer) // 2
        stable_ids = [id for id, count in id_counts.items() if count > threshold]

        return stable_ids


marker_buffer = MarkerBuffer(size=10)
app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

detected_markers = []

yaw_lock = threading.Lock()
current_yaw = 0.0
last_marker_time = 0.0

# ---- Live-tunable interaction parameters ----
settings_lock = threading.Lock()
ROTATION_MULTIPLIER = 1.0   # multiplies encoder-driven yaw deltas; 1.0 = normal, >1 = exaggerated, <1 = damped

# ---- Shared debug/telemetry state, surfaced on /debug ----
debug_lock = threading.Lock()
debug_state = {
    "camera_active": False,
    "camera_index": CAMERA_INDEX,
    "camera_resolution": None,       # set once known from cap.get(...)
    "camera_exposure_requested": CAMERA_EXPOSURE,
    "camera_gain_requested": CAMERA_GAIN,
    "camera_exposure_actual": None,
    "camera_gain_actual": None,
    "last_markers": [],
    "last_marker_time": None,
    "serial_connected": False,
    "serial_port": None,
    "last_serial_line": None,
    "last_serial_time": None,
    "current_yaw": 0.0,
    "rotation_multiplier": ROTATION_MULTIPLIER,
    "total_markers": TOTAL_MARKERS,
    "degrees_per_marker": 360.0 / TOTAL_MARKERS if TOTAL_MARKERS else None,
    "last_marker_id": None,
}



encoder_activity_lock = threading.Lock()
last_encoder_activity_time = 0.0


def update_debug(**kwargs):
    with debug_lock:
        debug_state.update(kwargs)


def detect_markers(image):
    if image is None:
        raise ValueError("Image not loaded. Please check the source.")

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    aruco_dict = aruco.getPredefinedDictionary(aruco.DICT_APRILTAG_36h11)
    parameters = aruco.DetectorParameters()

    parameters.adaptiveThreshWinSizeMin = 3
    parameters.adaptiveThreshWinSizeMax = 35
    parameters.adaptiveThreshWinSizeStep = 4
    parameters.adaptiveThreshConstant = 7

    parameters.polygonalApproxAccuracyRate = 0.05

    parameters.minMarkerPerimeterRate = 0.02
    parameters.maxMarkerPerimeterRate = 4.0

    parameters.cornerRefinementMethod = aruco.CORNER_REFINE_SUBPIX
    parameters.cornerRefinementWinSize = 5
    parameters.cornerRefinementMaxIterations = 50
    parameters.cornerRefinementMinAccuracy = 0.05

    parameters.maxErroneousBitsInBorderRate = 0.5
    parameters.errorCorrectionRate = 0.8

    detector = aruco.ArucoDetector(aruco_dict, parameters)

    corners, ids, _ = detector.detectMarkers(gray)
    global detected_markers, current_yaw, last_marker_time

    if ids is not None:
        detected_ids = ids.flatten().tolist()
        marker_buffer.add(detected_ids)
        detected_markers = marker_buffer.get_average_ids()
        print("Detected markers:", detected_markers)

        if detected_markers:
            with settings_lock:
                total_markers = TOTAL_MARKERS

            marker_id = detected_markers[0]
            angle = marker_id_to_angle(marker_id, total_markers)

            if angle is not None:
                with yaw_lock:
                    current_yaw = angle
                    last_marker_time = time.time()

                update_debug(
                    last_markers=detected_markers,
                    last_marker_time=last_marker_time,
                    current_yaw=current_yaw,
                    last_marker_id=marker_id,
                )
            else:
                # total_markers not configured (<=0) — fall back to raw id
                # so the system still produces *some* signal.
                with yaw_lock:
                    current_yaw = float(marker_id)
                    last_marker_time = time.time()

                update_debug(
                    last_markers=detected_markers,
                    last_marker_time=last_marker_time,
                    current_yaw=current_yaw,
                    last_marker_id=marker_id,
                )

    else:
        detected_markers = []
        marker_buffer.add([])
        update_debug(last_markers=[])

    if ids is not None:
        aruco.drawDetectedMarkers(image, corners, ids)


def camera_thread():
    cap = cv2.VideoCapture(CAMERA_INDEX)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, CAMERA_WIDTH)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, CAMERA_HEIGHT)
    cap.set(cv2.CAP_PROP_AUTO_EXPOSURE, 1)
    cap.set(cv2.CAP_PROP_EXPOSURE, CAMERA_EXPOSURE)
    cap.set(cv2.CAP_PROP_GAIN, CAMERA_GAIN)

    if not cap.isOpened():
        print("Error: Could not open camera.")
        update_debug(camera_active=False)
        return

    resolution = (int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)))
    update_debug(
        camera_active=True,
        camera_resolution=resolution,
        camera_exposure_actual=cap.get(cv2.CAP_PROP_EXPOSURE),
        camera_gain_actual=cap.get(cv2.CAP_PROP_GAIN),
    )

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Error: Could not read frame.")
            update_debug(camera_active=False)
            break

        detect_markers(frame)

    cap.release()
    update_debug(camera_active=False)


def find_serial_port():
    ports = list(serial.tools.list_ports.comports())

    if not ports:
        return None

    if SERIAL_PORT_FILTER:
        filtered = [p for p in ports if SERIAL_PORT_FILTER.lower() in (p.description or '').lower()]
        if filtered:
            return filtered[0].device
        return None

    return ports[0].device


def parse_encoder_line(line):
    try:
        parts = dict(
            item.split(':') for item in line.strip().split(',') if ':' in item
        )
        steps = int(parts['STEPS'])
        speed = float(parts['SPEED'])
        direction = int(parts['DIR'])
        return steps, speed, direction
    except (ValueError, KeyError):
        return None


def serial_thread():
    global current_yaw

    while True:
        port = find_serial_port()

        if port is None:
            update_debug(serial_connected=False, serial_port=None)
            print("No serial ports found, retrying in 2s...")
            time.sleep(2)
            continue

        try:
            ser = serial.Serial(port, SERIAL_BAUD, timeout=1)
            print(f"Serial connected on {port} @ {SERIAL_BAUD} baud")
            update_debug(serial_connected=True, serial_port=port)

            last_heartbeat_sent = 0

            while True:
                now = time.time()
                if now - last_heartbeat_sent >= HEARTBEAT_INTERVAL:
                    ser.write(b"PING\n")
                    last_heartbeat_sent = now

                raw_line = ser.readline().decode('utf-8', errors='ignore')
                if not raw_line:
                    continue

                update_debug(last_serial_line=raw_line.strip(), last_serial_time=time.time())

                parsed = parse_encoder_line(raw_line)
                if parsed is None:
                    continue

                steps, speed, direction = parsed

                # Any non-(0,0,0) reading counts as the object being touched/spun —
                # used to suppress the screensaver, independent of yaw math below.
                if steps != 0 or speed != 0 or direction != 0:
                    with encoder_activity_lock:
                        last_encoder_activity_time = time.time()

                with settings_lock:
                    multiplier = ROTATION_MULTIPLIER

                with yaw_lock:
                    markers_stale = (time.time() - last_marker_time) > MARKER_STALE_AFTER

                    if markers_stale:
                        sign = 1 if direction >= 1 else -1
                        current_yaw = (current_yaw + sign * steps * DEGREES_PER_STEP * multiplier) % 360

                update_debug(current_yaw=current_yaw)

        except serial.SerialException as e:
            print(f"Serial error on {port} ({e}), rescanning in 2s...")
            update_debug(serial_connected=False)
            time.sleep(2)
        except Exception as e:
            print(f"Unexpected serial thread error: {e}")
            update_debug(serial_connected=False)
            time.sleep(2)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/debug')
def debug_page():
    return render_template('debug.html')


@app.route('/api/state')
def api_state():
    with debug_lock:
        state_copy = dict(debug_state)
    return jsonify(state_copy)


@app.route('/api/settings', methods=['POST'])
def api_settings():
    """
    Accepts JSON like {"rotation_multiplier": 2.5, "total_markers": 6} and
    applies both live. total_markers is how many AprilTag markers are
    mounted around the object (evenly spaced on a 360-degree circle,
    numbered sequentially in angular order starting at ID 0).
    Extend this if you want to push other tunables (exposure/gain would
    need the camera thread to expose its `cap` object — see note below).
    """
    global ROTATION_MULTIPLIER, TOTAL_MARKERS

    data = request.get_json(silent=True) or {}

    if "rotation_multiplier" in data:
        try:
            value = float(data["rotation_multiplier"])
        except (TypeError, ValueError):
            return jsonify({"error": "rotation_multiplier must be a number"}), 400

        with settings_lock:
            ROTATION_MULTIPLIER = value

        update_debug(rotation_multiplier=ROTATION_MULTIPLIER)

    if "total_markers" in data:
        try:
            value = int(data["total_markers"])
        except (TypeError, ValueError):
            return jsonify({"error": "total_markers must be an integer"}), 400

        if value <= 0:
            return jsonify({"error": "total_markers must be greater than 0"}), 400

        with settings_lock:
            TOTAL_MARKERS = value

        update_debug(
            total_markers=TOTAL_MARKERS,
            degrees_per_marker=360.0 / TOTAL_MARKERS,
        )

    with debug_lock:
        state_copy = dict(debug_state)

    return jsonify(state_copy)



@app.route('/photobooth')
def photobooth():
    return render_template('photobooth.html')

@app.route('/stream')
def stream():
    def event_stream():
        last_sent = None
        last_encoder_sent_time = 0.0

        while True:
            with yaw_lock:
                yaw_to_send = current_yaw

            if yaw_to_send != last_sent:
                yield f"data: [{yaw_to_send:.2f}]\n\n"
                last_sent = yaw_to_send

            with encoder_activity_lock:
                activity_time = last_encoder_activity_time

            if activity_time > last_encoder_sent_time:
                last_encoder_sent_time = activity_time
                yield "event: encoder\ndata: active\n\n"

            threading.Event().wait(0.02)

    return Response(event_stream(), mimetype="text/event-stream")

def run_flask():
    app.run(port=5000, debug=False, use_reloader=False)


def main():
    flask_thread = threading.Thread(target=run_flask, daemon=True)
    flask_thread.start()

    cam_thread = threading.Thread(target=camera_thread, daemon=True)
    cam_thread.start()

    ser_thread = threading.Thread(target=serial_thread, daemon=True)
    ser_thread.start()

    cam_thread.join()
    ser_thread.join()
    flask_thread.join()


if __name__ == "__main__":
    main()