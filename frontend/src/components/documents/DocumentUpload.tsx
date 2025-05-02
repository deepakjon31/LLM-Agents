'use client';

import { useState, useRef } from 'react';
import { FaUpload, FaCheck, FaSpinner } from 'react-icons/fa';
import axios from 'axios';

const DocumentUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setUploadSuccess(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
      setUploadSuccess(false);
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  
  const handleUpload = async () => {
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['.pdf', '.docx', '.txt', '.csv', '.xlsx'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      setError(`File type not supported. Allowed types: ${allowedTypes.join(', ')}`);
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    
    // Simulate upload with progress
    const simulateUpload = () => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        
        if (progress >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setUploadSuccess(true);
          
          // Reset after 3 seconds
          setTimeout(() => {
            setFile(null);
            setUploadProgress(0);
            setUploadSuccess(false);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }, 3000);
        }
      }, 500);
    };
    
    // In a real app, this would be an API call
    try {
      // const formData = new FormData();
      // formData.append('file', file);
      
      // const response = await axios.post('/api/documents/upload', formData, {
      //   onUploadProgress: (progressEvent) => {
      //     const percentCompleted = Math.round(
      //       (progressEvent.loaded * 100) / progressEvent.total
      //     );
      //     setUploadProgress(percentCompleted);
      //   },
      // });
      
      // For demo, simulate the upload
      simulateUpload();
      
    } catch (err: any) {
      setIsUploading(false);
      setError(err.response?.data?.message || 'An error occurred during upload');
      console.error('Upload error:', err);
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Upload New Document</h2>
      
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          accept=".pdf,.docx,.txt,.csv,.xlsx"
        />
        
        {!file ? (
          <div>
            <FaUpload className="mx-auto text-gray-400 text-3xl mb-4" />
            <p className="text-gray-500">
              Drag and drop your document here, or click to browse
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Supported formats: PDF, DOCX, TXT, CSV, XLSX
            </p>
          </div>
        ) : (
          <div>
            {isUploading ? (
              <div>
                <FaSpinner className="mx-auto text-blue-500 text-3xl mb-4 animate-spin" />
                <p className="text-blue-500 font-medium">{file.name}</p>
                <div className="mt-4 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Uploading... {uploadProgress}%
                </p>
              </div>
            ) : uploadSuccess ? (
              <div>
                <FaCheck className="mx-auto text-green-500 text-3xl mb-4" />
                <p className="text-green-500 font-medium">
                  {file.name} uploaded successfully!
                </p>
              </div>
            ) : (
              <div>
                <p className="text-blue-500 font-medium break-all">{file.name}</p>
                <p className="text-gray-500 text-sm mt-1">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-600 rounded text-sm">
          {error}
        </div>
      )}
      
      {file && !isUploading && !uploadSuccess && (
        <button
          onClick={handleUpload}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
        >
          Upload Document
        </button>
      )}
    </div>
  );
};

export default DocumentUpload; 