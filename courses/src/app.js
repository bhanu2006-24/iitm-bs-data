const { createApp } = Vue;

createApp({
    data() {
        return {
            currentLevel: 'foundation',
            courses: [],
            loading: false,
            searchQuery: '',
            selectedCourse: null,
            activeTab: 'meta', // 'meta' | 'syllabus' | 'content'
            openWeeks: [0], // Array of open week indices
            unsavedChanges: false
        }
    },
    computed: {
        filteredCourses() {
            if(!this.searchQuery) return this.courses;
            const q = this.searchQuery.toLowerCase();
            return this.courses.filter(c => 
                c.name.toLowerCase().includes(q) || 
                c.code.toLowerCase().includes(q)
            );
        }
    },
    watch: {
        selectedCourse: {
            handler() { this.unsavedChanges = true; },
            deep: true
        }
    },
    mounted() {
        this.loadLevel('foundation');
        // Handle unsaved changes warning? 
        // For simplicity, just manual save.
    },
    methods: {
        async loadLevel(level) {
            this.loading = true;
            this.currentLevel = level;
            this.courses = [];
            this.selectedCourse = null;
            
            try {
                const res = await fetch(`./data/${level}.json`);
                if(res.ok) {
                    this.courses = await res.json();
                } else {
                    console.error("Failed to load level data");
                }
            } catch(e) {
                console.error(e);
            } finally {
                this.loading = false;
            }
        },

        selectCourse(c) {
            // Deep copy to separate from list until save? 
            // Actually, binding directly to list object is fine if we save the whole list.
            this.selectedCourse = c;
            this.activeTab = 'meta';
            // ensure exams object
            if(!this.selectedCourse.exams) this.selectedCourse.exams = { q1: false, q2: false, et: false };
            // ensure pre array
            if(!this.selectedCourse.pre) this.selectedCourse.pre = [];
            // ensure syllabus
            if(!this.selectedCourse.syllabus) this.selectedCourse.syllabus = [];
            // ensure content structure
            if(this.selectedCourse.weeks && this.selectedCourse.weeks.length > 0) {
                 this.openWeeks = [0]; // Open first week by default
            }
        },

        addPre(e) {
            const val = e.target.value.trim().toUpperCase();
            if(val) {
                if(!this.selectedCourse.pre.includes(val)) {
                    this.selectedCourse.pre.push(val);
                }
                e.target.value = '';
            }
        },

        addSyllabusItem() {
            this.selectedCourse.syllabus.push('');
        },

        initWeeks() {
            this.selectedCourse.weeks = Array.from({length: 12}, (_, i) => ({
                weekNum: i + 1,
                title: `Week ${i + 1}`,
                lectures: [],
                notes: [],
                practice: []
            }));
            this.openWeeks = [0];
        },

        toggleWeek(idx) {
            if(this.openWeeks.includes(idx)) {
                this.openWeeks = this.openWeeks.filter(i => i !== idx);
            } else {
                this.openWeeks.push(idx);
            }
        },

        async saveFile() {
             try {
                // Determine filename based on current level
                const fileName = `${this.currentLevel}.json`;
                
                if (window.showSaveFilePicker) {
                    const h = await window.showSaveFilePicker({ suggestedName: fileName });
                    const w = await h.createWritable();
                    await w.write(JSON.stringify(this.courses, null, 2));
                    await w.close();
                    this.unsavedChanges = false;
                    alert("Saved successfully!");
                } else {
                    // Fallback download
                    const blob = new Blob([JSON.stringify(this.courses, null, 2)], {type: 'application/json'});
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = fileName;
                    a.click();
                }
            } catch (e) { 
                console.error(e);
                alert("Error saving"); 
            }
        }
    }
}).mount('#app');
