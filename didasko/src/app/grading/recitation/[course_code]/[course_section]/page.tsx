'use client';

import React, { useState, useEffect } from 'react';
import { AppSidebar } from '@/components/shared/layout/app-sidebar';
import Header from '@/components/shared/layout/header';
import Rightsidebar from '@/components/shared/layout/right-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { GradingTable } from '@/components/grading/grading-table';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import Link from 'next/link';
import { ArrowLeft, Search } from 'lucide-react';

interface Course {
  id: string;
  code: string;
  title: string;
  section: string;
}

// Client Component
function IndividualRecitationContent({
  course_code,
  course_section,
}: {
  course_code: string;
  course_section: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(),
  );
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await axios.get(`/api/courses/${course_code}`);
        setCourse(response.data);
      } catch (error) {
        console.error('Error fetching course:', error);
      } finally {
        setLoading(false);
      }
    };

    if (course_code && course_section) {
      fetchCourse();
    }
  }, [course_code, course_section]);

  if (loading) {
    return (
      <SidebarProvider open={open} onOpenChange={setOpen}>
        <div className='relative h-screen w-screen overflow-hidden'>
          <AppSidebar />
          <main className='h-full w-full lg:w-[calc(100%-22.5rem)] pl-[4rem] sm:pl-[5rem] transition-all'>
            <div className='flex flex-col flex-grow px-4'>
              <Header />
              <div className='flex items-center justify-center h-full'>
                <p className='text-muted-foreground'>
                  Loading course information...
                </p>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!course) {
    return (
      <SidebarProvider open={open} onOpenChange={setOpen}>
        <div className='relative h-screen w-screen overflow-hidden'>
          <AppSidebar />
          <main className='h-full w-full lg:w-[calc(100%-22.5rem)] pl-[4rem] sm:pl-[5rem] transition-all'>
            <div className='flex flex-col flex-grow px-4'>
              <Header />
              <div className='flex items-center justify-center h-full'>
                <p className='text-muted-foreground'>Course not found</p>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <div className='relative h-screen w-screen overflow-hidden'>
        <AppSidebar />
        <main className='h-full w-full lg:w-[calc(100%-22.5rem)] pl-[4rem] sm:pl-[5rem] transition-all'>
          <div className='flex flex-col flex-grow px-4'>
            <Header />
            <div className='flex items-center justify-between mb-8'>
              <h1 className='text-3xl font-bold tracking-tight text-[#A0A0A0]'>
                Recitation
              </h1>
            </div>

            <div className='flex-1 overflow-y-auto pb-6'>
              <GradingTable
                courseId={course.id}
                courseCode={course.code}
                courseSection={course.section}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                isRecitationCriteria={true}
              />
            </div>
          </div>

          <Rightsidebar />
        </main>
      </div>
    </SidebarProvider>
  );
}

// Server Component
export default function IndividualRecitationPage({
  params,
}: {
  params: Promise<{ course_code: string; course_section: string }>;
}) {
  const { course_code, course_section } = React.use(params);
  return (
    <IndividualRecitationContent
      course_code={course_code}
      course_section={course_section}
    />
  );
}
