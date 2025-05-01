'use client';

import React, { useState } from 'react';
import { AppSidebar } from '@/components/shared/layout/app-sidebar';
import Header from '@/components/shared/layout/header';
import Rightsidebar from '@/components/shared/layout/right-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GradingTable } from '@/components/grading/grading-table';
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

// Client Component
function IndividualGradingContent({ courseId }: { courseId: string }) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <div className='relative h-screen w-screen overflow-hidden'>
        <AppSidebar />
        <main className='h-full w-full lg:w-[calc(100%-22.5rem)] pl-[4rem] sm:pl-[5rem] transition-all'>
          <div className='flex flex-col flex-grow px-4'>
            <Header />
            <div className='mb-6 flex items-center gap-4'>
              <Button asChild variant='ghost' size='icon'>
                <Link href='/grading/reporting'>
                  <ArrowLeft className='h-4 w-4' />
                </Link>
              </Button>
              <div>
                <h2 className='text-2xl font-semibold'>Individual Grading</h2>
                <p className='text-sm text-muted-foreground'>
                  {courseId} - Individual Grading
                </p>
              </div>
            </div>

            <div className='flex items-center gap-4 mb-6'>
              <div className='relative flex-grow max-w-[300px]'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                <Input
                  placeholder='Search a name'
                  className='w-full pl-9 bg-white border-gray-200 rounded-full h-10'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-[200px] justify-start text-left font-normal',
                      !selectedDate && 'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    {selectedDate ? (
                      format(selectedDate, 'PPP')
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='start'>
                  <Calendar
                    mode='single'
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className='flex-1 overflow-y-auto pb-6'>
              {selectedDate ? (
                <GradingTable
                  courseId={courseId}
                  searchQuery={searchQuery}
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                />
              ) : (
                <div className='flex items-center justify-center h-full text-muted-foreground'>
                  Please select a date to view or create grades
                </div>
              )}
            </div>
          </div>

          <Rightsidebar />
        </main>
      </div>
    </SidebarProvider>
  );
}

// Server Component
export default function IndividualGradingPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = React.use(params);
  return <IndividualGradingContent courseId={courseId} />;
}
