'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Login from '@/components/auth/Login';
import Dashboard from '@/components/dashboard/Dashboard';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== 'loading') {
      setLoading(false);
    }
  }, [status]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return <Dashboard />;
}
