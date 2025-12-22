
import json
import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
import os

FILES = {
    'Courses': 'courses.json',
    'Reviews': 'reviews.json'
}

BASE_DIR = os.path.dirname(__file__)

class WikiEditor:
    def __init__(self, root):
        self.root = root
        self.root.title("Wiki Editor")
        self.root.geometry("1000x800")
        
        self.mode_var = tk.StringVar(value='Courses')
        
        top_frame = tk.Frame(self.root)
        top_frame.pack(fill=tk.X, padx=10, pady=5)
        
        tk.Label(top_frame, text="Editing:").pack(side=tk.LEFT)
        ttk.Combobox(top_frame, textvariable=self.mode_var, values=list(FILES.keys()), state='readonly').pack(side=tk.LEFT, padx=5)
        tk.Button(top_frame, text="Load", command=self.load_data).pack(side=tk.LEFT)
        tk.Button(top_frame, text="Save JSON", command=self.save_data, bg='green').pack(side=tk.RIGHT)
        
        self.tree_frame = tk.Frame(self.root)
        self.tree_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)
        
        self.editor_frame = tk.LabelFrame(self.root, text="Edit Details")
        self.editor_frame.pack(fill=tk.X, padx=10, pady=10)
        
        self.data = []
        self.current_file = ''
        
        self.load_data()

    def load_data(self):
        mode = self.mode_var.get()
        self.current_file = FILES[mode]
        path = os.path.join(BASE_DIR, self.current_file)
        
        try:
            with open(path, 'r') as f:
                self.data = json.load(f)
        except:
            self.data = []
            
        self.build_ui(mode)
        self.refresh_table()

    def save_data(self):
        path = os.path.join(BASE_DIR, self.current_file)
        try:
            with open(path, 'w') as f:
                json.dump(self.data, f, indent=2)
            messagebox.showinfo("Success", "Saved!")
        except Exception as e:
            messagebox.showerror("Error", str(e))

    def build_ui(self, mode):
        # Clear existing
        for w in self.tree_frame.winfo_children(): w.destroy()
        for w in self.editor_frame.winfo_children(): w.destroy()
        
        if mode == 'Courses':
            cols = ['id', 'code', 'name', 'level', 'difficulty']
            self.fields = ['id', 'code', 'name', 'level', 'credits', 'difficulty', 'workload', 'tags', 'description', 
                           'prerequisites', 'syllabus', 'resources', 'reviews', 'gradeStats']
        else:
            cols = ['id', 'courseCode', 'courseName', 'difficulty']
            self.fields = ['id', 'courseCode', 'courseName', 'difficulty', 'workload', 'tags', 'advice']

        # Tree
        self.tree = ttk.Treeview(self.tree_frame, columns=cols, show='headings')
        for c in cols:
            self.tree.heading(c, text=c.title())
            self.tree.column(c, width=100)
        self.tree.pack(fill=tk.BOTH, expand=True)
        self.tree.bind('<<TreeviewSelect>>', self.on_select)
        
        # Editor Fields
        self.entries = {}
        for i, f in enumerate(self.fields):
            r = i // 3
            c = (i % 3) * 2
            tk.Label(self.editor_frame, text=f.title()).grid(row=r, column=c, sticky='e', padx=5, pady=2)
            e = tk.Entry(self.editor_frame, width=20)
            e.grid(row=r, column=c+1, sticky='w', padx=5, pady=2)
            self.entries[f] = e
            
        btn_frame = tk.Frame(self.root)
        btn_frame.pack(fill=tk.X, padx=10, pady=5)
        tk.Button(btn_frame, text="Add New", command=self.add_item).pack(side=tk.LEFT)
        tk.Button(btn_frame, text="Update Selected", command=self.update_item).pack(side=tk.LEFT, padx=5)
        tk.Button(btn_frame, text="Delete Selected", command=self.del_item).pack(side=tk.LEFT, padx=5)

    def refresh_table(self):
        self.tree.delete(*self.tree.get_children())
        cols = self.tree['columns']
        for item in self.data:
            vals = [item.get(c, '') for c in cols]
            self.tree.insert('', tk.END, values=vals)

    def on_select(self, e):
        sel = self.tree.selection()
        if not sel: return
        idx = self.tree.index(sel[0])
        item = self.data[idx]
        
        for f, e in self.entries.items():
            val = item.get(f, '')
            if isinstance(val, (list, dict)): val = json.dumps(val)
            e.delete(0, tk.END)
            e.insert(0, str(val))

    def get_form_data(self):
        d = {}
        for f, e in self.entries.items():
            val = e.get()
            # Try parsing JSON for list/dict fields
            if f in ['tags', 'prerequisites', 'syllabus', 'resources', 'reviews', 'gradeStats']:
                try: val = json.loads(val)
                except: pass
            # Try nums
            if f in ['credits', 'difficulty', 'workload', 'rating']:
                try: val = float(val) if '.' in val else int(val)
                except: pass
            d[f] = val
        return d

    def add_item(self):
        self.data.append(self.get_form_data())
        self.refresh_table()

    def update_item(self):
        sel = self.tree.selection()
        if not sel: return
        idx = self.tree.index(sel[0])
        self.data[idx] = self.get_form_data()
        self.refresh_table()

    def del_item(self):
        sel = self.tree.selection()
        if not sel: return
        idx = self.tree.index(sel[0])
        del self.data[idx]
        self.refresh_table()

if __name__ == "__main__":
    root = tk.Tk()
    app = WikiEditor(root)
    root.mainloop()
