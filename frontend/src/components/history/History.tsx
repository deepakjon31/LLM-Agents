'use client';

import { useState, useEffect } from 'react';
import { FaHistory, FaDatabase, FaFileAlt, FaCalendarAlt, FaSearch, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import { useSession } from 'next-auth/react';

type HistoryItem = {
  id: string;
  agentType: 'SQL_AGENT' | 'DOCUMENT_AGENT' | 'WEB_AGENT' | 'CLOUD_AGENT';
  prompt: string;
  response: string;
  timestamp: string;
  hasChart?: boolean;
};

const History: React.FC = () => {
  const { data: session } = useSession();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'SQL_AGENT' | 'DOCUMENT_AGENT'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/agents/history`, {
          headers: {
            'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
          }
        });
        
        setHistory(response.data);
      } catch (error) {
        console.error('Error fetching history:', error);
        // Set empty history on error
        setHistory([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (session) {
      fetchHistory();
    }
  }, [session]);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };
  
  const handleDeleteHistoryItem = async (id: string) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/agents/history/${id}`, {
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
        }
      });
      
      // Remove history item from state
      setHistory(history.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting history item:', error);
    }
  };
  
  const filteredHistory = history
    .filter(item => filter === 'all' || item.agentType === filter)
    .filter(item => 
      item.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.response.toLowerCase().includes(searchTerm.toLowerCase())
    );
  
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow animate-pulse">
        <div className="h-6 bg-gray-200 rounded mb-4 w-1/4"></div>
        <div className="space-y-6">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Chat History</h2>
        
        <div className="flex space-x-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search history..."
              className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 block w-full"
            />
          </div>
          
          <div className="inline-flex rounded-md shadow-sm">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm font-medium ${
                filter === 'all'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-gray-300 rounded-l-md`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter('SQL_AGENT')}
              className={`px-4 py-2 text-sm font-medium ${
                filter === 'SQL_AGENT'
                  ? 'bg-indigo-100 text-indigo-800'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border-t border-b border-r border-gray-300`}
            >
              SQL
            </button>
            <button
              type="button"
              onClick={() => setFilter('DOCUMENT_AGENT')}
              className={`px-4 py-2 text-sm font-medium ${
                filter === 'DOCUMENT_AGENT'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border-t border-b border-r border-gray-300 rounded-r-md`}
            >
              Document
            </button>
          </div>
        </div>
      </div>
      
      {filteredHistory.length === 0 ? (
        <div className="text-center py-12">
          <FaHistory className="mx-auto text-gray-400 text-4xl mb-4" />
          <p className="text-gray-500">No history items found</p>
          {searchTerm && (
            <p className="text-sm text-gray-400 mt-2">
              Try different search terms
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredHistory.map((item) => (
            <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  {item.agentType === 'SQL_AGENT' ? (
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <FaDatabase className="text-indigo-600" />
                    </div>
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                      <FaFileAlt className="text-green-600" />
                    </div>
                  )}
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700">
                      {item.agentType === 'SQL_AGENT' ? 'SQL Query' : 'Document Query'}
                    </p>
                    <div className="flex items-center text-xs text-gray-500">
                      <FaCalendarAlt className="mr-1" />
                      {formatDate(item.timestamp)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteHistoryItem(item.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <FaTrash />
                </button>
              </div>
              
              <div className="mt-3">
                <p className="text-sm text-gray-900 font-medium">Query:</p>
                <p className="text-sm text-gray-700 mt-1">{item.prompt}</p>
              </div>
              
              <div className="mt-3">
                <p className="text-sm text-gray-900 font-medium">Response:</p>
                <p className="text-sm text-gray-700 mt-1">{item.response}</p>
              </div>
              
              {item.hasChart && (
                <div className="mt-2 text-indigo-600 text-sm">
                  <button className="flex items-center">
                    <span className="mr-1">&#x1F4CA;</span> View chart
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History; 