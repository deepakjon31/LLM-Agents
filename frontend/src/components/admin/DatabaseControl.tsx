'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { 
  FaDatabase, FaEye, FaUser, FaSearch, FaExclamationCircle, 
  FaPlus, FaEdit, FaTrash, FaCheck, FaTimes 
} from 'react-icons/fa';

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
  user_id: number;
};

type User = {
  id: number;
  mobile_number: string;
  email: string | null;
};

const DatabaseControl: React.FC = () => {
  const { data: session } = useSession();
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      fetchAllConnections();
      fetchUsers();
    }
  }, [session]);

  const fetchAllConnections = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/database/all-connections`, {
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
        }
      });
      
      setConnections(response.data);
    } catch (err) {
      console.error('Error fetching database connections:', err);
      setError('Failed to load database connections');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
        }
      });
      
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleUserSelect = async (userId: number) => {
    setSelectedUserId(userId);
    
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/database/user-connections/${userId}`, {
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
        }
      });
      
      setConnections(response.data);
    } catch (err) {
      console.error('Error fetching user connections:', err);
      setError(`Failed to load connections for user ID ${userId}`);
    }
  };

  const handleResetFilter = () => {
    setSelectedUserId(null);
    fetchAllConnections();
  };

  const handleDeleteConnection = async (connectionId: string) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/admin/database/connections/${connectionId}`, {
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
        }
      });
      
      // Refresh connections
      if (selectedUserId) {
        await handleUserSelect(selectedUserId);
      } else {
        await fetchAllConnections();
      }
      
      setShowDeleteConfirm(null);
      
    } catch (err) {
      console.error('Error deleting connection:', err);
      setError('Failed to delete connection');
    }
  };

  const filteredConnections = searchTerm.trim() !== ''
    ? connections.filter(conn => 
        conn.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conn.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conn.host.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conn.database.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : connections;

  const getUserById = (userId: number) => {
    return users.find(user => user.id === userId);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Database Connection Control</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
          <button
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={() => setError(null)}
          >
            <FaTimes />
          </button>
        </div>
      )}
      
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search bar - spans 2 columns */}
        <div className="md:col-span-2 relative">
          <input
            type="text"
            placeholder="Search connections..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
        
        {/* User filter dropdown - spans 1 column */}
        <div className="md:col-span-1">
          <select
            value={selectedUserId || ''}
            onChange={(e) => e.target.value ? handleUserSelect(parseInt(e.target.value)) : handleResetFilter()}
            className="w-full pl-3 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Users</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.mobile_number} {user.email ? `(${user.email})` : ''}
              </option>
            ))}
          </select>
        </div>
        
        {/* Reset filter button - spans 1 column */}
        <div className="md:col-span-1 flex">
          <button
            onClick={handleResetFilter}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 flex items-center justify-center"
            disabled={!selectedUserId}
          >
            <FaTimes className="mr-2" />
            Reset Filters
          </button>
        </div>
      </div>
      
      {/* Database connections table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Database Connections {selectedUserId && <span className="text-sm text-indigo-600">
              (Filtered by User ID: {selectedUserId})
            </span>}
          </h3>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            {filteredConnections.length} connections
          </span>
        </div>
        
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : filteredConnections.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Host / Database
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredConnections.map((connection) => {
                  const owner = getUserById(connection.user_id);
                  
                  return (
                    <tr key={connection.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FaDatabase className="text-indigo-500 mr-2" />
                          <div className="text-sm font-medium text-gray-900">{connection.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {connection.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{connection.host}:{connection.port}</div>
                        <div className="text-sm text-gray-500">{connection.database}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {owner ? (
                          <div className="flex items-center">
                            <FaUser className="text-gray-400 mr-1" />
                            <div className="text-sm text-gray-500">{owner.mobile_number}</div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">User ID: {connection.user_id}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(connection.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button 
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <FaEye />
                          </button>
                          <button 
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit Connection"
                          >
                            <FaEdit />
                          </button>
                          
                          {showDeleteConfirm === connection.id ? (
                            <>
                              <button
                                onClick={() => handleDeleteConnection(connection.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Confirm Delete"
                              >
                                <FaCheck />
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="text-gray-600 hover:text-gray-900"
                                title="Cancel"
                              >
                                <FaTimes />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setShowDeleteConfirm(connection.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <FaExclamationCircle className="text-gray-400 text-3xl mb-2" />
              <p className="text-gray-500">No database connections found</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-6 bg-white shadow rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Admin Controls</h3>
        <p className="text-gray-600 mb-4">
          As an administrator, you can manage database connections for all users. This includes viewing, editing, and deleting connections.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="bg-indigo-50 p-4 rounded border border-indigo-100">
            <h4 className="font-medium text-indigo-800 mb-2 flex items-center">
              <FaDatabase className="mr-2" /> Connection Management
            </h4>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>• View all database connections across users</li>
              <li>• Filter connections by user</li>
              <li>• Delete problematic or outdated connections</li>
              <li>• Edit connection settings as needed</li>
            </ul>
          </div>
          
          <div className="bg-green-50 p-4 rounded border border-green-100">
            <h4 className="font-medium text-green-800 mb-2 flex items-center">
              <FaUser className="mr-2" /> User Access Control
            </h4>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>• Control which users can create new connections</li>
              <li>• Set limits on database connections per user</li>
              <li>• Monitor connection usage patterns</li>
              <li>• Integrate with role-based permissions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseControl; 