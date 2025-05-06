'use client';

import React, { useState, useEffect } from 'react';
import { FaTable, FaFileAlt, FaDownload, FaSpinner, FaCog, FaTemperatureLow } from 'react-icons/fa';
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
  page_number?: number;
}

interface FinancialExtractionProps {
  document: Document;
}

const FinancialExtraction: React.FC<FinancialExtractionProps> = ({ document }) => {
  const { data: session } = useSession();
  const [isExtracting, setIsExtracting] = useState(false);
  const [selectedPage, setSelectedPage] = useState<number>(1);
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [advancedSettings, setAdvancedSettings] = useState({
    extractTablesOnly: true,
    ignoreCurrency: false,
    confidenceThreshold: 0.7,
  });

  // Extract financial tables
  const handleExtract = async () => {
    if (!document) return;
    
    setIsExtracting(true);
    try {
      // In a real app, you'd call your API with the document ID and page number
      // For demo purposes, simulate API call and response
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Mock extraction result
      const mockResult: ExtractionResult = {
        id: `extraction-${Date.now()}`,
        document_id: document.id,
        extracted_at: new Date().toISOString(),
        page_number: selectedPage,
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
              ]
            }
          ]
        }
      };
      
      setExtractionResult(mockResult);
      toast.success('Financial tables extracted successfully');
    } catch (error) {
      console.error('Error extracting financial tables:', error);
      toast.error('Failed to extract financial tables');
    } finally {
      setIsExtracting(false);
    }
  };

  // Generate pages array for selection
  const generatePageOptions = () => {
    if (!document.total_pages || document.total_pages <= 1) return [];
    return Array.from({ length: document.total_pages }, (_, i) => i + 1);
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
        const tables = extractionResult.data.tables;
        let csv = '';
        
        tables.forEach((table: any) => {
          csv += `"${table.title}"\n`;
          csv += table.columns.join(',') + '\n';
          table.rows.forEach((row: any) => {
            csv += row.join(',') + '\n';
          });
          csv += '\n';
        });
        
        exportData = csv;
      } else {
        // For Excel, we'd typically generate a file server-side
        exportData = JSON.stringify(extractionResult.data);
      }
      
      // Create a download link
      const blob = new Blob([exportData], { type: selectedTemplate.format === 'json' ? 'application/json' : 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `financial_extraction_${document.filename.split('.')[0]}_${new Date().toISOString().slice(0, 10)}.${selectedTemplate.format}`;
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
          <FaTable className="text-green-600 mr-2" />
          Financial Table Extraction
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
            onClick={() => document.total_pages && document.total_pages > 1 ? null : handleExtract()}
            disabled={isExtracting}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center disabled:opacity-50"
          >
            {isExtracting ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Extracting...
              </>
            ) : (
              <>
                <FaTable className="mr-2" />
                Extract Tables
              </>
            )}
          </button>
          
          {extractionResult && (
            <button
              onClick={handleExport}
              disabled={!selectedTemplate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center disabled:opacity-50"
              title={!selectedTemplate ? 'Please select a template first' : undefined}
            >
              <FaDownload className="mr-2" />
              Export
            </button>
          )}
        </div>
      </div>
      
      {/* Page Selection (for multi-page documents) */}
      {document.total_pages && document.total_pages > 1 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h4 className="font-medium text-gray-700 mb-2 sm:mb-0">Select Page to Extract</h4>
            
            <div className="flex items-center space-x-2">
              <select
                value={selectedPage}
                onChange={(e) => setSelectedPage(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                {generatePageOptions().map((page) => (
                  <option key={page} value={page}>
                    Page {page} of {document.total_pages}
                  </option>
                ))}
              </select>
              
              <button
                onClick={handleExtract}
                disabled={isExtracting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center disabled:opacity-50"
              >
                {isExtracting ? 'Extracting...' : 'Extract'}
              </button>
            </div>
          </div>
        </div>
      )}
      
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
              id="extract-tables-only"
              type="checkbox"
              checked={advancedSettings.extractTablesOnly}
              onChange={(e) => setAdvancedSettings(prev => ({ ...prev, extractTablesOnly: e.target.checked }))}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="extract-tables-only" className="ml-2 block text-sm text-gray-700">
              Extract tables only
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              id="ignore-currency"
              type="checkbox"
              checked={advancedSettings.ignoreCurrency}
              onChange={(e) => setAdvancedSettings(prev => ({ ...prev, ignoreCurrency: e.target.checked }))}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="ignore-currency" className="ml-2 block text-sm text-gray-700">
              Ignore currency symbols
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
            extractionType="financial" 
            onSelectTemplate={handleTemplateSelect} 
          />
        </div>
      )}
      
      {/* Extraction Results */}
      {isExtracting ? (
        <div className="flex flex-col items-center justify-center p-10 border border-gray-200 rounded-lg">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500 mb-4"></div>
          <p className="text-gray-500">Extracting financial tables from {document.filename}</p>
          <p className="text-gray-400 text-sm mt-2">This may take a few moments...</p>
        </div>
      ) : extractionResult ? (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-700">Extraction Results</h3>
            <p className="text-sm text-gray-500">
              Extracted from page {extractionResult.page_number || 1} at {new Date(extractionResult.extracted_at).toLocaleString()}
            </p>
          </div>
          
          <div className="p-4">
            {extractionResult.data.tables.map((table: any, tableIndex: number) => (
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
                          {row.map((cell: string, cellIndex: number) => (
                            <td 
                              key={cellIndex}
                              className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${
                                cellIndex === 0 ? 'font-medium text-gray-900' : ''
                              }`}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 border border-gray-200 rounded-lg">
          <FaTable className="mx-auto text-gray-400 text-4xl mb-3" />
          <p className="text-lg text-gray-500">No extraction results yet</p>
          <p className="text-sm text-gray-400 mt-1">Click the "Extract Tables" button to analyze this document</p>
        </div>
      )}
    </div>
  );
};

export default FinancialExtraction; 