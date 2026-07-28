import cv2
import cv2.aruco as aruco

def detect_and_display_markers(y_start, y_end):
    cap = cv2.VideoCapture(1)

    if not cap.isOpened():
        print("Error: Could not open video stream.")
        return

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    print(f"Camera resolution: {width}x{height}")
    while True:
        ret, frame = cap.read()

        if not ret:
            print("Failed to grab frame")
            break

        # Crop the frame to get the region of interest
        roi = frame[y_start:y_end, :]

        # Convert the ROI to grayscale for marker detection
        gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)

        # Define the ArUco dictionary and parameters
        aruco_dict = aruco.getPredefinedDictionary(aruco.DICT_6X6_1000)
        parameters = aruco.DetectorParameters()

        # Create the ArUco detector
        detector = aruco.ArucoDetector(aruco_dict, parameters)

        # Detect markers in the grayscale ROI
        corners, ids, _ = detector.detectMarkers(gray)

        # Draw detected markers on the ROI
        if ids is not None:
            aruco.drawDetectedMarkers(roi, corners, ids)
            print("Detected markers:", ids.flatten())

        # Display the cropped region with detected markers
        cv2.imshow('Cropped Camera Feed - Marker Detection', roi)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    y_start = 180  # Starting line at 200 pixels from the top
    y_end = 350    # Ending line at 350 pixels from the top

    detect_and_display_markers(y_start, y_end)