import { MathRenderer } from './katex.js';
import { MarkdownRenderer } from './md.js';

document.addEventListener('DOMContentLoaded', async () => {
    // State
    let currentExam = null;
    let questions = [];
    let currentIndex = 0;
    let userAnswers = {}; // { qId: value }
    let questionStatus = {}; // { qId: 'visited', 'answered', 'review' }
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
    const idBadge = document.getElementById('exam-id-badge');

    // Init Logic
    const params = new URLSearchParams(window.location.search);
    const subjectId = params.get('subject');
    const examId = params.get('examId');

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
        if(!response.ok) throw new Error("Subject fetch failed");
        
        const subjectData = await response.json();
        currentExam = subjectData.exams.find(e => e.id === examId);
        
        if (!currentExam) throw new Error('Exam not found');

        // Initial Setup
        questions = currentExam.questions || [];
        timeRemaining = (currentExam.duration || 60) * 60;
        
        examTitle.textContent = currentExam.title;
        courseBadge.textContent = subjectData.meta ? subjectData.meta.code : subjectId.toUpperCase();
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

    // Timer Logic
    function startTimer() {
        timerInterval = setInterval(() => {
            timeRemaining--;
            if (timeRemaining <= 0) {
                clearInterval(timerInterval);
                alert('Time is up!');
                // Implement auto-submit here
            }
            const hours = Math.floor(timeRemaining / 3600);
            const mins = Math.floor((timeRemaining % 3600) / 60);
            const secs = timeRemaining % 60;
            
            const hDisplay = hours > 0 ? `${String(hours).padStart(2,'0')}:` : '';
            timerDisplay.textContent = `${hDisplay}${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
            
            // Warning color
            if (timeRemaining < 300) timerDisplay.classList.add('text-red-400');
        }, 1000);
    }

    function initPalette() {
        paletteContainer.innerHTML = '';
        questions.forEach((q, idx) => {
            const btn = document.createElement('button');
            // Base styles
            btn.className = "h-10 w-full rounded border border-slate-700 bg-slate-800 text-slate-400 font-mono text-sm hover:bg-slate-700 transition flex items-center justify-center relative";
            btn.id = `palette-${idx}`;
            btn.textContent = idx + 1;
            btn.onclick = () => loadQuestion(idx);
            paletteContainer.appendChild(btn);
        });
    }

    function updatePalette() {
        questions.forEach((q, idx) => {
            const btn = document.getElementById(`palette-${idx}`);
            // Reset base classes
            let classes = "h-10 w-full rounded border font-mono text-sm transition flex items-center justify-center relative ";
            
            // Determine state
            const status = questionStatus[q.id];
            const isCurrent = idx === currentIndex;
            
            if (isCurrent) {
                classes += "border-blue-500 ring-2 ring-blue-500/30 ring-offset-2 ring-offset-dark z-10 ";
            } else {
                classes += "border-transparent ";
            }

            if (status === 'answered') {
                classes += "bg-green-600 text-white hover:bg-green-500";
            } else if (status === 'review') {
                classes += "bg-purple-600 text-white hover:bg-purple-500";
            } else if (status === 'visited') {
                classes += "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30";
            } else {
                classes += "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700";
            }
            
            btn.className = classes;
        });
    }

    function loadQuestion(index) {
        if (index < 0 || index >= questions.length) return;
        currentIndex = index;
        const q = questions[index];

        // Mark visited
        if (!questionStatus[q.id] && !userAnswers[q.id]) {
            questionStatus[q.id] = 'visited';
        }

        renderQuestion(q);
        updatePalette();
        updateNavButtons();
    }

    function renderQuestion(q) {
        const textHtml = MarkdownRenderer.render(q.text || '');
        const savedAnswer = userAnswers[q.id];

        let optionsHtml = '';
        if (['MCQ', 'MSQ', 'Boolean'].includes(q.type)) {
            optionsHtml = `<div class="space-y-3 mt-6">`;
            (q.options || []).forEach((opt, idx) => {
                const isSelected = isOptionSelected(q.type, savedAnswer, idx);
                const optContent = MarkdownRenderer.render(opt);
                
                // Style for Option
                const baseClass = "group flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200 select-none";
                const stateClass = isSelected 
                    ? "bg-blue-500/10 border-blue-500 ring-1 ring-blue-500" 
                    : "bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600";
                
                const markerClass = isSelected
                    ? "bg-blue-500 border-blue-500 text-white"
                    : "border-slate-500 text-slate-500 group-hover:border-slate-400 group-hover:text-slate-400";
                
                const markerType = q.type === 'MCQ' || q.type === 'Boolean' ? 'rounded-full' : 'rounded-md';

                optionsHtml += `
                    <div class="${baseClass} ${stateClass}" onclick="window.selectOption('${q.id}', ${idx}, '${q.type}')">
                        <div class="w-6 h-6 border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${markerType} ${markerClass}">
                            ${isSelected ? '<i class="fas fa-check text-xs"></i>' : '<span class="text-[10px] font-bold">'+String.fromCharCode(65+idx)+'</span>'}
                        </div>
                        <div class="text-slate-200 markdown-body text-base leading-relaxed w-full">${optContent}</div>
                    </div>
                `;
            });
            optionsHtml += `</div>`;
        } else if (q.type === 'NAT') {
            optionsHtml = `
                <div class="mt-8 p-6 bg-slate-800/50 rounded-xl border border-slate-700">
                    <label class="block mb-3 text-slate-400 text-sm font-medium">Your Answer</label>
                    <input type="text" 
                           class="bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white w-full max-w-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-mono text-lg placeholder-slate-600"
                           placeholder="Enter numerical value..."
                           value="${savedAnswer || ''}" 
                           oninput="window.setNatAnswer('${q.id}', this.value)"
                           autocomplete="off">
                </div>
            `;
        }

        questionContainer.innerHTML = `
            <div class="animate-fade-in">
                <!-- Header -->
                <div class="flex items-start justify-between mb-8 pb-6 border-b border-slate-700/50">
                    <div>
                        <div class="flex items-center gap-3 mb-2">
                             <span class="text-slate-400 font-bold tracking-wide text-xs uppercase">Question ${currentIndex + 1}</span>
                             <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-700 text-slate-300 tracking-wider">${q.type}</span>
                        </div>
                        <div class="text-slate-200 markdown-body text-lg leading-relaxed">${textHtml}</div>
                    </div>
                    <div class="shrink-0 ml-6">
                        <span class="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs font-bold whitespace-nowrap">
                            +${q.marks} Marks
                        </span>
                    </div>
                </div>

                <!-- Input Area -->
                ${optionsHtml}
            </div>
        `;

        MathRenderer.render(questionContainer);
    }

    // Interaction Handlers
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
        // Partial Re-render strategy for performance
        // But full re-render is safer for correct state styles
        renderQuestion(questions[currentIndex]);
        updatePalette();
    };

    window.setNatAnswer = (qId, val) => {
        userAnswers[qId] = val;
        if (val && val.trim() !== '') questionStatus[qId] = 'answered';
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
        nextBtn.innerHTML = currentIndex === questions.length - 1 
            ? 'Finish Review' 
            : 'Next <i class="fas fa-chevron-right ml-1"></i>';
        
        // Review Btn state
        const status = questionStatus[questions[currentIndex].id];
        if (status === 'review') {
             reviewBtn.classList.add('bg-purple-500/10', 'border-purple-500');
             reviewBtn.textContent = 'Unmark Review';
        } else {
             reviewBtn.classList.remove('bg-purple-500/10', 'border-purple-500');
             reviewBtn.textContent = 'Mark for Review';
        }
    }

    // Button Events
    prevBtn.addEventListener('click', () => loadQuestion(currentIndex - 1));
    nextBtn.addEventListener('click', () => {
        if (currentIndex < questions.length - 1) loadQuestion(currentIndex + 1);
        else {
            // Finish logic? Scroll to top?
            // alert('This is the last question.');
        }
    });

    clearBtn.addEventListener('click', () => {
        const qId = questions[currentIndex].id;
        delete userAnswers[qId];
        questionStatus[qId] = 'visited';
        loadQuestion(currentIndex);
        updatePalette();
    });

    reviewBtn.addEventListener('click', () => {
        const qId = questions[currentIndex].id;
        if (questionStatus[qId] === 'review') {
            // Revert to answered or visited
            questionStatus[qId] = userAnswers[qId] !== undefined ? 'answered' : 'visited';
        } else {
            questionStatus[qId] = 'review';
        }
        updatePalette();
        updateNavButtons();
    });

});
