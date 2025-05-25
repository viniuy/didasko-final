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
import { Search, Plus, Download, Upload } from 'lucide-react';
import { CourseSheet } from './course-sheet';

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

interface CoursesDataTableProps {
  courses: Course[];
  onSaveChanges?: (changes: { id: string; facultyId: string }[]) => void;
  onCourseAdded?: () => void;
}

export function CoursesDataTable({
  courses,
  onSaveChanges,
  onCourseAdded,
}: CoursesDataTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editedCourses, setEditedCourses] = useState<{
    [key: string]: {
      facultyId?: string;
    };
  }>({});

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

  const handleFacultyChange = (courseId: string, facultyId: string) => {
    setEditedCourses((prev) => ({
      ...prev,
      [courseId]: {
        ...prev[courseId],
        facultyId,
      },
    }));
  };

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <div className='relative'>
            <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Search courses...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-8'
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

      <div className='rounded-md border bg-white shadow-sm'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course Code</TableHead>
              <TableHead>Course Title</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead>Academic Year</TableHead>
              <TableHead>Section</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>Students</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Faculty</TableHead>
              <TableHead className='w-[70px]'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCourses.map((course) => {
              const isEdited = editedCourses[course.id];
              const currentFacultyId = isEdited?.facultyId || course.facultyId;

              return (
                <TableRow
                  key={course.id}
                  className={isEdited ? 'bg-yellow-50' : ''}
                >
                  <TableCell className='font-medium'>
                    {course.courseCode}
                  </TableCell>
                  <TableCell>{course.courseTitle}</TableCell>
                  <TableCell>{course.semester}</TableCell>
                  <TableCell>{course.academicYear}</TableCell>
                  <TableCell>{course.section}</TableCell>
                  <TableCell>{course.room}</TableCell>
                  <TableCell>
                    {course.date && course.time ? (
                      <div>
                        <div>{course.date}</div>
                        <div className='text-sm text-muted-foreground'>
                          {course.time}
                        </div>
                      </div>
                    ) : (
                      'No schedule'
                    )}
                  </TableCell>
                  <TableCell>{course.numberOfStudents}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        course.status === 'ACTIVE'
                          ? 'bg-green-50 text-green-700'
                          : course.status === 'INACTIVE'
                          ? 'bg-yellow-50 text-yellow-700'
                          : 'bg-gray-50 text-gray-700'
                      }`}
                    >
                      {course.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={currentFacultyId}
                      onValueChange={(value) =>
                        handleFacultyChange(course.id, value)
                      }
                    >
                      <SelectTrigger className='w-[200px]'>
                        <SelectValue placeholder='Select faculty' />
                      </SelectTrigger>
                      <SelectContent>
                        {/* This will be populated with actual faculty data */}
                        <SelectItem value='faculty1'>John Doe</SelectItem>
                        <SelectItem value='faculty2'>Jane Smith</SelectItem>
                      </SelectContent>
                    </Select>
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
  );
}
