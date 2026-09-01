import cv2
import numpy as np
import math

# ---- User-defined parameters ----
marker_size_mm =    8   # Side of each marker in millimeters
dpi = 300                    # Dots per inch for printing
spacing_x_mm = 1             # Horizontal space between markers (mm)
spacing_y_mm = 10           # Vertical space between markers (mm) – increase if text overlaps
margin_mm = 5                # Margin on all sides (mm)

marker_id_start = 0          # First marker ID to generate
marker_id_end   = 360       # Last marker ID to generate (inclusive)

# ---- Conversion to pixels ----
marker_size_px = int((marker_size_mm / 25.4) * dpi)
spacing_x_px = int((spacing_x_mm / 25.4) * dpi)
spacing_y_px = int((spacing_y_mm / 25.4) * dpi)
margin_px = int((margin_mm / 25.4) * dpi)

# ---- Load AprilTag 36h11 dictionary ----
aruco_dict = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_APRILTAG_36h11)
MAX_MARKER_ID = 586  # DICT_APRILTAG_36h11 only has 587 unique IDs (0-586)

if marker_id_end > MAX_MARKER_ID:
    raise ValueError(
        f"DICT_APRILTAG_36h11 only supports IDs 0-{MAX_MARKER_ID} "
        f"(587 unique tags). Reduce marker_id_end."
    )

# ---- A4 page size in pixels ----
a4_width_px, a4_height_px = int(8.27 * dpi), int(11.69 * dpi)

# ---- Calculate how many markers fit per page ----
usable_width = a4_width_px - 2 * margin_px
usable_height = a4_height_px - 2 * margin_px

num_horizontal = usable_width // (marker_size_px + spacing_x_px)
num_vertical   = usable_height // (marker_size_px + spacing_y_px)
markers_per_page = num_horizontal * num_vertical

# ---- Total number of markers required ----
total_markers = marker_id_end - marker_id_start + 1
if total_markers <= 0:
    raise ValueError("End ID must be >= Start ID.")

# ---- Number of pages needed ----
pages_needed = math.ceil(total_markers / markers_per_page)

print(f"Each page holds {markers_per_page} markers.")
print(f"Total markers to generate: {total_markers} -> {pages_needed} page(s).")

# ---- Generate pages ----
current_id = marker_id_start  # starts at the given start ID
page_counter = 1

for page in range(pages_needed):
    # Create a blank A4 canvas
    canvas = 255 * np.ones((a4_height_px, a4_width_px), dtype=np.uint8)

    # How many markers on this page? (last page may be partial)
    remaining = total_markers - (page * markers_per_page)
    markers_on_this_page = min(markers_per_page, remaining)

    # Place markers row by row
    for i in range(num_vertical):
        for j in range(num_horizontal):
            idx = i * num_horizontal + j
            if idx >= markers_on_this_page:
                break  # stop if we've placed all needed markers for this page

            # Generate marker for current_id
            marker = np.zeros((marker_size_px, marker_size_px), dtype=np.uint8)
            cv2.aruco.generateImageMarker(aruco_dict, current_id, marker_size_px, marker, 1)

            # Calculate position
            x = margin_px + j * (marker_size_px + spacing_x_px)
            y = margin_px + i * (marker_size_px + spacing_y_px)
            canvas[y:y + marker_size_px, x:x + marker_size_px] = marker

            # ---- Draw the marker ID as text below the marker ----
            text = str(current_id)
            font = cv2.FONT_HERSHEY_SIMPLEX
            font_scale = 0.6          # Adjust if you want larger/smaller text
            thickness = 2
            (text_w, text_h), baseline = cv2.getTextSize(text, font, font_scale, thickness)

            # Center the text horizontally below the marker
            text_x = x + (marker_size_px - text_w) // 2
            # Place it with a small 10px gap below the marker
            text_y = y + marker_size_px + baseline + 10

            # Draw the text in black (0) on the white canvas
            cv2.putText(canvas, text, (text_x, text_y), font, font_scale, 0, thickness, cv2.LINE_AA)

            # Advance to next ID (no wrap needed since we validated the range up front)
            current_id += 1

    # Save this page
    if pages_needed == 1:
        filename = 'apriltag_36h11_markers_a4.png'
    else:
        filename = f'apriltag_36h11_markers_a4_page{page_counter}.png'
    cv2.imwrite(filename, canvas)
    print(f"Saved {filename}")
    page_counter += 1

print("Done.")