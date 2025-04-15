'use client';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import Stats from '@/components/stats';
import Greet from '@/components/greeting';
import Courses from '@/components/courses';
import WeeklySchedule from '@/components/weekly-schedule';
import Header from '@/components/header';
import Rightsidebar from '@/components/right-sidebar';
import React from 'react';
import { useSession } from 'next-auth/react';

export default function AcademicHeadDashboard() {
  const [open, setOpen] = React.useState(false);
  const { data: session } = useSession();

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <div className='flex h-screen w-screen overflow-hidden relative'>
        <AppSidebar />

        <main className='flex flex-1 h-screen overflow-hidden transition-all'>
          <div className='flex flex-col flex-grow px-4'>
            <Header />
            <Greet />
            <Stats />
            <h2 className='pl-2 pb-1 text-2xl font-bold text-muted-foreground'>
              Courses
            </h2>
            <Courses />

            {session?.user?.email && (
              <WeeklySchedule
                teacherInfo={{
                  email: session.user.email
                }}
                onBack={() => {}}
              />
            )}
          </div>

          <Rightsidebar />
        </main>
      </div>
    </SidebarProvider>
  );
}
