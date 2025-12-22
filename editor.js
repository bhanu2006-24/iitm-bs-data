// State
let currentModule = null;
let currentData = [];
let originalData = [];
let currentFilePath = "";

// Configuration
const modules = {
  blog: {
    path: "data/blog/posts.json",
    label: "Blog Posts",
    idField: "id",
    displayField: "title",
    schema: {
      id: { type: "string", readonly: true },
      title: { type: "string", label: "Title" },
      author: { type: "string", label: "Author" },
      date: { type: "string", label: "Date" },
      readTime: { type: "string", label: "Read Time" },
      excerpt: { type: "textarea", label: "Excerpt" },
      tags: { type: "array", label: "Tags (comma separated)" },
      content: { type: "textarea", label: "Content (HTML)", rows: 10 },
    },
  },
  courses: {
    path: "data/courses/list.json",
    label: "Courses",
    idField: "id",
    displayField: "name",
    schema: {
      id: { type: "string", label: "Course ID" },
      code: { type: "string", label: "Code" },
      name: { type: "string", label: "Course Name" },
      credits: { type: "number", label: "Credits" },
      level: {
        type: "select",
        label: "Level",
        options: [
          "Foundation",
          "Diploma (Prog)",
          "Diploma (DS)",
          "Degree (BSc)",
        ],
      },
      fee: { type: "number", label: "Fee" },
      type: { type: "string", label: "Type" },
      pre: { type: "array", label: "Prerequisites (IDs)" },
      syllabus: { type: "array", label: "Syllabus Topics" },
      // Nested 'exams' object omitted for simplicity or can be added as JSON text
    },
  },
  wiki: {
    path: "data/wiki/courses.json", // Main wiki file
    label: "Wiki Courses",
    idField: "id", // Assuming structure
    displayField: "title",
    schema: {
      id: { type: "string" },
      title: { type: "string" },
      description: { type: "textarea" },
    },
  },
  wiki_reviews: {
    path: "data/wiki/reviews.json",
    label: "Wiki Reviews",
    idField: "id",
    displayField: "courseId", 
    schema: {
      id: { type: "string" },
      courseId: { type: "string", label: "Course ID" },
      rating: { type: "number", label: "Rating (1-5)" },
      author: { type: "string" },
      review: { type: "textarea", label: "Review Text" }
    }
  },
  pyq: {
    path: "data/pyq/exams.json",
    label: "PYQ Exams",
    idField: "id",
    displayField: "title",
    schema: {
        id: { type: "string" },
        title: { type: "string", label: "Exam Title" },
        subject: { type: "string" },
        year: { type: "string" },
        duration: { type: "number", label: "Duration (mins)" },
        marks: { type: "number" },
        questions: { type: "textarea", rows: 10, label: "Questions JSON" }
    }
  },
  oppe: {
    path: "data/oppe/java.json", // Default, needs selector
    label: "OPPE (Java)",
    idField: "id",
    displayField: "title",
    schema: {
        id: { type: "string" },
        title: { type: "string" },
        excerpt: { type: "string" },
        content: { type: "textarea", label: "Content/Code" },
        tags: { type: "array" }
    }
  },
};

// Initialization
document.addEventListener("DOMContentLoaded", () => {
  // Check if we need to show file selector for OPPE
  const fileSelector = document.getElementById("file-selector");
  fileSelector.addEventListener("change", (e) => {
    loadModule(currentModule, e.target.value);
  });
});

async function loadModule(moduleName, specificPath = null) {
  currentModule = moduleName;
  const config = modules[moduleName];
  currentFilePath = specificPath || config.path;

  // Update UI
  document
    .querySelectorAll(".nav-item")
    .forEach((el) => el.classList.remove("bg-slate-800", "text-white"));
  // Highlight current (simplification: just remove active state from others)

  document.getElementById("page-title").innerText = config.label;

  // Handle OPPE special case
  const fileContainer = document.getElementById("file-selector-container");
  if (moduleName === "oppe") {
    fileContainer.classList.remove("hidden");
    renderFileSelector([
      "java.json",
      "python.json",
      "system_commands.json",
      "pdsa.json",
      "sql.json",
      "mlp.json",
    ]);
  } else {
    fileContainer.classList.add("hidden");
  }

  try {
    const response = await fetch(currentFilePath);
    if (!response.ok) throw new Error("Failed to load data");
    currentData = await response.json();
    originalData = JSON.parse(JSON.stringify(currentData)); // Deep copy

    renderList();
  } catch (err) {
    console.error(err);
    document.getElementById("content-area").innerHTML = `
            <div class="text-red-500 text-center p-8">
                <p>Error loading data: ${err.message}</p>
                <p class="text-sm mt-2 text-slate-400">Make sure you are running this via a local server (e.g., Live Server) or GitHub Pages.</p>
            </div>
        `;
  }
}

function renderFileSelector(files) {
  const sel = document.getElementById("file-selector");
  sel.innerHTML = "";
  files.forEach((f) => {
    const opt = document.createElement("option");
    opt.value = `data/oppe/${f}`;
    opt.innerText = f;
    opt.selected = currentFilePath.endsWith(f);
    sel.appendChild(opt);
  });
}

