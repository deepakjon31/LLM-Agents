'use client';

import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { FaPaperPlane, FaDatabase, FaPlus, FaTimes } from 'react-icons/fa';
import { Bar } from 'react-chartjs-2';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import '@/utils/chartConfig';
import { formatChartData } from '@/utils/chartConfig';

type DatabaseConnection = {
  id: string;
  name: string;
  type: string;
  host: string;
  port: number;
  username: string;
  database: string;
};

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  chartData?: any;
  sourceConnections?: string[];
};

const SQLChat: React.FC = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedConnections, setSelectedConnections] = useState<string[]>([]);
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch available database connections on component mount
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

    fetchConnections();
  }, [session]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Save conversation to history
  const saveToHistory = async (prompt: string, response: string, hasChart: boolean = false) => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/agents/history`, {
        agentType: 'SQL_AGENT',
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading || selectedConnections.length === 0) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      sourceConnections: [...selectedConnections]
    };
    
    setMessages((prev) => [...prev, userMessage]);
    
    const userPrompt = input;
    setInput('');
    setIsLoading(true);
    
    try {
      /* 
      // Use the multi-database query endpoint
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/database/multi-query`,
        { 
          prompt: input,
          connectionIds: selectedConnections 
        },
        {
          headers: {
            'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
          }
        }
      );
      
      // In a real implementation, we would process the response:
      // - Display the summary in the message
      // - Show the visualization if available
      // - Store the detailed results for further exploration
      */
      
      // For demo purposes, we're using a mock implementation
      // In a production environment, this would call the actual /database/multi-query endpoint
      
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
              backgroundColor: 'rgba(54, 162, 235, 0.5)',
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
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
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
              backgroundColor: 'rgba(153, 102, 255, 0.5)',
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
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: mockResponse,
        timestamp: new Date(),
        chartData: mockChartData,
        sourceConnections: [...selectedConnections]
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
      
      // Save the conversation to history
      await saveToHistory(userPrompt, mockResponse, !!mockChartData);
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, there was an error processing your request. Please try again.',
        timestamp: new Date(),
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
      <div className="p-4 bg-indigo-100 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-indigo-800">SQL Database Chat</h2>
          
          <div className="flex items-center space-x-2">
            <div className="relative">
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    toggleConnectionSelection(e.target.value);
                    e.target.value = ""; // Reset select after selection
                  }
                }}
                className="px-3 py-1 border rounded text-sm font-medium text-gray-900 bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isLoadingConnections}
              >
                <option value="">Add database connection</option>
                {connections
                  .filter(conn => !selectedConnections.includes(conn.id))
                  .map((conn) => (
                    <option key={conn.id} value={conn.id}>
                      {conn.name} ({conn.type})
                    </option>
                  ))}
              </select>
            </div>
            
            <button
              onClick={handleAddConnection}
              className="px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center text-sm"
              title="Add new database connection"
            >
              <FaPlus />
            </button>
          </div>
        </div>
        
        {selectedConnectionDetails.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedConnectionDetails.map(conn => (
              <div key={conn.id} className="inline-flex items-center bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-sm">
                <span className="mr-1">{conn.name} ({conn.type})</span>
                <button
                  onClick={() => toggleConnectionSelection(conn.id)}
                  className="text-indigo-500 hover:text-indigo-700"
                >
                  <FaTimes size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        
        <p className="text-sm text-indigo-700 mt-2">
          Ask questions across multiple SQL databases in natural language
        </p>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
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
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-3/4 p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="text-base font-medium leading-relaxed">{message.content}</div>
                  
                  {message.chartData && (
                    <div className="mt-4 bg-white p-3 rounded">
                      <div className="w-full h-64">
                        <Bar
                          data={message.chartData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                              y: {
                                beginAtZero: true
                              }
                            },
                            plugins: {
                              legend: {
                                position: 'top',
                                labels: {
                                  font: {
                                    size: 14,
                                    weight: 'bold'
                                  }
                                }
                              },
                              title: {
                                display: true,
                                text: 'Database Comparison',
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
      
      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={selectedConnections.length > 0 ? "Ask about your SQL databases..." : "Select at least one database connection first"}
            className="flex-1 px-4 py-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 font-medium text-base"
            disabled={isLoading || selectedConnections.length === 0}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || selectedConnections.length === 0}
            className="px-4 py-2 bg-indigo-600 text-white rounded-r hover:bg-indigo-700 disabled:bg-indigo-300 flex items-center"
          >
            {isLoading ? (
              <span className="animate-pulse">...</span>
            ) : (
              <FaPaperPlane />
            )}
          </button>
        </form>
        {selectedConnections.length === 0 && (
          <p className="mt-2 text-xs text-red-500">
            Please select at least one database connection to continue
          </p>
        )}
      </div>
    </div>
  );
};

export default SQLChat; 