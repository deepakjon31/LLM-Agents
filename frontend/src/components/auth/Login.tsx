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
    
    // In browser context, we use NEXT_PUBLIC_API_URL which points to the publicly accessible URL
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
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
      
      if (result?.error) {
        setError(result.error);
        console.error('Login error:', result.error);
      } else if (result?.ok) {
        console.log('Login successful, redirecting to dashboard');
        router.push('/dashboard');
      } else {
        setError('Login failed with unknown error');
      }
    } catch (error) {
      console.error('Exception during login:', error);
      setError('An error occurred during login');
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
      </div>
    </div>
  );
} 