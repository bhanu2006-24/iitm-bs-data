
import json
import tkinter as tk
from tkinter import ttk, messagebox
import os

FILE_PATH = os.path.join(os.path.dirname(__file__), 'study_data.json')

class StudyEditor:
    def __init__(self, root):
        self.root = root
        self.root.title("Study Room Editor")
        self.root.geometry("800x600")

        self.data = {"wallpapers": [], "sounds": []}
        self.load_data()

        self.nb = ttk.Notebook(self.root)
        self.nb.pack(fill=tk.BOTH, expand=True)

        self.create_tab("Wallpapers", "wallpapers", ['id', 'name', 'url'])
        self.create_tab("Sounds", "sounds", ['id', 'name', 'url', 'icon'])

    def load_data(self):
        try:
            with open(FILE_PATH, 'r') as f:
                self.data = json.load(f)
        except Exception as e:
            messagebox.showerror("Error", str(e))

    def save_data(self):
        try:
            with open(FILE_PATH, 'w') as f:
                json.dump(self.data, f, indent=2)
            messagebox.showinfo("Success", "Saved!")
        except Exception as e:
            messagebox.showerror("Error", str(e))

    def create_tab(self, label, key, columns):
        frame = tk.Frame(self.nb)
        self.nb.add(frame, text=label)

        tree = ttk.Treeview(frame, columns=columns, show='headings')
        for c in columns:
            tree.heading(c, text=c.title())
        tree.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # Populate
        for item in self.data.get(key, []):
            vals = [item.get(c, '') for c in columns]
            tree.insert('', tk.END, values=vals)

        # Editor Frame
        edit_frame = tk.LabelFrame(frame, text="Edit")
        edit_frame.pack(fill=tk.X, padx=5, pady=5)
        
        entries = {}
        for i, c in enumerate(columns):
            tk.Label(edit_frame, text=c).grid(row=0, column=i, padx=5)
            e = tk.Entry(edit_frame)
            e.grid(row=1, column=i, padx=5)
            entries[c] = e
            
        def on_sel(event):
            sel = tree.selection()
            if not sel: return
            idx = tree.index(sel[0])
            item = self.data[key][idx]
            for c, e in entries.items():
                e.delete(0, tk.END)
                e.insert(0, str(item.get(c, '')))

        tree.bind('<<TreeviewSelect>>', on_sel)

        def add():
            d = {c: entries[c].get() for c in columns}
            self.data[key].append(d)
            refresh()
            
        def update():
            sel = tree.selection()
            if not sel: return
            idx = tree.index(sel[0])
            d = {c: entries[c].get() for c in columns}
            self.data[key][idx] = d
            refresh()
            
        def delete():
            sel = tree.selection()
            if not sel: return
            idx = tree.index(sel[0])
            del self.data[key][idx]
            refresh()
            
        def refresh():
            for r in tree.get_children(): tree.delete(r)
            for item in self.data.get(key, []):
                vals = [item.get(c, '') for c in columns]
                tree.insert('', tk.END, values=vals)

        btn_frame = tk.Frame(frame)
        btn_frame.pack(fill=tk.X, pady=5)
        tk.Button(btn_frame, text="Add", command=add).pack(side=tk.LEFT, padx=5)
        tk.Button(btn_frame, text="Update", command=update).pack(side=tk.LEFT, padx=5)
        tk.Button(btn_frame, text="Delete", command=delete).pack(side=tk.LEFT, padx=5)
        tk.Button(btn_frame, text="Save Data", command=self.save_data, bg='green').pack(side=tk.RIGHT, padx=5)

if __name__ == "__main__":
    root = tk.Tk()
    app = StudyEditor(root)
    root.mainloop()
