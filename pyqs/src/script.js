
document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const sidebar = document.getElementById('sidebar');
    const mainView = document.getElementById('view-area');
    const timerDisplay = document.getElementById('timer-val');
    const paletteGrid = document.getElementById('palette-grid');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    
    // --- State ---
    const state = {
        view: 'HOME',
        subjects: [],
        currentPaper: null,
        currentQuestions: [],
        userAnswers: {}, // { qId: { selected: [], val:'', status: 'visited'|'answered'|'review' } }
        timer: 0,
        timerInterval: null,
        mode: 'EXAM',
        currentQIndex: 0
    };

    // --- Init ---
    init();

    async function init() {
        setupTheme();
        setupKeyboard();
        
        // Restore recent session?
        // const saved = localStorage.getItem('pyq_last_session');
        // if(saved) { ... }

        await fetchSubjects();
        renderHome();
    }

    // --- Data ---
    async function fetchSubjects() {
        try {
            const resp = await fetch('subjects/subjects_index.json');
            if (resp.ok) state.subjects = await resp.json();
        } catch (e) {
            console.error(e);
        }
    }

    async function loadPapers(subject) {
        try {
            renderLoading();
            const resp = await fetch(`subjects/${subject}.json`);
            const allQs = await resp.json();
            
            // Group papers logic
            const grouped = {};
            allQs.forEach(q => {
                const key = `${q.exam} ${q.year}`;
                if (!grouped[key]) {
                    grouped[key] = {
                        id: key, title: key, exam: q.exam, year: q.year, subject: subject,
                        questions: [],
                    };
                }
                grouped[key].questions.push(q);
            });
            
            renderPaperList(Object.values(grouped), subject);
        } catch(e) {
            console.error(e);
        }
    }

    function startPaper(paper) {
        state.currentPaper = paper;
        state.currentQuestions = paper.questions;
        state.currentQIndex = 0;
        state.userAnswers = {};
        state.view = 'PAPER';
        state.timer = 0;
        
        // Initial Visited
        markVisited(state.currentQIndex);

        startTimer();
        renderExamInterface();
    }

    // --- Rendering ---
    function renderHome() {
        toggleSidebar(false);
        mainView.innerHTML = `
            <div style="padding: 2rem;">
                <h1 style="margin-bottom:2rem; font-size:2.5rem;">Dashboard</h1>
                <div class="grid-view" id="subjects-grid"></div>
            </div>
        `;
        
        const grid = document.getElementById('subjects-grid');
        state.subjects.forEach(sub => {
            const card = document.createElement('div');
            card.className = 'paper-card';
            card.innerHTML = `
                <div style="font-weight:700; font-size:1.4rem; margin-bottom:0.5rem; color:var(--primary-blue);">${formatName(sub)}</div>
                <div style="color:var(--text-secondary);">Browse Papers <i class="fa-solid fa-arrow-right"></i></div>
            `;
            card.onclick = () => loadPapers(sub);
            grid.appendChild(card);
        });
    }

    function renderPaperList(papers, subject) {
        mainView.innerHTML = `
            <div style="padding: 2rem;">
                <div class="flex items-center gap-2 mb-4">
                    <button class="nav-btn" onclick="window.goHome()"><i class="fa-solid fa-arrow-left"></i> Back</button>
                    <h1>${formatName(subject)}</h1>
                </div>
                <div class="grid-view" style="grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));">
                    ${papers.map(p => `
                        <div class="paper-card" onclick="window.startPaperId('${p.id}')">
                            <div style="font-weight:700; font-size:1.1rem; margin-bottom:0.5rem;">${p.title}</div>
                            <div class="flex justify-between text-secondary">
                                <span><i class="fa-solid fa-list-ol"></i> ${p.questions.length} Qs</span>
                                <span><i class="fa-regular fa-clock"></i> Practice</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        window.startPaperId = (id) => startPaper(papers.find(x => x.id === id));
        window.goHome = renderHome;
    }

    function renderExamInterface() {
        toggleSidebar(true);
        updateMeta();
        updatePalette();
        renderActiveQuestion();
    }

    function renderActiveQuestion() {
        const q = state.currentQuestions[state.currentQIndex];
        const ans = state.userAnswers[q.id] || {};
        const isReview = ans.status === 'review';

        let html = `
            <div class="q-container">
                 <div class="mode-toggle">
                    <div class="mode-btn ${state.mode === 'EXAM' ? 'active' : ''}" onclick="window.setMode('EXAM')">Exam Mode</div>
                    <div class="mode-btn ${state.mode === 'LEARNING' ? 'active' : ''}" onclick="window.setMode('LEARNING')">Learning</div>
                </div>

                <div class="q-header">
                    <div class="q-title">Question ${state.currentQIndex + 1}</div>
                    <div class="q-type-badge">${q.type || 'MCQ'}</div>
                </div>
                
                ${q.context ? `<div class="q-context">${q.context}</div>` : ''}

                <div class="q-body">
                    <div class="q-text">${q.question || ''}</div>
                    ${(q.images || []).map(img => `<img src="${img}" class="q-img" onclick="window.open(this.src)" style="cursor:zoom-in"/>`).join('')}
                </div>

                <div class="opt-group">
                    ${renderOptions(q, ans)}
                </div>

                <div class="q-footer">
                    <button class="review-btn ${isReview ? 'active' : ''}" onclick="window.toggleReview()">
                        <i class="fa-solid fa-flag"></i> ${isReview ? 'Marked' : 'Review'}
                    </button>
                    
                    <div class="flex gap-2">
                        <button class="nav-btn" onclick="window.navQ(-1)" ${state.currentQIndex === 0 ? 'disabled' : ''}>Prev</button>
                        <button class="nav-btn" style="background:var(--text-primary); color:var(--bg-color);" onclick="window.navQ(1)" ${state.currentQIndex === state.currentQuestions.length - 1 ? 'disabled' : ''}>
                            Next <i class="fa-solid fa-chevron-right"></i>
                        </button>
                    </div>
                </div>

                ${state.mode === 'LEARNING' ? renderFeedback(q) : ''}
            </div>
        `;
        mainView.innerHTML = html;
        updatePalette();
        markVisited(state.currentQIndex);
    }

    function renderOptions(q, ans) {
        if (q.options?.length) {
            return q.options.map((opt) => {
                const isSelected = ans.selected?.includes(String(opt.id));
                let style = '';
                if(state.mode === 'LEARNING' && isSelected) {
                    style = opt.is_correct ? 'border-color:var(--accent-color); background:rgba(16,185,129,0.1);' 
                                           : 'border-color:var(--danger-color); background:rgba(239,68,68,0.1);';
                }

                return `
                <div class="opt-row ${isSelected ? 'selected' : ''}" style="${style}" onclick="window.selectOpt('${q.id}', '${opt.id}')">
                    <div class="opt-radio"></div>
                    <div style="flex:1;">
                        ${opt.text || ''}
                        ${opt.image ? `<img src="${opt.image}" style="max-width:200px; display:block; margin-top:8px; border-radius:4px" />` : ''}
                    </div>
                </div>`;
            }).join('');
        }
        else if(q.answer) {
             return `<input class="nat-input" value="${ans.val || ''}" oninput="window.inputNat('${q.id}', this.value)" placeholder="Enter numeric value" />`;
        }
        return '';
    }

    // --- Core Logic ---

    function markVisited(idx) {
        const qId = state.currentQuestions[idx].id;
        if (!state.userAnswers[qId]) {
            state.userAnswers[qId] = { status: 'visited', selected: [] };
        }
        updatePalette();
    }

    window.selectOpt = (qId, optId) => {
        const q = state.currentQuestions.find(x => x.id === qId);
        const type = q.type || 'MCQ';
        let ans = state.userAnswers[qId] || { selected: [], status:'visited' };
        
        let sel = ans.selected || [];
        if(type === 'MSQ') {
            sel.includes(String(optId)) ? sel=sel.filter(x=>x!=String(optId)) : sel.push(String(optId));
        } else {
            sel = [String(optId)];
        }
        
        ans.selected = sel;
        if(ans.status !== 'review') ans.status = sel.length ? 'answered' : 'visited';
        
        state.userAnswers[qId] = ans;
        renderActiveQuestion();
    };

    window.inputNat = (qId, val) => {
        let ans = state.userAnswers[qId] || { status:'visited' };
        ans.val = val;
        if(ans.status !== 'review') ans.status = val ? 'answered' : 'visited';
        state.userAnswers[qId] = ans;
        updatePalette();
    };

    window.toggleReview = () => {
        const qId = state.currentQuestions[state.currentQIndex].id;
        let ans = state.userAnswers[qId] || { selected:[], status:'visited' };
        ans.status = ans.status === 'review' ? (ans.selected?.length ? 'answered' : 'visited') : 'review';
        state.userAnswers[qId] = ans;
        renderActiveQuestion();
    };

    window.navQ = (dir) => {
        state.currentQIndex += dir;
        renderActiveQuestion();
    };

    window.setMode = (m) => {
        state.mode = m;
        renderActiveQuestion();
    };

    window.submitExam = () => {
        showModal('submit');
    };

    function calculateResult() {
        let score = 0;
        let correct = 0;
        let wrong = 0;
        let unattempted = 0;

        state.currentQuestions.forEach(q => {
            const ans = state.userAnswers[q.id];
            if (!ans || (!ans.selected?.length && !ans.val)) {
                unattempted++;
                return;
            }

            // Check correctness
            let isCorrect = false;
            
            if (q.options) {
                const correctIds = q.options.filter(o => o.is_correct).map(o => String(o.id));
                const userIds = ans.selected || [];
                
                // Exact match for MSQ/MCQ logic for simplicity
                if (correctIds.length === userIds.length && correctIds.every(id => userIds.includes(id))) {
                    isCorrect = true;
                }
            } else if (q.answer) {
                 const v = parseFloat(ans.val);
                 const min = parseFloat(q.answer.value_start);
                 const max = q.answer.value_end ? parseFloat(q.answer.value_end) : min;
                 if(!isNaN(v) && v >= min && v <= max) isCorrect = true;
            }

            if (isCorrect) { correct++; score += 1; /* Assign typical marks? */ }
            else { wrong++; }
        });

        return { score, correct, wrong, unattempted, total: state.currentQuestions.length };
    }

    // --- Modal Logic ---
    function showModal(type) {
        modalOverlay.classList.remove('hidden');
        modalOverlay.classList.add('open');
        
        if (type === 'submit') {
            const answered = Object.values(state.userAnswers).filter(x => x.selected?.length || x.val).length;
            const review = Object.values(state.userAnswers).filter(x => x.status === 'review').length;
            
            modalContent.innerHTML = `
                <h2 style="margin-bottom:1rem; font-size:1.5rem;">Submit Exam?</h2>
                <div class="stat-grid">
                    <div class="stat-box"><div class="stat-val text-success">${answered}</div><div class="stat-label">Answered</div></div>
                    <div class="stat-box"><div class="stat-val text-warning" style="color:var(--warning-color)">${review}</div><div class="stat-label">Review</div></div>
                </div>
                <div style="text-align:center; color:var(--text-secondary); margin-bottom:2rem;">
                    Are you sure you want to end this session?
                </div>
                <div class="flex gap-2">
                    <button class="submit-btn" style="background:var(--bg-color); color:var(--text-primary);" onclick="window.closeModal()">Cancel</button>
                    <button class="submit-btn" onclick="window.confirmSubmit()">Submit</button>
                </div>
            `;
        } else if (type === 'result') {
            const res = calculateResult();
            modalContent.innerHTML = `
                <h2 style="text-align:center; margin-bottom:1rem;">Result Summary</h2>
                <div class="timer-box" style="margin-bottom:1rem; background:transparent;">
                    <div class="timer-val">${res.score} / ${res.total}</div>
                    <div class="meta-label">Total Score</div>
                </div>
                <div class="stat-grid">
                    <div class="stat-box"><div class="stat-val text-success">${res.correct}</div><div class="stat-label">Correct</div></div>
                    <div class="stat-box"><div class="stat-val text-danger">${res.wrong}</div><div class="stat-label">Wrong</div></div>
                </div>
                <button class="submit-btn" onclick="window.closeModal(); window.goHome()">Back to Home</button>
            `;
        }
    }

    window.closeModal = () => {
        modalOverlay.classList.remove('open');
        setTimeout(() => modalOverlay.classList.add('hidden'), 200);
    };

    window.confirmSubmit = () => {
        clearInterval(state.timerInterval);
        showModal('result');
    };

    // --- Helpers ---
    function startTimer() {
        if(state.timerInterval) clearInterval(state.timerInterval);
        state.timerInterval = setInterval(() => {
            state.timer++;
            updateTimerDisplay();
        }, 1000);
    }
    function updateTimerDisplay() {
        const m = Math.floor(state.timer / 60).toString().padStart(2, '0');
        const s = (state.timer % 60).toString().padStart(2, '0');
        if(timerDisplay) timerDisplay.textContent = `${m}:${s}`;
    }
    
    function updatePalette() {
        paletteGrid.innerHTML = '';
        state.currentQuestions.forEach((q, idx) => {
            const st = state.userAnswers[q.id]?.status;
            const btn = document.createElement('div');
            btn.className = `p-btn ${idx===state.currentQIndex?'active':''} ${st||''}`;
            btn.textContent = idx+1;
            btn.onclick = () => { state.currentQIndex=idx; renderActiveQuestion(); };
            paletteGrid.appendChild(btn);
        });
    }

    function renderLoading() { mainView.innerHTML = '<div style="display:flex;height:100%;justify-content:center;align-items:center;">Loading...</div>'; }
    function renderFeedback(q) {
        // Feedback HTML helper
        return `<div style="margin-top:2rem; padding:1rem; background:rgba(0,0,0,0.03); border-radius:12px;">Ans: ...</div>`;
    }
    function updateMeta() {
        document.getElementById('meta-exam').textContent = state.currentPaper?.exam || '';
        document.getElementById('meta-subject').textContent = formatName(state.currentPaper?.subject || '');
    }
    function toggleSidebar(show) {
        sidebar.style.display = show ? 'flex' : 'none';
        document.querySelector('.top-nav').style.display = show ? 'none' : 'flex';
    }
    function setupKeyboard() {
        document.addEventListener('keydown', (e) => {
            if(state.view !== 'PAPER') return;
            if(e.key === 'ArrowRight') window.navQ(1);
            if(e.key === 'ArrowLeft') window.navQ(-1);
        });
    }
    function formatName(s) { return s.replace(/_/g, ' ').toUpperCase(); }
    function setupTheme() { document.getElementById('theme-toggle').onclick = () => document.body.classList.toggle('dark'); }
});
