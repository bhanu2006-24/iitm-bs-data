document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const subjectListEl = document.getElementById("subject-list");
  const questionsContainer = document.getElementById("questions-container");
  const currentSubjectTitle = document.getElementById("current-subject-title");
  const examFilter = document.getElementById("exam-filter");
  const yearFilter = document.getElementById("year-filter");
  const countDisplay = document.getElementById("q-count");

  // State
  let currentQuestions = [];
  let currentSubject = null;
  let availableExams = new Set();
  let availableYears = new Set();

  // Initialize
  fetchSubjects();

  // Event Listeners
  examFilter.addEventListener("change", renderQuestions);
  yearFilter.addEventListener("change", renderQuestions);

  async function fetchSubjects() {
    try {
      const response = await fetch("subjects/subjects_index.json");
      if (!response.ok) throw new Error("Failed to load subjects index");
      const subjects = await response.json();
      renderSidebar(subjects);
    } catch (error) {
      subjectListEl.innerHTML = `<li style="color:var(--error-color); padding:1rem;">Error loading subjects. Make sure you run the cleaner script.</li>`;
      console.error(error);
    }
  }

  function renderSidebar(subjects) {
    subjectListEl.innerHTML = "";
    subjects.forEach((sub) => {
      const li = document.createElement("li");
      li.className = "subject-item";
      li.textContent = formatSubjectName(sub);
      li.addEventListener("click", () => loadSubject(sub, li));
      subjectListEl.appendChild(li);
    });
  }

  async function loadSubject(subject, activeLi) {
    // Active state
    document
      .querySelectorAll(".subject-item")
      .forEach((el) => el.classList.remove("active"));
    if (activeLi) activeLi.classList.add("active");

    currentSubject = subject;
    currentSubjectTitle.textContent = formatSubjectName(subject);
    questionsContainer.innerHTML =
      '<div class="loading">Loading questions...</div>';

    try {
      const response = await fetch(`subjects/${subject}.json`);
      if (!response.ok) throw new Error(`Failed to load ${subject}`);
      currentQuestions = await response.json();

      updateFilters();
      renderQuestions();
    } catch (error) {
      questionsContainer.innerHTML = `<div class="empty-state">Error loading questions for ${subject}</div>`;
      console.error(error);
    }
  }

  function updateFilters() {
    // Extract unique exams and years
    availableExams = new Set(currentQuestions.map((q) => q.exam));
    availableYears = new Set(currentQuestions.map((q) => q.year));

    // Update Exam Dropdown
    const currentExam = examFilter.value;
    examFilter.innerHTML = '<option value="all">All Exams</option>';
    Array.from(availableExams)
      .sort()
      .forEach((exam) => {
        const opt = document.createElement("option");
        opt.value = exam;
        opt.textContent = formatExamName(exam);
        examFilter.appendChild(opt);
      });
    // Restore selection if valid
    if (availableExams.has(currentExam)) examFilter.value = currentExam;

    // Update Year Dropdown
    const currentYear = yearFilter.value;
    yearFilter.innerHTML = '<option value="all">All Years</option>';
    Array.from(availableYears)
      .sort()
      .reverse()
      .forEach((year) => {
        const opt = document.createElement("option");
        opt.value = year;
        opt.textContent = year;
        yearFilter.appendChild(opt);
      });
    if (
      availableYears.has(Number(currentYear)) ||
      availableYears.has(currentYear)
    )
      yearFilter.value = currentYear;
  }

  function renderQuestions() {
    const selectedExam = examFilter.value;
    const selectedYear = yearFilter.value;

    const filtered = currentQuestions.filter((q) => {
      const matchExam = selectedExam === "all" || q.exam === selectedExam;
      const matchYear =
        selectedYear === "all" || String(q.year) === selectedYear;
      return matchExam && matchYear;
    });

    countDisplay.textContent = `${filtered.length} Questions`;
    questionsContainer.innerHTML = "";

    if (filtered.length === 0) {
      questionsContainer.innerHTML =
        '<div class="empty-state">No questions found for selected filters.</div>';
      return;
    }

    filtered.forEach((q, index) => {
      const card = createQuestionCard(q, index + 1);
      questionsContainer.appendChild(card);
    });
  }

  function createQuestionCard(q, index) {
    const card = document.createElement("div");
    card.className = "question-card";

    // Meta header
    const meta = document.createElement("div");
    meta.className = "question-meta";
    meta.innerHTML = `
            <span>#${index}</span>
            <div style="display:flex; gap:0.5rem;">
                <span class="q-badge">${formatExamName(q.exam)}</span>
                <span class="q-badge">${q.year}</span>
                <span class="q-badge" style="color:var(--text-secondary); background:var(--bg-color);">${
                  q.type
                }</span>
            </div>
        `;
    card.appendChild(meta);

    // Context (Comprehension)
    if (q.context) {
      const contextDiv = document.createElement("div");
      contextDiv.className = "q-context";
      contextDiv.innerHTML = q.context; // HTML clean string from python script
      card.appendChild(contextDiv);
    }

    // Question Text
    const textDiv = document.createElement("div");
    textDiv.className = "q-text";
    textDiv.innerHTML = q.question; // Contains HTML sometimes? Python script treats it as string, hopefully safe
    card.appendChild(textDiv);

    // Question Images
    if (q.images && q.images.length > 0) {
      const imgDiv = document.createElement("div");
      imgDiv.className = "q-image";
      q.images.forEach((src) => {
        const img = document.createElement("img");
        img.src = src;
        img.loading = "lazy";
        img.onclick = () => window.open(src, "_blank");
        imgDiv.appendChild(img);
      });
      card.appendChild(imgDiv);
    }

    // Interaction Area (Options or Input)
    const interactionDiv = document.createElement("div");
    interactionDiv.style.marginTop = "1.5rem";

    let correctAnswers = []; // Store IDs or values

    // Handle Options (MCQ/MSQ)
    if (q.options && q.options.length > 0) {
      const optionsGrid = document.createElement("div");
      optionsGrid.className = "options-grid";

      q.options.forEach((opt, idx) => {
        if (opt.is_correct) correctAnswers.push(String(opt.id));

        const optItem = document.createElement("div");
        optItem.className = "option-item";
        optItem.dataset.id = opt.id;

        const marker = document.createElement("div");
        marker.className = "option-marker";
        marker.textContent = String.fromCharCode(65 + idx); // A, B, C...

        const content = document.createElement("div");
        if (opt.text) content.innerHTML += `<div>${opt.text}</div>`;
        if (opt.image)
          content.innerHTML += `<div class="opt-image"><img src="${opt.image}" /></div>`;

        optItem.appendChild(marker);
        optItem.appendChild(content);

        // Click selection logic
        optItem.addEventListener("click", () => {
          if (card.dataset.revealed) return; // Disable after reveal

          if (q.type === "MCQ") {
            // Single Select
            optionsGrid
              .querySelectorAll(".option-item")
              .forEach((el) => el.classList.remove("selected"));
            optItem.classList.add("selected");
          } else {
            // Multi Select
            optItem.classList.toggle("selected");
          }
        });

        optionsGrid.appendChild(optItem);
      });
      interactionDiv.appendChild(optionsGrid);
    } else if (q.answer && q.answer.value_start) {
      // Numeric / NAT
      const input = document.createElement("input");
      input.type = "text";
      input.className = "numeric-input";
      input.placeholder = `Type your answer (${q.answer.answer_type})`;
      interactionDiv.appendChild(input);
    }

    // Reveal Button
    const revealBtn = document.createElement("button");
    revealBtn.className = "reveal-btn";
    revealBtn.textContent = "Check Answer";

    const feedback = document.createElement("div");
    feedback.className = "feedback-msg";

    revealBtn.addEventListener("click", () => {
      card.dataset.revealed = "true";
      revealBtn.style.display = "none";

      if (q.options && q.options.length > 0) {
        // Check Options
        const selectedIds = Array.from(
          interactionDiv.querySelectorAll(".option-item.selected")
        ).map((el) => el.dataset.id);

        // Highlight outcomes
        interactionDiv.querySelectorAll(".option-item").forEach((el) => {
          const isCorrect = correctAnswers.includes(el.dataset.id);
          const isSelected = el.classList.contains("selected");

          if (isCorrect) el.classList.add("correct");
          if (isSelected && !isCorrect) el.classList.add("wrong");
        });

        // Simple validation logic (Exact match for MSQ, single for MCQ)
        // Just showing visual feedback is often enough, but let's add text
        const isAllCorrect =
          correctAnswers.every((id) => selectedIds.includes(id)) &&
          selectedIds.every((id) => correctAnswers.includes(id));

        if (isAllCorrect) {
          feedback.innerHTML = "Correct! check green highlights";
          feedback.className = "feedback-msg correct";
        } else {
          feedback.innerHTML =
            "Incorrect. Correct answers are highlighted in green.";
          feedback.className = "feedback-msg wrong";
        }
      } else if (q.answer) {
        // Check Numeric
        const input = interactionDiv.querySelector("input");
        const val = parseFloat(input.value);
        const start = parseFloat(q.answer.value_start);
        const end = q.answer.value_end ? parseFloat(q.answer.value_end) : start;

        if (!isNaN(val) && val >= start && val <= end) {
          feedback.textContent = `Correct! Answer is between ${start} and ${end}`;
          feedback.className = "feedback-msg correct";
        } else {
          feedback.textContent = `Incorrect. Correct range: ${start} - ${end}`;
          feedback.className = "feedback-msg wrong";
        }
      }
    });

    card.appendChild(interactionDiv);
    card.appendChild(feedback);
    card.appendChild(revealBtn);

    return card;
  }

  // Helpers
  function formatSubjectName(str) {
    return str.toUpperCase().replace(/_/g, " ");
  }

  function formatExamName(str) {
    if (str === "quiz1") return "Quiz 1";
    if (str === "Quiz_2") return "Quiz 2";
    if (str === "End_Term") return "End Term";
    return str;
  }
});
