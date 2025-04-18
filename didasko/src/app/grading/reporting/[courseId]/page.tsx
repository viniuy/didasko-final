'use client';

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/shared/layout/app-sidebar';
import Header from '@/components/shared/layout/header';
import Rightsidebar from '@/components/shared/layout/right-sidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft, User, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface Course {
  id: string;
  code: string;
  title: string;
  description: string | null;
}

export default function ReportingTypePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const [open, setOpen] = React.useState(false);
  const { courseId } = React.use(params);
  const [course, setCourse] = useState<Course | null>(null);

  useEffect(() => {
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

            <div className='flex-1 overflow-y-auto pb-6'>
              <div className='container mx-auto py-6 max-w-4xl'>
                <div className='mb-6 flex items-center gap-4'>
                  <Button asChild variant='ghost' size='icon'>
                    <Link href='/grading/reporting'>
                      <ArrowLeft className='h-4 w-4' />
                    </Link>
                  </Button>
                  <div>
                    <h1 className='text-2xl font-semibold'>
                      {course?.title || 'Loading...'}
                    </h1>
                    <p className='text-sm text-muted-foreground'>
                      {course?.code || 'Loading...'}
                    </p>
                  </div>
                </div>

                <div className='grid md:grid-cols-2 gap-6'>
                  <Link href={`/grading/reporting/${course?.code}/individual`}>
                    <Card className='p-6 hover:bg-accent transition-colors cursor-pointer h-full'>
                      <div className='flex flex-col items-center text-center space-y-4'>
                        <div className='h-24 w-24 rounded-full bg-secondary flex items-center justify-center'>
                          <User className='h-12 w-12' />
                        </div>
                        <div>
                          <h2 className='text-xl font-semibold'>
                            Individual Reporting
                          </h2>
                          <p className='text-sm text-muted-foreground mt-1'>
                            Grade students one at a time
                          </p>
                        </div>
                        <Button className='w-full bg-[#124A69]'>
                          Select student
                        </Button>
                      </div>
                    </Card>
                  </Link>

                  <Link href={`/grading/reporting/${course?.code}/group`}>
                    <Card className='p-6 hover:bg-accent transition-colors cursor-pointer h-full'>
                      <div className='flex flex-col items-center text-center space-y-4'>
                        <div className='h-24 w-24 rounded-full bg-secondary flex items-center justify-center'>
                          <Users className='h-12 w-12' />
                        </div>
                        <div>
                          <h2 className='text-xl font-semibold'>
                            Group Reporting
                          </h2>
                          <p className='text-sm text-muted-foreground mt-1'>
                            Grade multiple students at once
                          </p>
                        </div>
                        <Button className='w-full bg-[#124A69]'>
                          Select group
                        </Button>
                      </div>
                    </Card>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <Rightsidebar />
        </main>
      </div>
    </SidebarProvider>
  );
}
