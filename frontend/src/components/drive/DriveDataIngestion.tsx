'use client';

import React, { useState } from 'react';
import { FaCloudUploadAlt, FaPlus, FaSpinner, FaGoogle, FaMicrosoft, FaDropbox, FaServer, FaCheck, FaExclamationTriangle, FaTrash, FaCloudDownloadAlt } from 'react-icons/fa';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

type DriveType = 'google' | 'onedrive' | 'dropbox' | 'ftp' | 'sftp' | 'webdav' | 'other';

type DriveSource = {
  id: string;
  name: string;
  type: DriveType;
  connected: boolean;
  lastSync?: string;
  fileCount?: number;
  created_at: string;
};

const DriveDataIngestion: React.FC = () => {
  const { data: session } = useSession();
  const [driveSources, setDriveSources] = useState<DriveSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingDrive, setIsAddingDrive] = useState(false);
  const [newDriveType, setNewDriveType] = useState<DriveType>('google');
  const [newDriveName, setNewDriveName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch drive sources on component mount
  React.useEffect(() => {
    fetchDriveSources();
  }, [session]);

  const fetchDriveSources = async () => {
    setIsLoading(true);
    try {
      // Note: This API endpoint would need to be implemented in the backend
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/drive-sources`, {
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
        }
      });
      setDriveSources(response.data);
    } catch (err) {
      console.error('Error fetching drive sources:', err);
      // For demonstration, let's add some mock data
      setDriveSources([
        {
          id: '1',
          name: 'My Google Drive',
          type: 'google',
          connected: true,
          lastSync: new Date().toISOString(),
          fileCount: 124,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Work OneDrive',
          type: 'onedrive',
          connected: true,
          lastSync: new Date().toISOString(),
          fileCount: 83,
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Legacy FTP',
          type: 'ftp',
          connected: false,
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newDriveName.trim()) {
      setError('Please enter a name for this drive connection');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Note: This API endpoint would need to be implemented in the backend
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/drive-sources`,
        { 
          name: newDriveName,
          type: newDriveType 
        },
        {
          headers: {
            'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
          }
        }
      );
      
      // Add the new drive source to the list
      setDriveSources([...driveSources, response.data]);
      setNewDriveName('');
      setNewDriveType('google');
      setIsAddingDrive(false);
      toast.success('Drive source added successfully');
    } catch (err) {
      console.error('Error adding drive source:', err);
      
      // For demonstration, add a mock entry
      const mockDriveSource: DriveSource = {
        id: Date.now().toString(),
        name: newDriveName,
        type: newDriveType,
        connected: false,
        created_at: new Date().toISOString()
      };
      
      setDriveSources([...driveSources, mockDriveSource]);
      setNewDriveName('');
      setNewDriveType('google');
      setIsAddingDrive(false);
      toast.success('Drive source added successfully (mock)');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDrive = async (id: string) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/drive-sources/${id}`, {
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
        }
      });
      
      // Remove the drive source from the list
      setDriveSources(driveSources.filter(source => source.id !== id));
      toast.success('Drive source removed successfully');
    } catch (err) {
      console.error('Error removing drive source:', err);
      
      // For demonstration, remove from state anyway
      setDriveSources(driveSources.filter(source => source.id !== id));
      toast.success('Drive source removed successfully (mock)');
    }
  };

  const handleConnectDrive = async (id: string) => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/drive-sources/${id}/connect`, {}, {
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
        }
      });
      
      // Update the drive source in the list
      setDriveSources(driveSources.map(source => 
        source.id === id ? { ...source, connected: true } : source
      ));
      
      toast.success('Connected to drive source successfully');
    } catch (err) {
      console.error('Error connecting to drive source:', err);
      
      // For demonstration, update state anyway
      setDriveSources(driveSources.map(source => 
        source.id === id ? { ...source, connected: true } : source
      ));
      
      toast.success('Connected to drive source successfully (mock)');
    }
  };

  const handleSyncDrive = async (id: string) => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/drive-sources/${id}/sync`, {}, {
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
        }
      });
      
      // Update the drive source in the list
      const now = new Date().toISOString();
      setDriveSources(driveSources.map(source => 
        source.id === id ? { ...source, lastSync: now } : source
      ));
      
      toast.success('Drive source synced successfully');
    } catch (err) {
      console.error('Error syncing drive source:', err);
      
      // For demonstration, update state anyway
      const now = new Date().toISOString();
      setDriveSources(driveSources.map(source => 
        source.id === id ? { ...source, lastSync: now } : source
      ));
      
      toast.success('Drive source synced successfully (mock)');
    }
  };

  const getDriveIcon = (type: DriveType) => {
    switch (type) {
      case 'google':
        return <FaGoogle className="text-red-500" />;
      case 'onedrive':
        return <FaMicrosoft className="text-blue-600" />;
      case 'dropbox':
        return <FaDropbox className="text-blue-500" />;
      case 'ftp':
      case 'sftp':
        return <FaServer className="text-gray-600" />;
      default:
        return <FaCloudUploadAlt className="text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Add Drive Button */}
      {!isAddingDrive && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Drive Sources</h2>
            <button
              onClick={() => setIsAddingDrive(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FaPlus className="mr-2" />
              Add Drive Source
            </button>
          </div>
        </div>
      )}

      {/* Add Drive Form */}
      {isAddingDrive && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Add Drive Source</h2>
          
          <form onSubmit={handleAddDrive} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Display Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="My Google Drive"
                value={newDriveName}
                onChange={(e) => setNewDriveName(e.target.value)}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="driveType" className="block text-sm font-medium text-gray-700 mb-1">
                Drive Type
              </label>
              <select
                id="driveType"
                name="driveType"
                value={newDriveType}
                onChange={(e) => setNewDriveType(e.target.value as DriveType)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                disabled={isSubmitting}
              >
                <option value="google">Google Drive</option>
                <option value="onedrive">Microsoft OneDrive</option>
                <option value="dropbox">Dropbox</option>
                <option value="ftp">FTP Server</option>
                <option value="sftp">SFTP Server</option>
                <option value="webdav">WebDAV</option>
                <option value="other">Other Cloud Storage</option>
              </select>
            </div>

            {error && (
              <div className="text-sm text-red-600">{error}</div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsAddingDrive(false)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Adding...
                  </>
                ) : (
                  <>
                    <FaCloudUploadAlt className="mr-2" />
                    Add Drive
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Drive Sources List */}
      <div className="bg-white p-6 rounded-lg shadow">
        {isLoading ? (
          <div className="text-center py-4">
            <FaSpinner className="animate-spin mx-auto text-indigo-500 text-xl" />
            <p className="mt-2 text-sm text-gray-500">Loading drive sources...</p>
          </div>
        ) : driveSources.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FaCloudUploadAlt className="mx-auto text-gray-400 text-3xl mb-2" />
            <p>No drive sources configured yet</p>
            <p className="text-sm mt-1">Add a drive source to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Drive
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Sync
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Files
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {driveSources.map((source) => (
                  <tr key={source.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-md bg-gray-100">
                          {getDriveIcon(source.type)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{source.name}</div>
                          <div className="text-sm text-gray-500">
                            {source.type === 'google' && 'Google Drive'}
                            {source.type === 'onedrive' && 'Microsoft OneDrive'}
                            {source.type === 'dropbox' && 'Dropbox'}
                            {source.type === 'ftp' && 'FTP Server'}
                            {source.type === 'sftp' && 'SFTP Server'}
                            {source.type === 'webdav' && 'WebDAV'}
                            {source.type === 'other' && 'Cloud Storage'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {source.connected ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          <FaCheck className="mr-1 mt-0.5" /> Connected
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          <FaExclamationTriangle className="mr-1 mt-0.5" /> Not Connected
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {source.lastSync ? formatDate(source.lastSync) : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {source.fileCount || '0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {!source.connected ? (
                          <button
                            onClick={() => handleConnectDrive(source.id)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Connect"
                          >
                            <FaCloudUploadAlt />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSyncDrive(source.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Sync Now"
                          >
                            <FaCloudDownloadAlt />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteDrive(source.id)}
                          className="text-red-600 hover:text-red-900 ml-3"
                          title="Remove"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriveDataIngestion; 