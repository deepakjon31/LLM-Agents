'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { 
  FaUserPlus, FaEdit, FaTrash, FaCheck, FaBan, FaUserShield, 
  FaSearch, FaTimes, FaUserTag, FaUsersCog 
} from 'react-icons/fa';
import toast from 'react-hot-toast';

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
  description?: string;
};

type UserWithRoles = User & {
  roles: Role[];
};

// New user form data type
type NewUserFormData = {
  mobile_number: string;
  email: string;
  password: string;
  is_admin: boolean;
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
  const [userRoles, setUserRoles] = useState<number[]>([]);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  
  // State for the new user form
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [newUserFormData, setNewUserFormData] = useState<NewUserFormData>({
    mobile_number: '',
    email: '',
    password: '',
    is_admin: false
  });

  // Function to handle form field changes for new user
  const handleNewUserFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setNewUserFormData({
      ...newUserFormData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Function to create a new user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users`,
        newUserFormData,
        {
          headers: {
            'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
          }
        }
      );
      
      // Add the new user to the users list and refresh
      await fetchUsers();
      
      // Reset form and close the create mode
      setNewUserFormData({
        mobile_number: '',
        email: '',
        password: '',
        is_admin: false
      });
      setIsCreateMode(false);
      
      toast.success('User created successfully');
    } catch (err: any) {
      console.error('Error creating user:', err);
      toast.error(`Failed to create user: ${err.response?.data?.detail || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch users
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
        }
      });
      setUsers(response.data);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message);
      toast.error(`Failed to fetch users: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch roles
  const fetchRoles = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/roles`, {
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
        }
      });
      setRoles(response.data);
    } catch (err: any) {
      console.error('Error fetching roles:', err);
      toast.error(`Failed to fetch roles: ${err.message}`);
    }
  };

  useEffect(() => {
    if (session) {
      fetchUsers();
      fetchRoles();
    }
  }, [session]);

  // Function to filter users by search term
  const filteredUsers = searchTerm
    ? users.filter(
        user => 
          user.mobile_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : users;

  // Function to handle form field changes
  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedUser) return;
    
    const { name, value, type, checked } = e.target;
    setSelectedUser({
      ...selectedUser,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Function to fetch user roles
  const fetchUserRoles = async (userId: number) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}/roles`, {
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
        }
      });
      // Get role IDs
      const roleIds = response.data.map((role: Role) => role.id);
      setUserRoles(roleIds);
      setSelectedRoles(roleIds);
    } catch (err: any) {
      console.error('Error fetching user roles:', err);
      toast.error(`Failed to fetch user roles: ${err.message}`);
    }
  };

  // Function to handle user selection for editing
  const handleSelectUser = async (user: User) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
        }
      });
      const userData = response.data as UserWithRoles;
      setSelectedUser(userData);
      await fetchUserRoles(user.id);
    } catch (err: any) {
      console.error('Error fetching user details:', err);
      toast.error(`Failed to fetch user details: ${err.message}`);
    }
  };

  // Function to save user changes
  const handleSaveUser = async () => {
    if (!selectedUser) return;
    
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users/${selectedUser.id}`,
        {
          email: selectedUser.email,
          is_active: selectedUser.is_active,
          is_admin: selectedUser.is_admin
        },
        {
          headers: {
            'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
          }
        }
      );
      
      // Update the user list
      fetchUsers();
      setIsEditMode(false);
      toast.success('User updated successfully');
    } catch (err: any) {
      console.error('Error updating user:', err);
      toast.error(`Failed to update user: ${err.message}`);
    }
  };

  // Function to handle user deletion
  const handleDeleteUser = async (userId: number) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
        }
      });
      
      // Update the user list
      setUsers(users.filter(u => u.id !== userId));
      setShowConfirmDelete(null);
      if (selectedUser?.id === userId) {
        setSelectedUser(null);
        setIsEditMode(false);
      }
      toast.success('User deleted successfully');
    } catch (err: any) {
      console.error('Error deleting user:', err);
      toast.error(`Failed to delete user: ${err.message}`);
    }
  };

  // Function to toggle role selection
  const handleRoleToggle = (roleId: number) => {
    if (selectedRoles.includes(roleId)) {
      setSelectedRoles(selectedRoles.filter(id => id !== roleId));
    } else {
      setSelectedRoles([...selectedRoles, roleId]);
    }
  };

  // Function to save role assignments
  const handleSaveRoles = async () => {
    if (!selectedUser) return;
    
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users/${selectedUser.id}/roles`,
        {
          user_id: selectedUser.id,
          role_ids: selectedRoles
        },
        {
          headers: {
            'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
          }
        }
      );
      
      setShowRoleAssignment(false);
      setUserRoles(selectedRoles);
      toast.success('User roles updated successfully');
    } catch (err: any) {
      console.error('Error assigning roles:', err);
      toast.error(`Failed to assign roles: ${err.message}`);
    }
  };

  // Render function
  return (
    <div className="flex flex-col md:flex-row gap-4 p-4">
      {/* User List */}
      <div className="w-full md:w-1/2 bg-white p-4 rounded shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Users</h2>
          <button 
            onClick={() => setIsCreateMode(true)} 
            className="bg-green-500 text-white p-2 rounded flex items-center gap-1"
          >
            <FaUserPlus /> New User
          </button>
        </div>
        
        {/* Search */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search by phone or email..."
            className="w-full p-2 pl-10 border rounded"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
          {searchTerm && (
            <button 
              className="absolute right-3 top-3 text-gray-400"
              onClick={() => setSearchTerm('')}
            >
              <FaTimes />
            </button>
          )}
        </div>
        
        {/* User Table */}
        {isLoading ? (
          <div className="text-center py-4">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-500 py-4">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Phone</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-center">Admin</th>
                  <th className="px-4 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-2 text-center">No users found</td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr 
                      key={user.id} 
                      className={`border-t hover:bg-gray-50 ${selectedUser?.id === user.id ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-4 py-2">{user.mobile_number}</td>
                      <td className="px-4 py-2">{user.email || '-'}</td>
                      <td className="px-4 py-2 text-center">
                        {user.is_admin ? (
                          <FaCheck className="inline text-green-500" />
                        ) : (
                          <FaTimes className="inline text-red-500" />
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <div className="flex justify-center space-x-2">
                          <button 
                            onClick={() => {
                              handleSelectUser(user);
                              setIsEditMode(true);
                            }}
                            className="text-blue-500 hover:text-blue-700"
                            title="Edit User"
                          >
                            <FaEdit />
                          </button>
                          <button 
                            onClick={() => {
                              handleSelectUser(user);
                              setShowRoleAssignment(true);
                            }}
                            className="text-purple-500 hover:text-purple-700"
                            title="Manage Roles"
                          >
                            <FaUserTag />
                          </button>
                          <button 
                            onClick={() => setShowConfirmDelete(user.id)}
                            className="text-red-500 hover:text-red-700"
                            title="Delete User"
                          >
                            <FaTrash />
                          </button>
                          {showConfirmDelete === user.id && (
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                              <div className="bg-white p-4 rounded shadow-lg max-w-md mx-4">
                                <h3 className="text-lg font-bold mb-2">Confirm Delete</h3>
                                <p>Are you sure you want to delete user {user.mobile_number}?</p>
                                <div className="flex justify-end space-x-2 mt-4">
                                  <button 
                                    onClick={() => setShowConfirmDelete(null)}
                                    className="bg-gray-300 text-black px-4 py-2 rounded"
                                  >
                                    Cancel
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="bg-red-500 text-white px-4 py-2 rounded"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* User Detail / Edit Form */}
      <div className="w-full md:w-1/2 bg-white p-4 rounded shadow">
        {isCreateMode ? (
          // Create User Form
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Create New User</h2>
              <button 
                onClick={() => setIsCreateMode(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Mobile Number *</label>
                <input
                  type="text"
                  name="mobile_number"
                  value={newUserFormData.mobile_number}
                  onChange={handleNewUserFormChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={newUserFormData.email}
                  onChange={handleNewUserFormChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Password *</label>
                <input
                  type="password"
                  name="password"
                  value={newUserFormData.password}
                  onChange={handleNewUserFormChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  id="is_admin"
                  name="is_admin"
                  checked={newUserFormData.is_admin}
                  onChange={handleNewUserFormChange}
                  className="mr-2"
                />
                <label htmlFor="is_admin" className="text-gray-700">Admin User</label>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsCreateMode(false)}
                  className="bg-gray-300 text-black px-4 py-2 rounded mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-500 text-white px-4 py-2 rounded flex items-center gap-1"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating...' : <>Create User <FaUserPlus /></>}
                </button>
              </div>
            </form>
          </div>
        ) : isEditMode && selectedUser ? (
          // Edit User Form
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit User</h2>
              <button 
                onClick={() => setIsEditMode(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Mobile Number</label>
              <input
                type="text"
                value={selectedUser.mobile_number}
                className="w-full p-2 border rounded bg-gray-100"
                disabled
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={selectedUser.email || ''}
                onChange={handleFieldChange}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div className="mb-4 flex items-center">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={selectedUser.is_active}
                onChange={handleFieldChange}
                className="mr-2"
              />
              <label htmlFor="is_active" className="text-gray-700">Active</label>
            </div>
            
            <div className="mb-4 flex items-center">
              <input
                type="checkbox"
                id="is_admin"
                name="is_admin"
                checked={selectedUser.is_admin}
                onChange={handleFieldChange}
                className="mr-2"
              />
              <label htmlFor="is_admin" className="text-gray-700">Admin</label>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setIsEditMode(false)}
                className="bg-gray-300 text-black px-4 py-2 rounded mr-2"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUser}
                className="bg-blue-500 text-white px-4 py-2 rounded flex items-center gap-1"
              >
                Save <FaCheck />
              </button>
            </div>
          </div>
        ) : showRoleAssignment && selectedUser ? (
          // Role Assignment Form
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Manage Roles: {selectedUser.mobile_number}</h2>
              <button 
                onClick={() => setShowRoleAssignment(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Assign Roles</h3>
              {roles.length === 0 ? (
                <p>No roles available</p>
              ) : (
                <div className="space-y-2">
                  {roles.map(role => (
                    <div key={role.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`role-${role.id}`}
                        checked={selectedRoles.includes(role.id)}
                        onChange={() => handleRoleToggle(role.id)}
                        className="mr-2"
                      />
                      <label htmlFor={`role-${role.id}`} className="flex-1">
                        <span className="font-medium">{role.name}</span>
                        {role.description && (
                          <span className="text-sm text-gray-500 block">{role.description}</span>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowRoleAssignment(false)}
                className="bg-gray-300 text-black px-4 py-2 rounded mr-2"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRoles}
                className="bg-purple-500 text-white px-4 py-2 rounded flex items-center gap-1"
              >
                Save Roles <FaUserShield />
              </button>
            </div>
          </div>
        ) : selectedUser ? (
          // User Detail View
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">User Details</h2>
              <button 
                onClick={() => setSelectedUser(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-500">ID</label>
              <div>{selectedUser.id}</div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-500">Mobile Number</label>
              <div>{selectedUser.mobile_number}</div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-500">Email</label>
              <div>{selectedUser.email || '-'}</div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-500">Status</label>
              <div>
                {selectedUser.is_active ? (
                  <span className="text-green-500 font-medium">Active</span>
                ) : (
                  <span className="text-red-500 font-medium">Inactive</span>
                )}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-500">Admin</label>
              <div>
                {selectedUser.is_admin ? (
                  <span className="text-green-500 font-medium">Yes</span>
                ) : (
                  <span className="text-gray-500 font-medium">No</span>
                )}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-500">Created At</label>
              <div>{new Date(selectedUser.created_at).toLocaleString()}</div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-500">Roles</label>
              <div className="flex flex-wrap gap-1 mt-1">
                {userRoles.length > 0 ? (
                  roles
                    .filter(role => userRoles.includes(role.id))
                    .map(role => (
                      <div key={role.id} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        {role.name}
                      </div>
                    ))
                ) : (
                  <span className="text-gray-500">No roles assigned</span>
                )}
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setIsEditMode(true);
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded flex items-center gap-1"
              >
                Edit <FaEdit />
              </button>
            </div>
          </div>
        ) : (
          // No user selected
          <div className="text-center py-8 text-gray-500">
            <FaUsersCog className="text-5xl mx-auto mb-2 text-gray-300" />
            <p>Select a user to view details</p>
            <p className="text-sm">or click "New User" to create one</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement; 