
import json
import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
import os

FILE_PATH = os.path.join(os.path.dirname(__file__), 'exams.json')

class PyqEditor:
    def __init__(self, root):
        self.root = root
        self.root.title("PYQ Exam Editor")
        self.root.geometry("1200x800")

        self.exams = []
        self.load_data()
        self.create_widgets()

    def load_data(self):
        try:
            with open(FILE_PATH, 'r') as f:
                self.exams = json.load(f)
        except Exception as e:
            messagebox.showerror("Error", str(e))
            self.exams = []

    def save_data(self):
        try:
            with open(FILE_PATH, 'w') as f:
                json.dump(self.exams, f, indent=2)
            messagebox.showinfo("Success", "Saved!")
        except Exception as e:
            messagebox.showerror("Error", str(e))

    def create_widgets(self):
        # Left: Exam List
        left_frame = tk.Frame(self.root, width=300)
        left_frame.pack(side=tk.LEFT, fill=tk.Y, padx=5, pady=5)
        
        tk.Label(left_frame, text="Exams", font=('bold',12)).pack()
        self.exam_list = tk.Listbox(left_frame)
        self.exam_list.pack(fill=tk.BOTH, expand=True)
        self.exam_list.bind('<<ListboxSelect>>', self.on_exam_select)
        
        tk.Button(left_frame, text="Add Exam", command=self.add_exam).pack(fill=tk.X)
        tk.Button(left_frame, text="Del Exam", command=self.del_exam).pack(fill=tk.X)
        tk.Button(left_frame, text="Save JSON", command=self.save_data, bg='green').pack(fill=tk.X, pady=5)

        # Right: Exam Detail + Question List
        right_frame = tk.Frame(self.root)
        right_frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=10, pady=5)
        
        # Exam Metadata
        meta_frame = tk.LabelFrame(right_frame, text="Exam Metadata")
        meta_frame.pack(fill=tk.X, pady=5)
        
        self.meta_entries = {}
        fields = ['id', 'title', 'subject', 'year', 'duration', 'marks']
        for i, f in enumerate(fields):
            tk.Label(meta_frame, text=f.title()).grid(row=0, column=i*2, sticky='e', padx=5)
            e = tk.Entry(meta_frame, width=15)
            e.grid(row=0, column=i*2+1, sticky='w', padx=5)
            self.meta_entries[f] = e
            
        tk.Button(meta_frame, text="Update Meta", command=self.update_meta).grid(row=1, column=0, columnspan=2)

        # Questions
        q_frame = tk.Frame(right_frame)
        q_frame.pack(fill=tk.BOTH, expand=True)
        
        tk.Label(q_frame, text="Questions").pack(anchor='w')
        
        # Question List (Treeview)
        cols = ('id', 'type', 'text', 'marks')
        self.q_tree = ttk.Treeview(q_frame, columns=cols, show='headings', height=8)
        self.q_tree.heading('id', text='ID'); self.q_tree.column('id', width=50)
        self.q_tree.heading('type', text='Type'); self.q_tree.column('type', width=80)
        self.q_tree.heading('text', text='Text'); self.q_tree.column('text', width=400)
        self.q_tree.heading('marks', text='Marks'); self.q_tree.column('marks', width=50)
        self.q_tree.pack(fill=tk.X, pady=5)
        self.q_tree.bind('<<TreeviewSelect>>', self.on_q_select)
        
        btn_q_frame = tk.Frame(q_frame)
        btn_q_frame.pack(fill=tk.X)
        tk.Button(btn_q_frame, text="Add Q", command=self.add_q).pack(side=tk.LEFT)
        tk.Button(btn_q_frame, text="Update Q", command=self.update_q).pack(side=tk.LEFT)
        tk.Button(btn_q_frame, text="Del Q", command=self.del_q).pack(side=tk.LEFT)

        # Question Detail Editor
        editor = tk.LabelFrame(q_frame, text="Question Details")
        editor.pack(fill=tk.BOTH, expand=True, pady=10)
        
        self.q_entries = {}
        q_fields = ['id', 'type', 'marks', 'negativeMarks', 'correctAnswer', 'correctIndex', 'imgUrl']
        
        gf = tk.Frame(editor)
        gf.pack(fill=tk.X)
        for i, f in enumerate(q_fields):
            tk.Label(gf, text=f).grid(row=0, column=i, padx=2)
            e = tk.Entry(gf, width=10)
            e.grid(row=1, column=i, padx=2)
            self.q_entries[f] = e

        tk.Label(editor, text="Question Text").pack(anchor='w')
        self.q_text = scrolledtext.ScrolledText(editor, height=3)
        self.q_text.pack(fill=tk.X)
        
        tk.Label(editor, text="Options (JSON: ['A','B'])").pack(anchor='w')
        self.q_opts = tk.Entry(editor)
        self.q_opts.pack(fill=tk.X)
        
        tk.Label(editor, text="Explanation").pack(anchor='w')
        self.q_expl = tk.Entry(editor)
        self.q_expl.pack(fill=tk.X)

        self.refresh_exam_list()

    def refresh_exam_list(self):
        self.exam_list.delete(0, tk.END)
        for e in self.exams:
            self.exam_list.insert(tk.END, e.get('title', 'Unknown'))

    def on_exam_select(self, event):
        idx = self.exam_list.curselection()
        if not idx: return
        self.curr_exam = self.exams[idx[0]]
        
        for f, e in self.meta_entries.items():
            e.delete(0, tk.END)
            e.insert(0, str(self.curr_exam.get(f, '')))
            
        self.refresh_q_list()

    def refresh_q_list(self):
        for r in self.q_tree.get_children(): self.q_tree.delete(r)
        if not hasattr(self, 'curr_exam'): return
        
        questions = self.curr_exam.get('questions', [])
        for q in questions:
            self.q_tree.insert('', tk.END, values=(q.get('id'), q.get('type'), q.get('question', '')[:50], q.get('marks')))

    def on_q_select(self, event):
        sel = self.q_tree.selection()
        if not sel: return
        idx = self.q_tree.index(sel[0])
        q = self.curr_exam['questions'][idx]
        
        for f, e in self.q_entries.items():
            e.delete(0, tk.END)
            e.insert(0, str(q.get(f, '')))
            
        self.q_text.delete('1.0', tk.END)
        self.q_text.insert('1.0', q.get('question', ''))
        
        self.q_opts.delete(0, tk.END)
        self.q_opts.insert(0, json.dumps(q.get('options', [])))
        
        self.q_expl.delete(0, tk.END)
        self.q_expl.insert(0, q.get('explanation', ''))

    def get_q_data(self):
        d = {}
        for f, e in self.q_entries.items():
            val = e.get()
            if f in ['marks', 'negativeMarks', 'correctIndex']:
                try: val = float(val) if '.' in val else int(val)
                except: val = 0
            d[f] = val
        d['question'] = self.q_text.get('1.0', tk.END).strip()
        try: d['options'] = json.loads(self.q_opts.get())
        except: d['options'] = []
        d['explanation'] = self.q_expl.get()
        return d

    def update_meta(self):
        if not hasattr(self, 'curr_exam'): return
        for f, e in self.meta_entries.items():
            val = e.get()
            if f in ['marks', 'duration']:
                try: val = int(val)
                except: val = 0
            self.curr_exam[f] = val
        self.refresh_exam_list()

    def add_exam(self):
        self.exams.append({'id': 'new', 'title': 'New Exam', 'questions': []})
        self.refresh_exam_list()

    def del_exam(self):
        idx = self.exam_list.curselection()
        if not idx: return
        del self.exams[idx[0]]
        self.refresh_exam_list()

    def add_q(self):
        if not hasattr(self, 'curr_exam'): return
        self.curr_exam['questions'].append(self.get_q_data())
        self.refresh_q_list()

    def update_q(self):
        sel = self.q_tree.selection()
        if not sel: return
        idx = self.q_tree.index(sel[0])
        self.curr_exam['questions'][idx].update(self.get_q_data())
        self.refresh_q_list()

    def del_q(self):
        sel = self.q_tree.selection()
        if not sel: return
        idx = self.q_tree.index(sel[0])
        del self.curr_exam['questions'][idx]
        self.refresh_q_list()

if __name__ == "__main__":
    root = tk.Tk()
    app = PyqEditor(root)
    root.mainloop()
