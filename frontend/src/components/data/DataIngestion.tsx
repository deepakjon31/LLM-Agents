'use client';

import React, { useState } from 'react';
import { FaFolderOpen, FaDatabase, FaUpload, FaGlobe, FaCloudUploadAlt } from 'react-icons/fa';
import DocumentUpload from '../documents/DocumentUpload';
import DocumentList from '../documents/DocumentList';
import DatabaseConnections from '../database/DatabaseConnections';
import WebDataIngestion from '../web/WebDataIngestion';
import DriveDataIngestion from '../drive/DriveDataIngestion';

interface DataIngestionProps {
  onDocumentUploadSuccess: () => void;
  documentRefreshTrigger: number;
}

type DataTab = 'documents' | 'database' | 'web' | 'drive';

const DataIngestion: React.FC<DataIngestionProps> = ({ 
  onDocumentUploadSuccess, 
  documentRefreshTrigger 
}) => {
  const [activeTab, setActiveTab] = useState<DataTab>('documents');

  return (
    <div className="flex flex-col">
      {/* Tab Navigation */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('documents')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'documents'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
              aria-current={activeTab === 'documents' ? 'page' : undefined}
            >
              <FaFolderOpen className="inline-block mr-2" />
              Files
            </button>
            <button
              onClick={() => setActiveTab('web')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'web'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
              aria-current={activeTab === 'web' ? 'page' : undefined}
            >
              <FaGlobe className="inline-block mr-2" />
              Web
            </button>
            <button
              onClick={() => setActiveTab('drive')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'drive'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
              aria-current={activeTab === 'drive' ? 'page' : undefined}
            >
              <FaCloudUploadAlt className="inline-block mr-2" />
              Cloud
            </button>
            <button
              onClick={() => setActiveTab('database')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'database'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
              aria-current={activeTab === 'database' ? 'page' : undefined}
            >
              <FaDatabase className="inline-block mr-2" />
              Database
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6 bg-white shadow rounded-lg mt-4">
        {activeTab === 'documents' && (
          <div className="space-y-6">
            <DocumentUpload onUploadSuccess={onDocumentUploadSuccess} />
            <DocumentList refreshTrigger={documentRefreshTrigger} />
          </div>
        )}
        {activeTab === 'web' && <WebDataIngestion />}
        {activeTab === 'drive' && <DriveDataIngestion />}
        {activeTab === 'database' && <DatabaseConnections />}
      </div>
    </div>
  );
};

export default DataIngestion; 