function renderList() {
  const container = document.getElementById("content-area");
  const config = modules[currentModule];

  if (!Array.isArray(currentData)) {
    // Handle object-based JSON (convert to array for listing if possible, or just edit raw)
    // For now, assume array or object with keys as IDs
    if (typeof currentData === "object") {
      // Basic support for object maps
      // We can convert to [ { key: ..., value: ... } ] for display
    }
  }

  let html = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Add New Card -->
            <div onclick="openAddModal()" class="glass-panel rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800/50 transition-all border-dashed border-2 border-slate-700 hover:border-cyan-500 group min-h-[200px]">
                <div class="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                    <svg class="w-6 h-6 text-slate-400 group-hover:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                </div>
                <span class="mt-4 text-slate-400 font-medium group-hover:text-white">Add New Item</span>
            </div>
    `;

  currentData.forEach((item, index) => {
    const title = item[config.displayField] || item.id || "Untitled";
    const subtitle = item.id || "";

    html += `
            <div onclick="openEditModal(${index})" class="glass-panel rounded-xl p-6 cursor-pointer hover:bg-slate-800/50 transition-all group relative overflow-hidden">
                <div class="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg class="w-5 h-5 text-slate-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                </div>
                <h3 class="text-lg font-bold text-white mb-2 line-clamp-1">${title}</h3>
                <p class="text-sm text-slate-400 font-mono mb-4">${subtitle}</p>
                 <div class="flex items-center space-x-2 mt-auto">
                    <span class="text-xs bg-slate-800 px-2 py-1 rounded text-slate-500">JSON Object</span>
                </div>
            </div>
        `;
  });

  html += "</div>";
  container.innerHTML = html;
}

// Modal Logic
let editIndex = -1;

function openEditModal(index) {
  editIndex = index;
  const item = currentData[index];
  const config = modules[currentModule];
  const schema = config.schema || createAutoSchema(item); // Fallback to auto-schema if not defined

  const formArea = document.getElementById("modal-form-area");
  formArea.innerHTML = "";

  Object.keys(schema).forEach((key) => {
    const field = schema[key];
    const value = item[key] || "";
    let inputHtml = "";

    if (field.readonly && editIndex !== -1) {
      inputHtml = `<input type="text" value="${value}" disabled class="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-500 cursor-not-allowed">`;
    } else if (field.type === "textarea") {
      inputHtml = `<textarea id="field-${key}" rows="${
        field.rows || 4
      }" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none">${value}</textarea>`;
    } else if (field.type === "select") {
      const opts = field.options
        .map(
          (o) =>
            `<option value="${o}" ${
              o === value ? "selected" : ""
            }>${o}</option>`
        )
        .join("");
      inputHtml = `<select id="field-${key}" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none">${opts}</select>`;
    } else if (field.type === "array") {
      // Simple comma separated text for array
      const valStr = Array.isArray(value) ? value.join(", ") : value;
      inputHtml = `<input type="text" id="field-${key}" value="${valStr}" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none" placeholder="Item 1, Item 2...">`;
    } else if (field.type === "number") {
      inputHtml = `<input type="number" id="field-${key}" value="${value}" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none">`;
    } else {
      inputHtml = `<input type="text" id="field-${key}" value="${value}" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none">`;
    }

    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
            <label class="block text-sm font-medium text-slate-400 mb-1">${
              field.label || key
            }</label>
            ${inputHtml}
        `;
    formArea.appendChild(wrapper);
  });

  // Store current schema for saving
  formArea.dataset.schemaKeys = JSON.stringify(Object.keys(schema));

  document.getElementById("edit-modal").classList.remove("hidden");
}

function openAddModal() {
  // Create empty item structure
  // Logic similar to generic
  editIndex = -1;
  // ... (Implementation simplified for brevity, assume similar to Edit but empty values)
  // Ideally we grab the first item to guess schema or use config.schema
  const config = modules[currentModule];
  // Mock item
  const mockItem = {};
  // We need to render form with empty values
  const schema = config.schema;
  // ... Render logic reused

  const formArea = document.getElementById("modal-form-area");
  formArea.innerHTML = "";
  Object.keys(schema).forEach((key) => {
    const field = schema[key];
    let inputHtml = "";
    if (field.type === "textarea") {
      inputHtml = `<textarea id="field-${key}" rows="${
        field.rows || 4
      }" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none"></textarea>`;
    } else {
      inputHtml = `<input type="${
        field.type === "number" ? "number" : "text"
      }" id="field-${key}" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none">`;
    }
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
            <label class="block text-sm font-medium text-slate-400 mb-1">${
              field.label || key
            }</label>
            ${inputHtml}
        `;
    formArea.appendChild(wrapper);
  });
  formArea.dataset.schemaKeys = JSON.stringify(Object.keys(schema));
  document.getElementById("edit-modal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("edit-modal").classList.add("hidden");
}

function saveModalChanges() {
  const formArea = document.getElementById("modal-form-area");
  const keys = JSON.parse(formArea.dataset.schemaKeys);
  const config = modules[currentModule];
  const schema = config.schema;

  const newItem = {};

  keys.forEach((key) => {
    const el = document.getElementById(`field-${key}`);
    let val = el.value;
    const type = schema[key] ? schema[key].type : "string";

    if (type === "number") val = Number(val);
    if (type === "array")
      val = val
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s);
    // Handle true/false later if needed

    newItem[key] = val;
  });

  // Preserve other fields not in form
  if (editIndex !== -1) {
    currentData[editIndex] = { ...currentData[editIndex], ...newItem };
  } else {
    currentData.push(newItem);
  }

  closeModal();
  renderList();
}

function createAutoSchema(item) {
  const schema = {};
  Object.keys(item).forEach((key) => {
    const val = item[key];
    let type = typeof val;
    if (Array.isArray(val)) type = "array";
    if (val && val.length > 50) type = "textarea";
    schema[key] = { type, label: key };
  });
  return schema;
}

function saveAll() {
  // Create download
  const dataStr =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(currentData, null, 2));
  const downloadAnchorNode = document.createElement("a");
  downloadAnchorNode.setAttribute("href", dataStr);
  const filename = currentFilePath.split("/").pop() || "data.json";
  downloadAnchorNode.setAttribute("download", filename);
  document.body.appendChild(downloadAnchorNode); // required for firefox
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}
