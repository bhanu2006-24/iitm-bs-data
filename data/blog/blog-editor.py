import json
import tkinter as tk
from tkinter import ttk, messagebox
import os

FILE_PATH = os.path.join(os.path.dirname(__file__), 'posts.json')

class BlogEditor:
    def __init__(self, root):
        self.root = root
        self.root.title("Blog Posts Editor")
        self.root.geometry("900x700")

        self.posts = []
        self.load_data()

        self.create_widgets()

    def load_data(self):
        try:
            with open(FILE_PATH, 'r') as f:
                self.posts = json.load(f)
        except Exception as e:
            messagebox.showerror("Error", f"Failed to load data: {e}")
            self.posts = []

    def save_data(self):
        try:
            with open(FILE_PATH, 'w') as f:
                json.dump(self.posts, f, indent=2)
            messagebox.showinfo("Success", "Data saved successfully!")
        except Exception as e:
            messagebox.showerror("Error", f"Failed to save data: {e}")

    def create_widgets(self):
        # List Frame
        list_frame = tk.Frame(self.root, width=250)
        list_frame.pack(side=tk.LEFT, fill=tk.Y, padx=5, pady=5)

        self.listbox = tk.Listbox(list_frame)
        self.listbox.pack(fill=tk.BOTH, expand=True)
        self.listbox.bind('<<ListboxSelect>>', self.on_select)

        btn_frame = tk.Frame(list_frame)
        btn_frame.pack(fill=tk.X, pady=5)
        tk.Button(btn_frame, text="Add New", command=self.add_post).pack(fill=tk.X)
        tk.Button(btn_frame, text="Delete", command=self.delete_post).pack(fill=tk.X)
        tk.Button(btn_frame, text="Save JSON", command=self.save_data, bg='green').pack(fill=tk.X, pady=5)

        # Editor Frame
        editor_frame = tk.Frame(self.root)
        editor_frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=10, pady=10)

        # Fields
        self.entries = {}
        fields = ['id', 'title', 'excerpt', 'author', 'date', 'readTime', 'tags']
        
        for i, field in enumerate(fields):
            tk.Label(editor_frame, text=field.title()).grid(row=i, column=0, sticky='ne', padx=5, pady=2)
            if field == 'tags':
               entry = tk.Entry(editor_frame)
               tk.Label(editor_frame, text="(comma separated)").grid(row=i, column=2, sticky='w')
            else:
               entry = tk.Entry(editor_frame, width=50)
            entry.grid(row=i, column=1, sticky='ew', padx=5, pady=2)
            self.entries[field] = entry

        # Content (Text Area)
        tk.Label(editor_frame, text="Content (HTML)").grid(row=len(fields), column=0, sticky='ne', padx=5, pady=2)
        self.content_text = tk.Text(editor_frame, height=15, width=50)
        self.content_text.grid(row=len(fields), column=1, sticky='nsew', padx=5, pady=2)
        
        # Save Changes Button
        tk.Button(editor_frame, text="Update Post", command=self.update_post).grid(row=len(fields)+1, column=1, sticky='e', pady=10)

        # Grid config
        editor_frame.columnconfigure(1, weight=1)
        editor_frame.rowconfigure(len(fields), weight=1)

        self.refresh_list()

    def refresh_list(self):
        self.listbox.delete(0, tk.END)
        for p in self.posts:
            self.listbox.insert(tk.END, p.get('title', 'Untitled'))

    def on_select(self, event):
        idx = self.listbox.curselection()
        if not idx: return
        post = self.posts[idx[0]]
        
        for k, v in self.entries.items():
            v.delete(0, tk.END)
            val = post.get(k, '')
            if k == 'tags' and isinstance(val, list):
                val = ", ".join(val)
            v.insert(0, str(val))
        
        self.content_text.delete('1.0', tk.END)
        self.content_text.insert('1.0', post.get('content', ''))

    def get_data_from_form(self):
        data = {}
        for k, v in self.entries.items():
            val = v.get()
            if k == 'tags':
                data[k] = [t.strip() for t in val.split(',') if t.strip()]
            else:
                data[k] = val
        data['content'] = self.content_text.get('1.0', tk.END).strip()
        return data

    def add_post(self):
        new_post = {'id': str(len(self.posts)), 'title': 'New Post', 'content': ''}
        self.posts.append(new_post)
        self.refresh_list()
        self.listbox.selection_clear(0, tk.END)
        self.listbox.selection_set(tk.END)
        self.on_select(None)

    def update_post(self):
        idx = self.listbox.curselection()
        if not idx: return
        data = self.get_data_from_form()
        self.posts[idx[0]] = data
        self.refresh_list()
        # Restore selection
        self.listbox.selection_set(idx)

    def delete_post(self):
        idx = self.listbox.curselection()
        if not idx: return
        if messagebox.askyesno("Confirm", "Delete selected post?"):
            del self.posts[idx[0]]
            self.refresh_list()
            # Clear form
            for v in self.entries.values(): v.delete(0, tk.END)
            self.content_text.delete('1.0', tk.END)

if __name__ == "__main__":
    root = tk.Tk()
    app = BlogEditor(root)
    root.mainloop()
