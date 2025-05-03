'use client';

import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { FaPaperPlane, FaFileAlt, FaCheck, FaUpload, FaPlus, FaTimes } from 'react-icons/fa';
import { useSession } from 'next-auth/react';
import DocumentUpload from '@/components/documents/DocumentUpload';

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
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch available documents on component mount
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

  useEffect(() => {
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

  const handleUploadSuccess = () => {
    fetchDocuments();
    setShowUploadModal(false);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 bg-green-100 border-b">
        <h2 className="text-lg font-semibold text-green-800 flex items-center">
          <FaFileAlt className="mr-2" /> Document Chat
        </h2>
        <p className="text-sm text-green-700 mt-1">
          Ask questions about your uploaded documents
        </p>
      </div>
      
      <div className="grid grid-cols-4 h-full">
        <div className="col-span-1 p-4 border-r overflow-y-auto">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">Your Documents</h3>
            <button 
              onClick={() => setShowUploadModal(true)}
              className="p-1.5 text-green-600 hover:bg-green-50 rounded-full transition-colors"
              title="Upload new document"
            >
              <FaPlus size={14} />
            </button>
          </div>
          
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <FaFileAlt className="mx-auto text-gray-300 text-4xl mb-2" />
              <p className="text-sm text-gray-500 mb-3">No documents uploaded yet</p>
              <button 
                onClick={() => setShowUploadModal(true)} 
                className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center mx-auto"
              >
                <FaUpload className="mr-2" size={14} />
                Upload Document
              </button>
            </div>
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
                    <div className="truncate">{doc.filename}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="col-span-3 flex flex-col h-full">
          {/* Chat messages area */}
          <div className="flex-1 p-4 overflow-y-auto" style={{ scrollBehavior: 'smooth' }}>
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <FaFileAlt className="text-green-200 text-6xl mb-6" />
                <h3 className="text-xl font-medium text-gray-700 mb-3">
                  Document Chat Assistant
                </h3>
                <p className="text-gray-500 max-w-md">
                  Select one or more documents from the sidebar and ask questions about them.
                  I'll analyze the content and provide relevant answers based on their contents.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-3/4 rounded-lg p-4 shadow-sm ${
                        message.role === 'user'
                          ? 'bg-green-100 text-green-900'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs font-medium text-gray-500 mb-2">Sources:</p>
                          <ul className="space-y-1.5">
                            {message.sources.map((source, index) => (
                              <li key={index} className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-200">
                                {source}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500 mt-2 text-right">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
          
          {/* Input area */}
          <div className="p-4 border-t bg-gray-50">
            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  hasSelectedDocuments()
                    ? "Type your question about the selected documents..."
                    : "Please select a document first"
                }
                disabled={!hasSelectedDocuments() || isLoading}
                className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
              />
              <button
                type="submit"
                disabled={!hasSelectedDocuments() || !input.trim() || isLoading}
                className={`p-3 rounded-lg flex items-center justify-center w-12 ${
                  hasSelectedDocuments() && input.trim() && !isLoading
                    ? 'bg-green-600 text-white hover:bg-green-700 transition-colors'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                ) : (
                  <FaPaperPlane />
                )}
              </button>
            </form>
            {!hasSelectedDocuments() && (
              <p className="mt-2 text-xs text-amber-600">
                Please select at least one document from the sidebar to chat
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Document Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <h3 className="text-lg font-medium flex items-center">
                <FaUpload className="text-green-600 mr-2" size={16} /> Upload Document
              </h3>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <FaTimes />
              </button>
            </div>
            <div className="p-6">
              <DocumentUpload onUploadSuccess={handleUploadSuccess} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentChat; 