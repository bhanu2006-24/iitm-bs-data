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

    def discover_and_scrape(self, limit=5, target_exam_keyword="Quiz 1"):
        """Crawls the site to find papers and scrape them."""
        print(f"[*] Starting Discovery (Limit: {limit} papers)...")
        
        count = 0
        
        # 1. Get Exams
        home_props = self._get_inertia_props(self.base_url)
        if not home_props or 'exams' not in home_props:
            print("[!] Could not find exams on homepage.")
            return

        exams = home_props['exams']
        
        for exam in exams:
            if count >= limit: break
            
            exam_name = exam.get('exam_name', 'Unknown')
            # Check keyword match
            is_target = target_exam_keyword.lower() in exam_name.lower()
            
            exam_uuid = exam.get('uuid')
            # print(f"\n[+] Processing Exam: {exam_name}")
            
            # 2. Get Courses
            exam_url = f"{self.base_url}/exam/{exam_uuid}"
            exam_props = self._get_inertia_props(exam_url)
            
            if not exam_props or 'courses' not in exam_props:
                continue

            courses = exam_props['courses']
            
            for course in courses:
                if count >= limit: break
                course_name = course.get('course_name', 'Unknown')
                course_id = course.get('id')
                
                # 3. Get Bundles
                course_props = self._get_inertia_props(exam_url, params={'course_id': course_id})
                if not course_props: continue

                bundles = []
                if 'groups' in course_props:
                    bundles = course_props['groups']
                elif 'courses' in course_props:
                    selected_course = next((c for c in course_props['courses'] if c['id'] == course_id), None)
                    if selected_course and 'groups' in selected_course:
                        bundles = selected_course['groups']
                    elif selected_course and 'question_papers' in selected_course:
                        bundles = [{'group_name': 'Default', 'question_papers': selected_course['question_papers']}]

                if bundles:
                    for bundle in bundles:
                        if count >= limit: break
                        bundle_name = bundle.get('group_name', 'Unknown')
                        
                        papers = bundle.get('question_papers', [])
                        
                        for paper in papers:
                            if count >= limit: break
                            
                            paper_title = paper.get('question_paper_name', 'Untitled')
                            
                            # Do Scrape
                            paper_title_clean = re.sub(r'[^\w\-_\. ]', '_', paper_title)
                            e_id = paper.get('exam_id', 1) 
                            paper_uuid = paper.get('uuid')
                            paper_url = f"{self.base_url}/question-paper/practise/{e_id}/{paper_uuid}"
                            
                            print(f"        -> Scraping Paper ({count+1}/{limit}): {paper_title}")
                            self.scrape_paper(paper_url, path_parts=[exam_name, course_name, bundle_name, paper_title_clean])
                            count += 1
                            time.sleep(1) # be polite

    def _download_image(self, rel_url, save_dir):
        """Downloads an image from a relative URL."""
        if not rel_url:
            return None
            
        if rel_url.startswith('http'):
            full_url = rel_url
        elif rel_url.startswith('/'):
            full_url = f"{self.base_url}{rel_url}"
        else:
            # Handle 'app/...' or just filename using base_url
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
            else:
                # print(f"        [!] Failed to download img {rel_url} status {r.status_code}")
                pass
        except Exception as e:
            # print(f"        [!] Failed to download img {rel_url}: {e}")
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
        save_dir = None
        
        if save_to_disk:
            if path_parts:
                safe_parts = [re.sub(r'[^\w\-_\. ]', '_', str(p)) for p in path_parts]
                save_dir = os.path.join(self.output_dir, *safe_parts[:-1]) # last part is filename
            else:
                # Create a temp-like structure: scraped_data/temp_{timestamp}
                import time
                ts = int(time.time())
                save_dir = os.path.join(self.output_dir, f"temp_{ts}")

            img_dir = os.path.join(save_dir, "images")
            
            if not os.path.exists(save_dir):
                os.makedirs(save_dir)
            if download_images and not os.path.exists(img_dir):
                os.makedirs(img_dir)

        # Process and Download Images
        if download_images and img_dir:
            for q in questions:
                # Question Images
                # Look for question_image_url (list)
                if q.get('question_image_url'):
                    if isinstance(q['question_image_url'], list):
                        for img_path in q['question_image_url']:
                            self._download_image(img_path, img_dir)
                    elif isinstance(q['question_image_url'], str):
                         self._download_image(q['question_image_url'], img_dir)
                
                # Single keys like question_image_1
                for k, v in q.items():
                    if k.startswith('question_image_') and v and isinstance(v, str) and (v.endswith('.png') or v.endswith('.jpg')):
                        # format might be just filename "abc.png" or path "/question_images/..."
                        path_to_dl = v if v.startswith('/') else f"/question_images/{v}" 
                        self._download_image(path_to_dl, img_dir)

                # Options Images
                for opt in q.get('options', []):
                    # option_image_url (full path) or option_image (filename)
                    opt_img = opt.get('option_image_url')
                    if opt_img:
                        self._download_image(opt_img, img_dir)
                    
                    opt_img_raw = opt.get('option_image')
                    if opt_img_raw and not opt_img: # Fallback
                         path_to_dl = f"app/option_images/{opt_img_raw}" if not opt_img_raw.startswith('/') else opt_img_raw
                         self._download_image(path_to_dl, img_dir)

        output_data = {
            'metadata': qp_data,
            'questions': questions,
            'url': url
        }
        
        # Capture extra context from props
        if 'exam' in props:
            output_data['metadata']['exam_context'] = props['exam']
        if 'course' in props:
            output_data['metadata']['course_context'] = props['course']
        if 'group' in props:
            output_data['metadata']['group_context'] = props['group']

        if save_to_disk and save_dir:
            filename = "paper.json"
            if path_parts:
                safe_parts = [re.sub(r'[^\w\-_\. ]', '_', str(p)) for p in path_parts]
                filename = f"{safe_parts[-1]}.json"
            
            save_path = os.path.join(save_dir, filename)
            output_data['local_file_path'] = save_path
            output_data['local_save_dir'] = save_dir
            
            with open(save_path, 'w', encoding='utf-8') as f:
                json.dump(output_data, f, indent=2)
            
            # print(f"        [ok] Saved {len(questions)} Qs to {filename}")
        
        return output_data

if __name__ == "__main__":
    print("[-] QuizPractice Scraper Standalone Mode")
    print("[-] Use dashboard.py for the full GUI experience.")
    
    import sys
    
    if len(sys.argv) > 1:
        # User passed arguments (e.g. url)
        # Check if it looks like a URL
        arg = sys.argv[1]
        if "quizpractice.space" in arg:
            print(f"[*] Scraping URL: {arg}")
            scr = QuizScraper()
            data = scr.scrape_paper(arg)
            if data:
                print(f"[+] Success! Saved to: {data.get('local_file_path')}")
            else:
                print("[!] Failed to scrape.")
        else:
            # Assume keyword for discovery
            print(f"[*] Search Mode: {arg}")
            scr = QuizScraper()
            scr.discover_and_scrape(limit=10, target_exam_keyword=arg)
    else:
        # Default behavior
        print("[-] Usage: python scraper.py [URL or Keyword]")
        print("[-] Defaulting to 'Quiz 1' discovery...")
        scr = QuizScraper()
        scr.discover_and_scrape(limit=3, target_exam_keyword="Quiz 1")
