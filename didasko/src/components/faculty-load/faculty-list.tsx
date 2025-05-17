'use client';
import React, { useEffect, useState } from 'react';
import { Role, WorkType } from '@prisma/client';
import { UserCircle2 } from 'lucide-react';

interface Course {
  id: string;
  code: string;
  title: string;
  description: string | null;
  semester: string;
  schedules: {
    id: string;
    day: Date;
    fromTime: string;
    toTime: string;
  }[];
  students: {
    id: string;
  }[];
}

interface FacultyMember {
  id: string;
  name: string;
  email: string;
  department: string;
  workType: WorkType;
  role: Role;
  coursesTeaching: Course[];
}

interface FacultyListProps {
  search: string;
  sortOption: string;
  currentPage: number;
  itemsPerPage: number;
  onDepartmentClick: (department: string) => void;
  onTeacherClick: (teacher: FacultyMember) => void;
  onPageChange: (page: number) => void;
}

const FacultyList: React.FC<FacultyListProps> = ({
  search,
  sortOption,
  currentPage,
  itemsPerPage,
  onDepartmentClick,
  onTeacherClick,
  onPageChange,
}) => {
  const [faculty, setFaculty] = useState<FacultyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        const response = await fetch('/api/users/faculty');
        if (!response.ok) {
          throw new Error('Failed to fetch faculty');
        }
        const data = await response.json();
        setFaculty(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch faculty',
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchFaculty();
  }, []);

  if (isLoading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#124A69]'></div>
      </div>
    );
  }

  if (error) {
    return <div className='text-center text-red-500 p-4'>Error: {error}</div>;
  }

  const filteredFaculty = faculty
    .filter((faculty) =>
      faculty.name.toLowerCase().includes(search.toLowerCase()),
    )
    .filter((faculty) =>
      sortOption ? faculty.department === sortOption : true,
    );

  const startIndex = (currentPage - 1) * Math.min(itemsPerPage, 8);
  const endIndex = startIndex + Math.min(itemsPerPage, 8);
  const currentFaculty = filteredFaculty.slice(startIndex, endIndex);
  const totalItems = filteredFaculty.length;
  const totalPages = Math.ceil(totalItems / Math.min(itemsPerPage, 8));
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className='flex flex-col space-y-4 min-h-[600px]'>
      {filteredFaculty.length === 0 ? (
        <div className='flex flex-col items-center justify-center h-96 text-gray-500'>
          <UserCircle2 size={72} className='mb-6 text-gray-400' />
          <p className='text-2xl font-medium mb-2'>No teachers found</p>
          <p className='text-base text-gray-400'>
            {search
              ? 'Try adjusting your search'
              : 'No teachers in this department'}
          </p>
        </div>
      ) : (
        <>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 min-h-[630px] grid-auto-rows-[minmax(0,auto)]'>
            {currentFaculty.map((faculty) => (
              <div
                key={faculty.id}
                className='bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow mt-5 h-fit'
              >
                <div className='flex flex-col items-center space-y-4'>
                  {/* Profile Picture */}
                  <div className='w-24 h-24 rounded-full overflow-hidden bg-[#124A69] flex items-center justify-center text-white'>
                    <UserCircle2 size={64} />
                  </div>

                  {/* Name */}
                  <h3 className='text-lg font-semibold text-gray-900 text-center'>
                    {faculty.name}
                  </h3>

                  {/* Department */}
                  <p
                    className='text-sm text-[#124A69] hover:underline cursor-pointer text-center'
                    onClick={(e) => {
                      e.stopPropagation();
                      onDepartmentClick(faculty.department);
                    }}
                  >
                    {faculty.department}
                  </p>

                  {/* View Schedule Button */}
                  <button
                    onClick={() => onTeacherClick(faculty)}
                    className='w-full bg-[#124A69] text-white px-4 py-2 rounded-full hover:bg-[#0D3A54] transition-colors text-sm font-medium'
                  >
                    View Schedule
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-gray-500'>
              Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} out of{' '}
              {totalItems} faculty members
            </span>
            <div className='flex items-center gap-1'>
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className='p-1 text-gray-600 hover:text-gray-900 disabled:text-gray-400'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-5 w-5'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                >
                  <path
                    fillRule='evenodd'
                    d='M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z'
                    clipRule='evenodd'
                  />
                </svg>
              </button>

              {pageNumbers.map((number) => (
                <button
                  key={number}
                  onClick={() => onPageChange(number)}
                  className={`w-8 h-8 text-sm rounded-lg ${
                    currentPage === number
                      ? 'bg-[#124A69] text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {number}
                </button>
              ))}

              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className='p-1 text-gray-600 hover:text-gray-900 disabled:text-gray-400'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-5 w-5'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                >
                  <path
                    fillRule='evenodd'
                    d='M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z'
                    clipRule='evenodd'
                  />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FacultyList;
