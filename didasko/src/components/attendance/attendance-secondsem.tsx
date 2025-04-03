import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpenText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from '@/components/ui/pagination';
import Link from 'next/link';

interface CourseCardProps {
  title: string;
  code: string;
  year: string;
  absents: number;
  date: string;
}

const CourseCard = ({ title, code, year, absents, date }: CourseCardProps) => {
  return (
    <Card className='bg-[#124A69] text-white rounded-lg shadow-md h-[200px] flex flex-col justify-between'>
      <div className='p-4'>
        <CardHeader className='flex justify-between items-center p-0 mb-4'>
          <CardTitle className='text-lg font-bold'>{title}</CardTitle>
          <BookOpenText size={40} />
        </CardHeader>
        <CardContent className='p-0'>
          <p className='text-sm'>
            {code} - {year}
          </p>
          <p className='text-sm font-semibold'>
            Total Number of Absents: {absents}
          </p>
          <p className='text-xs text-gray-400'>Last updated: {date}</p>
        </CardContent>
      </div>
      <div className='p-4 flex justify-end'>
        <Link
          href={`/course/${code.toLowerCase().replace(/\s+/g, '-')}`}
          className='bg-[#FAEDCB] text-black text-sm px-4 py-2 rounded-md shadow-md hover:bg-[#f5e3b8] transition'
        >
          View Details
        </Link>
      </div>
    </Card>
  );
};

export default function Courses() {
  const courses = [
    {
      title: 'MIS',
      code: 'BSIT 111',
      year: '1ST YEAR',
      absents: 6,
      date: 'Friday, March 14',
    },
    {
      title: 'IT CAPSTONE',
      code: 'BSIT 112',
      year: '1ST YEAR',
      absents: 6,
      date: 'Friday, March 14',
    },
    {
      title: 'MOBSTECH',
      code: 'BSIT 211',
      year: '2ND YEAR',
      absents: 6,
      date: 'Friday, March 14',
    },
    {
      title: 'WEBSTECH',
      code: 'BSIT 311',
      year: '3RD YEAR',
      absents: 3,
      date: 'Friday, March 14',
    },
    {
      title: 'DATABASE',
      code: 'BSIT 221',
      year: '2ND YEAR',
      absents: 2,
      date: 'Friday, March 14',
    },
    {
      title: 'AI & ML',
      code: 'BSIT 411',
      year: '4TH YEAR',
      absents: 1,
      date: 'Friday, March 14',
    },
  ];

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;
  const totalPages = Math.ceil(courses.length / itemsPerPage);

  const currentCourses = courses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <Card className='p-6 shadow-md rounded-lg'>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {currentCourses.map((course, index) => (
          <CourseCard key={index} {...course} />
        ))}
      </div>

      <div className='flex justify-between items-center mt-6 px-2'>
        <p className='text-sm text-gray-500'>
          {currentPage * itemsPerPage - (itemsPerPage - 1)}-
          {Math.min(currentPage * itemsPerPage, courses.length)} out of{' '}
          {courses.length} classes
        </p>
        <Pagination className='flex justify-end'>
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
