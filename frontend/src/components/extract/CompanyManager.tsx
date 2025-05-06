'use client';

import React, { useState, useEffect } from 'react';
import { FaBuilding, FaSearch, FaSort, FaSortUp, FaSortDown, FaTrash, FaEdit, FaPlus } from 'react-icons/fa';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

interface Company {
  id: string;
  name: string;
  created_at: string;
  document_count: number;
  description?: string;
}

interface CompanyManagerProps {
  onSelectCompany: (company: Company) => void;
  onCreateCompany: (company: Company) => void;
}

const CompanyManager: React.FC<CompanyManagerProps> = ({ onSelectCompany, onCreateCompany }) => {
  const { data: session } = useSession();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'name' | 'created_at' | 'document_count'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: '',
    description: ''
  });
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  // Fetch companies
  useEffect(() => {
    const fetchCompanies = async () => {
      setIsLoading(true);
      try {
        // In a real app you'd call your API
        // For demo purposes, use mock data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockCompanies = [
          {
            id: '1',
            name: 'Acme Corporation',
            created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            document_count: 5,
            description: 'Global manufacturer of innovative products'
          },
          {
            id: '2',
            name: 'TechGlobal Inc.',
            created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            document_count: 3,
            description: 'Software solutions provider'
          },
          {
            id: '3',
            name: 'Finance Partners LLC',
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            document_count: 8,
            description: 'Financial services and consulting'
          },
          {
            id: '4',
            name: 'Healthcare Solutions',
            created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            document_count: 12,
            description: 'Medical equipment and services'
          },
          {
            id: '5',
            name: 'EcoSystems Group',
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            document_count: 6,
            description: 'Sustainable energy solutions'
          }
        ];
        
        setCompanies(mockCompanies);
        setFilteredCompanies(mockCompanies);
      } catch (error) {
        console.error('Error fetching companies:', error);
        toast.error('Failed to fetch companies');
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchCompanies();
    }
  }, [session]);

  // Handle search
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCompanies(companies);
    } else {
      const lowercaseSearch = searchTerm.toLowerCase();
      const filtered = companies.filter(
        company => 
          company.name.toLowerCase().includes(lowercaseSearch) ||
          (company.description && company.description.toLowerCase().includes(lowercaseSearch))
      );
      setFilteredCompanies(filtered);
    }
  }, [searchTerm, companies]);

  // Handle sort
  useEffect(() => {
    const sorted = [...filteredCompanies].sort((a, b) => {
      if (sortField === 'name') {
        return sortDirection === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortField === 'created_at') {
        return sortDirection === 'asc'
          ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else {
        return sortDirection === 'asc'
          ? a.document_count - b.document_count
          : b.document_count - a.document_count;
      }
    });
    
    setFilteredCompanies(sorted);
  }, [sortField, sortDirection]);

  // Toggle sort direction
  const handleSort = (field: 'name' | 'created_at' | 'document_count') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Create new company
  const handleCreateCompany = async () => {
    if (!newCompany.name.trim()) {
      toast.error('Company name is required');
      return;
    }

    try {
      // In a real app, you'd call your API to create a company
      // For demo, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const createdCompany: Company = {
        id: `company-${Date.now()}`,
        name: newCompany.name,
        description: newCompany.description,
        created_at: new Date().toISOString(),
        document_count: 0
      };
      
      setCompanies(prev => [createdCompany, ...prev]);
      setShowCreateForm(false);
      setNewCompany({ name: '', description: '' });
      toast.success(`Company "${newCompany.name}" created successfully`);
      
      // Notify parent component
      onCreateCompany(createdCompany);
    } catch (error) {
      console.error('Error creating company:', error);
      toast.error('Failed to create company');
    }
  };

  // Update company
  const handleUpdateCompany = async () => {
    if (!editingCompany || !editingCompany.name.trim()) {
      toast.error('Company name is required');
      return;
    }

    try {
      // In a real app, you'd call your API to update a company
      // For demo, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCompanies(prev => 
        prev.map(company => 
          company.id === editingCompany.id ? editingCompany : company
        )
      );
      
      setEditingCompany(null);
      toast.success(`Company "${editingCompany.name}" updated successfully`);
    } catch (error) {
      console.error('Error updating company:', error);
      toast.error('Failed to update company');
    }
  };

  // Delete company
  const handleDeleteCompany = async (id: string) => {
    if (!confirm('Are you sure you want to delete this company? This action cannot be undone.')) {
      return;
    }

    try {
      // In a real app, you'd call your API to delete a company
      // For demo, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCompanies(prev => prev.filter(company => company.id !== id));
      toast.success('Company deleted successfully');
    } catch (error) {
      console.error('Error deleting company:', error);
      toast.error('Failed to delete company');
    }
  };

  // Render sort icon
  const renderSortIcon = (field: 'name' | 'created_at' | 'document_count') => {
    if (sortField !== field) {
      return <FaSort className="inline ml-1" />;
    }
    return sortDirection === 'asc' ? <FaSortUp className="inline ml-1" /> : <FaSortDown className="inline ml-1" />;
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-xl font-semibold mb-4 md:mb-0">Companies</h2>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search companies..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-indigo-700 text-white rounded-lg hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center justify-center shadow-sm"
          >
            <FaPlus className="mr-2" />
            Create Company
          </button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FaBuilding className="mx-auto text-gray-400 text-3xl mb-2" />
          <p>No companies found</p>
          {searchTerm ? (
            <p className="text-sm mt-1">Try a different search term</p>
          ) : (
            <p className="text-sm mt-1">Create a company to get started</p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  Company Name {renderSortIcon('name')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('document_count')}
                >
                  Documents {renderSortIcon('document_count')}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('created_at')}
                >
                  Created On {renderSortIcon('created_at')}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCompanies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FaBuilding className="text-indigo-500 mr-2" />
                      <div className="font-medium text-gray-900">{company.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 max-w-xs truncate">
                      {company.description || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {company.document_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(company.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button 
                        onClick={() => onSelectCompany(company)}
                        className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-md transition"
                      >
                        Select
                      </button>
                      <button 
                        onClick={() => setEditingCompany(company)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit Company"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        onClick={() => handleDeleteCompany(company.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Company"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Create Company Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Create New Company</h3>
            
            <div className="mb-4">
              <label htmlFor="company-name" className="block text-sm font-medium text-gray-700 mb-1">
                Company Name *
              </label>
              <input
                id="company-name"
                type="text"
                placeholder="Enter company name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                value={newCompany.name}
                onChange={(e) => setNewCompany(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="company-description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="company-description"
                placeholder="Brief description of the company"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
                value={newCompany.description}
                onChange={(e) => setNewCompany(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setNewCompany({ name: '', description: '' });
                }}
                className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCompany}
                disabled={!newCompany.name.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Company Modal */}
      {editingCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Edit Company</h3>
            
            <div className="mb-4">
              <label htmlFor="edit-company-name" className="block text-sm font-medium text-gray-700 mb-1">
                Company Name *
              </label>
              <input
                id="edit-company-name"
                type="text"
                placeholder="Enter company name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                value={editingCompany.name}
                onChange={(e) => setEditingCompany(prev => prev ? { ...prev, name: e.target.value } : null)}
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="edit-company-description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="edit-company-description"
                placeholder="Brief description of the company"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
                value={editingCompany.description || ''}
                onChange={(e) => setEditingCompany(prev => prev ? { ...prev, description: e.target.value } : null)}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setEditingCompany(null)}
                className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateCompany}
                disabled={!editingCompany.name.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyManager; 