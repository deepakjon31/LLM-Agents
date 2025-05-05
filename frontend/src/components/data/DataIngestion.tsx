'use client';

import React, { useState } from 'react';
import { FaFolderOpen, FaDatabase, FaUpload, FaGlobe } from 'react-icons/fa';
import DocumentUpload from '../documents/DocumentUpload';
import DocumentList from '../documents/DocumentList';
import DatabaseConnections from '../database/DatabaseConnections';
import WebDataIngestion from '../web/WebDataIngestion';

interface DataIngestionProps {
  onDocumentUploadSuccess: () => void;
  documentRefreshTrigger: number;
}

type DataTab = 'documents' | 'database' | 'web';

const DataIngestion: React.FC<DataIngestionProps> = ({ 
  onDocumentUploadSuccess, 
  documentRefreshTrigger 
}) => {
  const [activeTab, setActiveTab] = useState<DataTab>('documents');

  return (
    <div className="flex flex-col space-y-4">
      {/* Tab Navigation */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('documents')}
              className={`
                px-4 py-4 text-center w-1/3 font-medium text-sm sm:text-base
                ${activeTab === 'documents'
                  ? 'text-indigo-600 border-b-2 border-indigo-500'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'}
              `}
            >
              <FaFolderOpen className="inline-block mr-2" />
              Documents
            </button>
            <button
              onClick={() => setActiveTab('web')}
              className={`
                px-4 py-4 text-center w-1/3 font-medium text-sm sm:text-base
                ${activeTab === 'web'
                  ? 'text-indigo-600 border-b-2 border-indigo-500'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'}
              `}
            >
              <FaGlobe className="inline-block mr-2" />
              Web Sources
            </button>
            <button
              onClick={() => setActiveTab('database')}
              className={`
                px-4 py-4 text-center w-1/3 font-medium text-sm sm:text-base
                ${activeTab === 'database'
                  ? 'text-indigo-600 border-b-2 border-indigo-500'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'}
              `}
            >
              <FaDatabase className="inline-block mr-2" />
              Database
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        {activeTab === 'documents' && (
          <div className="space-y-6">
            <DocumentUpload onUploadSuccess={onDocumentUploadSuccess} />
            <DocumentList refreshTrigger={documentRefreshTrigger} />
          </div>
        )}
        {activeTab === 'web' && <WebDataIngestion />}
        {activeTab === 'database' && <DatabaseConnections />}
      </div>
    </div>
  );
};

export default DataIngestion; 