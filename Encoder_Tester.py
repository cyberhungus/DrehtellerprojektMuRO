#!/usr/bin/env python3
"""
Encoder Calibration Test Tool

Tune these three parameters while watching the console output:
    ENCODER_PPR               - pulses (or counts) per revolution of the encoder shaft
    FRICTION_WHEEL_DIAMETER_MM - diameter of the wheel that contacts the rotating plane
    CONTACT_RADIUS_MM         - distance from the plane's center to the contact point

The program reads the serial stream from your encoder (same format as the main
application: STEPS:xxx,SPEED:yyy,DIR:z) and computes the total angle in degrees,
assuming the encoder wheel rolls without slipping on the rotating surface.

Press Ctrl+C to exit.
"""

import serial
import serial.tools.list_ports
import time
import sys
import math

# ----------------------------------------------------------------------
# TUNABLE CONFIGURATION – change these values and re-run
# ----------------------------------------------------------------------
ENCODER_PPR = 20              # counts per revolution (verify if it's pulses or quadrature counts)
FRICTION_WHEEL_DIAMETER_MM = 80  # diameter of the wheel touching the rotating plane (mm)
CONTACT_RADIUS_MM = 450          # distance from centre to the wheel's contact point (mm)

ROTATION_DIRECTION = 1           # set to -1 if the encoder direction is reversed

# Serial settings (usually match your main application)
SERIAL_BAUD = 115200
SERIAL_PORT_FILTER = None        # e.g., "USB" to filter by description

# ----------------------------------------------------------------------
# Derived constant
# ----------------------------------------------------------------------
DEGREES_PER_STEP = (FRICTION_WHEEL_DIAMETER_MM / (2 * CONTACT_RADIUS_MM)) * (360.0 / ENCODER_PPR)

# ----------------------------------------------------------------------
# Helper functions (copied from main code for consistency)
# ----------------------------------------------------------------------
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
        parts = dict(item.split(':') for item in line.strip().split(',') if ':' in item)
        steps = int(parts['STEPS'])
        speed = float(parts['SPEED'])
        direction = int(parts['DIR'])
        return steps, speed, direction
    except (ValueError, KeyError):
        return None

# ----------------------------------------------------------------------
# Main test loop
# ----------------------------------------------------------------------
def main():
    print("Encoder Calibration Test")
    print("=========================")
    print(f"ENCODER_PPR               = {ENCODER_PPR}")
    print(f"FRICTION_WHEEL_DIAMETER_MM = {FRICTION_WHEEL_DIAMETER_MM} mm")
    print(f"CONTACT_RADIUS_MM         = {CONTACT_RADIUS_MM} mm")
    print(f"DEGREES_PER_STEP          = {DEGREES_PER_STEP:.6f} deg/step")
    print("Waiting for serial connection...")
    print("Press Ctrl+C to exit.\n")

    current_angle = 0.0
    last_print_time = 0

    while True:
        port = find_serial_port()
        if port is None:
            print("No serial port found, retrying in 2s...")
            time.sleep(2)
            continue

        try:
            ser = serial.Serial(port, SERIAL_BAUD, timeout=1)
            print(f"Connected to {port} @ {SERIAL_BAUD} baud")
            ser.flushInput()

            while True:
                raw_line = ser.readline().decode('utf-8', errors='ignore')
                if not raw_line:
                    continue

                parsed = parse_encoder_line(raw_line)
                if parsed is None:
                    continue

                steps, speed, direction = parsed

                # If steps is 0, there is no movement; we can still show the angle if needed
                if steps == 0:
                    continue

                # Apply direction sign (using ROTATION_DIRECTION if you want to reverse)
                direction_sign = (1 if direction >= 1 else -1) * ROTATION_DIRECTION

                delta_deg = direction_sign * steps * DEGREES_PER_STEP
                current_angle = (current_angle + delta_deg) % 360.0

                # Print at most every 0.1s to avoid flooding
                now = time.time()
                if now - last_print_time >= 0.1:
                    print(f"Steps: {steps:4d}  Dir: {direction:+2d}  Delta: {delta_deg:+8.3f}°  Angle: {current_angle:8.3f}°")
                    last_print_time = now

        except serial.SerialException as e:
            print(f"Serial error: {e}, reconnecting in 2s...")
            time.sleep(2)
        except KeyboardInterrupt:
            print("\nExiting.")
            sys.exit(0)
        except Exception as e:
            print(f"Unexpected error: {e}, reconnecting in 2s...")
            time.sleep(2)

if __name__ == "__main__":
    main()