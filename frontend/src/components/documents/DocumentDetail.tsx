'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { FaFileAlt, FaTimes, FaSpinner, FaCode, FaFilePdf, FaFileWord, FaFileExcel, FaFileAlt as FaFileText } from 'react-icons/fa';

type DocumentStatus = 'pending' | 'processing' | 'completed' | 'failed';

type Document = {
  id: string;
  filename: string;
  file_type: string;
  file_size?: number;
  chunk_count: number;
  status: DocumentStatus;
  vectorized: boolean;
  created_at: string;
  completed_at?: string;
  error_message?: string;
};

type DocumentChunk = {
  id: string;
  document_id: string;
  chunk_index: number;
  text: string;
  embedding: any[];
  created_at: string;
};

interface DocumentDetailProps {
  documentId: string;
  onClose: () => void;
}

const DocumentDetail: React.FC<DocumentDetailProps> = ({ documentId, onClose }) => {
  const { data: session } = useSession();
  const [document, setDocument] = useState<Document | null>(null);
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'chunks'>('info');

  useEffect(() => {
    const fetchDocumentDetails = async () => {
      setIsLoading(true);
      try {
        const documentRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/documents/${documentId}`, {
          headers: {
            'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
          }
        });
        
        setDocument(documentRes.data);
        
        if (documentRes.data.status === 'completed') {
          const chunksRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/documents/${documentId}/chunks`, {
            headers: {
              'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
            }
          });
          
          setChunks(chunksRes.data);
        }
      } catch (error) {
        console.error('Error fetching document details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session && documentId) {
      fetchDocumentDetails();
    }
    
    // Set up polling for document with pending or processing status
    const intervalId = setInterval(() => {
      if (session && document && (document.status === 'pending' || document.status === 'processing')) {
        fetchDocumentDetails();
      }
    }, 3000);
    
    return () => clearInterval(intervalId);
  }, [documentId, session]);

  const getFileIcon = (fileType: string) => {
    const type = fileType?.toLowerCase().split('/')[1] || fileType?.toLowerCase();
    
    if (type?.includes('pdf')) {
      return <FaFilePdf className="text-red-500 text-4xl" />;
    } else if (type?.includes('word') || type?.includes('docx') || type?.includes('doc')) {
      return <FaFileWord className="text-blue-500 text-4xl" />;
    } else if (type?.includes('excel') || type?.includes('xlsx') || type?.includes('csv')) {
      return <FaFileExcel className="text-green-500 text-4xl" />;
    } else if (type?.includes('text') || type?.includes('txt')) {
      return <FaFileText className="text-gray-500 text-4xl" />;
    } else {
      return <FaFileAlt className="text-gray-500 text-4xl" />;
    }
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };
  
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };
  
  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-3 py-1 inline-flex text-sm font-semibold rounded-full bg-yellow-100 text-yellow-800">
            <FaSpinner className="animate-spin mr-2" /> Pending
          </span>
        );
      case 'processing':
        return (
          <span className="px-3 py-1 inline-flex text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
            <FaSpinner className="animate-spin mr-2" /> Processing
          </span>
        );
      case 'completed':
        return (
          <span className="px-3 py-1 inline-flex text-sm font-semibold rounded-full bg-green-100 text-green-800">
            Completed
          </span>
        );
      case 'failed':
        return (
          <span className="px-3 py-1 inline-flex text-sm font-semibold rounded-full bg-red-100 text-red-800">
            Failed
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 inline-flex text-sm font-semibold rounded-full bg-gray-100 text-gray-800">
            Unknown
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="animate-pulse flex flex-col space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-xl">
          <h2 className="text-xl font-semibold mb-4">Error</h2>
          <p>Document not found or unable to load document details.</p>
          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Document Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>
        
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'info'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Document Info
          </button>
          <button
            onClick={() => setActiveTab('chunks')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'chunks'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            disabled={document.status !== 'completed'}
          >
            Chunks & Embeddings {document.chunk_count > 0 && `(${document.chunk_count})`}
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 flex flex-col items-center justify-start p-4 border rounded-lg">
                {getFileIcon(document.file_type)}
                <h3 className="mt-4 text-lg font-medium text-center">{document.filename}</h3>
                <div className="mt-2">{getStatusBadge(document.status)}</div>
              </div>
              
              <div className="md:col-span-2">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium mb-4">Document Information</h3>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-sm font-medium text-gray-500">File Type</div>
                      <div className="text-sm text-gray-900">{document.file_type}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-sm font-medium text-gray-500">Size</div>
                      <div className="text-sm text-gray-900">{formatFileSize(document.file_size)}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-sm font-medium text-gray-500">Uploaded At</div>
                      <div className="text-sm text-gray-900">{formatDate(document.created_at)}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-sm font-medium text-gray-500">Processing Completed</div>
                      <div className="text-sm text-gray-900">{document.completed_at ? formatDate(document.completed_at) : 'Not completed'}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-sm font-medium text-gray-500">Status</div>
                      <div className="text-sm text-gray-900">{document.status}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-sm font-medium text-gray-500">Vectorized</div>
                      <div className="text-sm text-gray-900">{document.vectorized ? 'Yes' : 'No'}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-sm font-medium text-gray-500">Total Chunks</div>
                      <div className="text-sm text-gray-900">{document.chunk_count}</div>
                    </div>
                    
                    {document.error_message && (
                      <div className="col-span-2 mt-4">
                        <div className="text-sm font-medium text-red-500 mb-1">Error Message</div>
                        <div className="text-sm text-red-800 bg-red-50 p-3 rounded">{document.error_message}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'chunks' && (
            <div>
              <h3 className="text-lg font-medium mb-4">Document Chunks & Embeddings</h3>
              
              {chunks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {document.status === 'completed' ? (
                    <p>No chunks found for this document.</p>
                  ) : (
                    <p>Document processing is not yet complete.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {chunks.map((chunk) => (
                    <div key={chunk.id} className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 flex justify-between items-center">
                        <h4 className="font-medium">Chunk #{chunk.chunk_index + 1}</h4>
                        <span className="text-xs text-gray-500">
                          Created: {formatDate(chunk.created_at)}
                        </span>
                      </div>
                      
                      <div className="p-4">
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Text Content:</h5>
                          <div className="bg-gray-50 p-3 rounded text-sm font-mono whitespace-pre-wrap">
                            {chunk.text}
                          </div>
                        </div>
                        
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Embedding Vector (truncated):</h5>
                          <div className="bg-gray-50 p-3 rounded text-xs font-mono overflow-x-auto">
                            [{chunk.embedding.join(', ')}]
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Dimensions: {Array.isArray(chunk.embedding) ? chunk.embedding.length : 'Unknown'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetail; 