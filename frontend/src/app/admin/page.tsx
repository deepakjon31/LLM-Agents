'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FaUsers, FaUserTag, FaLock, FaDatabase, FaChartBar } from 'react-icons/fa';
import AdminDashboard from '@/components/admin/AdminDashboard';
import UserManagement from '@/components/admin/UserManagement';
import RoleManagement from '@/components/admin/RoleManagement';
import PermissionManagement from '@/components/admin/PermissionManagement';
import DatabaseControl from '@/components/admin/DatabaseControl';

type TabType = 'dashboard' | 'users' | 'roles' | 'permissions' | 'databases';

const AdminPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
      return;
    }

    // Check if user is admin
    const checkAdminStatus = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${(session as any)?.accessToken}`
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          setIsAdmin(userData.is_admin);
          
          if (!userData.is_admin) {
            router.push('/dashboard');
          }
        } else {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.push('/dashboard');
      }
    };
    
    checkAdminStatus();
    
  }, [session, status, router]);

  // If loading or not admin, show loading state
  if (status === 'loading' || !isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'users':
        return <UserManagement />;
      case 'roles':
        return <RoleManagement />;
      case 'permissions':
        return <PermissionManagement />;
      case 'databases':
        return <DatabaseControl />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
            <p className="text-gray-600">Manage your application settings, users, and permissions</p>
          </div>
          
          <div className="flex flex-col md:flex-row">
            {/* Sidebar */}
            <div className="w-full md:w-64 bg-gray-50 p-4 border-r">
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full flex items-center space-x-2 px-4 py-3 rounded-md text-sm font-medium ${
                    activeTab === 'dashboard' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FaChartBar className="w-5 h-5" />
                  <span>Dashboard</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('users')}
                  className={`w-full flex items-center space-x-2 px-4 py-3 rounded-md text-sm font-medium ${
                    activeTab === 'users' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FaUsers className="w-5 h-5" />
                  <span>User Management</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('roles')}
                  className={`w-full flex items-center space-x-2 px-4 py-3 rounded-md text-sm font-medium ${
                    activeTab === 'roles' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FaUserTag className="w-5 h-5" />
                  <span>Roles</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('permissions')}
                  className={`w-full flex items-center space-x-2 px-4 py-3 rounded-md text-sm font-medium ${
                    activeTab === 'permissions' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FaLock className="w-5 h-5" />
                  <span>Permissions</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('databases')}
                  className={`w-full flex items-center space-x-2 px-4 py-3 rounded-md text-sm font-medium ${
                    activeTab === 'databases' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FaDatabase className="w-5 h-5" />
                  <span>Database Controls</span>
                </button>
              </nav>
            </div>
            
            {/* Main content */}
            <div className="flex-1 p-6">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage; 