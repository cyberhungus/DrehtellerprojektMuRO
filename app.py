import cv2
import cv2.aruco as aruco
import numpy as np
import threading
import time
import serial
import serial.tools.list_ports
import math
import webbrowser
import subprocess
import platform
import os
import socket

from flask import Flask, render_template, Response, jsonify, request
from flask_cors import CORS


from flask import Flask
import flask.cli
import logging

app = Flask(__name__)

# 1. Suppress the "Serving Flask app..." startup banner
flask.cli.show_server_banner = lambda *args: None

# 2. Disable all Werkzeug (request) logging
logging.getLogger('werkzeug').disabled = True

# ---- Serial / encoder configuration ----
SERIAL_BAUD = 115200

MARKER_STALE_AFTER = 0.2
SERIAL_PORT_FILTER = None
HEARTBEAT_INTERVAL = 0.5

# ---- Camera configuration (kept here so the debug page can display them) ----
CAMERA_INDEX = 0
CAMERA_WIDTH = 1600
CAMERA_HEIGHT = 1200

# configure the rotation

ENCODER_PPR = 20                      # from encoder datasheet — verify counts vs pulses distinction
FRICTION_WHEEL_DIAMETER_MM = 80        # diameter of the wheel touching the rotating plane
CONTACT_RADIUS_MM = 450                # distance from plane's center to where the wheel touches its edge

DEGREES_PER_STEP = (FRICTION_WHEEL_DIAMETER_MM / (2 * CONTACT_RADIUS_MM)) * (360 / ENCODER_PPR)

# ---- Marker layout configuration ----
# Number of AprilTag markers physically mounted around the object, evenly
# spaced on a 360-degree circle. Marker IDs are expected to run 0..N-1 in
# angular order (marker 0 at 0 degrees, marker 1 at 360/N degrees, etc.).
# Live-tunable via /api/settings, same as ROTATION_MULTIPLIER.
TOTAL_MARKERS = 303

# ---- Anticipation buffer (derived from marker spacing) ----
# The encoder‑driven yaw estimate is clamped to stop this fraction of the
# gap before the next marker boundary, capped at an absolute maximum.
# Both are live‑tunable via /api/settings.
ANTICIPATION_BUFFER_FRACTION = 0.15    # fraction of degrees_per_marker
ANTICIPATION_BUFFER_MAX_DEG = 2.0      # absolute ceiling, regardless of spacing

# How many marker-widths ahead the anticipation clamp is allowed to project before
# it halts encoder-only motion. 1 = the original tight behavior (stop at the very
# next marker). Higher values let the encoder coast further on its own between
# camera confirmations — more responsive over longer unconfirmed stretches, at the
# cost of more potential drift if DEGREES_PER_STEP is off, since more distance
# accumulates before a real marker corrects it. Live-tunable via /api/settings.
ANTICIPATION_LOOKAHEAD_MARKERS = 15


# Set to -1 if the AprilTag markers are physically mounted in the opposite angular
# order from what marker_id_to_angle() assumes (marker 0 at 0°, increasing IDs
# going the same way as positive yaw) — e.g. the marker strip was glued on
# upside-down or mirrored. This also flips how the encoder's DIR field is
# interpreted, so camera-based and encoder-based tracking stay consistent with
# each other rather than fighting in opposite directions between marker reads.
ROTATION_DIRECTION = -1


def marker_id_to_angle(marker_id, total_markers):
    """Map a marker ID to its absolute position on a 360-degree circle.

    Assumes markers are evenly spaced and numbered sequentially in angular
    order starting at 0 degrees, adjusted by ROTATION_DIRECTION to match the
    physical mounting orientation. Returns None if total_markers is invalid.
    """
    if not total_markers or total_markers <= 0:
        return None

    degrees_per_marker = 360.0 / total_markers
    raw_angle = (marker_id % total_markers) * degrees_per_marker
    return (ROTATION_DIRECTION * raw_angle) % 360.0


# ---- Helper functions for the anticipation logic ----
def angular_delta(from_deg, to_deg):
    """Shortest signed distance (degrees) to rotate from from_deg to to_deg, in (-180, 180]."""
    return (to_deg - from_deg + 180.0) % 360.0 - 180.0


