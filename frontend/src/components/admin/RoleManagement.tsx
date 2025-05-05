'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { 
  FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaUserTag, FaLock, FaUsers, FaKey
} from 'react-icons/fa';
import toast from 'react-hot-toast';

type Role = {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

type Permission = {
  id: number;
  name: string;
  description: string | null;
  resource: string;
  action: string;
};

const RoleManagement: React.FC = () => {
  const { data: session } = useSession();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [rolePermissions, setRolePermissions] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [isPermissionMode, setIsPermissionMode] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const fetchRoles = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/roles`, {
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
        }
      });
      
      setRoles(response.data);
    } catch (err) {
      console.error('Error fetching roles:', err);
      setError('Failed to load roles');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/permissions`, {
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
        }
      });
      
      setPermissions(response.data);
    } catch (err) {
      console.error('Error fetching permissions:', err);
    }
  };

  useEffect(() => {
    if (session) {
      fetchRoles();
      fetchPermissions();
    }
  }, [session]);

  const handleRoleSelect = async (roleId: number) => {
    try {
      // Get role details
      const roleResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/roles/${roleId}`, {
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
        }
      });
      
      setSelectedRole(roleResponse.data);
      setFormData({
        name: roleResponse.data.name,
        description: roleResponse.data.description || ''
      });
      
      // Get role permissions
      const permissionsResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/roles/${roleId}/permissions`,
        {
          headers: {
            'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
          }
        }
      );
      
      setRolePermissions(permissionsResponse.data.map((perm: Permission) => perm.id));
      setSelectedPermissions(permissionsResponse.data.map((perm: Permission) => perm.id));
      
    } catch (err) {
      console.error('Error fetching role details:', err);
      setError('Failed to load role details');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleCreateRole = () => {
    setSelectedRole(null);
    setIsEditMode(false);
    setIsPermissionMode(false);
    setIsCreateMode(true);
    setFormData({
      name: '',
      description: ''
    });
  };

  const handleEditToggle = () => {
    setIsEditMode(!isEditMode);
    setIsPermissionMode(false);
  };

  const handlePermissionToggle = () => {
    setIsPermissionMode(!isPermissionMode);
    setIsEditMode(false);
  };

  const handlePermissionCheck = (permissionId: number) => {
    if (selectedPermissions.includes(permissionId)) {
      setSelectedPermissions(selectedPermissions.filter(id => id !== permissionId));
    } else {
      setSelectedPermissions([...selectedPermissions, permissionId]);
    }
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isCreateMode) {
        // Create new role
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/roles`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
            }
          }
        );
        
        // Refresh roles
        await fetchRoles();
        setIsCreateMode(false);
        
        // Select the newly created role
        handleRoleSelect(response.data.id);
        
      } else if (isEditMode && selectedRole) {
        // Update existing role
        await axios.put(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/roles/${selectedRole.id}`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
            }
          }
        );
        
        // Refresh roles and role data
        await fetchRoles();
        await handleRoleSelect(selectedRole.id);
        setIsEditMode(false);
      }
    } catch (err) {
      console.error('Error saving role:', err);
      setError('Failed to save role');
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/roles/${selectedRole.id}/permissions`,
        { permission_ids: selectedPermissions },
        {
          headers: {
            'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
          }
        }
      );
      
      // Refresh role permissions
      await handleRoleSelect(selectedRole.id);
      setIsPermissionMode(false);
      
    } catch (err) {
      console.error('Error saving permissions:', err);
      setError('Failed to save permissions');
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/admin/roles/${roleId}`, {
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
        }
      });
      
      setRoles(roles.filter(role => role.id !== roleId));
      if (selectedRole && selectedRole.id === roleId) {
        setSelectedRole(null);
      }
      setShowDeleteConfirm(null);
      
    } catch (err) {
      console.error('Error deleting role:', err);
      setError('Failed to delete role');
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Role Management</h2>
      
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
      
      <div className="mb-4">
        <button
          onClick={handleCreateRole}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center"
        >
          <FaPlus className="mr-2" />
          Create New Role
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Role list */}
        <div className="md:col-span-1 bg-white rounded-lg shadow p-4 overflow-auto" style={{ maxHeight: '70vh' }}>
          <h3 className="text-lg font-medium text-gray-700 mb-4">Roles</h3>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <ul className="space-y-2">
              {roles.length > 0 ? (
                roles.map(role => (
                  <li key={role.id}>
                    <div
                      className={`flex items-center justify-between px-4 py-2 rounded ${
                        selectedRole?.id === role.id ? 'bg-indigo-100' : 'hover:bg-gray-50'
                      }`}
                    >
                      <button
                        className="flex items-center flex-1 text-left"
                        onClick={() => handleRoleSelect(role.id)}
                      >
                        <FaUserTag className={`mr-2 ${selectedRole?.id === role.id ? 'text-indigo-600' : 'text-gray-400'}`} />
                        <div>
                          <p className="font-medium">{role.name}</p>
                          {role.description && (
                            <p className="text-xs text-gray-500">{role.description}</p>
                          )}
                        </div>
                      </button>
                      
                      {showDeleteConfirm === role.id ? (
                        <div className="flex items-center">
                          <button
                            className="text-red-600 hover:text-red-800 mr-2"
                            onClick={() => handleDeleteRole(role.id)}
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
                          onClick={() => setShowDeleteConfirm(role.id)}
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  </li>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No roles available</p>
              )}
            </ul>
          )}
        </div>
        
        {/* Role details or create/edit form */}
        <div className="md:col-span-2 bg-white rounded-lg shadow p-4">
          {isCreateMode ? (
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">Create New Role</h3>
              <form onSubmit={handleSaveRole} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role Name
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
                    rows={4}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    Create Role
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
          ) : selectedRole ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-700">Role Details</h3>
                <div className="flex space-x-2">
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
                  
                  <button
                    onClick={handlePermissionToggle}
                    className={`px-3 py-1 rounded flex items-center ${
                      isPermissionMode
                        ? 'bg-gray-200 text-gray-800'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    <FaLock className="mr-1" />
                    {isPermissionMode ? 'Cancel' : 'Permissions'}
                  </button>
                </div>
              </div>
              
              {isEditMode ? (
                // Edit mode
                <form onSubmit={handleSaveRole} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role Name
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
                      rows={4}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    Save Changes
                  </button>
                </form>
              ) : isPermissionMode ? (
                // Permission assignment mode
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Assign Permissions</h4>
                  
                  {permissions.length > 0 ? (
                    <div className="max-h-96 overflow-y-auto mb-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Group permissions by resource */}
                        {Array.from(new Set(permissions.map(p => p.resource))).map(resource => (
                          <div key={resource} className="border rounded p-3">
                            <h5 className="font-medium text-gray-700 mb-2 capitalize">
                              {resource}
                            </h5>
                            <ul className="space-y-1">
                              {permissions
                                .filter(p => p.resource === resource)
                                .map(permission => (
                                  <li key={permission.id}>
                                    <label className="flex items-center p-1 rounded hover:bg-gray-50">
                                      <input
                                        type="checkbox"
                                        checked={selectedPermissions.includes(permission.id)}
                                        onChange={() => handlePermissionCheck(permission.id)}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                      />
                                      <span className="ml-2 text-sm font-medium text-gray-700">{permission.name}</span>
                                      <span className="ml-2 text-xs text-indigo-600 capitalize">{permission.action}</span>
                                    </label>
                                  </li>
                                ))
                              }
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 mb-4">No permissions available</p>
                  )}
                  
                  <button
                    onClick={handleSavePermissions}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    Save Permission Assignments
                  </button>
                </div>
              ) : (
                // Display mode
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Role Name</h4>
                    <p className="text-gray-800 text-lg">{selectedRole.name}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Description</h4>
                    <p className="text-gray-800">{selectedRole.description || 'No description provided'}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Created At</h4>
                    <p className="text-gray-800">
                      {new Date(selectedRole.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Last Updated</h4>
                    <p className="text-gray-800">
                      {new Date(selectedRole.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {/* Display assigned permissions */}
                  <div className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-500">Assigned Permissions</h4>
                      <button
                        onClick={handlePermissionToggle}
                        className="text-xs text-indigo-600 hover:text-indigo-800"
                      >
                        Edit Permissions
                      </button>
                    </div>
                    
                    {rolePermissions.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {rolePermissions.map((permissionId) => (
                          <span
                            key={permissionId}
                            className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs flex items-center"
                          >
                            <FaLock className="mr-1 text-xs" />
                            {permissions.find(p => p.id === permissionId)?.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No permissions assigned</p>
                    )}
                  </div>
                  
                  {/* Users with this role - placeholder, would need API for this */}
                  <div className="pt-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Users with this Role</h4>
                    <div className="flex items-center text-gray-500">
                      <FaUsers className="mr-2" />
                      <span>Not implemented in this version</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex justify-center items-center h-64 flex-col">
              <FaUserTag className="text-4xl text-gray-300 mb-4" />
              <p className="text-gray-500 mb-2">Select a role to view details</p>
              <p className="text-gray-400 text-sm">or</p>
              <button
                onClick={handleCreateRole}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
              >
                <FaPlus className="mr-2" />
                Create New Role
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoleManagement; 