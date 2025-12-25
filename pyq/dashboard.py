import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext, simpledialog
import threading
import webbrowser
import http.server
import socketserver
import json
import os
import sys
import glob
import shutil
import re

# Import local modules
import scraper
import cleaner

# Configuration
PORT = 8000
SERVER_URL = f"http://localhost:{PORT}"

class BackendHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/api/save':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data)
                self.save_data(data)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True}).encode())
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def save_data(self, payload):
        # Payload expected: { 'filepath': 'subjects/foo.json', 'data': {...} }
        # Or if it's the practice editor saving a specific exam:
        # { 'subjectId': 'ba', 'examId': '...', 'examData': {...} }
        
        # Let's support the specific "Edit Paper" flow from practice.js
        # We will assume practice.js sends the FULL subject data or we specifically patch the exam.
        # Ideally, we read the subject file, update the specific exam, and write back.
        
        subject_id = payload.get('subjectId')
        exam_id = payload.get('examId')
        updated_exam = payload.get('examData')
        
        if subject_id and exam_id and updated_exam:
            filepath = os.path.join("subjects", f"{subject_id}.json")
            if os.path.exists(filepath):
                with open(filepath, 'r') as f:
                    data = json.load(f)
                
                # Find and replace exam
                for i, exam in enumerate(data.get('exams', [])):
                    if exam['id'] == exam_id:
                        data['exams'][i] = updated_exam
                        break
                else:
                    # New Exam?
                    data.setdefault('exams', []).append(updated_exam)
                
                with open(filepath, 'w') as f:
                    json.dump(data, f, indent=2)
                print(f"Saved update to {filepath}")
                return

        # Fallback for generic file save if needed
        pass

    def log_message(self, format, *args):
        # Silence server logs
        pass

def start_server():
    # Only start if not running
    try:
        with socketserver.TCPServer(("", PORT), BackendHandler) as httpd:
            print(f"Serving at {SERVER_URL}")
            httpd.serve_forever()
    except OSError:
        print(f"Port {PORT} in use, assuming server already running.")

