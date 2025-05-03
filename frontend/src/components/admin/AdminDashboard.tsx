'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { FaUsers, FaDatabase, FaFileAlt, FaUserTag, FaLock } from 'react-icons/fa';

type DashboardStats = {
  total_users: number;
  active_users: number;
  total_documents: number;
  total_databases: number;
  total_roles: number;
  total_permissions: number;
};

const AdminDashboard: React.FC = () => {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/dashboard/stats`, {
          headers: {
            'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
          }
        });
        
        setStats(response.data);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Failed to load dashboard statistics');
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchStats();
    }
  }, [session]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error:</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Admin Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* User Stats Card */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-500 mr-4">
              <FaUsers className="text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500 uppercase font-semibold">Users</p>
              <div className="flex items-center">
                <p className="text-2xl font-bold text-gray-700">{stats?.total_users || 0}</p>
                <p className="text-sm ml-2 text-gray-500">
                  ({stats?.active_users || 0} active)
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Database Stats Card */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-500 mr-4">
              <FaDatabase className="text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500 uppercase font-semibold">Databases</p>
              <p className="text-2xl font-bold text-gray-700">{stats?.total_databases || 0}</p>
            </div>
          </div>
        </div>
        
        {/* Document Stats Card */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-500 mr-4">
              <FaFileAlt className="text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500 uppercase font-semibold">Documents</p>
              <p className="text-2xl font-bold text-gray-700">{stats?.total_documents || 0}</p>
            </div>
          </div>
        </div>
        
        {/* Role Stats Card */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-500 mr-4">
              <FaUserTag className="text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500 uppercase font-semibold">Roles</p>
              <p className="text-2xl font-bold text-gray-700">{stats?.total_roles || 0}</p>
            </div>
          </div>
        </div>
        
        {/* Permission Stats Card */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-100 text-indigo-500 mr-4">
              <FaLock className="text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500 uppercase font-semibold">Permissions</p>
              <p className="text-2xl font-bold text-gray-700">{stats?.total_permissions || 0}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">System Overview</h3>
        <p className="text-gray-600 mb-4">
          Welcome to the admin dashboard. From here, you can manage all aspects of your AI Chatbot application.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-50 p-4 rounded">
            <h4 className="font-medium text-gray-700 mb-2">Quick Actions</h4>
            <ul className="space-y-2">
              <li className="hover:text-indigo-600 cursor-pointer">Create new user</li>
              <li className="hover:text-indigo-600 cursor-pointer">Assign roles to users</li>
              <li className="hover:text-indigo-600 cursor-pointer">Manage database connections</li>
              <li className="hover:text-indigo-600 cursor-pointer">Create new permission</li>
            </ul>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <h4 className="font-medium text-gray-700 mb-2">System Status</h4>
            <ul className="space-y-2">
              <li className="flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                <span>API Services: Operational</span>
              </li>
              <li className="flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                <span>Database: Connected</span>
              </li>
              <li className="flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                <span>Authentication: Active</span>
              </li>
              <li className="flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                <span>Document Storage: Available</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 