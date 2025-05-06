import React, { useState } from 'react';
import { FaTable, FaCog } from 'react-icons/fa';
import { useSession } from 'next-auth/react';
import MultiDocumentExtractor, { ExtractionType } from './MultiDocumentExtractor';
import DocumentViewer from './DocumentViewer';

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
}

interface FinancialExtractionEnhancedProps {
  documents: Document[];
  documentUrls: Record<string, string>; // Map of document IDs to their viewable URLs
}

const FinancialExtractionEnhanced: React.FC<FinancialExtractionEnhancedProps> = ({ 
  documents,
  documentUrls
}) => {
  const { data: session } = useSession();
  const [extractorSettings, setExtractorSettings] = useState<Record<string, any>>({});

  // Function to extract financial data from a document
  const extractFinancialData = async (document: Document, settings: any): Promise<ExtractionResult> => {
    // In a real implementation, this would call your API
    // For this example, we'll simulate the API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock extraction result similar to the original component
    const mockResult: ExtractionResult = {
      id: `extraction-${Date.now()}`,
      document_id: document.id,
      extracted_at: new Date().toISOString(),
      page_number: settings.selectedPage || 1,
      data: {
        tables: [
          {
            title: "Balance Sheet",
            columns: ["Line Item", "2023", "2022"],
            rows: [
              ["Assets", "", ""],
              ["Cash and Cash Equivalents", "$10,547,000", "$8,259,000"],
              ["Short-term Investments", "$12,356,000", "$11,874,000"],
              ["Accounts Receivable", "$7,854,000", "$6,932,000"],
              ["Inventory", "$4,521,000", "$4,125,000"],
              ["Total Current Assets", "$35,278,000", "$31,190,000"],
              ["Property, Plant & Equipment", "$22,156,000", "$19,874,000"],
              ["Intangible Assets", "$8,745,000", "$9,123,000"],
              ["Total Assets", "$66,179,000", "$60,187,000"],
              ["", "", ""],
              ["Liabilities & Shareholders' Equity", "", ""],
              ["Accounts Payable", "$3,254,000", "$2,987,000"],
              ["Short-term Debt", "$5,123,000", "$4,578,000"],
              ["Total Current Liabilities", "$8,377,000", "$7,565,000"],
              ["Long-term Debt", "$15,487,000", "$16,324,000"],
              ["Total Liabilities", "$23,864,000", "$23,889,000"],
              ["", "", ""],
              ["Common Stock", "$10,000,000", "$10,000,000"],
              ["Retained Earnings", "$32,315,000", "$26,298,000"],
              ["Total Shareholders' Equity", "$42,315,000", "$36,298,000"],
              ["Total Liabilities & Equity", "$66,179,000", "$60,187,000"]
            ],
            // Add data about where in the document each cell was found
            // This would be used for highlighting in the audit view
            cellLocations: [
              // Example for Cash and Cash Equivalents row
              {
                rowIdx: 1,
                colIdx: 0,
                boundingBox: { x: 50, y: 150, width: 180, height: 20 },
                confidence: 0.95
              },
              {
                rowIdx: 1,
                colIdx: 1,
                boundingBox: { x: 240, y: 150, width: 90, height: 20 },
                confidence: 0.98
              },
              {
                rowIdx: 1,
                colIdx: 2,
                boundingBox: { x: 340, y: 150, width: 90, height: 20 },
                confidence: 0.97
              }
              // In a real implementation, this would include all cells
            ]
          },
          {
            title: "Income Statement",
            columns: ["Line Item", "2023", "2022"],
            rows: [
              ["Revenue", "$45,876,000", "$41,234,000"],
              ["Cost of Revenue", "$27,526,000", "$24,740,000"],
              ["Gross Profit", "$18,350,000", "$16,494,000"],
              ["Operating Expenses", "$9,175,000", "$8,247,000"],
              ["Operating Income", "$9,175,000", "$8,247,000"],
              ["Interest Expense", "$1,320,000", "$1,452,000"],
              ["Income Before Taxes", "$7,855,000", "$6,795,000"],
              ["Income Tax Expense", "$1,838,000", "$1,563,000"],
              ["Net Income", "$6,017,000", "$5,232,000"],
              ["Earnings Per Share", "$3.01", "$2.62"]
            ],
            cellLocations: [
              // Similar to above, but for the second table
              {
                rowIdx: 0,
                colIdx: 0,
                boundingBox: { x: 50, y: 350, width: 80, height: 20 },
                confidence: 0.96
              }
              // More cells would be included in real implementation
            ]
          }
        ]
      }
    };
    
    return mockResult;
  };

  // Render extraction settings for a document
  const renderExtractorSettings = ({ document, onChange }: { document: Document, onChange: (settings: any) => void }) => {
    // Get or initialize settings for this document
    const settings = extractorSettings[document.id] || {
      extractTablesOnly: true,
      ignoreCurrency: false,
      confidenceThreshold: 0.7,
      selectedPage: 1
    };
    
    // Update settings and notify parent
    const updateSettings = (newSettings: Partial<typeof settings>) => {
      const updated = { ...settings, ...newSettings };
      setExtractorSettings(prev => ({
        ...prev,
        [document.id]: updated
      }));
      onChange(updated);
    };
    
    // Generate pages array for selection
    const generatePageOptions = () => {
      if (!document.total_pages || document.total_pages <= 1) return [];
      return Array.from({ length: document.total_pages }, (_, i) => i + 1);
    };
    
    return (
      <div className="space-y-4">
        {/* Page selection for multi-page documents */}
        {document.total_pages && document.total_pages > 1 && (
          <div className="flex items-center gap-4">
            <label className="block text-sm font-medium text-gray-700">Page to Extract:</label>
            <select
              value={settings.selectedPage}
              onChange={(e) => updateSettings({ selectedPage: Number(e.target.value) })}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              {generatePageOptions().map((page) => (
                <option key={page} value={page}>
                  Page {page} of {document.total_pages}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {/* Advanced settings */}
        <div className="pt-2 border-t border-gray-200">
          <h5 className="text-sm font-medium text-gray-700 flex items-center mb-2">
            <FaCog className="mr-2 text-gray-500" /> Advanced Settings
          </h5>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                id={`extract-tables-only-${document.id}`}
                type="checkbox"
                checked={settings.extractTablesOnly}
                onChange={(e) => updateSettings({ extractTablesOnly: e.target.checked })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor={`extract-tables-only-${document.id}`} className="ml-2 block text-sm text-gray-700">
                Extract tables only
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                id={`ignore-currency-${document.id}`}
                type="checkbox"
                checked={settings.ignoreCurrency}
                onChange={(e) => updateSettings({ ignoreCurrency: e.target.checked })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor={`ignore-currency-${document.id}`} className="ml-2 block text-sm text-gray-700">
                Ignore currency symbols
              </label>
            </div>
            
            <div className="flex flex-col md:col-span-2">
              <label htmlFor={`confidence-threshold-${document.id}`} className="block text-sm text-gray-700 mb-1">
                Confidence Threshold: {settings.confidenceThreshold}
              </label>
              <input
                id={`confidence-threshold-${document.id}`}
                type="range"
                min="0.1"
                max="0.9"
                step="0.1"
                value={settings.confidenceThreshold}
                onChange={(e) => updateSettings({ confidenceThreshold: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render extraction results
  const renderExtractionResults = (result: ExtractionResult, isAuditMode: boolean) => {
    // Convert some cells to highlight objects for the document viewer
    const getHighlightsFromResult = (result: ExtractionResult) => {
      if (!result.data?.tables) return [];
      
      return result.data.tables.flatMap((table: any, tableIdx: number) => 
        (table.cellLocations || []).map((loc: any) => ({
          text: table.rows[loc.rowIdx][loc.colIdx],
          boundingBox: loc.boundingBox,
          confidence: loc.confidence,
          pageNumber: result.page_number || 1
        }))
      );
    };
    
    return (
      <div className="space-y-6">
        {result.data.tables.map((table: any, tableIndex: number) => (
          <div key={tableIndex} className="mb-8 last:mb-0">
            <h4 className="text-md font-semibold mb-2">{table.title || `Table ${tableIndex + 1}`}</h4>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {table.columns.map((column: string, colIndex: number) => (
                      <th 
                        key={colIndex}
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {table.rows.map((row: string[], rowIndex: number) => (
                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {row.map((cell: string, cellIndex: number) => {
                        // Find if this cell has location data
                        const cellLocation = table.cellLocations?.find(
                          (loc: any) => loc.rowIdx === rowIndex && loc.colIdx === cellIndex
                        );
                        
                        return (
                          <td 
                            key={cellIndex}
                            className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${
                              cellIndex === 0 ? 'font-medium text-gray-900' : ''
                            } ${isAuditMode && cellLocation ? 'cursor-pointer hover:bg-yellow-50' : ''}`}
                            title={isAuditMode && cellLocation ? `Confidence: ${Math.round(cellLocation.confidence * 100)}%` : undefined}
                          >
                            {cell}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        
        {/* In audit mode, also render the document viewer */}
        {isAuditMode && (
          <div className="mt-8 p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-700 mb-4">Extraction Highlights</h4>
            <div className="h-96">
              <DocumentViewer
                documentUrl={documentUrls[result.document_id] || ''}
                documentType={documentUrls[result.document_id]?.endsWith('.pdf') ? 'pdf' : 'image'}
                highlights={getHighlightsFromResult(result)}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto">
      <MultiDocumentExtractor
        documents={documents}
        extractionType="financial"
        renderExtractorSettings={renderExtractorSettings}
        extractDocumentData={extractFinancialData}
        renderExtractionResults={renderExtractionResults}
      />
    </div>
  );
};

export default FinancialExtractionEnhanced; 