'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { FaDatabase, FaTable, FaArrowLeft, FaPlay, FaRobot, FaSync, FaChartBar } from 'react-icons/fa';

interface ConnectionDetailsProps {
  connectionId: string;
  onBack: () => void;
}

type DatabaseTable = {
  name: string;
  schema: string;
};

type DatabaseConnection = {
  id: string;
  name: string;
  type: string;
  host: string;
  port: number;
  username: string;
  database: string;
};

type QueryResult = {
  columns: string[];
  rows: any[][];
};

const ConnectionDetails: React.FC<ConnectionDetailsProps> = ({ connectionId, onBack }) => {
  const { data: session } = useSession();
  const [connection, setConnection] = useState<DatabaseConnection | null>(null);
  const [tables, setTables] = useState<DatabaseTable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tables' | 'query' | 'ai-query'>('tables');
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [sqlQuery, setSqlQuery] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [aiQueryResult, setAiQueryResult] = useState<{
    prompt: string;
    sql_query: string;
    results: QueryResult;
  } | null>(null);
  const [isExecutingQuery, setIsExecutingQuery] = useState(false);
  const [isExecutingAIQuery, setIsExecutingAIQuery] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConnectionDetails();
    fetchTables();
  }, [connectionId, session]);

  const fetchConnectionDetails = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/database/connections/${connectionId}`, {
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
        }
      });
      setConnection(response.data);
    } catch (error) {
      console.error('Error fetching connection details:', error);
      setError('Failed to load connection details');
    }
  };

  const fetchTables = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/database/connections/${connectionId}/tables`, {
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
        }
      });
      setTables(response.data);
    } catch (error) {
      console.error('Error fetching tables:', error);
      setError('Failed to load database tables');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTableSelection = (tableName: string) => {
    if (selectedTables.includes(tableName)) {
      setSelectedTables(selectedTables.filter(t => t !== tableName));
    } else {
      setSelectedTables([...selectedTables, tableName]);
    }
  };

  const executeQuery = async () => {
    if (!sqlQuery.trim()) return;
    
    setIsExecutingQuery(true);
    setError(null);
    
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/database/connections/${connectionId}/query`,
        { query: sqlQuery },
        {
          headers: {
            'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
          }
        }
      );
      
      setQueryResult(response.data);
    } catch (error) {
      console.error('Error executing query:', error);
      setError('Query execution failed');
      setQueryResult(null);
    } finally {
      setIsExecutingQuery(false);
    }
  };

  const executeAIQuery = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsExecutingAIQuery(true);
    setError(null);
    
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/database/connections/${connectionId}/ai-query`,
        { 
          prompt: aiPrompt,
          tables: selectedTables.length > 0 ? selectedTables : undefined
        },
        {
          headers: {
            'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
          }
        }
      );
      
      setAiQueryResult(response.data);
    } catch (error) {
      console.error('Error executing AI query:', error);
      setError('AI Query execution failed');
      setAiQueryResult(null);
    } finally {
      setIsExecutingAIQuery(false);
    }
  };

  if (isLoading && !connection) {
    return (
      <div className="bg-white p-6 rounded-lg shadow animate-pulse">
        <div className="h-6 bg-gray-200 rounded mb-4 w-1/4"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex items-center">
              <div className="h-10 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="mr-4 text-gray-600 hover:text-gray-800"
            title="Back to connections"
          >
            <FaArrowLeft size={20} />
          </button>
          <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
            <FaDatabase className="mr-2 text-blue-500" />
            {connection?.name || 'Database Connection'}
          </h2>
        </div>
        <div className="text-base text-gray-900 flex items-center space-x-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
            {connection?.type}
          </span>
          <span className="font-medium">{connection?.host}:{connection?.port}</span>
          <span className="font-medium">{connection?.database}</span>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b mb-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('tables')}
            className={`px-4 py-2 text-base font-medium flex items-center ${
              activeTab === 'tables'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            <FaTable className="mr-2" /> Database Tables
          </button>
          <button
            onClick={() => setActiveTab('query')}
            className={`px-4 py-2 text-base font-medium flex items-center ${
              activeTab === 'query'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            <FaPlay className="mr-2" /> SQL Query
          </button>
          <button
            onClick={() => setActiveTab('ai-query')}
            className={`px-4 py-2 text-base font-medium flex items-center ${
              activeTab === 'ai-query'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            <FaRobot className="mr-2" /> AI Query
          </button>
        </div>
      </div>
      
      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md font-semibold text-base">
          {error}
        </div>
      )}
      
      {/* Tab content */}
      <div className="flex-1 overflow-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        {activeTab === 'tables' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">Tables in {connection?.database}</h3>
              <button
                onClick={fetchTables}
                className="flex items-center text-blue-600 hover:text-blue-800 text-base font-medium"
                title="Refresh tables"
              >
                <FaSync className="mr-1" /> Refresh
              </button>
            </div>
            
            {isLoading ? (
              <div className="animate-pulse space-y-2">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="h-10 bg-gray-100 rounded"></div>
                ))}
              </div>
            ) : tables.length === 0 ? (
              <div className="text-center py-8 text-gray-900 text-base font-medium">
                <p>No tables found in this database</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tables.map((table) => (
                  <div
                    key={table.name}
                    onClick={() => toggleTableSelection(table.name)}
                    className={`p-4 border rounded-md cursor-pointer transition-colors ${
                      selectedTables.includes(table.name)
                        ? 'bg-blue-50 border-blue-300'
                        : 'hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center">
                      <FaTable className={`mr-3 text-lg ${
                        selectedTables.includes(table.name)
                          ? 'text-blue-500'
                          : 'text-gray-500'
                      }`} />
                      <div>
                        <div className="font-semibold text-base text-gray-900">{table.name}</div>
                        <div className="text-sm text-gray-700 font-medium">{table.schema}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'query' && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">SQL Query</h3>
            
            <div>
              <textarea
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                placeholder="Enter your SQL query here..."
                className="w-full h-40 p-3 border border-gray-300 rounded-md font-mono text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="text-right">
              <button
                onClick={executeQuery}
                disabled={isExecutingQuery || !sqlQuery.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded flex items-center ml-auto disabled:bg-blue-300 hover:bg-blue-700 text-base font-medium"
              >
                {isExecutingQuery ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span> Executing...
                  </>
                ) : (
                  <>
                    <FaPlay className="mr-2" /> Execute Query
                  </>
                )}
              </button>
            </div>
            
            {queryResult && (
              <div className="mt-8">
                <h4 className="text-lg font-semibold mb-3 text-gray-900">Query Results</h4>
                <div className="overflow-x-auto border rounded">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        {queryResult.columns.map((column, i) => (
                          <th 
                            key={i}
                            className="px-6 py-3 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider"
                          >
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {queryResult.rows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-gray-50">
                          {row.map((cell, cellIndex) => (
                            <td 
                              key={cellIndex}
                              className="px-6 py-4 text-base text-gray-900"
                            >
                              {cell !== null ? String(cell) : <em className="text-gray-500">null</em>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'ai-query' && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">AI Query</h3>
            
            {selectedTables.length === 0 && (
              <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md text-base font-semibold">
                No tables selected. Select tables in the "Database Tables" tab to improve query accuracy.
              </div>
            )}
            
            <div>
              <label className="block text-base font-semibold text-gray-900 mb-1">
                Ask a question in plain English
              </label>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="E.g. Show me the top 5 customers by order value"
                className="w-full h-24 p-3 border border-gray-300 rounded-md text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="text-right">
              <button
                onClick={executeAIQuery}
                disabled={isExecutingAIQuery || !aiPrompt.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded flex items-center ml-auto disabled:bg-blue-300 hover:bg-blue-700 text-base font-medium"
              >
                {isExecutingAIQuery ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span> Processing...
                  </>
                ) : (
                  <>
                    <FaRobot className="mr-2" /> Run AI Query
                  </>
                )}
              </button>
            </div>
            
            {aiQueryResult && (
              <div className="mt-8 space-y-4">
                <div>
                  <h4 className="text-lg font-semibold mb-2 text-gray-900">Generated SQL Query</h4>
                  <div className="p-4 bg-gray-50 border rounded-md font-mono text-base text-gray-900 overflow-x-auto">
                    {aiQueryResult.sql_query}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold mb-3 text-gray-900">Query Results</h4>
                  <div className="overflow-x-auto border rounded">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          {aiQueryResult.results.columns.map((column, i) => (
                            <th 
                              key={i}
                              className="px-6 py-3 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider"
                            >
                              {column}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {aiQueryResult.results.rows.map((row, rowIndex) => (
                          <tr key={rowIndex} className="hover:bg-gray-50">
                            {row.map((cell, cellIndex) => (
                              <td 
                                key={cellIndex}
                                className="px-6 py-4 text-base text-gray-900"
                              >
                                {cell !== null ? String(cell) : <em className="text-gray-500">null</em>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectionDetails; 