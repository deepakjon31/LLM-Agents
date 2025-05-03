'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { 
  FaUserPlus, FaEdit, FaTrash, FaCheck, FaBan, FaUserShield, 
  FaSearch, FaTimes, FaUserTag 
} from 'react-icons/fa';

type User = {
  id: number;
  mobile_number: string;
  email: string | null;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
};

type Role = {
  id: number;
  name: string;
  description: string | null;
};

type UserWithRoles = User & {
  roles: { id: number; name: string }[];
};

const UserManagement: React.FC = () => {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showRoleAssignment, setShowRoleAssignment] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  
  // Form data for editing
  const [formData, setFormData] = useState({
    email: '',
    is_active: true,
    is_admin: false,
    password: ''
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
        }
      });
      
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/roles`, {
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
        }
      });
      
      setRoles(response.data);
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  };

  useEffect(() => {
    if (session) {
      fetchUsers();
      fetchRoles();
    }
  }, [session]);

  const handleUserSelect = async (userId: number) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
        }
      });
      
      setSelectedUser(response.data);
      setFormData({
        email: response.data.email || '',
        is_active: response.data.is_active,
        is_admin: response.data.is_admin,
        password: ''
      });
      
      // Get selected roles
      setSelectedRoles(response.data.roles.map((role: any) => role.id));
    } catch (err) {
      console.error('Error fetching user details:', err);
      setError('Failed to load user details');
    }
  };

  const handleEditToggle = () => {
    setIsEditMode(!isEditMode);
    setShowRoleAssignment(false);
  };

  const handleRoleAssignmentToggle = () => {
    setShowRoleAssignment(!showRoleAssignment);
    setIsEditMode(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleRoleToggle = (roleId: number) => {
    if (selectedRoles.includes(roleId)) {
      setSelectedRoles(selectedRoles.filter(id => id !== roleId));
    } else {
      setSelectedRoles([...selectedRoles, roleId]);
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) return;
    
    try {
      // Only include password if it's been entered
      const userData = {
        email: formData.email,
        is_active: formData.is_active,
        is_admin: formData.is_admin,
        ...(formData.password ? { password: formData.password } : {})
      };
      
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users/${selectedUser.id}`,
        userData,
        {
          headers: {
            'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
          }
        }
      );
      
      // Refresh user data
      await handleUserSelect(selectedUser.id);
      await fetchUsers();
      setIsEditMode(false);
      
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user');
    }
  };

  const handleSaveRoles = async () => {
    if (!selectedUser) return;
    
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users/${selectedUser.id}/roles`,
        { role_ids: selectedRoles },
        {
          headers: {
            'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
          }
        }
      );
      
      // Refresh user data
      await handleUserSelect(selectedUser.id);
      setShowRoleAssignment(false);
      
    } catch (err) {
      console.error('Error assigning roles:', err);
      setError('Failed to assign roles');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
        }
      });
      
      setUsers(users.filter(user => user.id !== userId));
      setSelectedUser(null);
      setShowConfirmDelete(null);
      
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user');
    }
  };

  const filteredUsers = searchTerm
    ? users.filter(user => 
        user.mobile_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : users;

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">User Management</h2>
      
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
      
      {/* Search and filter section */}
      <div className="mb-6 flex items-center">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search users by mobile or email..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
        
        <button 
          className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
          onClick={() => {
            setSelectedUser(null);
            setIsEditMode(false);
            setShowRoleAssignment(false);
          }}
        >
          <FaUserPlus className="mr-2" />
          Add User
        </button>
      </div>
      
      {/* Main content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User list */}
        <div className="md:col-span-1 bg-white rounded-lg shadow p-4 overflow-auto max-h-[70vh]">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Users</h3>
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <ul className="space-y-2">
              {filteredUsers.map(user => (
                <li key={user.id}>
                  <button
                    onClick={() => handleUserSelect(user.id)}
                    className={`w-full text-left px-4 py-2 rounded-lg flex items-center justify-between ${
                      selectedUser?.id === user.id
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="mr-3">
                        {user.is_admin ? (
                          <FaUserShield className="text-indigo-600" />
                        ) : (
                          <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{user.mobile_number}</p>
                        <p className="text-xs text-gray-500">{user.email || 'No email'}</p>
                      </div>
                    </div>
                    
                    {showConfirmDelete === user.id ? (
                      <div className="flex items-center">
                        <button 
                          className="text-red-600 hover:text-red-800 mr-2" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteUser(user.id);
                          }}
                        >
                          <FaCheck />
                        </button>
                        <button 
                          className="text-gray-600 hover:text-gray-800" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowConfirmDelete(null);
                          }}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ) : (
                      <button 
                        className="text-red-600 hover:text-red-800" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowConfirmDelete(user.id);
                        }}
                      >
                        <FaTrash />
                      </button>
                    )}
                  </button>
                </li>
              ))}
              
              {filteredUsers.length === 0 && (
                <p className="text-gray-500 text-center py-4">No users found</p>
              )}
            </ul>
          )}
        </div>
        
        {/* User details */}
        <div className="md:col-span-2 bg-white rounded-lg shadow p-4">
          {selectedUser ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-700">User Details</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={handleEditToggle}
                    className={`px-3 py-1 rounded-lg flex items-center ${
                      isEditMode 
                        ? 'bg-gray-200 text-gray-800' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    <FaEdit className="mr-1" />
                    {isEditMode ? 'Cancel' : 'Edit'}
                  </button>
                  
                  <button
                    onClick={handleRoleAssignmentToggle}
                    className={`px-3 py-1 rounded-lg flex items-center ${
                      showRoleAssignment 
                        ? 'bg-gray-200 text-gray-800' 
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                  >
                    <FaUserTag className="mr-1" />
                    {showRoleAssignment ? 'Cancel' : 'Roles'}
                  </button>
                </div>
              </div>
              
              {isEditMode ? (
                // Edit Form
                <form onSubmit={handleSaveUser} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mobile Number (read-only)
                    </label>
                    <input
                      type="text"
                      value={selectedUser.mobile_number}
                      readOnly
                      className="w-full px-3 py-2 border rounded-lg bg-gray-100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password (leave blank to keep unchanged)
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Active</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="is_admin"
                        checked={formData.is_admin}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Admin</span>
                    </label>
                  </div>
                  
                  <div className="pt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : showRoleAssignment ? (
                // Role Assignment
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Assign Roles</h4>
                  
                  <div className="max-h-64 overflow-y-auto mb-4">
                    {roles.length > 0 ? (
                      <ul className="space-y-2">
                        {roles.map(role => (
                          <li key={role.id}>
                            <label className="flex items-center p-2 rounded hover:bg-gray-50">
                              <input
                                type="checkbox"
                                checked={selectedRoles.includes(role.id)}
                                onChange={() => handleRoleToggle(role.id)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm font-medium text-gray-700">{role.name}</span>
                              {role.description && (
                                <span className="ml-2 text-xs text-gray-500">{role.description}</span>
                              )}
                            </label>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500">No roles available</p>
                    )}
                  </div>
                  
                  <button
                    onClick={handleSaveRoles}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Save Role Assignments
                  </button>
                </div>
              ) : (
                // Display Mode
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Mobile Number</h4>
                      <p className="text-gray-800">{selectedUser.mobile_number}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Email</h4>
                      <p className="text-gray-800">{selectedUser.email || 'Not provided'}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Status</h4>
                      <div className="flex items-center">
                        {selectedUser.is_active ? (
                          <>
                            <FaCheck className="text-green-500 mr-1" />
                            <span className="text-green-700">Active</span>
                          </>
                        ) : (
                          <>
                            <FaBan className="text-red-500 mr-1" />
                            <span className="text-red-700">Inactive</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Admin</h4>
                      <div className="flex items-center">
                        {selectedUser.is_admin ? (
                          <>
                            <FaUserShield className="text-indigo-600 mr-1" />
                            <span className="text-indigo-700">Yes</span>
                          </>
                        ) : (
                          <span className="text-gray-600">No</span>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Created At</h4>
                      <p className="text-gray-800">
                        {new Date(selectedUser.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {/* Display assigned roles */}
                  <div className="pt-2">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Assigned Roles</h4>
                    {selectedUser.roles && selectedUser.roles.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedUser.roles.map((role) => (
                          <span
                            key={role.id}
                            className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs"
                          >
                            {role.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No roles assigned</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex justify-center items-center h-64 flex-col">
              <p className="text-gray-500 mb-4">Select a user to view details</p>
              <p className="text-gray-400 text-sm">or</p>
              <button 
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
              >
                <FaUserPlus className="mr-2" />
                Add a new user
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement; 