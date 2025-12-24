/**
 * Advanced PDF Processor with Image Extraction & Layout Analysis
 */
export const PDFProcessor = {

    /**
     * Extracts all content (text + images) from a PDF page, sorted by vertical position.
     */
    getPageContent: async (page) => {
        // 1. Get Text Content
        const textContent = await page.getTextContent();
        const textItems = textContent.items.map(item => ({
            type: 'text',
            str: item.str,
            // PDF coordinates: (0,0) is bottom-left usually, but visual top-left is what we want for sorting?
            // Usually we sort by 'y' descending (PDF coordinates).
            x: item.transform[4],
            y: item.transform[5], 
            w: item.width,
            h: item.height,
            hasEOL: item.hasEOL
        }));

        // 2. Get Images via Operator List
        const opList = await page.getOperatorList();
        const imgItems = [];
        
        for (let i = 0; i < opList.fnArray.length; i++) {
            const fn = opList.fnArray[i];
            
            // Check for image painting operators
            if (fn === pdfjsLib.OPS.paintImageXObject || fn === pdfjsLib.OPS.paintInlineImageXObject) {
                const imgName = opList.argsArray[i][0];
                
                // transform matrix is usually set by previous 'cm' (concatenate matrix) operator
                // We assume the last 'cm' before this paint op defines the position
                let transform = [1, 0, 0, 1, 0, 0];
                // Search backwards for the transformation matrix
                for (let j = i - 1; j >= 0; j--) {
                    if (opList.fnArray[j] === pdfjsLib.OPS.dependency) continue;
                    if (opList.fnArray[j] === pdfjsLib.OPS.transform) {
                        transform = opList.argsArray[j];
                        break;
                    }
                }
                
                try {
                    // Extract image data
                    // Note: This is an async operation in PDF.js, but page.objs.get might return a promise or value depending on version.
                    // safely handle it.
                    let imgObj = null;
                    if (fn === pdfjsLib.OPS.paintImageXObject) {
                        imgObj = await page.objs.get(imgName);
                    } else {
                        imgObj = imgName; // inline image data
                    }

                    if (imgObj) {
                        // Convert to DataURL for easy display
                        const dataUrl = await imageToDataUrl(imgObj);
                        if (dataUrl) {
                            imgItems.push({
                                type: 'image',
                                src: dataUrl,
                                x: transform[4],
                                y: transform[5],
                                w: transform[0],
                                h: transform[3]
                            });
                        }
                    }
                } catch (e) {
                    console.warn("Failed to extract image: " + imgName, e);
                }
            }
        }

        // 3. Merge & Sort
        // Sort by Y descending (Top of page -> Bottom of page)
        const allItems = [...textItems, ...imgItems];
        allItems.sort((a, b) => b.y - a.y);
        
        return allItems;
    },

    /**
     * Heuristic Parser
     */
    parseQuestions: (allItems) => {
        const questions = [];
        let currentQ = null;
        
        // Group items into lines to handle text fragments
        const lines = groupIntoLines(allItems);
        
        // Regex Patterns
        const patterns = {
            qStart: /(?:Question\s+(?:Number|No|Id)|Q)\s*[:.]?\s*(\d+)/i,
            qStartSimple: /^\s*Q\.?\s*(\d+)\s*[:.]/i, // Q.1 or Q1
            marks: /(?:Correct\s+)?Marks\s*[:.]?\s*(\d+(\.\d+)?)/i,
            type: /Question\s+Type\s*[:.]?\s*(\w+)/i,
            label: /Question\s+Label\s*[:.]?\s*(.+)/i,
            // Options: 1. Content, (A) Content, A. Content, a) Content
            option: /^(?:\d+|[A-Za-z])(?:[.)]|\s)\s*([*✔✓x])?\s*(.*)/
        };

        let state = 'SCANNING'; // SCANNING, HEADER, BODY, OPTIONS
        
        for (let i = 0; i < lines.length; i++) {
            const lineObj = lines[i];
            let text = cleanText(lineObj.text);
            const images = lineObj.images;

            if (!text && (!images || images.length === 0)) continue;

            // 1. Detect New Question Start
            // Priorities: Explicit "Question Number : X", then "Q.X"
            let qNumMatch = text.match(patterns.qStart) || text.match(patterns.qStartSimple);
            
            if (qNumMatch) {
                if (currentQ) {
                    finalizeQuestion(currentQ);
                    questions.push(currentQ);
                }
                
                currentQ = {
                    id: `q-${Date.now()}-${Math.floor(Math.random()*10000)}`,
                    number: qNumMatch[1],
                    type: 'MCQ', // Default
                    marks: 1,
                    text: '',
                    options: [], 
                    correctIndex: -1,
                    correctIndices: [],
                    images: []
                };
                
                // If the line has more text after the question number (e.g. "Q1. Solve this..."), valid body text
                // Remove the match part
                const matchStr = qNumMatch[0];
                const remain = text.substring(matchStr.length).trim();
                
                state = 'HEADER';
                
                // Parse metadata on same line
                const idMatch = text.match(/Question\s+Id\s*:\s*(\d+)/i);
                if (idMatch) currentQ.metaId = idMatch[1];
                
                const typeMatch = text.match(patterns.type);
                if (typeMatch) currentQ.type = mapType(typeMatch[1]);

                if (remain && !idMatch && !typeMatch) {
                    // It's likely the question text starting immediately
                    state = 'BODY';
                    currentQ.text = remain;
                }
                
                continue;
            }

            if (!currentQ) continue;

            // 2. Parse Header Info
            if (state === 'HEADER') {
                // Correct Marks
                const markMatch = text.match(patterns.marks);
                if (markMatch) {
                    currentQ.marks = parseFloat(markMatch[1]);
                }
                
                // Question Label
                const labelMatch = text.match(patterns.label);
                if (labelMatch) {
                    const label = labelMatch[1].toLowerCase();
                    if (label.includes('multiple select')) currentQ.type = 'MSQ';
                    else if (label.includes('short answer') || label.includes('numeric')) currentQ.type = 'NAT';
                    else if (label.includes('multiple choice')) currentQ.type = 'MCQ';
                    
                    state = 'BODY';
                    continue; 
                }
                
                // Transition triggers
                if (text.match(/^(Options|Possible Answers)\s*:/i)) {
                    state = 'OPTIONS';
                    continue;
                }
                
                // If we see text that isn't metadata, it's body
                if (!text.match(/Question\s+(Id|Type)|Marks\s*:/i) && text.length > 2) {
                    state = 'BODY';
                    // Don't continue, fall through to body parser
                } else {
                    continue;
                }
            }

            // 3. Parse Body
            if (state === 'BODY') {
                if (text.match(/^(Options|Possible Answers)\s*:/i)) {
                    state = 'OPTIONS';
                    continue;
                }
                
                // Avoid re-capturing metadata if it appears late (rare)
                if(!text.match(/^Question\s+(Id|Type|Label)|Correct\s+Marks/i)) {
                    currentQ.text += (currentQ.text ? '\n' : '') + text;
                }
                
                if (images && images.length > 0) {
                    images.forEach(imgSrc => {
                        currentQ.text += `\n\n![Image](${imgSrc})\n\n`;
                    });
                }
            }

            // 4. Parse Options
            if (state === 'OPTIONS') {
                // Check for Option Pattern
                const optMatch = text.match(patterns.option);
                
                if (optMatch) {
                    const marker = optMatch[1]; // * or ✔ or undefined
                    const content = optMatch[2].trim();
                    const isCorrect = (marker === '✔' || marker === '✓' || marker === '*' || text.includes('(Correct)'));
                    
                    let optText = content;
                    if (images && images.length) {
                        images.forEach(imgSrc => {
                            optText += `\n![Option Image](${imgSrc})`;
                        });
                    }

                    // If text is empty but image exists, it's valid
                    if (optText || (images && images.length)) {
                         currentQ.options.push({
                            text: optText,
                            isCorrect: isCorrect,
                            id: currentQ.options.length + 1
                        });
                    }
                } else {
                    // Continuation or NAT
                    if (text.match(/Possible\s+Answers\s*:/i) || (currentQ.type === 'NAT' && text.match(/^Answer\s*:/))) {
                        // NAT Answer
                        const parts = text.split(':');
                        const val = parts[1] ? parts[1].trim() : '';
                        if (val) currentQ.correctValue = val;
                    } 
                    else if (currentQ.type === 'NAT' && text.match(/^[\d.]+$/)) {
                         currentQ.correctValue = text;
                    } 
                    // Continuation of previous option
                    else if (currentQ.options.length > 0) {
                        const lastOpt = currentQ.options[currentQ.options.length - 1];
                        if (text) lastOpt.text += '\n' + text;
                        if (images && images.length) {
                             images.forEach(imgSrc => {
                                lastOpt.text += `\n![Option Image](${imgSrc})`;
                            });
                        }
                    }
                }
            }
        }
        
        return questions;
    }
};

