import sys
import os
from PIL import Image

if len(sys.argv) < 3:
    sys.exit(1)

pgm_path = sys.argv[1]
png_path = sys.argv[2]

if not os.path.exists(pgm_path):
    sys.exit(1)

try:
    with Image.open(pgm_path) as img:
        img.save(png_path, "PNG")
    print(png_path)
except Exception as e:
    sys.exit(1)
