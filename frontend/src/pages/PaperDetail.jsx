// frontend/src/pages/PaperDetail.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import PdfViewer from '../components/PdfViewer';
import TextHighlighter from '../components/TextHighlighter';
import api from '../services/api';
import { useToast } from '../hooks/use-toast';

export default function PaperDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [paper, setPaper] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [selectedText, setSelectedText] = useState(null);
  const [highlights, setHighlights] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const pdfContainerRef = useRef(null);

  // Fetch paper details
  useEffect(() => {
    const fetchPaper = async () => {
      try {
        const response = await api.get(`/papers/${id}`);
        setPaper(response.data);

        // If paper has viewUrl, set as pdfUrl
        if (response.data.viewUrl) {
          setPdfUrl(response.data.viewUrl);
        }

        setLoading(false);
      } catch (err) {
        setError('Failed to fetch paper details');
        setLoading(false);
        toast({
          variant: 'destructive',
          title: 'Error',
          description:
            err.response?.data?.error || 'Failed to fetch paper details'
        });
      }
    };

    fetchPaper();
  }, [id]);

  // Poll for processing status if paper is pending/processing
  useEffect(() => {
    if (!paper || !['pending', 'processing'].includes(paper.processedStatus)) {
      return;
    }

    const checkStatus = async () => {
      try {
        const response = await api.get(`/papers/${id}/status`);
        setProcessingStatus(response.data);

        // If processing is completed, update paper data
        if (response.data.status === 'completed') {
          const paperResponse = await api.get(`/papers/${id}`);
          setPaper(paperResponse.data);
          setPdfUrl(paperResponse.data.viewUrl);
        } else if (response.data.status === 'failed') {
          toast({
            variant: 'destructive',
            title: 'Processing Failed',
            description: response.data.error || 'Failed to process paper'
          });
        }
      } catch (err) {
        console.error('Error checking status:', err);
      }
    };

    // Check immediately and then every 5 seconds
    checkStatus();
    const interval = setInterval(checkStatus, 5000);

    return () => clearInterval(interval);
  }, [paper, id]);

  // Handle text selection
  const handleTextSelect = (selection) => {
    setSelectedText({
      ...selection,
      currentPage
    });

    // Add to highlights
    setHighlights((prev) => [
      ...prev,
      {
        ...selection,
        id: Date.now(),
        currentPage
      }
    ]);
  };

  // Handle highlight click
  const handleHighlightClick = (highlight) => {
    setSelectedText(highlight);
  };

  if (loading) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary'></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='container mx-auto py-10'>
        <div className='bg-red-50 p-4 text-red-700 rounded-lg mb-4'>
          {error}
        </div>
        <Button onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const isProcessing =
    paper.processedStatus === 'pending' ||
    paper.processedStatus === 'processing';

  return (
    <div className='container mx-auto py-6'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold mb-2'>{paper.title}</h1>
        <div className='flex justify-between items-center'>
          <div>
            <p className='text-gray-600'>
              Uploaded: {new Date(paper.createdAt).toLocaleDateString()}
            </p>
            {paper.pageCount > 0 && (
              <p className='text-gray-600'>{paper.pageCount} pages</p>
            )}
          </div>

          <div>
            <Button
              onClick={() => navigate('/dashboard')}
              variant='outline'
              className='mr-2'
            >
              Back to Dashboard
            </Button>
            {pdfUrl && (
              <Button asChild>
                <a href={pdfUrl} target='_blank' rel='noopener noreferrer'>
                  Download PDF
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      {isProcessing ? (
        <div className='bg-yellow-50 p-6 rounded-lg text-center'>
          <h2 className='text-xl font-medium mb-2'>Processing Paper</h2>
          <p className='mb-4'>
            Your paper is currently being processed. This may take a few
            minutes.
          </p>
          <div className='w-full bg-gray-200 rounded-full h-2.5 mb-4'>
            <div
              className='bg-blue-600 h-2.5 rounded-full'
              style={{
                width: `${processingStatus?.jobStatus?.progress || 0}%`
              }}
            ></div>
          </div>
          <p className='text-sm text-gray-600'>
            Status: {processingStatus?.status || paper.processedStatus}
          </p>
        </div>
      ) : (
        <div
          className='bg-white rounded-lg shadow overflow-hidden h-[800px] relative'
          ref={pdfContainerRef}
        >
          {pdfUrl ? (
            <>
              <PdfViewer
                pdfUrl={pdfUrl}
                onTextSelect={handleTextSelect}
                onPageChange={setCurrentPage}
              />
              <TextHighlighter
                pdfContainerRef={pdfContainerRef}
                highlights={highlights}
                onHighlightClick={handleHighlightClick}
                currentPage={currentPage}
              />

              {selectedText && (
                <div className='absolute bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg max-w-md'>
                  <h3 className='font-medium mb-2'>Selected Text</h3>
                  <p className='text-gray-700 mb-2'>{selectedText.text}</p>
                  <div className='flex justify-end'>
                    <Button size='sm' className='mr-2'>
                      Explain
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setSelectedText(null)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className='flex justify-center items-center h-full'>
              <p>PDF not available. Processing may have failed.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
