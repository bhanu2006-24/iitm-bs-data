import { MarkdownUtils } from './utils.js';
const { createApp } = Vue;

createApp({
    data() {
        return {
            currentLevel: 'foundation', // foundation | diploma | degree
            catalog: { foundation: [], diploma: [], degree: [] },
            searchQuery: '',
            selectedCourse: null,
            sidebarOpen: true,
            videoPreviewId: null, // For modal
            viewMode: 'preview', // preview | edit
            previewOpenWeeks: [],
            editOpenWeeks: [0], // Default open week 1
            loading: false
        }
    },
    computed: {
        filteredCourses() {
            const list = this.catalog[this.currentLevel] || [];
            if (!this.searchQuery) return list;
            const q = this.searchQuery.toLowerCase();
            return list.filter(c => 
                c.name.toLowerCase().includes(q) || 
                c.code.toLowerCase().includes(q)
            );
        }
    },
    created() {
        this.loadCatalog();
    },
    updated() {
        this.$nextTick(() => {
            // Only render math in specific containers to avoid breaking Vue's DOM tracking
            const elements = document.querySelectorAll('.math-content');
            elements.forEach(el => {
                // Check if already rendered to avoid double-processing (optional optimization)
                if(!el.hasAttribute('data-math-rendered')) {
                    MarkdownUtils.renderMath(el);
                    el.setAttribute('data-math-rendered', 'true');
                }
            });
        });
    },
    methods: {
        async loadCatalog() {
            try {
                const res = await fetch(`./data/catalog.json?t=${Date.now()}`);
                if (res.ok) {
                    this.catalog = await res.json();
                } else {
                    console.error("Failed to load catalog:", res.status);
                }
            } catch (e) { console.error("Failed to load catalog", e); }
        },

        async loadCourse(catalogEntry) {
            this.loading = true;
            this.previewOpenWeeks = [];
            
            try {
                const res = await fetch(`./data/${catalogEntry.path}?t=${Date.now()}`);
                if (res.ok) {
                    this.selectedCourse = await res.json();
                    if (!this.selectedCourse.weeks) this.selectedCourse.weeks = [];
                    // Ensure new fields exist
                    if (!this.selectedCourse.grading) {
                        this.selectedCourse.grading = { q1: 20, q2: 30, endTerm: 40, assignments: 10 };
                    }
                    if (!this.selectedCourse.books) {
                        this.selectedCourse.books = [];
                    }
                    
                    // Normalize Weeks Data
                    this.selectedCourse.weeks.forEach((w, index) => {
                        // Ensure unique ID
                        if(!w.id) w.id = Date.now() + Math.random() + index;

                        // Migration: Unified Content Model
                        if (!w.content) {
                            w.content = [];
                            
                            // Migrate Lectures
                            if (w.lectures) {
                                w.content.push(...w.lectures.map(l => ({ ...l, type: 'lecture', id: Date.now() + Math.random() })));
                            }
                            
                            // Migrate Resources (Notes)
                            if (w.notes) {
                                w.content.push(...w.notes.map(n => ({ ...n, type: 'resource', resourceType: n.type || 'url', id: Date.now() + Math.random() })));
                            }
                            
                            // Migrate Practice
                            if (w.practice) {
                                w.content.push(...w.practice.map(p => ({ ...p, type: 'quiz', id: Date.now() + Math.random() })));
                            }

                            // Sort by order if available? For now, append in sequence: Lectures -> Resources -> Practice is the old standard.
                        }
                    });

                    if(this.selectedCourse.weeks.length > 0) this.previewOpenWeeks = [this.selectedCourse.weeks[0].id];
                    this.viewMode = 'preview';
                    this.editOpenWeeks = [0];
                } else {
                    alert("Failed to load course details. File might be missing.");
                }
            } catch (e) {
                console.error(e);
                alert("Error loading course data. Check console.");
            } finally {
                this.loading = false;
            }
        },

        playVideo(id) {
            this.videoPreviewId = id;
        },

        closeVideo() {
            this.videoPreviewId = null;
        },

        togglePreviewWeek(num) {
            if (this.previewOpenWeeks.includes(num)) {
                this.previewOpenWeeks = this.previewOpenWeeks.filter(n => n !== num);
            } else {
                this.previewOpenWeeks.push(num);
            }
        },

        toggleEditWeek(idx) {
             if (this.editOpenWeeks.includes(idx)) {
                this.editOpenWeeks = this.editOpenWeeks.filter(n => n !== idx);
            } else {
                this.editOpenWeeks.push(idx);
            }
        },
        
        moveItem(array, index, direction) {
            if (direction === -1 && index > 0) {
                [array[index], array[index - 1]] = [array[index - 1], array[index]];
            } else if (direction === 1 && index < array.length - 1) {
                [array[index], array[index + 1]] = [array[index + 1], array[index]];
            }
        },

        deleteItem(array, index, type = 'item') {
            if(confirm(`Are you sure you want to remove this ${type}?`)) {
                array.splice(index, 1);
            }
        },

        // Helper to get youtube thumb
        getYtThumbnail(id) {
            if (!id) return '';
            return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
        },

        // Markdown Renderer
        renderMarkdown(text) {
             return MarkdownUtils.parse(text);
        },

        // Add a new Question to a specific Practice Item
        addQuestion(practiceItem) {
            if(!practiceItem.questions) practiceItem.questions = [];
            practiceItem.questions.push({
                id: Date.now(),
                type: 'mcq', // mcq, msq, nat, boolean
                text: 'New Question',
                options: ['Option A', 'Option B'],
                answer: '',
                explanation: ''
            });
        },

        expandAllWeeks() {
            if(!this.selectedCourse) return;
            this.editOpenWeeks = this.selectedCourse.weeks.map((_, i) => i);
        },
        
        collapseAllWeeks() {
            this.editOpenWeeks = [];
        },

        toggleSidebar() {
            this.sidebarOpen = !this.sidebarOpen;
        },

        async saveFile() {
            if (!this.selectedCourse) return;
            
            try {
                // We need to save to the specific file.
                // In a browser with File System Access API, we can ask the user to pick the file.
                // Or we download it.
                // Since this is a "Manager", ideally we overwrite the local file if possible (not possible in pure web without permission).
                // We will use the standard "Save As" flow but suggest the correct filename.
                
                const fileName = `${this.selectedCourse.code}.json`;
                
                if (window.showSaveFilePicker) {
                    const h = await window.showSaveFilePicker({ suggestedName: fileName });
                    const w = await h.createWritable();
                    await w.write(JSON.stringify(this.selectedCourse, null, 2));
                    await w.close();
                    alert("Course saved!");
                } else {
                    const blob = new Blob([JSON.stringify(this.selectedCourse, null, 2)], {type: 'application/json'});
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = fileName;
                    a.click();
                }
            } catch (e) {
                console.error(e);
                alert("Save cancelled or failed");
            }
        }
    }
}).mount('#app');
