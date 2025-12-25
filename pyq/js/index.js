// No external utils needed for now
// import { Utils } from './utils.js'; 

document.addEventListener('DOMContentLoaded', async () => {
    const subjectsContainer = document.getElementById('subjects-container');
    const subjectsView = document.getElementById('subjects-view');
    const examsView = document.getElementById('exams-view');
    const examsContainer = document.getElementById('exams-container');
    const navBar = document.getElementById('nav-bar');
    const backBtn = document.getElementById('back-to-subjects');
    const subjectTitle = document.getElementById('subject-title');
    const subjectBadge = document.getElementById('subject-code-badge');

    // Fetch Subjects Dynamically
    try {
        const response = await fetch('/api/subjects');
        if (!response.ok) throw new Error('API request failed');
        const subjects = await response.json();
        renderSubjects(subjects);
    } catch (e) {
        console.error('Failed to load subjects:', e);
        if(subjectsContainer) {
            subjectsContainer.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <p class="text-red-400 mb-2">Failed to load subjects data.</p>
                    <p class="text-slate-500 text-sm">Ensure 'manifest.json' exists in the root.</p>
                    <button onclick="location.reload()" class="underline text-sm text-blue-400 mt-4">Retry</button>
                </div>
            `;
        }
    }

    function renderSubjects(subjects) {
        if(!subjectsContainer) return;
        subjectsContainer.innerHTML = '';
        subjects.forEach(sub => {
            const card = document.createElement('div');
            // Tailwind Card Style
            card.className = "bg-card hover:bg-card-hover border border-slate-700/50 hover:border-blue-500/50 rounded-xl p-6 cursor-pointer transition-all duration-200 group relative overflow-hidden";
            
            // Level Badge Colors
            let badgeBg = 'bg-slate-700';
            let badgeText = 'text-slate-300';
            if (sub.level === 'Foundation') { badgeBg = 'bg-emerald-500/10'; badgeText = 'text-emerald-400'; }
            if (sub.level === 'Diploma') { badgeBg = 'bg-blue-500/10'; badgeText = 'text-blue-400'; }
            if (sub.level === 'Degree') { badgeBg = 'bg-purple-500/10'; badgeText = 'text-purple-400'; }

            card.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <span class="${badgeBg} ${badgeText} px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide">${sub.level}</span>
                    <i class="fas fa-chevron-right text-slate-600 group-hover:text-blue-400 transition-colors"></i>
                </div>
                <h3 class="text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">${sub.name}</h3>
                <p class="text-slate-500 text-sm font-mono">${sub.id.toUpperCase()}</p>
                <div class="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            `;
            
            card.addEventListener('click', () => loadSubject(sub));
            subjectsContainer.appendChild(card);
        });
    }

    async function loadSubject(subject) {
        try {
            const response = await fetch(`subjects/${subject.id}.json`);
            if (!response.ok) {
                // If subject file doesn't exist, show empty view logic
                console.warn(`Subject file subjects/${subject.id}.json not found.`);
                showExamsView(subject, []); 
                return;
            }
            const data = await response.json();
            showExamsView(subject, data.exams || []);
        } catch (e) {
            console.warn(e);
            showExamsView(subject, []);
        }
    }

    function showExamsView(subject, exams) {
        subjectsView.classList.add('hidden');
        examsView.classList.remove('hidden');
        navBar.classList.remove('hidden');

        subjectTitle.textContent = subject.name;
        subjectBadge.textContent = (subject.code || subject.id).toUpperCase();
        
        // Colorize badge
        const colorClass = subject.color ? subject.color.replace('text-', 'bg-') + '/10 ' + subject.color : 'bg-blue-500/10 text-blue-400';
        subjectBadge.className = `px-2 py-0.5 rounded text-xs font-bold ${colorClass}`;

        examsContainer.innerHTML = '';

        if (!exams || exams.length === 0) {
            examsContainer.innerHTML = `
                <div class="text-center py-12 bg-card rounded-xl border border-dashed border-slate-700">
                    <i class="far fa-folder-open text-slate-600 text-4xl mb-4"></i>
                    <p class="text-secondary mb-2">No exams found for this subject.</p>
                    <a href="parser.html" class="text-sm text-blue-400 hover:text-blue-300 underline">Add one using the Parser</a>
                </div>
            `;
            return;
        }

        // Sort by year desc
        exams.sort((a,b) => (b.year || 0) - (a.year || 0));

        exams.forEach(exam => {
            const row = document.createElement('div');
            row.className = "bg-card hover:bg-card-hover border border-slate-700/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors group";
            
            row.innerHTML = `
                <div class="flex items-center gap-4">
                    <div class="bg-blue-500/10 text-blue-400 w-12 h-12 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">
                        ${exam.year || 'NA'}
                    </div>
                    <div>
                        <h3 class="font-bold text-white text-lg group-hover:text-blue-400 transition-colors">${exam.title || 'Untitled Exam'}</h3>
                        <div class="flex items-center gap-4 mt-1 text-sm text-secondary">
                            <span class="flex items-center gap-1.5"><i class="far fa-clock text-slate-500"></i> ${exam.duration || 60}m</span>
                            <span class="flex items-center gap-1.5"><i class="fas fa-list-ol text-slate-500"></i> ${exam.questions ? exam.questions.length : 0} Qs</span>
                            <span class="flex items-center gap-1.5"><i class="fas fa-trophy text-slate-500"></i> ${exam.marks || 0}</span>
                        </div>
                    </div>
                </div>
                <a href="practice.html?subject=${subject.id}&examId=${exam.id}" class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition shadow-lg shadow-blue-900/20 whitespace-nowrap text-center">
                    Start Exam
                </a>
            `;
            examsContainer.appendChild(row);
        });
    }

    if(backBtn) {
        backBtn.addEventListener('click', () => {
            examsView.classList.add('hidden');
            navBar.classList.add('hidden');
            subjectsView.classList.remove('hidden');
        });
    }
});
