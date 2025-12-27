
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
        currentSubject: null,
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
        await fetchSubjects();
        renderHome();
    }

    // --- Data ---
    async function fetchSubjects() {
        try {
            const resp = await fetch('subjects/subjects_index.json');
            if (resp.ok) {
                state.subjects = await resp.json();
            }
        } catch (e) {
            console.error("Error fetching subjects:", e);
            mainView.innerHTML = `<div style="padding:2rem; color:red">Error loading subjects. Please check console.</div>`;
        }
    }

    async function loadPapers(subjectId) {
        try {
            renderLoading();
            const resp = await fetch(`subjects/${subjectId}.json`);
            if(!resp.ok) throw new Error("Failed to load subject data");
            
            const data = await resp.json();
            // data matches structure: { subject_id, subject_name, subject_code, papers: [...] }
            state.currentSubject = data;
            
            renderPaperList(data);
        } catch(e) {
            console.error(e);
            mainView.innerHTML = `<div style="padding:2rem;">Error loading papers for ${subjectId}</div>`;
        }
    }

    function startPaper(paperId) {
        const paper = state.currentSubject.papers.find(p => p.id === paperId);
        if(!paper) return;

        state.currentPaper = paper;
        state.currentQuestions = paper.questions || [];
        state.currentQIndex = 0;
        state.userAnswers = {};
        state.view = 'PAPER';
        state.timer = 0;
        
        // Initial Visited
        if(state.currentQuestions.length > 0) {
            markVisited(state.currentQIndex);
        }

        startTimer();
        renderExamInterface();
    }

    // --- Rendering ---
    function renderHome() {
        toggleSidebar(false);
        mainView.innerHTML = `
            <div style="padding: 2rem; max-width: 1200px; margin: 0 auto;">
                <div style="margin-bottom: 2rem;">
                    <h1 style="font-size:2rem; margin-bottom:0.5rem;">Indian Institute of Technology Madras</h1>
                    <div style="color:var(--text-secondary); font-size:1.1rem;">BS Degree in Data Science and Applications - Previous Year Questions</div>
                </div>
                
                <div class="grid-view" id="subjects-grid"></div>
            </div>
        `;
        
        const grid = document.getElementById('subjects-grid');
        state.subjects.forEach(sub => {
            const card = document.createElement('div');
            card.className = 'paper-card';
            // sub has { id, name, code, paper_count }
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:1rem;">
                    <div class="subject-code-badge">${sub.code}</div>
                    <div style="color:var(--text-secondary); font-size:0.9rem;">${sub.paper_count} Papers</div>
                </div>
                <div style="font-weight:700; font-size:1.2rem; margin-bottom:1.5rem; color:var(--text-primary); line-height:1.4;">
                    ${sub.name}
                </div>
                <div style="color:var(--primary-blue); font-weight:500; font-size:0.95rem; display:flex; align-items:center;">
                    Open Subject <i class="fa-solid fa-arrow-right" style="margin-left:8px"></i>
                </div>
            `;
            card.onclick = () => loadPapers(sub.id);
            grid.appendChild(card);
        });
    }

    function renderPaperList(subjectData) {
        // Group by exam type
        const groups = {};
        subjectData.papers.forEach(p => {
             // Normalized type for grouping
             let type = p.exam_type || 'Other';
             // Fix common inconsistencies if strict grouping needed
             if(type.toLowerCase().replace(/\s/g,'') === 'quiz1') type = 'Quiz 1';
             if(type.toLowerCase().replace(/\s/g,'') === 'quiz2') type = 'Quiz 2';
             
             if(!groups[type]) groups[type] = [];
             groups[type].push(p);
        });

        // Sort keys: Quiz 1, Quiz 2, End Term, others
        const order = ['Quiz 1', 'Quiz 2', 'End Term', 'Practice'];
        const sortedKeys = Object.keys(groups).sort((a,b) => {
             const ia = order.findIndex(k => a.toLowerCase().includes(k.toLowerCase()));
             const ib = order.findIndex(k => b.toLowerCase().includes(k.toLowerCase()));
             if(ia !== -1 && ib !== -1) return ia - ib;
             if(ia !== -1) return -1;
             if(ib !== -1) return 1;
             return a.localeCompare(b);
        });

        let html = `
            <div style="padding: 2rem; max-width: 1000px; margin: 0 auto;">
                <div class="flex items-center gap-2 mb-6">
                    <button class="nav-btn" onclick="window.goHome()"><i class="fa-solid fa-arrow-left"></i> All Subjects</button>
                    <div style="margin-left:1rem;">
                        <h2 style="margin:0; font-size:1.5rem;">${subjectData.subject_name}</h2>
                        <span style="color:var(--text-secondary); font-size:0.9rem;">${subjectData.subject_code}</span>
                    </div>
                </div>`;
        
        sortedKeys.forEach(key => {
            html += `<h3 style="margin-top:2rem; margin-bottom:1rem; color:var(--primary-blue); border-bottom:1px solid var(--border-color); padding-bottom:0.5rem; font-size:1.1rem;">${key}</h3>`;
            html += `<div class="paper-list-container">`;
            html += groups[key].map(p => `
                        <div class="paper-row" onclick="window.startPaperId('${p.id}')">
                            <div class="p-icon"><i class="fa-regular fa-file-pdf"></i></div>
                            <div class="p-info">
                                <div class="p-title">${p.title}</div>
                                <div class="p-meta">
                                    <span>${p.year}</span> &bull; <span>${p.question_count} Qs</span>
                                </div>
                            </div>
                            <div class="p-action">
                                <i class="fa-solid fa-chevron-right"></i>
                            </div>
                        </div>
            `).join('');
            html += `</div>`;
        });
        
        html += `</div>`;
        mainView.innerHTML = html;
        
        window.startPaperId = (id) => startPaper(id);
        window.goHome = renderHome;
    }

    function renderExamInterface() {
        toggleSidebar(true);
        updateMeta();
        updatePalette();
        renderActiveQuestion();
    }

    function renderActiveQuestion() {
        if (!state.currentQuestions || state.currentQuestions.length === 0) {
            mainView.innerHTML = `<div style="padding:2rem">No questions found in this paper.</div>`;
            return;
        }

        const q = state.currentQuestions[state.currentQIndex];
        const ans = state.userAnswers[q.id] || {};
        const isReview = ans.status === 'review';

        let html = `
            <div class="q-container">
                 <div class="mode-toggle">
                    <div class="mode-btn ${state.mode === 'EXAM' ? 'active' : ''}" onclick="window.setMode('EXAM')">Exam Mode</div>
                    <div class="mode-btn ${state.mode === 'LEARNING' ? 'active' : ''}" onclick="window.setMode('LEARNING')">Solution View</div>
                </div>

                <div class="paper-header-strip">
                    <div>
                        <span style="font-weight:bold;">Question ${state.currentQIndex + 1}</span>
                        <span style="color:#666; margin-left:10px;">${q.type || 'MCQ'}</span>
                    </div>
                    <div>
                        ${q.marks ? `<span>${q.marks} Marks</span>` : ''}
                    </div>
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
                let statusClass = '';
                
                // Learning mode logic
                if(state.mode === 'LEARNING') {
                    if (opt.is_correct) {
                        statusClass = 'correct-opt';
                    } else if (isSelected && !opt.is_correct) {
                        style = 'border-color:var(--danger-color); background:rgba(239,68,68,0.1);';
                    }
                }

                return `
                <div class="opt-row ${isSelected ? 'selected' : ''} ${statusClass}" style="${style}" onclick="window.selectOpt('${q.id}', '${opt.id}')">
                    <div class="opt-radio">
                        ${isSelected ? '<div style="width:10px; height:10px; background:white; border-radius:50%;"></div>' : ''}
                    </div>
                    <div style="flex:1;">
                        ${opt.text || ''}
                        ${opt.image ? `<img src="${opt.image}" style="max-width:200px; display:block; margin-top:8px; border-radius:4px" />` : ''}
                    </div>
                    ${statusClass ? '<i class="fa-solid fa-check" style="color:#10b981; margin-left:10px;"></i>' : ''}
                </div>`;
            }).join('');
        }
        else if(q.answer) {
             const val = ans.val || '';
             // If learning mode, show correct answer hint
             const correctHint = state.mode === 'LEARNING' ? 
                `<div style="margin-top:5px; color:#10b981; font-size:0.9rem;">Correct Answer: ${q.answer.value_start} ${q.answer.value_end ? '- ' + q.answer.value_end : ''}</div>` 
                : '';

             return `
                <div style="padding:1rem;">
                    <label style="font-weight:500; display:block; margin-bottom:0.5rem;">Your Answer:</label>
                    <input class="nat-input" type="number" step="any" value="${val}" oninput="window.inputNat('${q.id}', this.value)" placeholder="Enter numeric value" />
                    ${correctHint}
                </div>
             `;
        }
        return '<div style="padding:1rem;">No options available.</div>';
    }

    // --- Core Logic ---

    function markVisited(idx) {
        if (!state.currentQuestions[idx]) return;
        const qId = state.currentQuestions[idx].id;
        if (!state.userAnswers[qId]) {
            state.userAnswers[qId] = { status: 'visited', selected: [] };
        }
        updatePalette();
    }

    window.selectOpt = (qId, optId) => {
        if(state.mode === 'LEARNING') return; // Read only in learning mode? Or allow interact? Let's allow interact but show feedback instantly
        
        const q = state.currentQuestions.find(x => x.id === qId);
        const type = q.type || 'MCQ';
        let ans = state.userAnswers[qId] || { selected: [], status:'visited' };
        
        // Multi-select or Single?
        // Assuming MCQ is single, MSQ is multi
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
        const newIdx = state.currentQIndex + dir;
        if(newIdx >= 0 && newIdx < state.currentQuestions.length) {
            state.currentQIndex = newIdx;
            renderActiveQuestion();
        }
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

            let isCorrect = false;
            if (q.options) {
                // Check if options match
                const correctIds = q.options.filter(o => o.is_correct).map(o => String(o.id));
                const userIds = ans.selected || [];
                
                // Sort to compare
                correctIds.sort();
                userIds.sort();
                
                if (JSON.stringify(correctIds) === JSON.stringify(userIds)) {
                    isCorrect = true;
                }
            } else if (q.answer) {
                 const v = parseFloat(ans.val);
                 const min = parseFloat(q.answer.value_start);
                 const max = q.answer.value_end ? parseFloat(q.answer.value_end) : min;
                 if(!isNaN(v) && v >= min && v <= max) isCorrect = true;
            }

            if (isCorrect) { correct++; score += 1; }
            else { wrong++; }
        });

        return { score, correct, wrong, unattempted, total: state.currentQuestions.length };
    }

    // --- Modal Logic ---
    function showModal(type) {
        modalOverlay.classList.remove('hidden');
        
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
                    <button class="submit-btn" style="background:var(--bg-color); color:var(--text-primary); border:1px solid var(--border-color);" onclick="window.closeModal()">Cancel</button>
                    <button class="submit-btn" onclick="window.confirmSubmit()">Submit</button>
                </div>
            `;
        } else if (type === 'result') {
            const res = calculateResult();
            modalContent.innerHTML = `
                <h2 style="text-align:center; margin-bottom:1rem;">Result Summary</h2>
                <div class="timer-box" style="margin-bottom:1rem; background:transparent; border:none; box-shadow:none;">
                    <div class="timer-val" style="color:var(--text-primary)">${res.score} / ${res.total}</div>
                    <div class="meta-label">Total Score</div>
                </div>
                <div class="stat-grid">
                    <div class="stat-box"><div class="stat-val text-success">${res.correct}</div><div class="stat-label">Correct</div></div>
                    <div class="stat-box"><div class="stat-val text-danger">${res.wrong}</div><div class="stat-label">Wrong</div></div>
                </div>
                <button class="submit-btn" onclick="window.closeModal(); window.goHome()" style="margin-top:2rem;">Back to Home</button>
            `;
        }
    }

    window.closeModal = () => {
        modalOverlay.classList.add('hidden');
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
        // Shown inline in options or as a block
        return ''; 
    }
    function updateMeta() {
        document.getElementById('meta-exam').textContent = state.currentPaper?.exam_type || '';
        document.getElementById('meta-subject').textContent = state.currentSubject?.subject_name || '';
    }
    function toggleSidebar(show) {
        sidebar.style.display = show ? 'flex' : 'none';
        const topNav = document.querySelector('.top-nav');
        if(topNav) topNav.style.display = show ? 'none' : 'flex';
    }
    function setupKeyboard() {
        document.addEventListener('keydown', (e) => {
            if(state.view !== 'PAPER') return;
            if(e.key === 'ArrowRight') window.navQ(1);
            if(e.key === 'ArrowLeft') window.navQ(-1);
        });
    }
    function setupTheme() { 
        const toggle = document.getElementById('theme-toggle');
        if(toggle) toggle.onclick = () => document.body.classList.toggle('dark'); 
    }
});
