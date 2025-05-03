'use client';

import { useState, useEffect } from 'react';
import { FaFileAlt, FaFilePdf, FaFileWord, FaFileExcel, FaFileAlt as FaFileText, FaTrash, FaCheck, FaInfoCircle, FaSpinner } from 'react-icons/fa';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import DocumentDetail from './DocumentDetail';

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

const DocumentList: React.FC<{ refreshTrigger?: number }> = ({ refreshTrigger = 0 }) => {
  const { data: session } = useSession();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  useEffect(() => {
    const fetchDocuments = async () => {
      setIsLoading(true);
      
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/documents/list`, {
          headers: {
            'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
          }
        });
        
        setDocuments(response.data);
      } catch (error) {
        console.error('Error fetching documents:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (session) {
      fetchDocuments();
    }
    
    // Set up polling for documents with pending or processing status
    const intervalId = setInterval(() => {
      if (session && documents.some(doc => doc.status === 'pending' || doc.status === 'processing')) {
        fetchDocuments();
      }
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, [session, refreshTrigger]);
  
  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase().split('/')[1] || fileType.toLowerCase();
    
    if (type.includes('pdf')) {
      return <FaFilePdf className="text-red-500" />;
    } else if (type.includes('word') || type.includes('docx') || type.includes('doc')) {
      return <FaFileWord className="text-blue-500" />;
    } else if (type.includes('excel') || type.includes('xlsx') || type.includes('csv')) {
      return <FaFileExcel className="text-green-500" />;
    } else if (type.includes('text') || type.includes('txt')) {
      return <FaFileText className="text-gray-500" />;
    } else {
      return <FaFileAlt className="text-gray-500" />;
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
            <FaSpinner className="animate-spin mr-1" /> Pending
          </span>
        );
      case 'processing':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            <FaSpinner className="animate-spin mr-1" /> Processing
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            <FaCheck className="mr-1" /> Completed
          </span>
        );
      case 'failed':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            Failed
          </span>
        );
      default:
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            Unknown
          </span>
        );
    }
  };
  
  const handleDeleteClick = (id: string) => {
    setDeleteConfirm(id);
  };
  
  const handleDeleteConfirm = async (id: string) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/documents/${id}`, {
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
        }
      });
      
      // Remove document from state
      setDocuments(documents.filter(doc => doc.id !== id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };
  
  const handleDeleteCancel = () => {
    setDeleteConfirm(null);
  };
  
  const handleViewDetails = (id: string) => {
    setSelectedDocument(id);
    setShowDetailModal(true);
  };
  
  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedDocument(null);
  };
  
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow animate-pulse">
        <div className="h-6 bg-gray-200 rounded mb-4 w-1/4"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="flex items-center">
              <div className="h-10 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Your Documents</h2>
        
        {documents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FaFileAlt className="mx-auto text-gray-400 text-3xl mb-4" />
            <p>No documents uploaded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Upload Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chunks</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center">
                          {getFileIcon(doc.file_type)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                            {doc.filename}
                          </div>
                          <div className="text-sm text-gray-500">
                            {doc.file_type.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatDate(doc.created_at)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatFileSize(doc.file_size)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(doc.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {doc.status === 'completed' ? `${doc.chunk_count} chunks` : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleViewDetails(doc.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <FaInfoCircle />
                        </button>
                        
                        {deleteConfirm === doc.id ? (
                          <>
                            <button
                              onClick={() => handleDeleteConfirm(doc.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Confirm Delete"
                            >
                              <FaCheck />
                            </button>
                            <button
                              onClick={handleDeleteCancel}
                              className="text-gray-600 hover:text-gray-900"
                              title="Cancel"
                            >
                              <FaTrash className="opacity-50" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleDeleteClick(doc.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {showDetailModal && selectedDocument && (
        <DocumentDetail
          documentId={selectedDocument}
          onClose={closeDetailModal}
        />
      )}
    </>
  );
};

export default DocumentList; 