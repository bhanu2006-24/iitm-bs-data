import { executeCode } from './compiler.js';

const { createApp } = Vue;

createApp({
    data() {
        return {
            selectedSubject: 'python',
            questions: [],
            searchQuery: '',
            currentQuestion: null,
            viewMode: 'preview', // 'preview' | 'edit'
            
            editor: null,
            consoleOutput: [],
            isRunning: false,
            loading: false,
            unsavedChanges: false,
            consoleExpanded: false,
            showHint: false
        }
    },
    computed: {
        filteredQuestions() {
            return this.questions.filter(q => q.title.toLowerCase().includes(this.searchQuery.toLowerCase()));
        }
    },
    mounted() {
        this.loadSubject();
        window.addEventListener('keydown', this.handleShortcuts);
    },
    beforeUnmount() {
        window.removeEventListener('keydown', this.handleShortcuts);
    },
    methods: {
        // --- Markdown ---
        renderMarkdown(text) {
            return marked.parse(text || '');
        },

        // --- Editors ---
        initEditor() {
            if(this.editor) return;
            this.$nextTick(() => {
                const el = document.getElementById('code-editor');
                if(el) {
                    this.editor = CodeMirror.fromTextArea(el, {
                        mode: this.getMode(),
                        theme: 'dracula',
                        lineNumbers: true,
                        autoCloseBrackets: true,
                        indentUnit: 4,
                        tabSize: 4,
                        scrollbarStyle: "null"
                    });
                    this.editor.on('change', () => {
                         this.unsavedChanges = true;
                    });
                }
            });
        },
        
        getMode() {
            const map = { 
                'python': 'python', 'pdsa': 'python', 'mlp': 'python', 'big_data': 'python', 'mlops': 'python', 'tds': 'python',
                'java': 'text/x-java', 'sql': 'text/x-sql', 'system_commands': 'shell', 'c_prog': 'text/x-csrc'
            };
            return map[this.selectedSubject] || 'python';
        },

        handleShortcuts(e) {
            if((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                this.saveFile();
            }
        },

        // --- Data ---
        async loadSubject() {
            this.loading = true;
            this.questions = [];
            this.currentQuestion = null;
            this.consoleOutput = [];
            
            try {
                const res = await fetch(`./data/${this.selectedSubject}.json`);
                if(res.ok) {
                    this.questions = await res.json();
                    if(this.questions.length > 0) this.loadQuestion(this.questions[0]);
                    else this.addNewQuestion(true); 
                } else {
                    this.questions = [];
                    this.addNewQuestion(true);
                }
            } catch(e) { console.error(e); } 
            finally { 
                this.loading = false;
                if(this.editor) this.editor.setOption('mode', this.getMode());
            }
        },

        loadQuestion(q) {
            this.currentQuestion = q;
            this.viewMode = 'preview';
            this.unsavedChanges = false;
            this.showHint = false;
            
            this.initEditor();
            this.$nextTick(() => {
                if(this.editor) {
                    this.editor.setValue(q.starterCode || '');
                    this.editor.clearHistory();
                    this.editor.refresh();
                    this.unsavedChanges = false;
                }
            });
        },

        // --- Operations ---
        async runCode() {
            if (!this.editor) return;
            this.isRunning = true;
            this.consoleOutput = [{type: 'info', text: 'Compiling...'}];
            
            const code = this.editor.getValue();
            // Pass Setup Code if exists
            const setup = this.currentQuestion.setupCode || '';
            
            const res = await executeCode(code, this.selectedSubject, setup);
            
            this.consoleOutput = res.output.split('\n')
                .map(l => ({ type: res.isError ? 'error' : 'normal', text: l }))
                .filter(l => l.text);
                
            if(!res.isError) this.consoleOutput.push({type: 'success', text: '✔ Finished'});
            this.isRunning = false;
            this.consoleExpanded = true;
        },

        addNewQuestion(silent=false) {
            const newQ = {
                id: Date.now().toString(),
                title: 'New Problem',
                difficulty: 'Easy',
                examType: 'OPPE 1',
                tags: '',
                description: '## Problem Description\n\nWrite a solution that...',
                starterCode: '# Write code here',
                setupCode: '',
                functionName: '',
                testCases: [{input: '', expected: '', hidden: false}],
                examples: [],
                hint: '',
                status: 'pending'
            };
            this.questions.push(newQ);
            this.loadQuestion(newQ);
            if(!silent) this.viewMode = 'edit';
        },
        
        duplicateQuestion() {
            if(!this.currentQuestion) return;
            const newQ = JSON.parse(JSON.stringify(this.currentQuestion));
            newQ.id = Date.now().toString();
            newQ.title = newQ.title + " (Copy)";
            this.questions.push(newQ);
            this.loadQuestion(newQ);
        },

        deleteQuestion() {
            if(confirm("Delete this question?")) {
                const idx = this.questions.findIndex(q => q.id === this.currentQuestion.id);
                this.questions.splice(idx, 1);
                if(this.questions.length > 0) this.loadQuestion(this.questions[0]);
                else this.currentQuestion = null;
            }
        },
        
        addTestCase() {
            if(!this.currentQuestion.testCases) this.currentQuestion.testCases = [];
            this.currentQuestion.testCases.push({input:'', expected:'', hidden: false});
        },

        copyToStarter() {
            if(this.editor && this.currentQuestion) {
                 this.currentQuestion.starterCode = this.editor.getValue();
                 alert("Playground code copied to Starter Code Definition.");
            }
        },

        async saveFile() {
             try {
                if (window.showSaveFilePicker) {
                    const h = await window.showSaveFilePicker({ suggestedName: `${this.selectedSubject}.json` });
                    const w = await h.createWritable();
                    await w.write(JSON.stringify(this.questions, null, 2));
                    await w.close();
                    this.unsavedChanges = false;
                    alert("Saved!");
                } else {
                    const blob = new Blob([JSON.stringify(this.questions, null, 2)], {type: 'application/json'});
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = `${this.selectedSubject}.json`;
                    a.click();
                }
            } catch (e) { alert("Error saving"); }
        },
        
        getFileName() {
            const extMap = { 'python': 'py', 'pdsa': 'py', 'mlp': 'py', 'java': 'java', 'sql': 'sql', 'system_commands': 'sh', 'c_prog': 'c', 'big_data': 'py', 'mlops': 'py' };
            return `main.${extMap[this.selectedSubject] || 'txt'}`;
        },
    }
}).mount('#app');
