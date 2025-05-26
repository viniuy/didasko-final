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
import { Plus, Pencil, CalendarIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const courseFormSchema = z.object({
  courseCode: z
    .string()
    .min(1, 'Course code is required')
    .max(10, 'Course code must be at most 10 characters'),
  courseTitle: z
    .string()
    .min(1, 'Course title is required')
    .max(100, 'Course title must be at most 100 characters'),
  semester: z.string().min(1, 'Semester is required'),
  room: z
    .string()
    .min(1, 'Room is required')
    .max(20, 'Room must be at most 20 characters'),
  day: z.enum(
    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    {
      required_error: 'Day is required',
    },
  ),
  time: z.string().min(1, 'Time is required'),
  academicYear: z.string().min(1, 'Academic year is required'),
  section: z
    .string()
    .min(1, 'Section is required')
    .max(20, 'Section must be at most 20 characters'),
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
    day:
      | 'Monday'
      | 'Tuesday'
      | 'Wednesday'
      | 'Thursday'
      | 'Friday'
      | 'Saturday';
    time: string;
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
          day: course.day,
          time: course.time,
          academicYear: course.academicYear,
          section: course.section,
          status: course.status,
        }
      : {
          courseCode: '',
          courseTitle: '',
          semester: '',
          room: '',
          day: 'Monday',
          time: '',
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
        {mode === 'add' ? (
          <Button className='ml-auto bg-[#124A69] text-white hover:bg-gray-700'>
            <Plus className='mr-2 h-4 w-4' /> Add Course
          </Button>
        ) : (
          <Button variant='outline' size='icon'>
            <Pencil className='h-4 w-4' />
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side='right' className='sm:max-w-md p-4'>
        <SheetHeader>
          <SheetTitle>
            {mode === 'add' ? 'Add Course' : 'Edit Course'}
          </SheetTitle>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4 py-4 h-full flex flex-col'
          >
            <div className='flex-1 overflow-y-auto'>
              <FormField
                control={form.control}
                name='courseTitle'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='e.g., Introduction to Programming'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='courseCode'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Code</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g., IT101' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='semester'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Semester</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select semester' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='1st Semester'>
                            1st Semester
                          </SelectItem>
                          <SelectItem value='2nd Semester'>
                            2nd Semester
                          </SelectItem>
                        </SelectContent>
                      </Select>
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
                        <Input placeholder='e.g., 2023-2024' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name='section'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g., BSIT-111' {...field} />
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
                      <Input placeholder='e.g., Room 101' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='day'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select day' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='Monday'>Monday</SelectItem>
                          <SelectItem value='Tuesday'>Tuesday</SelectItem>
                          <SelectItem value='Wednesday'>Wednesday</SelectItem>
                          <SelectItem value='Thursday'>Thursday</SelectItem>
                          <SelectItem value='Friday'>Friday</SelectItem>
                          <SelectItem value='Saturday'>Saturday</SelectItem>
                        </SelectContent>
                      </Select>
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
              </div>
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
            </div>
            <div className='flex justify-start gap-2 pt-4 border-t mt-4'>
              <Button
                type='button'
                variant='outline'
                className='w-1/2'
                onClick={() => form.reset()}
              >
                Reset
              </Button>
              <Button
                type='submit'
                className='bg-[#124A69] text-white hover:bg-gray-700 w-1/2'
              >
                {mode === 'add' ? 'Create Subject' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
