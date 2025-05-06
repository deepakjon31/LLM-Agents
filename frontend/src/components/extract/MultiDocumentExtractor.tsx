import React, { useState, useEffect } from 'react';
import { FaFileAlt, FaTrash, FaEye, FaDownload, FaSpinner, FaCog, FaCheck } from 'react-icons/fa';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import TemplateManager from './TemplateManager';

export type ExtractionType = 'financial' | 'id' | 'kpi';

interface Document {
  id: string;
  filename: string;
  created_at: string;
  file_type: string;
  file_size: number;
  total_pages?: number;
  company_id?: string;
  selected?: boolean;
}

interface Template {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  extraction_type: ExtractionType;
  format: 'json' | 'csv' | 'excel';
  content: string;
}

interface ExtractionResult {
  id: string;
  document_id: string;
  extracted_at: string;
  data: any;
  page_number?: number;
  document_type?: string;
}

interface MultiDocumentExtractorProps {
  documents: Document[];
  extractionType: ExtractionType;
  renderExtractorSettings?: (props: {
    document: Document;
    onChange: (settings: any) => void;
  }) => React.ReactNode;
  extractDocumentData: (document: Document, settings: any) => Promise<ExtractionResult>;
  renderExtractionResults: (result: ExtractionResult, isAuditMode: boolean) => React.ReactNode;
}

