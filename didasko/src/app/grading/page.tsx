'use client';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import Courses from '@/components/grading/courses';
import Header from '@/components/header';
import Rightsidebar from '@/components/right-sidebar';
import React from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <div className='flex h-screen w-screen overflow-hidden relative'>
        <AppSidebar />

        <main className={`flex flex-1 h-screen overflow-hidden transition-all`}>
          <div className='flex flex-col flex-grow px-4'>
            {children}
            <Header />
            <h2 className='pl-2 pb-1 text-2xl font-bold text-muted-foreground'>
              Grading
            </h2>
            <h2 className='pl-2 pb-1 text font-bold text-muted-foreground'>
              1st Semester
            </h2>
            <Courses />
            <h2 className='pl-2 pb-1 text font-bold text-muted-foreground'>
              2nd Semester
            </h2>
            <Courses />
          </div>

          <Rightsidebar />
        </main>
      </div>
    </SidebarProvider>
  );
}
