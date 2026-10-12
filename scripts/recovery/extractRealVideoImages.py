import cv2
import glob
import os

frames_dir = r'C:\Users\Samsung\.gemini\antigravity\brain\da335eb3-d6e0-4861-ada0-f4c1c071d678\scratch\video_frames'
out_dir = r'C:\Users\Samsung\.gemini\antigravity\scratch\play-cartaz-ia\public\produtos-reais-video'
os.makedirs(out_dir, exist_ok=True)

frames = sorted(glob.glob(os.path.join(frames_dir, '*.jpg')))
print(f'Processing {len(frames)} video frames...')

for f in frames:
    img = cv2.imread(f)
    if img is None: continue
    h, w, _ = img.shape
    # In 16:9 banner (1920x1080):
    # The product image sits around: y from 220 to 880, x from 120 to 1100
    # Let's crop it cleanly
    crop = img[200:900, 100:1150]
    base = os.path.basename(f).replace('.jpg', '.png')
    cv2.imwrite(os.path.join(out_dir, base), crop)
    print(f'Cropped {base}: {crop.shape}')
