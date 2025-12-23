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
                    // Open first week by default if exists
                    if(this.selectedCourse.weeks.length > 0) this.previewOpenWeeks = [this.selectedCourse.weeks[0].weekNum];
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
