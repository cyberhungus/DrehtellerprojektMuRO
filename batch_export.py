"""
Batch-runs export_gltf.py against every Boot N.blend file, headlessly,
via subprocess calls to blender.exe. No shell script needed.

Expects a layout like:

    blend_files/Boot 1.blend
    blend_files/Boot 2.blend
    ...

and writes output into the same folder structure the three.js loader expects:

    static/models/Boot 1/Boot 1.gltf
    static/models/Boot 2/Boot 2.gltf
    ...

Usage:
    python batch_export.py

Adjust BLEND_SOURCE_DIR / OUTPUT_BASE_DIR / BOAT_COUNT below to match your setup.
Requires export_gltf.py to be in the same folder as this script.
"""

import subprocess
from pathlib import Path

BLEND_SOURCE_DIR = Path("blend_files")
OUTPUT_BASE_DIR = Path("static/models")
BOAT_COUNT = 6

SCRIPT_DIR = Path(__file__).resolve().parent
print("SCRDIR:", SCRIPT_DIR)
EXPORT_SCRIPT = SCRIPT_DIR / "export_gltf.py"
print("EXPSCR:", EXPORT_SCRIPT)

def export_boat(index):

    name = f"Boot {index}"
    blend_file = BLEND_SOURCE_DIR / f"{name}.blend"
    output_dir = OUTPUT_BASE_DIR / name
    output_path = output_dir / f"{name}.gltf"

    if not blend_file.exists():
        print(f"Skipping \"{name}\" — no file at {blend_file}")
        return

    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"=== Exporting {name} ===")

    result = subprocess.run(
        [
            "blender",
            "--background", str(blend_file),
            "--python", str(EXPORT_SCRIPT),
            "--",
            str(output_path),
        ],
        capture_output=True,
        text=True,
    )

    # Blender prints its own progress/errors to stdout/stderr — surface both
    print(result.stdout)
    if result.stderr:
        print(result.stderr)

    if result.returncode != 0:
        print(f"!! Export failed for {name} (exit code {result.returncode})")
    else:
        print(f"Done: {name}")


def main():

    if not EXPORT_SCRIPT.exists():
        raise FileNotFoundError(
            f"export_gltf.py not found at {EXPORT_SCRIPT} — make sure it's in the same folder as this script."
        )

    for i in range(1, BOAT_COUNT + 1):
        export_boat(i)

    print("All done.")


if __name__ == "__main__":
    main()