function cleanText(txt) {
    if (!txt) return '';
    // Fix common PDF ligature issues or spacing
    return txt.replace(/\s+/g, ' ').trim();
}

/**
 * Helper: Convert PDF Image Object to Data URL
 */
async function imageToDataUrl(imgObj) {
    if (!imgObj || !imgObj.data) return null;
    
    // Create an off-screen canvas
    const canvas = document.createElement('canvas');
    canvas.width = imgObj.width;
    canvas.height = imgObj.height;
    const ctx = canvas.getContext('2d');
    
    // Create ImageData
    // PDF image data is typically RGBA or RGB. 
    // We might need to handle different kinds (gray, cmyk - simple rgb assumed for now)
    // If it's a raw array, we assume simple RGBA (4 bytes) or RGB (3 bytes)
    
    const dataLen = imgObj.data.length;
    const pixelCount = imgObj.width * imgObj.height;
    const newImageData = ctx.createImageData(imgObj.width, imgObj.height);
    const newParams = newImageData.data;

    let i = 0, j = 0, k = 0;
    
    if (dataLen === pixelCount * 3) {
        // RGB
        while (i < dataLen) {
            newParams[j++] = imgObj.data[i++]; // R
            newParams[j++] = imgObj.data[i++]; // G
            newParams[j++] = imgObj.data[i++]; // B
            newParams[j++] = 255; // Alpha
        }
    } else if (dataLen === pixelCount * 4) {
        // RGBA
        while (i < dataLen) {
            newParams[j++] = imgObj.data[i++];
            newParams[j++] = imgObj.data[i++];
            newParams[j++] = imgObj.data[i++];
            newParams[j++] = imgObj.data[i++];
        }
    } else if (dataLen === pixelCount) {
        // Grayscale
        while (i < dataLen) {
            const val = imgObj.data[i++];
            newParams[j++] = val;
            newParams[j++] = val;
            newParams[j++] = val;
            newParams[j++] = 255;
        }
    }
    
    ctx.putImageData(newImageData, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8);
}

