/**
 * Markdown rendering module.
 * Wraps the 'marked' library (expected to be loaded globally).
 */
export const MarkdownRenderer = {
    render: (text) => {
        if (typeof marked === 'undefined') {
            console.warn('Marked library not loaded. Returning raw text.');
            return text;
        }
        // Configure marked to be safe and handle breaks
        // marked.setOptions({ breaks: true });
        return marked.parse(text);
    }
};
