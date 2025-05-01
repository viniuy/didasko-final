'use client';

import React from 'react';
import { AppSidebar } from '@/components/shared/layout/app-sidebar';
import Header from '@/components/shared/layout/header';
import Rightsidebar from '@/components/shared/layout/right-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface Course {
  id: string;
  code: string;
  title: string;
  description: string | null;
}

export default function GroupGradingPage({
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
      <div className='relative h-screen w-screen overflow-hidden'>
        <AppSidebar />

        <main className='h-full w-full lg:w-[calc(100%-22.5rem)] pl-[4rem] sm:pl-[5rem] transition-all'>
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
                  {course?.code || 'Loading...'} - Group Grading
                </p>
              </div>
            </div>

            <div className='flex-1 overflow-y-auto pb-6'>
              <Card className='p-8'>
                <div className='flex flex-col items-center justify-center text-center space-y-4'>
                  <div className='h-24 w-24 rounded-full bg-secondary flex items-center justify-center'>
                    <Users className='h-12 w-12' />
                  </div>
                  <div>
                    <h3 className='text-xl font-semibold'>
                      Group Grading Coming Soon
                    </h3>
                    <p className='text-sm text-muted-foreground mt-1'>
                      This feature is currently under development. Please use
                      individual grading for now.
                    </p>
                  </div>
                  <Button asChild>
                    <Link
                      href={`/grading/reporting/${course?.code}/individual`}
                    >
                      Go to Individual Grading
                    </Link>
                  </Button>
                </div>
              </Card>
            </div>
          </div>

          <Rightsidebar />
        </main>
      </div>
    </SidebarProvider>
  );
}
