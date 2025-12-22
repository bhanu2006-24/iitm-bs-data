
import json
import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
import os

ICON_DIR = os.path.dirname(__file__)

class OppeEditor:
    def __init__(self, root):
        self.root = root
        self.root.title("OPPE Problems Editor")
        self.root.geometry("1100x800")
        
        self.files = {
            'Python': 'python.json',
            'Java': 'java.json',
            'SQL': 'sql.json',
            'Bash': 'system_commands.json',
            'PDSA': 'pdsa.json',
            'MLP': 'mlp.json'
        }
        self.current_file = 'Python' 
        self.problems = []
        
        # Sidebar for file selection
        self.sidebar = tk.Frame(self.root, width=150, bg='gray')
        self.sidebar.pack(side=tk.LEFT, fill=tk.Y)
        
        tk.Label(self.sidebar, text="Subject", bg='gray', fg='white', font=('Arial', 12, 'bold')).pack(pady=10)
        
        self.file_var = tk.StringVar(value='Python')
        for name in self.files:
            tk.Radiobutton(self.sidebar, text=name, variable=self.file_var, value=name, command=self.load_data, indicatoron=0, bg='lightgray', width=15).pack(pady=2, padx=5)

        # Main Layout
        self.main_frame = tk.Frame(self.root)
        self.main_frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True)
        
        self.create_widgets()
        self.load_data()

    def load_data(self):
        self.current_file = self.file_var.get()
        fname = self.files[self.current_file]
        fpath = os.path.join(ICON_DIR, fname)
        
        try:
            with open(fpath, 'r') as f:
                self.problems = json.load(f)
        except Exception as e:
            # messagebox.showerror("Error", f"Could not load {fname}: {e}")
            self.problems = []
        
        self.refresh_table()
        self.clear_form()

    def save_data(self):
        fname = self.files[self.current_file]
        fpath = os.path.join(ICON_DIR, fname)
        try:
            with open(fpath, 'w') as f:
                json.dump(self.problems, f, indent=2)
            messagebox.showinfo("Success", f"Saved {fname}!")
        except Exception as e:
            messagebox.showerror("Error", f"Failed to save: {e}")

    def create_widgets(self):
        # Top: Table of problems
        list_frame = tk.Frame(self.main_frame)
        list_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)
        
        cols = ('id', 'title', 'difficulty', 'examType', 'tags')
        self.tree = ttk.Treeview(list_frame, columns=cols, show='headings')
        for c in cols:
            self.tree.heading(c, text=c.title())
            w = 50 if c == 'id' else 100
            self.tree.column(c, width=w)
        
        self.tree.pack(fill=tk.BOTH, expand=True)
        self.tree.bind('<<TreeviewSelect>>', self.on_select)
        
        # Tool Bar
        btn_frame = tk.Frame(self.main_frame)
        btn_frame.pack(fill=tk.X, padx=10, pady=5)
        tk.Button(btn_frame, text="Add Problem", command=self.add_prob).pack(side=tk.LEFT)
        tk.Button(btn_frame, text="Update Problem", command=self.update_prob).pack(side=tk.LEFT, padx=5)
        tk.Button(btn_frame, text="Delete Problem", command=self.delete_prob).pack(side=tk.LEFT, padx=5)
        tk.Button(btn_frame, text="Save to File", command=self.save_data, bg='green').pack(side=tk.RIGHT)

        # Bottom: Detail Editor
        editor = tk.LabelFrame(self.main_frame, text="Problem Details")
        editor.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Fields Grid
        grid_frame = tk.Frame(editor)
        grid_frame.pack(fill=tk.X, padx=5, pady=5)
        
        self.entries = {}
        fields = ['id', 'title', 'difficulty', 'examType', 'tags', 'starterCode']
        
        for i, f in enumerate(fields):
            r = i // 2
            c = (i % 2) * 2
            tk.Label(grid_frame, text=f.title()).grid(row=r, column=c, sticky='w', padx=5)
            if f == 'starterCode':
               # Starter Code is usually big, but here putting in entry for layout simplicity, 
               # actually better to put it below separately
               continue
            entry = tk.Entry(grid_frame, width=30)
            entry.grid(row=r, column=c+1, sticky='w', padx=5)
            self.entries[f] = entry

        # Description and Code
        text_frame = tk.Frame(editor)
        text_frame.pack(fill=tk.BOTH, expand=True, padx=5)
        
        tk.Label(text_frame, text="Description").pack(anchor='w')
        self.desc_text = scrolledtext.ScrolledText(text_frame, height=4)
        self.desc_text.pack(fill=tk.X, padx=5)

        tk.Label(text_frame, text="Starter Code").pack(anchor='w')
        self.code_text = scrolledtext.ScrolledText(text_frame, height=8, font=('Courier', 10))
        self.code_text.pack(fill=tk.BOTH, expand=True, padx=5)

        # Test Cases (JSON string for simplicity)
        tk.Label(text_frame, text="Test Cases (JSON: [{input:..., output:...}])").pack(anchor='w')
        self.tc_text = tk.Entry(text_frame)
        self.tc_text.pack(fill=tk.X, padx=5, pady=5)


    def refresh_table(self):
        for r in self.tree.get_children(): self.tree.delete(r)
        for p in self.problems:
            tags = ",".join(p.get('tags', []))
            self.tree.insert('', tk.END, values=(p.get('id'), p.get('title'), p.get('difficulty'), p.get('examType'), tags))

    def on_select(self, event):
        sel = self.tree.selection()
        if not sel: return
        # Find item in list 
        # Using ID match might vary, index based is safer if sorted
        # Assuming index matches for now
        index = self.tree.index(sel[0])
        p = self.problems[index]
        
        for f in self.entries:
             val = p.get(f, '')
             if isinstance(val, list): val = ",".join(val)
             self.entries[f].delete(0, tk.END)
             self.entries[f].insert(0, str(val))
        
        self.desc_text.delete('1.0', tk.END)
        self.desc_text.insert('1.0', p.get('description', ''))
        
        self.code_text.delete('1.0', tk.END)
        self.code_text.insert('1.0', p.get('starterCode', ''))
        
        tc_str = json.dumps(p.get('testCases', []))
        self.tc_text.delete(0, tk.END)
        self.tc_text.insert(0, tc_str)

    def get_data(self):
        d = {}
        for f, e in self.entries.items():
            val = e.get()
            if f == 'tags': d[f] = [x.strip() for x in val.split(',') if x.strip()]
            else: d[f] = val
            
        d['description'] = self.desc_text.get('1.0', tk.END).strip()
        d['starterCode'] = self.code_text.get('1.0', tk.END).strip()
        
        try:
            d['testCases'] = json.loads(self.tc_text.get())
        except:
            d['testCases'] = []
            
        # Add static fields based on file
        if self.current_file == 'Python': d['subject'] = 'PYTHON'; d['language'] = 'python'
        elif self.current_file == 'Java': d['subject'] = 'JAVA'; d['language'] = 'java'
        elif self.current_file == 'SQL': d['subject'] = 'SQL'; d['language'] = 'sql'
        # ... etc
            
        return d

    def add_prob(self):
        self.problems.append(self.get_data())
        self.refresh_table()

    def update_prob(self):
        sel = self.tree.selection()
        if not sel: return
        idx = self.tree.index(sel[0])
        data = self.get_data()
        # Preserve some fields if needed
        self.problems[idx].update(data)
        self.refresh_table()

    def delete_prob(self):
        sel = self.tree.selection()
        if not sel: return
        if messagebox.askyesno("Confirm", "Delete?"):
            idx = self.tree.index(sel[0])
            del self.problems[idx]
            self.refresh_table()

    def clear_form(self):
        for e in self.entries.values(): e.delete(0, tk.END)
        self.desc_text.delete('1.0', tk.END)
        self.code_text.delete('1.0', tk.END)
        self.tc_text.delete(0, tk.END)

if __name__ == "__main__":
    root = tk.Tk()
    app = OppeEditor(root)
    root.mainloop()
