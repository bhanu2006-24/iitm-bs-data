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

    // Clear All
    const clearBtn = document.getElementById('clear-all-btn');
    if(clearBtn) {
        clearBtn.addEventListener('click', () => {
            if(confirm('Clear all questions?')) {
                questions = [];
                renderQuestions();
                log('Cleared all questions.');
            }
        });
    }

    // Logging
    function log(msg, type='info') {
        const c = document.getElementById('logs-container');
        if(!c) return;
        const d = document.createElement('div');
        d.textContent = `> ${msg}`;
        if(type === 'error') d.className = 'text-red-400';
        else if(type === 'success') d.className = 'text-blue-400';
        c.appendChild(d);
        c.scrollTop = c.scrollHeight;
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
        
        log('Starting auto-parse...');

        try {
            let allItems = [];
            // Parse all pages
            for (let i = 1; i <= pdfDoc.numPages; i++) {
                log(`Reading page ${i}...`);
                const page = await pdfDoc.getPage(i);
                const items = await PDFProcessor.getPageContent(page);
                allItems = allItems.concat(items);
            }

            log(`Extracted ${allItems.length} content items. Processing...`);
            const parsedQs = PDFProcessor.parseQuestions(allItems);

            if (parsedQs.length === 0) {
                log('No questions found. check regex heuristics.', 'error');
                alert('No questions found using key heuristic ("Question Number :" or "Q.").\nEnsure the PDF follows the standard exam format.');
            } else {
                questions = questions.concat(parsedQs);
                renderQuestions();
                log(`Successfully parsed ${parsedQs.length} questions!`, 'success');
                alert(`Successfully parsed ${parsedQs.length} questions!`);
            }

        } catch (e) {
            console.error(e);
            log(`Error: ${e.message}`, 'error');
            alert('Error parsing PDF: ' + e.message);
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    // Question Management
    function renderQuestions() {
        questionsList.innerHTML = '';
        
        // Update Stats
        const stats = document.getElementById('stats-bar');
        if(stats) stats.innerHTML = `<span>${questions.length} Questions</span>`;

        if (questions.length === 0) {
            questionsList.innerHTML = `
                <div class="text-center text-slate-500 mt-20 flex flex-col items-center">
                    <div class="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        <i class="fas fa-file-pdf text-2xl opacity-50"></i>
                    </div>
                    <p class="text-lg font-medium text-slate-400">Ready to Parse</p>
                    <p class="text-sm opacity-60 mt-1">Load a PDF or add questions manually</p>
                </div>`;
            return;
        }

        questions.forEach((q, idx) => {
            const block = document.createElement('div');
            block.className = 'bg-card border border-slate-700 rounded-lg p-4 animate-fade-in group shadow-sm hover:border-slate-600 transition';
            
            // Badge Logic
            let typeBadgeColor = 'bg-slate-700 text-slate-300';
            if (q.type === 'MCQ') typeBadgeColor = 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
            if (q.type === 'MSQ') typeBadgeColor = 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
            if (q.type === 'NAT') typeBadgeColor = 'bg-green-500/20 text-green-400 border border-green-500/30';

            block.innerHTML = `
                <div class="flex justify-between items-start mb-3">
                    <div class="flex items-center gap-3">
                        <span class="font-bold text-white bg-slate-800 w-8 h-8 flex items-center justify-center rounded-full text-sm">${idx + 1}</span>
                        <span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider cursor-pointer ${typeBadgeColor} transition hover:opacity-80" 
                              onclick="window.toggleType(${idx})">
                              ${q.type} <i class="fas fa-chevron-down ml-1 text-[8px]"></i>
                        </span>
                        <div class="flex items-center gap-1 bg-slate-900 rounded px-2 py-0.5 border border-slate-700">
                             <span class="text-[10px] text-slate-500">ID:</span>
                             <input type="text" value="${q.metaId || q.id}" 
                                class="bg-transparent border-none text-xs text-slate-400 w-24 focus:text-white outline-none"
                                placeholder="ID">
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="flex items-center gap-1 bg-slate-900 rounded px-2 py-0.5 border border-slate-700">
                            <span class="text-[10px] text-slate-500">Marks:</span>
                            <input type="number" value="${q.marks}" 
                               class="bg-transparent border-none w-8 text-center text-xs py-0 text-white outline-none"
                               onchange="window.updateQ(${idx}, 'marks', this.value)">
                        </div>
                        <button class="text-slate-500 hover:text-red-400 transition w-8 h-8 flex items-center justify-center hover:bg-slate-800 rounded" onclick="window.removeQuestion(${idx})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>

                <!-- Text Area -->
                <div class="relative group/text">
                    <textarea class="w-full bg-slate-900 border border-slate-700 rounded p-3 text-sm text-slate-300 focus:border-blue-500 outline-none mb-3 font-mono leading-relaxed transition" 
                        rows="3" 
                        placeholder="Question Text..." 
                        onchange="window.updateQ(${idx}, 'text', this.value)">${q.text||''}</textarea>
                    <div class="absolute top-2 right-2 opacity-0 group-hover/text:opacity-100 transition">
                         <button class="text-xs bg-slate-800 text-blue-400 hover:text-blue-300 px-2 py-1 rounded shadow border border-slate-700 flex items-center gap-1" onclick="window.openImgModal(${idx}, 'text')">
                            <i class="fas fa-image"></i> Image
                         </button>
                    </div>
                </div>

                <!-- Options Area -->
                <div id="options-area-${idx}" class="space-y-2 border-l-2 border-slate-700/50 pl-3">
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
                const activeMarker = isChk ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-900/20' : 'border-slate-600 hover:border-slate-500 bg-slate-800';

                html += `
                    <div class="flex gap-3 items-start group/opt">
                        <div class="mt-1.5 cursor-pointer w-5 h-5 border flex items-center justify-center shrink-0 transition ${marker} ${activeMarker}"
                             onclick="window.toggleCorrect(${idx}, ${oIdx})">
                             ${isChk ? '<i class="fas fa-check text-[10px]"></i>' : ''}
                        </div>
                        <div class="flex-1 relative">
                            <textarea rows="1" class="w-full bg-transparent border-b border-transparent hover:border-slate-700 focus:border-slate-600 outline-none text-sm text-slate-300 resize-none overflow-hidden py-1" 
                                oninput="this.style.height = ''; this.style.height = this.scrollHeight + 'px'"
                                onchange="window.updateOption(${idx}, ${oIdx}, this.value)" 
                                placeholder="Option ${oIdx+1}">${opt}</textarea>
                             <div class="absolute right-0 top-0 opacity-0 group-hover/opt:opacity-100 flex gap-1 bg-slate-900/80 backdrop-blur rounded px-1">
                                 <button class="text-slate-400 hover:text-blue-400 p-1" onclick="window.openImgModal(${idx}, 'option', ${oIdx})"><i class="fas fa-image text-xs"></i></button>
                                 <button class="text-slate-400 hover:text-red-400 p-1" onclick="window.removeOption(${idx}, ${oIdx})"><i class="fas fa-times text-xs"></i></button>
                             </div>
                        </div>
                    </div>
                `;
            });
            html += `
                <button class="text-[11px] font-medium text-slate-500 hover:text-blue-400 mt-2 flex items-center gap-1 uppercase tracking-wider pl-1" onclick="window.addOption(${idx})">
                    <i class="fas fa-plus"></i> Add Option
                </button>
            `;
            return html;
        } else if (q.type === 'NAT') {
            return `
                <div class="flex items-center gap-2 mt-2">
                    <span class="text-sm text-green-400 font-bold bg-green-500/10 px-2 py-1 rounded">Answer:</span>
                    <input type="text" class="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white focus:border-green-500 outline-none w-32"
                           placeholder="Value (e.g. 5)" 
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
        // Scroll to bottom
        setTimeout(() => {
            questionsList.scrollTop = questionsList.scrollHeight;
        }, 100);
    });

    saveJsonBtn.addEventListener('click', () => {
        const subjText = subjectSelect.options[subjectSelect.selectedIndex]?.text || 'Unknown Subject';
        const yearVal = document.getElementById('exam-year').value || '2023';
        
        // Inject Metadata into each question
        const processedQuestions = questions.map(q => ({
            ...q,
            subject: subjText,
            year: yearVal,
            level: 'Foundation', // Default or add a selector if needed
        }));

        const examData = {
            id: document.getElementById('exam-id').value || 'exam',
            title: document.getElementById('exam-title-input').value || 'Untitled Exam',
            subject: subjText,
            year: yearVal,
            duration: 60,
            marks: questions.reduce((sum, q) => sum + (parseFloat(q.marks)||0), 0),
            questions: processedQuestions
        };
        
        const blob = new Blob([JSON.stringify(examData, null, 2)], {type: 'application/json'});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${examData.id}.json`;
        a.click();
        log('JSON Saved!', 'success');
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
             const textToInsert = `\n![${fName}](img/${fName})\n`;
            
            if (imgContext.type === 'text') {
                questions[imgContext.qIdx].text += textToInsert;
                // Force update UI
                renderQuestions();
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
