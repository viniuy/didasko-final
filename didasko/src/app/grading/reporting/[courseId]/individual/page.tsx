'use client';

import React from 'react';
import { AppSidebar } from '@/components/shared/layout/app-sidebar';
import Header from '@/components/shared/layout/header';
import Rightsidebar from '@/components/shared/layout/right-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TableDemo } from '@/components/grading/gradebook';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface Course {
  id: string;
  code: string;
  title: string;
  description: string | null;
}

export default function IndividualGradingPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const [open, setOpen] = React.useState(false);
  const { courseId } = React.use(params);
  const [course, setCourse] = React.useState<Course | null>(null);

  React.useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await fetch(`/api/courses/${courseId}`);
        if (!response.ok) throw new Error('Failed to fetch course');
        const data = await response.json();
        setCourse(data);
      } catch (error) {
        console.error('Error fetching course:', error);
      }
    };

    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <div className='flex h-screen w-screen overflow-hidden relative'>
        <AppSidebar />

        <main
          className={`flex flex-1 h-screen overflow-hidden transition-all overflow-y-auto`}
        >
          <div className='flex flex-col flex-grow px-4'>
            <Header />
            <div className='mb-6 flex items-center gap-4'>
              <Button asChild variant='ghost' size='icon'>
                <Link href={`/grading/reporting/${course?.code}`}>
                  <ArrowLeft className='h-4 w-4' />
                </Link>
              </Button>
              <div>
                <h2 className='text-2xl font-semibold'>
                  {course?.title || 'Loading...'}
                </h2>
                <p className='text-sm text-muted-foreground'>
                  {course?.code || 'Loading...'} - Individual Grading
                </p>
              </div>
            </div>

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
