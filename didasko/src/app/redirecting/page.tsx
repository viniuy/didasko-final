'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      const role = session?.user?.role;

      if (!role) {
        console.error('No role found in session');
        router.replace('/unauthorized'); // or '/' if no fallback page
        return;
      }

      const roleMap: Record<string, string> = {
        ADMIN: '/dashboard/admin',
        ACADEMIC_HEAD: '/dashboard/academic-head',
        FACULTY: '/dashboard/faculty',
      };

      const path = roleMap[role] || '/dashboard';
      router.replace(path);
    }
  }, [session, status, router]);

  return (
    <div className='flex items-center justify-center h-screen'>
      <p className='text-lg animate-pulse text-gray-600'>
        Redirecting based on your role...
      </p>
    </div>
  );
}
