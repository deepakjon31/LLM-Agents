'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import CompanyManager from '../components/extract/CompanyManager';
import CompanyDocumentSelector from '../components/extract/CompanyDocumentSelector';
import FinancialExtractionEnhanced from '../components/extract/FinancialExtractionEnhanced';

// Define interfaces
interface Company {
  id: string;
  name: string;
  created_at: string;
  document_count: number;
  description?: string;
}

interface Document {
  id: string;
  filename: string;
  created_at: string;
  file_type: string;
  file_size: number;
  total_pages?: number;
  company_id: string;
}

const Dashboard = () => {
  const { data: session, status } = useSession();
  const [tab, setTab] = useState<'extract' | 'chat' | 'history' | 'data-ingestion'>('extract');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([]);

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Please sign in to access the dashboard</h1>
        <a href="/login" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Sign In</a>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-xl font-bold text-gray-900">Document Processing Dashboard</h1>
            <div className="flex items-center">
              {session?.user?.name && (
                <span className="text-sm text-gray-500 mr-4">
                  Welcome, {session.user.name}
                </span>
              )}
              <a
                href="/api/auth/signout"
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Sign Out
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex -mb-px">
            <button
              onClick={() => setTab('extract')}
              className={`py-4 px-6 font-medium text-sm border-b-2 focus:outline-none ${tab === 'extract'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Document Extraction
            </button>
            <button
              onClick={() => setTab('chat')}
              className={`py-4 px-6 font-medium text-sm border-b-2 focus:outline-none ${tab === 'chat'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Chat
            </button>
            <button
              onClick={() => setTab('history')}
              className={`py-4 px-6 font-medium text-sm border-b-2 focus:outline-none ${tab === 'history'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              History
            </button>
            <button
              onClick={() => setTab('data-ingestion')}
              className={`py-4 px-6 font-medium text-sm border-b-2 focus:outline-none ${tab === 'data-ingestion'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Data Ingestion
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Extract Tab */}
          {tab === 'extract' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-6">Document Extraction</h2>
                
                {/* Extraction workflow steps */}
                <div className="mb-6">
                  <div className="relative">
                    <div className="flex items-center mb-6">
                      <div 
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          !selectedCompany ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'
                        } mr-3`}
                      >
                        1
                      </div>
                      <h3 className="text-lg font-medium">Select Company</h3>
                    </div>
                    
                    {!selectedCompany && (
                      <CompanyManager 
                        onSelectCompany={(company) => {
                          setSelectedCompany(company);
                          setSelectedDocuments([]);
                        }}
                        onCreateCompany={(company) => {
                          setSelectedCompany(company);
                          setSelectedDocuments([]);
                          toast.success(`Company "${company.name}" created and selected`);
                        }}
                      />
                    )}
                  </div>
                  
                  {selectedCompany && (
                    <>
                      <div className="flex items-center mb-6 mt-10">
                        <div 
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            selectedCompany && !selectedDocuments.length ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'
                          } mr-3`}
                        >
                          2
                        </div>
                        <h3 className="text-lg font-medium">Select Documents</h3>
                        
                        {selectedCompany && !selectedDocuments.length && (
                          <button
                            onClick={() => setSelectedCompany(null)}
                            className="ml-auto text-sm text-indigo-600 hover:text-indigo-800"
                          >
                            Change Company
                          </button>
                        )}
                      </div>
                      
                      {selectedCompany && !selectedDocuments.length && (
                        <CompanyDocumentSelector
                          companyId={selectedCompany.id}
                          companyName={selectedCompany.name}
                          onDocumentsSelected={(docs) => {
                            setSelectedDocuments(docs);
                            toast.success(`${docs.length} documents selected for processing`);
                          }}
                        />
                      )}
                    </>
                  )}
                  
                  {selectedDocuments.length > 0 && (
                    <>
                      <div className="flex items-center mb-6 mt-10">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center mr-3">
                          3
                        </div>
                        <h3 className="text-lg font-medium">Process Documents</h3>
                        
                        <div className="ml-auto flex space-x-2">
                          <button
                            onClick={() => setSelectedDocuments([])}
                            className="text-sm text-indigo-600 hover:text-indigo-800"
                          >
                            Change Documents
                          </button>
                          <button
                            onClick={() => {
                              setSelectedCompany(null);
                              setSelectedDocuments([]);
                            }}
                            className="text-sm text-gray-500 hover:text-gray-700"
                          >
                            Start Over
                          </button>
                        </div>
                      </div>
                      
                      <FinancialExtractionEnhanced 
                        documents={selectedDocuments}
                        documentUrls={selectedDocuments.reduce((acc, doc) => {
                          // In a real app these would be actual document URLs
                          acc[doc.id] = `https://example.com/documents/${doc.id}`;
                          return acc;
                        }, {} as Record<string, string>)}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Chat Tab Placeholder */}
          {tab === 'chat' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Chat Interface</h2>
              <p className="text-gray-500">Chat functionality would be implemented here.</p>
            </div>
          )}

          {/* History Tab Placeholder */}
          {tab === 'history' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Extraction History</h2>
              <p className="text-gray-500">History of past extractions would be shown here.</p>
            </div>
          )}

          {/* Data Ingestion Tab Placeholder */}
          {tab === 'data-ingestion' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Data Ingestion</h2>
              <p className="text-gray-500">Data ingestion functionality would be implemented here.</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Document Processing System
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard; 