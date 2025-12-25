import os
import json
import glob
import requests
import hashlib
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlparse

# Config
SUBJECTS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'subjects')
RAW_IMAGES_DIR = os.path.join(SUBJECTS_DIR, 'raw_images')
MAX_WORKERS = 10

def get_image_url(url_or_path):
    if not url_or_path:
        return None
    if url_or_path.startswith('http'):
        return url_or_path
    # Return None if it's already a local path or invalid
    return None

def download_image(url):
    if not url:
        return None
        
    try:
        # Create a safe filename from URL
        # We use the basename if possible, else hash
        parsed = urlparse(url)
        basename = os.path.basename(parsed.path)
        if not basename or len(basename) < 4:
            basename = hashlib.md5(url.encode()).hexdigest() + ".png"
            
        # Clean basename of weird chars
        basename = "".join([c for c in basename if c.isalnum() or c in "._-"])
        
        save_path = os.path.join(RAW_IMAGES_DIR, basename)
        
        if os.path.exists(save_path):
            # Already downloaded
            return
            
        print(f"Downloading {url}...")
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            with open(save_path, 'wb') as f:
                f.write(response.content)
        else:
            print(f"Failed {url}: {response.status_code}")
            
    except Exception as e:
        print(f"Error downloading {url}: {e}")

def main():
    if not os.path.exists(RAW_IMAGES_DIR):
        os.makedirs(RAW_IMAGES_DIR)

    json_files = glob.glob(os.path.join(SUBJECTS_DIR, "*.json"))
    all_urls = set()

    print("Scanning JSON files for images...")
    for jf in json_files:
        if 'subjects_index.json' in jf: continue
        
        try:
            with open(jf, 'r') as f:
                data = json.load(f)
            
            for q in data:
                # Check all possible image fields
                if q.get('images'):
                    for img in q['images']:
                        url = get_image_url(img)
                        if url: all_urls.add(url)
                
                if q.get('options'):
                    for opt in q['options']:
                        url = get_image_url(opt.get('image'))
                        if url: all_urls.add(url)
            
        except Exception as e:
            print(f"Error reading {jf}: {e}")

    print(f"Found {len(all_urls)} unique images.")
    
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        executor.map(download_image, all_urls)

    print("Download complete.")

if __name__ == "__main__":
    main()
