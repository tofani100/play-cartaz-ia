import cv2
import glob
import os

frames_dir = r'C:\Users\Samsung\.gemini\antigravity\brain\da335eb3-d6e0-4861-ada0-f4c1c071d678\scratch\video_frames'
out_dir = r'C:\Users\Samsung\.gemini\antigravity\brain\da335eb3-d6e0-4861-ada0-f4c1c071d678\scratch\cropped_banner_products'
os.makedirs(out_dir, exist_ok=True)

frames = sorted(glob.glob(os.path.join(frames_dir, '*.jpg')))
for f in frames:
    img = cv2.imread(f)
    if img is None: continue
    h, w, _ = img.shape
    # Product packshot in 16:9 TV layout is typically in the upper-middle/left region
    # Let's crop x: 50 to 1100, y: 150 to 900
    crop = img[150:900, 50:1100]
    out_name = os.path.basename(f).replace('.jpg', '_crop.jpg')
    cv2.imwrite(os.path.join(out_dir, out_name), crop)
    print(f'Cropped {out_name}')
