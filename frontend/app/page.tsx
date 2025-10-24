'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    
    if (token) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-violet-900 via-purple-900 to-indigo-900">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-violet-400"></div>
    </div>
  );
}