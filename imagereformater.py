import os
from PIL import Image

# Set your folder path here (use "." for the current folder)
input_folder = "static/models/Boot 5"
output_folder = "static/models/Boot 5"


for filename in os.listdir(input_folder):
    if filename.lower().endswith(".png"):
        file_path = os.path.join(input_folder, filename)

        try:
            img = Image.open(file_path)

            # --- FLATTEN TRANSPARENCY ---
            # Create a pure white background image matching the PNG size
            background = Image.new("RGB", img.size, (255, 255, 255))

            # Paste the PNG onto the white background, using the PNG's alpha channel as a mask
            # If you want black windows instead, remove the next two lines and just use:
            # rgb_img = img.convert("RGB")
            background.paste(img, mask=img.split()[-1])

            # --- SAVE AS JPG ---
            # Replace .png with .jpg
            new_filename = os.path.splitext(filename)[0] + ".jpg"
            save_path = os.path.join(output_folder, new_filename)

            # Quality=95 ensures minimal compression loss
            background.save(save_path, "JPEG", quality=95)

            print(f"Converted: {filename} -> {new_filename}")

        except Exception as e:
            print(f"Skipping {filename}: {e}")

print("Conversion complete!")