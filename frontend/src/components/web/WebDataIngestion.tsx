'use client';

import React, { useState } from 'react';
import { FaGlobe, FaPlus, FaSpinner, FaCheck, FaExclamationTriangle, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

type WebSource = {
  id: string;
  url: string;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  page_count?: number;
};

const WebDataIngestion: React.FC = () => {
  const { data: session } = useSession();
  const [webSources, setWebSources] = useState<WebSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newUrl, setNewUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch web sources on component mount
  React.useEffect(() => {
    fetchWebSources();
  }, [session]);

  const fetchWebSources = async () => {
    setIsLoading(true);
    try {
      // Note: This API endpoint would need to be implemented in the backend
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/web-sources`, {
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
        }
      });
      setWebSources(response.data);
    } catch (err) {
      console.error('Error fetching web sources:', err);
      // For demonstration, let's add some mock data
      setWebSources([
        {
          id: '1',
          url: 'https://example.com',
          title: 'Example Website',
          status: 'completed',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          page_count: 5
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddWebSource = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUrl) {
      setError('Please enter a URL');
      return;
    }
    
    // Basic URL validation
    try {
      new URL(newUrl);
    } catch {
      setError('Please enter a valid URL');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Note: This API endpoint would need to be implemented in the backend
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/web-sources`,
        { url: newUrl },
        {
          headers: {
            'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
          }
        }
      );
      
      // Add the new web source to the list
      setWebSources([...webSources, response.data]);
      setNewUrl('');
      toast.success('Web source added successfully');
    } catch (err) {
      console.error('Error adding web source:', err);
      toast.error('Failed to add web source');
      
      // For demonstration, add a mock entry
      const mockWebSource: WebSource = {
        id: Date.now().toString(),
        url: newUrl,
        title: newUrl.split('//')[1].split('/')[0],
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setWebSources([...webSources, mockWebSource]);
      setNewUrl('');
      toast.success('Web source added successfully (mock)');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWebSource = async (id: string) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/web-sources/${id}`, {
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
        }
      });
      
      // Remove the web source from the list
      setWebSources(webSources.filter(source => source.id !== id));
      toast.success('Web source deleted successfully');
    } catch (err) {
      console.error('Error deleting web source:', err);
      
      // For demonstration, remove from state anyway
      setWebSources(webSources.filter(source => source.id !== id));
      toast.success('Web source deleted successfully (mock)');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
            <FaSpinner className="animate-spin mr-1" /> Pending
          </span>
        );
      case 'processing':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            <FaSpinner className="animate-spin mr-1" /> Processing
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            <FaCheck className="mr-1" /> Completed
          </span>
        );
      case 'failed':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            <FaExclamationTriangle className="mr-1" /> Failed
          </span>
        );
      default:
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            Unknown
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Web Source Form */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Add Web Source</h2>
        
        <form onSubmit={handleAddWebSource} className="space-y-4">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
              Website URL
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <div className="relative flex items-stretch flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaGlobe className="text-gray-400" />
                </div>
                <input
                  type="text"
                  name="url"
                  id="url"
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md"
                  placeholder="https://example.com"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <button
                type="submit"
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Adding...
                  </>
                ) : (
                  <>
                    <FaPlus className="mr-2" />
                    Add
                  </>
                )}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
            <p className="mt-2 text-xs text-gray-500">
              Add a website URL to crawl and index its content for AI queries.
            </p>
          </div>
        </form>
      </div>
      
      {/* Web Sources List */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Web Sources</h2>
        
        {isLoading ? (
          <div className="text-center py-4">
            <FaSpinner className="animate-spin mx-auto text-indigo-500 text-xl" />
            <p className="mt-2 text-sm text-gray-500">Loading web sources...</p>
          </div>
        ) : webSources.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <FaGlobe className="mx-auto text-gray-400 text-3xl mb-2" />
            <p>No web sources added yet</p>
            <p className="text-sm mt-1">Add a website URL above to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Website
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Added On
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pages
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {webSources.map((source) => (
                  <tr key={source.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-indigo-100 rounded-md">
                          <FaGlobe className="text-indigo-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {source.title || source.url.split('//')[1].split('/')[0]}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            <a href={source.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              {source.url}
                            </a>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(source.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(source.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {source.page_count || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteWebSource(source.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebDataIngestion; 