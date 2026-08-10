import cv2# Parameters
import numpy as np
marker_size_mm = 50  # Side of each marker in millimeters
dpi = 300  # Dots per inch for printing
spacing_mm = 1  # Space between markers in millimeters
margin_mm = 5  # Margin on the sides in millimeters

# Convert sizes from mm to pixels
marker_size_pixels = int((marker_size_mm / 25.4) * dpi)
spacing_pixels = int((spacing_mm / 25.4) * dpi)
margin_pixels = int((margin_mm / 25.4) * dpi)

# Load the 6x6 ArUco dictionary
aruco_dict = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_6X6_1000)

# A4 size in pixels at 300 DPI
a4_width_pixels, a4_height_pixels = int(8.27 * dpi), int(11.69 * dpi)

# Calculate number of markers that fit, considering margins
usable_width = a4_width_pixels - 2 * margin_pixels
usable_height = a4_height_pixels - 2 * margin_pixels

num_markers_horizontal = usable_width // (marker_size_pixels + spacing_pixels)
num_markers_vertical = usable_height // (marker_size_pixels + spacing_pixels)

# Create a blank A4 canvas
canvas = 255 * np.ones((a4_height_pixels, a4_width_pixels), dtype=np.uint8)

# Draw ArUco markers on the canvas
marker_id = 0
for i in range(num_markers_vertical):
    for j in range(num_markers_horizontal):
        marker = np.zeros((marker_size_pixels, marker_size_pixels), dtype=np.uint8)
        cv2.aruco.generateImageMarker(aruco_dict, marker_id, marker_size_pixels, marker, 1)
        x = margin_pixels + j * (marker_size_pixels + spacing_pixels)
        y = margin_pixels + i * (marker_size_pixels + spacing_pixels)
        canvas[y:y + marker_size_pixels, x:x + marker_size_pixels] = marker
        marker_id += 1
        if marker_id >= 1000:
            marker_id = 0

# Save the image
output_filename = 'aruco_markers_a4_margin.png'
cv2.imwrite(output_filename, canvas)

print(f"Aruco markers generated and saved to {output_filename}.")