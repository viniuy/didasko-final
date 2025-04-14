'use client';
import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import Courses from '@/components/grading/courses';
import Header from '@/components/header';
import Rightsidebar from '@/components/right-sidebar';

export default function GradingPage() {
  const [open, setOpen] = React.useState(false);

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <div className='flex h-screen w-screen overflow-hidden'>
        <AppSidebar />
        <main className='flex flex-1 h-screen overflow-hidden transition-all'>
          <div className='flex flex-col flex-grow px-4'>
            <Header />
            <div className='flex-1 p-4'>
              <div className='mb-8'>
                <h2 className='text-2xl font-bold mb-4'>1st Semester</h2>
                <Courses />
              </div>
              <div>
                <h2 className='text-2xl font-bold mb-4'>2nd Semester</h2>
                <Courses />
              </div>
            </div>
          </div>
          <Rightsidebar />
        </main>
      </div>
    </SidebarProvider>
  );
}
