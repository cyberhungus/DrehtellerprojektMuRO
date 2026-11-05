import threading
import time
import json
import math
import os
import socket
import platform
import subprocess
import webbrowser
import argparse
import logging

import serial
import serial.tools.list_ports

import flask.cli
from flask import Flask, render_template, Response, jsonify, request, abort
from flask_cors import CORS

ALLOWED_IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}

# ---- Command-line arguments ----
_arg_parser = argparse.ArgumentParser(description='DO C-CSOV Kiosk Application')
_arg_parser.add_argument(
    '--final',
    action='store_true',
    help='Final/kiosk mode: all models enabled, mouse zoom off, keyboard movement off'
)
_args = _arg_parser.parse_args()
FINAL_MODE = _args.final
print(f"FINAL_MODE = {FINAL_MODE}")

# Suppress Flask banner and Werkzeug request logging
flask.cli.show_server_banner = lambda *args: None
logging.getLogger('werkzeug').disabled = True

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

# ---- Serial configuration ----
SERIAL_BAUD = 115200
SERIAL_PORT_FILTER = None      # e.g. "arduino" / "usb serial" to pick a specific port by description
SENSOR_STALE_AFTER = 1.0       # seconds without a valid reading before the sensor counts as lost

# ---- Angle configuration ----
# Final angle = (ROTATION_DIRECTION * raw_angle * ROTATION_MULTIPLIER + ANGLE_OFFSET) % 360
#
# ROTATION_DIRECTION: set to -1 if the sensor counts in the opposite direction
#                     from what the 3D model expects.
# ANGLE_OFFSET:       degrees added after direction/multiplier so that the physical
#                     "front" of the object reads as 0°. Live-tunable via /api/settings,
#                     or use {"calibrate_zero": true} to set it from the current position.
# ANGLE_FILTER_ALPHA: 1.0 = no smoothing; lower (e.g. 0.3) = smoother but laggier.
# ACTIVITY_THRESHOLD_DEG: angle change that counts as "someone touched/spun the object"
#                         (suppresses the screensaver on the frontend).
ROTATION_DIRECTION = 1
ANGLE_OFFSET = 0.0
ROTATION_MULTIPLIER = 1.0
ANGLE_FILTER_ALPHA = 1.0
ACTIVITY_THRESHOLD_DEG = 0.2


def angular_delta(from_deg, to_deg):
    """Shortest signed distance (degrees) from from_deg to to_deg, in (-180, 180]."""
    return (to_deg - from_deg + 180.0) % 360.0 - 180.0


# ---- Shared state ----
settings_lock = threading.Lock()

yaw_lock = threading.Lock()
current_yaw = 0.0
raw_angle_latest = None   # last raw sensor angle (before direction/offset), used for calibration

encoder_activity_lock = threading.Lock()
last_encoder_activity_time = 0.0

debug_lock = threading.Lock()
debug_state = {
    "serial_connected": False,
    "serial_port": None,
    "last_serial_line": None,
    "last_serial_time": None,
    "sensor_ok": False,
    "raw_angle": None,
    "magnitude": None,
    "current_yaw": 0.0,
    "angle_offset": ANGLE_OFFSET,
    "rotation_direction": ROTATION_DIRECTION,
    "rotation_multiplier": ROTATION_MULTIPLIER,
    "angle_filter_alpha": ANGLE_FILTER_ALPHA,
    "tracking_mode": "as5047p",
}


def update_debug(**kwargs):
    with debug_lock:
        debug_state.update(kwargs)


# ---- Serial handling ----
def find_serial_port():
    ports = list(serial.tools.list_ports.comports())
    if not ports:
        return None

    if SERIAL_PORT_FILTER:
        filtered = [p for p in ports if SERIAL_PORT_FILTER.lower() in (p.description or '').lower()]
        return filtered[0].device if filtered else None

    return ports[0].device


def parse_sensor_line(line):
    """Parse a line like {"angle":123.456,"mag":2048}. Returns (angle, magnitude) or None."""
    line = line.strip()
    if not line.startswith('{'):
        return None  # boot messages, noise, etc.
    try:
        data = json.loads(line)
        angle = float(data['angle'])
        magnitude = data.get('mag')
        magnitude = int(magnitude) if magnitude is not None else None
    except (ValueError, KeyError, TypeError):
        return None

    if not math.isfinite(angle):
        return None
    return angle % 360.0, magnitude


