import { Utils } from './utils.js'; // We'll create a Utils helper if needed, or just inline.

document.addEventListener('DOMContentLoaded', async () => {
    const subjectsContainer = document.getElementById('subjects-container');
    const subjectsView = document.getElementById('subjects-view');
    const examsView = document.getElementById('exams-view');
    const examsContainer = document.getElementById('exams-container');
    const navBar = document.getElementById('nav-bar');
    const backBtn = document.getElementById('back-to-subjects');
    const subjectTitle = document.getElementById('subject-title');
    const subjectCode = document.getElementById('subject-code');

    let allSubjects = [];

    // Fetch Manifest
    try {
        const response = await fetch('manifest.json');
        allSubjects = await response.json();
        renderSubjects(allSubjects);
    } catch (e) {
        console.error('Failed to load subjects:', e);
        subjectsContainer.innerHTML = '<p class="text-error">Failed to load subjects.</p>';
    }

    // Render Function
    function renderSubjects(subjects) {
        subjectsContainer.innerHTML = '';
        subjects.forEach(sub => {
            const card = document.createElement('div');
            card.className = 'card cursor-pointer'; // Add cursor-pointer class if not in CSS
            card.style.cursor = 'pointer';
            
            // Badge style based on level
            const badgeClass = `badge-${sub.level.toLowerCase().split(' ')[0]}`; // simple heuristic
            
            card.innerHTML = `
                <div class="flex justify-between items-start" style="margin-bottom: 1rem;">
                    <span class="badge ${badgeClass}" style="background:rgba(255,255,255,0.1); color: #fff;">${sub.level}</span>
                    <i class="fas fa-chevron-right text-secondary"></i>
                </div>
                <h3 class="${sub.color || 'text-primary'}" style="margin-bottom: 0.5rem;">${sub.name}</h3>
                <p class="text-secondary text-sm">${sub.id.toUpperCase()}</p>
                <!-- We could show paper count if we had it, for now we skip -->
            `;
            
            card.addEventListener('click', () => loadSubject(sub));
            subjectsContainer.appendChild(card);
        });
    }

    async function loadSubject(subject) {
        // Show Loading state?
        
        try {
            const response = await fetch(`subjects/${subject.id}.json`);
            if (!response.ok) throw new Error('Subject data not found');
            const data = await response.json();
            
            // Render Exams
            showExamsView(subject, data.exams);
        } catch (e) {
            console.error(e);
            alert('Could not load exams for this subject.');
        }
    }

    function showExamsView(subject, exams) {
        subjectsView.classList.add('hidden');
        examsView.classList.remove('hidden');
        navBar.classList.remove('hidden');

        subjectTitle.textContent = subject.name;
        // subjectCode.textContent = subject.code || subject.id; // Code might be in meta
        subjectCode.textContent = subject.id;

        examsContainer.innerHTML = '';
        
        if (!exams || exams.length === 0) {
            examsContainer.innerHTML = '<p class="text-secondary">No exams available yet.</p>';
            return;
        }

        // Sort exams?
        // exams.sort((a, b) => b.year - a.year);

        exams.forEach(exam => {
            const row = document.createElement('div');
            row.className = 'card flex justify-between items-center';
            row.style.padding = '1rem 1.5rem';
            
            row.innerHTML = `
                <div class="flex items-center gap-4">
                    <div style="background: rgba(59, 130, 246, 0.1); padding: 0.75rem; border-radius: 0.5rem;">
                         <span class="text-blue-400 font-bold">${exam.year || 'N/A'}</span>
                    </div>
                    <div>
                        <h3 style="margin:0; font-size: 1.1rem;">${exam.title || 'Exam'}</h3>
                        <p class="text-secondary text-sm">
                            <i class="far fa-clock"></i> ${exam.duration || 60} mins  &bull; 
                            <i class="fas fa-list"></i> ${exam.questions ? exam.questions.length : 0} Questions &bull;
                            <i class="fas fa-trophy"></i> ${exam.marks || 0} Marks
                        </p>
                    </div>
                </div>
                <div>
                   <a href="practice.html?subject=${subject.id}&examId=${exam.id}" class="btn btn-primary">
                        <i class="fas fa-play" style="margin-right: 0.5rem;"></i> Start Exam
                   </a>
                </div>
            `;
            examsContainer.appendChild(row);
        });
    }

    backBtn.addEventListener('click', () => {
        examsView.classList.add('hidden');
        navBar.classList.add('hidden');
        subjectsView.classList.remove('hidden');
    });
});
