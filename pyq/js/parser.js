import { ImageFormatter } from './formatter.js';
import { MathRenderer } from './katex.js';
import { MarkdownRenderer } from './md.js';
import { PDFProcessor } from './pdf_processor.js';

document.addEventListener('DOMContentLoaded', async () => {
    // State
    let pdfDoc = null;
    let pageNum = 1;
    let canvas = document.getElementById('the-canvas');
    let ctx = canvas.getContext('2d');
    let questions = [];
    let subjects = [];

    // DOM Elements
    const subjectSelect = document.getElementById('subject-select');
    const questionsList = document.getElementById('questions-list');
    const addQuestionBtn = document.getElementById('add-question-btn');
    const saveJsonBtn = document.getElementById('save-json-btn');
    const autoParseBtn = document.getElementById('auto-parse-btn'); // Hardcoded in HTML now
    const pdfUpload = document.getElementById('pdf-upload');

    // PDF Controls
    pdfUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            try {
                pdfDoc = await pdfjsLib.getDocument(url).promise;
                document.getElementById('page-num').textContent = `Page ${pageNum} of ${pdfDoc.numPages}`;
                renderPage(pageNum);
                
                // Reset parser state
                questions = [];
                renderQuestions();
            } catch (err) {
                alert("Error loading PDF: " + err.message);
            }
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

    // Auto Parse binding
    if (autoParseBtn) {
        autoParseBtn.addEventListener('click', autoParse);
    }

    // Load Subjects
    try {
        const res = await fetch('manifest.json');
        if(res.ok) {
            subjects = await res.json();
            subjects.forEach(s => {
                const op = document.createElement('option');
                op.value = s.id;
                op.textContent = s.name;
                subjectSelect.appendChild(op);
            });
        }
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

    // Auto Parse Logic
    async function autoParse() {
        if (!pdfDoc) {
            alert('Please load a PDF first.');
            return;
        }

        const btn = document.getElementById('auto-parse-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Parsing...';
        btn.disabled = true;

        try {
            let allItems = [];
            // Parse all pages
            // Optimization: Parse in chunks if too large? 
            for (let i = 1; i <= pdfDoc.numPages; i++) {
                const page = await pdfDoc.getPage(i);
                const items = await PDFProcessor.getPageContent(page);
                allItems = allItems.concat(items);
            }

            const parsedQs = PDFProcessor.parseQuestions(allItems);

            if (parsedQs.length === 0) {
                alert('No questions found using key heuristic ("Question Number :").\nEnsure the PDF follows the standard exam format.');
            } else {
                questions = questions.concat(parsedQs);
                renderQuestions();
                alert(`Successfully parsed ${parsedQs.length} questions!`);
            }

        } catch (e) {
            console.error(e);
            alert('Error parsing PDF: ' + e.message);
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    // Question Management
    function renderQuestions() {
        questionsList.innerHTML = '';
        if (questions.length === 0) {
            questionsList.innerHTML = `<p class="text-slate-500 text-center mt-10">No questions yet. Use Auto Parse or Add Manually.</p>`;
            return;
        }

        questions.forEach((q, idx) => {
            const block = document.createElement('div');
            block.className = 'bg-card border border-slate-700 rounded-lg p-4 animate-fade-in group';
            
            // Badge Logic
            let typeBadgeColor = 'bg-slate-700 text-slate-300';
            if (q.type === 'MCQ') typeBadgeColor = 'bg-blue-500/20 text-blue-400';
            if (q.type === 'MSQ') typeBadgeColor = 'bg-purple-500/20 text-purple-400';
            if (q.type === 'NAT') typeBadgeColor = 'bg-green-500/20 text-green-400';

            block.innerHTML = `
                <div class="flex justify-between items-start mb-3">
                    <div class="flex items-center gap-3">
                        <span class="font-bold text-white">Q${idx + 1}</span>
                        <span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider cursor-pointer ${typeBadgeColor}" 
                              onclick="window.toggleType(${idx})">
                              ${q.type} <i class="fas fa-chevron-down ml-1 text-[8px]"></i>
                        </span>
                        <input type="text" value="${q.metaId || q.id}" 
                               class="bg-transparent border-none text-xs text-slate-500 w-24 focus:text-white"
                               placeholder="ID">
                    </div>
                    <div class="flex items-center gap-2">
                        <input type="number" value="${q.marks}" 
                               class="bg-slate-800 border border-slate-600 rounded w-12 text-center text-xs py-1"
                               onchange="window.updateQ(${idx}, 'marks', this.value)">
                        <button class="text-slate-500 hover:text-red-400 transition" onclick="window.removeQuestion(${idx})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>

                <!-- Text Area -->
                <textarea class="w-full bg-slate-900 border border-slate-700 rounded p-3 text-sm text-slate-300 focus:border-blue-500 outline-none mb-3 font-mono leading-relaxed" 
                    rows="3" 
                    placeholder="Question Text..." 
                    onchange="window.updateQ(${idx}, 'text', this.value)">${q.text||''}</textarea>
                
                <div class="flex justify-between items-center mb-3">
                     <span class="text-xs text-slate-500">Supports Markdown & LaTeX</span>
                     <button class="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1" onclick="window.openImgModal(${idx}, 'text')">
                        <i class="fas fa-image"></i> Add Image
                     </button>
                </div>

                <!-- Options Area -->
                <div id="options-area-${idx}" class="space-y-2 border-l-2 border-slate-700 pl-3">
                    ${renderOptionsInputs(q, idx)}
                </div>
            `;
            questionsList.appendChild(block);
        });
    }

    function renderOptionsInputs(q, idx) {
        if (q.type === 'MCQ' || q.type === 'MSQ') {
            let html = '';
            const opts = q.options || [];
            
            opts.forEach((opt, oIdx) => {
                const isChk = isCorrect(q, oIdx);
                const marker = q.type === 'MCQ' ? 'rounded-full' : 'rounded';
                const activeMarker = isChk ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-600 hover:border-slate-500';

                html += `
                    <div class="flex gap-3 items-start group/opt">
                        <div class="mt-1.5 cursor-pointer w-5 h-5 border flex items-center justify-center shrink-0 transition ${marker} ${activeMarker}"
                             onclick="window.toggleCorrect(${idx}, ${oIdx})">
                             ${isChk ? '<i class="fas fa-check text-[10px]"></i>' : ''}
                        </div>
                        <div class="flex-1">
                            <textarea rows="1" class="w-full bg-transparent border-b border-transparent hover:border-slate-700 focus:border-slate-600 outline-none text-sm text-slate-300 resize-none overflow-hidden" 
                                oninput="this.style.height = ''; this.style.height = this.scrollHeight + 'px'"
                                onchange="window.updateOption(${idx}, ${oIdx}, this.value)" 
                                placeholder="Option ${oIdx+1}">${opt}</textarea>
                        </div>
                        <div class="opacity-0 group-hover/opt:opacity-100 flex gap-2">
                             <button class="text-slate-500 hover:text-blue-400" onclick="window.openImgModal(${idx}, 'option', ${oIdx})"><i class="fas fa-image"></i></button>
                             <button class="text-slate-500 hover:text-red-400" onclick="window.removeOption(${idx}, ${oIdx})"><i class="fas fa-times"></i></button>
                        </div>
                    </div>
                `;
            });
            html += `
                <button class="text-xs text-slate-500 hover:text-blue-400 mt-2 flex items-center gap-1" onclick="window.addOption(${idx})">
                    <i class="fas fa-plus"></i> Add Option
                </button>
            `;
            return html;
        } else if (q.type === 'NAT') {
            return `
                <div class="flex items-center gap-2">
                    <span class="text-sm text-green-400 font-bold">Answer:</span>
                    <input type="text" class="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white focus:border-green-500 outline-none"
                           placeholder="Correct Value (e.g. 5 or 5.2)" 
                           value="${q.correctValue || ''}" 
                           onchange="window.updateQ(${idx}, 'correctValue', this.value)">
                </div>
            `;
        }
        return '';
    }

    function isCorrect(q, oIdx) {
        if (q.type === 'MCQ') return q.correctIndex === oIdx;
        if (q.type === 'MSQ') return (q.correctIndices || []).includes(oIdx);
        return false;
    }

    // Global Handlers attached to Window
    window.removeQuestion = (idx) => {
        if(confirm('Delete this question?')) {
            questions.splice(idx, 1);
            renderQuestions();
        }
    };
    
    window.updateQ = (idx, field, val) => {
        questions[idx][field] = val;
    };
    
    window.toggleType = (idx) => {
        const types = ['MCQ', 'MSQ', 'NAT'];
        const current = questions[idx].type;
        const next = types[(types.indexOf(current) + 1) % types.length];
        questions[idx].type = next;
        // Defaults
        if (next !== 'NAT' && (!questions[idx].options || !questions[idx].options.length)) {
            questions[idx].options = ['', '', '', ''];
        }
        renderQuestions();
    };

    window.updateOption = (qIdx, oIdx, val) => {
        questions[qIdx].options[oIdx] = val;
    };

    window.removeOption = (qIdx, oIdx) => {
        questions[qIdx].options.splice(oIdx, 1);
        renderQuestions(); // Re-render to update indices
    };

    window.addOption = (qIdx) => {
        if(!questions[qIdx].options) questions[qIdx].options = [];
        questions[qIdx].options.push('');
        renderQuestions();
    };

    window.toggleCorrect = (qIdx, oIdx) => {
        const q = questions[qIdx];
        if (q.type === 'MCQ') {
            q.correctIndex = oIdx;
        } else if (q.type === 'MSQ') {
            q.correctIndices = q.correctIndices || [];
            const pos = q.correctIndices.indexOf(oIdx);
            if (pos === -1) q.correctIndices.push(oIdx);
            else q.correctIndices.splice(pos, 1);
        }
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
            id: document.getElementById('exam-id').value || 'exam',
            title: document.getElementById('exam-title-input').value || 'Untitled Exam',
            subject: subjectSelect.options[subjectSelect.selectedIndex]?.text,
            year: document.getElementById('exam-year').value,
            duration: 60,
            questions: questions
        };
        const blob = new Blob([JSON.stringify(examData, null, 2)], {type: 'application/json'});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${examData.id}.json`;
        a.click();
    });

    // Image Modal
    const imgModal = document.getElementById('img-modal');
    const imgInput = document.getElementById('img-input');
    const processImgBtn = document.getElementById('process-img-btn');
    let imgContext = null; 

    window.openImgModal = (qIdx, type, oIdx=null) => {
        imgContext = { qIdx, type, oIdx };
        imgModal.classList.remove('hidden');
        document.getElementById('img-preview').src = '';
        imgInput.value = '';
    };

    imgInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if(file) document.getElementById('img-preview').src = URL.createObjectURL(file);
    });

    processImgBtn.addEventListener('click', async () => {
        const file = imgInput.files[0];
        if (!file) return;

        try {
            const blob = await ImageFormatter.process(file, {
                maxWidth: parseInt(document.getElementById('img-width').value),
                quality: parseFloat(document.getElementById('img-quality').value)
            });
            
            const qID = questions[imgContext.qIdx].id || `q${imgContext.qIdx}`;
            const suffix = imgContext.type === 'option' ? `opt${imgContext.oIdx}` : 'q';
            const fName = `${document.getElementById('exam-id').value || 'exam'}-${qID}-${suffix}.jpg`;
            
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = fName;
            a.click();

            // Insert Markdown
            // Note: Since we only download, user has to place it in 'img/' folder manually or we instruct them.
             const textToInsert = `\n![${fName}](img/${fName})\n`;
            
            if (imgContext.type === 'text') {
                questions[imgContext.qIdx].text += textToInsert;
            } else {
                questions[imgContext.qIdx].options[imgContext.oIdx] += textToInsert;
            }
            
            renderQuestions();
            imgModal.classList.add('hidden');
        } catch (e) {
            console.error(e);
            alert('Error processing image');
        }
    });

});
