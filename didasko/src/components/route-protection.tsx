'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { DashboardSkeleton } from './dashboard-skeleton';

export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
) {
  return function WithAuthComponent(props: P) {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
      if (status === 'unauthenticated') {
        router.push('/');
      }
    }, [status, router]);

    if (status === 'loading') {
      return <DashboardSkeleton />;
    }

    if (status === 'unauthenticated') {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}
