'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpenText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from '@/components/ui/pagination';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';

interface Course {
  id: string;
  title: string;
  code: string;
  description: string | null;
  semester: string;
}

interface Schedule {
  id: string;
  courseId: string;
  day: Date;
  fromTime: string;
  toTime: string;
  course: Course;
}

const CourseCard = ({ schedule }: { schedule: Schedule }) => {
  return (
    <Card className='bg-[#124A69] text-white rounded-lg shadow-md p-4 w-full max-w-[400px] flex flex-col justify-between h-full'>
      <div>
        <CardHeader className='flex justify-between items-center'>
          <CardTitle className='text-lg font-bold'>
            {schedule.course.title}
          </CardTitle>
          <BookOpenText size={50} />
        </CardHeader>
        <CardContent>
          <p className='text-sm'>{schedule.course.code}</p>
          <p className='text-sm font-semibold'>{schedule.course.description}</p>
          <p className='text-xs text-gray-400'>
            Schedule: {format(new Date(schedule.day), 'EEEE')}{' '}
            {schedule.fromTime} - {schedule.toTime}
          </p>
        </CardContent>
      </div>
      <div className='flex justify-end mt-auto p-2'>
        <Button
          asChild
          variant='secondary'
          className='bg-[#FAEDCB] text-black text-sm'
        >
          <Link href={`/attendance/${schedule.id}`}>View Details</Link>
        </Button>
      </div>
    </Card>
  );
};

// Loading Skeleton Component
const LoadingSkeleton = ({ index }: { index: number }) => (
  <Card key={`skeleton-${index}`} className='animate-pulse'>
    <div className='p-4 space-y-3'>
      <div className='h-6 w-3/4 bg-gray-200 rounded'></div>
      <div className='h-4 w-1/2 bg-gray-200 rounded'></div>
      <div className='h-4 w-2/3 bg-gray-200 rounded'></div>
      <div className='h-8 w-full bg-gray-200 rounded mt-4'></div>
    </div>
  </Card>
);

export default function SecondSemesterCourses() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const fetchUserIdByEmail = async (email: string) => {
    try {
      const response = await fetch(`/api/users?email=${email}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      const data = await response.json();
      return data.id;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  };

  const fetchSchedules = async () => {
    if (!session?.user?.email) {
      setIsLoading(false);
      router.push('/');
      return;
    }

    const userId = await fetchUserIdByEmail(session.user.email);
    if (!userId) {
      setIsLoading(false);
      router.push('/');
      return;
    }

    try {
      const response = await fetch(
        `/api/courses/schedules?facultyId=${userId}`,
      );
      const data = await response.json();
      console.log('API Response:', data);
      if (response.ok) {
        // Filter for second semester courses with null checks
        const secondSemesterSchedules = data.filter((schedule: Schedule) => {
          console.log('Schedule semester:', schedule?.course?.semester);
          return (
            schedule?.course?.semester &&
            schedule.course.semester.trim() === '2nd Semester'
          );
        });
        console.log(
          'Filtered second semester schedules:',
          secondSemesterSchedules,
        );
        setSchedules(secondSemesterSchedules);
      }
    } catch (error) {
      console.error('Error in fetchSchedules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchSchedules();
    } else if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, session?.user?.email, router]);

  const totalPages = Math.ceil(schedules.length / itemsPerPage);
  const currentSchedules = schedules.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  if (status === 'loading' || isLoading) {
    return (
      <Card className='p-4 shadow-md rounded-lg'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          {[...Array(3)].map((_, index) => (
            <LoadingSkeleton key={index} index={index} />
          ))}
        </div>
      </Card>
    );
  }

  if (schedules.length === 0) {
    return (
      <Card className='p-4 shadow-md rounded-lg'>
        <div className='text-center py-8'>
          <BookOpenText className='mx-auto mb-4' size={50} />
          <h2 className='text-xl font-semibold mb-2'>
            No Second Semester Courses
          </h2>
          <p className='text-gray-500'>
            You don't have any courses assigned for the second semester.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className='p-4 shadow-md rounded-lg'>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {currentSchedules.map((schedule) => (
          <CourseCard key={schedule.id} schedule={schedule} />
        ))}
      </div>

      {schedules.length > itemsPerPage && (
        <div className='flex justify-between items-center px-2 mt-4'>
          <p className='text-sm text-gray-500'>
            {currentPage * itemsPerPage - (itemsPerPage - 1)}-
            {Math.min(currentPage * itemsPerPage, schedules.length)} out of{' '}
            {schedules.length} classes
          </p>
          <Pagination className='flex justify-end'>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  className={
                    currentPage === 1 ? 'pointer-events-none opacity-50' : ''
                  }
                />
              </PaginationItem>
              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    isActive={currentPage === i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={
                      currentPage === i + 1 ? 'bg-[#124A69] text-white' : ''
                    }
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  className={
                    currentPage === totalPages
                      ? 'pointer-events-none opacity-50'
                      : ''
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </Card>
  );
}
