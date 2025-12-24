import requests
import json
import os
import re
from bs4 import BeautifulSoup
import time

class QuizScraper:
    def __init__(self, output_dir="scraped_data"):
        self.base_url = "https://quizpractice.space"
        self.session = requests.Session()
        self.output_dir = output_dir
        self.inertia_version = None
        
        # Headers for mimicking a browser
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
        })
        
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

    def _get_version(self):
        """Extracts the Inertia version from the homepage."""
        try:
            r = self.session.get(self.base_url)
            ver = r.headers.get('X-Inertia-Version')
            if ver:
                return ver
            
            soup = BeautifulSoup(r.text, 'html.parser')
            app_div = soup.find('div', id='app')
            if app_div and app_div.has_attr('data-page'):
                data = json.loads(app_div['data-page'])
                return data.get('version')
        except Exception as e:
            print(f"[!] Error getting version: {e}")
        return None

    def _get_inertia_props(self, url, params=None):
        """Fetches the JSON props for an Inertia page."""
        if not self.inertia_version:
            self.inertia_version = self._get_version()
            # print(f"[*] Inertia Version: {self.inertia_version}")
        
        headers = {
            'X-Inertia': 'true',
            'X-Inertia-Version': self.inertia_version,
            'X-Requested-With': 'XMLHttpRequest'
        }
        
        try:
            r = self.session.get(url, headers=headers, params=params)
            if r.status_code == 409:
                print("[!] Version mismatch. Refreshing version...")
                self.inertia_version = self._get_version()
                headers['X-Inertia-Version'] = self.inertia_version
                r = self.session.get(url, headers=headers, params=params)
            
            if r.status_code == 200:
                return r.json().get('props', {})
            else:
                print(f"[!] Failed to fetch {url}. Status: {r.status_code}")
                return None
        except Exception as e:
            print(f"[!] Exception fetching {url}: {e}")
            return None

    def _download_image(self, rel_url, save_dir):
        """Downloads an image from a relative URL."""
        if not rel_url:
            return None
            
        if rel_url.startswith('http'):
            full_url = rel_url
        elif rel_url.startswith('/'):
            full_url = f"{self.base_url}{rel_url}"
        else:
            full_url = f"{self.base_url}/{rel_url}"

        filename = os.path.basename(rel_url)
        save_path = os.path.join(save_dir, filename)
        
        if os.path.exists(save_path):
            return filename # Already exists

        try:
            r = self.session.get(full_url)
            if r.status_code == 200:
                with open(save_path, 'wb') as f:
                    f.write(r.content)
                return filename
        except Exception:
            pass
        return None

    def scrape_paper(self, url, path_parts=None, save_to_disk=True, download_images=True):
        """Scrapes a single paper URL. Returns the data dict."""
        props = self._get_inertia_props(url)
        if not props:
            return None

        qp_data = props.get('question_paper', {})
        questions = props.get('questions', [])
        
        if not questions and 'questions' in qp_data:
            questions = qp_data['questions']
            
        if not questions:
            print(f"        [!] No questions found for {url}")
            return None

        # Prepare directory first if we are saving images
        img_dir = None
        
        # Use a temporary or structured path if path_parts is missing but save_to_disk is true
        if save_to_disk:
            if not path_parts:
                # Create a temp-like structure: scraped_data/temp_{timestamp}
                import time
                ts = int(time.time())
                save_dir = os.path.join(self.output_dir, f"temp_{ts}")
            else:
                 safe_parts = [re.sub(r'[^\w\-_\. ]', '_', str(p)) for p in path_parts]
                 save_dir = os.path.join(self.output_dir, *safe_parts[:-1]) # last part is filename (ignored for dir)
            
            img_dir = os.path.join(save_dir, "images")
            
            if not os.path.exists(save_dir):
                os.makedirs(save_dir)
            if download_images and not os.path.exists(img_dir):
                os.makedirs(img_dir)

        # Process and Download Images
        if download_images and img_dir:
            for q in questions:
                # Question Images
                if q.get('question_image_url'):
                    for img_path in q['question_image_url']:
                        self._download_image(img_path, img_dir)
                
                for k, v in q.items():
                    if k.startswith('question_image_') and v and isinstance(v, str) and (v.endswith('.png') or v.endswith('.jpg')):
                        path_to_dl = v if v.startswith('/') else f"/question_images/{v}" 
                        self._download_image(path_to_dl, img_dir)

                # Options Images
                for opt in q.get('options', []):
                    opt_img = opt.get('option_image_url')
                    if opt_img:
                        self._download_image(opt_img, img_dir)
                    
                    opt_img_raw = opt.get('option_image')
                    if opt_img_raw and not opt_img:
                         path_to_dl = f"app/option_images/{opt_img_raw}" if not opt_img_raw.startswith('/') else opt_img_raw
                         self._download_image(path_to_dl, img_dir)

        output_data = {
            'metadata': qp_data,
            'questions': questions,
            'url': url,
            'local_save_dir': save_dir if save_to_disk else None
        }
        
        if save_to_disk:
            # If path_parts provided, use last part as filename, else default
            filename = "paper.json"
            if path_parts:
                 safe_parts = [re.sub(r'[^\w\-_\. ]', '_', str(p)) for p in path_parts]
                 filename = f"{safe_parts[-1]}.json"
            
            save_path = os.path.join(save_dir, filename)
            output_data['local_file_path'] = save_path
            
            with open(save_path, 'w', encoding='utf-8') as f:
                json.dump(output_data, f, indent=2)
                
        return output_data
