/**
 * KaTeX rendering module.
 * Wraps the 'katex' library (expected to be loaded globally).
 */
export const MathRenderer = {
    render: (element) => {
        if (typeof renderMathInElement === 'undefined') {
            console.warn('KaTeX auto-render extension not loaded.');
            return;
        }
        renderMathInElement(element, {
            delimiters: [
                {left: "$$", right: "$$", display: true},
                {left: "$", right: "$", display: false},
                {left: "\\(", right: "\\)", display: false},
                {left: "\\[", right: "\\]", display: true}
            ],
            throwOnError: false
        });
    },
    
    renderString: (texString, displayMode = false) => {
        if (typeof katex === 'undefined') {
            return texString;
        }
        try {
            return katex.renderToString(texString, {
                displayMode: displayMode,
                throwOnError: false
            });
        } catch (e) {
            console.error(e);
            return texString;
        }
    }
};
