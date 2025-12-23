/**
 * Advanced Parsing Logic (Smart Parser)
 */
export const PDFProcessor = {
    /**
     * Extracts text and images from a PDF page.
     */
    getPageContent: async (pdfPage) => {
        // 1. Get Text Items
        const textContent = await pdfPage.getTextContent();
        const items = textContent.items.map(item => ({
            type: 'text',
            str: item.str,
            x: item.transform[4],
            y: item.transform[5], 
            h: item.height,
            w: item.width
        }));

        // 2. Get Images (Basic OpList extraction)
        // Note: Real extraction requires processing XObjects. 
        // For this demo, we can't easily extract binary data without more complex ops.
        // We will assume text-based extraction is primary, and images are secondary markers.
        // If we really need image extraction, we'd need to render the page to canvas and crop (Snapshot).
        
        // Sorting: Top to Bottom
        items.sort((a, b) => b.y - a.y);
        return items;
    },

    /**
     * Smart Parser logic to identify questions, types, and parent contexts.
     */
    parseQuestions: (allItems) => {
        const questions = [];
        let currentQ = null;
        let parentContext = ''; 
        let currentSectionId = '';
        
        // Group by Lines
        const lines = toLines(allItems);
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].text.trim();
            if (!line) continue;

            // Detect Section / Parent content
            // Usage: If we see "Section Id :", we might be entering a new section.
            if (line.match(/^Section\s+iId\s*:/i) || line.match(/^Section\s+Id\s*:/i)) {
                parentContext = ''; // Reset parent context on new section?
                // Maybe capture section header info if needed
                continue;
            }

            // Detect Question Start
            const qNumMatch = line.match(/Question\s+Number\s*:\s*(\d+)/i);
            
            if (qNumMatch) {
                if (currentQ) {
                    finalizeQuestion(currentQ);
                    questions.push(currentQ);
                }

                currentQ = {
                    id: `gen-${Date.now()}-${Math.floor(Math.random()*10000)}`,
                    number: qNumMatch[1],
                    text: '',
                    options: [],
                    type: 'MCQ',
                    marks: 1, // Default, will update
                    parent: parentContext // Attach current parent context
                };

                // ID Parsing
                const idMatch = line.match(/Question\s+Id\s*:\s*(\d+)/i);
                if (idMatch) currentQ.metaId = idMatch[1];

                // Type Parsing
                const typeMatch = line.match(/Question\s+Type\s*:\s*(\w+\s*\w*)/i);
                if (typeMatch) currentQ.type = mapType(typeMatch[1]);

                continue;
            }

            // Parsing Metadata/Content for Current Question
            if (currentQ) {
                // Correct Marks
                if (line.match(/^Correct\s+Marks\s*:/i)) {
                    const m = line.match(/Marks\s*:\s*(\d+(\.\d+)?)/i);
                    if (m) currentQ.marks = parseFloat(m[1]);
                    continue;
                }

                // Question Label overrides Type
                if (line.match(/^Question\s+Label\s*:/i)) {
                    const label = line.split(':')[1].trim().toLowerCase();
                    if (label.includes('multiple choice')) currentQ.type = 'MCQ';
                    else if (label.includes('multiple select')) currentQ.type = 'MSQ';
                    else if (label.includes('short answer')) {
                        currentQ.type = 'NAT';
                        currentQ.isSA = true;
                    }
                    continue;
                }
                
                // Response Type overrides Type (e.g. Numeric)
                if (line.match(/^Response\s+Type\s*:\s*Numeric/i)) {
                    currentQ.type = 'NAT';
                    continue;
                }

                // Options Start
                if (line.match(/^Options\s*:/i)) continue;

                // Ignore Fluff
                if (line.match(/^(Mandatory|Display Number Panel|Group|Section|Question Number|Question Type|Question Id)/i)) continue;

                // Possible Answers (for NAT)
                // "Possible Answers : 12367" or "245"
                if (line.match(/^Possible\s+Answers\s*:/i)) {
                    const val = line.split(':')[1].trim(); 
                    if (val) currentQ.correctValue = val;
                    continue;
                }
                // Standalone number matching a NAT answer pattern (green text usually) if we are in NAT mode?
                // Hard to detect color here. But if we see a number at the end, it might be the answer.
                // Rely on "Possible Answers" label if present.

                // Detect Option
                // Regex for ID + Marker + Text
                // 6406531926616. ✔ Speak up 
                // 6406531926617. * Speak out
                // 6406531926618. x Call back (Assume x is wrong)
                const optMatch = line.match(/^(\d+)\.\s*([*✔✓x])?\s*(.+)/);

                if (optMatch) {
                    const marker = optMatch[2]; // * or ✔ or x
                    const content = optMatch[3].trim();
                    const isCorrect = (marker === '✔' || marker === '✓');
                    // Note: If no marker, might be SA text or simple option list? 
                    // Usually SA doesn't have options.
                    
                    if (currentQ.type !== 'NAT') {
                        currentQ.options.push({
                            text: content,
                            isCorrect: isCorrect
                        });
                    }
                } else {
                    // Just text line
                    // If we haven't seen options yet, it's Question Text
                    // If we have seen options, it's option continuation?
                    // Actually "Options :" header usually separates. 
                    // But we might not catch it if it's not on new line.
                    // Heuristic: If we have options, append to last option. Else append to question.
                    
                    // Specific check for "Possible Answers :" being multiline
                    if (line.match(/^\d+$/) && currentQ.type === 'NAT') {
                         // Likely the answer if it stands alone at bottom
                         currentQ.correctValue = line;
                    } else if (currentQ.options.length > 0) {
                        currentQ.options[currentQ.options.length - 1].text += ' ' + line;
                    } else {
                        currentQ.text += (currentQ.text ? '\n' : '') + line;
                    }
                }

            } else {
                // No current question => Parent Context / Comprehension Text
                // Accumulate text that looks like content (not headers)
                if (!line.match(/^(Section|Group|Mandatory|Display)/i)) {
                    parentContext += (parentContext? '\n' : '') + line;
                }
            }
        }

        if (currentQ) {
            finalizeQuestion(currentQ);
            questions.push(currentQ);
        }

        return questions;
    }
};

