import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Book } from 'lucide-react';
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

interface CourseCardProps {
  title: string;
  code: string;
  year: string;
  absents: number;
  date: string;
}

// Course Card Component
const CourseCard = ({ title, code, year, absents, date }: CourseCardProps) => {
  return (
    <Card className='bg-[#124A69] text-white'>
      <CardHeader className='flex justify-between items-center'>
        <CardTitle className='text-lg'>{title}</CardTitle>
        <Book size={20} />
      </CardHeader>
      <CardContent>
        <p className='text-sm'>
          {code} - {year}
        </p>
        <p className='text-sm'>Total Absents: {absents}</p>
        <p className='text-xs text-gray-400'>Last updated: {date}</p>
        <Button
          variant='secondary'
          className='mt-2 bg-[#FAEDCB] text-black text-sm'
        >
          View absents
        </Button>
      </CardContent>
    </Card>
  );
};

// Courses Component with Pagination
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
      title: 'GREAT BOOKS',
      code: 'BSIT 112',
      year: '1ST YEAR',
      absents: 6,
      date: 'Friday, March 14',
    },
    {
      title: 'WEBTECH',
      code: 'BSIT 211',
      year: '2ND YEAR',
      absents: 6,
      date: 'Friday, March 14',
    },
    {
      title: 'DATABASE',
      code: 'BSIT 311',
      year: '3RD YEAR',
      absents: 3,
      date: 'Friday, March 14',
    },
    {
      title: 'OOP',
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
    {
      title: 'MIS',
      code: 'BSIT 111',
      year: '1ST YEAR',
      absents: 6,
      date: 'Friday, March 14',
    },
    {
      title: 'GREAT BOOKS',
      code: 'BSIT 112',
      year: '1ST YEAR',
      absents: 6,
      date: 'Friday, March 14',
    },
    {
      title: 'WEBTECH',
      code: 'BSIT 211',
      year: '2ND YEAR',
      absents: 6,
      date: 'Friday, March 14',
    },
    {
      title: 'DATABASE',
      code: 'BSIT 311',
      year: '3RD YEAR',
      absents: 3,
      date: 'Friday, March 14',
    },
    {
      title: 'OOP',
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
    <Card className='pr-4 pl-4 shadow-md rounded-lg'>
      {/* Flattened Layout */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {currentCourses.map((course, index) => (
          <CourseCard key={index} {...course} />
        ))}
      </div>

      <Pagination className='-mt-4 -mb-2 flex justify-end'>
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
