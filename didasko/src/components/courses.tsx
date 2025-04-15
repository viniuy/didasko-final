'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Book } from 'lucide-react';
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
import { format } from 'date-fns';

interface Course {
  id: string;
  title: string;
  code: string;
  description: string | null;
}

interface ScheduleWithCourse {
  id: string;
  courseId: string;
  day: Date;
  fromTime: string;
  toTime: string;
  course: Course;
}

// Course Card Component
const CourseCard = ({ course }: { course: Course }) => {
  return (
    <Card className='bg-[#124A69] text-white'>
      <CardHeader className='flex justify-between items-center'>
        <CardTitle className='text-lg'>{course.title}</CardTitle>
        <Book size={20} />
      </CardHeader>
      <CardContent>
        <p className='text-sm'>
          {course.code}
        </p>
        <p className='text-sm'>{course.description || 'No description available'}</p>
        <Button
          variant='secondary'
          className='mt-2 bg-[#FAEDCB] text-black text-sm'
        >
          View details
        </Button>
      </CardContent>
    </Card>
  );
};

// Loading Skeleton Component
const LoadingSkeleton = ({ index }: { index: number }) => (
  <Card key={`skeleton-${index}`} className='animate-pulse'>
    <CardHeader className='flex justify-between items-center'>
      <div className='h-6 w-24 bg-gray-300 rounded'></div>
      <div className='h-6 w-6 bg-gray-300 rounded'></div>
    </CardHeader>
    <CardContent>
      <div className='space-y-2'>
        <div className='h-4 w-20 bg-gray-300 rounded'></div>
        <div className='h-4 w-32 bg-gray-300 rounded'></div>
        <div className='h-4 w-40 bg-gray-300 rounded'></div>
      </div>
    </CardContent>
  </Card>
);

// Courses Component with Pagination
export default function Courses() {
  const { data: session, status } = useSession();
  const [schedules, setSchedules] = useState<ScheduleWithCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

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
      return;
    }

    const userId = await fetchUserIdByEmail(session.user.email);
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/courses/schedules?facultyId=${userId}`);
      const data = await response.json();
      if (response.ok) {
        setSchedules(data);
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
    }
  }, [status, session?.user?.email]);

  // Get all courses from schedules
  const allCourses = schedules.map(schedule => ({
    ...schedule.course,
    id: schedule.course.id || schedule.courseId,
    scheduleId: schedule.id
  }));

  // Calculate pagination
  const totalPages = Math.ceil(allCourses.length / itemsPerPage);
  const currentCourses = allCourses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (status === 'loading' || isLoading) {
    return (
      <Card className='pr-4 pl-4 shadow-md rounded-lg'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {[...Array(3)].map((_, index) => (
            <LoadingSkeleton key={`loading-${index}`} index={index} />
          ))}
        </div>
      </Card>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <Card className='p-4 shadow-md rounded-lg'>
        <p className='text-center text-gray-500'>Please sign in to view courses</p>
      </Card>
    );
  }

  return (
    <Card className='pr-4 pl-4 shadow-md rounded-lg'>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {currentCourses.map((course) => (
          <CourseCard 
            key={`schedule-${course.scheduleId}`} 
            course={course} 
          />
        ))}
      </div>

      <Pagination className='-mt-4 -mb-2 flex justify-end'>
        <PaginationContent>
          {currentPage > 1 && (
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              />
            </PaginationItem>
          )}
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
          {currentPage < totalPages && (
            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
              />
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
    </Card>
  );
}
