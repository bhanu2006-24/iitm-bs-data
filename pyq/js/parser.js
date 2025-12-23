import { ImageFormatter } from './formatter.js';
import { MathRenderer } from './katex.js';
import { MarkdownRenderer } from './md.js';

document.addEventListener('DOMContentLoaded', async () => {
    // State
    let pdfDoc = null;
    let pageNum = 1;
    let canvas = document.getElementById('the-canvas');
    let ctx = canvas.getContext('2d');
    let questions = [];
    let subjects = [];

    // DOM
    const subjectSelect = document.getElementById('subject-select');
    const questionsList = document.getElementById('questions-list');
    const addQuestionBtn = document.getElementById('add-question-btn');
    const saveJsonBtn = document.getElementById('save-json-btn');
    
    // PDF Controls
    document.getElementById('pdf-upload').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            pdfDoc = await pdfjsLib.getDocument(url).promise;
            document.getElementById('page-num').textContent = `Page ${pageNum} of ${pdfDoc.numPages}`;
            renderPage(pageNum);
        }
    });

    document.getElementById('prev-page').addEventListener('click', () => {
        if (pageNum <= 1) return;
        pageNum--;
        renderPage(pageNum);
    });

    document.getElementById('next-page').addEventListener('click', () => {
        if (!pdfDoc || pageNum >= pdfDoc.numPages) return;
        pageNum++;
        renderPage(pageNum);
    });

    // Load Subjects
    try {
        const res = await fetch('manifest.json');
        subjects = await res.json();
        subjects.forEach(s => {
            const op = document.createElement('option');
            op.value = s.id;
            op.textContent = s.name;
            subjectSelect.appendChild(op);
        });
    } catch (e) { console.error('No manifest', e); }

    // Render PDF Page
    async function renderPage(num) {
        if (!pdfDoc) return;
        const page = await pdfDoc.getPage(num);
        const viewport = page.getViewport({ scale: 1.5 });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
        await page.render(renderContext).promise;
        document.getElementById('page-num').textContent = `Page ${num} of ${pdfDoc.numPages}`;
    }

    // Question Management
    function renderQuestions() {
        questionsList.innerHTML = '';
        questions.forEach((q, idx) => {
            const block = document.createElement('div');
            block.className = 'card mb-4';
            block.style.marginBottom = '1.5rem';
            block.innerHTML = `
                <div class="flex justify-between mb-2">
                    <h4>Question ${idx + 1}</h4>
                    <button class="btn text-error" onclick="window.removeQuestion(${idx})"><i class="fas fa-trash"></i></button>
                </div>
                <div class="flex gap-2 mb-2">
                    <select onchange="window.updateQ(${idx}, 'type', this.value)">
                        <option value="MCQ" ${q.type==='MCQ'?'selected':''}>MCQ</option>
                        <option value="MSQ" ${q.type==='MSQ'?'selected':''}>MSQ</option>
                        <option value="NAT" ${q.type==='NAT'?'selected':''}>NAT</option>
                        <option value="Boolean" ${q.type==='Boolean'?'selected':''}>Boolean</option>
                    </select>
                    <input type="number" placeholder="Marks" value="${q.marks||''}" onchange="window.updateQ(${idx}, 'marks', this.value)" style="width:60px;">
                </div>
                <textarea class="w-full mb-2" rows="3" placeholder="Question Text (Markdown/LaTeX)..." onchange="window.updateQ(${idx}, 'text', this.value)">${q.text||''}</textarea>
                
                <!-- Options / Answer -->
                <div id="options-area-${idx}">
                    ${renderOptionsInputs(q, idx)}
                </div>

                <div class="flex gap-2 mt-2">
                    <button class="btn text-sm" onclick="window.openImgModal(${idx})"><i class="fas fa-image"></i> Add/Process Image</button>
                </div>
            `;
            questionsList.appendChild(block);
        });
    }

    function renderOptionsInputs(q, idx) {
        if (q.type === 'MCQ' || q.type === 'MSQ') {
            let html = '<div class="flex flex-col gap-2">';
            const opts = q.options || ['', '', '', ''];
            opts.forEach((opt, oIdx) => {
                html += `
                    <div class="flex gap-2 items-center">
                        <span>${String.fromCharCode(65+oIdx)}</span>
                        <input type="text" value="${opt}" onchange="window.updateOption(${idx}, ${oIdx}, this.value)" placeholder="Option text">
                        <input type="${q.type==='MCQ'?'radio':'checkbox'}" name="q-${idx}-correct" ${isCorrect(q, oIdx) ? 'checked' : ''} onchange="window.setCorrect(${idx}, ${oIdx}, this.checked)">
                    </div>
                `;
            });
            html += `<button class="btn text-sm" onclick="window.addOption(${idx})">+ Opt</button></div>`;
            return html;
        } else if (q.type === 'NAT') {
            return `<input type="text" placeholder="Correct Value" value="${q.correctValue || ''}" onchange="window.updateQ(${idx}, 'correctValue', this.value)">`;
        }
        return '';
    }

    function isCorrect(q, oIdx) {
        if (q.type === 'MCQ') return q.correctIndex === oIdx;
        if (q.type === 'MSQ') return (q.correctIndices || []).includes(oIdx);
        return false;
    }

    // Global Handlers
    window.removeQuestion = (idx) => {
        questions.splice(idx, 1);
        renderQuestions();
    };
    window.updateQ = (idx, field, val) => {
        questions[idx][field] = val;
        // if type changes, reset options
        if (field === 'type') {
            if (val === 'MCQ' || val === 'MSQ') questions[idx].options = ['', '', '', ''];
            renderQuestions();
        }
    };
    window.updateOption = (qIdx, oIdx, val) => {
        questions[qIdx].options[oIdx] = val;
    };
    window.setCorrect = (qIdx, oIdx, checked) => {
        const q = questions[qIdx];
        if (q.type === 'MCQ') {
            if (checked) q.correctIndex = oIdx;
        } else if (q.type === 'MSQ') {
            q.correctIndices = q.correctIndices || [];
            if (checked && !q.correctIndices.includes(oIdx)) q.correctIndices.push(oIdx);
            if (!checked) q.correctIndices = q.correctIndices.filter(i => i !== oIdx);
        }
    };
    window.addOption = (qIdx) => {
        questions[qIdx].options.push('');
        renderQuestions();
    };

    addQuestionBtn.addEventListener('click', () => {
        questions.push({
            id: `q-${Date.now()}`,
            type: 'MCQ',
            text: '',
            options: ['', '', '', ''],
            marks: 2
        });
        renderQuestions();
    });

    saveJsonBtn.addEventListener('click', () => {
        const examData = {
            id: document.getElementById('exam-id').value,
            title: document.getElementById('exam-title-input').value,
            subject: subjectSelect.options[subjectSelect.selectedIndex]?.text,
            year: document.getElementById('exam-year').value,
            questions: questions
        };
        
        // Check if subject exists to merge, usually we'd merge with existing file.
        // But here we just download the Exam Fragment or the Subject File update?
        // User asked "where we can parse.. paper.. edit existing..".
        // Let's download the Exam Object as JSON. The user can paste it into the subject file manually 
        // OR we can try to download the whole Subject File if we had loaded it.
        // For 'parser', it's safer to output the Exam JSON.
        
        const blob = new Blob([JSON.stringify(examData, null, 2)], {type: 'application/json'});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${examData.id || 'exam'}.json`;
        a.click();
    });

    // Image Modal Logic
    const imgModal = document.getElementById('img-modal');
    const imgInput = document.getElementById('img-input');
    const processBtn = document.getElementById('process-img-btn');
    let currentImgQIdx = -1;

    window.openImgModal = (idx) => {
        currentImgQIdx = idx;
        imgModal.classList.remove('hidden');
    };

    imgInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if(file) {
            document.getElementById('img-preview').src = URL.createObjectURL(file);
        }
    });

    processBtn.addEventListener('click', async () => {
        const file = imgInput.files[0];
        if (!file) return;

        try {
            const blob = await ImageFormatter.process(file, {
                maxWidth: parseInt(document.getElementById('img-width').value),
                quality: parseFloat(document.getElementById('img-quality').value)
            });
            
            // Download the processed image
            const qID = questions[currentImgQIdx].id || `q${currentImgQIdx}`;
            const fName = `${document.getElementById('exam-id').value}-${qID}.jpg`;
            const dlFile = ImageFormatter.toFile(blob, fName);
            
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = fName;
            a.click();

            // Insert markup into text
            const textToInsert = `\n![Image](img/${fName})\n`;
            questions[currentImgQIdx].text += textToInsert;
            renderQuestions(); // Refresh UI to show updated text
            
            imgModal.classList.add('hidden');
        } catch (e) {
            console.error(e);
            alert('Error processing image');
        }
    });

});
