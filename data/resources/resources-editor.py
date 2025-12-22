
import json
import tkinter as tk
from tkinter import ttk, messagebox
import os

FILE_PATH = os.path.join(os.path.dirname(__file__), 'items.json')

class ResourcesEditor:
    def __init__(self, root):
        self.root = root
        self.root.title("Resources Editor")
        self.root.geometry("900x600")

        self.items = []
        self.load_data()
        self.create_widgets()

    def load_data(self):
        try:
            with open(FILE_PATH, 'r') as f:
                self.items = json.load(f)
        except Exception as e:
            messagebox.showerror("Error", str(e))
            self.items = []

    def save_data(self):
        try:
            with open(FILE_PATH, 'w') as f:
                json.dump(self.items, f, indent=2)
            messagebox.showinfo("Success", "Saved!")
        except Exception as e:
            messagebox.showerror("Error", str(e))

    def create_widgets(self):
        cols = ('id', 'title', 'type', 'subject')
        self.tree = ttk.Treeview(self.root, columns=cols, show='headings')
        for c in cols:
            self.tree.heading(c, text=c.title())
            w = 50 if c == 'id' else 150
            self.tree.column(c, width=w)
        self.tree.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)
        self.tree.bind('<<TreeviewSelect>>', self.on_select)

        btn_frame = tk.Frame(self.root)
        btn_frame.pack(fill=tk.X, padx=10)
        tk.Button(btn_frame, text="Add", command=self.add_item).pack(side=tk.LEFT)
        tk.Button(btn_frame, text="Update", command=self.update_item).pack(side=tk.LEFT, padx=5)
        tk.Button(btn_frame, text="Delete", command=self.delete_item).pack(side=tk.LEFT, padx=5)
        tk.Button(btn_frame, text="Save JSON", command=self.save_data, bg='green').pack(side=tk.RIGHT)

        form_frame = tk.LabelFrame(self.root, text="Details")
        form_frame.pack(fill=tk.X, padx=10, pady=10)

        self.entries = {}
        fields = ['id', 'title', 'type', 'subject', 'url', 'description']
        for i, f in enumerate(fields):
            tk.Label(form_frame, text=f.title()).grid(row=i//2, column=(i%2)*2, sticky='e', padx=5, pady=2)
            e = tk.Entry(form_frame, width=30)
            e.grid(row=i//2, column=(i%2)*2+1, sticky='w', padx=5, pady=2)
            self.entries[f] = e

        self.refresh()

    def refresh(self):
        for r in self.tree.get_children(): self.tree.delete(r)
        for i in self.items:
            self.tree.insert('', tk.END, values=(i.get('id'), i.get('title'), i.get('type'), i.get('subject')))

    def on_select(self, e):
        sel = self.tree.selection()
        if not sel: return
        idx = self.tree.index(sel[0])
        item = self.items[idx]
        for f, entry in self.entries.items():
            entry.delete(0, tk.END)
            entry.insert(0, str(item.get(f, '')))

    def get_data(self):
        d = {}
        for f, entry in self.entries.items(): d[f] = entry.get()
        return d

    def add_item(self):
        self.items.append(self.get_data())
        self.refresh()

    def update_item(self):
        sel = self.tree.selection()
        if not sel: return
        idx = self.tree.index(sel[0])
        self.items[idx] = self.get_data()
        self.refresh()

    def delete_item(self):
        sel = self.tree.selection()
        if not sel: return
        idx = self.tree.index(sel[0])
        del self.items[idx]
        self.refresh()

if __name__ == "__main__":
    root = tk.Tk()
    app = ResourcesEditor(root)
    root.mainloop()
