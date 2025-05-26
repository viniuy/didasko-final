'use client';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/shared/layout/app-sidebar';
import Header from '@/components/shared/layout/header';
import Rightsidebar from '@/components/shared/layout/right-sidebar';
import React from 'react';
import Schedule from '@/components/attendance/attendance-schedule';
import Studentlist from '@/components/attendance/attendance-studentslist';

export default function ClassAttendancePage({
  params,
}: {
  params: Promise<{ course_slug: string }>;
}) {
  const [open, setOpen] = React.useState(false);
  const resolvedParams = React.use(params);
  const { course_slug } = resolvedParams;

  if (!course_slug) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <p className='text-xl text-gray-500'>No course selected</p>
      </div>
    );
  }

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <div className='relative h-screen w-screen overflow-hidden'>
        <AppSidebar />

        <main className='h-full w-full lg:w-[calc(100%-22.5rem)] pl-[4rem] sm:pl-[5rem] transition-all'>
          <div className='flex flex-col flex-grow px-4'>
            <Header />

            <div className='flex-1 overflow-y-auto pb-6'>
              <h2 className='pl-2 pb-1 text-2xl font-bold text-muted-foreground'>
                Your Schedule
              </h2>
              <Schedule courseSlug={course_slug} />

              <div className='mt-6'>
                <Studentlist courseSlug={course_slug} />
              </div>
            </div>
          </div>

          <Rightsidebar />
        </main>
      </div>
    </SidebarProvider>
  );
}
