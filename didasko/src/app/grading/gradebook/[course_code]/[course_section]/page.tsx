'use client';
import React, { useState, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/shared/layout/app-sidebar';
import Header from '@/components/shared/layout/header';
import Rightsidebar from '@/components/shared/layout/right-sidebar';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import axiosInstance from '@/lib/axios';
import { GradebookTable } from '@/components/grading/gradebook-table';

interface GradeComponents {
  reportingScore: number;
  recitationScore: number;
  quiz: number;
  passingThreshold: number;
}

export default function GradebookCoursePage({
  params,
}: {
  params: Promise<{ course_code: string; course_section: string }>;
}) {
  const resolvedParams = React.use(params);
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [courseId, setCourseId] = useState<string>('');

  useEffect(() => {
    const fetchCourseId = async () => {
      try {
        console.log('Fetching course ID for:', {
          code: resolvedParams.course_code,
          section: resolvedParams.course_section
        });
        const response = await axiosInstance.get(`/courses`, {
          params: {
            code: resolvedParams.course_code,
            section: resolvedParams.course_section,
          },
        });
        if (response.data.courses && response.data.courses.length > 0) {
          const fetchedCourseId = response.data.courses[0].id;
          console.log('Fetched course ID:', fetchedCourseId);
          setCourseId(fetchedCourseId);
        } else {
          console.warn('No course found for the given code and section');
        }
      } catch (error) {
        console.error('Error fetching course ID:', error);
        toast.error('Failed to fetch course information');
      }
    };

    fetchCourseId();
  }, [resolvedParams.course_code, resolvedParams.course_section]);

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <div className='relative h-screen w-screen overflow-hidden'>
        <AppSidebar />
        <main className='h-full w-full lg:w-[calc(100%-22.5rem)] pl-[4rem] sm:pl-[5rem] transition-all'>
          <div className='flex flex-col flex-grow px-4'>
            <Header />
            <div className='flex-1 p-4'>
              <div className='flex items-center justify-between mb-8'>
                <h1 className='text-3xl font-bold tracking-tight text-[#A0A0A0]'>
                  Gradebook
                </h1>
              </div>

              {courseId && (
                <GradebookTable
                  courseId={courseId}
                  courseCode={resolvedParams.course_code}
                  courseSection={resolvedParams.course_section}
                />
              )}
            </div>
          </div>
          <Rightsidebar />
        </main>
      </div>
    </SidebarProvider>
  );
}
