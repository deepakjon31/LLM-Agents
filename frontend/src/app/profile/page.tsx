'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { FaUserShield, FaUserCog, FaUserTie, FaUser } from 'react-icons/fa';

interface UserProfile {
  id?: number;
  email?: string;
  mobile_number?: string;
  full_name?: string;
  profile_picture?: string;
  bio?: string;
  role?: {
    id: number;
    name: string;
    description: string;
  };
  permissions?: string[];
  preferences?: Record<string, any>;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch profile');
      const data = await response.json();
      setProfile(data);
    } catch (error) {
      toast.error('Failed to load profile');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const response = await fetch('/api/profile/me', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profile)
      });
      if (!response.ok) throw new Error('Failed to update profile');
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/profile/me/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      if (!response.ok) throw new Error('Failed to upload avatar');
      const data = await response.json();
      setProfile(prev => prev ? { ...prev, profile_picture: data.url } : null);
      toast.success('Avatar updated successfully');
    } catch (error) {
      toast.error('Failed to upload avatar');
      console.error(error);
    }
  };

  const getRoleIcon = (roleName?: string) => {
    switch (roleName) {
      case 'admin':
        return <FaUserShield className="text-red-500 w-5 h-5" />;
      case 'developer':
        return <FaUserCog className="text-blue-500 w-5 h-5" />;
      case 'analyst':
        return <FaUserTie className="text-green-500 w-5 h-5" />;
      default:
        return <FaUser className="text-gray-500 w-5 h-5" />;
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        
        {profile?.role && (
          <div className="flex items-center px-4 py-2 bg-gray-100 rounded-full">
            {getRoleIcon(profile.role.name)}
            <span className="ml-2 font-medium capitalize">{profile.role.name}</span>
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Account Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">User ID</p>
            <p className="font-medium">{profile?.id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Mobile Number</p>
            <p className="font-medium">{profile?.mobile_number || 'Not set'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium">{profile?.email || 'Not set'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Role</p>
            <div className="flex items-center">
              {profile?.role ? (
                <>
                  {getRoleIcon(profile.role.name)}
                  <span className="ml-2 font-medium capitalize">{profile.role.name}</span>
                </>
              ) : 'No role assigned'}
            </div>
          </div>
        </div>
      </div>
      
      {profile?.permissions && profile.permissions.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Permissions</h2>
          <div className="flex flex-wrap gap-2">
            {profile.permissions.map((permission, i) => (
              <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {permission.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Edit Profile</h2>
        
        <div className="mb-8">
          <div className="relative w-32 h-32 rounded-full overflow-hidden mb-4">
            {profile?.profile_picture ? (
              <Image
                src={profile.profile_picture}
                alt="Profile"
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500">No Image</span>
              </div>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              value={profile?.full_name || ''}
              onChange={e => setProfile(prev => prev ? { ...prev, full_name: e.target.value } : null)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={profile?.email || ''}
              onChange={e => setProfile(prev => prev ? { ...prev, email: e.target.value } : null)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Bio</label>
            <textarea
              value={profile?.bio || ''}
              onChange={e => setProfile(prev => prev ? { ...prev, bio: e.target.value } : null)}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isUpdating}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isUpdating ? 'Updating...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
} 