def apply_angle(raw_angle):
    """Convert a raw sensor angle into the final yaw (direction, multiplier, offset, filter)."""
    global current_yaw, raw_angle_latest, last_encoder_activity_time

    with settings_lock:
        direction = ROTATION_DIRECTION
        multiplier = ROTATION_MULTIPLIER
        offset = ANGLE_OFFSET
        alpha = ANGLE_FILTER_ALPHA

    target = (direction * raw_angle * multiplier + offset) % 360.0

    with yaw_lock:
        raw_angle_latest = raw_angle
        previous = current_yaw

        if alpha >= 1.0:
            new_yaw = target
        else:
            # Circular exponential smoothing (handles the 359° -> 0° wrap correctly)
            new_yaw = (previous + alpha * angular_delta(previous, target)) % 360.0

        current_yaw = new_yaw

    if abs(angular_delta(previous, new_yaw)) >= ACTIVITY_THRESHOLD_DEG:
        with encoder_activity_lock:
            last_encoder_activity_time = time.time()

    return new_yaw


def serial_thread():
    while True:
        port = find_serial_port()

        if port is None:
            update_debug(serial_connected=False, serial_port=None, sensor_ok=False)
            print("No serial ports found, retrying in 2s...")
            time.sleep(2)
            continue

        try:
            ser = serial.Serial(port, SERIAL_BAUD, timeout=1)
            print(f"Serial connected on {port} @ {SERIAL_BAUD} baud")
            update_debug(serial_connected=True, serial_port=port)

            last_valid = 0.0

            while True:
                raw_line = ser.readline().decode('utf-8', errors='ignore')

                now = time.time()
                if not raw_line:
                    if now - last_valid > SENSOR_STALE_AFTER:
                        update_debug(sensor_ok=False)
                    continue

                update_debug(last_serial_line=raw_line.strip(), last_serial_time=now)

                parsed = parse_sensor_line(raw_line)
                if parsed is None:
                    continue

                raw_angle, magnitude = parsed
                last_valid = now

                yaw = apply_angle(raw_angle)
                update_debug(
                    sensor_ok=True,
                    raw_angle=raw_angle,
                    magnitude=magnitude,
                    current_yaw=yaw,
                )

        except serial.SerialException:
            print(f"Serial error on {port} (check cable connection), rescanning in 2s...")
            update_debug(serial_connected=False, sensor_ok=False)
            time.sleep(2)
        except Exception as e:
            print(f"Unexpected serial thread error: {e}")
            update_debug(serial_connected=False, sensor_ok=False)
            time.sleep(2)


