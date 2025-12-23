import { MathRenderer } from './katex.js';
import { MarkdownRenderer } from './md.js';

document.addEventListener('DOMContentLoaded', async () => {
    // State
    let currentExam = null;
    let questions = [];
    let currentIndex = 0;
    let userAnswers = {}; // { questionId: value }
    let questionStatus = {}; // { questionId: 'visited', 'answered', 'review' }
    let timerInterval;
    let timeRemaining = 0;

    // DOM
    const questionContainer = document.getElementById('question-container');
    const paletteContainer = document.getElementById('palette-container');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const clearBtn = document.getElementById('clear-btn');
    const reviewBtn = document.getElementById('review-btn');
    const timerDisplay = document.getElementById('timer');
    const examTitle = document.getElementById('exam-title');
    const courseBadge = document.getElementById('exam-course-badge');

    // Init
    const params = new URLSearchParams(window.location.search);
    const subjectId = params.get('subject');
    const examId = params.get('examId');

    if (!subjectId || !examId) {
        alert('Missing exam parameters.');
        window.location.href = 'index.html';
        return;
    }

    try {
        const response = await fetch(`subjects/${subjectId}.json`);
        const subjectData = await response.json();
        currentExam = subjectData.exams.find(e => e.id === examId);
        
        if (!currentExam) throw new Error('Exam not found');

        // Setup
        questions = currentExam.questions || [];
        timeRemaining = (currentExam.duration || 60) * 60;
        
        examTitle.textContent = currentExam.title;
        courseBadge.textContent = subjectData.meta.code ? subjectData.meta.code.substring(0,2) : 'EX';

        initPalette();
        startTimer();
        loadQuestion(0);

    } catch (e) {
        console.error(e);
        questionContainer.innerHTML = '<p class="text-error">Error loading exam.</p>';
    }

    // Logic
    function startTimer() {
        timerInterval = setInterval(() => {
            timeRemaining--;
            if (timeRemaining <= 0) {
                clearInterval(timerInterval);
                alert('Time is up!');
                // submit();
            }
            const m = Math.floor(timeRemaining / 60).toString().padStart(2, '0');
            const s = (timeRemaining % 60).toString().padStart(2, '0');
            timerDisplay.textContent = `${m}:${s}`;
        }, 1000);
    }

    function initPalette() {
        paletteContainer.innerHTML = '';
        questions.forEach((q, idx) => {
            const btn = document.createElement('div');
            btn.className = 'p-btn';
            btn.id = `palette-${idx}`;
            btn.textContent = idx + 1;
            btn.onclick = () => loadQuestion(idx);
            paletteContainer.appendChild(btn);
        });
    }

    function updatePalette() {
        questions.forEach((q, idx) => {
            const btn = document.getElementById(`palette-${idx}`);
            btn.className = 'p-btn'; // reset
            if (idx === currentIndex) btn.classList.add('current');
            
            const status = questionStatus[q.id];
            if (status) btn.classList.add(status);
            else if (idx === currentIndex) btn.classList.add('visited'); // Mark current as visited if no other status
        });
    }

    function loadQuestion(index) {
        if (index < 0 || index >= questions.length) return;
        currentIndex = index;
        
        // Mark as visited if not answered
        if (!questionStatus[questions[index].id]) {
            questionStatus[questions[index].id] = 'visited';
        }

        renderQuestion(questions[index]);
        updatePalette();
        updateNavButtons();
    }

    function renderQuestion(q) {
        // Markdown + Math rendering for Text
        const textHtml = MarkdownRenderer.render(q.text || '');
        
        let optionsHtml = '';
        const savedAnswer = userAnswers[q.id];

        if (q.type === 'MCQ' || q.type === 'MSQ' || q.type === 'Boolean') {
            optionsHtml = '<div class="flex flex-col gap-2 mt-4">';
            (q.options || []).forEach((opt, idx) => {
                const isSelected = isOptionSelected(q.type, savedAnswer, idx);
                // content can be markdown/math too
                const optContent = MarkdownRenderer.render(opt);
                
                optionsHtml += `
                    <div class="option-row ${isSelected ? 'selected' : ''}" onclick="window.selectOption('${q.id}', ${idx}, '${q.type}')">
                        <div class="option-marker">${String.fromCharCode(65 + idx)}</div>
                        <div class="w-full">${optContent}</div>
                    </div>
                `;
            });
            optionsHtml += '</div>';
        } else if (q.type === 'NAT') {
            optionsHtml = `
                <div class="mt-4">
                    <label class="block mb-2 text-secondary">Your Answer:</label>
                    <input type="text" 
                           placeholder="Type a number..." 
                           value="${savedAnswer || ''}" 
                           oninput="window.setNatAnswer('${q.id}', this.value)"
                    style="max-width: 300px;">
                </div>
            `;
        }

        // explanation logic (only show if reviewed/submitted? For practice, maybe show after answer?)
        // For now, hidden.

        questionContainer.innerHTML = `
            <div class="question-block" style="border:none;">
                <div class="flex justify-between items-center mb-4">
                    <span class="text-secondary text-sm font-bold">QUESTION ${currentIndex + 1}</span>
                    <div class="flex gap-2">
                         <span class="badge" style="background:#334155; color:white;">${q.type}</span>
                         <span class="badge" style="background:#065f46; color:#34d399;">+${q.marks} Marks</span>
                    </div>
                </div>
                <div class="text-lg leading-relaxed">${textHtml}</div>
                ${optionsHtml}
            </div>
        `;

        // Render Math
        MathRenderer.render(questionContainer);
    }

    // Global handlers for HTML onclick interaction
    window.selectOption = (qId, idx, type) => {
        if (type === 'MCQ' || type === 'Boolean') {
            userAnswers[qId] = idx;
        } else if (type === 'MSQ') {
            const current = userAnswers[qId] || [];
            const pos = current.indexOf(idx);
            if (pos === -1) current.push(idx);
            else current.splice(pos, 1);
            userAnswers[qId] = current;
        }
        questionStatus[qId] = 'answered';
        // Re-render to show selection
        // Optimization: just toggle class
        loadQuestion(currentIndex); 
    };

    window.setNatAnswer = (qId, val) => {
        userAnswers[qId] = val;
        if (val) questionStatus[qId] = 'answered';
        else questionStatus[qId] = 'visited';
        updatePalette();
    };

    function isOptionSelected(type, answer, idx) {
        if (answer === undefined || answer === null) return false;
        if (type === 'MCQ' || type === 'Boolean') return answer === idx;
        if (type === 'MSQ') return Array.isArray(answer) && answer.includes(idx);
        return false;
    }

    function updateNavButtons() {
        prevBtn.disabled = currentIndex === 0;
        nextBtn.innerHTML = currentIndex === questions.length - 1 ? 'Finish' : 'Next <i class="fas fa-chevron-right"></i>';
    }

    // Button Events
    prevBtn.addEventListener('click', () => loadQuestion(currentIndex - 1));
    nextBtn.addEventListener('click', () => {
        if (currentIndex < questions.length - 1) loadQuestion(currentIndex + 1);
        else alert('End of questions. Click Submit.');
    });

    clearBtn.addEventListener('click', () => {
        const qId = questions[currentIndex].id;
        delete userAnswers[qId];
        questionStatus[qId] = 'visited';
        loadQuestion(currentIndex);
    });

    reviewBtn.addEventListener('click', () => {
        const qId = questions[currentIndex].id;
        questionStatus[qId] = 'review';
        updatePalette();
        if (currentIndex < questions.length - 1) loadQuestion(currentIndex + 1);
    });

});
