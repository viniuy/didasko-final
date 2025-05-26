'use client';

import { Card } from '@/components/ui/card';
import { CalendarClock } from 'lucide-react';
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
import { format } from 'date-fns';
import axiosInstance from '@/lib/axios';

interface Course {
  id: string;
  title: string;
  code: string;
  description: string | null;
  semester: string;
  section: string;
}

interface Schedule {
  id: string;
  courseId: string;
  day: string;
  fromTime: string;
  toTime: string;
  course: Course;
}

// Course Card Component
const CourseCard = ({ schedule }: { schedule: Schedule }) => {
  const router = useRouter();
  const dayStr = schedule.day;
  const timeStr = `${schedule.fromTime} - ${schedule.toTime}`;

  const handleClick = () => {
    router.push(`/attendance/class?courseId=${schedule.courseId}`);
  };

  return (
    <Card
      className='bg-[#FAEDCB] text-[#124A69] rounded-lg shadow-md p-4 w-full cursor-pointer hover:bg-[#F5E5B8] transition-colors'
      onClick={handleClick}
    >
      <h2 className='text-lg font-bold'>{schedule.course.title}</h2>
      <p className='text-sm font-semibold -mt-3'>{schedule.course.section}</p>
      <div className='flex items-center -mt-2 text-gray-600'>
        <CalendarClock size={20} className='mr-2' color='#E1BB56' />
        <p className='text-sm'>
          {dayStr} {timeStr}
        </p>
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
    </div>
  </Card>
);

// Courses Component with Pagination
export default function AttendanceSchedule({
  courseSlug,
}: {
  courseSlug?: string;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const fetchSchedules = async () => {
    if (!session?.user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.get('/courses/schedules', {
        params: {
          facultyId: session.user.id,
          semester: '1st Semester',
          limit: 100,
          courseSlug,
        },
      });
      setSchedules(response.data.schedules || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      setSchedules([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchSchedules();
    }
  }, [status, session?.user?.id]);

  // Calculate pagination
  const totalPages = Math.ceil(schedules.length / itemsPerPage);
  const currentSchedules = schedules.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  if (status === 'loading' || isLoading) {
    return (
      <Card className='w-full p-3 shadow-md rounded-lg'>
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
          {[...Array(4)].map((_, index) => (
            <LoadingSkeleton key={index} index={index} />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className='w-full p-3 shadow-md rounded-lg'>
      <div className='flex flex-wrap justify-center min-w-0 '>
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full'>
          {currentSchedules.map((schedule) => (
            <CourseCard key={schedule.id} schedule={schedule} />
          ))}
        </div>
      </div>

      {schedules.length > itemsPerPage && (
        <Pagination className='-mt-4 flex justify-end'>
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
      )}
    </Card>
  );
}