function toLines(items) {
    const lines = [];
    let currentLine = { y: -1, textParts: [] };
    
    // Sort by Y desc
    items.sort((a,b) => b.y - a.y);

    items.forEach(item => {
        if (currentLine.y !== -1 && Math.abs(item.y - currentLine.y) > 8) {
             // Sort X asc
             currentLine.textParts.sort((a,b) => a.x - b.x);
             lines.push({ text: currentLine.textParts.map(p => p.str).join(' ') });
             currentLine = { y: item.y, textParts: [] };
        }
        if (currentLine.y === -1) currentLine.y = item.y;
        currentLine.textParts.push(item);
    });
    
    if (currentLine.textParts.length) {
         currentLine.textParts.sort((a,b) => a.x - b.x);
         lines.push({ text: currentLine.textParts.map(p => p.str).join(' ') });
    }
    
    return lines;
}

function mapType(raw) {
    if (!raw) return 'MCQ';
    raw = raw.toUpperCase();
    if (raw.includes('MCQ')) return 'MCQ';
    if (raw.includes('MSQ')) return 'MSQ';
    if (raw.includes('SA')) return 'NAT';
    if (raw.includes('NAT')) return 'NAT';
    return 'MCQ';
}

function finalizeQuestion(q) {
    // If NAT, clean up "Possible Answers" from text if it leaked
    if (q.type === 'NAT' && q.correctValue) {
         q.text = q.text.replace(/Possible\s+Answers\s*:?/i, '').trim();
    }
    
    // Set Correct Indices for MCQ/MSQ
    if (q.type === 'MCQ') {
        const idx = q.options.findIndex(o => o.isCorrect);
        q.correctIndex = idx >= 0 ? idx : -1;
    } else if (q.type === 'MSQ') {
        q.correctIndices = q.options
            .map((o, i) => o.isCorrect ? i : -1)
            .filter(i => i !== -1);
    }
    
    // Convert Option Objects to Strings for current data model
    // Data Model expects: q.options = ["Opt A", "Opt B"]
    // so we strip metadata but keep order.
    // If we want to preserve images, we assume markdown text.
    q.options = q.options.map(o => o.text);
}
