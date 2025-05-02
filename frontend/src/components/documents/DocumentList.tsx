'use client';

import { useState, useEffect } from 'react';
import { FaFileAlt, FaFilePdf, FaFileWord, FaFileExcel, FaFileAlt as FaFileText, FaTrash, FaCheck } from 'react-icons/fa';
import axios from 'axios';

type Document = {
  id: string;
  filename: string;
  fileType: string;
  uploadDate: string;
  size: string;
  status: 'processing' | 'completed';
};

const DocumentList: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchDocuments = async () => {
      setIsLoading(true);
      
      try {
        // In a real app, this would fetch from the API
        // const response = await axios.get('/api/documents');
        // setDocuments(response.data);
        
        // Mock data for demo
        const mockDocuments: Document[] = [
          {
            id: '1',
            filename: 'Annual_Report_2023.pdf',
            fileType: 'pdf',
            uploadDate: '2023-11-15',
            size: '3.2 MB',
            status: 'completed',
          },
          {
            id: '2',
            filename: 'Product_Specs.docx',
            fileType: 'docx',
            uploadDate: '2023-12-03',
            size: '1.5 MB',
            status: 'completed',
          },
          {
            id: '3',
            filename: 'Sales_Data_Q4.xlsx',
            fileType: 'xlsx',
            uploadDate: '2023-12-20',
            size: '4.7 MB',
            status: 'completed',
          },
          {
            id: '4',
            filename: 'Meeting_Notes.txt',
            fileType: 'txt',
            uploadDate: '2024-01-05',
            size: '0.1 MB',
            status: 'completed',
          },
          {
            id: '5',
            filename: 'Customer_Survey_Results.csv',
            fileType: 'csv',
            uploadDate: '2024-01-10',
            size: '2.3 MB',
            status: 'processing',
          },
        ];
        
        setDocuments(mockDocuments);
      } catch (error) {
        console.error('Error fetching documents:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDocuments();
  }, []);
  
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return <FaFilePdf className="text-red-500" />;
      case 'docx':
        return <FaFileWord className="text-blue-500" />;
      case 'xlsx':
      case 'csv':
        return <FaFileExcel className="text-green-500" />;
      case 'txt':
        return <FaFileText className="text-gray-500" />;
      default:
        return <FaFileAlt className="text-gray-500" />;
    }
  };
  
  const handleDeleteClick = (id: string) => {
    setDeleteConfirm(id);
  };
  
  const handleDeleteConfirm = async (id: string) => {
    try {
      // In a real app, this would be an API call
      // await axios.delete(`/api/documents/${id}`);
      
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
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center">
                        {getFileIcon(doc.fileType)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                          {doc.filename}
                        </div>
                        <div className="text-sm text-gray-500">
                          {doc.fileType.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{doc.uploadDate}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{doc.size}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {doc.status === 'processing' ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Processing
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Ready
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {deleteConfirm === doc.id ? (
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleDeleteConfirm(doc.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FaCheck />
                        </button>
                        <button
                          onClick={handleDeleteCancel}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <FaTrash className="opacity-50" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDeleteClick(doc.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DocumentList; 