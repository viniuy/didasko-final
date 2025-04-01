
'use client';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import Header from '@/components/header';
import Rightsidebar from '@/components/right-sidebar';
import React from 'react';
import Schedule from '@/components/attendance/attendance-schedule';
import Firstsemlist from '@/components/attendance/attendance-firstsem';
import Secondsemlist from '@/components/attendance/attendance-secondsem';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <div className='flex h-screen'>
        <AppSidebar />

        <main className={`flex flex-1 h-screen overflow-hidden transition-all overflow-y-auto`}>
          <div className='flex flex-col flex-grow px-4'>
            {children}
            <Header />
            
            <h2 className='pl-2 pb-1 text-2xl font-bold text-muted-foreground'>
                Your Schedule
            </h2>
            <Schedule />
            <h2 className='pl-2 pb-1 text-2xl font-bold text-muted-foreground'>
                List of Students:
            </h2>
            <h2 className='pl-2 pb-1 text-2xl font-bold text-muted-foreground'>
                1st Semester
            </h2>
            <Firstsemlist/>
            <h2 className='pl-2 pb-1 text-2xl font-bold text-muted-foreground'>
                2nd Semester
            </h2>
            <Secondsemlist/>
          </div>
          <Rightsidebar />
        </main>
      </div>
    </SidebarProvider>
  );
}
