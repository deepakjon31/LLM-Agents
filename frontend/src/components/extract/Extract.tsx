'use client';

import React, { useState, useEffect } from 'react';
import { FaTable, FaIdCard, FaChartLine, FaFileAlt, FaFilePdf, FaImage, FaFolderOpen, FaBuilding, FaPlus, FaUpload } from 'react-icons/fa';
import FinancialExtraction from './FinancialExtraction';
import IdExtraction from './IdExtraction';
import KpiExtraction from './KpiExtraction';
import CompanyManager from './CompanyManager';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

type ExtractTab = 'financial' | 'id' | 'kpi';
type ExtractionStep = 'company' | 'document' | 'extraction';

interface Company {
  id: string;
  name: string;
  created_at: string;
  document_count: number;
}

interface Document {
  id: string;
  filename: string;
  created_at: string;
  file_type: string;
  file_size: number;
  total_pages?: number;
  company_id?: string;
}

const Extract: React.FC = () => {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<ExtractTab>('financial');
  const [currentStep, setCurrentStep] = useState<ExtractionStep>('company');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch companies on component mount
  useEffect(() => {
    const fetchCompanies = async () => {
      setIsLoading(true);
      try {
        // In a real app you'd call your API
        // For demo purposes, use mock data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setCompanies([
          {
            id: '1',
            name: 'Acme Corporation',
            created_at: new Date().toISOString(),
            document_count: 5
          },
          {
            id: '2',
            name: 'TechGlobal Inc.',
            created_at: new Date().toISOString(),
            document_count: 3
          },
          {
            id: '3',
            name: 'Finance Partners LLC',
            created_at: new Date().toISOString(),
            document_count: 8
          }
        ]);
      } catch (error) {
        console.error('Error fetching companies:', error);
        toast.error('Failed to fetch companies');
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchCompanies();
    }
  }, [session]);

  // Fetch documents for selected company
  useEffect(() => {
    const fetchCompanyDocuments = async () => {
      if (!selectedCompany) return;
      
      setIsLoading(true);
      try {
        // In a real app, you'd call your API with the company ID
        // For demo purposes, use mock data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const companyDocs = [
          {
            id: `${selectedCompany.id}-1`,
            filename: 'annual_report_2023.pdf',
            created_at: new Date().toISOString(),
            file_type: 'pdf',
            file_size: 1024 * 1024 * 3.5,
            total_pages: 24,
            company_id: selectedCompany.id
          },
          {
            id: `${selectedCompany.id}-2`,
            filename: 'financial_statements_q2.pdf',
            created_at: new Date().toISOString(),
            file_type: 'pdf',
            file_size: 1024 * 1024 * 2.1,
            total_pages: 15,
            company_id: selectedCompany.id
          },
          {
            id: `${selectedCompany.id}-3`,
            filename: 'employee_id_cards.jpg',
            created_at: new Date().toISOString(),
            file_type: 'image',
            file_size: 1024 * 1024 * 0.8,
            total_pages: 1,
            company_id: selectedCompany.id
          }
        ];
        
        setDocuments(companyDocs);
      } catch (error) {
        console.error('Error fetching company documents:', error);
        toast.error('Failed to fetch company documents');
      } finally {
        setIsLoading(false);
      }
    };

    if (selectedCompany) {
      fetchCompanyDocuments();
    }
  }, [selectedCompany]);

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    else return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  // Handle company creation
  const handleCreateCompany = async () => {
    if (!newCompanyName.trim()) {
      toast.error('Please enter a company name');
      return;
    }

    setIsCreatingCompany(true);
    try {
      // In a real app, you'd call your API to create a company
      // For demo, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newCompany: Company = {
        id: `company-${Date.now()}`,
        name: newCompanyName,
        created_at: new Date().toISOString(),
        document_count: 0
      };
      
      setCompanies(prev => [newCompany, ...prev]);
      setSelectedCompany(newCompany);
      setCurrentStep('document');
      setNewCompanyName('');
      toast.success(`Company "${newCompanyName}" created successfully`);
    } catch (error) {
      console.error('Error creating company:', error);
      toast.error('Failed to create company');
    } finally {
      setIsCreatingCompany(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async () => {
    if (!uploadFiles || uploadFiles.length === 0 || !selectedCompany) {
      toast.error('Please select files to upload');
      return;
    }

    setIsUploading(true);
    try {
      // In a real app, you'd call your API to upload files
      // For demo, simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create new document entries
      const newDocs: Document[] = Array.from(uploadFiles).map((file, index) => ({
        id: `doc-${Date.now()}-${index}`,
        filename: file.name,
        created_at: new Date().toISOString(),
        file_type: file.type.includes('pdf') ? 'pdf' : 'image',
        file_size: file.size,
        total_pages: file.type.includes('pdf') ? Math.floor(Math.random() * 20) + 1 : 1,
        company_id: selectedCompany.id
      }));
      
      setDocuments(prev => [...newDocs, ...prev]);
      
      // Update company document count
      setCompanies(prev => 
        prev.map(company => 
          company.id === selectedCompany.id 
            ? {...company, document_count: company.document_count + newDocs.length}
            : company
        )
      );
      
      setShowUploadModal(false);
      setUploadFiles(null);
      toast.success(`${uploadFiles.length} file(s) uploaded successfully`);
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload files');
    } finally {
      setIsUploading(false);
    }
  };

  // Reset selected document
  const handleBackToDocuments = () => {
    setSelectedDocument(null);
    setCurrentStep('document');
  };

  // Reset selected company
  const handleBackToCompanies = () => {
    setSelectedCompany(null);
    setCurrentStep('company');
  };

  // Render navigation breadcrumbs
  const renderBreadcrumbs = () => {
    return (
      <div className="flex items-center text-sm text-gray-500 mb-4">
        <button 
          onClick={() => setCurrentStep('company')}
          className={`hover:text-indigo-600 ${currentStep === 'company' ? 'font-medium text-indigo-600' : ''}`}
        >
          Companies
        </button>
        
        {selectedCompany && (
          <>
            <span className="mx-2">/</span>
            <button 
              onClick={() => currentStep === 'extraction' ? setCurrentStep('document') : null}
              className={`hover:text-indigo-600 ${currentStep === 'document' ? 'font-medium text-indigo-600' : ''}`}
            >
              {selectedCompany.name}
            </button>
          </>
        )}
        
        {selectedDocument && (
          <>
            <span className="mx-2">/</span>
            <span className={`${currentStep === 'extraction' ? 'font-medium text-indigo-600' : ''}`}>
              {selectedDocument.filename}
            </span>
          </>
        )}
      </div>
    );
  };

  // Render file upload modal
  const renderUploadModal = () => {
    return (
      <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity ${showUploadModal ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h3 className="text-lg font-semibold mb-4">Upload Documents</h3>
          
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2">Uploading to: <span className="font-medium">{selectedCompany?.name}</span></p>
            
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FaUpload className="w-8 h-8 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">PDF, JPG, PNG (MAX. 20MB)</p>
              </div>
              <input 
                type="file" 
                className="hidden" 
                accept=".pdf,.jpg,.jpeg,.png" 
                multiple
                onChange={(e) => setUploadFiles(e.target.files)}
              />
            </label>
            
            {uploadFiles && uploadFiles.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium">{uploadFiles.length} file(s) selected</p>
                <ul className="text-xs text-gray-500 mt-1">
                  {Array.from(uploadFiles).slice(0, 3).map((file, index) => (
                    <li key={index}>{file.name}</li>
                  ))}
                  {uploadFiles.length > 3 && <li>...and {uploadFiles.length - 3} more</li>}
                </ul>
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setShowUploadModal(false)}
              className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleFileUpload}
              disabled={!uploadFiles || uploadFiles.length === 0 || isUploading}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 flex items-center"
            >
              {isUploading ? (
                <>
                  <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></span>
                  Uploading...
                </>
              ) : (
                'Upload'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col">
      {renderBreadcrumbs()}
      
      {currentStep === 'company' && (
        // Company Selection Step
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Select or Create Company</h2>
            
            <div className="flex space-x-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="New company name"
                  className="px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-indigo-500 focus:border-indigo-500"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                />
                <button
                  onClick={handleCreateCompany}
                  disabled={!newCompanyName.trim() || isCreatingCompany}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-r-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center"
                >
                  {isCreatingCompany ? (
                    <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></span>
                  ) : (
                    <FaPlus className="mr-1" />
                  )}
                  Create
                </button>
              </div>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FaBuilding className="mx-auto text-gray-400 text-3xl mb-2" />
              <p>No companies found</p>
              <p className="text-sm mt-1">Create a company to get started with document extraction</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {companies.map((company) => (
                <div
                  key={company.id}
                  onClick={() => {
                    setSelectedCompany(company);
                    setCurrentStep('document');
                  }}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-indigo-300 cursor-pointer transition"
                >
                  <div className="flex items-center mb-2">
                    <FaBuilding className="text-indigo-500 mr-2" />
                    <h3 className="font-medium">{company.name}</h3>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Documents: {company.document_count}</span>
                    <span>Created: {new Date(company.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {currentStep === 'document' && selectedCompany && (
        // Document Selection Step
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              Company: <span className="text-indigo-600">{selectedCompany.name}</span>
            </h2>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center"
              >
                <FaUpload className="mr-2" />
                Upload Documents
              </button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FaFolderOpen className="mx-auto text-gray-400 text-3xl mb-2" />
              <p>No documents found</p>
              <p className="text-sm mt-1">Upload documents to begin extraction</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pages
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Uploaded On
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Extraction
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center">
                          {doc.file_type === 'pdf' ? (
                            <FaFilePdf className="text-red-500 mr-2" />
                          ) : (
                            <FaImage className="text-blue-500 mr-2" />
                          )}
                          {doc.filename}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 uppercase">
                        {doc.file_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatFileSize(doc.file_size)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {doc.total_pages || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => {
                              setSelectedDocument(doc);
                              setActiveTab('financial');
                              setCurrentStep('extraction');
                            }}
                            className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                            title="Extract Financial Tables"
                          >
                            <FaTable />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDocument(doc);
                              setActiveTab('id');
                              setCurrentStep('extraction');
                            }}
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                            title="Extract ID Information"
                          >
                            <FaIdCard />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDocument(doc);
                              setActiveTab('kpi');
                              setCurrentStep('extraction');
                            }}
                            className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200"
                            title="Extract KPIs"
                          >
                            <FaChartLine />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      {currentStep === 'extraction' && selectedDocument && (
        // Extraction Tabs and Content
        <>
          <div className="bg-white shadow rounded-lg mb-4 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={handleBackToDocuments}
                  className="mr-4 text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
                >
                  ← Back to Documents
                </button>
                <h2 className="text-lg font-semibold">
                  Extracting from: <span className="text-indigo-600">{selectedDocument.filename}</span>
                </h2>
              </div>
              {selectedDocument.total_pages && selectedDocument.total_pages > 1 && (
                <span className="text-sm text-gray-500">
                  {selectedDocument.total_pages} pages
                </span>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('financial')}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === 'financial'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                  `}
                  aria-current={activeTab === 'financial' ? 'page' : undefined}
                >
                  <FaTable className="inline-block mr-2" />
                  Financial Tables
                </button>
                <button
                  onClick={() => setActiveTab('id')}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === 'id'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                  `}
                  aria-current={activeTab === 'id' ? 'page' : undefined}
                >
                  <FaIdCard className="inline-block mr-2" />
                  ID Documents
                </button>
                <button
                  onClick={() => setActiveTab('kpi')}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === 'kpi'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                  `}
                  aria-current={activeTab === 'kpi' ? 'page' : undefined}
                >
                  <FaChartLine className="inline-block mr-2" />
                  KPI Extraction
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6 bg-white shadow rounded-lg mt-4">
            {activeTab === 'financial' && <FinancialExtraction document={selectedDocument} />}
            {activeTab === 'id' && <IdExtraction document={selectedDocument} />}
            {activeTab === 'kpi' && <KpiExtraction document={selectedDocument} />}
          </div>
        </>
      )}
      
      {renderUploadModal()}
    </div>
  );
};

export default Extract; 