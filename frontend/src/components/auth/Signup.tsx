'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

export default function Signup() {
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mobileNumber || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Validate mobile number format (simple check)
    if (!/^\d{7,15}$/.test(mobileNumber)) {
      setError('Please enter a valid mobile number (7-15 digits)');
      return;
    }

    // Validate email if provided
    if (email && !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setDebugInfo(null);
    
    // For Docker networking, backend service name works better than localhost
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://backend:8000';
    console.log(`Using API URL: ${apiUrl}`);
    
    try {
      console.log(`Signing up user with mobile: ${mobileNumber}, email: ${email || 'not provided'}`);
      
      const payload = {
        mobile_number: mobileNumber,
        password: password,
        ...(email ? { email } : {})
      };
      
      console.log('Signup payload:', payload);
      setDebugInfo(`Sending request to ${apiUrl}/auth/signup with data: ${JSON.stringify(payload, null, 2)}`);
      
      const response = await axios.post(`${apiUrl}/auth/signup`, payload);
      
      console.log('Signup response:', response);
      setDebugInfo(prev => `${prev || ''}\n\nResponse: ${JSON.stringify(response.data, null, 2)}`);
      
      if (response.status === 200 || response.status === 201) {
        setError('');
        setDebugInfo(prev => `${prev || ''}\n\nSuccess! Redirecting to login page...`);
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const responseData = error.response.data;
        setDebugInfo(JSON.stringify({
          status: error.response.status,
          statusText: error.response.statusText,
          data: responseData
        }, null, 2));
        
        if (responseData && responseData.detail) {
          setError(responseData.detail);
        } else {
          setError(`Error: ${error.response.status} - ${error.response.statusText}`);
        }
      } else if (error.request) {
        // The request was made but no response was received
        setError('No response received from server. Please check your connection.');
        setDebugInfo(JSON.stringify(error.request, null, 2));
      } else {
        // Something happened in setting up the request that triggered an Error
        setError(`Error: ${error.message}`);
        setDebugInfo(error.stack || 'No stack trace available');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // For testing direct API access
  const testDirectApiSignup = async () => {
    try {
      setIsLoading(true);
      setError('');
      setDebugInfo('Testing direct API call for signup...');
      
      // Try to access backend directly
      // For Docker networking, backend service name works better than localhost
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://backend:8000';
      setDebugInfo(`Using API URL: ${apiUrl}`);
      
      // Prepare the data
      const formData = {
        mobile_number: mobileNumber,
        password: password,
        ...(email ? { email } : {})
      };
      
      setDebugInfo(prev => `${prev}\n\nSending request with data: ${JSON.stringify(formData, null, 2)}`);
      
      // Make the request
      const response = await fetch(`${apiUrl}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      setDebugInfo(prev => `${prev}\n\nResponse status: ${response.status}\n${JSON.stringify(data, null, 2)}`);
      
      if (response.ok) {
        setError('');
        setDebugInfo(prev => `${prev}\n\nDirect API call successful! User created.`);
      } else {
        setError(`Direct API call failed: ${data.detail || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Direct API error:', error);
      setError('Direct API call error');
      
      let errorDetails = 'Unknown error';
      if (error instanceof Error) {
        errorDetails = error.message;
        if ('response' in error && error.response) {
          try {
            // @ts-ignore - We're dynamically checking for response property
            errorDetails += `\nStatus: ${error.response.status}\nData: ${JSON.stringify(error.response.data, null, 2)}`;
          } catch (e) {
            // Ignore serialization errors
          }
        }
      }
      
      setDebugInfo(`Error: ${errorDetails}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-24">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div>
          <h1 className="text-3xl font-bold text-center">AI Chatbot</h1>
          <h2 className="mt-6 text-xl font-semibold text-center text-gray-900">Create a new account</h2>
        </div>
        
        {error && (
          <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSignup}>
          <div className="space-y-4">
            <div>
              <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700">
                Mobile Number
              </label>
              <input
                id="mobileNumber"
                name="mobileNumber"
                type="text"
                required
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                className="relative block w-full px-3 py-2 mt-1 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="8050518293"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email (optional)
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="relative block w-full px-3 py-2 mt-1 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="your@email.com"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="relative block w-full px-3 py-2 mt-1 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Test123"
              />
              <p className="mt-1 text-xs text-gray-500">
                Password must contain at least 8 characters, one uppercase letter, and one number
              </p>
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="relative block w-full px-3 py-2 mt-1 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Test123"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-3">
            <button
              type="submit"
              disabled={isLoading}
              className="relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md group hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
              {isLoading ? 'Loading...' : 'Sign up'}
            </button>
            
            <button
              type="button"
              onClick={testDirectApiSignup}
              disabled={isLoading}
              className="relative flex justify-center w-full px-4 py-2 text-sm font-medium text-indigo-600 bg-white border border-indigo-300 rounded-md group hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-100"
            >
              Test Direct API Signup
            </button>
          </div>
        </form>
        
        <div className="text-center mt-4">
          <p className="text-sm">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Login
            </Link>
          </p>
        </div>
        
        {debugInfo && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-64">
            <pre>{debugInfo}</pre>
          </div>
        )}
      </div>
    </div>
  );
} 