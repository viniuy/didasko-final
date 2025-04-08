import { Card } from '@/components/ui/card';
import { CalendarClock } from 'lucide-react';
import { useState } from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from '@/components/ui/pagination';

// Course Card Component
const CourseCard = ({
  title,
  code,
  time,
  day,
}: {
  title: string;
  code: string;
  time: string;
  day: string;
}) => {
  return (
    <Card className='bg-[#FAEDCB] text-[#124A69] rounded-lg shadow-md p-4 w-full'>
      <h2 className='text-lg font-bold'>{title}</h2>
      <p className='text-sm font-semibold -mt-3'>{code}</p>
      <div className='flex items-center -mt-2 text-gray-600'>
        <CalendarClock size={20} className='mr-2' color='#E1BB56' />
        <p className='text-sm'>
          {day} {time}
        </p>
      </div>
    </Card>
  );
};

// Courses Component with Pagination
export default function Courses() {
  const courses = [
    { title: 'MIS', code: 'BSIT 611', time: '7:00 AM - 9:00 AM', day: 'M' },
    {
      title: 'IT CAPSTONE',
      code: 'BSIT 611',
      time: '7:00 AM - 9:00 AM',
      day: 'M',
    },
    {
      title: 'MOBSTECH',
      code: 'BSIT 611',
      time: '7:00 AM - 9:00 AM',
      day: 'M',
    },
    {
      title: 'WEBSTECH',
      code: 'BSIT 611',
      time: '7:00 AM - 9:00 AM',
      day: 'M',
    },
    {
      title: 'DATABASE',
      code: 'BSIT 611',
      time: '9:00 AM - 11:00 AM',
      day: 'T',
    },
    { title: 'OOP', code: 'BSIT 611', time: '1:00 PM - 3:00 PM', day: 'W' },
  ];

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  const totalPages = Math.ceil(courses.length / itemsPerPage);

  const currentCourses = courses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <Card className='w-full p-3 shadow-md rounded-lg'>
      <div className='flex flex-wrap justify-center min-w-0'>
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full'>
          {currentCourses.map((course, index) => (
            <CourseCard key={index} {...course} />
          ))}
        </div>
      </div>

      <Pagination className='mt-4 flex justify-end'>
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
    </Card>
  );
}
