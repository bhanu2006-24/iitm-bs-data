
import React, { useMemo, useState, useEffect } from 'react';

interface MathRendererProps {
  content: string;
  className?: string;
}

const MathRenderer: React.FC<MathRendererProps> = ({ content, className = '' }) => {
  const [katexLoaded, setKatexLoaded] = useState(false);
  const [renderError, setRenderError] = useState(false);

  useEffect(() => {
    // Check if Katex is loaded globally
    if ((window as any).katex) {
      setKatexLoaded(true);
    } else {
      // Poll for it
      const interval = setInterval(() => {
        if ((window as any).katex) {
          setKatexLoaded(true);
          clearInterval(interval);
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, []);

  const renderedContent = useMemo(() => {
    if (!content) return null;
    // Replace newlines with breaks
    const formattedContent = content.replace(/\n/g, '<br/>');

    // Safely fallback if KaTeX isn't loaded yet
    if (!katexLoaded) return <span dangerouslySetInnerHTML={{ __html: formattedContent }} />;

    try {
      // Manual parsing to handle mixed content robustly
      // Splits by $$...$$ (block) and $...$ (inline)
      const parts = [];
      const regex = /(\$\$[\s\S]*?\$\$)|(\$[\s\S]*?\$)/g;
      
      let lastIndex = 0;
      let match;
      let i = 0;

      while ((match = regex.exec(formattedContent)) !== null) {
        // Text before match
        if (match.index > lastIndex) {
          parts.push(
            <span key={`text-${i++}`} dangerouslySetInnerHTML={{ __html: formattedContent.slice(lastIndex, match.index) }} />
          );
        }

        const fullMatch = match[0];
        const isBlock = fullMatch.startsWith('$$');
        const mathExpression = isBlock ? fullMatch.slice(2, -2) : fullMatch.slice(1, -1);

        try {
          const html = (window as any).katex.renderToString(mathExpression, {
            throwOnError: false,
            displayMode: isBlock,
            output: 'html',
            strict: false,
            trust: true
          });
          
          parts.push(
             <span 
               key={`math-${i++}`} 
               className={isBlock ? 'block my-4 text-center' : ''}
               dangerouslySetInnerHTML={{ __html: html }} 
             />
          );
        } catch (e) {
          // Fallback to raw text if single expression fails (e.g. quirks mode)
          console.warn("KaTeX render error", e);
          parts.push(<span key={`err-${i++}`}>{fullMatch}</span>);
        }

        lastIndex = regex.lastIndex;
      }

      // Remaining text
      if (lastIndex < formattedContent.length) {
        parts.push(
          <span key={`text-end`} dangerouslySetInnerHTML={{ __html: formattedContent.slice(lastIndex) }} />
        );
      }
      
      return parts;
    } catch (e) {
      console.error("MathRenderer Fatal Error", e);
      // Absolute fallback to raw HTML to prevent crash
      setRenderError(true);
      return <span dangerouslySetInnerHTML={{ __html: formattedContent }} />;
    }
  }, [content, katexLoaded]);

  if (renderError) {
     return <span dangerouslySetInnerHTML={{ __html: content }} />;
  }

  return (
    <div className={`math-content ${className}`}>
      {renderedContent}
    </div>
  );
};

export default MathRenderer;