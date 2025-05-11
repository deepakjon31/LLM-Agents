'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import UserManagement from './UserManagement';
import RoleManagement from './RoleManagement';
import PermissionManagement from './PermissionManagement';
import { sessionHasAdminAccess } from '@/utils/adminUtils';

type AdminTab = 'users' | 'roles' | 'permissions';

const AdminPanel: React.FC = () => {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [isAdmin, setIsAdmin] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check admin access using utility function
    if (session) {
      try {
        const hasAccess = sessionHasAdminAccess(session);
        console.debug('Admin access check in AdminPanel:', { 
          hasAccess, 
          session: {
            user: {
              role: session.user?.role,
              permissions: session.user?.permissions,
              is_admin: session.user?.is_admin
            }
          } 
        });
        setIsAdmin(hasAccess);
        
        if (!hasAccess) {
          setErrorMessage('You do not have admin privileges. Please contact an administrator.');
        }
      } catch (error) {
        console.error('Error checking admin access:', error);
        setErrorMessage('Error determining admin access. Please try again later.');
        setIsAdmin(false);
      }
    }
  }, [session]);

  // Redirect or show access denied if not authenticated or not admin
  if (status === 'loading') {
    return <div className="p-6">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <div className="py-10">
          <h3 className="text-xl font-medium text-red-600">Authentication Required</h3>
          <p className="mt-2 text-gray-600">
            Please log in to access this page.
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <div className="py-10">
          <h3 className="text-xl font-medium text-red-600">Access Denied</h3>
          <p className="mt-2 text-gray-600">
            {errorMessage || 'You do not have permission to access the admin panel.'}
          </p>
          <div className="mt-4 p-4 bg-gray-100 rounded text-left">
            <p className="font-semibold">Debug Info:</p>
            <p>Role: {session.user?.role || 'None'}</p>
            <p>Admin Flag: {session.user?.is_admin ? 'True' : 'False'}</p>
            <p>Permissions: {Array.isArray(session.user?.permissions) 
              ? session.user.permissions.join(', ') 
              : 'None'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Admin tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('users')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'users'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'roles'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            Roles
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'permissions'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            Permissions
          </button>
        </nav>
      </div>

      {/* Tab content */}
      <div className="p-6">
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'roles' && <RoleManagement />}
        {activeTab === 'permissions' && <PermissionManagement />}
      </div>
    </div>
  );
};

export default AdminPanel; 