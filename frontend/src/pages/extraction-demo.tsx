import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { FaFilePdf, FaTable, FaIdCard, FaChartLine } from 'react-icons/fa';
import FinancialExtractionEnhanced from '../components/extract/FinancialExtractionEnhanced';

// Mock document data
const mockDocuments = [
  {
    id: '1',
    filename: 'Q4_Financial_Report_2023.pdf',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    file_type: 'application/pdf',
    file_size: 2540000,
    total_pages: 12,
    company_id: '1'
  },
  {
    id: '2',
    filename: 'Annual_Report_2023.pdf',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    file_type: 'application/pdf',
    file_size: 8750000,
    total_pages: 45,
    company_id: '1'
  },
  {
    id: '3',
    filename: 'Investor_Presentation_Q1_2024.pdf',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    file_type: 'application/pdf',
    file_size: 3200000,
    total_pages: 20,
    company_id: '1'
  }
];

// Mock document URLs (in a real app these would point to actual files)
const mockDocumentUrls = {
  '1': 'https://example.com/documents/Q4_Financial_Report_2023.pdf',
  '2': 'https://example.com/documents/Annual_Report_2023.pdf',
  '3': 'https://example.com/documents/Investor_Presentation_Q1_2024.pdf'
};

// Extraction types
type ExtractionType = 'financial' | 'id' | 'kpi';

const ExtractionDemo = () => {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<ExtractionType>('financial');

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-2xl font-bold mb-4">Access Denied</div>
        <p>Please sign in to access this page.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Document Extraction Demo</h1>
      
      {/* Extraction Type Tabs */}
      <div className="flex border-b border-gray-200 mb-8">
        <button
          onClick={() => setActiveTab('financial')}
          className={`flex items-center py-4 px-6 font-medium text-sm ${
            activeTab === 'financial'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FaTable className="mr-2" />
          Financial Tables
        </button>
        <button
          onClick={() => setActiveTab('id')}
          className={`flex items-center py-4 px-6 font-medium text-sm ${
            activeTab === 'id'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FaIdCard className="mr-2" />
          ID Documents
        </button>
        <button
          onClick={() => setActiveTab('kpi')}
          className={`flex items-center py-4 px-6 font-medium text-sm ${
            activeTab === 'kpi'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FaChartLine className="mr-2" />
          KPI Extraction
        </button>
      </div>
      
      {/* Extraction Components */}
      <div className="pb-10">
        {activeTab === 'financial' && (
          <FinancialExtractionEnhanced 
            documents={mockDocuments} 
            documentUrls={mockDocumentUrls}
          />
        )}
        {activeTab === 'id' && (
          <div className="p-10 text-center">
            <div className="text-gray-500">
              <FaIdCard className="text-6xl mx-auto mb-4" />
              <p className="text-xl mb-2">ID Document Extraction</p>
              <p>This feature would be implemented in the same way as Financial Extraction</p>
              <p className="text-sm mt-4">
                Using the MultiDocumentExtractor component with specific ID extraction logic
              </p>
            </div>
          </div>
        )}
        {activeTab === 'kpi' && (
          <div className="p-10 text-center">
            <div className="text-gray-500">
              <FaChartLine className="text-6xl mx-auto mb-4" />
              <p className="text-xl mb-2">KPI Extraction</p>
              <p>This feature would be implemented in the same way as Financial Extraction</p>
              <p className="text-sm mt-4">
                Using the MultiDocumentExtractor component with specific KPI extraction logic
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Features Description */}
      <div className="bg-gray-50 p-6 rounded-lg mt-10">
        <h2 className="text-xl font-bold mb-4">New Features</h2>
        <ul className="list-disc pl-5 space-y-3">
          <li>
            <span className="font-semibold">Multiple Document Processing</span>: 
            Select and process multiple documents in a single batch
          </li>
          <li>
            <span className="font-semibold">Document-specific Settings</span>: 
            Configure extraction parameters for each document individually
          </li>
          <li>
            <span className="font-semibold">Audit Mode</span>: 
            Review extraction results with visual verification against source documents
          </li>
          <li>
            <span className="font-semibold">Annotation & Highlighting</span>: 
            Interactive tools to mark, comment on, and verify extracted data
          </li>
          <li>
            <span className="font-semibold">Extraction Confidence</span>: 
            Visual indication of the AI's confidence in extracted data points
          </li>
          <li>
            <span className="font-semibold">Batch Export</span>: 
            Export all extraction results in your preferred format (JSON, CSV, Excel)
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ExtractionDemo; 