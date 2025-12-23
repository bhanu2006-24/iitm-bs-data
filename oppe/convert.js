const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const TARGET_DIR = path.join(__dirname, 'data');

if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
}

// Map source prefixes to target JSON filenames
const MAPPING = {
    'python': 'python.json',
    'java': 'java.json',
    'pdsa': 'pdsa.json',
    'dbms': 'sql.json',
    'sql': 'sql.json',
    'system-commands': 'system_commands.json',
    'mlp': 'mlp.json'
};

function processFile(filename) {
    const content = fs.readFileSync(path.join(DATA_DIR, filename), 'utf8');
    
    // Remove imports
    let jsContent = content.replace(/import .*?;/g, '');
    
    // Remove type annotations like ": Problem[]"
    jsContent = jsContent.replace(/:\s*Problem\[\]/g, '');
    
    // Changing export const to plain variable
    jsContent = jsContent.replace(/export const (\w+) =/g, 'const $1 =');
    
    // We want to evaluate this to get the object
    // We'll append a consolodate log at the end
    // Find the variable name
    const match = jsContent.match(/const (\w+) =/);
    if (!match) return [];
    
    const varName = match[1];
    jsContent += `\n;JSON.stringify(${varName}, null, 2);`;
    
    try {
        // Use eval is dangerous but these are data files
        const jsonStr = eval(jsContent);
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error(`Error processing ${filename}:`, e.message);
        return [];
    }
}

const mergedData = {};

fs.readdirSync(DATA_DIR).forEach(file => {
    if (!file.endsWith('.ts')) return;
    if (file === 'problems.ts') return; 

    // Determine target
    let target = null;
    for (const prefix of Object.keys(MAPPING)) {
        if (file.startsWith(prefix)) {
            target = MAPPING[prefix];
            break;
        }
    }
    
    if (!target) {
        console.log(`Skipping ${file} - no mapping found`);
        return;
    }
    
    console.log(`Processing ${file} -> ${target}`);
    const questions = processFile(file);
    
    if (!mergedData[target]) mergedData[target] = [];
    
    // Add examType based on filename if not present
    questions.forEach(q => {
        if (!q.examType) {
            if (file.includes('oppe1')) q.examType = 'OPPE 1';
            else if (file.includes('oppe2')) q.examType = 'OPPE 2';
        }
        // Normalize fields
        if (q.setupCode) q.setupCode = q.setupCode.trim();
        // Ensure tags exists
        if (!q.tags) q.tags = ""; 
    });
    
    mergedData[target] = mergedData[target].concat(questions);
});

// Write to JSON files
for (const [filename, questions] of Object.entries(mergedData)) {
    const filePath = path.join(TARGET_DIR, filename);
    let existing = [];
    if(fs.existsSync(filePath)) {
        try { existing = JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch(e){}
    }
    
    // Merge: avoid duplicates by ID
    const map = new Map();
    existing.forEach(q => map.set(q.id, q));
    questions.forEach(q => map.set(q.id, q)); // Overwrite with new data
    
    const final = Array.from(map.values());
    fs.writeFileSync(filePath, JSON.stringify(final, null, 2));
    console.log(`Wrote ${final.length} questions to ${filename}`);
}
