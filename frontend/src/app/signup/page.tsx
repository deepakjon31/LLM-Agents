'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Signup from '@/components/auth/Signup';

export default function SignupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push('/');
    }
  }, [session, status, router]);
  
  return <Signup />;
} 