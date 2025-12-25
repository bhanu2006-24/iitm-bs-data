import os
import json
import glob
from PIL import Image

# Config
SUBJECTS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'subjects')
RAW_IMAGES_DIR = os.path.join(SUBJECTS_DIR, 'raw_images')
FINAL_IMAGES_DIR = os.path.join(SUBJECTS_DIR, 'images')

def main():
    if not os.path.exists(FINAL_IMAGES_DIR):
        os.makedirs(FINAL_IMAGES_DIR)

    # 1. Resize/Convert Images
    # Iterate RAW images (which are now renamed by renamer.py)
    # Convert to WebP 70%
    
    print("Converting images...")
    processed_count = 0
    
    # Check if raw dir exists
    if not os.path.exists(RAW_IMAGES_DIR):
        print("Raw images directory not found. Run downloader and renamer first.")
        return

    for filename in os.listdir(RAW_IMAGES_DIR):
        file_path = os.path.join(RAW_IMAGES_DIR, filename)
        if os.path.isdir(file_path): continue
        
        name, ext = os.path.splitext(filename)
        # New filename
        new_filename = f"{name}.webp"
        new_path = os.path.join(FINAL_IMAGES_DIR, new_filename)
        
        # optimized skip
        if os.path.exists(new_path):
            continue
            
        try:
            with Image.open(file_path) as img:
                # Convert to RGB if needed (for png/transparency issue handling in jpg, but webp handles it)
                if img.mode in ("RGBA", "P"):
                    img = img.convert("RGBA")
                
                img.save(new_path, "WEBP", quality=70)
                processed_count += 1
                if processed_count % 100 == 0:
                     print(f"Processed {processed_count} images...")
                     
        except Exception as e:
            print(f"Error converting {filename}: {e}")

    print(f"Resize/Conversion complete. {processed_count} new images.")
    
    # 2. Update JSONs to point to .webp
    # Since renamer set them to .png/.jpg/etc, we need to update extension to .webp
    # and ensure path is correct.
    
    json_files = glob.glob(os.path.join(SUBJECTS_DIR, "*.json"))
    for jf in json_files:
        if 'subjects_index.json' in jf: continue
        
        updated = False
        try:
            with open(jf, 'r') as f:
                data = json.load(f)
            
            for q in data:
                # Main Images
                if q.get('images'):
                    new_images = []
                    for img in q['images']:
                        # img is likely "images/name.ext" from renamer
                        if img and 'images/' in img and not img.endswith('.webp'):
                            # Change extension
                            base = os.path.splitext(img)[0]
                            new_img = f"{base}.webp"
                            new_images.append(new_img)
                            updated = True
                        else:
                            new_images.append(img)
                    q['images'] = new_images

                # Options
                if q.get('options'):
                    for opt in q['options']:
                        img = opt.get('image')
                        if img and 'images/' in img and not img.endswith('.webp'):
                             base = os.path.splitext(img)[0]
                             opt['image'] = f"{base}.webp"
                             updated = True
            
            if updated:
                with open(jf, 'w') as f:
                    json.dump(data, f, indent=2)
                print(f"Updated JSON extensions in {jf}")
                
        except Exception as e:
            print(f"Error updating JSON {jf}: {e}")

if __name__ == "__main__":
    main()
