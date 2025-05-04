'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaKey } from 'react-icons/fa';

export default function Login() {
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mobileNumber || !password) {
      setError('Mobile number and password are required');
      return;
    }
    
    // Validate mobile number format (simple check)
    if (!/^\d{7,15}$/.test(mobileNumber)) {
      setError('Please enter a valid mobile number (7-15 digits)');
      return;
    }
    
    setIsLoading(true);
    setError('');
    // For Docker networking, backend service name works better than localhost
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://backend:8000';
    setDebugInfo(`Login attempt for: ${mobileNumber}\nAPI URL: ${apiUrl}`);
    
    console.log(`Login attempt with: ${mobileNumber}`);
    
    try {
      // Call NextAuth signIn method with credentials
      console.log('Calling NextAuth signIn...');
      const result = await signIn('credentials', {
        redirect: false,
        mobileNumber,
        password,
      });
      
      console.log('SignIn result:', result);
      setDebugInfo(prev => `${prev}\n\nSignIn result: ${JSON.stringify(result, null, 2)}`);
      
      if (result?.error) {
        setError(result.error);
        console.error('Login error:', result.error);
      } else if (result?.ok) {
        console.log('Login successful, redirecting to dashboard');
        setDebugInfo(prev => `${prev}\n\nLogin successful! Redirecting...`);
        router.push('/dashboard');
      } else {
        setError('Login failed with unknown error');
      }
    } catch (error) {
      console.error('Exception during login:', error);
      setError('An error occurred during login');
      setDebugInfo(prev => `${prev}\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // For testing direct API access
  const testDirectApiLogin = async () => {
    try {
      setIsLoading(true);
      setError('');
      setDebugInfo('Testing direct API call...');
      
      // Try to access backend directly
      // In Docker environment, using 'backend' service name is more reliable than localhost
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://backend:8000';
      setDebugInfo(`Using API URL: ${apiUrl}`);
      
      // Create FormData object
      const formData = new URLSearchParams();
      formData.append('username', mobileNumber);
      formData.append('password', password);
      
      setDebugInfo(prev => `${prev}\n\nSending request with form data: username=${mobileNumber}, password=***`);
      
      // Make the request
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });
      
      const data = await response.json();
      setDebugInfo(prev => `${prev}\n\nResponse status: ${response.status}\n${JSON.stringify(data, null, 2)}`);
      
      if (response.ok && data.access_token) {
        setError('');
        setDebugInfo(prev => `${prev}\n\nDirect API call successful! Token received.`);
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
        <div className="flex justify-center mb-6">
          <div className="p-2 bg-indigo-100 rounded-full">
            <FaKey className="text-indigo-600 text-2xl" />
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-center">AI Chatbot</h1>
          <h2 className="mt-6 text-xl font-semibold text-center text-gray-900">Login to your account</h2>
        </div>
        
        {error && (
          <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
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
                placeholder="test123"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-3">
            <button
              type="submit"
              disabled={isLoading}
              className="relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md group hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
              {isLoading ? 'Loading...' : 'Login'}
            </button>
            
            <button
              type="button"
              onClick={testDirectApiLogin}
              disabled={isLoading}
              className="relative flex justify-center w-full px-4 py-2 text-sm font-medium text-indigo-600 bg-white border border-indigo-300 rounded-md group hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-100"
            >
              Test Direct API
            </button>
          </div>
        </form>
        
        <div className="text-center mt-4">
          <p className="text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign up
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