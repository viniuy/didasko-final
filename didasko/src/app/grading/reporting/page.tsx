'use client';
import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/shared/layout/app-sidebar';
import Header from '@/components/shared/layout/header';
import Rightsidebar from '@/components/shared/layout/right-sidebar';
import SemesterCourses from '@/components/shared/semester-courses';

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
                <SemesterCourses semester='1st Semester' type='grading' />
              </div>
              <div>
                <h2 className='text-2xl font-bold mb-4'>2nd Semester</h2>
                <SemesterCourses semester='2nd Semester' type='grading' />
              </div>
            </div>
          </div>
          <Rightsidebar />
        </main>
      </div>
    </SidebarProvider>
  );
}
