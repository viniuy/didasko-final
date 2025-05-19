'use client';

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/shared/layout/app-sidebar';
import Header from '@/components/shared/layout/header';
import Rightsidebar from '@/components/shared/layout/right-sidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft, User, Users, Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Course {
  id: string;
  code: string;
  title: string;
  description: string | null;
  section: string;
}

export default function ReportingTypePage({
  params,
}: {
  params: Promise<{ course_code: string; course_section: string }>;
}) {
  const [open, setOpen] = React.useState(false);
  const [isRedirecting, setIsRedirecting] = React.useState(false);
  const { course_code, course_section } = React.use(params);
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`/api/courses/${course_code}`);
        setCourse(response.data);
      } catch (error) {
        console.error('Error fetching course:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (course_code && course_section) {
      fetchCourse();
    }
  }, [course_code, course_section]);

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <div className='relative h-screen w-screen overflow-hidden'>
        <AppSidebar />

        <main className='h-full w-full lg:w-[calc(100%-22.5rem)] pl-[4rem] sm:pl-[5rem] transition-all'>
          <div className='flex flex-col flex-grow px-4'>
            <Header />

            <div className='flex-1 overflow-y-auto pb-6'>
              <div className='mb-6 flex items-center mt-2 gap-4'>
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
                    Section {course?.section || 'Loading...'}
                  </p>
                </div>
              </div>
              <div className='container mx-auto py-6 max-w-4xl'>
                <div className='grid md:grid-cols-2 gap-6'>
                  <Card className='p-6 hover:bg-accent transition-colors h-full'>
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
                      <Button
                        className='w-full bg-[#124A69] hover:bg-gray-800 cursor-pointer'
                        disabled={isLoading || isRedirecting}
                        asChild
                      >
                        <Link
                          href={`/grading/reporting/${course_code}/${course_section}/individual`}
                          onClick={() => setIsRedirecting(true)}
                        >
                          {isLoading ? (
                            'Loading...'
                          ) : isRedirecting ? (
                            <span className='flex items-center gap-2'>
                              <Loader2 className='h-4 w-4 animate-spin' />
                              Redirecting...
                            </span>
                          ) : (
                            'Select student'
                          )}
                        </Link>
                      </Button>
                    </div>
                  </Card>

                  <Link
                    href={`/grading/reporting/${course_code}/${course_section}/group`}
                  >
                    <Card className='p-6 hover:bg-accent transition-colors  h-full'>
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
                        <Button
                          className='w-full bg-[#124A69] hover:bg-gray-800'
                          disabled={isLoading}
                        >
                          {isLoading ? 'Loading...' : 'Select group'}
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
