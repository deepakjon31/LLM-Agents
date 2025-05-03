'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { 
  FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaLock, FaFilter 
} from 'react-icons/fa';

type Permission = {
  id: number;
  name: string;
  description: string | null;
  resource: string;
  action: string;
  created_at: string;
  updated_at: string;
};

const RESOURCES = ['users', 'roles', 'permissions', 'documents', 'databases'];
const ACTIONS = ['create', 'read', 'update', 'delete', 'manage'];

const PermissionManagement: React.FC = () => {
  const { data: session } = useSession();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [filteredResource, setFilteredResource] = useState<string | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    resource: '',
    action: ''
  });

  const fetchPermissions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/permissions${filteredResource ? `?resource=${filteredResource}` : ''}`,
        {
          headers: {
            'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
          }
        }
      );
      
      setPermissions(response.data);
    } catch (err) {
      console.error('Error fetching permissions:', err);
      setError('Failed to load permissions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchPermissions();
    }
  }, [session, filteredResource]);

  const handlePermissionSelect = async (permissionId: number) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/permissions/${permissionId}`, {
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
        }
      });
      
      setSelectedPermission(response.data);
      setFormData({
        name: response.data.name,
        description: response.data.description || '',
        resource: response.data.resource,
        action: response.data.action
      });
      
    } catch (err) {
      console.error('Error fetching permission details:', err);
      setError('Failed to load permission details');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleCreatePermission = () => {
    setSelectedPermission(null);
    setIsEditMode(false);
    setIsCreateMode(true);
    setFormData({
      name: '',
      description: '',
      resource: '',
      action: ''
    });
  };

  const handleEditToggle = () => {
    setIsEditMode(!isEditMode);
  };

  const handleFilterChange = (resource: string | null) => {
    setFilteredResource(resource);
    setSelectedPermission(null);
  };

  const handleSavePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isCreateMode) {
        // Create new permission
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/permissions`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
            }
          }
        );
        
        // Refresh permissions
        await fetchPermissions();
        setIsCreateMode(false);
        
        // Select the newly created permission
        handlePermissionSelect(response.data.id);
        
      } else if (isEditMode && selectedPermission) {
        // Update existing permission
        await axios.put(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/permissions/${selectedPermission.id}`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
            }
          }
        );
        
        // Refresh permissions and permission data
        await fetchPermissions();
        await handlePermissionSelect(selectedPermission.id);
        setIsEditMode(false);
      }
    } catch (err) {
      console.error('Error saving permission:', err);
      setError('Failed to save permission');
    }
  };

  const handleDeletePermission = async (permissionId: number) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/admin/permissions/${permissionId}`, {
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
        }
      });
      
      setPermissions(permissions.filter(permission => permission.id !== permissionId));
      if (selectedPermission && selectedPermission.id === permissionId) {
        setSelectedPermission(null);
      }
      setShowDeleteConfirm(null);
      
    } catch (err) {
      console.error('Error deleting permission:', err);
      setError('Failed to delete permission');
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Permission Management</h2>
      
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
      
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={handleCreatePermission}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center"
        >
          <FaPlus className="mr-2" />
          Create New Permission
        </button>
        
        <div className="flex items-center">
          <label className="mr-2 text-gray-600 font-medium">
            <FaFilter className="inline mr-1" />
            Filter by Resource:
          </label>
          <select
            value={filteredResource || ''}
            onChange={(e) => handleFilterChange(e.target.value || null)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Resources</option>
            {RESOURCES.map(resource => (
              <option key={resource} value={resource}>{resource}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Permission list */}
        <div className="md:col-span-1 bg-white rounded-lg shadow p-4 overflow-auto" style={{ maxHeight: '70vh' }}>
          <h3 className="text-lg font-medium text-gray-700 mb-4">Permissions</h3>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <ul className="space-y-2">
              {permissions.length > 0 ? (
                permissions.map(permission => (
                  <li key={permission.id}>
                    <div
                      className={`flex items-center justify-between px-4 py-2 rounded ${
                        selectedPermission?.id === permission.id ? 'bg-indigo-100' : 'hover:bg-gray-50'
                      }`}
                    >
                      <button
                        className="flex items-center flex-1 text-left"
                        onClick={() => handlePermissionSelect(permission.id)}
                      >
                        <FaLock className={`mr-2 ${selectedPermission?.id === permission.id ? 'text-indigo-600' : 'text-gray-400'}`} />
                        <div>
                          <p className="font-medium">{permission.name}</p>
                          <div className="flex text-xs mt-1">
                            <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full mr-1 capitalize">
                              {permission.resource}
                            </span>
                            <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full capitalize">
                              {permission.action}
                            </span>
                          </div>
                        </div>
                      </button>
                      
                      {showDeleteConfirm === permission.id ? (
                        <div className="flex items-center">
                          <button
                            className="text-red-600 hover:text-red-800 mr-2"
                            onClick={() => handleDeletePermission(permission.id)}
                          >
                            <FaCheck />
                          </button>
                          <button
                            className="text-gray-600 hover:text-gray-800"
                            onClick={() => setShowDeleteConfirm(null)}
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ) : (
                        <button
                          className="text-red-600 hover:text-red-800"
                          onClick={() => setShowDeleteConfirm(permission.id)}
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  </li>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No permissions available</p>
              )}
            </ul>
          )}
        </div>
        
        {/* Permission details or create/edit form */}
        <div className="md:col-span-2 bg-white rounded-lg shadow p-4">
          {isCreateMode ? (
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">Create New Permission</h3>
              <form onSubmit={handleSavePermission} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Permission Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., can_view_users"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., Allows viewing user list and details"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Resource
                    </label>
                    <select
                      name="resource"
                      value={formData.resource}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select a resource</option>
                      {RESOURCES.map(resource => (
                        <option key={resource} value={resource}>{resource}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Action
                    </label>
                    <select
                      name="action"
                      value={formData.action}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select an action</option>
                      {ACTIONS.map(action => (
                        <option key={action} value={action}>{action}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    Create Permission
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreateMode(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : selectedPermission ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-700">Permission Details</h3>
                <button
                  onClick={handleEditToggle}
                  className={`px-3 py-1 rounded flex items-center ${
                    isEditMode
                      ? 'bg-gray-200 text-gray-800'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  <FaEdit className="mr-1" />
                  {isEditMode ? 'Cancel' : 'Edit'}
                </button>
              </div>
              
              {isEditMode ? (
                // Edit mode
                <form onSubmit={handleSavePermission} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Permission Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Resource
                      </label>
                      <select
                        name="resource"
                        value={formData.resource}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select a resource</option>
                        {RESOURCES.map(resource => (
                          <option key={resource} value={resource}>{resource}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Action
                      </label>
                      <select
                        name="action"
                        value={formData.action}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select an action</option>
                        {ACTIONS.map(action => (
                          <option key={action} value={action}>{action}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    Save Changes
                  </button>
                </form>
              ) : (
                // Display mode
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Permission Name</h4>
                    <p className="text-gray-800 text-lg">{selectedPermission.name}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Description</h4>
                    <p className="text-gray-800">{selectedPermission.description || 'No description provided'}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Resource</h4>
                      <p className="text-gray-800 capitalize">{selectedPermission.resource}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Action</h4>
                      <p className="text-gray-800 capitalize">{selectedPermission.action}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Created At</h4>
                    <p className="text-gray-800">
                      {new Date(selectedPermission.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Last Updated</h4>
                    <p className="text-gray-800">
                      {new Date(selectedPermission.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      This permission controls access to <span className="font-medium capitalize">{selectedPermission.action}</span> operations on <span className="font-medium capitalize">{selectedPermission.resource}</span>.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex justify-center items-center h-64 flex-col">
              <FaLock className="text-4xl text-gray-300 mb-4" />
              <p className="text-gray-500 mb-2">Select a permission to view details</p>
              <p className="text-gray-400 text-sm">or</p>
              <button
                onClick={handleCreatePermission}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
              >
                <FaPlus className="mr-2" />
                Create New Permission
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PermissionManagement; 