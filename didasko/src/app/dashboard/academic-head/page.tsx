'use client';

import { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';

import { Menu } from 'lucide-react';
import React from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [open, setOpen] = React.useState(false);

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <AppSidebar />
      <main className='flex w-screen h-screen overflow-hidden'>
        <SidebarTrigger />
      </main>
    </SidebarProvider>
  );
}
