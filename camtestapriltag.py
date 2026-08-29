import cv2
import cv2.aruco as aruco

def detect_and_display_markers(y_start, y_end):
    cap = cv2.VideoCapture(1)
    cap.set(3,1600)
    cap.set(4,1200)
    cap.set(cv2.CAP_PROP_EXPOSURE, -10)
    cap.set(cv2.CAP_PROP_GAIN, 600)
    if not cap.isOpened():
        print("Error: Could not open video stream.")
        return

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    print(f"Camera resolution: {width}x{height}")

    # --- Set up ArUco/AprilTag dictionary and detector once, outside the loop ---
    aruco_dict = aruco.getPredefinedDictionary(aruco.DICT_APRILTAG_36h11)
    parameters = aruco.DetectorParameters()

    # Tuning for motion-blurred markers

    # Adaptive thresholding: wider window range helps when edges are
    # softened by blur (default min/max is 3/23, step 10)
    parameters.adaptiveThreshWinSizeMin = 3
    parameters.adaptiveThreshWinSizeMax = 35
    parameters.adaptiveThreshWinSizeStep = 4
    parameters.adaptiveThreshConstant = 7

    # Allow more tolerance approximating the marker's polygon shape,
    # since blur rounds off corners (default 0.03)
    parameters.polygonalApproxAccuracyRate = 0.05

    # Loosen perimeter filtering slightly so blur-softened markers
    # aren't discarded (defaults: 0.03 / 4.0)
    parameters.minMarkerPerimeterRate = 0.02
    parameters.maxMarkerPerimeterRate = 4.0

    # Corner refinement: subpixel accuracy meaningfully helps blurred corners
    parameters.cornerRefinementMethod = aruco.CORNER_REFINE_SUBPIX
    parameters.cornerRefinementWinSize = 5
    parameters.cornerRefinementMaxIterations = 50
    parameters.cornerRefinementMinAccuracy = 0.05

    # Be more lenient on bit errors, since blur corrupts bits
    # (default maxErroneousBitsInBorderRate = 0.35, errorCorrectionRate = 0.6)
    parameters.maxErroneousBitsInBorderRate = 0.5
    parameters.errorCorrectionRate = 0.8

    detector = aruco.ArucoDetector(aruco_dict, parameters)

    # --- Optional: try reducing exposure to cut motion blur at the source ---
    # cap.set(cv2.CAP_PROP_AUTO_EXPOSURE, 1)   # 1 = manual mode on many backends (varies by OS/driver)
    # cap.set(cv2.CAP_PROP_EXPOSURE, -6)       # more negative = shorter exposure; tune to your camera
    # cap.set(cv2.CAP_PROP_GAIN, 50)           # compensate lost brightness with gain

    while True:
        ret, frame = cap.read()

        if not ret:
            print("Failed to grab frame")
            break

        # Crop the frame to get the region of interest
        roi = frame[y_start:y_end, :]

        # Convert the ROI to grayscale for marker detection
        gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)

        # Detect markers in the grayscale ROI
        corners, ids, rejected = detector.detectMarkers(gray)

        # Draw detected markers on the ROI (green, default)
        if ids is not None:
            aruco.drawDetectedMarkers(roi, corners, ids)
            print("Detected markers:", ids.flatten())
        else:
            print(f"No markers detected. Rejected candidates: {len(rejected)}")

        # Draw rejected candidates in red so you can see what the detector
        # found but discarded (helps diagnose quiet-zone/threshold issues)
        if rejected:
            aruco.drawDetectedMarkers(roi, rejected, borderColor=(0, 0, 255))

        print("Actual gain:", cap.get(cv2.CAP_PROP_GAIN))
        # Display the cropped region with detected + rejected markers
        cv2.imshow('Cropped Camera Feed - Marker Detection', roi)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    print("start")
    y_start = 0  # Starting line at 200 pixels from the top
    y_end = 1600   # Ending line at 350 pixels from the top

    detect_and_display_markers(y_start, y_end)




ENCODER_PPR = 600                      # from encoder datasheet — verify counts vs pulses distinction
FRICTION_WHEEL_DIAMETER_MM = 20        # diameter of the wheel touching the rotating plane
CONTACT_RADIUS_MM = 150                # distance from plane's center to where the wheel touches its edge

DEGREES_PER_STEP = (FRICTION_WHEEL_DIAMETER_MM / (2 * CONTACT_RADIUS_MM)) * (360 / ENCODER_PPR)