
import json
import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
import os

FILE_PATH = os.path.join(os.path.dirname(__file__), 'list.json')

class CoursesEditor:
    def __init__(self, root):
        self.root = root
        self.root.title("Courses Editor")
        self.root.geometry("1000x700")

        self.courses = []
        self.load_data()
        self.create_widgets()

    def load_data(self):
        try:
            with open(FILE_PATH, 'r') as f:
                self.courses = json.load(f)
        except Exception as e:
            messagebox.showerror("Error", str(e))
            self.courses = []

    def save_data(self):
        try:
            with open(FILE_PATH, 'w') as f:
                json.dump(self.courses, f, indent=2)
            messagebox.showinfo("Success", "Saved!")
        except Exception as e:
            messagebox.showerror("Error", str(e))

    def create_widgets(self):
        # Table
        cols = ('id', 'code', 'name', 'credits', 'level', 'fee')
        self.tree = ttk.Treeview(self.root, columns=cols, show='headings')
        for c in cols:
            self.tree.heading(c, text=c.title())
            w = 50 if c == 'credits' else 100
            self.tree.column(c, width=w)
        self.tree.column('name', width=250)
        self.tree.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)
        self.tree.bind('<<TreeviewSelect>>', self.on_select)

        # Buttons
        btn_frame = tk.Frame(self.root)
        btn_frame.pack(fill=tk.X, padx=10)
        tk.Button(btn_frame, text="Add", command=self.add_course).pack(side=tk.LEFT)
        tk.Button(btn_frame, text="Update", command=self.update_course).pack(side=tk.LEFT, padx=5)
        tk.Button(btn_frame, text="Delete", command=self.delete_course).pack(side=tk.LEFT, padx=5)
        tk.Button(btn_frame, text="Save JSON", command=self.save_data, bg='green').pack(side=tk.RIGHT)

        # Editor
        form_frame = tk.LabelFrame(self.root, text="Course Details")
        form_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        self.entries = {}
        fields = ['id', 'code', 'name', 'credits', 'level', 'fee', 'type', 'pre']
        
        for i, f in enumerate(fields):
            tk.Label(form_frame, text=f.title()).grid(row=i//2, column=(i%2)*2, sticky='e', padx=5, pady=2)
            e = tk.Entry(form_frame, width=30)
            e.grid(row=i//2, column=(i%2)*2+1, sticky='w', padx=5, pady=2)
            self.entries[f] = e

        tk.Label(form_frame, text="Exams (JSON)").grid(row=4, column=0, sticky='e', padx=5)
        self.exams_entry = tk.Entry(form_frame, width=30)
        self.exams_entry.grid(row=4, column=1, sticky='w', padx=5)

        tk.Label(form_frame, text="Syllabus (Comma sep)").grid(row=4, column=2, sticky='e', padx=5)
        self.syllabus_entry = tk.Entry(form_frame, width=30)
        self.syllabus_entry.grid(row=4, column=3, sticky='w', padx=5)

        self.refresh_table()

    def refresh_table(self):
        for r in self.tree.get_children(): self.tree.delete(r)
        for c in self.courses:
            self.tree.insert('', tk.END, values=(c.get('id'), c.get('code'), c.get('name'), c.get('credits'), c.get('level'), c.get('fee')))

    def on_select(self, event):
        sel = self.tree.selection()
        if not sel: return
        idx = self.tree.index(sel[0])
        c = self.courses[idx]
        
        for f, e in self.entries.items():
            val = c.get(f, '')
            if isinstance(val, list): val = ",".join(val)
            e.delete(0, tk.END)
            e.insert(0, str(val))
            
        self.exams_entry.delete(0, tk.END)
        self.exams_entry.insert(0, json.dumps(c.get('exams', {})))

        self.syllabus_entry.delete(0, tk.END)
        val = c.get('syllabus', [])
        if isinstance(val, list): val = ",".join(val)
        self.syllabus_entry.insert(0, str(val))

    def get_data(self):
        d = {}
        for f, e in self.entries.items():
            val = e.get()
            if f == 'credits' or f == 'fee': 
                try: val = int(val)
                except: val = 0
            elif f == 'pre':
                val = [x.strip() for x in val.split(',') if x.strip()]
            d[f] = val
        
        try: d['exams'] = json.loads(self.exams_entry.get())
        except: d['exams'] = {}
        
        val = self.syllabus_entry.get()
        d['syllabus'] = [x.strip() for x in val.split(',') if x.strip()]
        
        return d

    def add_course(self):
        self.courses.append(self.get_data())
        self.refresh_table()

    def update_course(self):
        sel = self.tree.selection()
        if not sel: return
        idx = self.tree.index(sel[0])
        self.courses[idx] = self.get_data()
        self.refresh_table()

    def delete_course(self):
        sel = self.tree.selection()
        if not sel: return
        idx = self.tree.index(sel[0])
        del self.courses[idx]
        self.refresh_table()

if __name__ == "__main__":
    root = tk.Tk()
    app = CoursesEditor(root)
    root.mainloop()
