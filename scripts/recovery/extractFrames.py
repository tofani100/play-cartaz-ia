import cv2
import glob
import os
import re

downloads_dir = r"C:\Users\Samsung\Downloads"
out_dir = r"C:\Users\Samsung\.gemini\antigravity\brain\da335eb3-d6e0-4861-ada0-f4c1c071d678\scratch\video_frames"
os.makedirs(out_dir, exist_ok=True)

# List of 20 MP4s from 28/09
mp4_files = sorted(glob.glob(os.path.join(downloads_dir, "banner-animado-*-179062*.mp4")))
print(f"Found {len(mp4_files)} files matching 179062*.mp4:")

for filepath in mp4_files:
    fname = os.path.basename(filepath)
    cap = cv2.VideoCapture(filepath)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    
    # Grab frame at 80% duration (when all titles, prices and badges are fully animated)
    target_frame = int(total_frames * 0.8)
    cap.set(cv2.CAP_PROP_POS_FRAMES, target_frame)
    ret, frame = cap.read()
    if ret:
        out_path = os.path.join(out_dir, fname.replace(".mp4", ".jpg"))
        cv2.imwrite(out_path, frame)
        print(f"Extracted: {fname} -> {os.path.basename(out_path)}")
    cap.release()

print("Done extracting frames!")
