import React, { useState, useRef, useEffect } from 'react';
import { FaHighlighter, FaEraser, FaRegCommentDots, FaCheck, FaTimes, FaSearch, FaSearchMinus, FaSearchPlus } from 'react-icons/fa';

interface Annotation {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  text?: string;
  linkedData?: string;
}

interface HighlightMatch {
  text: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
  pageNumber: number;
}

interface DocumentViewerProps {
  documentUrl: string;
  documentType: 'pdf' | 'image';
  highlights?: HighlightMatch[];
  onAnnotationCreated?: (annotation: Annotation) => void;
  onAnnotationDeleted?: (annotationId: string) => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  documentUrl,
  documentType,
  highlights = [],
  onAnnotationCreated,
  onAnnotationDeleted
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentTool, setCurrentTool] = useState<'highlight' | 'erase' | 'comment' | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
  const [currentBox, setCurrentBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [commentText, setCommentText] = useState('');
  const [editingAnnotation, setEditingAnnotation] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  
  // Add highlights from props to annotations
  useEffect(() => {
    if (highlights && highlights.length) {
      const highlightAnnotations = highlights.map(highlight => ({
        id: `highlight-${Math.random().toString(36).substring(2, 9)}`,
        x: highlight.boundingBox.x,
        y: highlight.boundingBox.y,
        width: highlight.boundingBox.width,
        height: highlight.boundingBox.height,
        color: 'rgba(255, 255, 0, 0.3)',
        text: highlight.text,
        linkedData: highlight.text
      }));
      
      setAnnotations(prev => [...prev, ...highlightAnnotations]);
    }
  }, [highlights]);

  const handleToolSelect = (tool: 'highlight' | 'erase' | 'comment' | null) => {
    setCurrentTool(tool);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!currentTool || !containerRef.current) return;
    
    setIsDrawing(true);
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    setStartPosition({ x, y });
    setCurrentBox({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !currentBox || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    setCurrentBox({
      x: Math.min(startPosition.x, x),
      y: Math.min(startPosition.y, y),
      width: Math.abs(x - startPosition.x),
      height: Math.abs(y - startPosition.y)
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentBox) return;
    
    if (currentTool === 'highlight' || currentTool === 'comment') {
      // Only create annotation if the box has a reasonable size
      if (currentBox.width > 5 && currentBox.height > 5) {
        const newAnnotation: Annotation = {
          id: `annotation-${Date.now()}`,
          ...currentBox,
          color: currentTool === 'highlight' 
            ? 'rgba(255, 255, 0, 0.3)' 
            : 'rgba(0, 128, 255, 0.3)'
        };
        
        setAnnotations(prev => [...prev, newAnnotation]);
        
        if (currentTool === 'comment') {
          setEditingAnnotation(newAnnotation.id);
        }
        
        if (onAnnotationCreated) {
          onAnnotationCreated(newAnnotation);
        }
      }
    } else if (currentTool === 'erase') {
      // Find annotations under the current box
      const annotationsToRemove = annotations.filter(annotation => {
        const annotRight = annotation.x + annotation.width;
        const annotBottom = annotation.y + annotation.height;
        const boxRight = currentBox.x + currentBox.width;
        const boxBottom = currentBox.y + currentBox.height;
        
        // Check for intersection
        return !(
          annotRight < currentBox.x ||
          annotation.x > boxRight ||
          annotBottom < currentBox.y ||
          annotation.y > boxBottom
        );
      });
      
      if (annotationsToRemove.length) {
        setAnnotations(prev => 
          prev.filter(a => !annotationsToRemove.some(ar => ar.id === a.id))
        );
        
        annotationsToRemove.forEach(a => {
          if (onAnnotationDeleted) {
            onAnnotationDeleted(a.id);
          }
        });
      }
    }
    
    setIsDrawing(false);
    setCurrentBox(null);
  };

  const handleCommentSave = () => {
    if (!editingAnnotation || !commentText.trim()) return;
    
    setAnnotations(prev => 
      prev.map(a => 
        a.id === editingAnnotation 
          ? { ...a, text: commentText } 
          : a
      )
    );
    
    setCommentText('');
    setEditingAnnotation(null);
  };

  const handleCommentCancel = () => {
    // If the annotation was just created and comment is canceled, remove it
    if (editingAnnotation && !commentText.trim()) {
      setAnnotations(prev => prev.filter(a => a.id !== editingAnnotation));
      
      if (onAnnotationDeleted) {
        onAnnotationDeleted(editingAnnotation);
      }
    }
    
    setCommentText('');
    setEditingAnnotation(null);
  };

  const zoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3));
  };

  const zoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  };

  const resetZoom = () => {
    setZoom(1);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-gray-100 p-2 rounded-t-lg flex justify-between">
        <div className="flex space-x-2">
          <button
            onClick={() => handleToolSelect('highlight')}
            className={`p-2 rounded ${currentTool === 'highlight' ? 'bg-yellow-200' : 'bg-white'}`}
            title="Highlight Text"
          >
            <FaHighlighter className={currentTool === 'highlight' ? 'text-yellow-600' : 'text-gray-600'} />
          </button>
          <button
            onClick={() => handleToolSelect('comment')}
            className={`p-2 rounded ${currentTool === 'comment' ? 'bg-blue-200' : 'bg-white'}`}
            title="Add Comment"
          >
            <FaRegCommentDots className={currentTool === 'comment' ? 'text-blue-600' : 'text-gray-600'} />
          </button>
          <button
            onClick={() => handleToolSelect('erase')}
            className={`p-2 rounded ${currentTool === 'erase' ? 'bg-red-200' : 'bg-white'}`}
            title="Erase Annotation"
          >
            <FaEraser className={currentTool === 'erase' ? 'text-red-600' : 'text-gray-600'} />
          </button>
          <button
            onClick={() => handleToolSelect(null)}
            className={`p-2 rounded ${currentTool === null ? 'bg-green-200' : 'bg-white'}`}
            title="View Mode"
          >
            <FaSearch className={currentTool === null ? 'text-green-600' : 'text-gray-600'} />
          </button>
        </div>
        
        <div className="flex space-x-2">
          <button onClick={zoomOut} className="p-2 rounded bg-white" title="Zoom Out">
            <FaSearchMinus className="text-gray-600" />
          </button>
          <button onClick={resetZoom} className="p-2 rounded bg-white" title="Reset Zoom">
            <span className="text-sm font-medium">{Math.round(zoom * 100)}%</span>
          </button>
          <button onClick={zoomIn} className="p-2 rounded bg-white" title="Zoom In">
            <FaSearchPlus className="text-gray-600" />
          </button>
        </div>
      </div>
      
      <div 
        className="relative flex-grow overflow-auto bg-gray-200 border border-gray-300"
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div 
          className="relative inline-block origin-top-left"
          style={{ transform: `scale(${zoom})` }}
        >
          {documentType === 'pdf' ? (
            <div className="w-full h-full">
              <iframe 
                src={`${documentUrl}#toolbar=0`} 
                className="w-[800px] h-[1100px] bg-white pointer-events-none"
                title="Document Viewer"
              />
            </div>
          ) : (
            <img 
              src={documentUrl} 
              alt="Document" 
              className="max-w-none pointer-events-none"
            />
          )}
          
          {/* Render existing annotations */}
          {annotations.map(annotation => (
            <div
              key={annotation.id}
              className="absolute border-2 border-transparent cursor-pointer"
              style={{
                left: `${annotation.x}px`,
                top: `${annotation.y}px`,
                width: `${annotation.width}px`,
                height: `${annotation.height}px`,
                backgroundColor: annotation.color,
                borderColor: annotation.text ? 'rgba(0, 128, 255, 0.6)' : 'transparent'
              }}
              title={annotation.text || ''}
            />
          ))}
          
          {/* Render current box while drawing */}
          {isDrawing && currentBox && (
            <div
              className="absolute border-2 border-dashed"
              style={{
                left: `${currentBox.x}px`,
                top: `${currentBox.y}px`,
                width: `${currentBox.width}px`,
                height: `${currentBox.height}px`,
                borderColor: currentTool === 'highlight' 
                  ? 'rgba(255, 200, 0, 0.8)' 
                  : currentTool === 'erase' 
                    ? 'rgba(255, 0, 0, 0.8)' 
                    : 'rgba(0, 128, 255, 0.8)',
                backgroundColor: currentTool === 'highlight' 
                  ? 'rgba(255, 255, 0, 0.2)' 
                  : currentTool === 'erase' 
                    ? 'rgba(255, 0, 0, 0.1)' 
                    : 'rgba(0, 128, 255, 0.1)'
              }}
            />
          )}
        </div>
      </div>
      
      {/* Comment editing modal */}
      {editingAnnotation && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-md w-full">
            <h3 className="text-lg font-medium mb-3">Add Comment</h3>
            <textarea
              className="w-full border border-gray-300 rounded-md p-2 mb-4"
              rows={4}
              placeholder="Enter your comment here..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              autoFocus
            ></textarea>
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleCommentCancel}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <FaTimes className="inline mr-1" /> Cancel
              </button>
              <button
                onClick={handleCommentSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={!commentText.trim()}
              >
                <FaCheck className="inline mr-1" /> Save
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Annotation list/sidebar could be added here */}
    </div>
  );
};

export default DocumentViewer; 