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
  section: string;
  attendanceStats?: {
    totalAbsents: number;
    lastAttendanceDate: string | null;
  };
}

interface Schedule {
  id: string;
  courseId: string;
  day: Date;
  fromTime: string;
  toTime: string;
  course: Course;
}

interface SemesterCoursesProps {
  semester: '1st Semester' | '2nd Semester';
  type: 'attendance' | 'grading';
}

const CourseCard = ({
  schedule,
  type,
}: {
  schedule: Schedule;
  type: 'attendance' | 'grading';
}) => {
  const href =
    type === 'attendance'
      ? `/attendance/class?courseId=${schedule.courseId}`
      : `/grading/reporting/${schedule.course.code}`;

  return (
    <Card className='bg-[#124A69] text-white rounded-lg shadow-md w-full max-w-[400px] flex flex-col justify-between h-45 '>
      <div>
        <CardHeader className='-mt-4 flex justify-between items-center'>
          <CardTitle className='text-2xl font-bold'>
            {schedule.course.title}
          </CardTitle>
          <BookOpenText size={50} />
        </CardHeader>
        <CardContent>
          <p className='text-sm'>Section {schedule.course.section}</p>
          <p className='text-sm font-semibold'>
            Total Number of Absents:{' '}
            {schedule.course.attendanceStats?.totalAbsents || 0}
          </p>
          <p className='text-xs text-gray-400'>
            {schedule.course.attendanceStats?.lastAttendanceDate
              ? `Last attendance: ${new Date(
                  schedule.course.attendanceStats.lastAttendanceDate,
                ).toLocaleDateString()}`
              : 'No attendance yet'}
          </p>
        </CardContent>
      </div>
      <div className='flex justify-end -mt-4 p-2'>
        <Button
          asChild
          variant='secondary'
          className='bg-[#FAEDCB] text-black text-sm'
        >
          <Link href={href}>View Details</Link>
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

export default function SemesterCourses({
  semester,
  type,
}: SemesterCoursesProps) {
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
      if (response.ok) {
        // Fetch attendance stats for each course
        const schedulesWithStats = await Promise.all(
          data.map(async (schedule: Schedule) => {
            const stats = await fetchAttendanceStats(schedule.courseId);
            return {
              ...schedule,
              course: {
                ...schedule.course,
                attendanceStats: stats,
              },
            };
          }),
        );
        // Filter for specified semester courses
        const semesterSchedules = schedulesWithStats.filter(
          (schedule: Schedule) => {
            return (
              schedule?.course?.semester &&
              schedule.course.semester.trim() === semester
            );
          },
        );
        setSchedules(semesterSchedules);
      }
    } catch (error) {
      console.error('Error in fetchSchedules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttendanceStats = async (courseId: string) => {
    try {
      const response = await fetch(`/api/courses/${courseId}/attendance/stats`);
      if (!response.ok) throw new Error('Failed to fetch attendance stats');
      return await response.json();
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
      return null;
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
          <h2 className='text-xl font-semibold mb-2'>No {semester} Courses</h2>
          <p className='text-gray-500'>
            You don't have any courses assigned for the {semester.toLowerCase()}
            .
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className='p-4 shadow-md rounded-lg'>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {currentSchedules.map((schedule) => (
          <CourseCard key={schedule.id} schedule={schedule} type={type} />
        ))}
      </div>

      {schedules.length > itemsPerPage && (
        <div className='flex justify-between items-center px-2 -mt-4'>
          <p className='text-sm text-gray-500 w-40    '>
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