/**
 * Helper: Group Items by vertical line proximity
 */
function groupIntoLines(items) {
    const lines = [];
    let currentLine = { y: -1, textParts: [], images: [] };
    
    items.forEach(item => {
        // If y difference is large (> 5), meaningful new line
        // Note: PDF Y is bottom-up, but we sorted Descending, so we are going down the page.
        // item.y is smaller as we go down? No, (0,0) is bottom-left.
        // Top is High Y. Bottom is Low Y.
        // So sorted desc: 800, 780, 760...
        
        if (currentLine.y !== -1 && Math.abs(item.y - currentLine.y) > 8) {
             finalizeLine(lines, currentLine);
             currentLine = { y: item.y, textParts: [], images: [] };
        }
        
        if (currentLine.y === -1) currentLine.y = item.y;
        
        if (item.type === 'text') currentLine.textParts.push(item);
        else if (item.type === 'image') currentLine.images.push(item);
    });
    
    if (currentLine.textParts.length || currentLine.images.length) {
         finalizeLine(lines, currentLine);
    }
    
    return lines;
}

function finalizeLine(lines, lineObj) {
    // Sort text parts by X asc (Left to Right)
    lineObj.textParts.sort((a,b) => a.x - b.x);
    // Join text
    const text = lineObj.textParts.map(p => p.str).join(' ');
    // Images URLs
    const images = lineObj.images.map(img => img.src);
    
    lines.push({ text, images, y: lineObj.y });
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
    // Clean text
    q.text = q.text.trim();
    
    // Set Correct Indices
    if (q.type === 'MCQ') {
        const idx = q.options.findIndex(o => o.isCorrect);
        q.correctIndex = idx >= 0 ? idx : -1;
    } else if (q.type === 'MSQ') {
        q.correctIndices = q.options
            .map((o, i) => o.isCorrect ? i : -1)
            .filter(i => i !== -1);
    }
    
    // Strip internal ID from options (keep only text)
    // The View expects arrays of strings. 
    // If we have images in options, they are now part of the markdown string.
    q.options = q.options.map(o => o.text);
}