const MultiDocumentExtractor: React.FC<MultiDocumentExtractorProps> = ({
  documents,
  extractionType,
  renderExtractorSettings,
  extractDocumentData,
  renderExtractionResults,
}) => {
  const { data: session } = useSession();
  const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([]);
  const [extractionQueue, setExtractionQueue] = useState<Document[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [currentExtraction, setCurrentExtraction] = useState<Document | null>(null);
  const [extractionResults, setExtractionResults] = useState<Map<string, ExtractionResult>>(new Map());
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [extractorSettings, setExtractorSettings] = useState<Record<string, any>>({});
  const [auditMode, setAuditMode] = useState(false);
  const [currentAuditDocument, setCurrentAuditDocument] = useState<string | null>(null);

  // Initialize with all documents
  useEffect(() => {
    setSelectedDocuments(documents);
  }, [documents]);

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

  // Update extractor settings
  const updateSettings = (documentId: string, settings: any) => {
    setExtractorSettings(prev => ({
      ...prev,
      [documentId]: settings
    }));
  };

  // Start extraction process
  const handleExtract = () => {
    if (selectedDocuments.length === 0) {
      toast.error('Please select at least one document to extract');
      return;
    }

    setExtractionQueue([...selectedDocuments]);
    setIsExtracting(true);
    processExtractionQueue();
  };

  // Process the extraction queue one by one
  const processExtractionQueue = async () => {
    if (extractionQueue.length === 0) {
      setIsExtracting(false);
      setCurrentExtraction(null);
      toast.success('All documents processed successfully');
      return;
    }

    const nextDocument = extractionQueue[0];
    setCurrentExtraction(nextDocument);
    
    try {
      const settings = extractorSettings[nextDocument.id] || {};
      const result = await extractDocumentData(nextDocument, settings);
      
      setExtractionResults(prev => {
        const newMap = new Map(prev);
        newMap.set(nextDocument.id, result);
        return newMap;
      });
      
      toast.success(`Extracted data from ${nextDocument.filename}`);
    } catch (error) {
      console.error(`Error extracting data from ${nextDocument.filename}:`, error);
      toast.error(`Failed to extract data from ${nextDocument.filename}`);
    } finally {
      setExtractionQueue(prev => prev.slice(1));
      setTimeout(processExtractionQueue, 100); // Continue with next document
    }
  };

  // Handle template selection
  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setShowTemplates(false);
  };

  // Export all extraction results
  const handleExportAll = () => {
    if (extractionResults.size === 0 || !selectedTemplate) {
      toast.error('Please extract data and select a template first');
      return;
    }

    try {
      // For simplicity, we'll just export all results as a single JSON file
      const allResults = Array.from(extractionResults.values());
      
      let exportData: string;
      if (selectedTemplate.format === 'json') {
        exportData = JSON.stringify(allResults, null, 2);
      } else if (selectedTemplate.format === 'csv') {
        // Simple CSV conversion - would need more sophisticated logic for real use
        const headers = Object.keys(allResults[0].data).join(',');
        const rows = allResults.map(result => 
          Object.values(result.data).join(',')
        ).join('\n');
        exportData = headers + '\n' + rows;
      } else {
        // Excel would normally be handled server-side
        exportData = JSON.stringify(allResults);
      }
      
      const blob = new Blob([exportData], { 
        type: selectedTemplate.format === 'json' ? 'application/json' : 'text/csv' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `extraction_results_${new Date().toISOString().slice(0, 10)}.${selectedTemplate.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('All results exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  // Toggle audit mode for a specific document
  const toggleAuditMode = (documentId: string | null) => {
    setAuditMode(documentId !== null);
    setCurrentAuditDocument(documentId);
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          {extractionType === 'financial' && 'Financial Table Extraction'}
          {extractionType === 'id' && 'ID Document Information Extraction'}
          {extractionType === 'kpi' && 'KPI Extraction'}
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
            disabled={isExtracting || selectedDocuments.length === 0}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center disabled:opacity-50"
          >
            {isExtracting ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Extracting...
              </>
            ) : (
              <>
                <FaFileAlt className="mr-2" />
                Extract Selected ({selectedDocuments.length})
              </>
            )}
          </button>
          
          <button
            onClick={handleExportAll}
            disabled={extractionResults.size === 0 || !selectedTemplate}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center disabled:opacity-50"
          >
            <FaDownload className="mr-2" />
            Export All
          </button>
        </div>
      </div>
      
      {/* Document Selection */}
      {!auditMode && (
        <div className="bg-white shadow rounded-lg p-4">
          <h4 className="font-medium text-gray-700 mb-4">Select Documents to Process</h4>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Select
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.map((document) => {
                  const isSelected = selectedDocuments.some(doc => doc.id === document.id);
                  const hasResult = extractionResults.has(document.id);
                  
                  return (
                    <tr key={document.id} className={isSelected ? 'bg-indigo-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleDocumentSelection(document)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FaFileAlt className="text-gray-500 mr-2" />
                          <div className="text-sm font-medium text-gray-900">{document.filename}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(document.file_size / 1024).toFixed(1)} KB
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(document.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {currentExtraction?.id === document.id ? (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Extracting...
                          </span>
                        ) : hasResult ? (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Extracted
                          </span>
                        ) : (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {hasResult && (
                          <button
                            onClick={() => toggleAuditMode(document.id)}
                            className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-md transition mr-2"
                            title="Audit Extraction Results"
                          >
                            <FaEye className="inline mr-1" /> Audit
                          </button>
                        )}
                        {renderExtractorSettings && isSelected && (
                          <button
                            onClick={() => {
                              const el = document.getElementById(`settings-${document.id}`);
                              if (el) {
                                el.scrollIntoView({ behavior: 'smooth' });
                              }
                            }}
                            className="text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-3 py-1 rounded-md transition"
                          >
                            <FaCog className="inline mr-1" /> Settings
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Template Manager */}
      {showTemplates && (
        <div className="mt-4">
          <TemplateManager 
            extractionType={extractionType} 
            onSelectTemplate={handleTemplateSelect} 
          />
        </div>
      )}
      
      {/* Extraction Settings for Selected Documents */}
      {!auditMode && renderExtractorSettings && selectedDocuments.length > 0 && (
        <div className="bg-white shadow rounded-lg p-4">
          <h4 className="font-medium text-gray-700 mb-4">Extraction Settings</h4>
          
          <div className="space-y-6">
            {selectedDocuments.map(document => (
              <div key={document.id} id={`settings-${document.id}`} className="p-4 border border-gray-200 rounded-lg">
                <h5 className="font-medium text-gray-700 mb-2">{document.filename}</h5>
                {renderExtractorSettings({
                  document,
                  onChange: (settings) => updateSettings(document.id, settings)
                })}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Audit Mode View */}
      {auditMode && currentAuditDocument && extractionResults.has(currentAuditDocument) && (
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium text-gray-700 flex items-center">
              <FaEye className="mr-2" />
              Auditing Results for {documents.find(d => d.id === currentAuditDocument)?.filename}
            </h4>
            
            <button
              onClick={() => toggleAuditMode(null)}
              className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Back to Document List
            </button>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Original Document View (Placeholder) */}
            <div className="lg:w-1/2 border border-gray-200 rounded-lg p-4">
              <h5 className="font-medium text-gray-700 mb-2">Original Document</h5>
              <div className="bg-gray-100 p-4 rounded-lg h-96 overflow-y-auto">
                <p className="text-gray-500 text-center mt-20">
                  Document viewer would be integrated here with highlight capabilities to match extraction results
                </p>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                <p className="mb-2">* In a real implementation, this would show:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>The original document (PDF/image)</li>
                  <li>Highlighted areas where data was extracted from</li>
                  <li>Interactive tools to select and annotate document regions</li>
                </ul>
              </div>
            </div>
            
            {/* Extraction Results View */}
            <div className="lg:w-1/2 border border-gray-200 rounded-lg p-4">
              <h5 className="font-medium text-gray-700 mb-2">Extracted Data</h5>
              <div className="bg-white p-4 rounded-lg h-96 overflow-y-auto">
                {renderExtractionResults(
                  extractionResults.get(currentAuditDocument)!,
                  true
                )}
              </div>
              <div className="mt-4 flex space-x-2">
                <button className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                  <FaCheck className="inline mr-1" /> Approve
                </button>
                <button className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
                  Flag for Review
                </button>
                <button className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Edit Extraction
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Extraction Results (when not in audit mode) */}
      {!auditMode && extractionResults.size > 0 && (
        <div className="bg-white shadow rounded-lg p-4">
          <h4 className="font-medium text-gray-700 mb-4">Extraction Results</h4>
          
          <div className="space-y-6">
            {Array.from(extractionResults.entries()).map(([docId, result]) => {
              const document = documents.find(d => d.id === docId);
              
              return (
                <div key={docId} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                    <div>
                      <h5 className="font-medium text-gray-700">{document?.filename}</h5>
                      <p className="text-xs text-gray-500">
                        Extracted at {new Date(result.extracted_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="space-x-2">
                      <button
                        onClick={() => toggleAuditMode(docId)}
                        className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-md transition"
                      >
                        <FaEye className="inline mr-1" /> Audit
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    {renderExtractionResults(result, false)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiDocumentExtractor; 