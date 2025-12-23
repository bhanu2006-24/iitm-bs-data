import { executeCode } from './compiler.js';

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
            loading: false
        }
    },
    computed: {
        filteredQuestions() {
            return this.questions.filter(q => q.title.toLowerCase().includes(this.searchQuery.toLowerCase()));
        }
    },
    mounted() {
        this.loadSubject();
    },
    methods: {
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
                         // We don't auto-save to 'userCode' property to avoid polluting the definition instantly
                         // But we can tracked it if needed.
                         // For now, this is the "Playground" area.
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

        // --- Data ---
        async loadSubject() {
            this.loading = true;
            this.questions = [];
            this.currentQuestion = null;
            this.consoleOutput = [];
            if(this.editor) this.editor.setValue("");
            
            try {
                const res = await fetch(`./data/${this.selectedSubject}.json`);
                if(res.ok) {
                    this.questions = await res.json();
                    if(this.questions.length > 0) this.loadQuestion(this.questions[0]);
                    else this.addNewQuestion(true); // Auto-create first if empty
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
            this.initEditor();
            this.$nextTick(() => {
                if(this.editor) {
                    // Load Starter Code into Editor by default so user can test it
                    // Or load userCode if we want to persist session? 
                    // Let's load starterCode as base.
                    this.editor.setValue(q.starterCode || '');
                    this.editor.refresh();
                }
            });
        },

        // --- Operations ---
        async runCode() {
            if (!this.editor) return;
            this.isRunning = true;
            this.consoleOutput = [{type: 'info', text: 'Compiling...'}];
            
            const code = this.editor.getValue();
            const res = await executeCode(code, this.selectedSubject);
            
            this.consoleOutput = res.output.split('\n')
                .map(l => ({ type: res.isError ? 'error' : 'normal', text: l }))
                .filter(l => l.text);
                
            if(!res.isError) this.consoleOutput.push({type: 'success', text: '✔ Finished'});
            this.isRunning = false;
        },

        addNewQuestion(silent=false) {
            const newQ = {
                id: Date.now().toString(),
                title: 'Untitled Question',
                difficulty: 'Easy',
                description: 'Describe the problem here...',
                starterCode: '# Write code here',
                testCases: [{input: '', output: ''}],
                status: 'pending'
            };
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
            this.currentQuestion.testCases.push({input:'', output:''});
        },

        copyToStarter() {
            if(this.editor && this.currentQuestion) {
                if(confirm("Overwrite the Definition Starter Code with content from the Editor?")) {
                    this.currentQuestion.starterCode = this.editor.getValue();
                }
            }
        },

        async saveFile() {
             try {
                if (window.showSaveFilePicker) {
                    const h = await window.showSaveFilePicker({ suggestedName: `${this.selectedSubject}.json` });
                    const w = await h.createWritable();
                    await w.write(JSON.stringify(this.questions, null, 2));
                    await w.close();
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
