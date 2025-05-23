'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { FaDatabase, FaPlus, FaEdit, FaTrash, FaCheck, FaExclamationTriangle, FaExternalLinkAlt, FaTable } from 'react-icons/fa';
import toast from 'react-hot-toast';
import CreateConnectionForm from './CreateConnectionForm';
import EditConnectionForm from './EditConnectionForm';
import ConnectionDetails from './ConnectionDetails';

type DatabaseConnection = {
  id: string;
  name: string;
  type: string;
  host: string;
  port: number;
  username: string;
  database: string;
  created_at: string;
  updated_at: string;
};

const DatabaseConnections: React.FC = () => {
  const { data: session } = useSession();
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editConnection, setEditConnection] = useState<DatabaseConnection | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{ [key: string]: { success: boolean; message: string } }>({});

  useEffect(() => {
    fetchConnections();
  }, [session]);

  const fetchConnections = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/database/connections`, {
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
        }
      });
      
      // Map response to include parsed connection details
      const connectionsWithDetails = response.data.map((conn: any) => {
        return {
          ...conn,
          // Parse connection details for display
          ...parseConnectionDetails(conn)
        };
      });
      
      console.log("Fetched connections with details:", connectionsWithDetails);
      setConnections(connectionsWithDetails);
    } catch (error) {
      console.error('Error fetching database connections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateConnection = async (newConnection: any) => {
    try {
      // Build connection string based on database type
      let connectionString = "";
      let db_type = newConnection.type;
      
      // Create proper connection strings
      if (newConnection.type === "postgresql") {
        connectionString = `postgresql://${newConnection.username}:${newConnection.password}@${newConnection.host}:${newConnection.port}/${newConnection.database}`;
      } else if (newConnection.type === "mysql") {
        connectionString = `mysql+pymysql://${newConnection.username}:${newConnection.password}@${newConnection.host}:${newConnection.port}/${newConnection.database}`;
      } else if (newConnection.type === "sqlite") {
        connectionString = `sqlite:///${newConnection.database}`;
      } else if (newConnection.type === "mongodb") {
        connectionString = `mongodb://${newConnection.username}:${newConnection.password}@${newConnection.host}:${newConnection.port}/${newConnection.database}`;
      } 
      // Add other database types as needed
      
      // Create the payload for the backend
      const connectionData = {
        name: newConnection.name,
        description: `${newConnection.type} connection to ${newConnection.database} on ${newConnection.host}`,
        db_type: db_type,
        connection_string: connectionString,
        is_active: true
      };
      
      console.log("Sending connection data:", connectionData);
      
      // Send to the correct endpoint
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/database/connections`, connectionData, {
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
        }
      });
      
      setShowCreateForm(false);
      fetchConnections();
    } catch (error: any) {
      console.error('Error creating connection:', error);
      alert(`Failed to create connection: ${error.response?.data?.detail || error.message}. Please check your inputs and try again.`);
    }
  };

  const handleUpdateConnection = async (updatedConnection: any) => {
    try {
      console.log("Updating connection with data:", updatedConnection);
      
      // Build connection string based on database type
      let connectionString = "";
      let db_type = updatedConnection.type;
      
      // Create proper connection strings
      if (updatedConnection.type === "postgresql") {
        connectionString = `postgresql://${updatedConnection.username}:${updatedConnection.password}@${updatedConnection.host}:${updatedConnection.port}/${updatedConnection.database}`;
      } else if (updatedConnection.type === "mysql") {
        connectionString = `mysql+pymysql://${updatedConnection.username}:${updatedConnection.password}@${updatedConnection.host}:${updatedConnection.port}/${updatedConnection.database}`;
      } else if (updatedConnection.type === "sqlite") {
        connectionString = `sqlite:///${updatedConnection.database}`;
      } else if (updatedConnection.type === "mongodb") {
        connectionString = `mongodb://${updatedConnection.username}:${updatedConnection.password}@${updatedConnection.host}:${updatedConnection.port}/${updatedConnection.database}`;
      }
      
      // Create the payload for the backend
      const connectionData = {
        name: updatedConnection.name,
        description: `${updatedConnection.type} connection to ${updatedConnection.database} on ${updatedConnection.host}`,
        db_type: db_type,
        connection_string: connectionString,
        is_active: true
      };
      
      // Use the PUT endpoint to update the connection
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/database/connections/${updatedConnection.id}`, 
        connectionData, 
        {
          headers: {
            'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
          }
        }
      );
      
      setEditConnection(null);
      fetchConnections();
      toast.success("Connection updated successfully");
    } catch (error) {
      console.error('Error updating connection:', error);
      toast.error('Failed to update connection. Please try again.');
    }
  };

  const handleDeleteConnection = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this connection?')) {
      return;
    }
    
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/database/connections/${id}`, {
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
        }
      });
      fetchConnections();
      if (selectedConnection === id) {
        setSelectedConnection(null);
      }
    } catch (error) {
      console.error('Error deleting connection:', error);
      alert('Failed to delete connection. Please try again.');
    }
  };

  const handleTestConnection = async (id: string, connectionType: string) => {
    try {
      console.log(`Testing connection ID: ${id}, type: ${connectionType}`);
      
      // Test connection based on type
      if (connectionType === 'mongodb') {
        // For MongoDB connections, use the old endpoint which expects ObjectId
        // This is for future implementation, currently not functional
        toast.error('MongoDB connection testing is not yet implemented');
        return;
      } else {
        // For SQL connections (postgresql, mysql, etc), use the database API
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/database/connections/${id}/test`,
          {
            headers: {
              'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
            }
          }
        );
        
        setTestResults({
          ...testResults,
          [id]: { 
            success: true, 
            message: `Successfully connected. Database is accessible.` 
          }
        });
      }
      
      // Clear the test result after 5 seconds
      setTimeout(() => {
        setTestResults(prev => {
          const newResults = { ...prev };
          delete newResults[id];
          return newResults;
        });
      }, 5000);
    } catch (error) {
      console.error('Error testing connection:', error);
      setTestResults({
        ...testResults,
        [id]: { 
          success: false, 
          message: 'Connection test failed. Please check your connection details.' 
        }
      });
    }
  };

  // Function to extract connection details from a connection string
  const parseConnectionDetails = (dbConnection: any) => {
    try {
      console.log("Parsing connection details for:", dbConnection);
      
      const connectionString = dbConnection.connection_string;
      const type = dbConnection.db_type;
      let host = 'localhost';
      let port = '5432';
      let username = '';
      let password = '';
      let database = '';
      
      // Parse connection string based on database type
      if (type === 'postgresql') {
        // Format: postgresql://username:password@host:port/database
        const regex = /postgresql:\/\/([^:]+)(?::([^@]+))?@([^:]+):(\d+)\/(.+)/;
        const matches = connectionString.match(regex);
        
        if (matches && matches.length >= 6) {
          username = matches[1] || '';
          password = matches[2] || '';
          host = matches[3] || 'localhost';
          port = matches[4] || '5432';
          database = matches[5] || '';
        }
      } else if (type === 'mysql') {
        // Format: mysql+pymysql://username:password@host:port/database
        const regex = /mysql\+pymysql:\/\/([^:]+)(?::([^@]+))?@([^:]+):(\d+)\/(.+)/;
        const matches = connectionString.match(regex);
        
        if (matches && matches.length >= 6) {
          username = matches[1] || '';
          password = matches[2] || '';
          host = matches[3] || 'localhost';
          port = matches[4] || '3306';
          database = matches[5] || '';
        }
      } else if (type === 'sqlite') {
        // Format: sqlite:///database
        const regex = /sqlite:\/\/\/(.+)/;
        const matches = connectionString.match(regex);
        
        if (matches && matches.length >= 2) {
          database = matches[1];
          host = 'local file';
          port = '0';
        }
      } else if (type === 'mongodb') {
        // Format: mongodb://username:password@host:port/database
        const regex = /mongodb:\/\/(?:([^:]+)(?::([^@]+))?@)?([^:\/]+)(?::(\d+))?(?:\/([^?]+))?/;
        const matches = connectionString.match(regex);
        
        if (matches && matches.length >= 6) {
          username = matches[1] || '';
          password = matches[2] || '';
          host = matches[3] || 'localhost';
          port = matches[4] || '27017';
          database = matches[5] || '';
        }
      }
      
      return {
        type,
        host,
        port,
        username,
        password,
        database
      };
    } catch (error) {
      console.error("Error parsing connection details:", error);
      return {
        type: dbConnection.db_type,
        host: 'localhost',
        port: '',
        username: '',
        password: '',
        database: ''
      };
    }
  };

  // Modify handleEditConnection:
  // When the Edit button is clicked
  const handleEditButton = (connection: DatabaseConnection) => {
    console.log("Editing connection:", connection);
    setEditConnection(connection);
  }

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow animate-pulse">
        <div className="h-6 bg-gray-200 rounded mb-4 w-1/4"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="flex items-center">
              <div className="h-10 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {selectedConnection ? (
        <ConnectionDetails 
          connectionId={selectedConnection} 
          onBack={() => setSelectedConnection(null)}
        />
      ) : (
        <div className="bg-white p-6 rounded-lg shadow h-full flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              <FaDatabase className="inline-block mr-2 text-blue-500" />
              Database Connections
            </h2>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded flex items-center hover:bg-blue-700 font-medium"
            >
              <FaPlus className="mr-2" /> Add Connection
            </button>
          </div>
          
          {connections.length === 0 ? (
            <div className="text-center py-8 text-gray-900 flex-grow flex flex-col items-center justify-center">
              <FaDatabase className="text-gray-400 text-5xl mb-4" />
              <p className="mb-4 text-base font-medium">No database connections yet</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded flex items-center hover:bg-blue-700 font-medium"
              >
                <FaPlus className="mr-2" /> Add Your First Connection
              </button>
            </div>
          ) : (
            <div className="overflow-auto flex-grow" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              <table className="min-w-full divide-y divide-gray-200 table-fixed">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider w-1/4">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider w-1/6">Type</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider w-1/4">Host</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider w-1/4">Database</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 uppercase tracking-wider w-1/6">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {connections.map((connection) => (
                    <tr key={connection.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900 text-base">{connection.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-800 font-medium">
                          {connection.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-base text-gray-900 font-medium">{connection.host}:{connection.port}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-base text-gray-900 font-medium">{connection.database}</div>
                      </td>
                      <td className="px-6 py-4 text-right text-base font-medium">
                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() => setSelectedConnection(connection.id)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="View Details"
                          >
                            <FaExternalLinkAlt size={18} />
                          </button>
                          <button
                            onClick={() => handleTestConnection(connection.id, connection.type)}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Test Connection"
                          >
                            <FaCheck size={18} />
                          </button>
                          <button
                            onClick={() => handleEditButton(connection)}
                            className="text-yellow-600 hover:text-yellow-900 p-1"
                            title="Edit"
                          >
                            <FaEdit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteConnection(connection.id)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Delete"
                          >
                            <FaTrash size={18} />
                          </button>
                        </div>
                        
                        {testResults[connection.id] && (
                          <div className={`mt-2 text-sm font-semibold ${testResults[connection.id].success ? 'text-green-600' : 'text-red-600'}`}>
                            {testResults[connection.id].success ? (
                              <span className="flex items-center">
                                <FaCheck className="mr-1" /> {testResults[connection.id].message}
                              </span>
                            ) : (
                              <span className="flex items-center">
                                <FaExclamationTriangle className="mr-1" /> {testResults[connection.id].message}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Create Connection Modal */}
          {showCreateForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-auto">
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Add Database Connection</h3>
                <CreateConnectionForm 
                  onSubmit={handleCreateConnection} 
                  onCancel={() => setShowCreateForm(false)} 
                />
              </div>
            </div>
          )}
          
          {/* Edit Connection Modal */}
          {editConnection && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-auto">
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Edit Database Connection</h3>
                <EditConnectionForm 
                  connection={editConnection}
                  onSubmit={handleUpdateConnection} 
                  onCancel={() => setEditConnection(null)} 
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DatabaseConnections; 