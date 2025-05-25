'use client';

import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Pencil } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const courseFormSchema = z.object({
  courseCode: z.string().min(1, 'Course code is required'),
  courseTitle: z.string().min(1, 'Course title is required'),
  semester: z.string().min(1, 'Semester is required'),
  room: z.string().min(1, 'Room is required'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  numberOfStudents: z.string().min(1, 'Number of students is required'),
  facultyId: z.string().min(1, 'Faculty is required'),
  academicYear: z.string().min(1, 'Academic year is required'),
  section: z.string().min(1, 'Section is required'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']),
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

interface CourseSheetProps {
  mode: 'add' | 'edit';
  course?: {
    id: string;
    courseCode: string;
    courseTitle: string;
    semester: string;
    room: string;
    date: string;
    time: string;
    numberOfStudents: number;
    facultyId: string;
    academicYear: string;
    section: string;
    status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  };
  onSuccess?: () => void;
}

export function CourseSheet({ mode, course, onSuccess }: CourseSheetProps) {
  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: course
      ? {
          courseCode: course.courseCode,
          courseTitle: course.courseTitle,
          semester: course.semester,
          room: course.room,
          date: course.date,
          time: course.time,
          numberOfStudents: course.numberOfStudents.toString(),
          facultyId: course.facultyId,
          academicYear: course.academicYear,
          section: course.section,
          status: course.status,
        }
      : {
          courseCode: '',
          courseTitle: '',
          semester: '',
          room: '',
          date: '',
          time: '',
          numberOfStudents: '',
          facultyId: '',
          academicYear: '',
          section: '',
          status: 'ACTIVE',
        },
  });

  const onSubmit = async (data: CourseFormValues) => {
    try {
      // TODO: Implement course creation/update logic
      console.log(data);
      onSuccess?.();
    } catch (error) {
      console.error('Error saving course:', error);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant='outline' size='icon'>
          {mode === 'add' ? (
            <Plus className='h-4 w-4' />
          ) : (
            <Pencil className='h-4 w-4' />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {mode === 'add' ? 'Add New Course' : 'Edit Course'}
          </SheetTitle>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4 mt-4'
          >
            <FormField
              control={form.control}
              name='courseCode'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Code</FormLabel>
                  <FormControl>
                    <Input placeholder='Enter course code' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='courseTitle'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Title</FormLabel>
                  <FormControl>
                    <Input placeholder='Enter course title' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='semester'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Semester</FormLabel>
                  <FormControl>
                    <Input placeholder='Enter semester' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='room'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room</FormLabel>
                  <FormControl>
                    <Input placeholder='Enter room' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='academicYear'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Academic Year</FormLabel>
                  <FormControl>
                    <Input placeholder='Enter academic year' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='section'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Section</FormLabel>
                  <FormControl>
                    <Input placeholder='Enter section' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='date'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type='date' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='time'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time</FormLabel>
                  <FormControl>
                    <Input type='time' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='numberOfStudents'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Students</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      placeholder='Enter number of students'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='status'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select status' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='ACTIVE'>Active</SelectItem>
                      <SelectItem value='INACTIVE'>Inactive</SelectItem>
                      <SelectItem value='ARCHIVED'>Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='facultyId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Faculty</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select faculty' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {/* This will be populated with actual faculty data */}
                      <SelectItem value='faculty1'>John Doe</SelectItem>
                      <SelectItem value='faculty2'>Jane Smith</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type='submit' className='w-full'>
              {mode === 'add' ? 'Add Course' : 'Save Changes'}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
