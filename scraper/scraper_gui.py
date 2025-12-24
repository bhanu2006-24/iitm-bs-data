import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
import threading
import sys
import os
import json
import webbrowser

# Import existing logic
from scraper import QuizScraper
# We need to import the cleaning logic too. 
# Since clean_data.py is a script with a main(), let's import the specific function or run it as subprocess.
# Better to import. 
# Note: clean_data.py has a main() block. I might need to make 'process_file' and 'main' accessible.
# I previously modified clean_data.py. Let's inspect if I can invoke the cleaning easily.

class ScraperApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Quiz Scraper Studio")
        self.root.geometry("600x450")
        self.root.configure(bg="#1e1e1e")
        
        # Style
        style = ttk.Style()
        style.theme_use('clam')
        style.configure("TFrame", background="#1e1e1e")
        style.configure("TLabel", background="#1e1e1e", foreground="#ffffff", font=("Segoe UI", 10))
        style.configure("TButton", background="#007acc", foreground="white", font=("Segoe UI", 9, "bold"))
        style.map("TButton", background=[('active', '#005f9e')])
        style.configure("Header.TLabel", font=("Segoe UI", 16, "bold"), foreground="#007acc")

        # Layout
        main_frame = ttk.Frame(root, padding="20")
        main_frame.pack(fill=tk.BOTH, expand=True)

        # Header
        ttk.Label(main_frame, text="Quiz Practice Scraper", style="Header.TLabel").pack(pady=(0, 20))

        # Input
        ttk.Label(main_frame, text="Quiz Paper URL:").pack(anchor=tk.W)
        self.url_var = tk.StringVar()
        self.url_entry = tk.Entry(main_frame, textvariable=self.url_var, bg="#2d2d2d", fg="white", insertbackground="white", relief="flat", font=("Consolas", 10))
        self.url_entry.pack(fill=tk.X, pady=(5, 15), ipady=5)
        # Default value for testing
        self.url_var.set("https://quizpractice.space/question-paper/practise/1/f0beff73-e2e")

        # Options
        opts_frame = ttk.Frame(main_frame)
        opts_frame.pack(fill=tk.X, pady=(0, 20))
        
        self.compress_var = tk.BooleanVar(value=True)
        # Tkinter Checkbutton styling is tricky in dark mode, stick to standard or simplistic
        cb = tk.Checkbutton(opts_frame, text="Download & Compress Images", variable=self.compress_var, 
                            bg="#1e1e1e", fg="white", selectcolor="#2d2d2d", activebackground="#1e1e1e", activeforeground="white")
        cb.pack(side=tk.LEFT)

        # Actions
        btn_frame = ttk.Frame(main_frame)
        btn_frame.pack(fill=tk.X, pady=(0, 20))
        
        self.scrape_btn = ttk.Button(btn_frame, text="Scrape & Save", command=self.start_scraping)
        self.scrape_btn.pack(side=tk.LEFT, padx=(0, 10))
        
        ttk.Button(btn_frame, text="Open Library", command=self.open_library).pack(side=tk.LEFT)

        # Log Area
        ttk.Label(main_frame, text="Logs:").pack(anchor=tk.W)
        self.log_area = scrolledtext.ScrolledText(main_frame, bg="#111", fg="#00ff00", height=10, font=("Consolas", 9), relief="flat")
        self.log_area.pack(fill=tk.BOTH, expand=True, pady=(5, 0))

    def log(self, msg):
        self.log_area.insert(tk.END, f"> {msg}\n")
        self.log_area.see(tk.END)

    def start_scraping(self):
        url = self.url_var.get().strip()
        if not url:
            messagebox.showerror("Error", "Please enter a URL")
            return
            
        self.scrape_btn.state(['disabled'])
        self.log("Starting process...")
        
        # Run in thread
        t = threading.Thread(target=self.run_process, args=(url,))
        t.start()
        
    def run_process(self, url):
        try:
            # 1. Scrape
            self.log(f"Scraping: {url}")
            scraper = QuizScraper()
            
            # We need to know where it saves. Scraper saves to 'scraped_data/...'
            # We'll use a temp dummy path parts list to ensure it goes somewhere predictable or parse from URL?
            # actually scraper logic tries to guess path parts or uses args.
            
            # Let's use a "Single_Scrape" bucket for easier finding
            # Or assume user wants it properly organized.
            # Scraper doesn't auto-guess Path Parts from URL content easily without fetching.
            # But the 'scrape_paper' method fetches props first.
            
            # Let's peek at metadata first? No, 'scrape_paper' does it all.
            # We'll pass generic path parts and let clean_data fix it?
            # Logic in scraper.py: save_to_disk uses path_parts.
            # If we don't pass path_parts, it returns dict but doesn't save to specific folder structure we want?
            
            # Let's modify scraper call to just return data, then WE save it or scrape to a temp location.
            # Actually scraper.py's scrape_paper returns the data dict too.
            
            data = scraper.scrape_paper(url, path_parts=["Manual_Import", "General", "Bundle", "New_Paper"], save_to_disk=True, download_images=self.compress_var.get())
            
            if not data:
                self.log("Error: Scraper returned no data.")
                return

            self.log("Scrape success. Cleaning data...")
            
            # 2. Clean
            # We need to run clean_data.py logic
            # clean_data.py has a main loop that walks 'scraped_data'.
            # We just added a file to 'scraped_data/Manual_Import/...'.
            # So running clean_data.py's main() should pick it up!
            
            import clean_data
            # Redirect stdout? Or just run it.
            # I'll invoke the main function if possible, or subprocess it to keep clean.
            
            import subprocess
            # Use same python interpreter
            cmd = [sys.executable, 'clean_data.py']
            process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            
            while True:
                line = process.stdout.readline()
                if not line and process.poll() is not None:
                    break
                if line:
                    self.log(line.strip())
            
            if process.returncode == 0:
                self.log("Processing Complete!")
                self.log("Paper added to library.")
                messagebox.showinfo("Success", "Paper scraped and ready to view!")
            else:
                 self.log(f"Cleaner failed: {process.stderr.read()}")
                 
        except Exception as e:
            self.log(f"Error: {str(e)}")
            import traceback
            traceback.print_exc()
        finally:
             self.root.after(0, lambda: self.scrape_btn.state(['!disabled']))

    def open_library(self):
        webbrowser.open('http://127.0.0.1:5500/index.html') # Assumption or file?
        # Ideally open the file directly if no server, but browser might block CORS if we didn't fix that.
        # But we fixed index.html to read local json? Not exactly, 'fetch' doesn't work on file:// protocol for local JSON usually due to CORS.
        # User should run a server. 
        self.log("Hint: Ensure you are running a local server (e.g. Live Server) to view index.html")
        path = os.path.abspath("index.html")
        self.log(f"File: {path}")

if __name__ == "__main__":
    root = tk.Tk()
    app = ScraperApp(root)
    root.mainloop()