class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Genz PYQ Manager")
        self.geometry("900x600")
        self.configure(bg="#1e1e1e")
        
        # Start Server in Thread
        threading.Thread(target=start_server, daemon=True).start()

        self.setup_ui()
        self.load_subjects()

    def setup_ui(self):
        style = ttk.Style()
        style.theme_use('clam')
        style.configure("TFrame", background="#1e1e1e")
        style.configure("TLabel", background="#1e1e1e", foreground="#e0e0e0", font=("Segoe UI", 10))
        style.configure("TButton", background="#3b82f6", foreground="white", font=("Segoe UI", 9, "bold"))
        style.map("TButton", background=[('active', '#2563eb')])
        style.configure("Header.TLabel", font=("Segoe UI", 16, "bold"), foreground="#60a5fa")
        
        # Tabs
        tabs = ttk.Notebook(self)
        tabs.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        self.tab_scrape = ttk.Frame(tabs)
        self.tab_library = ttk.Frame(tabs)
        
        tabs.add(self.tab_scrape, text="  Scraper  ")
        tabs.add(self.tab_library, text="  Library  ")
        
        self.build_scrape_tab()
        self.build_library_tab()

    def build_scrape_tab(self):
        f = ttk.Frame(self.tab_scrape, padding=20)
        f.pack(fill=tk.BOTH, expand=True)

        ttk.Label(f, text="Add New Paper", style="Header.TLabel").pack(anchor=tk.W, pady=(0, 20))

        # URL
        ttk.Label(f, text="QuizPractice URL:").pack(anchor=tk.W)
        self.url_var = tk.StringVar()
        entry = tk.Entry(f, textvariable=self.url_var, bg="#2d2d2d", fg="white", insertbackground="white", relief="flat", font=("Consolas", 11))
        entry.pack(fill=tk.X, pady=(5, 15), ipady=8)

        # Config
        cfg_frame = ttk.Frame(f)
        cfg_frame.pack(fill=tk.X, pady=10)
        
        # Subject Selector (Auto or Manual)
        ttk.Label(cfg_frame, text="Target Subject:").pack(side=tk.LEFT)
        self.subject_var = tk.StringVar(value="Auto-Detect")
        self.subject_cb = ttk.Combobox(cfg_frame, textvariable=self.subject_var, values=["Auto-Detect"], state="readonly")
        self.subject_cb.pack(side=tk.LEFT, padx=10)
        
        # Actions
        btn_frame = ttk.Frame(f)
        btn_frame.pack(fill=tk.X, pady=20)
        
        self.btn_scrape = ttk.Button(btn_frame, text="Scrape & Clean", command=self.run_scrape)
        self.btn_scrape.pack(side=tk.LEFT, padx=(0, 10))
        
        # Logs
        ttk.Label(f, text="Logs:").pack(anchor=tk.W)
        self.log_area = scrolledtext.ScrolledText(f, bg="#111", fg="#00ff00", height=15, font=("Consolas", 9), relief="flat")
        self.log_area.pack(fill=tk.BOTH, expand=True, pady=5)

    def build_library_tab(self):
        f = ttk.Frame(self.tab_library, padding=20)
        f.pack(fill=tk.BOTH, expand=True)
        
        head = ttk.Frame(f)
        head.pack(fill=tk.X, pady=(0, 10))
        ttk.Label(head, text="Your Library", style="Header.TLabel").pack(side=tk.LEFT)
        ttk.Button(head, text="Refresh", command=self.load_subjects).pack(side=tk.RIGHT)
        
        # Treeview
        cols = ("Subject", "Exams")
        self.tree = ttk.Treeview(f, columns=cols, show='headings', selectmode='browse')
        self.tree.heading("Subject", text="Subject")
        self.tree.heading("Exams", text="Exams Count")
        self.tree.column("Subject", width=300)
        self.tree.column("Exams", width=100)
        self.tree.pack(fill=tk.BOTH, expand=True)
        
        # Actions
        act_frame = ttk.Frame(f, padding=(0, 10))
        act_frame.pack(fill=tk.X)
        
        ttk.Button(act_frame, text="Practice / Edit", command=self.open_practice).pack(side=tk.LEFT, padx=(0, 10))
        ttk.Button(act_frame, text="View Local File", command=self.open_folder).pack(side=tk.LEFT)

    def log(self, msg):
        self.log_area.insert(tk.END, f"> {msg}\n")
        self.log_area.see(tk.END)

    def load_subjects(self):
        self.tree.delete(*self.tree.get_children())
        self.subjects_map = {} # path -> name
        self.subjects_data = {} # path -> json

        if not os.path.exists("subjects"):
            os.makedirs("subjects")
            
        files = glob.glob("subjects/*.json")
        subject_names = ["Auto-Detect"]
        
        for p in files:
            try:
                with open(p, 'r') as f:
                    d = json.load(f)
                    name = d.get('meta', {}).get('name', 'Unknown')
                    self.tree.insert("", tk.END, values=(name, len(d.get('exams', []))), tags=(p,))
                    self.subjects_map[p] = name
                    self.subjects_data[p] = d
                    subject_names.append(name)
            except: pass
            
        self.subject_cb['values'] = subject_names

    def run_scrape(self):
        url = self.url_var.get().strip()
        if not url: return messagebox.showerror("Error", "Enter URL")
        
        self.btn_scrape.state(['disabled'])
        self.log("Starting scrape...")
        
        threading.Thread(target=self._scrape_thread, args=(url,)).start()

    def _scrape_thread(self, url):
        try:
            # 1. Scrape
            self.log(f"Fetching: {url}")
            scr = scraper.QuizScraper(output_dir="scraped_data_temp")
            raw_data = scr.scrape_paper(url, save_to_disk=True)
            
            if not raw_data:
                self.log("Error: Scrape failed.")
                return

            self.log("Cleaning data...")
            # 2. Clean
            local_path = raw_data.get('local_file_path')
            raw_dir = raw_data.get('local_save_dir')
            
            cleaned, copy_ops = cleaner.process_data(raw_data, raw_dir)
            
            if not cleaned:
                self.log("Error: Cleaning failed.")
                return

            # 3. Restructure for Library
            practice_exam = self.convert_to_practice(cleaned)
            
            # 4. Save to Subject
            # Check selected subject
            selected = self.subject_var.get()
            chosen_file = None
            
            if selected == "Auto-Detect":
                # Try to match based on subject name
                subj_name = practice_exam['subject']
                # Search existing
                for p, name in self.subjects_map.items():
                    if name.lower() == subj_name.lower():
                        chosen_file = p
                        break
                
                if not chosen_file:
                    # Create new
                    slug = "".join([c for c in subj_name if c.isalnum()]).lower()
                    chosen_file = os.path.join("subjects", f"{slug}.json")
            else:
                # Find file for selected name
                for p, name in self.subjects_map.items():
                    if name == selected:
                        chosen_file = p
                        break

            self.log(f"Saving to {chosen_file}...")
            
            # Load or Init Target Data
            if os.path.exists(chosen_file):
                with open(chosen_file, 'r') as f:
                    final_data = json.load(f)
            else:
                final_data = {
                    "meta": {
                        "id": "".join([c for c in practice_exam['subject'] if c.isalnum()]).lower(),
                        "name": practice_exam['subject'],
                        "code": practice_exam['subject'][:4].upper()
                    },
                    "exams": []
                }

            # Append Exam
            # Avoid duplicates?
            existing_ids = [e['id'] for e in final_data['exams']]
            if practice_exam['id'] in existing_ids:
                 # Update
                 for i, e in enumerate(final_data['exams']):
                     if e['id'] == practice_exam['id']:
                         final_data['exams'][i] = practice_exam
            else:
                final_data['exams'].append(practice_exam)
            
            with open(chosen_file, 'w') as f:
                json.dump(final_data, f, indent=2)

            # 5. Handle Images
            # We need to move images from 'scraped_data_temp/...' to 'img/subject_slug/exam_id/...' or similar
            # Currently practice.html expects images to be relative or absolute.
            # Let's put them in 'subjects/images/{exam_id}/'
            
            img_target_dir = os.path.join("subjects", "images", practice_exam['id'])
            if not os.path.exists(img_target_dir):
                os.makedirs(img_target_dir)
            
            self.log(f"Moving {len(copy_ops)} images...")
            
            for src, filename in copy_ops:
                dst = os.path.join(img_target_dir, filename)
                shutil.copy2(src, dst)
            
            # We also need to update the image paths in the saved JSON to point to 'subjects/images/{exam_id}/{filename}'
            # Wait, the `cleaner.py` returned 'images/filename'.
            # If `index.html` serves from root, then 'subjects/ba.json' is loaded.
            # Images should be relative to where the HTML is, or valid URLs.
            # If HTML is in root, and json is in 'subjects/', and images in 'subjects/images/...', 
            # we need the paths in JSON to be 'subjects/images/{exam_id}/{filename}'.
            
            # Retouch the saved file to fix paths
            self._fix_image_paths(chosen_file, practice_exam['id'])

            self.log("Success! Paper added.")
            self.root.after(0, self.load_subjects)
            
        except Exception as e:
            self.log(f"Error: {e}")
            import traceback
            traceback.print_exc()
        finally:
            self.root.after(0, lambda: self.btn_scrape.state(['!disabled']))

    def convert_to_practice(self, clean_data):
        meta = clean_data['metadata']
        import time
        exam_uuid = f"exam-{int(time.time())}"
        
        title = meta.get('paper_name', 'Custom Exam')
        
        new_exam = {
            "id": exam_uuid,
            "title": title,
            "subject": meta.get('subject', 'Unknown'),
            "year": str(meta.get('year', 2024)),
            "duration": meta.get('duration', 60),
            "marks": meta.get('total_marks', 0),
            "questions": []
        }

        for idx, q in enumerate(clean_data['questions']):
            text = q['text']
            
            # Check images
            # clean_data has 'images/foo.png'. We will relocate these later.
            # For now, keep the filename logic but prepare for path fix.
            
            if q.get('images'):
                for img_url in q['images']:
                    # Markdown embed or just list?
                    text += f"\n\n![Image]({img_url})"

            options_text = []
            correct_indices = []
            
            for i, opt in enumerate(q['options']):
                opt_txt = opt['text'] or ""
                if opt.get('image'):
                    opt_txt += f" ![Image]({opt['image']})"
                options_text.append(opt_txt)
                if opt['is_correct']:
                    correct_indices.append(i)
            
            new_q = {
                "id": f"{exam_uuid}-q{idx+1}",
                "type": q['type'],
                "marks": q['marks'],
                "text": text,
                "options": options_text,
            }
            
            if q['type'] in ['MCQ', 'Boolean']:
                 if correct_indices: new_q['correctIndex'] = correct_indices[0]
            elif q['type'] == 'MSQ':
                 new_q['correctIndex'] = correct_indices
            elif q['type'] == 'NAT':
                 new_q['correctValue'] = q['correct_answer']
            
            new_exam['questions'].append(new_q)
            
        return new_exam

    def _fix_image_paths(self, json_path, exam_id):
        # Re-open, fix paths, save
        with open(json_path, 'r') as f:
            data = json.load(f)
            
        # Helper to recurse
        def fix_p(txt):
            # Regex to find 'images/...' and replace with 'subjects/images/exam_id/...'
            # clean_data produced 'images/filename'
            # We want 'subjects/images/{exam_id}/filename'
            if not txt: return txt
            return txt.replace("images/", f"subjects/images/{exam_id}/")

        for exam in data['exams']:
            if exam['id'] == exam_id:
                for q in exam['questions']:
                    q['text'] = fix_p(q['text'])
                    q['options'] = [fix_p(o) for o in q['options']]

        with open(json_path, 'w') as f:
            json.dump(data, f, indent=2)

    def open_practice(self):
        sel = self.tree.selection()
        if not sel: return
        
        # We need to know which file it is.
        # Tree tags store the path? I added it to tags.
        path = self.tree.item(sel[0], 'tags')[0]
        filename = os.path.basename(path).replace(".json", "")
        
        # We also need to pick an exam inside it, or just open "Subjects" view in Index?
        # The user wants to "edit paper". 
        # Let's open index.html?subject=filename
        # Or better: open practice.html directly if we ask user to pick an exam from a sub-list.
        
        # Simple approach: Open Index
        url = f"{SERVER_URL}/index.html"
        webbrowser.open(url)

    def open_folder(self):
        os.system("open subjects")

if __name__ == "__main__":
    app = App()
    app.mainloop()
