'use client';

import React from 'react';
import { AppSidebar } from '@/components/shared/layout/app-sidebar';
import Header from '@/components/shared/layout/header';
import Rightsidebar from '@/components/shared/layout/right-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Users, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Course {
  id: string;
  code: string;
  title: string;
  description: string | null;
}

interface Student {
  id: string;
  name: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'NOT_SET';
}

function AddGroupModal({ courseCode }: { courseCode: string }) {
  const [groupNumber, setGroupNumber] = React.useState('');
  const [groupName, setGroupName] = React.useState('');
  const [selectedStudents, setSelectedStudents] = React.useState<string[]>([]);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [studentSearch, setStudentSearch] = React.useState('');

  React.useEffect(() => {
    const fetchStudents = async () => {
      try {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        const res = await fetch(`/api/courses/${courseCode}/students`);
        const data = await res.json();
        // data.students: [{ id, name, status }]
        setStudents(data.students || []);
      } catch (err) {
        setStudents([]);
      }
    };
    if (courseCode) fetchStudents();
  }, [courseCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // TODO: Implement API call to create group
      console.log({
        groupNumber,
        groupName,
        selectedStudents,
      });
    } catch (error) {
      console.error('Error creating group:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Multi-select logic
  const handleStudentSelect = (id: string) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id],
    );
  };

  // Filter students by name or attendance status
  const filteredStudents = students.filter((student) => {
    const search = studentSearch.toLowerCase();
    return (
      student.name.toLowerCase().includes(search) ||
      student.status.toLowerCase().includes(search)
    );
  });

  const statusColor = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'LATE':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'ABSENT':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-500 border-gray-300';
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className='relative h-40 w-40 rounded-full bg-gray-200 flex flex-col items-center justify-center shadow-none transition-all p-0 mb-2 border-none outline-none focus:outline-none cursor-pointer group hover:bg-gray-300'>
          <span className='absolute inset-0 flex items-center justify-center'>
            <svg
              className='h-20 w-20 text-gray-400 opacity-70'
              fill='none'
              stroke='currentColor'
              strokeWidth='1.5'
              viewBox='0 0 24 24'
            >
              <path d='M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2' />
              <circle cx='9' cy='7' r='4' />
              <path d='M23 21v-2a4 4 0 0 0-3-3.87' />
              <path d='M16 3.13a4 4 0 0 1 0 7.75' />
            </svg>
            <svg
              className='h-10 w-10 text-white absolute'
              style={{
                filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.15))',
              }}
              fill='none'
              stroke='currentColor'
              strokeWidth='2.5'
              viewBox='0 0 24 24'
            >
              <path d='M12 5v14m7-7H5' strokeLinecap='round' />
            </svg>
          </span>
          <span className='mt-28 text-base font-bold text-white drop-shadow-sm text-center pointer-events-none select-none'>
            Add groups
            <br />
            manually
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle className='text-2xl font-bold text-[#124A69]'>
            Add groups
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className='grid gap-4 py-4'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div className='flex flex-col'>
                <label
                  htmlFor='groupNumber'
                  className='text-sm font-semibold mb-1'
                >
                  Group Number
                </label>
                <Input
                  id='groupNumber'
                  value={groupNumber}
                  onChange={(e) => setGroupNumber(e.target.value)}
                  placeholder='1'
                  required
                />
              </div>
              <div className='flex flex-col'>
                <label
                  htmlFor='groupName'
                  className='text-sm font-semibold mb-1'
                >
                  Group Name <span className='text-gray-400'>(optional)</span>
                </label>
                <Input
                  id='groupName'
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder='Group Name'
                />
              </div>
            </div>
            <div className='flex flex-col'>
              <label className='text-sm font-semibold mb-1'>Add Students</label>
              <Input
                type='text'
                placeholder='Search students by name or attendance status...'
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className='mb-2'
              />
              <div className='border rounded max-h-40 overflow-y-auto bg-white'>
                {filteredStudents.length === 0 ? (
                  <div className='px-3 py-2 text-gray-400 text-sm'>
                    No students found.
                  </div>
                ) : (
                  filteredStudents.map((student) => (
                    <label
                      key={student.id}
                      className='flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer'
                    >
                      <input
                        type='checkbox'
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => handleStudentSelect(student.id)}
                        className='mr-2'
                      />
                      <span>{student.name}</span>
                      <span
                        className={`ml-3 px-2 py-0.5 rounded text-xs border ${statusColor(
                          student.status,
                        )}`}
                      >
                        {student.status === 'PRESENT'
                          ? 'Present'
                          : student.status === 'LATE'
                          ? 'Late'
                          : student.status === 'ABSENT'
                          ? 'Absent'
                          : 'Not Set'}
                      </span>
                    </label>
                  ))
                )}
              </div>
              <div className='text-xs text-gray-500 mt-1'>
                {selectedStudents.length} out of {students.length} students
                selected
              </div>
            </div>
          </div>
          <div className='flex justify-between gap-4 mt-6'>
            <Button
              type='button'
              variant='outline'
              className='w-1/2'
              onClick={() =>
                document.activeElement &&
                (document.activeElement as HTMLElement).blur()
              }
            >
              Cancel
            </Button>
            <Button
              type='submit'
              className='w-1/2 bg-[#124A69] text-white'
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Adding...
                </>
              ) : (
                'Add group'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function GroupGradingPage({
  params,
}: {
  params: { course_code: string; course_section: string };
}) {
  const [open, setOpen] = React.useState(false);
  const [course, setCourse] = React.useState<Course | null>(null);
  const [selectedDate, setSelectedDate] = React.useState<Date>();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await fetch(`/api/courses/${params.course_code}`);
        if (!response.ok) throw new Error('Failed to fetch course');
        const data = await response.json();
        setCourse(data);
      } catch (error) {
        console.error('Error fetching course:', error);
      }
    };

    if (params.course_code) {
      fetchCourse();
    }
  }, [params.course_code]);

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <div className='relative h-screen w-screen overflow-hidden'>
        <AppSidebar />

        <main className='h-full w-full lg:w-[calc(100%-22.5rem)] pl-[4rem] sm:pl-[5rem] transition-all'>
          <div className='flex flex-col flex-grow px-4'>
            <Header />
            <div className='flex justify-between gap-4 mb-1 mt-1'>
              <h1 className='text-3xl font-bold tracking-tight text-[#A0A0A0]'>
                Group Management
              </h1>
              <h1 className='text-2xl font-bold tracking-tight text-[#A0A0A0]'>
                {format(new Date(), 'EEEE, MMMM d, yyyy')}
              </h1>
            </div>

            <div className='flex-1 overflow-y-auto pb-6'>
              <div className='bg-white rounded-lg shadow-md'>
                {/* Header Bar with background */}
                <div className='flex items-center gap-2 px-4 py-3 border-b bg-[#F5F6FA] rounded-t-lg'>
                  <Button asChild variant='ghost' size='icon'>
                    <Link href='/grading/reporting'>
                      <ArrowLeft className='h-4 w-4' />
                    </Link>
                  </Button>
                  <div className='flex flex-col mr-4'>
                    <span className='text-lg font-bold text-[#124A69] leading-tight'>
                      {course?.code}
                    </span>
                    <span className='text-sm text-gray-500'>
                      {params.course_section}
                    </span>
                  </div>
                  <div className='flex-1 flex items-center gap-2'>
                    <div className='relative w-64'>
                      <svg
                        className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        viewBox='0 0 24 24'
                      >
                        <circle cx='11' cy='11' r='8' />
                        <path d='m21 21-4.3-4.3' />
                      </svg>
                      <Input
                        placeholder='Search a group'
                        className='w-full pl-9 rounded-full border-gray-200 h-9 bg-[#F5F6FA]'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className='flex items-center gap-2'>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant='outline'
                            className='w-[140px] h-9 rounded-full border-gray-200 bg-[#F5F6FA] justify-between'
                          >
                            <span>Filter</span>
                            <svg
                              className='h-4 w-4 text-gray-500'
                              fill='none'
                              stroke='currentColor'
                              strokeWidth='2'
                              viewBox='0 0 24 24'
                            >
                              <path d='M19 9l-7 7-7-7' />
                            </svg>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className='w-[200px] p-4'>
                          <div className='space-y-3'>
                            <div className='flex items-center space-x-2'>
                              <Checkbox id='active' />
                              <label
                                htmlFor='active'
                                className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                              >
                                Active Groups
                              </label>
                            </div>
                            <div className='flex items-center space-x-2'>
                              <Checkbox id='completed' />
                              <label
                                htmlFor='completed'
                                className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                              >
                                Completed Groups
                              </label>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <Button className='ml-2 h-9 px-4 bg-[#124A69] text-white rounded shadow flex items-center gap-2'>
                      Export to PDF
                    </Button>
                  </div>
                </div>

                {/* Content Area */}
                <div className='p-6'>
                  <div className='flex flex-col items-center justify-center min-h-[300px]'>
                    <span className='text-gray-400 text-base mb-8'>
                      No added groups yet
                    </span>
                    <div className='flex flex-row gap-12 items-center justify-center'>
                      <AddGroupModal courseCode={params.course_code} />
                      {/* Add Groups Using Randomizer - Circular Button */}
                      <button
                        className='relative h-40 w-40 rounded-full bg-gray-200 flex flex-col items-center justify-center shadow-none transition-all p-0 mb-2 border-none outline-none focus:outline-none cursor-pointer group'
                        disabled
                      >
                        <span className='absolute inset-0 flex items-center justify-center'>
                          <svg
                            className='h-20 w-20 text-gray-400 opacity-70'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='1.5'
                            viewBox='0 0 24 24'
                          >
                            <rect x='3' y='3' width='18' height='18' rx='2' />
                            <path d='M3 9h18M3 15h18M9 3v18M15 3v18' />
                          </svg>
                          <svg
                            className='h-10 w-10 text-white absolute'
                            style={{
                              filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.15))',
                            }}
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='2.5'
                            viewBox='0 0 24 24'
                          >
                            <path d='M12 5v14m7-7H5' strokeLinecap='round' />
                          </svg>
                        </span>
                        <span className='mt-28 text-base font-bold text-white drop-shadow-sm text-center pointer-events-none select-none'>
                          Add groups
                          <br />
                          using a randomizer
                        </span>
                      </button>
                    </div>
                  </div>
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
