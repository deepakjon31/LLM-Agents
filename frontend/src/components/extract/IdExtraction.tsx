'use client';

import React, { useState } from 'react';
import { FaIdCard, FaFileAlt, FaDownload, FaSpinner, FaCog, FaImage } from 'react-icons/fa';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import TemplateManager from './TemplateManager';

interface Document {
  id: string;
  filename: string;
  created_at: string;
  file_type: string;
  file_size: number;
  total_pages?: number;
  company_id?: string;
}

interface Template {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  extraction_type: 'financial' | 'id' | 'kpi';
  format: 'json' | 'csv' | 'excel';
  content: string;
}

interface ExtractionResult {
  id: string;
  document_id: string;
  extracted_at: string;
  data: any;
  document_type: string;
}

interface IdExtractionProps {
  document: Document;
}

const IdExtraction: React.FC<IdExtractionProps> = ({ document }) => {
  const { data: session } = useSession();
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [documentType, setDocumentType] = useState<'pan' | 'aadhar' | 'passport' | 'driving_license' | 'voter_id' | 'auto'>('auto');
  const [advancedSettings, setAdvancedSettings] = useState({
    enableFaceDetection: true,
    enableSignatureVerification: false,
    confidenceThreshold: 0.8
  });

  // Extract ID document information
  const handleExtract = async () => {
    if (!document) return;
    
    setIsExtracting(true);
    try {
      // In a real app, you'd call your API with the document ID and document type
      // For demo purposes, simulate API call and response
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock extraction results based on document type
      let mockData;
      let mockDocType;
      
      if (documentType === 'pan' || (documentType === 'auto' && document.filename.toLowerCase().includes('pan'))) {
        mockDocType = 'PAN Card';
        mockData = {
          document_type: 'PAN Card',
          pan_number: 'ABCDE1234F',
          name: 'JOHN DOE',
          father_name: 'RICHARD DOE',
          date_of_birth: '01/01/1985',
          issue_date: '15/06/2015',
          has_signature: true,
          has_photo: true
        };
      } else if (documentType === 'aadhar' || (documentType === 'auto' && document.filename.toLowerCase().includes('aadhar'))) {
        mockDocType = 'Aadhar Card';
        mockData = {
          document_type: 'Aadhar Card',
          aadhar_number: '1234 5678 9012',
          name: 'John Doe',
          gender: 'Male',
          date_of_birth: '01/01/1985',
          address: '123 Sample Street, Example City, State - 123456',
          issue_date: '10/12/2018',
          has_signature: true,
          has_photo: true,
          qr_code_detected: true
        };
      } else if (documentType === 'passport' || (documentType === 'auto' && document.filename.toLowerCase().includes('passport'))) {
        mockDocType = 'Passport';
        mockData = {
          document_type: 'Passport',
          passport_number: 'J1234567',
          name: 'JOHN DOE',
          nationality: 'INDIAN',
          date_of_birth: '01 JAN 1985',
          place_of_birth: 'MUMBAI',
          issue_date: '15 JUN 2018',
          expiry_date: '14 JUN 2028',
          has_signature: true,
          has_photo: true,
          mrz_detected: true
        };
      } else {
        // Default to a driving license
        mockDocType = 'Driving License';
        mockData = {
          document_type: 'Driving License',
          license_number: 'DL-1234567890123',
          name: 'JOHN DOE',
          date_of_birth: '01/01/1985',
          address: '123 Sample Street, Example City, State - 123456',
          issue_date: '10/05/2020',
          valid_from: '10/05/2020',
          valid_until: '09/05/2040',
          has_signature: true,
          has_photo: true,
          vehicle_class: ['LMV', 'MCWG']
        };
      }
      
      // Create extraction result
      const mockResult: ExtractionResult = {
        id: `extraction-${Date.now()}`,
        document_id: document.id,
        extracted_at: new Date().toISOString(),
        document_type: mockDocType,
        data: mockData
      };
      
      setExtractionResult(mockResult);
      toast.success(`ID document information extracted successfully`);
    } catch (error) {
      console.error('Error extracting ID document information:', error);
      toast.error('Failed to extract ID document information');
    } finally {
      setIsExtracting(false);
    }
  };

  // Handle template selection
  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setShowTemplates(false);
  };

  // Export extraction results
  const handleExport = () => {
    if (!extractionResult || !selectedTemplate) {
      toast.error('Please extract data and select a template first');
      return;
    }

    try {
      // In a real app, you'd process the data according to the template
      let exportData: string;
      
      if (selectedTemplate.format === 'json') {
        exportData = JSON.stringify(extractionResult.data, null, 2);
      } else if (selectedTemplate.format === 'csv') {
        // Simple CSV conversion for demo
        exportData = Object.entries(extractionResult.data)
          .map(([key, value]) => `${key},${value}`)
          .join('\n');
      } else {
        // For Excel, we'd typically generate a file server-side
        exportData = JSON.stringify(extractionResult.data);
      }
      
      // Create a download link
      const blob = new Blob([exportData], { type: selectedTemplate.format === 'json' ? 'application/json' : 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `id_extraction_${document.filename.split('.')[0]}_${new Date().toISOString().slice(0, 10)}.${selectedTemplate.format}`;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center">
          <FaIdCard className="text-blue-600 mr-2" />
          ID Document Information Extraction
        </h3>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className={`px-4 py-2 rounded-lg border flex items-center ${
              showTemplates 
                ? 'bg-indigo-100 text-indigo-700 border-indigo-300' 
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <FaFileAlt className="mr-2" />
            Templates {selectedTemplate && `(${selectedTemplate.name})`}
          </button>
          
          <button
            onClick={handleExtract}
            disabled={isExtracting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center disabled:opacity-50"
          >
            {isExtracting ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Extracting...
              </>
            ) : (
              <>
                <FaIdCard className="mr-2" />
                Extract Information
              </>
            )}
          </button>
          
          {extractionResult && (
            <button
              onClick={handleExport}
              disabled={!selectedTemplate}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center disabled:opacity-50"
              title={!selectedTemplate ? 'Please select a template first' : undefined}
            >
              <FaDownload className="mr-2" />
              Export
            </button>
          )}
        </div>
      </div>
      
      {/* Document Type Selection */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h4 className="font-medium text-gray-700 mb-2 sm:mb-0">ID Document Type</h4>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setDocumentType('auto')}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                documentType === 'auto' 
                  ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
              }`}
            >
              Auto Detect
            </button>
            <button
              onClick={() => setDocumentType('pan')}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                documentType === 'pan' 
                  ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
              }`}
            >
              PAN Card
            </button>
            <button
              onClick={() => setDocumentType('aadhar')}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                documentType === 'aadhar' 
                  ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
              }`}
            >
              Aadhar Card
            </button>
            <button
              onClick={() => setDocumentType('passport')}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                documentType === 'passport' 
                  ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
              }`}
            >
              Passport
            </button>
            <button
              onClick={() => setDocumentType('driving_license')}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                documentType === 'driving_license' 
                  ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
              }`}
            >
              Driving License
            </button>
            <button
              onClick={() => setDocumentType('voter_id')}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                documentType === 'voter_id' 
                  ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
              }`}
            >
              Voter ID
            </button>
          </div>
        </div>
      </div>
      
      {/* Advanced Settings */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-700 flex items-center">
            <FaCog className="mr-2" />
            Advanced Settings
          </h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center">
            <input
              id="enable-face-detection"
              type="checkbox"
              checked={advancedSettings.enableFaceDetection}
              onChange={(e) => setAdvancedSettings(prev => ({ ...prev, enableFaceDetection: e.target.checked }))}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="enable-face-detection" className="ml-2 block text-sm text-gray-700">
              Enable face detection
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              id="enable-signature-verification"
              type="checkbox"
              checked={advancedSettings.enableSignatureVerification}
              onChange={(e) => setAdvancedSettings(prev => ({ ...prev, enableSignatureVerification: e.target.checked }))}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="enable-signature-verification" className="ml-2 block text-sm text-gray-700">
              Enable signature verification
            </label>
          </div>
          
          <div className="flex flex-col">
            <label htmlFor="confidence-threshold" className="block text-sm text-gray-700 mb-1">
              Confidence Threshold: {advancedSettings.confidenceThreshold}
            </label>
            <input
              id="confidence-threshold"
              type="range"
              min="0.1"
              max="0.9"
              step="0.1"
              value={advancedSettings.confidenceThreshold}
              onChange={(e) => setAdvancedSettings(prev => ({ ...prev, confidenceThreshold: parseFloat(e.target.value) }))}
              className="w-full"
            />
          </div>
        </div>
      </div>
      
      {/* Template Manager */}
      {showTemplates && (
        <div className="mt-4">
          <TemplateManager 
            extractionType="id" 
            onSelectTemplate={handleTemplateSelect} 
          />
        </div>
      )}
      
      {/* Extraction Results */}
      {isExtracting ? (
        <div className="flex flex-col items-center justify-center p-10 border border-gray-200 rounded-lg">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-500">Extracting information from {document.filename}</p>
          <p className="text-gray-400 text-sm mt-2">This may take a few moments...</p>
        </div>
      ) : extractionResult ? (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-700 flex items-center">
              <FaIdCard className="mr-2 text-blue-500" />
              {extractionResult.document_type} Details
            </h3>
            <p className="text-sm text-gray-500">
              Extracted at {new Date(extractionResult.extracted_at).toLocaleString()}
            </p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Extracted Data */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Extracted Information
                </h4>
                
                <div className="space-y-4">
                  {Object.entries(extractionResult.data)
                    .filter(([key]) => !['has_signature', 'has_photo', 'qr_code_detected', 'mrz_detected', 'document_type'].includes(key))
                    .map(([key, value]) => (
                      <div key={key} className="flex flex-col">
                        <span className="text-xs text-gray-500 capitalize">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <span className="text-sm font-medium">
                          {Array.isArray(value) ? value.join(', ') : String(value)}
                        </span>
                      </div>
                    ))
                  }
                </div>
              </div>
              
              {/* Document Details and Image Placeholder */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Document Features
                </h4>
                
                <div className="mb-4 space-y-2">
                  {extractionResult.data.has_photo && (
                    <div className="flex items-center text-green-600">
                      <FaImage className="mr-2" />
                      <span>Photo Detected</span>
                    </div>
                  )}
                  
                  {extractionResult.data.has_signature && (
                    <div className="flex items-center text-green-600">
                      <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5 10a1 1 0 0 1 1-1h8a1 1 0 0 1 0 2H6a1 1 0 0 1-1-1z" />
                      </svg>
                      <span>Signature Detected</span>
                    </div>
                  )}
                  
                  {extractionResult.data.qr_code_detected && (
                    <div className="flex items-center text-green-600">
                      <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h2v1H5zM3 13a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1v-4zm2 2v-1h2v1H5zM11 4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V4zm2 2V5h2v1h-2zM11 13a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4zm2 2v-1h2v1h-2z" clipRule="evenodd" />
                      </svg>
                      <span>QR Code Detected</span>
                    </div>
                  )}
                  
                  {extractionResult.data.mrz_detected && (
                    <div className="flex items-center text-green-600">
                      <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                      </svg>
                      <span>MRZ Code Detected</span>
                    </div>
                  )}
                </div>
                
                {/* Document Image Placeholder */}
                <div className="bg-gray-100 rounded-lg p-4 flex flex-col items-center justify-center h-40">
                  <FaIdCard className="text-gray-400 text-4xl mb-2" />
                  <p className="text-gray-500 text-sm text-center">
                    Document visualization would be displayed here in a real application
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 border border-gray-200 rounded-lg">
          <FaIdCard className="mx-auto text-gray-400 text-4xl mb-3" />
          <p className="text-lg text-gray-500">No extraction results yet</p>
          <p className="text-sm text-gray-400 mt-1">Click the "Extract Information" button to analyze this ID document</p>
        </div>
      )}
    </div>
  );
};

export default IdExtraction; 