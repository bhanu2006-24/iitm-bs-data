const { createApp } = Vue;

createApp({
    data() {
        return {
            selectedSubject: 'python',
            questions: [],
            searchQuery: '',
            currentQuestion: null,
            editor: null,
            consoleOutput: [],
            isRunning: false,
            fontSize: '14px',
            loading: false,
            isAdminMode: false
        }
    },
    computed: {
        filteredQuestions() {
            return this.questions.filter(q => q.title.toLowerCase().includes(this.searchQuery.toLowerCase()));
        }
    },
    mounted() {
        this.initEditor();
        this.loadSubject(); // Load initial
    },
    methods: {
        toggleAdmin() {
            this.isAdminMode = !this.isAdminMode;
            // Force Layout Refresh if needed
        },
        initEditor() {
            if(this.editor) return; 
            
            // Wait for DOM
            this.$nextTick(() => {
                const el = document.getElementById('code-editor');
                if(el && !this.editor) {
                        this.editor = CodeMirror.fromTextArea(el, {
                        mode: 'python',
                        theme: 'dracula',
                        lineNumbers: true,
                        autoCloseBrackets: true,
                        indentUnit: 4,
                        tabSize: 4,
                        scrollbarStyle: "null"
                    });
                    this.editor.on('change', () => {
                            if(this.currentQuestion) this.currentQuestion.userCode = this.editor.getValue(); 
                    });
                }
            });
        },
        getFileName() {
            const extMap = { 'python': 'py', 'pdsa': 'py', 'mlp': 'py', 'java': 'java', 'sql': 'sql', 'system_commands': 'sh', 'c_prog': 'c', 'big_data': 'py', 'mlops': 'py' };
            return `main.${extMap[this.selectedSubject] || 'txt'}`;
        },
        setEditorMode() {
            if(!this.editor) return;
            const modeMap = { 
                'python': 'python', 'pdsa': 'python', 'mlp': 'python', 'big_data': 'python', 'mlops': 'python',
                'java': 'text/x-java', 'sql': 'text/x-sql', 'system_commands': 'shell', 'c_prog': 'text/x-csrc'
            };
            this.editor.setOption('mode', modeMap[this.selectedSubject] || 'python');
        },
        async loadSubject() {
            this.loading = true;
            this.questions = [];
            this.currentQuestion = null;
            if(this.editor) this.setEditorMode();
            
            try {
                // FIXED: Now fetching from ./data/
                const res = await fetch(`./data/${this.selectedSubject}.json`);
                if(res.ok) {
                    this.questions = await res.json();
                    if(this.questions.length > 0) this.loadQuestion(this.questions[0]);
                    else if(this.editor) this.editor.setValue("# No questions found.");
                } else {
                     // Handle new subjects with empty files
                    if(this.editor) this.editor.setValue("# No questions loaded.");
                }
            } catch(e) { console.error(e); } 
            finally { this.loading = false; }
        },
        loadQuestion(q) {
            this.currentQuestion = q;
            if(!this.isAdminMode) {
                // Ensure editor exists
                this.$nextTick(() => {
                        if(!this.editor) this.initEditor();
                        if(this.editor) {
                            const code = q.userCode || q.starterCode || '';
                            this.editor.setValue(code);
                            setTimeout(() => this.editor.refresh(), 100);
                        }
                });
            }
        },
        getStatusColor(status) {
            if (status === 'passed') return 'bg-green-500';
            if (status === 'failed') return 'bg-red-500';
            return 'bg-gray-600';
        },
        async runCode() {
            if (!this.currentQuestion) return;
            this.isRunning = true;
            this.consoleOutput = [{type: 'info', text: 'Running tests...'}];

            const code = this.editor.getValue();
            let lang = 'python';
            let version = '3.10.0';

            // Extended Mapping
            if(this.selectedSubject === 'java') { lang = 'java'; version = '15.0.2'; }
            else if(this.selectedSubject === 'system_commands') { lang = 'bash'; version = '5.0.0'; }
            else if(this.selectedSubject === 'sql') { lang = 'sqlite3'; version = '3.36.0'; }
            else if(this.selectedSubject === 'c_prog') { lang = 'c'; version = '10.2.0'; }

            try {
                const response = await fetch('https://emkc.org/api/v2/piston/execute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        language: lang,
                        version: version,
                        files: [{ content: code }]
                    })
                });
                const result = await response.json();
                
                if (result.run) {
                    const output = result.run.output;
                    const isError = result.run.code !== 0;
                    this.consoleOutput = output.split('\n').map(l => ({ type: isError ? 'error' : 'normal', text: l })).filter(l => l.text);
                    if(!isError) this.consoleOutput.push({type: 'success', text: '✔ Execution finished.'});
                }
            } catch (err) {
                this.consoleOutput = [{type: 'error', text: 'Error connecting to Piston API.'}];
            } finally {
                this.isRunning = false;
            }
        },
        
        // Admin Ops
        addNewQuestion() {
            const newQ = {
                id: Date.now().toString(),
                title: 'New Question',
                description: 'Enter problem description here.',
                difficulty: 'Easy',
                starterCode: '# Write your code here',
                testCases: [{input: '', output: ''}],
                status: 'pending'
            };
            this.questions.push(newQ);
            this.currentQuestion = newQ;
            if(!this.isAdminMode) this.toggleAdmin(); // Auto switch to edit
        },
        addTestCase() {
            if(!this.currentQuestion.testCases) this.currentQuestion.testCases = [];
            this.currentQuestion.testCases.push({input: '', output: ''});
        },
        deleteQuestion() {
            if(confirm("Delete this question?")) {
                this.questions = this.questions.filter(q => q.id !== this.currentQuestion.id);
                this.currentQuestion = null;
            }
        },
        async saveQuestions() {
                try {
                if (window.showSaveFilePicker) {
                    const h = await window.showSaveFilePicker({ suggestedName: `${this.selectedSubject}.json` });
                    const w = await h.createWritable();
                    await w.write(JSON.stringify(this.questions, null, 2));
                    await w.close();
                    alert("File saved!");
                } else {
                    // Fallback
                    const blob = new Blob([JSON.stringify(this.questions, null, 2)], {type: 'application/json'});
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = `${this.selectedSubject}.json`;
                    a.click();
                }
            } catch (e) { alert("Could not save file."); }
        }
    },
    watch: {
        isAdminMode(newVal) {
            if(!newVal) {
                    // Switched back to Practice Mode, re-render Editor
                    this.editor = null; // force re-init
                    this.$nextTick(() => {
                        this.loadQuestion(this.currentQuestion);
                    });
            }
        }
    }
}).mount('#app');
