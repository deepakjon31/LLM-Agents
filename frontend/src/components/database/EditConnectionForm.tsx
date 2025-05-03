'use client';

import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes } from 'react-icons/fa';

// Database types supported by the application
const DB_TYPES = ["postgresql", "mysql", "sqlite", "mongodb", "oracle", "sqlserver"];

interface EditConnectionFormProps {
  connection: {
    id: string;
    name: string;
    type: string;
    host: string;
    port: number;
    username: string;
    database: string;
  };
  onSubmit: (connectionData: any) => void;
  onCancel: () => void;
}

const EditConnectionForm: React.FC<EditConnectionFormProps> = ({ connection, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    id: connection.id,
    name: connection.name,
    type: connection.type,
    database: connection.database,
    host: connection.host,
    port: connection.port.toString(),
    username: connection.username,
    password: '' // Password is not returned from the API for security
  });
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  useEffect(() => {
    // Update form data if connection props change
    setFormData({
      id: connection.id,
      name: connection.name,
      type: connection.type,
      database: connection.database,
      host: connection.host,
      port: connection.port.toString(),
      username: connection.username,
      password: formData.password // Keep current password input
    });
  }, [connection]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    // Validate required fields
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.host.trim()) newErrors.host = 'Host is required';
    if (!formData.port.trim()) newErrors.port = 'Port is required';
    else if (isNaN(Number(formData.port))) newErrors.port = 'Port must be a number';
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.password.trim()) newErrors.password = 'Password is required';
    if (!formData.database.trim()) newErrors.database = 'Database name is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Convert port to number
      const submissionData = {
        ...formData,
        port: parseInt(formData.port, 10)
      };
      
      onSubmit(submissionData);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="overflow-y-auto">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-base font-semibold text-gray-900 mb-1">
            Connection Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full p-3 border rounded text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="My Database"
          />
          {errors.name && <p className="text-red-600 text-sm mt-1 font-semibold">{errors.name}</p>}
        </div>
        
        <div>
          <label className="block text-base font-semibold text-gray-900 mb-1">
            Database Type
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {DB_TYPES.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-base font-semibold text-gray-900 mb-1">
            Database Name
          </label>
          <input
            type="text"
            name="database"
            value={formData.database}
            onChange={handleChange}
            className={`w-full p-3 border rounded text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.database ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="mydb"
          />
          {errors.database && <p className="text-red-600 text-sm mt-1 font-semibold">{errors.database}</p>}
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-base font-semibold text-gray-900 mb-1">
                Host
              </label>
              <input
                type="text"
                name="host"
                value={formData.host}
                onChange={handleChange}
                className={`w-full p-3 border rounded text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.host ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="localhost"
              />
              {errors.host && <p className="text-red-600 text-sm mt-1 font-semibold">{errors.host}</p>}
            </div>
            
            <div className="w-1/3">
              <label className="block text-base font-semibold text-gray-900 mb-1">
                Port
              </label>
              <input
                type="text"
                name="port"
                value={formData.port}
                onChange={handleChange}
                className={`w-full p-3 border rounded text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.port ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="5432"
              />
              {errors.port && <p className="text-red-600 text-sm mt-1 font-semibold">{errors.port}</p>}
            </div>
          </div>
          
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-base font-semibold text-gray-900 mb-1">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`w-full p-3 border rounded text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.username ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="postgres"
              />
              {errors.username && <p className="text-red-600 text-sm mt-1 font-semibold">{errors.username}</p>}
            </div>
            
            <div className="flex-1">
              <label className="block text-base font-semibold text-gray-900 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full p-3 border rounded text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="********"
              />
              {errors.password && <p className="text-red-600 text-sm mt-1 font-semibold">{errors.password}</p>}
              <p className="text-sm text-gray-700 mt-1 font-medium">Please re-enter the password to update the connection.</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 flex items-center text-base font-medium"
        >
          <FaTimes className="mr-2" /> Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center text-base font-medium"
        >
          <FaSave className="mr-2" /> Update Connection
        </button>
      </div>
    </form>
  );
};

export default EditConnectionForm; 