import { MathRenderer } from "./katex.js";
import { MarkdownRenderer } from "./md.js";

document.addEventListener("DOMContentLoaded", async () => {
  // State
  let currentExam = null;
  let questions = [];
  let currentIndex = 0;
  let userAnswers = {}; // { qId: value }
  let questionStatus = {}; // { qId: 'visited', 'answered', 'review' }
  let timerInterval;
  let timeRemaining = 0;
  let isEditMode = false;

  // DOM
  const questionContainer = document.getElementById("question-container");
  const paletteContainer = document.getElementById("palette-container");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  const clearBtn = document.getElementById("clear-btn");
  const reviewBtn = document.getElementById("review-btn");
  const timerDisplay = document.getElementById("timer");
  const examTitle = document.getElementById("exam-title");
  const courseBadge = document.getElementById("exam-course-badge");
  const idBadge = document.getElementById("exam-id-badge");

  // Add Edit/Save Buttons
  const headerRight = document.querySelector("header > div:last-child");
  if (headerRight) {
    const editControls = document.createElement("div");
    editControls.className =
      "flex items-center gap-2 mr-4 bg-slate-800 rounded-lg p-1 border border-slate-700";
    editControls.innerHTML = `
          <button id="toggle-edit-btn" class="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-700 rounded transition flex items-center gap-2">
              <i class="fas fa-edit"></i> Edit
          </button>
          <button id="save-changes-btn" class="hidden px-3 py-1.5 text-xs font-bold text-white bg-green-600 hover:bg-green-500 rounded transition flex items-center gap-2">
              <i class="fas fa-save"></i> Save
          </button>
      `;
    headerRight.prepend(editControls);
  }
  const toggleEditBtn = document.getElementById("toggle-edit-btn");
  const saveChangesBtn = document.getElementById("save-changes-btn");
  const submitBtn = document.getElementById("submit-btn");

  // Init Logic
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode");

  // Preview Mode
  if (mode === "preview") {
    try {
      const raw = localStorage.getItem("preview_exam");
      if (!raw) throw new Error("No preview data found in LocalStorage");
      currentExam = JSON.parse(raw);
      questions = currentExam.questions || [];
      timeRemaining = (currentExam.duration || 60) * 60;
      examTitle.textContent =
        "PREVIEW MODE: " + (currentExam.title || "Untitled");
      courseBadge.textContent = "PREVIEW";
      idBadge.textContent = "N/A";

      initPalette();
      startTimer();
      loadQuestion(0);
      questionContainer.style.opacity = 1;

      const banner = document.createElement("div");
      banner.className =
        "fixed top-0 left-0 right-0 z-50 bg-purple-600 text-white text-xs font-bold text-center py-1";
      banner.innerText = "PREVIEW MODE - Changes are not saved";
      document.body.prepend(banner);

      return;
    } catch (e) {
      console.error(e);
      alert("Preview failed: " + e.message);
    }
  }

  const subjectId = params.get("subject");
  const examId = params.get("examId");

  if (!subjectId || !examId) {
    questionContainer.innerHTML = `
            <div class="text-center mt-20">
                <h2 class="text-2xl text-red-400 font-bold mb-4">Error: Missing Exam Data</h2>
                <a href="index.html" class="text-blue-400 underline">Go Back Home</a>
            </div>
        `;
    questionContainer.style.opacity = 1;
    return;
  }

  try {
    const response = await fetch(`subjects/${subjectId}.json`);
    if (!response.ok) throw new Error("Subject fetch failed");

    const subjectData = await response.json();
    currentExam = subjectData.exams.find((e) => e.id === examId);

    if (!currentExam) throw new Error("Exam not found");

    questions = currentExam.questions || [];
    timeRemaining = (currentExam.duration || 60) * 60;

    examTitle.textContent = currentExam.title;
    courseBadge.textContent = subjectData.meta
      ? subjectData.meta.code
      : subjectId.toUpperCase();
    idBadge.textContent = examId;

    initPalette();
    startTimer();
    loadQuestion(0);
    questionContainer.style.opacity = 1;
  } catch (e) {
    console.error(e);
    questionContainer.innerHTML = `
            <div class="text-center mt-20">
                <h2 class="text-2xl text-red-400 font-bold mb-4">Failed to Load Exam</h2>
                <p class="text-secondary">${e.message}</p>
                <a href="index.html" class="text-blue-400 underline mt-4 block">Return to Subjects</a>
            </div>
        `;
    questionContainer.style.opacity = 1;
  }

  // Edit Mode Toggle
  if (toggleEditBtn) {
    toggleEditBtn.addEventListener("click", () => {
      isEditMode = !isEditMode;
      if (isEditMode) {
        toggleEditBtn.classList.add("bg-blue-600", "text-white");
        toggleEditBtn.classList.remove("text-slate-400");
        saveChangesBtn.classList.remove("hidden");
      } else {
        toggleEditBtn.classList.remove("bg-blue-600", "text-white");
        toggleEditBtn.classList.add("text-slate-400");
        saveChangesBtn.classList.add("hidden");
      }
      renderQuestion(questions[currentIndex]);
    });

    // Save Changes
    saveChangesBtn.addEventListener("click", async () => {
      if (!confirm("Save changes to this paper? This cannot be undone."))
        return;
      try {
        const oldText = saveChangesBtn.innerHTML;
        saveChangesBtn.textContent = "Saving...";

        const payload = {
          subjectId: subjectId,
          examId: examId,
          examData: currentExam,
        };

        const res = await fetch("/api/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (data.success) {
          alert("Saved Successfully!");
        } else {
          throw new Error(data.error || "Unknown Error");
        }
        saveChangesBtn.innerHTML = oldText;
      } catch (e) {
        alert("Save Failed (Ensure dashboard.py is running): " + e.message);
        saveChangesBtn.innerHTML = '<i class="fas fa-save"></i> Save';
      }
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener("click", async () => {
      if (!confirm("Are you sure you want to submit the exam?")) return;
      clearInterval(timerInterval);

      // Calculate Score
      let score = 0;
      let correctCount = 0;
      let totalQuestions = questions.length;
      let attempted = Object.keys(userAnswers).length;

      questions.forEach((q) => {
        const ans = userAnswers[q.id];
        let isCorrect = false;

        if (ans === undefined || ans === null) return;

        if (q.type === "MCQ" || q.type === "Boolean") {
          if (ans === q.correctIndex) isCorrect = true;
        } else if (q.type === "MSQ") {
          // arrays match?
          if (Array.isArray(ans) && Array.isArray(q.correctIndex)) {
            const s1 = new Set(ans);
            const s2 = new Set(q.correctIndex);
            if (s1.size === s2.size && [...s1].every((x) => s2.has(x)))
              isCorrect = true;
          }
        } else if (q.type === "NAT") {
          // range or value
          if (q.correctValue) {
            // Check for range "min-max"
            const parts = q.correctValue
              .toString()
              .split("-")
              .map((s) => parseFloat(s.trim()));
            const userVal = parseFloat(ans);

            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
              if (userVal >= parts[0] && userVal <= parts[1]) isCorrect = true;
            } else {
              // exact match (with tolerance?)
              if (Math.abs(userVal - parseFloat(q.correctValue)) < 0.01)
                isCorrect = true;
            }
          }
        }

        if (isCorrect) {
          score += parseFloat(q.marks) || 0;
          correctCount++;
        }
      });

      const maxScore = questions.reduce(
        (acc, q) => acc + (parseFloat(q.marks) || 0),
        0
      );

      // Show Result
      alert(
        `Exam Submitted!\n\nScore: ${score} / ${maxScore}\nCorrect: ${correctCount} / ${totalQuestions}`
      );

      // Send Stats
      try {
        const statsPayload = {
          examId: examId || "unknown",
          examTitle: currentExam ? currentExam.title : "Unknown",
          score: score,
          maxScore: maxScore,
          totalQuestions: totalQuestions,
          correctCount: correctCount,
          timestamp: new Date().toISOString(),
          subjectId: subjectId,
        };

        await fetch("/api/stats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(statsPayload),
        });
      } catch (e) {
        console.error("Failed to save stats", e);
      }

      // Return to home
      window.location.href = "index.html";
    });
  }

  function startTimer() {
    timerInterval = setInterval(() => {
      timeRemaining--;
      if (timeRemaining <= 0) {
        clearInterval(timerInterval);
        alert("Time is up!");
      }
      const hours = Math.floor(timeRemaining / 3600);
      const mins = Math.floor((timeRemaining % 3600) / 60);
      const secs = timeRemaining % 60;
      const hDisplay = hours > 0 ? `${String(hours).padStart(2, "0")}:` : "";
      timerDisplay.textContent = `${hDisplay}${String(mins).padStart(
        2,
        "0"
      )}:${String(secs).padStart(2, "0")}`;
      if (timeRemaining < 300) timerDisplay.classList.add("text-red-400");
    }, 1000);
  }

  function initPalette() {
    paletteContainer.innerHTML = "";
    questions.forEach((q, idx) => {
      const btn = document.createElement("button");
      btn.className =
        "h-10 w-full rounded border border-slate-700 bg-slate-800 text-slate-400 font-mono text-sm hover:bg-slate-700 transition flex items-center justify-center relative";
      btn.id = `palette-${idx}`;
      btn.textContent = idx + 1;
      btn.onclick = () => loadQuestion(idx);
      paletteContainer.appendChild(btn);
    });
  }

  function updatePalette() {
    questions.forEach((q, idx) => {
      const btn = document.getElementById(`palette-${idx}`);
      let classes =
        "h-10 w-full rounded border font-mono text-sm transition flex items-center justify-center relative ";
      const status = questionStatus[q.id];
      const isCurrent = idx === currentIndex;
      if (isCurrent)
        classes +=
          "border-blue-500 ring-2 ring-blue-500/30 ring-offset-2 ring-offset-dark z-10 ";
      else classes += "border-transparent ";

      if (status === "answered")
        classes += "bg-green-600 text-white hover:bg-green-500";
      else if (status === "review")
        classes += "bg-purple-600 text-white hover:bg-purple-500";
      else if (status === "visited")
        classes +=
          "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30";
      else
        classes +=
          "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700";
      btn.className = classes;
    });
  }

  function loadQuestion(index) {
    if (index < 0 || index >= questions.length) return;
    currentIndex = index;
    const q = questions[index];
    if (!questionStatus[q.id] && !userAnswers[q.id]) {
      questionStatus[q.id] = "visited";
    }
    renderQuestion(q);
    updatePalette();
    updateNavButtons();
  }

  function renderQuestion(q) {
    const savedAnswer = userAnswers[q.id];
    let contentHtml = "";

    if (isEditMode) {
      contentHtml = `
            <div class="mb-6 p-4 border border-blue-500/50 bg-blue-500/5 rounded-xl">
                <label class="text-blue-400 text-xs font-bold uppercase mb-2 block">Question Text</label>
                <textarea id="edit-q-text" class="w-full bg-slate-900 border border-slate-700 text-slate-200 p-3 rounded font-mono text-sm h-32 outline-none focus:border-blue-500">${
                  q.text
                }</textarea>
                
                <div class="mt-4 grid grid-cols-2 gap-4">
                    <div>
                        <label class="text-blue-400 text-xs font-bold uppercase mb-2 block">Marks</label>
                        <input id="edit-q-marks" type="number" value="${
                          q.marks
                        }" class="bg-slate-900 border border-slate-700 text-white p-2 rounded w-full outline-none">
                    </div>
                    <div>
                        <label class="text-blue-400 text-xs font-bold uppercase mb-2 block">Type</label>
                        <select id="edit-q-type" class="bg-slate-900 border border-slate-700 text-white p-2 rounded w-full outline-none">
                            <option value="MCQ" ${
                              q.type === "MCQ" ? "selected" : ""
                            }>MCQ</option>
                            <option value="MSQ" ${
                              q.type === "MSQ" ? "selected" : ""
                            }>MSQ</option>
                            <option value="NAT" ${
                              q.type === "NAT" ? "selected" : ""
                            }>NAT</option>
                        </select>
                    </div>
                </div>
            </div>
        `;

      if (["MCQ", "MSQ"].includes(q.type)) {
        contentHtml += `<div class="space-y-2">`;
        (q.options || []).forEach((opt, idx) => {
          const isCorrect =
            params.get("mode") === "preview"
              ? false
              : Array.isArray(q.correctIndex)
              ? q.correctIndex.includes(idx)
              : q.correctIndex === idx;
          contentHtml += `
                    <div class="flex gap-2 items-center">
                        <input type="checkbox" class="accent-green-500 w-5 h-5" id="edit-opt-correct-${idx}" ${
            isCorrect ? "checked" : ""
          }>
                        <input type="text" class="flex-1 bg-slate-900 border border-slate-700 text-slate-300 p-2 rounded text-sm" value="${opt.replace(
                          /"/g,
                          "&quot;"
                        )}" id="edit-opt-text-${idx}">
                        <button onclick="window.removeOption(${idx})" class="text-red-400 hover:text-red-300"><i class="fas fa-trash"></i></button>
                    </div>
                 `;
        });
        contentHtml += `
                <button onclick="window.addOption()" class="text-blue-400 text-sm font-bold mt-2">+ Add Option</button>
                </div>
            `;
      } else {
        contentHtml += `
                <div>
                    <label class="text-blue-400 text-xs font-bold uppercase mb-2 block">Correct Value (NAT)</label>
                    <input id="edit-nat-val" type="text" value="${
                      q.correctValue || ""
                    }" class="bg-slate-900 border border-slate-700 text-white p-2 rounded w-full outline-none">
                </div>
             `;
      }

      setTimeout(() => {
        const txt = document.getElementById("edit-q-text");
        if (txt) txt.oninput = (e) => (q.text = e.target.value);
        const mark = document.getElementById("edit-q-marks");
        if (mark) mark.oninput = (e) => (q.marks = parseFloat(e.target.value));
        const typ = document.getElementById("edit-q-type");
        if (typ)
          typ.onchange = (e) => {
            q.type = e.target.value;
            renderQuestion(q);
          };

        if (["MCQ", "MSQ"].includes(q.type)) {
          q.options.forEach((opt, idx) => {
            const txtEl = document.getElementById(`edit-opt-text-${idx}`);
            const chkEl = document.getElementById(`edit-opt-correct-${idx}`);
            if (txtEl) txtEl.oninput = (e) => (q.options[idx] = e.target.value);
            if (chkEl) chkEl.onchange = () => updateCorrectIndex(q);
          });
        } else {
          const natEl = document.getElementById("edit-nat-val");
          if (natEl) natEl.oninput = (e) => (q.correctValue = e.target.value);
        }
      }, 100);
    } else {
      const textHtml = MarkdownRenderer.render(q.text || "");

      let imagesHtml = "";
      // Q Images
      if (q.images && Array.isArray(q.images)) {
        imagesHtml = '<div class="flex flex-wrap gap-4 mb-4">';
        q.images.forEach((img) => {
          imagesHtml += `<img src="${img}" class="max-w-full h-auto rounded-lg border border-slate-700">`;
        });
        imagesHtml += "</div>";
      }

      contentHtml = `
            <div class="animate-fade-in">
                <div class="flex items-start justify-between mb-8 pb-6 border-b border-slate-700/50">
                    <div>
                        <div class="flex items-center gap-3 mb-2">
                             <span class="text-slate-400 font-bold tracking-wide text-xs uppercase">Question ${
                               currentIndex + 1
                             }</span>
                             <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-700 text-slate-300 tracking-wider">${
                               q.type
                             }</span>
                        </div>
                        <div class="text-slate-200 markdown-body text-lg leading-relaxed">${textHtml}</div>
                        ${imagesHtml}
                    </div>
                    <div class="shrink-0 ml-6">
                        <span class="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs font-bold whitespace-nowrap">
                            +${q.marks} Marks
                        </span>
                    </div>
                </div>`;

      if (["MCQ", "MSQ", "Boolean"].includes(q.type)) {
        contentHtml += `<div class="space-y-3 mt-6">`;
        (q.options || []).forEach((opt, idx) => {
          const isSelected = isOptionSelected(q.type, savedAnswer, idx);

          let optContent = "";
          let optImage = null;

          if (typeof opt === "object") {
            // New Format
            optContent = MarkdownRenderer.render(opt.text || "");
            if (opt.image) optImage = opt.image;
          } else {
            // Old Format (Markdown String)
            optContent = MarkdownRenderer.render(opt);
          }

          const baseClass =
            "group flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200 select-none";
          const stateClass = isSelected
            ? "bg-blue-500/10 border-blue-500 ring-1 ring-blue-500"
            : "bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600";
          const markerClass = isSelected
            ? "bg-blue-500 border-blue-500 text-white"
            : "border-slate-500 text-slate-500 group-hover:border-slate-400 group-hover:text-slate-400";
          const markerType =
            q.type === "MCQ" || q.type === "Boolean"
              ? "rounded-full"
              : "rounded-md";

          contentHtml += `
                    <div class="${baseClass} ${stateClass}" onclick="window.selectOption('${
            q.id
          }', ${idx}, '${q.type}')">
                        <div class="w-6 h-6 border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${markerType} ${markerClass}">
                            ${
                              isSelected
                                ? '<i class="fas fa-check text-xs"></i>'
                                : '<span class="text-[10px] font-bold">' +
                                  String.fromCharCode(65 + idx) +
                                  "</span>"
                            }
                        </div>
                        <div class="w-full">
                            <div class="text-slate-200 markdown-body text-base leading-relaxed">${optContent}</div>
                            ${
                              optImage
                                ? `<div class="mt-2"><img src="${optImage}" class="max-h-40 rounded border border-slate-600"></div>`
                                : ""
                            }
                        </div>
                    </div>`;
        });
        contentHtml += `</div>`;
      } else if (q.type === "NAT") {
        contentHtml += `
                <div class="mt-8 p-6 bg-slate-800/50 rounded-xl border border-slate-700">
                    <label class="block mb-3 text-slate-400 text-sm font-medium">Your Answer</label>
                    <input type="text" 
                           class="bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white w-full max-w-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-mono text-lg placeholder-slate-600"
                           placeholder="Enter numerical value..."
                           value="${savedAnswer || ""}" 
                           oninput="window.setNatAnswer('${q.id}', this.value)"
                           autocomplete="off">
                </div>`;
      }
      contentHtml += `</div>`;
    }

    questionContainer.innerHTML = contentHtml;
    if (!isEditMode) MathRenderer.render(questionContainer);
  }

  // Edit Helpers
  window.updateCorrectIndex = (q) => {
    const checked = [];
    q.options.forEach((_, idx) => {
      const el = document.getElementById(`edit-opt-correct-${idx}`);
      if (el && el.checked) checked.push(idx);
    });
    if (q.type === "MCQ")
      q.correctIndex = checked.length > 0 ? checked[0] : null;
    else q.correctIndex = checked;
  };
  window.addOption = () => {
    questions[currentIndex].options.push("New Option");
    renderQuestion(questions[currentIndex]);
  };
  window.removeOption = (idx) => {
    questions[currentIndex].options.splice(idx, 1);
    renderQuestion(questions[currentIndex]);
  };

  // Interaction Handlers
  window.selectOption = (qId, idx, type) => {
    if (isEditMode) return;
    if (type === "MCQ" || type === "Boolean") {
      userAnswers[qId] = idx;
    } else if (type === "MSQ") {
      const current = userAnswers[qId] || [];
      const pos = current.indexOf(idx);
      if (pos === -1) current.push(idx);
      else current.splice(pos, 1);
      userAnswers[qId] = current;
    }
    questionStatus[qId] = "answered";
    renderQuestion(questions[currentIndex]);
    updatePalette();
  };

  window.setNatAnswer = (qId, val) => {
    if (isEditMode) return;
    userAnswers[qId] = val;
    if (val && val.trim() !== "") questionStatus[qId] = "answered";
    else questionStatus[qId] = "visited";
    updatePalette();
  };

  function isOptionSelected(type, answer, idx) {
    if (answer === undefined || answer === null) return false;
    if (type === "MCQ" || type === "Boolean") return answer === idx;
    if (type === "MSQ") return Array.isArray(answer) && answer.includes(idx);
    return false;
  }

  function updateNavButtons() {
    prevBtn.disabled = currentIndex === 0;
    nextBtn.innerHTML =
      currentIndex === questions.length - 1
        ? "Finish Review"
        : 'Next <i class="fas fa-chevron-right ml-1"></i>';
    const status = questionStatus[questions[currentIndex].id];
    if (status === "review") {
      reviewBtn.classList.add("bg-purple-500/10", "border-purple-500");
      reviewBtn.textContent = "Unmark Review";
    } else {
      reviewBtn.classList.remove("bg-purple-500/10", "border-purple-500");
      reviewBtn.textContent = "Mark for Review";
    }
  }

  prevBtn.addEventListener("click", () => loadQuestion(currentIndex - 1));
  nextBtn.addEventListener("click", () => {
    if (currentIndex < questions.length - 1) loadQuestion(currentIndex + 1);
  });
  clearBtn.addEventListener("click", () => {
    const qId = questions[currentIndex].id;
    delete userAnswers[qId];
    questionStatus[qId] = "visited";
    loadQuestion(currentIndex);
    updatePalette();
  });
  reviewBtn.addEventListener("click", () => {
    const qId = questions[currentIndex].id;
    if (questionStatus[qId] === "review") {
      questionStatus[qId] =
        userAnswers[qId] !== undefined ? "answered" : "visited";
    } else {
      questionStatus[qId] = "review";
    }
    updatePalette();
    updateNavButtons();
  });
});
