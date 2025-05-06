'use client';

import React, { useState, useEffect } from 'react';
import { FaFileAlt, FaUpload, FaDownload, FaTrash, FaEye, FaCopy, FaPlus } from 'react-icons/fa';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

type ExtractionType = 'financial' | 'id' | 'kpi';

interface Template {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  extraction_type: ExtractionType;
  format: 'json' | 'csv' | 'excel';
  content: string; // Template schema or mapping
}

interface TemplateManagerProps {
  extractionType: ExtractionType;
  onSelectTemplate: (template: Template) => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({ extractionType, onSelectTemplate }) => {
  const { data: session } = useSession();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [newTemplate, setNewTemplate] = useState<Partial<Template>>({
    name: '',
    description: '',
    extraction_type: extractionType,
    format: 'json',
    content: '{}'
  });
  const [previewContent, setPreviewContent] = useState<string | null>(null);

  // Fetch templates on component mount
  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoading(true);
      try {
        // In a real app you'd call your API
        // For demo purposes, use mock data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockTemplates: Template[] = [
          {
            id: '1',
            name: 'Basic Financial Table',
            description: 'Simple template for balance sheets and income statements',
            created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            extraction_type: 'financial',
            format: 'json',
            content: JSON.stringify({
              mappings: {
                "Revenue": "$.income_statement.revenue",
                "Net Income": "$.income_statement.net_income",
                "Total Assets": "$.balance_sheet.total_assets",
                "Total Liabilities": "$.balance_sheet.total_liabilities"
              }
            }, null, 2)
          },
          {
            id: '2',
            name: 'Detailed P&L Statement',
            description: 'Comprehensive profit and loss statement format',
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            extraction_type: 'financial',
            format: 'csv',
            content: 'category,line_item,value,year\nRevenue,Total Revenue,{$.income.total_revenue},2023\nRevenue,Product Sales,{$.income.product_sales},2023\nExpenses,COGS,{$.expenses.cogs},2023\nExpenses,Operating Expenses,{$.expenses.operating},2023\nProfit,Gross Profit,{$.profit.gross},2023\nProfit,Net Profit,{$.profit.net},2023'
          },
          {
            id: '3',
            name: 'ID Document Export',
            description: 'Standard ID information extraction format',
            created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            extraction_type: 'id',
            format: 'json',
            content: JSON.stringify({
              mappings: {
                "Document Type": "$.document_type",
                "ID Number": "$.id_number",
                "Name": "$.name",
                "Date of Birth": "$.dob",
                "Issue Date": "$.issue_date",
                "Expiry Date": "$.expiry_date"
              }
            }, null, 2)
          },
          {
            id: '4',
            name: 'KPI Dashboard Export',
            description: 'Template for exporting KPIs to dashboard systems',
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            extraction_type: 'kpi',
            format: 'json',
            content: JSON.stringify({
              mappings: {
                "Revenue Growth": "$.metrics.revenue_growth",
                "Customer Acquisition Cost": "$.metrics.cac",
                "Churn Rate": "$.metrics.churn",
                "Lifetime Value": "$.metrics.ltv",
                "Burn Rate": "$.metrics.burn"
              }
            }, null, 2)
          }
        ];
        
        // Filter templates by extraction type
        const filteredTemplates = mockTemplates.filter(template => 
          template.extraction_type === extractionType
        );
        
        setTemplates(filteredTemplates);
      } catch (error) {
        console.error('Error fetching templates:', error);
        toast.error('Failed to fetch templates');
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchTemplates();
    }
  }, [session, extractionType]);

  // Handle template upload
  const handleTemplateUpload = async () => {
    if (!uploadFile) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    try {
      // In a real app, you'd send the file to your API
      // For demo, simulate API call and file reading
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Read file content
      const reader = new FileReader();
      
      const filePromise = new Promise<string>((resolve) => {
        reader.onload = (e) => {
          if (e.target?.result) {
            resolve(e.target.result as string);
          }
        };
      });
      
      reader.readAsText(uploadFile);
      const content = await filePromise;
      
      // Create new template
      const newTemplateObj: Template = {
        id: `template-${Date.now()}`,
        name: uploadFile.name.replace(/\.[^/.]+$/, ""), // Remove file extension
        created_at: new Date().toISOString(),
        extraction_type: extractionType,
        format: (uploadFile.name.endsWith('.json') ? 'json' : 
                uploadFile.name.endsWith('.csv') ? 'csv' : 'excel') as 'json' | 'csv' | 'excel',
        content
      };
      
      setTemplates(prev => [newTemplateObj, ...prev]);
      setShowUploadModal(false);
      setUploadFile(null);
      toast.success('Template uploaded successfully');
    } catch (error) {
      console.error('Error uploading template:', error);
      toast.error('Failed to upload template');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle template creation
  const handleCreateTemplate = async () => {
    if (!newTemplate.name?.trim()) {
      toast.error('Template name is required');
      return;
    }

    try {
      // In a real app, you'd call your API to create a template
      // For demo, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const createdTemplate: Template = {
        id: `template-${Date.now()}`,
        name: newTemplate.name,
        description: newTemplate.description,
        created_at: new Date().toISOString(),
        extraction_type: extractionType,
        format: newTemplate.format as 'json' | 'csv' | 'excel',
        content: newTemplate.content || '{}'
      };
      
      setTemplates(prev => [createdTemplate, ...prev]);
      setShowCreateModal(false);
      setNewTemplate({
        name: '',
        description: '',
        extraction_type: extractionType,
        format: 'json',
        content: '{}'
      });
      toast.success('Template created successfully');
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    }
  };

  // Handle template deletion
  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return;
    }

    try {
      // In a real app, you'd call your API to delete the template
      // For demo, simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setTemplates(prev => prev.filter(template => template.id !== id));
      if (selectedTemplate?.id === id) {
        setSelectedTemplate(null);
      }
      toast.success('Template deleted successfully');
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  // Handle template selection
  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    onSelectTemplate(template);
    toast.success(`Template "${template.name}" selected`);
  };

  // Handle template duplication
  const handleDuplicateTemplate = (template: Template) => {
    const duplicatedTemplate: Template = {
      ...template,
      id: `template-${Date.now()}`,
      name: `${template.name} (Copy)`,
      created_at: new Date().toISOString()
    };
    
    setTemplates(prev => [duplicatedTemplate, ...prev]);
    toast.success(`Template duplicated as "${duplicatedTemplate.name}"`);
  };

  // Preview template
  const handlePreviewTemplate = (content: string) => {
    setPreviewContent(content);
  };

  // Format to display
  const formatLabel = {
    json: 'JSON',
    csv: 'CSV',
    excel: 'Excel'
  };

  // Get extraction type label
  const getExtractionTypeLabel = (type: ExtractionType) => {
    switch (type) {
      case 'financial': return 'Financial Tables';
      case 'id': return 'ID Documents';
      case 'kpi': return 'KPI Extraction';
      default: return 'Unknown';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Templates for {getExtractionTypeLabel(extractionType)}</h2>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center"
          >
            <FaUpload className="mr-2" />
            Upload Template
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center"
          >
            <FaPlus className="mr-2" />
            Create Template
          </button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FaFileAlt className="mx-auto text-gray-400 text-3xl mb-2" />
          <p>No templates found for {getExtractionTypeLabel(extractionType)}</p>
          <p className="text-sm mt-1">Create or upload a template to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`border rounded-lg p-4 transition ${
                selectedTemplate?.id === template.id
                  ? 'border-indigo-500 ring-2 ring-indigo-200'
                  : 'border-gray-200 hover:shadow-md hover:border-indigo-300'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center">
                  <FaFileAlt className="text-indigo-500 mr-2" />
                  <h3 className="font-medium text-gray-900 truncate max-w-[150px]" title={template.name}>
                    {template.name}
                  </h3>
                </div>
                <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                  {formatLabel[template.format]}
                </span>
              </div>
              
              {template.description && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-2" title={template.description}>
                  {template.description}
                </p>
              )}
              
              <div className="mt-2 text-xs text-gray-500">
                Created: {new Date(template.created_at).toLocaleDateString()}
              </div>
              
              <div className="flex mt-4 justify-between">
                <button
                  onClick={() => handleSelectTemplate(template)}
                  className={`${
                    selectedTemplate?.id === template.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                  } px-3 py-1 rounded-md transition`}
                >
                  {selectedTemplate?.id === template.id ? 'Selected' : 'Select'}
                </button>
                
                <div className="flex space-x-1">
                  <button
                    onClick={() => handlePreviewTemplate(template.content)}
                    className="text-gray-600 hover:text-indigo-600 p-1"
                    title="Preview Template"
                  >
                    <FaEye />
                  </button>
                  <button
                    onClick={() => handleDuplicateTemplate(template)}
                    className="text-gray-600 hover:text-indigo-600 p-1"
                    title="Duplicate Template"
                  >
                    <FaCopy />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="text-gray-600 hover:text-red-600 p-1"
                    title="Delete Template"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Upload Template Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Upload Template</h3>
            
            <div className="mb-6">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FaUpload className="w-8 h-8 mb-3 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">JSON, CSV (MAX. 5MB)</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".json,.csv,.xlsx" 
                  onChange={(e) => e.target.files && setUploadFile(e.target.files[0])}
                />
              </label>
              
              {uploadFile && (
                <div className="mt-3">
                  <p className="text-sm font-medium">Selected file: {uploadFile.name}</p>
                  <p className="text-xs text-gray-500">Size: {(uploadFile.size / 1024).toFixed(1)} KB</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleTemplateUpload}
                disabled={!uploadFile || isUploading}
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
      )}
      
      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Create New Template</h3>
            
            <div className="mb-4">
              <label htmlFor="template-name" className="block text-sm font-medium text-gray-700 mb-1">
                Template Name *
              </label>
              <input
                id="template-name"
                type="text"
                placeholder="Enter template name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="template-description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="template-description"
                placeholder="Brief description of the template"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                rows={2}
                value={newTemplate.description}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
              <div className="flex space-x-2">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-indigo-600"
                    name="format"
                    value="json"
                    checked={newTemplate.format === 'json'}
                    onChange={() => setNewTemplate(prev => ({ ...prev, format: 'json' }))}
                  />
                  <span className="ml-2">JSON</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-indigo-600"
                    name="format"
                    value="csv"
                    checked={newTemplate.format === 'csv'}
                    onChange={() => setNewTemplate(prev => ({ ...prev, format: 'csv' }))}
                  />
                  <span className="ml-2">CSV</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-indigo-600"
                    name="format"
                    value="excel"
                    checked={newTemplate.format === 'excel'}
                    onChange={() => setNewTemplate(prev => ({ ...prev, format: 'excel' }))}
                  />
                  <span className="ml-2">Excel</span>
                </label>
              </div>
            </div>
            
            <div className="mb-6">
              <label htmlFor="template-content" className="block text-sm font-medium text-gray-700 mb-1">
                Template Content
              </label>
              <textarea
                id="template-content"
                placeholder={newTemplate.format === 'json' ? '{"mappings": {...}}' : 'field1,field2,field3\nvalue1,value2,value3'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-indigo-500 focus:border-indigo-500"
                rows={6}
                value={newTemplate.content}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
              />
              <p className="text-xs text-gray-500 mt-1">
                {newTemplate.format === 'json' 
                  ? 'Define JSON structure with JSONPath mappings'
                  : 'Define CSV structure with fields and placeholders in {$.path.to.value} format'}
              </p>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewTemplate({
                    name: '',
                    description: '',
                    extraction_type: extractionType,
                    format: 'json',
                    content: '{}'
                  });
                }}
                className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTemplate}
                disabled={!newTemplate.name?.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Preview Template Modal */}
      {previewContent !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] flex flex-col">
            <h3 className="text-lg font-semibold mb-4">Template Preview</h3>
            
            <div className="overflow-auto flex-grow bg-gray-50 p-4 rounded-lg font-mono text-sm">
              <pre>{previewContent}</pre>
            </div>
            
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setPreviewContent(null)}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateManager; 