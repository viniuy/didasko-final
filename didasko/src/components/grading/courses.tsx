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
import Link from 'next/link';

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
    <Card className='bg-[#124A69] text-white rounded-lg shadow-md p-4 flex flex-col justify-between h-full'>
      <div>
        <CardHeader className='flex justify-between items-center'>
          <CardTitle className='text-lg font-bold'>{course.title}</CardTitle>
          <BookOpenText size={50} />
        </CardHeader>
        <CardContent>
          <p className='text-sm'>{course.code}</p>
          <p className='text-sm'>
            {course.description || 'No description available'}
          </p>
        </CardContent>
      </div>
      <div className='flex justify-end mt-auto p-2'>
        <Button
          asChild
          variant='secondary'
          className='bg-[#FAEDCB] text-black text-sm'
        >
          <Link href={`/grading/reporting/${course.code}`}>View Grades</Link>
        </Button>
      </div>
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
      const response = await fetch(
        `/api/courses/schedules?facultyId=${userId}`,
      );
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
  const allCourses = schedules.map((schedule) => ({
    ...schedule.course,
    id: schedule.course.id || schedule.courseId,
  }));

  // Calculate pagination
  const totalPages = Math.ceil(allCourses.length / itemsPerPage);
  const currentCourses = allCourses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  if (status === 'loading' || isLoading) {
    return (
      <Card className='p-4 shadow-md rounded-lg'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
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
        <p className='text-center text-gray-500'>
          Please sign in to view courses
        </p>
      </Card>
    );
  }

  return (
    <Card className='p-4 shadow-md rounded-lg'>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {currentCourses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>

      <div className='flex justify-between items-center mt-4 px-2'>
        <p className='text-sm text-gray-500'>
          {currentPage * itemsPerPage - (itemsPerPage - 1)}-
          {Math.min(currentPage * itemsPerPage, allCourses.length)} out of{' '}
          {allCourses.length} classes
        </p>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
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
    </Card>
  );
}
