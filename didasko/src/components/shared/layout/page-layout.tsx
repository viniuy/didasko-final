'use client';

import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/shared/layout/app-sidebar';
import Header from '@/components/shared/layout/header';
import Rightsidebar from '@/components/shared/layout/right-sidebar';

interface PageLayoutProps {
  children: React.ReactNode;
  showRightSidebar?: boolean;
}

export function PageLayout({
  children,
  showRightSidebar = true,
}: PageLayoutProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <div className='flex h-screen w-screen overflow-hidden relative'>
        <AppSidebar />
        <main className='flex flex-1 h-screen overflow-hidden transition-all'>
          <div className='flex flex-col flex-grow px-4'>
            <Header />
            {children}
          </div>
          {showRightSidebar && <Rightsidebar />}
        </main>
      </div>
    </SidebarProvider>
  );
}
