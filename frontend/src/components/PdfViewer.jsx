// frontend/src/components/PdfViewer.jsx
import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set worker URL
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const PdfViewer = ({ pdfUrl, onTextSelect }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setIsLoading(false);
  };

  const onDocumentLoadError = (error) => {
    console.error('PDF loading error:', error);
    setError('Failed to load PDF. Please try again later.');
    setIsLoading(false);
  };

  const handlePreviousPage = () => {
    setPageNumber((prevPageNumber) => Math.max(prevPageNumber - 1, 1));
  };

  const handleNextPage = () => {
    setPageNumber((prevPageNumber) =>
      Math.min(prevPageNumber + 1, numPages || 1)
    );
  };

  const handleZoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + 0.2, 3.0));
  };

  const handleZoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - 0.2, 0.5));
  };

  const handleRotate = () => {
    setRotation((prevRotation) => (prevRotation + 90) % 360);
  };

  const handleTextSelection = () => {
    if (!onTextSelect) return;

    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      if (containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();

        // Calculate relative position
        const relativeRect = {
          left: rect.left - containerRect.left,
          top: rect.top - containerRect.top,
          width: rect.width,
          height: rect.height,
          pageNumber
        };

        onTextSelect({
          text: selection.toString(),
          position: relativeRect,
          pageNumber
        });
      }
    }
  };

  return (
    <div className='flex flex-col w-full h-full' ref={containerRef}>
      {/* PDF Controls */}
      <div className='bg-white p-4 border-b flex items-center justify-between mb-4'>
        <div className='flex items-center gap-2'>
          <button
            onClick={handlePreviousPage}
            disabled={pageNumber <= 1}
            className='px-3 py-1 border rounded bg-gray-50 disabled:opacity-50'
          >
            Previous
          </button>
          <span>
            Page {pageNumber} of {numPages || '?'}
          </span>
          <button
            onClick={handleNextPage}
            disabled={pageNumber >= numPages}
            className='px-3 py-1 border rounded bg-gray-50 disabled:opacity-50'
          >
            Next
          </button>
        </div>

        <div className='flex items-center gap-2'>
          <button
            onClick={handleZoomOut}
            className='px-3 py-1 border rounded bg-gray-50'
          >
            Zoom -
          </button>
          <span>{Math.round(scale * 100)}%</span>
          <button
            onClick={handleZoomIn}
            className='px-3 py-1 border rounded bg-gray-50'
          >
            Zoom +
          </button>
          <button
            onClick={handleRotate}
            className='px-3 py-1 border rounded bg-gray-50'
          >
            Rotate
          </button>
        </div>
      </div>

      {/* PDF Document */}
      <div className='flex-1 overflow-auto bg-gray-100'>
        {isLoading && (
          <div className='flex justify-center items-center h-full'>
            <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary'></div>
          </div>
        )}

        {error && (
          <div className='flex justify-center items-center h-full'>
            <div className='bg-red-50 text-red-700 p-4 rounded-lg'>{error}</div>
          </div>
        )}

        <div className='flex justify-center' onMouseUp={handleTextSelection}>
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className='flex justify-center items-center h-96'>
                <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary'></div>
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              rotate={rotation}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className='shadow-lg'
            />
          </Document>
        </div>
      </div>
    </div>
  );
};

export default PdfViewer;