# ---- Routes ----
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
    Accepts JSON, any combination of:
      - "angle_offset": number (degrees)
      - "calibrate_zero": true  -> sets angle_offset so the current position reads 0°
      - "rotation_direction": 1 or -1
      - "rotation_multiplier": number
      - "angle_filter_alpha": number in (0, 1]
    """
    global ROTATION_DIRECTION, ANGLE_OFFSET, ROTATION_MULTIPLIER, ANGLE_FILTER_ALPHA

    data = request.get_json(silent=True) or {}

    if "rotation_direction" in data:
        try:
            value = int(data["rotation_direction"])
        except (TypeError, ValueError):
            return jsonify({"error": "rotation_direction must be 1 or -1"}), 400
        if value not in (1, -1):
            return jsonify({"error": "rotation_direction must be 1 or -1"}), 400
        with settings_lock:
            ROTATION_DIRECTION = value
        update_debug(rotation_direction=value)

    if "rotation_multiplier" in data:
        try:
            value = float(data["rotation_multiplier"])
        except (TypeError, ValueError):
            return jsonify({"error": "rotation_multiplier must be a number"}), 400
        with settings_lock:
            ROTATION_MULTIPLIER = value
        update_debug(rotation_multiplier=value)

    if "angle_filter_alpha" in data:
        try:
            value = float(data["angle_filter_alpha"])
        except (TypeError, ValueError):
            return jsonify({"error": "angle_filter_alpha must be a number"}), 400
        if not (0 < value <= 1):
            return jsonify({"error": "angle_filter_alpha must be between 0 and 1"}), 400
        with settings_lock:
            ANGLE_FILTER_ALPHA = value
        update_debug(angle_filter_alpha=value)

    if "angle_offset" in data:
        try:
            value = float(data["angle_offset"]) % 360.0
        except (TypeError, ValueError):
            return jsonify({"error": "angle_offset must be a number"}), 400
        with settings_lock:
            ANGLE_OFFSET = value
        update_debug(angle_offset=value)

    if data.get("calibrate_zero"):
        with yaw_lock:
            raw = raw_angle_latest
        if raw is None:
            return jsonify({"error": "no sensor reading available yet"}), 409
        with settings_lock:
            # Choose the offset so that the current raw reading maps to exactly 0°.
            ANGLE_OFFSET = (-ROTATION_DIRECTION * raw * ROTATION_MULTIPLIER) % 360.0
            new_offset = ANGLE_OFFSET
        update_debug(angle_offset=new_offset)

    with debug_lock:
        state_copy = dict(debug_state)

    return jsonify(state_copy)


@app.route('/api/list-models')
def list_models():
    models_dir = os.path.join(app.root_path, 'static', 'models')

    if not os.path.isdir(models_dir):
        return jsonify([])

    folders = sorted(
        name for name in os.listdir(models_dir)
        if os.path.isdir(os.path.join(models_dir, name))
    )
    return jsonify(folders)


@app.route('/api/list-images')
def list_images():
    rel_dir = request.args.get('dir', '')

    # Security: make sure the resolved path is still inside the static folder
    # (blocks path traversal like "../../etc").
    base_dir = os.path.abspath(os.path.join(app.root_path, 'static'))
    target_dir = os.path.abspath(os.path.join(app.root_path, rel_dir))

    if not target_dir.startswith(base_dir) or not os.path.isdir(target_dir):
        abort(404)

    files = sorted(
        f for f in os.listdir(target_dir)
        if os.path.splitext(f)[1].lower() in ALLOWED_IMAGE_EXTENSIONS
    )

    return jsonify([f'{rel_dir.rstrip("/")}/{f}' for f in files])


@app.route('/api/final')
def api_final():
    return jsonify({"final": FINAL_MODE})


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


# ---- Helpers for automatic browser opening ----
def is_server_running(host='localhost', port=5000, timeout=1):
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False


def open_browser_kiosk(url):
    """Launch Chrome/Edge in kiosk mode with a persistent profile."""
    if platform.system() != 'Windows':
        webbrowser.open(url)
        return

    profile_dir = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        'chrome-kiosk-profile'
    )
    os.makedirs(profile_dir, exist_ok=True)

    extra_flags = [
        '--kiosk',
        '--new-window',
        f'--user-data-dir={profile_dir}',
        '--disable-infobars',
        '--disable-session-crashed-bubble',
        '--disable-pinch',
        '--overscroll-history-navigation=0',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-notifications',
        '--disable-save-password-bubble',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-popup-blocking',
        '--hide-crash-restore-bubble',
    ]

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
            print(f"Launching kiosk with persistent profile: {path}")
            print(f"Profile: {profile_dir}")
            subprocess.Popen([path] + extra_flags + [url])
            return

    print("No Chrome/Edge found. Opening default browser (no kiosk).")
    webbrowser.open(url)


def main():
    flask_thread = threading.Thread(target=run_flask, daemon=True)
    flask_thread.start()

    ser_thread = threading.Thread(target=serial_thread, daemon=True)
    ser_thread.start()

    print("Waiting for Flask server to start...")
    for _ in range(10):
        if is_server_running():
            break
        time.sleep(1)
    else:
        print("Flask server not ready, opening browser anyway...")

    print("The Browser will open soon. Visit 127.0.0.1:5000 for the interface. /debug shows additional values.")
    if FINAL_MODE:
        open_browser_kiosk('http://localhost:5000/')

    # Keep the main thread alive (threads are daemon)
    ser_thread.join()
    flask_thread.join()


if __name__ == "__main__":
    main()