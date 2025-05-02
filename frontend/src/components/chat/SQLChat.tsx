'use client';

import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { FaPaperPlane, FaDatabase } from 'react-icons/fa';
import { Chart } from 'chart.js/auto';
import { Bar } from 'react-chartjs-2';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  chartData?: any;
};

const SQLChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDatabase, setSelectedDatabase] = useState<string | null>(null);
  const [databases, setDatabases] = useState<{ id: string; name: string }[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch available databases on component mount
  useEffect(() => {
    const fetchDatabases = async () => {
      try {
        // Dummy data for now - would be fetched from API
        setDatabases([
          { id: '1', name: 'Sample Sales Database' },
          { id: '2', name: 'Customer Analytics' },
        ]);
      } catch (error) {
        console.error('Error fetching databases:', error);
      }
    };

    fetchDatabases();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // In a real app, send to the API
      // const response = await axios.post('/api/agents/sql', {
      //   prompt: input,
      //   database_id: selectedDatabase,
      // });
      
      // Mock response for demo
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      let mockChartData = null;
      let mockResponse = '';
      
      // Simulate response based on query
      if (input.toLowerCase().includes('total sales')) {
        mockResponse = 'The total sales for the past month are $125,463.';
        mockChartData = {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [
            {
              label: 'Sales ($)',
              data: [12000, 19000, 15000, 25000, 22000, 30000],
              backgroundColor: 'rgba(54, 162, 235, 0.5)',
            },
          ],
        };
      } else if (input.toLowerCase().includes('customer')) {
        mockResponse = 'We have 256 active customers, with 45 new customers added this month.';
      } else if (input.toLowerCase().includes('product')) {
        mockResponse = 'The top-selling product this month is "Premium Widget" with 1,200 units sold.';
      } else {
        mockResponse = 'I\'m sorry, I couldn\'t find relevant information in the database. Please try a different query.';
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: mockResponse,
        timestamp: new Date(),
        chartData: mockChartData,
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
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

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 bg-indigo-100 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-indigo-800">SQL Database Chat</h2>
          <select
            value={selectedDatabase || ''}
            onChange={(e) => setSelectedDatabase(e.target.value)}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="">Select a database</option>
            {databases.map((db) => (
              <option key={db.id} value={db.id}>
                {db.name}
              </option>
            ))}
          </select>
        </div>
        <p className="text-sm text-indigo-700 mt-1">
          Ask questions about your SQL database in natural language
        </p>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <FaDatabase className="text-5xl mb-4 text-indigo-300" />
            <p className="text-center">
              No messages yet. Ask a question about your database.
            </p>
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
                  <div className="text-sm">{message.content}</div>
                  
                  {message.chartData && (
                    <div className="mt-4 bg-white p-3 rounded">
                      <Bar
                        data={message.chartData}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: {
                              position: 'top',
                            },
                            title: {
                              display: true,
                              text: 'Monthly Sales Data',
                            },
                          },
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="text-xs mt-1 opacity-70">
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
            placeholder="Ask about your SQL database..."
            className="flex-1 px-4 py-2 border rounded-l focus:outline-none focus:ring-1 focus:ring-indigo-500"
            disabled={isLoading || !selectedDatabase}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || !selectedDatabase}
            className="px-4 py-2 bg-indigo-600 text-white rounded-r hover:bg-indigo-700 disabled:bg-indigo-300 flex items-center"
          >
            {isLoading ? (
              <span className="animate-pulse">...</span>
            ) : (
              <FaPaperPlane />
            )}
          </button>
        </form>
        {!selectedDatabase && (
          <p className="mt-2 text-xs text-red-500">
            Please select a database to continue
          </p>
        )}
      </div>
    </div>
  );
};

export default SQLChat; 