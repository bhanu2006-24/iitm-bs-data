// Markdown & Math Utilities
export const MarkdownUtils = {
    // Basic Markdown Parser (using marked if available, else simple fallback)
    parse(text) {
        if (!text) return '';
        if (typeof window.marked !== 'undefined') {
            return window.marked.parse(text);
        }
        return text;
    },

    // Render Math using Katex
    renderMath(element) {
        if (typeof window.renderMathInElement !== 'undefined' && element) {
            try {
                window.renderMathInElement(element, {
                    delimiters: [
                        {left: '$$', right: '$$', display: true},
                        {left: '$', right: '$', display: false},
                        {left: '\\(', right: '\\)', display: false},
                        {left: '\\[', right: '\\]', display: true}
                    ],
                    throwOnError: false
                });
            } catch(e) { console.warn('Math render error', e); }
        }
    }
};
