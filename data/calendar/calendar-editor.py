import json
import tkinter as tk
from tkinter import ttk, messagebox
import os

FILE_PATH = os.path.join(os.path.dirname(__file__), 'events.json')

class CalendarEditor:
    def __init__(self, root):
        self.root = root
        self.root.title("Calendar Events Editor")
        self.root.geometry("800x600")

        self.events = []
        self.load_data()

        # UI Layout
        self.create_widgets()

    def load_data(self):
        try:
            with open(FILE_PATH, 'r') as f:
                self.events = json.load(f)
        except Exception as e:
            messagebox.showerror("Error", f"Failed to load data: {e}")
            self.events = []

    def save_data(self):
        try:
            with open(FILE_PATH, 'w') as f:
                json.dump(self.events, f, indent=2)
            messagebox.showinfo("Success", "Data saved successfully!")
        except Exception as e:
            messagebox.showerror("Error", f"Failed to save data: {e}")

    def create_widgets(self):
        # Table
        columns = ('id', 'title', 'date', 'type')
        self.tree = ttk.Treeview(self.root, columns=columns, show='headings')
        for col in columns:
            self.tree.heading(col, text=col.title())
            self.tree.column(col, width=150)
        self.tree.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        self.tree.bind('<<TreeviewSelect>>', self.on_select)

        # Form Frame
        form_frame = tk.Frame(self.root)
        form_frame.pack(fill=tk.X, padx=10, pady=10)

        # Fields
        self.entries = {}
        for i, col in enumerate(columns):
            lbl = tk.Label(form_frame, text=col.title())
            lbl.grid(row=0, column=i, padx=5, sticky='w')
            entry = tk.Entry(form_frame)
            entry.grid(row=1, column=i, padx=5, sticky='ew')
            self.entries[col] = entry

        # Buttons
        btn_frame = tk.Frame(self.root)
        btn_frame.pack(fill=tk.X, padx=10, pady=10)

        tk.Button(btn_frame, text="Add New", command=self.add_entry).pack(side=tk.LEFT, padx=5)
        tk.Button(btn_frame, text="Update Selected", command=self.update_entry).pack(side=tk.LEFT, padx=5)
        tk.Button(btn_frame, text="Delete Selected", command=self.delete_entry).pack(side=tk.LEFT, padx=5)
        tk.Button(btn_frame, text="Save to File", command=self.save_data, bg='green').pack(side=tk.RIGHT, padx=5)

        self.refresh_table()

    def refresh_table(self):
        for row in self.tree.get_children():
            self.tree.delete(row)
        for item in self.events:
            self.tree.insert('', tk.END, values=(item.get('id', ''), item.get('title', ''), item.get('date', ''), item.get('type', '')))

    def on_select(self, event):
        selected = self.tree.selection()
        if not selected: return
        item = self.tree.item(selected[0])
        vals = item['values']
        if vals:
            for i, col in enumerate(('id', 'title', 'date', 'type')):
                self.entries[col].delete(0, tk.END)
                self.entries[col].insert(0, str(vals[i]))

    def get_data_from_form(self):
        return {
            'id': self.entries['id'].get(),
            'title': self.entries['title'].get(),
            'date': self.entries['date'].get(),
            'type': self.entries['type'].get()
        }

    def add_entry(self):
        data = self.get_data_from_form()
        if not data['id']:
            messagebox.showwarning("Warning", "ID is required")
            return
        self.events.append(data)
        self.refresh_table()
        self.clear_form()

    def update_entry(self):
        selected = self.tree.selection()
        if not selected: return
        data = self.get_data_from_form()
        # Find index in list (simple matching by previous values in tree might be tricky if ID changed, 
        # but for simplicity assuming we update basic fields. 
        # Better approach: find by index derived from tree index)
        index = self.tree.index(selected[0])
        self.events[index] = data
        self.refresh_table()

    def delete_entry(self):
        selected = self.tree.selection()
        if not selected: return
        if messagebox.askyesno("Confirm", "Delete selected item?"):
            index = self.tree.index(selected[0])
            del self.events[index]
            self.refresh_table()
            self.clear_form()

    def clear_form(self):
        for e in self.entries.values():
            e.delete(0, tk.END)

if __name__ == "__main__":
    root = tk.Tk()
    app = CalendarEditor(root)
    root.mainloop()
