'use client';

import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { FaPaperPlane, FaDatabase, FaFileAlt, FaPlus, FaTimes, FaCheck } from 'react-icons/fa';
import { Bar } from 'react-chartjs-2';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import '@/utils/chartConfig';
import { formatChartData } from '@/utils/chartConfig';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register the required Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Unified types
type DatabaseConnection = {
  id: string;
  name: string;
  type: string;
  host: string;
  port: number;
  username: string;
  database: string;
};

type Document = {
  id: string;
  filename: string;
  fileType: string;
  selected: boolean;
};

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  chartData?: any;
  sourceConnections?: string[];
  sources?: string[];
  chatType: 'sql' | 'document';
};

type ChatMode = 'sql' | 'document';

const UnifiedChat: React.FC = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // SQL chat state
  const [selectedConnections, setSelectedConnections] = useState<string[]>([]);
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState(true);
  
  // Document chat state
  const [documents, setDocuments] = useState<Document[]>([]);
  
  // Active chat mode
  const [activeMode, setActiveMode] = useState<ChatMode>('sql');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch database connections on component mount
  useEffect(() => {
    const fetchConnections = async () => {
      setIsLoadingConnections(true);
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/database/connections`, {
          headers: {
            'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
          }
        });
        setConnections(response.data);
      } catch (error) {
        console.error('Error fetching database connections:', error);
      } finally {
        setIsLoadingConnections(false);
      }
    };

    if (session) {
      fetchConnections();
    }
  }, [session]);

  // Fetch documents on component mount
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/documents/list`, {
          headers: {
            'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
          }
        });
        
        // Transform the API response to match our expected structure
        const docsFromApi = response.data.map((doc: any) => ({
          id: doc.id,
          filename: doc.filename,
          fileType: doc.file_type,
          selected: false
        }));
        
        setDocuments(docsFromApi);
      } catch (error) {
        console.error('Error fetching documents:', error);
      }
    };

    if (session) {
      fetchDocuments();
    }
  }, [session]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  };

  useEffect(() => {
    // Only auto-scroll when new messages are added
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  // SQL chat functions
  const handleAddConnection = () => {
    router.push('/dashboard?tab=database-connections');
  };

  const toggleConnectionSelection = (connectionId: string) => {
    if (selectedConnections.includes(connectionId)) {
      setSelectedConnections(selectedConnections.filter(id => id !== connectionId));
    } else {
      setSelectedConnections([...selectedConnections, connectionId]);
    }
  };

  // Document chat functions
  const toggleDocumentSelection = (id: string) => {
    setDocuments(docs => 
      docs.map(doc => 
        doc.id === id ? { ...doc, selected: !doc.selected } : doc
      )
    );
  };

  const getSelectedDocumentIds = (): string[] => {
    return documents.filter(doc => doc.selected).map(doc => doc.id);
  };

  const hasSelectedDocuments = (): boolean => {
    return documents.some(doc => doc.selected);
  };

  // Save conversation to history
  const saveToHistory = async (prompt: string, response: string, chatType: ChatMode, hasChart: boolean = false) => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/agents/history`, {
        agentType: chatType === 'sql' ? 'SQL_AGENT' : 'DOCUMENT_AGENT',
        prompt,
        response,
        hasChart
      }, {
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
        }
      });
      
      console.log('Conversation saved to history');
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    // Check if valid resources are selected based on mode
    if (activeMode === 'sql' && selectedConnections.length === 0) return;
    if (activeMode === 'document' && !hasSelectedDocuments()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      chatType: activeMode,
      ...(activeMode === 'sql' ? { sourceConnections: [...selectedConnections] } : {})
    };
    
    setMessages((prev) => [...prev, userMessage]);
    
    const userPrompt = input;
    setInput('');
    setIsLoading(true);
    
    try {
      if (activeMode === 'sql') {
        // SQL Chat logic
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Get selected connection details for mock data
        const selectedConnectionNames = selectedConnections.map(connId => {
          const conn = connections.find(c => c.id === connId);
          return conn ? `${conn.name} (${conn.type})` : connId;
        }).join(", ");
        
        // Simulate a response from the multi-query endpoint
        let mockVisualization = null;
        let mockResponse = '';
        
        // Generate mock data based on query content
        if (userPrompt.toLowerCase().includes('sales') || 
            userPrompt.toLowerCase().includes('revenue') || 
            userPrompt.toLowerCase().includes('total')) {
          mockResponse = `The total sales across ${selectedConnections.length} databases (${selectedConnectionNames}) for the past month are $125,463.`;
          mockVisualization = {
            type: 'bar',
            data: {
              labels: selectedConnectionNames.split(', '),
              datasets: [{
                label: 'Sales by Database ($)',
                data: selectedConnections.map(() => Math.floor(Math.random() * 50000) + 10000),
                backgroundColor: ['rgba(54, 162, 235, 0.5)', 'rgba(75, 192, 192, 0.5)', 'rgba(153, 102, 255, 0.5)'],
                borderColor: ['rgb(54, 162, 235)', 'rgb(75, 192, 192)', 'rgb(153, 102, 255)'],
                borderWidth: 1
              }]
            }
          };
        } else if (userPrompt.toLowerCase().includes('customer') || 
                  userPrompt.toLowerCase().includes('user')) {
          mockResponse = `Across ${selectedConnections.length} databases (${selectedConnectionNames}), we have 256 active customers, with 45 new customers added this month.`;
          if (selectedConnections.length > 1) {
            mockVisualization = {
              type: 'bar',
              data: {
                labels: selectedConnectionNames.split(', '),
                datasets: [{
                  label: 'Customer Count',
                  data: selectedConnections.map(() => Math.floor(Math.random() * 100) + 50),
                  backgroundColor: ['rgba(75, 192, 192, 0.5)', 'rgba(153, 102, 255, 0.5)', 'rgba(255, 159, 64, 0.5)'],
                  borderColor: ['rgb(75, 192, 192)', 'rgb(153, 102, 255)', 'rgb(255, 159, 64)'],
                  borderWidth: 1
                }]
              }
            };
          }
        } else if (userPrompt.toLowerCase().includes('product') || 
                  userPrompt.toLowerCase().includes('item') || 
                  userPrompt.toLowerCase().includes('inventory')) {
          mockResponse = `Looking at ${selectedConnections.length} databases (${selectedConnectionNames}), the top-selling product this month is "Premium Widget" with 1,200 units sold.`;
        } else if (userPrompt.toLowerCase().includes('compare') || 
                  userPrompt.toLowerCase().includes('comparison')) {
          mockResponse = `Comparison across ${selectedConnections.length} databases (${selectedConnectionNames}): The PostgreSQL database shows 15% higher performance metrics compared to MySQL.`;
          mockVisualization = {
            type: 'bar',
            data: {
              labels: selectedConnectionNames.split(', '),
              datasets: [{
                label: 'Performance Score',
                data: selectedConnections.map(() => Math.floor(Math.random() * 100) + 50),
                backgroundColor: ['rgba(153, 102, 255, 0.5)', 'rgba(255, 159, 64, 0.5)', 'rgba(54, 162, 235, 0.5)'],
                borderColor: ['rgb(153, 102, 255)', 'rgb(255, 159, 64)', 'rgb(54, 162, 235)'],
                borderWidth: 1
              }]
            }
          };
        } else {
          mockResponse = `I've queried ${selectedConnections.length} databases (${selectedConnectionNames}), but couldn't find relevant information. Please try a different query.`;
        }
        
        // Convert visualization format for ChartJS if needed
        let mockChartData = null;
        if (mockVisualization) {
          // Use our utility function to format the chart data
          mockChartData = formatChartData(mockVisualization);
          console.log('Chart data generated:', mockChartData);
        }
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: mockResponse,
          timestamp: new Date(),
          chartData: mockChartData,
          sourceConnections: [...selectedConnections],
          chatType: 'sql'
        };
        
        setMessages((prev) => [...prev, assistantMessage]);
        
        // Save the conversation to history
        await saveToHistory(userPrompt, mockResponse, 'sql', !!mockChartData);
      } else {
        // Document Chat logic
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/documents/query`,
          {
            prompt: userPrompt,
            document_ids: getSelectedDocumentIds()
          },
          {
            headers: {
              'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
            }
          }
        );
        
        const responseData = response.data;
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: responseData.response,
          timestamp: new Date(),
          sources: responseData.sources.map((source: any) => `${source.filename}: ${source.chunk_text}`),
          chatType: 'document'
        };
        
        setMessages((prev) => [...prev, assistantMessage]);
        
        // Save the conversation to history
        await saveToHistory(userPrompt, responseData.response, 'document');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, there was an error processing your request. Please try again.',
        timestamp: new Date(),
        chatType: activeMode
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Get the selected connection objects
  const selectedConnectionDetails = selectedConnections.map(connId => 
    connections.find(conn => conn.id === connId)
  ).filter(conn => conn !== undefined) as DatabaseConnection[];

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow overflow-hidden">
      {/* Header with mode toggle */}
      <div className="p-4 bg-indigo-100 border-b flex flex-col flex-shrink-0 z-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setActiveMode('sql')}
              className={`px-3 py-1 rounded-full font-medium transition-colors ${
                activeMode === 'sql' 
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-200 text-indigo-800 hover:bg-indigo-300'
              }`}
            >
              <FaDatabase className="inline-block mr-2" />
              SQL
            </button>
            <button
              onClick={() => setActiveMode('document')}
              className={`px-3 py-1 rounded-full font-medium transition-colors ${
                activeMode === 'document' 
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-200 text-indigo-800 hover:bg-indigo-300'
              }`}
            >
              <FaFileAlt className="inline-block mr-2" />
              Documents
            </button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-4 h-full overflow-hidden">
        {/* Sidebar - always visible but content changes based on mode */}
        <div className="col-span-1 p-4 border-r overflow-y-auto h-full max-h-[calc(100vh-200px)]">
          {activeMode === 'sql' ? (
            /* SQL Mode Sidebar */
            <div>
              <h3 className="font-medium mb-3">Database Connections</h3>
              
              {connections.length === 0 ? (
                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-2">No connections available</p>
                  <button
                    onClick={handleAddConnection}
                    className="px-3 py-1 w-full bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center text-sm justify-center"
                  >
                    <FaPlus className="mr-1" />
                    Add Connection
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-gray-700">Available Connections</p>
                    <button
                      onClick={handleAddConnection}
                      className="p-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center text-sm"
                      title="Add new database connection"
                    >
                      <FaPlus size={12} />
                    </button>
                  </div>
                  
                  <ul className="space-y-2 overflow-y-auto">
                    {connections.map((conn) => (
                      <li key={conn.id}>
                        <button
                          onClick={() => toggleConnectionSelection(conn.id)}
                          className={`flex items-center p-2 rounded w-full text-left text-sm ${
                            selectedConnections.includes(conn.id)
                              ? 'bg-indigo-100 text-indigo-800 font-medium'
                              : 'hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          <div className="flex-shrink-0 mr-2">
                            {selectedConnections.includes(conn.id) ? (
                              <FaCheck className="text-indigo-600" />
                            ) : (
                              <FaDatabase className="text-gray-400" />
                            )}
                          </div>
                          <div className="truncate font-medium">{conn.name}</div>
                          <div className="text-xs text-gray-500 ml-auto">{conn.type}</div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            /* Document Mode Sidebar */
            <div>
              <h3 className="font-medium mb-3">Your Documents</h3>
              
              {documents.length === 0 ? (
                <p className="text-sm text-gray-500">No documents uploaded yet</p>
              ) : (
                <ul className="space-y-2 overflow-y-auto">
                  {documents.map((doc) => (
                    <li key={doc.id}>
                      <button
                        onClick={() => toggleDocumentSelection(doc.id)}
                        className={`flex items-center p-2 rounded w-full text-left text-sm ${
                          doc.selected
                            ? 'bg-indigo-100 text-indigo-800 font-medium'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <div className="flex-shrink-0 mr-2">
                          {doc.selected ? (
                            <FaCheck className="text-indigo-600" />
                          ) : (
                            <FaFileAlt className="text-gray-400" />
                          )}
                        </div>
                        <div className="truncate font-medium">{doc.filename}</div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        
        {/* Message area - consistent across both modes */}
        <div className="col-span-3 flex flex-col h-full overflow-hidden">
          <div className="flex-1 p-4 overflow-y-auto min-h-0" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                {activeMode === 'sql' ? (
                  <>
                    <FaDatabase className="text-5xl mb-4 text-indigo-300" />
                    {connections.length === 0 ? (
                      <div className="text-center">
                        <p className="mb-3">No database connections available.</p>
                        <button
                          onClick={handleAddConnection}
                          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                          Add Your First Connection
                        </button>
                      </div>
                    ) : (
                      <p className="text-center">
                        Select one or more database connections and ask a question.
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <FaFileAlt className="text-5xl mb-4 text-indigo-300" />
                    <p className="text-center">
                      Select documents and ask questions about them
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    } ${message.chartData ? 'w-full' : ''}`}
                  >
                    <div
                      className={`p-3 rounded-lg ${message.chartData ? 'w-full max-w-full' : 'max-w-3/4'} ${
                        message.role === 'user'
                          ? message.chatType === 'sql' 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <div className="text-base font-medium leading-relaxed">{message.content}</div>
                      
                      {/* SQL Chart visualization */}
                      {message.chartData && (
                        <div className="mt-4 bg-white p-3 rounded border border-indigo-300 shadow-sm">
                          <div className="w-full h-80" style={{ minHeight: '300px' }}>
                            <Bar
                              data={message.chartData}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                  y: {
                                    beginAtZero: true,
                                    ticks: {
                                      color: '#111827',
                                      font: {
                                        weight: 500
                                      }
                                    },
                                    grid: {
                                      color: 'rgba(0, 0, 0, 0.1)'
                                    }
                                  },
                                  x: {
                                    ticks: {
                                      color: '#111827',
                                      font: {
                                        weight: 500
                                      }
                                    },
                                    grid: {
                                      color: 'rgba(0, 0, 0, 0.1)'
                                    }
                                  }
                                },
                                plugins: {
                                  legend: {
                                    position: 'top',
                                    labels: {
                                      color: '#111827',
                                      font: {
                                        size: 14,
                                        weight: 'bold'
                                      }
                                    }
                                  },
                                  title: {
                                    display: true,
                                    text: 'Database Comparison',
                                    color: '#111827',
                                    font: {
                                      size: 16,
                                      weight: 'bold'
                                    }
                                  },
                                },
                              }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* SQL DB sources */}
                      {message.sourceConnections && message.sourceConnections.length > 0 && (
                        <div className="mt-2 text-xs">
                          <span className={`${message.role === 'user' ? 'text-indigo-200' : 'text-indigo-500'} font-medium`}>
                            Sources: 
                          </span>
                          <span className={`${message.role === 'user' ? 'text-indigo-100' : 'text-indigo-400'} ml-1`}>
                            {message.sourceConnections.map(connId => {
                              const conn = connections.find(c => c.id === connId);
                              return conn ? conn.name : connId;
                            }).join(", ")}
                          </span>
                        </div>
                      )}
                      
                      {/* Document sources */}
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-indigo-200">
                          <p className="text-xs font-medium mb-1 text-indigo-600">Sources:</p>
                          <ul className="space-y-1">
                            {message.sources.map((source, index) => (
                              <li key={index} className="text-xs opacity-90 font-medium text-indigo-700">
                                {source}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="text-xs mt-1 opacity-90 font-medium">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
          
          <div className="p-4 border-t flex-shrink-0 bg-white sticky bottom-0">
            <form onSubmit={handleSendMessage} className="flex">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={activeMode === 'sql' 
                  ? (selectedConnections.length > 0 ? "Ask about your SQL databases..." : "Select at least one database connection first")
                  : "Ask about your documents..."
                }
                className={`flex-1 px-4 py-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 font-medium text-base`}
                disabled={isLoading || (activeMode === 'sql' && selectedConnections.length === 0) || (activeMode === 'document' && !hasSelectedDocuments())}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim() || (activeMode === 'sql' && selectedConnections.length === 0) || (activeMode === 'document' && !hasSelectedDocuments())}
                className={`px-4 py-2 text-white rounded-r flex items-center bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300`}
              >
                {isLoading ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  <FaPaperPlane />
                )}
              </button>
            </form>
            
            {(activeMode === 'sql' && selectedConnections.length === 0) && (
              <p className="mt-2 text-xs text-indigo-600">
                Please select at least one database connection to continue
              </p>
            )}
            
            {(activeMode === 'document' && !hasSelectedDocuments()) && (
              <p className="mt-2 text-xs text-indigo-600">
                Please select at least one document to continue
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedChat;