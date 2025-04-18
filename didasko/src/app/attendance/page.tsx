'use client';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/shared/layout/app-sidebar';
import Header from '@/components/shared/layout/header';
import Rightsidebar from '@/components/shared/layout/right-sidebar';
import React from 'react';
import Schedule from '@/components/attendance/attendance-schedule';
import SemesterCourses from '@/components/shared/semester-courses';

export default function AttendancePage() {
  const [open, setOpen] = React.useState(false);

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <div className='flex h-screen w-screen overflow-hidden relative'>
        <AppSidebar />

        <main
          className={`flex flex-1 h-screen overflow-hidden transition-all overflow-y-auto`}
        >
          <div className='flex flex-col flex-grow px-4'>
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
            <SemesterCourses semester='1st Semester' type='attendance' />
            <h2 className='pl-2 pb-1 text-2xl font-bold text-muted-foreground'>
              2nd Semester
            </h2>
            <SemesterCourses semester='2nd Semester' type='attendance' />
          </div>
          <Rightsidebar />
        </main>
      </div>
    </SidebarProvider>
  );
}
