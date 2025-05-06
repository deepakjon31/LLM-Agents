import React, { useState, useEffect } from 'react';
import { FaFileAlt, FaCheck, FaSearch, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface Document {
  id: string;
  filename: string;
  created_at: string;
  file_type: string;
  file_size: number;
  total_pages?: number;
  company_id: string;
}

interface Company {
  id: string;
  name: string;
}

interface CompanyDocumentSelectorProps {
  companyId: string;
  companyName: string;
  onDocumentsSelected: (documents: Document[]) => void;
}

const CompanyDocumentSelector: React.FC<CompanyDocumentSelectorProps> = ({
  companyId,
  companyName,
  onDocumentsSelected
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'filename' | 'created_at' | 'file_size'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [fileTypeFilter, setFileTypeFilter] = useState<string[]>([]);
  const [availableFileTypes, setAvailableFileTypes] = useState<string[]>([]);

  // Fetch documents for the selected company
  useEffect(() => {
    const fetchDocuments = async () => {
      setIsLoading(true);
      try {
        // In a real app, you'd call your API with the company ID
        // For demo purposes, use mock data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockDocuments: Document[] = [
          {
            id: '1',
            filename: 'Q4_Financial_Report_2023.pdf',
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            file_type: 'application/pdf',
            file_size: 2540000,
            total_pages: 12,
            company_id: companyId
          },
          {
            id: '2',
            filename: 'Annual_Report_2023.pdf',
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            file_type: 'application/pdf',
            file_size: 8750000,
            total_pages: 45,
            company_id: companyId
          },
          {
            id: '3',
            filename: 'Income_Statement_Q1_2024.pdf',
            created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            file_type: 'application/pdf',
            file_size: 1240000,
            total_pages: 8,
            company_id: companyId
          },
          {
            id: '4',
            filename: 'Balance_Sheet_2023.xlsx',
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            file_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            file_size: 830000,
            company_id: companyId
          },
          {
            id: '5',
            filename: 'Investor_Presentation_Q1_2024.pptx',
            created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            file_type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            file_size: 3200000,
            total_pages: 20,
            company_id: companyId
          }
        ];
        
        setDocuments(mockDocuments);
        
        // Extract unique file types
        const fileTypes = Array.from(new Set(mockDocuments.map(doc => doc.file_type)));
        setAvailableFileTypes(fileTypes);
      } catch (error) {
        console.error('Error fetching documents:', error);
        toast.error('Failed to fetch documents');
      } finally {
        setIsLoading(false);
      }
    };

    if (companyId) {
      fetchDocuments();
    }
  }, [companyId]);

  // Filter and sort documents
  const filteredAndSortedDocuments = documents
    .filter(doc => 
      (searchTerm === '' || doc.filename.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (fileTypeFilter.length === 0 || fileTypeFilter.includes(doc.file_type))
    )
    .sort((a, b) => {
      if (sortField === 'filename') {
        return sortDirection === 'asc'
          ? a.filename.localeCompare(b.filename)
          : b.filename.localeCompare(a.filename);
      } else if (sortField === 'created_at') {
        return sortDirection === 'asc'
          ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else {
        return sortDirection === 'asc'
          ? a.file_size - b.file_size
          : b.file_size - a.file_size;
      }
    });

  // Toggle document selection
  const toggleDocumentSelection = (document: Document) => {
    setSelectedDocuments(prev => {
      if (prev.some(doc => doc.id === document.id)) {
        return prev.filter(doc => doc.id !== document.id);
      } else {
        return [...prev, document];
      }
    });
  };

  // Toggle sort direction or change sort field
  const handleSort = (field: 'filename' | 'created_at' | 'file_size') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Toggle file type filter
  const toggleFileTypeFilter = (fileType: string) => {
    setFileTypeFilter(prev => {
      if (prev.includes(fileType)) {
        return prev.filter(type => type !== fileType);
      } else {
        return [...prev, fileType];
      }
    });
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  // Get file type display name
  const getFileTypeDisplayName = (fileType: string): string => {
    if (fileType === 'application/pdf') return 'PDF';
    if (fileType.includes('spreadsheet')) return 'Excel';
    if (fileType.includes('presentation')) return 'PowerPoint';
    if (fileType.includes('word')) return 'Word';
    if (fileType.includes('image')) return 'Image';
    return 'Other';
  };

  // Handle proceeding with selected documents
  const handleProceed = () => {
    if (selectedDocuments.length === 0) {
      toast.error('Please select at least one document');
      return;
    }
    
    onDocumentsSelected(selectedDocuments);
  };

  // Render sort icon
  const renderSortIcon = (field: 'filename' | 'created_at' | 'file_size') => {
    if (sortField !== field) {
      return null;
    }
    return sortDirection === 'asc' ? <FaChevronUp className="inline ml-1" /> : <FaChevronDown className="inline ml-1" />;
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-1">{companyName}</h2>
        <p className="text-sm text-gray-500">Select documents to process</p>
      </div>
      
      <div className="flex flex-col md:flex-row md:justify-between mb-6 gap-4">
        <div className="relative flex-grow max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search documents..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setShowFilterOptions(!showFilterOptions)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Filters {showFilterOptions ? <FaChevronUp className="inline ml-1" /> : <FaChevronDown className="inline ml-1" />}
          </button>
          
          <button
            onClick={handleProceed}
            disabled={selectedDocuments.length === 0}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            Process Selected ({selectedDocuments.length})
          </button>
        </div>
      </div>
      
      {/* Filter options */}
      {showFilterOptions && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by File Type</h3>
          <div className="flex flex-wrap gap-2">
            {availableFileTypes.map(fileType => (
              <button
                key={fileType}
                onClick={() => toggleFileTypeFilter(fileType)}
                className={`px-3 py-1 text-xs rounded-full ${
                  fileTypeFilter.includes(fileType)
                    ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300'
                }`}
              >
                {getFileTypeDisplayName(fileType)}
              </button>
            ))}
            {fileTypeFilter.length > 0 && (
              <button
                onClick={() => setFileTypeFilter([])}
                className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
        </div>
      ) : filteredAndSortedDocuments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FaFileAlt className="mx-auto text-gray-400 text-3xl mb-2" />
          <p>No documents found</p>
          {searchTerm || fileTypeFilter.length > 0 ? (
            <p className="text-sm mt-1">Try different search terms or filters</p>
          ) : (
            <p className="text-sm mt-1">Upload documents to get started</p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedDocuments.length === filteredAndSortedDocuments.length && filteredAndSortedDocuments.length > 0}
                      onChange={() => {
                        if (selectedDocuments.length === filteredAndSortedDocuments.length) {
                          setSelectedDocuments([]);
                        } else {
                          setSelectedDocuments([...filteredAndSortedDocuments]);
                        }
                      }}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('filename')}
                >
                  Filename {renderSortIcon('filename')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('file_size')}
                >
                  Size {renderSortIcon('file_size')}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('created_at')}
                >
                  Uploaded {renderSortIcon('created_at')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedDocuments.map((document) => {
                const isSelected = selectedDocuments.some(doc => doc.id === document.id);
                
                return (
                  <tr 
                    key={document.id} 
                    className={`hover:bg-gray-50 ${isSelected ? 'bg-indigo-50' : ''}`}
                    onClick={() => toggleDocumentSelection(document)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleDocumentSelection(document);
                          }}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaFileAlt className="text-indigo-500 mr-2" />
                        <div className="font-medium text-gray-900">{document.filename}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {getFileTypeDisplayName(document.file_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFileSize(document.file_size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(document.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      
      {selectedDocuments.length > 0 && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleProceed}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FaCheck className="inline mr-1" /> Process Selected ({selectedDocuments.length})
          </button>
        </div>
      )}
    </div>
  );
};

export default CompanyDocumentSelector; 