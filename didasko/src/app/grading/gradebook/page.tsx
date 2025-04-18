'use client';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/shared/layout/app-sidebar';
import { TableDemo } from '@/components/grading/gradebook';
import Header from '@/components/shared/layout/header';
import Rightsidebar from '@/components/shared/layout/right-sidebar';
import React from 'react';

export default function GradebookPage() {
  const [open, setOpen] = React.useState(false);

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <div className='flex h-screen'>
        <AppSidebar />

        <main className='flex flex-1 h-screen overflow-hidden transition-all'>
          <div className='flex flex-col flex-grow px-4'>
            <Header />
            <h2 className='pl-2 pb-1 text-2xl font-bold text-muted-foreground'>
              Courses
            </h2>

            <div className='flex-1 overflow-y-auto pb-6'>
              <TableDemo />
            </div>
          </div>

          <Rightsidebar />
        </main>
      </div>
    </SidebarProvider>
  );
}
