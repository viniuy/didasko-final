'use client';

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Plus,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  Check,
  ChevronsUpDown,
} from 'lucide-react';
import { CourseSheet } from './course-sheet';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from '@/components/ui/pagination';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface Course {
  id: string;
  courseCode: string;
  courseTitle: string;
  semester: string;
  room: string;
  date: string;
  time: string;
  numberOfStudents: number;
  facultyId: string;
  facultyName: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  academicYear: string;
  section: string;
  slug: string;
}

interface FacultyUser {
  id: string;
  name: string;
  image?: string;
}

interface CoursesDataTableProps {
  courses: Course[];
  facultyUsers: FacultyUser[];
  onSaveChanges?: (changes: { id: string; facultyId: string }[]) => void;
  onCourseAdded?: () => void;
}

export function CoursesDataTable({
  courses,
  facultyUsers,
  onSaveChanges,
  onCourseAdded,
}: CoursesDataTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editedCourses, setEditedCourses] = useState<{
    [key: string]: {
      facultyId?: string;
    };
  }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter courses based on search query
  const filteredCourses = courses.filter((course) => {
    const query = searchQuery.toLowerCase();
    return (
      course.courseCode.toLowerCase().includes(query) ||
      course.courseTitle.toLowerCase().includes(query) ||
      course.semester.toLowerCase().includes(query) ||
      course.room.toLowerCase().includes(query) ||
      course.facultyName.toLowerCase().includes(query)
    );
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCourses = filteredCourses.slice(startIndex, endIndex);

  const handleFacultyChange = (courseId: string, facultyId: string) => {
    setEditedCourses((prev) => ({
      ...prev,
      [courseId]: {
        ...prev[courseId],
        facultyId,
      },
    }));

    // Automatically save changes
    if (onSaveChanges) {
      onSaveChanges([{ id: courseId, facultyId }]);
    }
  };

  return (
    <div className='space-y-4 flex flex-col min-h-[calc(100vh-200px)]'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <div className='relative'>
            <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Search courses...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-8 text-sm'
            />
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='outline' size='icon' title='Import Courses'>
            <Upload className='h-4 w-4' />
          </Button>
          <Button variant='outline' size='icon' title='Export Courses'>
            <Download className='h-4 w-4' />
          </Button>
          <CourseSheet mode='add' onSuccess={onCourseAdded} />
        </div>
      </div>

      <div className='rounded-lg border bg-white shadow-sm overflow-x-auto'>
        <div className='min-w-[1000px] max-h-[600px]'>
          <Table>
            <TableHeader>
              <TableRow className='hover:bg-muted/50'>
                <TableHead className='w-[80px] text-sm font-medium'>
                  Course Code
                </TableHead>
                <TableHead className='w-[150px] text-sm font-medium'>
                  Course Title
                </TableHead>
                <TableHead className='w-[70px] text-sm font-medium'>
                  Semester
                </TableHead>
                <TableHead className='w-[90px] text-sm font-medium'>
                  Academic Year
                </TableHead>
                <TableHead className='w-[50px] text-sm font-medium'>
                  Section
                </TableHead>
                <TableHead className='w-[70px] text-sm font-medium'>
                  Room
                </TableHead>
                <TableHead className='w-[100px] text-sm font-medium'>
                  Schedule
                </TableHead>
                <TableHead className='w-[70px] text-sm font-medium'>
                  Students
                </TableHead>
                <TableHead className='w-[70px] text-sm font-medium'>
                  Status
                </TableHead>
                <TableHead className='w-[150px] text-sm font-medium'>
                  Faculty
                </TableHead>
                <TableHead className='w-[70px] text-sm font-medium'>
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentCourses.map((course) => {
                const isEdited = editedCourses[course.id];
                const currentFacultyId =
                  isEdited?.facultyId || course.facultyId;

                return (
                  <TableRow
                    key={course.id}
                    className={`hover:bg-muted/50 ${
                      isEdited ? 'bg-yellow-50' : ''
                    }`}
                  >
                    <TableCell className='font-medium truncate text-sm'>
                      {course.courseCode}
                    </TableCell>
                    <TableCell className='truncate text-sm'>
                      {course.courseTitle}
                    </TableCell>
                    <TableCell className='truncate text-sm'>
                      {course.semester}
                    </TableCell>
                    <TableCell className='truncate text-sm'>
                      {course.academicYear}
                    </TableCell>
                    <TableCell className='truncate text-sm'>
                      {course.section}
                    </TableCell>
                    <TableCell className='truncate text-sm'>
                      {course.room}
                    </TableCell>
                    <TableCell>
                      {course.date && course.time ? (
                        <div className='truncate text-sm'>
                          <div>{course.date}</div>
                          <div className='text-xs text-muted-foreground'>
                            {course.time}
                          </div>
                        </div>
                      ) : (
                        <span className='text-sm text-muted-foreground'>
                          No schedule
                        </span>
                      )}
                    </TableCell>
                    <TableCell className='truncate text-sm text-center'>
                      {course.numberOfStudents}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={course.status}
                        onValueChange={(value) => {
                          // Add status change handler here
                          console.log('Status changed to:', value);
                        }}
                      >
                        <SelectTrigger className='w-[100px] text-sm border-0 p-0 h-auto hover:bg-transparent focus:ring-0'>
                          <SelectValue>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                course.status === 'ACTIVE'
                                  ? 'bg-green-50 text-green-700'
                                  : course.status === 'INACTIVE'
                                  ? 'bg-yellow-50 text-yellow-700'
                                  : 'bg-gray-50 text-gray-700'
                              }`}
                            >
                              {course.status}
                            </span>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='ACTIVE' className='text-sm'>
                            <span className='text-green-700'>Active</span>
                          </SelectItem>
                          <SelectItem value='INACTIVE' className='text-sm'>
                            <span className='text-yellow-700'>Inactive</span>
                          </SelectItem>
                          <SelectItem value='ARCHIVED' className='text-sm'>
                            <span className='text-gray-700'>Archived</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant='outline'
                            role='combobox'
                            className='w-[200px] justify-between'
                          >
                            {currentFacultyId ? (
                              <div className='flex items-center gap-2'>
                                <Avatar className='h-6 w-6 bg-gray-100'>
                                  {facultyUsers.find(
                                    (f) => f.id === currentFacultyId,
                                  )?.image ? (
                                    <AvatarImage
                                      src={
                                        facultyUsers.find(
                                          (f) => f.id === currentFacultyId,
                                        )?.image
                                      }
                                      alt={
                                        facultyUsers.find(
                                          (f) => f.id === currentFacultyId,
                                        )?.name || ''
                                      }
                                    />
                                  ) : (
                                    <AvatarFallback className='bg-gray-100 text-gray-600'>
                                      {facultyUsers
                                        .find((f) => f.id === currentFacultyId)
                                        ?.name?.charAt(0) || ''}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                                <span className='font-medium'>
                                  {course.facultyName || 'Unassigned'}
                                </span>
                              </div>
                            ) : (
                              'Select faculty...'
                            )}
                            <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className='w-[200px] p-0'>
                          <Command>
                            <CommandInput placeholder='Search faculty...' />
                            <CommandEmpty>No faculty found.</CommandEmpty>
                            <CommandGroup>
                              {facultyUsers.map((faculty) => (
                                <CommandItem
                                  key={faculty.id}
                                  value={faculty.name}
                                  onSelect={() => {
                                    handleFacultyChange(course.id, faculty.id);
                                  }}
                                >
                                  <div className='flex items-center gap-2'>
                                    <Avatar className='h-6 w-6 bg-gray-100'>
                                      {faculty.image ? (
                                        <AvatarImage
                                          src={faculty.image}
                                          alt={faculty.name}
                                        />
                                      ) : (
                                        <AvatarFallback className='bg-gray-100 text-gray-600'>
                                          {faculty.name.charAt(0)}
                                        </AvatarFallback>
                                      )}
                                    </Avatar>
                                    <span className='font-medium'>
                                      {faculty.name}
                                    </span>
                                  </div>
                                  <Check
                                    className={cn(
                                      'ml-auto h-4 w-4',
                                      currentFacultyId === faculty.id
                                        ? 'opacity-100'
                                        : 'opacity-0',
                                    )}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <CourseSheet
                          mode='edit'
                          course={course}
                          onSuccess={onCourseAdded}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className='mt-4 border-t border-[#124A69] pt-2'>
        <div className='flex items-center justify-between w-full'>
          <div className='text-xs text-[#124A69] w-full'>
            Showing {startIndex + 1} to{' '}
            {Math.min(endIndex, filteredCourses.length)} of{' '}
            {filteredCourses.length} courses
          </div>
          <div className='flex justify-end'>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    className={`${
                      currentPage === 1 ? 'pointer-events-none opacity-50' : ''
                    } text-[#124A69] hover:bg-[#124A69] hover:text-white`}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className={`text-sm ${
                          currentPage === page
                            ? 'bg-[#124A69] text-white'
                            : 'text-[#124A69] hover:bg-[#124A69] hover:text-white'
                        }`}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}
                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    className={`${
                      currentPage === totalPages
                        ? 'pointer-events-none opacity-50'
                        : ''
                    } text-[#124A69] hover:bg-[#124A69] hover:text-white`}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </div>
    </div>
  );
}