def next_marker_boundary(yaw, direction_sign, degrees_per_marker, lookahead_cells=1):
    """Angle (0-360) of the marker grid line `lookahead_cells` widths ahead of `yaw`
    in the direction of travel. Markers are assumed evenly spaced starting at 0
    degrees, matching marker_id_to_angle(). lookahead_cells=1 reproduces the original
    "stop at the very next marker" behavior; higher values project further ahead."""
    if not degrees_per_marker or degrees_per_marker <= 0:
        return None

    grid_pos = yaw / degrees_per_marker

    if direction_sign >= 0:
        next_index = math.floor(grid_pos + 1e-6) + lookahead_cells
    else:
        next_index = math.ceil(grid_pos - 1e-6) - lookahead_cells

    return (next_index * degrees_per_marker) % 360.0


def choose_best_marker(candidate_ids, total_markers, current_yaw, direction_sign=0, behind_penalty=1.5):
    """When more than one marker is stable in the same detection window (e.g. two
    physically adjacent markers straddling the 360°/0° seam are both visible at
    once), pick whichever candidate's angle is angularly closest to where we
    currently are. If a recent encoder direction is known, candidates behind the
    direction of travel are penalized — two markers can be nearly equidistant by raw
    angle alone, but the one we're rotating toward is the more plausible read."""
    if not candidate_ids:
        return None

    if len(candidate_ids) == 1:
        return candidate_ids[0]

    best_id = None
    best_score = None

    for marker_id in candidate_ids:
        angle = marker_id_to_angle(marker_id, total_markers)
        if angle is None:
            continue

        delta = angular_delta(current_yaw, angle)
        score = abs(delta)

        if direction_sign != 0 and delta != 0 and (delta > 0) != (direction_sign > 0):
            score *= behind_penalty  # candidate sits behind the direction of travel

        if best_score is None or score < best_score:
            best_score = score
            best_id = marker_id

    return best_id if best_id is not None else candidate_ids[0]


app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

# Marker readings correct current_yaw toward the camera's ground truth instead of
# overwriting it outright — this is what keeps continuous encoder motion from being
# interrupted by a hard jump every time a new marker becomes the closest one. Only a
# fraction of the error is corrected per detected frame (complementary filter); a
# genuinely large error (startup, a slip, a missed sequence of markers) still snaps
# immediately rather than crawling back over many frames. Both live-tunable via
# /api/settings.
MARKER_CORRECTION_ALPHA = 0.2    # fraction of camera-vs-estimate error corrected per detection
MARKER_SNAP_THRESHOLD_DEG = 45.0  # error beyond this snaps immediately instead of blending


# Marker correction is only applied on genuinely new information (a different marker
# becomes visible, or the error grows large) — not on every frame the *same* marker
# stays in view. Applying it every frame fights the encoder: it keeps tugging
# current_yaw back toward a fixed angle even though nothing new was observed, which
# reads as "the encoder barely moves the model."
last_confirmed_marker_id = None

