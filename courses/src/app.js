const { createApp } = Vue;

createApp({
    data() {
        return {
            currentLevel: 'foundation', // foundation | diploma | degree | pg_diploma | mtech
            catalog: { foundation: [], diploma: [], degree: [], pg_diploma: [], mtech: [] },
            searchQuery: '',
            selectedCourse: null,
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
    methods: {
        async loadCatalog() {
            try {
                const res = await fetch('./data/catalog.json');
                if (res.ok) {
                    this.catalog = await res.json();
                }
            } catch (e) { console.error("Failed to load catalog", e); }
        },

        async loadCourse(catalogEntry) {
            this.loading = true;
             // Close previous state
            this.previewOpenWeeks = [];
            
            try {
                // Determine path. catalogEntry.path is relative to data/ e.g. "foundation/MA1001.json"
                const res = await fetch(`./data/${catalogEntry.path}`);
                if (res.ok) {
                    this.selectedCourse = await res.json();
                    // Ensure structure exists
                    if (!this.selectedCourse.weeks) this.selectedCourse.weeks = [];
                    // Default open preview week 1 if exists
                    if(this.selectedCourse.weeks.length > 0) this.previewOpenWeeks = [this.selectedCourse.weeks[0].weekNum];
                    this.viewMode = 'preview'; // Reset to preview on load
                    this.editOpenWeeks = [0];
                }
            } catch (e) {
                console.error(e);
                alert("Error loading course data");
            } finally {
                this.loading = false;
            }
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
        
        expandAllWeeks() {
            if(!this.selectedCourse) return;
            this.editOpenWeeks = this.selectedCourse.weeks.map((_, i) => i);
        },
        
        collapseAllWeeks() {
            this.editOpenWeeks = [];
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
