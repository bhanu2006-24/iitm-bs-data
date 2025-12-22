
import json
import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext, filedialog
import os
import glob

# Constants
BASE_DIR = os.path.dirname(__file__)
LIST_FILE = os.path.join(BASE_DIR, 'list.json')
WIKI_FILE = os.path.join(os.path.dirname(BASE_DIR), 'wiki', 'courses.json')
CONTENT_DIR = os.path.join(BASE_DIR, 'content')

# Color Scheme (Modern Dark)
BG_COLOR = "#2c3e50"
FG_COLOR = "#ecf0f1"
ACCENT_COLOR = "#3498db"
SIDEBAR_BG = "#34495e"
LIST_BG = "#2c3e50"
LIST_FG = "#ecf0f1"

class ModernCourseEditor:
    def __init__(self, root):
        self.root = root
        self.root.title("GenZ Course Master")
        self.root.geometry("1400x900")
        self.root.configure(bg=BG_COLOR)
        
        # Styles
        style = ttk.Style()
        style.theme_use('clam')
        style.configure("TFrame", background=BG_COLOR)
        style.configure("TLabel", background=BG_COLOR, foreground=FG_COLOR, font=('Helvetica', 11))
        style.configure("TButton", background=ACCENT_COLOR, foreground="white", font=('Helvetica', 10, 'bold'), borderwidth=0)
        style.map("TButton", background=[('active', '#2980b9')])
        style.configure("TNotebook", background=BG_COLOR, tabposition='n')
        style.configure("TNotebook.Tab", background=SIDEBAR_BG, foreground=FG_COLOR, padding=[10, 5], font=('Helvetica', 10))
        style.map("TNotebook.Tab", background=[('selected', ACCENT_COLOR)])
        
        # Data Stores
        self.list_data = [] # Admin data
        self.wiki_data = [] # Content data (Wiki)
        self.content_data = {} # Detailed content (Weeks) mapped by Code
        
        self.load_all_data()
        
        # UI Layout
        self.create_sidebar()
        self.create_main_panel()
        
        self.refresh_sidebar()

    def load_all_data(self):
        # Load List
        try:
            with open(LIST_FILE, 'r') as f: self.list_data = json.load(f)
        except: self.list_data = []
        
        # Load Wiki
        try:
            with open(WIKI_FILE, 'r') as f: self.wiki_data = json.load(f)
        except: self.wiki_data = []
        
        # Load Content Files
        self.content_data = {}
        if os.path.exists(CONTENT_DIR):
            for f in glob.glob(os.path.join(CONTENT_DIR, '*.json')):
                code = os.path.basename(f).replace('.json', '')
                try:
                    with open(f, 'r') as fp: self.content_data[code] = json.load(fp)
                except: pass

    def save_all_data(self):
        # Save List
        try:
            with open(LIST_FILE, 'w') as f: json.dump(self.list_data, f, indent=2)
        except Exception as e: messagebox.showerror("Error", f"List Save: {e}")
        
        # Save Wiki
        try:
            with open(WIKI_FILE, 'w') as f: json.dump(self.wiki_data, f, indent=2)
        except Exception as e: messagebox.showerror("Error", f"Wiki Save: {e}")
        
        # Save Content
        if not os.path.exists(CONTENT_DIR): os.makedirs(CONTENT_DIR)
        for code, data in self.content_data.items():
            path = os.path.join(CONTENT_DIR, f"{code}.json")
            try:
                with open(path, 'w') as f: json.dump(data, f, indent=2)
            except Exception as e: messagebox.showerror("Error", f"Content Save {code}: {e}")
            
        messagebox.showinfo("Success", "All data saved successfully!")

    def create_sidebar(self):
        frame = tk.Frame(self.root, bg=SIDEBAR_BG, width=300)
        frame.pack(side=tk.LEFT, fill=tk.Y)
        
        tk.Label(frame, text="Courses", bg=SIDEBAR_BG, fg=FG_COLOR, font=('Helvetica', 16, 'bold')).pack(pady=10)
        
        # Filter
        self.filter_var = tk.StringVar()
        self.filter_var.trace('w', lambda *args: self.refresh_sidebar())
        tk.Entry(frame, textvariable=self.filter_var, bg='#ecf0f1', fg='#2c3e50').pack(fill=tk.X, padx=10, pady=5)
        
        # Listbox
        self.course_list = tk.Listbox(frame, bg=LIST_BG, fg=LIST_FG, selectbackground=ACCENT_COLOR, borderwidth=0, highlightthickness=0, font=('Helvetica', 12))
        self.course_list.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        self.course_list.bind('<<ListboxSelect>>', self.on_course_select)
        
        # Buttons
        tk.Button(frame, text="Add New Course", bg=ACCENT_COLOR, fg='white', command=self.add_course).pack(fill=tk.X, padx=10, pady=5)
        tk.Button(frame, text="Save All Changes", bg='#27ae60', fg='white', command=self.save_all_data).pack(fill=tk.X, padx=10, pady=10)

    def create_main_panel(self):
        self.main_frame = tk.Frame(self.root, bg=BG_COLOR)
        self.main_frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=20, pady=20)
        
        # Header
        self.header_label = tk.Label(self.main_frame, text="Select a Course to Edit", font=('Helvetica', 24, 'bold'), bg=BG_COLOR, fg=FG_COLOR)
        self.header_label.pack(anchor='w', pady=(0, 20))
        
        # Notebook
        self.notebook = ttk.Notebook(self.main_frame)
        self.notebook.pack(fill=tk.BOTH, expand=True)
        
        # Tabs
        self.tab_admin = ttk.Frame(self.notebook)
        self.tab_wiki = ttk.Frame(self.notebook)
        self.tab_content = ttk.Frame(self.notebook)
        self.tab_resources = ttk.Frame(self.notebook)
        
        self.notebook.add(self.tab_admin, text="Overview (Admin)")
        self.notebook.add(self.tab_wiki, text="Description (Wiki)")
        self.notebook.add(self.tab_content, text="Content (Weeks & PyQs)")
        
        # We'll build form fields dynamically
        self.admin_entries = {}
        self.wiki_entries = {}
        
        self.build_admin_tab()
        self.build_wiki_tab()
        self.build_content_tab()

    def build_admin_tab(self):
        f = tk.Frame(self.tab_admin, bg=BG_COLOR)
        f.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)
        
        fields = ['id', 'code', 'name', 'credits', 'level', 'fee']
        for i, field in enumerate(fields):
            tk.Label(f, text=field.capitalize()).grid(row=i, column=0, sticky='w', pady=10)
            e = tk.Entry(f, width=40, font=('Helvetica', 12))
            e.grid(row=i, column=1, sticky='w', padx=20)
            self.admin_entries[field] = e

    def build_wiki_tab(self):
        f = tk.Frame(self.tab_wiki, bg=BG_COLOR)
        f.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)
        
        # Description
        tk.Label(f, text="Description").pack(anchor='w')
        self.desc_text = scrolledtext.ScrolledText(f, height=5, font=('Helvetica', 12))
        self.desc_text.pack(fill=tk.X, pady=(0, 20))
        
        # Metadata
        grid = tk.Frame(f, bg=BG_COLOR)
        grid.pack(fill=tk.X)
        self.wiki_entries['difficulty'] = self.create_entry(grid, "Difficulty (1-5)", 0, 0)
        self.wiki_entries['workload'] = self.create_entry(grid, "Workload (1-5)", 0, 1)
        
        tk.Label(f, text="Tags (comma sep)").pack(anchor='w', pady=(10,0))
        self.wiki_entries['tags'] = tk.Entry(f, font=('Helvetica', 12))
        self.wiki_entries['tags'].pack(fill=tk.X)

    def build_content_tab(self):
        f = tk.Frame(self.tab_content, bg=BG_COLOR)
        f.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)
        
        # Box for Weeks
        tk.Label(f, text="Weeks Structure").pack(anchor='w')
        
        self.weeks_tree = ttk.Treeview(f, columns=('num', 'title'), show='headings', height=10)
        self.weeks_tree.heading('num', text='#')
        self.weeks_tree.column('num', width=50)
        self.weeks_tree.heading('title', text='Title')
        self.weeks_tree.pack(fill=tk.X)
        self.weeks_tree.bind('<<TreeviewSelect>>', self.on_week_select)
        
        btn_frame = tk.Frame(f, bg=BG_COLOR)
        btn_frame.pack(fill=tk.X, pady=5)
        tk.Button(btn_frame, text="Add Week", command=self.add_week).pack(side=tk.LEFT)
        tk.Button(btn_frame, text="Delete Week", command=self.del_week).pack(side=tk.LEFT, padx=5)

        # Details of selected week
        self.week_frame = tk.LabelFrame(f, text="Selected Week Details", bg=BG_COLOR, fg=FG_COLOR)
        self.week_frame.pack(fill=tk.BOTH, expand=True, pady=10)
        
        tk.Label(self.week_frame, text="Title").grid(row=0, column=0, sticky='w')
        self.week_title = tk.Entry(self.week_frame, width=40)
        self.week_title.grid(row=0, column=1, sticky='w')
        tk.Button(self.week_frame, text="Update Title", command=self.update_week_title).grid(row=0, column=2, padx=10)

        # Lectures, Notes, Practice JSON Text areas (Simplified for now)
        nb = ttk.Notebook(self.week_frame)
        nb.grid(row=1, column=0, columnspan=3, sticky='nsew', pady=10)
        self.week_frame.grid_rowconfigure(1, weight=1)
        self.week_frame.grid_columnconfigure(1, weight=1)
        
        self.lectures_text = self.create_json_text(nb, "Lectures")
        self.notes_text = self.create_json_text(nb, "Notes")
        self.practice_text = self.create_json_text(nb, "Practice (PYQs)")

    def create_json_text(self, parent, title):
        f = tk.Frame(parent, bg=BG_COLOR)
        parent.add(f, text=title)
        t = scrolledtext.ScrolledText(f, font=('Courier', 11))
        t.pack(fill=tk.BOTH, expand=True)
        return t

    def create_entry(self, parent, label, r, c):
        tk.Label(parent, text=label).grid(row=r, column=c*2, sticky='w', padx=10, pady=5)
        e = tk.Entry(parent, width=15)
        e.grid(row=r, column=c*2+1, sticky='w', padx=10, pady=5)
        return e

    def refresh_sidebar(self):
        self.course_list.delete(0, tk.END)
        flt = self.filter_var.get().lower()
        for c in self.list_data:
            display = f"{c.get('code')} - {c.get('name')}"
            if flt in display.lower():
                self.course_list.insert(tk.END, display)

    def on_course_select(self, event):
        sel = self.course_list.curselection()
        if not sel: return
        
        # Get Code from display string
        display = self.course_list.get(sel[0])
        code = display.split(' - ')[0]
        
        self.load_course(code)

    def load_course(self, code):
        self.current_code = code
        
        # 1. Admin Data
        course = next((c for c in self.list_data if c['code'] == code), None)
        if course:
            self.header_label.config(text=f"Editing {course['name']}")
            for f, e in self.admin_entries.items():
                e.delete(0, tk.END)
                e.insert(0, str(course.get(f, '')))
        
        # 2. Wiki Data
        wiki = next((c for c in self.wiki_data if c['code'] == code), None)
        if wiki:
            self.desc_text.delete('1.0', tk.END)
            self.desc_text.insert('1.0', wiki.get('description', ''))
            self.wiki_entries['difficulty'].delete(0, tk.END)
            self.wiki_entries['difficulty'].insert(0, str(wiki.get('difficulty', '')))
            self.wiki_entries['workload'].delete(0, tk.END)
            self.wiki_entries['workload'].insert(0, str(wiki.get('workload', '')))
            self.wiki_entries['tags'].delete(0, tk.END)
            self.wiki_entries['tags'].insert(0, ",".join(wiki.get('tags', [])))
        else:
            # Clear if not found
            self.desc_text.delete('1.0', tk.END)
            for e in self.wiki_entries.values(): e.delete(0, tk.END)

        # 3. Content Data
        self.current_content = self.content_data.get(code, {'weeks': []})
        self.refresh_weeks()

    def refresh_weeks(self):
        self.weeks_tree.delete(*self.weeks_tree.get_children())
        for w in self.current_content.get('weeks', []):
            self.weeks_tree.insert('', tk.END, values=(w.get('weekNum'), w.get('title')))

    def on_week_select(self, event):
        sel = self.weeks_tree.selection()
        if not sel: return
        item = self.weeks_tree.item(sel[0])
        idx = self.weeks_tree.index(sel[0])
        self.current_week_idx = idx
        
        weeks = self.current_content.get('weeks', [])
        if idx < len(weeks):
            w = weeks[idx]
            self.week_title.delete(0, tk.END)
            self.week_title.insert(0, w.get('title', ''))
            
            self.set_json_text(self.lectures_text, w.get('lectures', []))
            self.set_json_text(self.notes_text, w.get('notes', []))
            self.set_json_text(self.practice_text, w.get('practice', []))

    def set_json_text(self, text_widget, data):
        text_widget.delete('1.0', tk.END)
        text_widget.insert('1.0', json.dumps(data, indent=2))

    def update_week_title(self):
        if hasattr(self, 'current_week_idx'):
            self.current_content['weeks'][self.current_week_idx]['title'] = self.week_title.get()
            self.refresh_weeks()

    def save_current_week_json(self):
        # Must be called before saving file to memory
        if hasattr(self, 'current_week_idx'):
            try:
                w = self.current_content['weeks'][self.current_week_idx]
                w['lectures'] = json.loads(self.lectures_text.get('1.0', tk.END))
                w['notes'] = json.loads(self.notes_text.get('1.0', tk.END))
                w['practice'] = json.loads(self.practice_text.get('1.0', tk.END))
            except Exception as e:
                messagebox.showerror("JSON Error", str(e))

    def add_week(self):
        num = len(self.current_content.get('weeks', [])) + 1
        self.current_content.setdefault('weeks', []).append({
            "weekNum": num,
            "title": f"Week {num}",
            "lectures": [],
            "notes": [],
            "practice": []
        })
        self.refresh_weeks()

    def del_week(self):
        sel = self.weeks_tree.selection()
        if not sel: return
        idx = self.weeks_tree.index(sel[0])
        del self.current_content['weeks'][idx]
        self.refresh_weeks()

    def add_course(self):
        # Minimal implementation
        new_code = "NEW101"
        self.list_data.append({"code": new_code, "name": "New Course", "id": new_code})
        self.wiki_data.append({"code": new_code, "name": "New Course", "id": new_code})
        self.content_data[new_code] = {"id": new_code, "weeks": []}
        self.refresh_sidebar()

if __name__ == "__main__":
    root = tk.Tk()
    app = ModernCourseEditor(root)
    root.mainloop()
