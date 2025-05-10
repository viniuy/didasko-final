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
import { toast } from 'react-hot-toast';

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

interface Group {
  id: string;
  number: string;
  name: string | null;
  students: {
    id: string;
    firstName: string;
    lastName: string;
    middleInitial: string | null;
    image: string | null;
  }[];
  leader: {
    id: string;
    firstName: string;
    lastName: string;
    middleInitial: string | null;
    image: string | null;
  } | null;
}

function AddGroupModal({ courseCode, excludedStudentIds = [], nextGroupNumber, onGroupAdded }: { courseCode: string; excludedStudentIds?: string[]; nextGroupNumber?: number; onGroupAdded?: () => void }) {
  const [groupNumber, setGroupNumber] = React.useState('');
  const [groupName, setGroupName] = React.useState('');
  const [selectedStudents, setSelectedStudents] = React.useState<string[]>([]);
  const [selectedLeader, setSelectedLeader] = React.useState<string>('');
  const [students, setStudents] = React.useState<Student[]>([]);  
  const [isLoading, setIsLoading] = React.useState(false);
  const [studentSearch, setStudentSearch] = React.useState('');
  const [open, setOpen] = React.useState(false);

  // Fetch students immediately when component mounts
  React.useEffect(() => {
    const fetchStudents = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/courses/${courseCode}/students`);
        const data = await res.json();
        setStudents(data.students || []);
      } catch (err) {
        console.error('Error fetching students:', err);
        setStudents([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, [courseCode]);

  // Set default group number when nextGroupNumber changes
  React.useEffect(() => {
    if (nextGroupNumber !== undefined && nextGroupNumber !== null) {
      setGroupNumber(String(nextGroupNumber));
    }
  }, [nextGroupNumber]);

  // Filter out students already in a group
  const availableStudents = students.filter(student => !excludedStudentIds.includes(student.id));

  // Filter students by name or attendance status
  const filteredStudents = availableStudents.filter((student) => {
    const search = studentSearch.toLowerCase();
    return (
      student.name.toLowerCase().includes(search) ||
      student.status.toLowerCase().includes(search)
    );
  });

  // Multi-select logic
  const handleStudentSelect = (id: string) => {
    setSelectedStudents((prev) => {
      const newSelected = prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id];
      // If the leader is no longer in the selected students, clear the leader
      if (!newSelected.includes(selectedLeader)) {
        setSelectedLeader('');
      }
      return newSelected;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(`/api/courses/${courseCode}/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupNumber,
          groupName,
          studentIds: selectedStudents,
          leaderId: selectedLeader,
        }),
      });

      if (!response.ok) {
        toast.error('Failed to create group');
        throw new Error('Failed to create group');
      }

      // Gracefully close the modal, reset form, and notify parent to refresh groups
      setGroupNumber(nextGroupNumber ? String(nextGroupNumber + 1) : '');
      setGroupName('');
      setSelectedStudents([]);
      setSelectedLeader('');
      setOpen(false);
      if (onGroupAdded) onGroupAdded();
      toast.success('Group created successfully!');
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Error creating group');
    } finally {
      setIsLoading(false);
    }
  };

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
    <Dialog open={open} onOpenChange={setOpen}>
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
              <label className='text-sm font-semibold mb-1'>Group Leader</label>
              <Select
                value={selectedLeader}
                onValueChange={setSelectedLeader}
                disabled={selectedStudents.length === 0}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder={selectedStudents.length === 0 ? 'Select students first' : 'Select a leader'} />
                </SelectTrigger>
                <SelectContent>
                  {filteredStudents
                    .filter((student) => selectedStudents.includes(student.id))
                    .map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
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
                {selectedStudents.length} out of {filteredStudents.length} students
                selected
              </div>
            </div>
          </div>
          <div className='flex justify-between gap-4 mt-6'>
            <Button
              type='button'
              variant='outline'
              className='w-1/2'
              onClick={() => setOpen(false)}
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
  params: Promise<{ course_code: string; course_section: string }>;
}) {
  const resolvedParams = React.use(params);
  const [open, setOpen] = React.useState(false);
  const [course, setCourse] = React.useState<Course | null>(null);
  const [selectedDate, setSelectedDate] = React.useState<Date>();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [groups, setGroups] = React.useState<Group[]>([]);

  React.useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await fetch(`/api/courses/${resolvedParams.course_code}`);
        if (!response.ok) throw new Error('Failed to fetch course');
        const data = await response.json();
        setCourse(data);
      } catch (error) {
        console.error('Error fetching course:', error);
      }
    };

    const fetchGroups = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/courses/${resolvedParams.course_code}/groups`);
        if (!response.ok) throw new Error('Failed to fetch groups');
        const data = await response.json();
        setGroups(data);
      } catch (error) {
        console.error('Error fetching groups:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (resolvedParams.course_code) {
      fetchCourse();
      fetchGroups();
    }
  }, [resolvedParams.course_code]);

  // Filter groups based on search query
  const filteredGroups = groups.filter((group) => {
    const search = searchQuery.toLowerCase();
    return (
      group.number.toLowerCase().includes(search) ||
      (group.name && group.name.toLowerCase().includes(search)) ||
      group.students.some(
        (student) =>
          student.firstName.toLowerCase().includes(search) ||
          student.lastName.toLowerCase().includes(search)
      )
    );
  });

  // Compute all student IDs already in a group
  const excludedStudentIds = groups.flatMap(g => g.students.map(s => s.id));
  // Compute next group number (max + 1)
  const maxGroupNumber = groups.length > 0 ? Math.max(...groups.map(g => Number(g.number) || 0)) : 0;
  const nextGroupNumber = maxGroupNumber + 1;

  // Function to refresh groups after adding
  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/courses/${resolvedParams.course_code}/groups`);
      if (!response.ok) throw new Error('Failed to fetch groups');
      const data = await response.json();
      setGroups(data);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
                      {resolvedParams.course_section}
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
                  {isLoading ? (
                    <div className='flex items-center justify-center min-h-[300px]'>
                      <Loader2 className='h-8 w-8 animate-spin text-gray-400' />
                    </div>
                  ) : (
                    <>
                      {filteredGroups.length === 0 ? (
                        <div className='flex flex-row gap-12 items-center justify-center mb-8'>
                          <AddGroupModal courseCode={resolvedParams.course_code} excludedStudentIds={excludedStudentIds} nextGroupNumber={nextGroupNumber} onGroupAdded={fetchGroups} />
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
                      ) : (
                        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 items-start justify-center min-h-[300px]'>
                          {filteredGroups.map((group) => (
                            <Card key={group.id} className='w-80 p-6 flex flex-col items-center shadow-lg'>
                              <div className='mb-4'>
                                <svg
                                  className='h-20 w-20 text-gray-400'
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
                              </div>
                              <h2 className='text-2xl font-bold text-[#124A69] text-center -mb-2'>
                                Group {group.number}:
                              </h2>
                              {group.name ? (
                                <p className='text-xl text-[#124A69] font-sm text-center -mt-3'>
                                  {group.name}
                                </p>
                              ) : (
                                <div className='text-xl text-[#124A69] font-sm text-center -mt-3' style={{ visibility: 'hidden' }}>
                                  &nbsp;
                                </div>
                              )}
                              <Button className='w-full bg-[#124A69] text-white font-semibold rounded mt-2'>
                                View group
                              </Button>
                            </Card>
                          ))}
                          {/* Add Buttons at the end of the grid */}
                          <div className='flex flex-col gap-8'>
                            <AddGroupModal courseCode={resolvedParams.course_code} excludedStudentIds={excludedStudentIds} nextGroupNumber={nextGroupNumber} onGroupAdded={fetchGroups} />
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
                      )}
                    </>
                  )}
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
