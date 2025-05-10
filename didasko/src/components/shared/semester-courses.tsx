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
import axiosInstance from '@/lib/axios';

interface Course {
  id: string;
  title: string;
  code: string;
  description: string | null;
  semester: string;
  section: string;
  attendanceStats?: {
    totalAbsent: number;
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
  course,
  type,
}: {
  course: Course;
  type: 'attendance' | 'grading';
}) => {
  const href =
    type === 'attendance'
      ? `/attendance/class?courseId=${course.id}`
      : `/grading/reporting/${course.code}/${course.section}`;

  return (
    <Card className='bg-[#124A69] text-white rounded-lg shadow-md w-full max-w-[320px] sm:max-w-[360px] md:max-w-[320px] lg:max-w-[380px] xl:max-w-[440px] flex flex-col justify-between h-45'>
      <div>
        <CardHeader className='-mt-4 flex justify-between items-center'>
          <CardTitle className='text-2xl font-bold'>{course.title}</CardTitle>
          <BookOpenText size={50} />
        </CardHeader>
        <CardContent>
          <p className='text-sm'>Section {course.section}</p>
          <p className='text-sm font-semibold'>
            Total Number of Absents: {course.attendanceStats?.totalAbsent || 0}
          </p>
          <p className='text-xs text-gray-400'>
            {course.attendanceStats?.lastAttendanceDate
              ? `Last attendance: ${new Date(
                  course.attendanceStats.lastAttendanceDate,
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
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  const fetchSchedules = async () => {
    if (!session?.user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.get('/courses', {
        params: {
          facultyId: session.user.id,
          semester,
        },
      });
      const courses = response.data.courses || [];
      const coursesWithStats = await Promise.all(
        courses.map(async (course: Course) => {
          const stats = await fetchAttendanceStats(course.id);
          return {
            ...course,
            attendanceStats: stats,
          };
        }),
      );
      setCourses(coursesWithStats);
    } catch (error) {
      console.error('Error in fetchSchedules:', error);
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttendanceStats = async (courseId: string) => {
    try {
      const response = await axiosInstance.get(
        `/courses/${courseId}/attendance/stats`,
      );
      if (response.status !== 200 || !response.data)
        throw new Error('Failed to fetch attendance stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
      return null;
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchSchedules();
    }
  }, [status, session?.user?.id]);

  const totalPages = Math.ceil(courses.length / itemsPerPage);
  const currentCourses = courses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  if (status === 'loading' || isLoading) {
    return (
      <Card className='p-4 shadow-md rounded-lg'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3'>
          {[...Array(3)].map((_, index) => (
            <LoadingSkeleton key={index} index={index} />
          ))}
        </div>
      </Card>
    );
  }

  if (courses.length === 0) {
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
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8'>
        {currentCourses.map((course) => (
          <CourseCard key={course.id} course={course} type={type} />
        ))}
      </div>

      {courses.length > itemsPerPage && (
        <div className='flex justify-between items-center px-2 -mt-4'>
          <p className='text-sm text-gray-500 w-40    '>
            {currentPage * itemsPerPage - (itemsPerPage - 1)}-
            {Math.min(currentPage * itemsPerPage, courses.length)} out of{' '}
            {courses.length} classes
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
