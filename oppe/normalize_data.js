const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');

const defaults = {
    setupCode: "",
    functionName: "",
    hint: "",
    examples: [],
    testCases: [],
    tags: "",
    examType: "OPPE 1",
    status: "pending"
};

if (fs.existsSync(DATA_DIR)) {
    fs.readdirSync(DATA_DIR).forEach(file => {
        if (!file.endsWith('.json')) return;
        
        const filePath = path.join(DATA_DIR, file);
        try {
            const raw = fs.readFileSync(filePath, 'utf8');
            let data = JSON.parse(raw);
            
            if (!Array.isArray(data)) return;
            
            let modified = false;
            data = data.map(q => {
                const newQ = { ...q };
                let changedLocal = false;
                
                for (const [key, val] of Object.entries(defaults)) {
                    if (newQ[key] === undefined || newQ[key] === null) {
                        newQ[key] = val;
                        changedLocal = true;
                    }
                }
                
                // Ensure arrays are actually arrays
                if (!Array.isArray(newQ.examples)) newQ.examples = [];
                if (!Array.isArray(newQ.testCases)) newQ.testCases = [];

                if (changedLocal) modified = true;
                return newQ;
            });
            
            if (modified) {
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
                console.log(`Normalized ${file}: Added missing fields.`);
            } else {
                console.log(`Checked ${file}: All fields present.`);
            }
            
        } catch (e) {
            console.error(`Error processing ${file}:`, e.message);
        }
    });
}