# Encoder direction hint, used to bias marker selection (see choose_best_marker) when
# more than one marker is visible in the same frame — e.g. prefer the marker ahead in
# the direction of travel over one just left behind. Only trusted while recent (see
# DIRECTION_HINT_STALE_AFTER); a stale hint falls back to no bias.
direction_lock = threading.Lock()
last_known_direction_sign = 0
last_direction_hint_time = 0.0
DIRECTION_HINT_STALE_AFTER = 0.5  # seconds

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
    "anticipation_buffer_fraction": ANTICIPATION_BUFFER_FRACTION,
    "anticipation_buffer_max_deg": ANTICIPATION_BUFFER_MAX_DEG,
    "anticipation_buffer_deg_effective": None,
    "anticipation_lookahead_markers": ANTICIPATION_LOOKAHEAD_MARKERS,
    "tracking_mode": "camera",        # initial mode
    "marker_correction_alpha": MARKER_CORRECTION_ALPHA,
    "marker_snap_threshold_deg": MARKER_SNAP_THRESHOLD_DEG,
    "last_confirmed_marker_id": None,
    "marker_correction_applied": None,
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
    global detected_markers, current_yaw, last_marker_time, last_confirmed_marker_id

    if ids is not None:

        detected_markers = ids.flatten().tolist()
        #print("Detected markers:", detected_markers)

        with settings_lock:
            total_markers = TOTAL_MARKERS
            correction_alpha = MARKER_CORRECTION_ALPHA
            snap_threshold = MARKER_SNAP_THRESHOLD_DEG

        with yaw_lock:
            reference_yaw = current_yaw

        with direction_lock:
            direction_hint = (
                last_known_direction_sign
                if (time.time() - last_direction_hint_time) <= DIRECTION_HINT_STALE_AFTER
                else 0
            )

        marker_id = choose_best_marker(detected_markers, total_markers, reference_yaw, direction_hint)
        angle = marker_id_to_angle(marker_id, total_markers)

        if angle is not None:

            with yaw_lock:

                error = angular_delta(current_yaw, angle)
                is_new_marker = (marker_id != last_confirmed_marker_id)
                should_correct = is_new_marker or abs(error) > snap_threshold

                if should_correct:
                    if abs(error) > snap_threshold:
                        # Large desync (startup, a slip, markers missed for a while) —
                        # snap immediately rather than blending toward it.
                        current_yaw = angle
                    else:
                        # New marker confirmed, small expected error — nudge gently.
                        current_yaw = (current_yaw + correction_alpha * error) % 360.0

                    last_marker_time = time.time()
                    last_confirmed_marker_id = marker_id

                # else: same marker still in view, nothing new to report — leave
                # current_yaw untouched so the encoder can keep driving it freely.
                # last_marker_time is deliberately NOT refreshed here: once it goes
                # stale (MARKER_STALE_AFTER), the anticipation clamp in serial_thread
                # re-engages on its own, guarding against overshoot even though this
                # marker is technically still visible.

                yaw_snapshot = current_yaw

            update_debug(
                last_markers=detected_markers,
                last_marker_time=last_marker_time,
                current_yaw=yaw_snapshot,
                last_marker_id=marker_id,
                tracking_mode="camera_assisted",
                marker_correction_applied=should_correct,
            )

        else:
            # total_markers not configured (<=0) — no meaningful grid to compare
            # against, so just snap to the raw id every time, as before.
            with yaw_lock:
                current_yaw = float(marker_id)
                last_marker_time = time.time()
                last_confirmed_marker_id = marker_id

            update_debug(
                last_markers=detected_markers,
                last_marker_time=last_marker_time,
                current_yaw=current_yaw,
                last_marker_id=marker_id,
                tracking_mode="camera_assisted",
                marker_correction_applied=True,
            )

    else:
        detected_markers = []
        update_debug(last_markers=[])

    if ids is not None:
        aruco.drawDetectedMarkers(image, corners, ids)


