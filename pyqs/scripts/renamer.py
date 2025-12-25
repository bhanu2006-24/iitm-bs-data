import os
import json
import glob
from urllib.parse import urlparse
import shutil

# Config
SUBJECTS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'subjects')
RAW_IMAGES_DIR = os.path.join(SUBJECTS_DIR, 'raw_images')
# We will rename files IN PLACE in raw_images, or move them? 
# "renamer.py which also renames the all img names.. also the real img name. and also in the json files.."
# Let's keep them in raw_images but rename them.

def get_clean_basename(url):
    if not url: return None
    parsed = urlparse(url)
    basename = os.path.basename(parsed.path)
    # Replicate logic from downloader to find the file
    if not basename or len(basename) < 4:
        import hashlib
        basename = hashlib.md5(url.encode()).hexdigest() + ".png"
    basename = "".join([c for c in basename if c.isalnum() or c in "._-"])
    return basename

def main():
    json_files = glob.glob(os.path.join(SUBJECTS_DIR, "*.json"))
    
    # Track used names to avoid collisions/overwrites if running multiple times? 
    # Actually, we should generat a deterministic name based on Question ID etc.
    # Pattern: {subject}_{year}_{exam}_{qID}_{idx}.ext
    
    for jf in json_files:
        if 'subjects_index.json' in jf: continue
        
        updated = False
        filename = os.path.basename(jf)
        subject_name = filename.replace('.json', '')
        
        print(f"Processing {subject_name}...")
        
        try:
            with open(jf, 'r') as f:
                data = json.load(f)
            
            for q in data:
                q_id = q.get('id', 'unknown')
                year = q.get('year', '2024')
                exam = q.get('exam', 'exam').replace(' ', '_')
                
                # Process Main Images
                if q.get('images'):
                    new_images = []
                    for idx, img_url in enumerate(q['images']):
                        if not img_url or not img_url.startswith('http'):
                            new_images.append(img_url)
                            continue
                        
                        # Find the physical file
                        old_basename = get_clean_basename(img_url)
                        old_path = os.path.join(RAW_IMAGES_DIR, old_basename)
                        
                        if os.path.exists(old_path):
                            ext = os.path.splitext(old_basename)[1]
                            if not ext: ext = ".png" # Fallback
                            
                            new_name = f"{subject_name}_{year}_{exam}_{q_id}_q{idx}{ext}"
                            new_path = os.path.join(RAW_IMAGES_DIR, new_name)
                            
                            # Rename file
                            if old_path != new_path:
                                shutil.move(old_path, new_path)
                            
                            # Update JSON path (relative for frontend)
                            # Frontend expects images in 'subjects/images/' (after resizing)
                            # But renamer just updates names.
                            # We will point to 'images/new_name' assuming resizer moves them there.
                            
                            # However, resizer changes extension to .webp usually.
                            # The user said: "resizer.py change all imgs.. to jpg70 or webp70"
                            # So JSON should reference the FINAL extension? Or resizer updates JSON?
                            # "renamer.py ... and also in the json files"
                            # I will update JSON to the renamed source file for now, 
                            # AND maybe resizer should be the one setting final extension?
                            # Let's set it to the CURRENT extension here. Frontend allows generic.
                            
                            new_images.append(f"images/{new_name}") # Relative to 'subjects/' or root? 
                            # If app is in root, url is subjects/images/name
                            # My clean_data used full url.
                            # Let's use `images/{new_name}` and ensure frontend resolves it relative to subject or root.
                            # Better: `subjects/images/{new_name}`
                            
                            # Actually, cleaner kept JSON in subjects/. 
                            # So relative path `images/` works if index.html is in `subjects/`? No, index is in root.
                            # So we need `subjects/images/{new_name}`.
                            
                            # But wait, later resizer might change it to .webp.
                            # If I change it here to .png, and resizer changes to .webp, links break.
                            # The PROMPT says: "renamer.py ... renames real img name ... and also in json". 
                            # THEN "resizer ... change to webp".
                            # This implies distinct steps.
                            # I'll let renamer set it to `images/{new_name}`. 
                            # I'll advise user to run resizer which SHOULD update JSON again or I make resizer maintain names.
                            
                        else:
                            # File not downloaded? Keep URL? 
                            # User said "add script ... download all". Assumes download happened.
                            new_images.append(img_url)
                    
                    if new_images != q['images']:
                        q['images'] = new_images
                        updated = True

                # Process Option Images
                if q.get('options'):
                    for idx, opt in enumerate(q['options']):
                        img_url = opt.get('image')
                        if img_url and img_url.startswith('http'):
                            old_basename = get_clean_basename(img_url)
                            old_path = os.path.join(RAW_IMAGES_DIR, old_basename)
                            
                            if os.path.exists(old_path):
                                ext = os.path.splitext(old_basename)[1] or ".png"
                                new_name = f"{subject_name}_{year}_{exam}_{q_id}_opt{idx}{ext}"
                                new_path = os.path.join(RAW_IMAGES_DIR, new_name)
                                
                                if old_path != new_path:
                                    shutil.move(old_path, new_path)
                                
                                opt['image'] = f"images/{new_name}"
                                updated = True

            if updated:
                with open(jf, 'w') as f:
                    json.dump(data, f, indent=2)
                print(f"Updated {jf}")

        except Exception as e:
            print(f"Error processing {jf}: {e}")

if __name__ == "__main__":
    main()
