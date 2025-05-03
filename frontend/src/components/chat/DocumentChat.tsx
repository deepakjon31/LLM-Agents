'use client';

import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { FaPaperPlane, FaFileAlt, FaCheck } from 'react-icons/fa';
import { useSession } from 'next-auth/react';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: string[];
};

type Document = {
  id: string;
  filename: string;
  fileType: string;
  selected: boolean;
};

const DocumentChat: React.FC = () => {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch available documents on component mount
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
  const saveToHistory = async (prompt: string, response: string) => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/agents/history`, {
        agentType: 'DOCUMENT_AGENT',
        prompt,
        response,
        hasChart: false
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
    
    if (!input.trim() || isLoading || !hasSelectedDocuments()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    
    const userPrompt = input;
    setInput('');
    setIsLoading(true);
    
    try {
      // Send to the documents API for querying
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
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
      
      // Save the conversation to history
      await saveToHistory(userPrompt, responseData.response);
      
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
      <div className="p-4 bg-green-100 border-b">
        <h2 className="text-lg font-semibold text-green-800">Document Chat</h2>
        <p className="text-sm text-green-700 mt-1">
          Ask questions about your uploaded documents
        </p>
      </div>
      
      <div className="grid grid-cols-4 h-full">
        <div className="col-span-1 p-4 border-r overflow-y-auto">
          <h3 className="font-medium mb-3">Your Documents</h3>
          
          {documents.length === 0 ? (
            <p className="text-sm text-gray-500">No documents uploaded yet</p>
          ) : (
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li key={doc.id}>
                  <button
                    onClick={() => toggleDocumentSelection(doc.id)}
                    className={`flex items-center p-2 rounded w-full text-left text-sm ${
                      doc.selected
                        ? 'bg-green-100 text-green-800 font-medium'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="flex-shrink-0 mr-2">
                      {doc.selected ? (
                        <FaCheck className="text-green-600" />
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
        
        <div className="col-span-3 flex flex-col h-full">
          <div className="flex-1 p-4 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <FaFileAlt className="text-5xl mb-4 text-green-300" />
                <p className="text-center">
                  Select documents and ask questions about them
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
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <div className="text-base font-medium leading-relaxed">{message.content}</div>
                      
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs font-medium mb-1">Sources:</p>
                          <ul className="space-y-1">
                            {message.sources.map((source, index) => (
                              <li key={index} className="text-xs opacity-90 font-medium">
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
          
          <div className="p-4 border-t">
            <form onSubmit={handleSendMessage} className="flex">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your documents..."
                className="flex-1 px-4 py-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800 font-medium text-base"
                disabled={isLoading || !hasSelectedDocuments()}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim() || !hasSelectedDocuments()}
                className="px-4 py-2 bg-green-600 text-white rounded-r hover:bg-green-700 disabled:bg-green-300 flex items-center"
              >
                {isLoading ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  <FaPaperPlane />
                )}
              </button>
            </form>
            {!hasSelectedDocuments() && (
              <p className="mt-2 text-xs text-red-500">
                Please select at least one document to continue
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentChat; 