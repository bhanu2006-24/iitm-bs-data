
document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const sidebar = document.getElementById('sidebar');
    const mainView = document.getElementById('view-area');
    const timerDisplay = document.getElementById('timer-val');
    const paletteGrid = document.getElementById('palette-grid');
    const examMeta = document.getElementById('exam-meta');

    // State
    const state = {
        view: 'HOME', // HOME, PAPER
        subjects: [],
        currentPaper: null,
        userAnswers: {}, // { qId: { val: ..., status: 'answered'|'visited' } }
        timer: 0,
        timerInterval: null,
        mode: 'EXAM', // EXAM | LEARNING
        currentQIndex: 0
    };

    // Init
    init();

    async function init() {
        setupTheme();
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
            console.error("Values fetch error", e);
        }
    }

    // --- Logic ---

    // Automatically grouping questions into "Papers"
    // Since we have huge subject JSONs, we filter on the fly.
    async function loadPapers(subject) {
        // Fetch Subject Data
        try {
            const resp = await fetch(`subjects/${subject}.json`);
            const allQs = await resp.json();
            
            // Group by Paper Name / Year
            const grouped = {};
            allQs.forEach(q => {
                const key = `${q.exam} ${q.year}`; // e.g. "Quiz 1 2024"
                if (!grouped[key]) {
                    grouped[key] = {
                        id: key,
                        title: key,
                        exam: q.exam,
                        year: q.year,
                        subject: subject,
                        questions: [],
                        totalMarks: 0
                    };
                }
                grouped[key].questions.push(q);
                // Simple mark logic if not present
                // Assuming 1 mark if missing? Or 0.
                // q.mark usually isn't in clean data explicitly unless we kept it?
                // clean_data.py didn't keep 'mark', but might be in future.
                // Let's assume grouping is enough.
            });

            renderPaperList(Object.values(grouped), subject);
        } catch (e) {
            console.error(e);
            mainView.innerHTML = `Error loading ${subject}`;
        }
    }

    function startPaper(paper) {
        state.currentPaper = paper;
        state.view = 'PAPER';
        state.questions = paper.questions; // Ordered list
        state.currentQIndex = 0;
        state.userAnswers = {};
        state.timer = 0;
        
        // Start Timer
        if (state.timerInterval) clearInterval(state.timerInterval);
        state.timerInterval = setInterval(() => {
            state.timer++;
            updateTimerDisplay();
        }, 1000);

        renderExamInterface();
    }
    
    // --- Rendering ---

    function renderHome() {
        state.view = 'HOME';
        toggleSidebar(false); // Hide exam sidebar
        
        mainView.innerHTML = `
            <div style="padding: 2rem;">
                <h1 style="margin-bottom:2rem;">Dashboard</h1>
                <div class="grid-view" id="subjects-grid"></div>
            </div>
        `;
        
        const grid = document.getElementById('subjects-grid');
        state.subjects.forEach(sub => {
            const card = document.createElement('div');
            card.className = 'paper-card';
            card.innerHTML = `
                <div style="font-weight:700; font-size:1.2rem; margin-bottom:0.5rem;">${formatName(sub)}</div>
                <div style="color:var(--text-secondary); font-size:0.9rem;">Click to view papers</div>
            `;
            card.onclick = () => loadPapers(sub); // Loads list of papers
            grid.appendChild(card);
        });
    }

    function renderPaperList(papers, subject) {
        mainView.innerHTML = `
            <div style="padding: 2rem;">
                <div style="display:flex; align-items:center; gap:1rem; margin-bottom:2rem;">
                    <button class="nav-link" id="home-btn"><i class="fa-solid fa-arrow-left"></i> Back</button>
                    <h1>${formatName(subject)} Papers</h1>
                </div>
                <div class="grid-view">
                    ${papers.map(p => `
                        <div class="paper-card" onclick="window.startPaperId('${p.id}')">
                            <div style="font-weight:700;">${p.title}</div>
                            <div style="font-size:0.9rem; color:var(--text-secondary); margin-top:0.5rem;">
                                ${p.questions.length} Questions
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        document.getElementById('home-btn').onclick = renderHome;
        
        // Expose helper to global scope for the inline onclick string
        window.startPaperId = (id) => {
            const p = papers.find(x => x.id === id);
            if (p) startPaper(p);
        };
    }

    function renderExamInterface() {
        toggleSidebar(true);
        updateMeta();
        updatePalette();
        renderActiveQuestion();
    }

    function renderActiveQuestion() {
        const q = state.questions[state.currentQIndex];
        
        // Mode Check: In Learning Mode, we show answers immediately? 
        // User wants toggle.
        
        let html = `
            <div class="q-container">
                <!-- Mode Toggle -->
                <div class="mode-toggle">
                    <div class="mode-btn ${state.mode === 'EXAM' ? 'active' : ''}" onclick="window.setMode('EXAM')">Exam Mode</div>
                    <div class="mode-btn ${state.mode === 'LEARNING' ? 'active' : ''}" onclick="window.setMode('LEARNING')">Learning Mode</div>
                </div>

                <div class="q-header">
                    <div class="q-title">Question ${state.currentQIndex + 1} : <span style="font-weight:400; font-size:0.9rem; color:var(--text-secondary);">${q.id}</span></div>
                    <div class="q-badge">Type: ${q.type || 'MCQ'}</div>
                </div>
                
                ${q.context ? `<div class="q-context">${q.context}</div>` : ''}

                <div class="q-body">
                    <div style="margin-bottom:1.5rem;">${q.question || ''}</div>
                    ${(q.images || []).map(img => `<img src="${img}" style="max-width:100%; border-radius:8px; margin-bottom:1rem; display:block;" />`).join('')}
                </div>

                <div class="opt-group">
                    ${renderOptions(q)}
                </div>

                <!-- Nav Controls -->
                <div style="display:flex; justify-content:space-between; margin-top:3rem;">
                    <button class="nav-link" onclick="window.navQ(-1)" ${state.currentQIndex === 0 ? 'disabled' : ''}>
                        <i class="fa-solid fa-chevron-left"></i> Prev
                    </button>
                    <button class="nav-link" onclick="window.navQ(1)" ${state.currentQIndex === state.questions.length - 1 ? 'disabled' : ''}>
                        Next <i class="fa-solid fa-chevron-right"></i>
                    </button>
                </div>
                
                <!-- Feedback (Learning Mode) -->
                ${state.mode === 'LEARNING' ? renderFeedback(q) : ''}
            </div>
        `;
        
        mainView.innerHTML = html;
        updatePalette(); // Highlight current
    }

    function renderOptions(q) {
        if (q.options && q.options.length > 0) {
            return q.options.map((opt, idx) => {
                const isSelected = isOptSelected(q.id, opt.id);
                // In learning mode, show if correct
                let extraClass = '';
                if (state.mode === 'LEARNING' && isSelected) {
                     extraClass = opt.is_correct ? 'color:var(--accent-color); font-weight:bold;' : 'color:var(--danger-color);';
                }

                return `
                <div class="opt-row" onclick="window.selectOpt('${q.id}', '${opt.id}')">
                    <div class="opt-radio ${isSelected ? 'selected' : ''}"></div>
                    <div class="opt-text" style="${extraClass}">
                        ${opt.text || ''}
                        ${opt.image ? `<img src="${opt.image}" style="max-width:150px; display:block; margin-top:0.5rem;" />` : ''}
                    </div>
                </div>`;
            }).join('');
        } else if (q.answer) {
            // NAT
            const val = state.userAnswers[q.id]?.val || '';
            return `<input class="nat-input" value="${val}" oninput="window.inputNat('${q.id}', this.value)" placeholder="Enter numeric value..." />`;
        }
        return '';
    }

    function renderFeedback(q) {
        // Show correct answer immediately
        if (q.options) {
             const correct = q.options.filter(o => o.is_correct).map(o => o.text || 'Image').join(', ');
             return `<div style="margin-top:2rem; padding:1rem; background:rgba(16,185,129,0.1); color:var(--accent-color); border-radius:8px;">
                <strong>Correct Answer:</strong> ${correct}
             </div>`;
        } else if (q.answer) {
             return `<div style="margin-top:2rem; padding:1rem; background:rgba(16,185,129,0.1); color:var(--accent-color); border-radius:8px;">
                <strong>Range:</strong> ${q.answer.value_start} - ${q.answer.value_end || q.answer.value_start}
             </div>`;
        }
    }

    // --- State Helpers ---
    
    function isOptSelected(qId, optId) {
        const ans = state.userAnswers[qId];
        if (!ans || !ans.selected) return false;
        return ans.selected.includes(String(optId));
    }

    window.navQ = (dir) => {
        state.currentQIndex += dir;
        renderActiveQuestion();
    };

    window.setMode = (m) => {
        state.mode = m;
        // Re-render
        renderActiveQuestion();
    };

    window.selectOpt = (qId, optId) => {
        // Assume MCQ for now logic, unless type MSQ check
        // Grouping: "MCQ" single, "MSQ" multi
        const q = state.questions[state.currentQIndex];
        const type = q.type || 'MCQ';
        
        if (!state.userAnswers[qId]) state.userAnswers[qId] = { selected: [], status: 'visited' };
        
        let sel = state.userAnswers[qId].selected;
        
        if (type === 'MSQ') {
            if (sel.includes(String(optId))) sel = sel.filter(x => x !== String(optId));
            else sel.push(String(optId));
        } else {
            sel = [String(optId)];
        }
        
        state.userAnswers[qId].selected = sel;
        state.userAnswers[qId].status = 'answered';
        
        renderActiveQuestion();
        updatePalette();
    };

    window.inputNat = (qId, val) => {
        if (!state.userAnswers[qId]) state.userAnswers[qId] = { val: '', status: 'visited' };
        state.userAnswers[qId].val = val;
        state.userAnswers[qId].status = val ? 'answered' : 'visited';
        updatePalette();
    };

    // --- Sidebar Helpers ---

    function toggleSidebar(show) {
        sidebar.style.display = show ? 'flex' : 'none';
        document.querySelector('.top-nav').style.display = show ? 'none' : 'flex';
    }

    function updateMeta() {
        if (!state.currentPaper) return;
        const examName = document.getElementById('meta-exam');
        const subName = document.getElementById('meta-subject');
        
        examName.textContent = state.currentPaper.exam;
        subName.textContent = formatName(state.currentPaper.subject);
    }
    
    function updateTimerDisplay() {
        if (!timerDisplay) return;
        const m = Math.floor(state.timer / 60).toString().padStart(2, '0');
        const s = (state.timer % 60).toString().padStart(2, '0');
        timerDisplay.textContent = `${m}:${s}`;
    }

    function updatePalette() {
        const grid = document.getElementById('palette-grid');
        grid.innerHTML = '';
        state.questions.forEach((q, idx) => {
            const btn = document.createElement('div');
            btn.className = 'p-btn';
            
            if (idx === state.currentQIndex) btn.classList.add('active');
            
            // Check status
            const status = state.userAnswers[q.id]?.status;
            if (status === 'answered') btn.classList.add('answered');
            
            btn.textContent = idx + 1;
            btn.onclick = () => {
                state.currentQIndex = idx;
                renderActiveQuestion();
            };
            grid.appendChild(btn);
        });
    }

    // --- Utils ---
    function formatName(str) {
        return str.replace(/_/g, ' ').toUpperCase();
    }
    
    function setupTheme() {
        document.getElementById('theme-toggle').onclick = () => {
            document.body.classList.toggle('dark');
        };
    }
});