def camera_thread():
    cap = cv2.VideoCapture(CAMERA_INDEX)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, CAMERA_WIDTH)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, CAMERA_HEIGHT)
    cap.set(cv2.CAP_PROP_AUTO_EXPOSURE, 1)

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
    global current_yaw, last_encoder_activity_time, last_known_direction_sign, last_direction_hint_time

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
                # used to suppress the screensaver, independent of the yaw math below.
                if steps != 0 or speed != 0 or direction != 0:
                    with encoder_activity_lock:
                        last_encoder_activity_time = time.time()

                with settings_lock:
                    multiplier = ROTATION_MULTIPLIER
                    total_markers = TOTAL_MARKERS
                    buffer_fraction = ANTICIPATION_BUFFER_FRACTION
                    buffer_max = ANTICIPATION_BUFFER_MAX_DEG
                    lookahead_markers = ANTICIPATION_LOOKAHEAD_MARKERS

                degrees_per_marker = (360.0 / total_markers) if total_markers > 0 else None
                anticipation_buffer = (
                    min(buffer_max, degrees_per_marker * buffer_fraction)
                    if degrees_per_marker else buffer_max
                )

                # Only the encoder's DIR reading is backward relative to physical
                # rotation (camera-confirmed positions are correct as-is) — hence the
                # extra * -1 on top of ROTATION_DIRECTION, which handles the separate
                # "markers mounted mirrored" case.
                direction_sign = (1 if direction >= 1 else -1) * ROTATION_DIRECTION * -1

                if steps != 0:
                    with direction_lock:
                        last_known_direction_sign = direction_sign
                        last_direction_hint_time = time.time()

                raw_delta = direction_sign * steps * DEGREES_PER_STEP * multiplier

                with yaw_lock:

                    markers_stale = (time.time() - last_marker_time) > MARKER_STALE_AFTER

                    # The encoder is integrated every tick regardless of camera state —
                    # this is what makes motion continuous. detect_markers() nudges
                    # current_yaw back toward ground truth on every frame it sees a
                    # marker, so drift between real detections stays small on its own.
                    proposed_yaw = (current_yaw + raw_delta) % 360.0

                    if markers_stale and degrees_per_marker:
                        # Overshoot-prevention clamp only applies while genuinely
                        # coasting without recent camera confirmation. Once markers are
                        # being seen regularly, detect_markers()'s gentle correction
                        # keeps drift bounded on its own — clamping here too would just
                        # fight that correction by periodically freezing yaw at a grid
                        # boundary instead of letting it glide through smoothly.
                        boundary = next_marker_boundary(
                            current_yaw, direction_sign, degrees_per_marker, lookahead_markers
                        )
                        limit = (boundary - direction_sign * anticipation_buffer) % 360.0

                        # How far, in the direction of travel, the raw proposal and the
                        # clamp point each are from where we sit right now — compared
                        # this way (rather than as raw angles) so it's correct across
                        # the 0°/360° wraparound and regardless of travel direction.
                        progress_to_proposed = direction_sign * angular_delta(current_yaw, proposed_yaw)
                        progress_to_limit = direction_sign * angular_delta(current_yaw, limit)

                        if progress_to_limit <= 0:
                            # Already sitting inside the buffer zone — hold here
                            # instead of creeping closer to the anticipated marker.
                            proposed_yaw = current_yaw
                        elif progress_to_proposed > progress_to_limit:
                            # This step's raw estimate would cross into (or past) the
                            # buffer zone — clamp instead of overshooting.
                            proposed_yaw = limit

                    current_yaw = proposed_yaw

                    update_debug(
                        current_yaw=current_yaw,
                        tracking_mode="encoder_anticipating" if markers_stale else "camera_assisted",
                        anticipation_buffer_deg_effective=anticipation_buffer if markers_stale else None,
                    )

        except serial.SerialException as e:
            print(f"Serial error on {port} (Check Cable Connection), rescanning in 2s...")
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
    applies both live. Also accepts:
      - "anticipation_buffer_fraction" / "anticipation_buffer_max_deg"
      - "anticipation_lookahead_markers"
      - "marker_correction_alpha" / "marker_snap_threshold_deg"
    to tune tracking behavior dynamically.
    """
    global ROTATION_MULTIPLIER, TOTAL_MARKERS, ANTICIPATION_BUFFER_FRACTION, ANTICIPATION_BUFFER_MAX_DEG
    global MARKER_CORRECTION_ALPHA, MARKER_SNAP_THRESHOLD_DEG, ANTICIPATION_LOOKAHEAD_MARKERS

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

    if "anticipation_buffer_fraction" in data:
        try:
            value = float(data["anticipation_buffer_fraction"])
        except (TypeError, ValueError):
            return jsonify({"error": "anticipation_buffer_fraction must be a number"}), 400

        if not (0 <= value < 0.5):
            return jsonify({"error": "anticipation_buffer_fraction must be between 0 and 0.5"}), 400

        with settings_lock:
            ANTICIPATION_BUFFER_FRACTION = value

        update_debug(anticipation_buffer_fraction=ANTICIPATION_BUFFER_FRACTION)

    if "anticipation_buffer_max_deg" in data:
        try:
            value = float(data["anticipation_buffer_max_deg"])
        except (TypeError, ValueError):
            return jsonify({"error": "anticipation_buffer_max_deg must be a number"}), 400

        if value < 0:
            return jsonify({"error": "anticipation_buffer_max_deg must be >= 0"}), 400

        with settings_lock:
            ANTICIPATION_BUFFER_MAX_DEG = value

        update_debug(anticipation_buffer_max_deg=ANTICIPATION_BUFFER_MAX_DEG)

    if "anticipation_lookahead_markers" in data:
        try:
            value = int(data["anticipation_lookahead_markers"])
        except (TypeError, ValueError):
            return jsonify({"error": "anticipation_lookahead_markers must be an integer"}), 400

        if value < 1:
            return jsonify({"error": "anticipation_lookahead_markers must be >= 1"}), 400

        with settings_lock:
            ANTICIPATION_LOOKAHEAD_MARKERS = value

        update_debug(anticipation_lookahead_markers=ANTICIPATION_LOOKAHEAD_MARKERS)

    if "marker_correction_alpha" in data:
        try:
            value = float(data["marker_correction_alpha"])
        except (TypeError, ValueError):
            return jsonify({"error": "marker_correction_alpha must be a number"}), 400

        if not (0 < value <= 1):
            return jsonify({"error": "marker_correction_alpha must be between 0 and 1"}), 400

        with settings_lock:
            MARKER_CORRECTION_ALPHA = value

        update_debug(marker_correction_alpha=MARKER_CORRECTION_ALPHA)

    if "marker_snap_threshold_deg" in data:
        try:
            value = float(data["marker_snap_threshold_deg"])
        except (TypeError, ValueError):
            return jsonify({"error": "marker_snap_threshold_deg must be a number"}), 400

        if value < 0:
            return jsonify({"error": "marker_snap_threshold_deg must be >= 0"}), 400

        with settings_lock:
            MARKER_SNAP_THRESHOLD_DEG = value

        update_debug(marker_snap_threshold_deg=MARKER_SNAP_THRESHOLD_DEG)

    with debug_lock:
        state_copy = dict(debug_state)

    return jsonify(state_copy)




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


# ---- Helper functions for automatic browser opening ----
def is_server_running(host='localhost', port=5000, timeout=1):
    """Check if the Flask server is accepting connections."""
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False


import tempfile
import uuid

def open_browser_kiosk(url):
    """Launch Chrome/Edge in restrictive kiosk with a fresh temporary profile."""
    if platform.system() != 'Windows':
        webbrowser.open(url)
        return

    # Create a unique temporary profile directory
    # This ensures Chrome doesn't attach to an existing session
    temp_profile = os.path.join(
        tempfile.gettempdir(),
        f"chrome_kiosk_{uuid.uuid4().hex[:8]}"
    )

    extra_flags = [
        '--kiosk',
        '--new-window',                     # force a new window
        f'--user-data-dir={temp_profile}',  # ISOLATED PROFILE – this is the key fix
        '--disable-infobars',
        '--disable-session-crashed-bubble',
        '--disable-pinch',
        '--overscroll-history-navigation=0',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-features=TranslateUI',
        '--disable-notifications',
        '--disable-save-password-bubble',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-popup-blocking',
    ]

    # All common Windows install locations
    browser_paths = [
        r'C:\Program Files\Google\Chrome\Application\chrome.exe',
        r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
        os.path.expandvars(r'%LOCALAPPDATA%\Programs\Google\Chrome\Application\chrome.exe'),
        r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
        r'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
        os.path.expandvars(r'%LOCALAPPDATA%\Programs\Microsoft\Edge\Application\msedge.exe'),
    ]

    for path in browser_paths:
        if os.path.exists(path):
            print(f"Launching kiosk with fresh profile: {path}")
            print(f"Profile: {temp_profile}")
            subprocess.Popen([path] + extra_flags + [url])
            return

    # Fallback
    print("No Chrome/Edge found. Opening default browser (no kiosk).")
    webbrowser.open(url)

def main():
    flask_thread = threading.Thread(target=run_flask, daemon=True)
    flask_thread.start()

    cam_thread = threading.Thread(target=camera_thread, daemon=True)
    cam_thread.start()

    ser_thread = threading.Thread(target=serial_thread, daemon=True)
    ser_thread.start()

    # Wait for the Flask server to be ready before opening the browser
    print("Waiting for Flask server to start...")
    for _ in range(10):  # up to 10 seconds
        if is_server_running():
            break
        time.sleep(1)
    else:
        print("Flask server not ready, opening browser anyway...")

    print("The Browser will open soon. Visit 127.0.0.1 for the interface. /debug can show you additional values for debugging.")
    # Open the browser in kiosk mode (or fallback)
    open_browser_kiosk('http://localhost:5000/')

    # Keep the main thread alive (threads are daemon, so this prevents exit)
    cam_thread.join()
    ser_thread.join()
    flask_thread.join()


if __name__ == "__main__":
    main()