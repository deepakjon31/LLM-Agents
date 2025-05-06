'use client';

import React, { useState } from 'react';
import { FaChartLine, FaFileAlt, FaDownload, FaSpinner, FaCog, FaTag } from 'react-icons/fa';
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

interface KPI {
  id: string;
  name: string;
  value: string | number;
  unit?: string;
  period?: string;
  confidence: number;
  category: 'financial' | 'operational' | 'customer' | 'growth' | 'other';
}

interface ExtractionResult {
  id: string;
  document_id: string;
  extracted_at: string;
  page_numbers: number[];
  kpis: KPI[];
}

interface KpiExtractionProps {
  document: Document;
}

const KpiExtraction: React.FC<KpiExtractionProps> = ({ document }) => {
  const { data: session } = useSession();
  const [isExtracting, setIsExtracting] = useState(false);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [kpiCategories, setKpiCategories] = useState({
    financial: true,
    operational: true,
    customer: true,
    growth: true,
    other: true
  });
  const [advancedSettings, setAdvancedSettings] = useState({
    minConfidence: 0.7,
    extractNumericalOnly: false,
    includeTrends: true
  });

  // Generate pages array for multi-page documents
  const generatePageOptions = () => {
    if (!document.total_pages || document.total_pages <= 1) return [];
    return Array.from({ length: document.total_pages }, (_, i) => i + 1);
  };

  // Handle page selection
  const handlePageSelect = (pageNum: number) => {
    if (selectedPages.includes(pageNum)) {
      setSelectedPages(prev => prev.filter(p => p !== pageNum));
    } else {
      setSelectedPages(prev => [...prev, pageNum].sort((a, b) => a - b));
    }
  };

  // Select all pages
  const handleSelectAllPages = () => {
    if (!document.total_pages) return;
    
    if (selectedPages.length === document.total_pages) {
      setSelectedPages([]);
    } else {
      setSelectedPages(Array.from({ length: document.total_pages }, (_, i) => i + 1));
    }
  };

  // Extract KPIs
  const handleExtract = async () => {
    if (!document) return;
    
    if (document.total_pages && document.total_pages > 1 && selectedPages.length === 0) {
      toast.error('Please select at least one page to extract KPIs from');
      return;
    }
    
    setIsExtracting(true);
    try {
      // In a real app, you'd call your API with the document ID and selected pages
      // For demo purposes, simulate API call and response
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Mock extraction result with KPIs
      const mockKpis: KPI[] = [
        {
          id: '1',
          name: 'Revenue',
          value: 45876000,
          unit: 'USD',
          period: 'FY 2023',
          confidence: 0.95,
          category: 'financial'
        },
        {
          id: '2',
          name: 'Net Income',
          value: 6017000,
          unit: 'USD',
          period: 'FY 2023',
          confidence: 0.93,
          category: 'financial'
        },
        {
          id: '3',
          name: 'Gross Profit Margin',
          value: 40.2,
          unit: '%',
          period: 'FY 2023',
          confidence: 0.91,
          category: 'financial'
        },
        {
          id: '4',
          name: 'Customer Acquisition Cost',
          value: 152.75,
          unit: 'USD',
          period: 'Q4 2023',
          confidence: 0.85,
          category: 'customer'
        },
        {
          id: '5',
          name: 'Customer Lifetime Value',
          value: 890.25,
          unit: 'USD',
          period: 'FY 2023',
          confidence: 0.83,
          category: 'customer'
        },
        {
          id: '6',
          name: 'Churn Rate',
          value: 2.8,
          unit: '%',
          period: 'Q4 2023',
          confidence: 0.89,
          category: 'customer'
        },
        {
          id: '7',
          name: 'Revenue Growth',
          value: 11.3,
          unit: '%',
          period: 'YoY',
          confidence: 0.92,
          category: 'growth'
        },
        {
          id: '8',
          name: 'Daily Active Users',
          value: 235000,
          period: 'Dec 2023',
          confidence: 0.87,
          category: 'operational'
        },
        {
          id: '9',
          name: 'Conversion Rate',
          value: 3.2,
          unit: '%',
          period: 'Q4 2023',
          confidence: 0.84,
          category: 'operational'
        },
        {
          id: '10',
          name: 'Net Promoter Score',
          value: 62,
          period: 'Q4 2023',
          confidence: 0.78,
          category: 'customer'
        },
        {
          id: '11',
          name: 'Average Order Value',
          value: 125.42,
          unit: 'USD',
          period: 'Q4 2023',
          confidence: 0.88,
          category: 'operational'
        },
        {
          id: '12',
          name: 'Market Share',
          value: 12.5,
          unit: '%',
          period: 'FY 2023',
          confidence: 0.76,
          category: 'growth'
        }
      ];
      
      // Filter out KPIs below confidence threshold
      const filteredKpis = mockKpis.filter(kpi => kpi.confidence >= advancedSettings.minConfidence);
      
      const mockResult: ExtractionResult = {
        id: `extraction-${Date.now()}`,
        document_id: document.id,
        extracted_at: new Date().toISOString(),
        page_numbers: document.total_pages && document.total_pages > 1 
          ? selectedPages 
          : [1],
        kpis: filteredKpis
      };
      
      setExtractionResult(mockResult);
      toast.success('KPIs extracted successfully');
    } catch (error) {
      console.error('Error extracting KPIs:', error);
      toast.error('Failed to extract KPIs');
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
        exportData = JSON.stringify({
          document_id: extractionResult.document_id,
          extracted_at: extractionResult.extracted_at,
          kpis: extractionResult.kpis
        }, null, 2);
      } else if (selectedTemplate.format === 'csv') {
        // Simple CSV conversion for demo
        const headers = ['name', 'value', 'unit', 'period', 'category', 'confidence'];
        const rows = extractionResult.kpis.map(kpi => 
          [
            kpi.name,
            kpi.value,
            kpi.unit || '',
            kpi.period || '',
            kpi.category,
            kpi.confidence
          ].join(',')
        );
        
        exportData = headers.join(',') + '\n' + rows.join('\n');
      } else {
        // For Excel, we'd typically generate a file server-side
        exportData = JSON.stringify(extractionResult.kpis);
      }
      
      // Create a download link
      const blob = new Blob([exportData], { type: selectedTemplate.format === 'json' ? 'application/json' : 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `kpi_extraction_${document.filename.split('.')[0]}_${new Date().toISOString().slice(0, 10)}.${selectedTemplate.format}`;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('KPIs exported successfully');
    } catch (error) {
      console.error('Error exporting KPIs:', error);
      toast.error('Failed to export KPIs');
    }
  };

  // Filter KPIs by category
  const getFilteredKPIs = () => {
    if (!extractionResult) return [];
    
    return extractionResult.kpis.filter(kpi => 
      kpiCategories[kpi.category as keyof typeof kpiCategories]
    );
  };

  // Format number with appropriate formatting based on value
  const formatNumber = (value: number | string): string => {
    if (typeof value === 'string') return value;
    
    // Format large numbers with appropriate suffix
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    } else if (Number.isInteger(value)) {
      return value.toString();
    } else {
      return value.toFixed(2);
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center">
          <FaChartLine className="text-purple-600 mr-2" />
          KPI Extraction
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
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 flex items-center disabled:opacity-50"
          >
            {isExtracting ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Extracting...
              </>
            ) : (
              <>
                <FaChartLine className="mr-2" />
                Extract KPIs
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
          <div className="flex flex-col space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-gray-700">Select Pages to Extract From</h4>
              
              <button
                onClick={handleSelectAllPages}
                className="text-xs text-indigo-600 hover:text-indigo-800"
              >
                {selectedPages.length === document.total_pages ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2">
              {generatePageOptions().map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => handlePageSelect(pageNum)}
                  className={`px-3 py-1 text-xs rounded-full ${
                    selectedPages.includes(pageNum)
                      ? 'bg-purple-100 text-purple-800 border border-purple-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  Page {pageNum}
                </button>
              ))}
            </div>
            
            <div className="text-xs text-gray-500 mt-1">
              {selectedPages.length} of {document.total_pages} pages selected
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
          <div className="flex flex-col">
            <label htmlFor="confidence-threshold" className="block text-sm text-gray-700 mb-1">
              Minimum Confidence: {advancedSettings.minConfidence}
            </label>
            <input
              id="confidence-threshold"
              type="range"
              min="0.1"
              max="0.9"
              step="0.1"
              value={advancedSettings.minConfidence}
              onChange={(e) => setAdvancedSettings(prev => ({ ...prev, minConfidence: parseFloat(e.target.value) }))}
              className="w-full"
            />
          </div>
          
          <div className="flex items-center">
            <input
              id="numerical-only"
              type="checkbox"
              checked={advancedSettings.extractNumericalOnly}
              onChange={(e) => setAdvancedSettings(prev => ({ ...prev, extractNumericalOnly: e.target.checked }))}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="numerical-only" className="ml-2 block text-sm text-gray-700">
              Extract numerical KPIs only
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              id="include-trends"
              type="checkbox"
              checked={advancedSettings.includeTrends}
              onChange={(e) => setAdvancedSettings(prev => ({ ...prev, includeTrends: e.target.checked }))}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="include-trends" className="ml-2 block text-sm text-gray-700">
              Include trend indicators
            </label>
          </div>
        </div>
      </div>
      
      {/* Template Manager */}
      {showTemplates && (
        <div className="mt-4">
          <TemplateManager 
            extractionType="kpi" 
            onSelectTemplate={handleTemplateSelect} 
          />
        </div>
      )}
      
      {/* Extraction Results */}
      {isExtracting ? (
        <div className="flex flex-col items-center justify-center p-10 border border-gray-200 rounded-lg">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mb-4"></div>
          <p className="text-gray-500">Extracting KPIs from {document.filename}</p>
          <p className="text-gray-400 text-sm mt-2">This may take a few moments...</p>
        </div>
      ) : extractionResult ? (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-700">Extracted KPIs</h3>
            <p className="text-sm text-gray-500">
              Extracted from {extractionResult.page_numbers.length} page(s) at {new Date(extractionResult.extracted_at).toLocaleString()}
            </p>
          </div>
          
          <div className="p-4">
            {/* KPI Category Filter */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                Filter by Category
              </h4>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setKpiCategories(prev => ({ ...prev, financial: !prev.financial }))}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    kpiCategories.financial 
                      ? 'bg-green-100 text-green-800 border border-green-300' 
                      : 'bg-gray-100 text-gray-700 border border-gray-300'
                  }`}
                >
                  Financial
                </button>
                <button
                  onClick={() => setKpiCategories(prev => ({ ...prev, operational: !prev.operational }))}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    kpiCategories.operational 
                      ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                      : 'bg-gray-100 text-gray-700 border border-gray-300'
                  }`}
                >
                  Operational
                </button>
                <button
                  onClick={() => setKpiCategories(prev => ({ ...prev, customer: !prev.customer }))}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    kpiCategories.customer 
                      ? 'bg-orange-100 text-orange-800 border border-orange-300' 
                      : 'bg-gray-100 text-gray-700 border border-gray-300'
                  }`}
                >
                  Customer
                </button>
                <button
                  onClick={() => setKpiCategories(prev => ({ ...prev, growth: !prev.growth }))}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    kpiCategories.growth 
                      ? 'bg-purple-100 text-purple-800 border border-purple-300' 
                      : 'bg-gray-100 text-gray-700 border border-gray-300'
                  }`}
                >
                  Growth
                </button>
                <button
                  onClick={() => setKpiCategories(prev => ({ ...prev, other: !prev.other }))}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    kpiCategories.other 
                      ? 'bg-gray-100 text-gray-800 border border-gray-300' 
                      : 'bg-gray-100 text-gray-700 border border-gray-300'
                  }`}
                >
                  Other
                </button>
              </div>
            </div>
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getFilteredKPIs().map((kpi) => (
                <div 
                  key={kpi.id} 
                  className={`border rounded-lg p-4 ${
                    kpi.category === 'financial' ? 'border-green-200 bg-green-50' :
                    kpi.category === 'operational' ? 'border-blue-200 bg-blue-50' :
                    kpi.category === 'customer' ? 'border-orange-200 bg-orange-50' :
                    kpi.category === 'growth' ? 'border-purple-200 bg-purple-50' :
                    'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-gray-800">{kpi.name}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      kpi.category === 'financial' ? 'bg-green-100 text-green-800' :
                      kpi.category === 'operational' ? 'bg-blue-100 text-blue-800' :
                      kpi.category === 'customer' ? 'bg-orange-100 text-orange-800' :
                      kpi.category === 'growth' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {kpi.category}
                    </span>
                  </div>
                  
                  <div className="mt-2">
                    <span className="text-2xl font-bold">
                      {formatNumber(kpi.value)}
                      {kpi.unit && <span className="text-sm ml-1">{kpi.unit}</span>}
                    </span>
                    {kpi.period && (
                      <span className="block text-xs text-gray-500 mt-1">
                        Period: {kpi.period}
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-2 flex justify-between items-center">
                    <div className="flex items-center">
                      <FaTag className="text-gray-400 mr-1" size={12} />
                      <span className="text-xs text-gray-500">
                        Confidence: {Math.round(kpi.confidence * 100)}%
                      </span>
                    </div>
                    
                    {advancedSettings.includeTrends && (
                      <div className="flex items-center">
                        <span className={`text-xs ${
                          kpi.name.toLowerCase().includes('growth') || 
                          kpi.name.toLowerCase().includes('increase') ||
                          (typeof kpi.value === 'number' && kpi.value > 0 && kpi.name.toLowerCase().includes('rate'))
                            ? 'text-green-600'
                            : kpi.name.toLowerCase().includes('churn') ||
                              kpi.name.toLowerCase().includes('cost') ||
                              kpi.name.toLowerCase().includes('expense')
                              ? 'text-red-600'
                              : 'text-gray-600'
                        }`}>
                          {kpi.name.toLowerCase().includes('growth') || 
                           kpi.name.toLowerCase().includes('increase') ||
                           (typeof kpi.value === 'number' && kpi.value > 0 && kpi.name.toLowerCase().includes('rate'))
                            ? '↑ Positive'
                            : kpi.name.toLowerCase().includes('churn') ||
                              kpi.name.toLowerCase().includes('cost') ||
                              kpi.name.toLowerCase().includes('expense')
                              ? '↓ Monitor'
                              : '→ Neutral'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {getFilteredKPIs().length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No KPIs match the selected filters</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 border border-gray-200 rounded-lg">
          <FaChartLine className="mx-auto text-gray-400 text-4xl mb-3" />
          <p className="text-lg text-gray-500">No KPIs extracted yet</p>
          <p className="text-sm text-gray-400 mt-1">Click the "Extract KPIs" button to analyze this document</p>
        </div>
      )}
    </div>
  );
};

export default KpiExtraction; 