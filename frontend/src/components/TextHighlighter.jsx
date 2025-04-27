// frontend/src/components/TextHighlighter.jsx
import { useState, useEffect } from 'react';

const TextHighlighter = ({ pdfContainerRef, highlights, onHighlightClick }) => {
  const [containerRect, setContainerRect] = useState(null);

  useEffect(() => {
    if (pdfContainerRef?.current) {
      const updateContainerRect = () => {
        setContainerRect(pdfContainerRef.current.getBoundingClientRect());
      };

      // Initial measurement
      updateContainerRect();

      // Update on resize
      window.addEventListener('resize', updateContainerRect);

      return () => {
        window.removeEventListener('resize', updateContainerRect);
      };
    }
  }, [pdfContainerRef]);

  if (!containerRect || !highlights || highlights.length === 0) {
    return null;
  }

  return (
    <div className='absolute top-0 left-0 pointer-events-none'>
      {highlights.map((highlight, index) => {
        // Skip highlights from other pages
        if (highlight.pageNumber !== highlight.currentPage) {
          return null;
        }

        const style = {
          position: 'absolute',
          left: `${highlight.position.left}px`,
          top: `${highlight.position.top}px`,
          width: `${highlight.position.width}px`,
          height: `${highlight.position.height}px`,
          backgroundColor: 'rgba(255, 255, 0, 0.3)',
          border: '1px solid rgba(255, 200, 0, 0.6)',
          pointerEvents: 'auto',
          cursor: 'pointer',
          zIndex: 100
        };

        return (
          <div
            key={`highlight-${index}`}
            style={style}
            onClick={() => onHighlightClick && onHighlightClick(highlight)}
            title={highlight.text}
          />
        );
      })}
    </div>
  );
};

export default TextHighlighter;
