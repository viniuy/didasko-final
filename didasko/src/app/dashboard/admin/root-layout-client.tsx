'use client';

import React, { useState } from 'react';
import { SidebarProvider } from '@/components/providers/sidebar-provider';
import { withAuth } from '@/components/auth/with-auth';
import { AdminDashboardPage } from './_components/admin-dashboard-page';
import { DashboardData, getDashboardData } from './_components/dashboard-data';

interface RootLayoutClientProps {
  children: React.ReactNode;
  dashboardData: DashboardData;
}

function RootLayoutClient({ children, dashboardData }: RootLayoutClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <SidebarProvider
      defaultOpen={isSidebarOpen}
      onOpenChange={setIsSidebarOpen}
    >
      <AdminDashboardPage dashboardData={dashboardData}>
        {children}
      </AdminDashboardPage>
    </SidebarProvider>
  );
}

export default withAuth(RootLayoutClient);
