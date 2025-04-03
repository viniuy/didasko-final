'use client';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import Header from '@/components/header';
import Rightsidebar from '@/components/right-sidebar';
import React from 'react';
import Schedule from '@/components/attendance/attendance-schedule';
import Studentlist from '@/components/attendance/attendance-studentslist';

export default function Layout() {
  const [open, setOpen] = React.useState(false);

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <div className='flex h-screen w-screen overflow-hidden relative'>
        <AppSidebar />

        <main className='flex flex-1 h-screen overflow-hidden transition-all'>
          <div className='flex flex-col flex-grow px-4'>
            <Header />

            <div className='flex-1 overflow-y-auto pb-6'>
              <h2 className='pl-2 pb-1 text-2xl font-bold text-muted-foreground'>
                Your Schedule
              </h2>
              <Schedule />

              <div className='mt-6'>
                <Studentlist />
              </div>
            </div>
          </div>

          <Rightsidebar />
        </main>
      </div>
    </SidebarProvider>
  );
}
