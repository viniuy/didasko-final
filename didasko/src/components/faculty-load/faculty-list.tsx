import React from 'react';
import { facultyMembers } from './faculty-data';
import Image from 'next/image';

interface FacultyMember {
  id: string;
  name: string;
  department: string;
  image: string;
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
  const filteredFaculty = facultyMembers
    .filter((faculty) =>
      faculty.name.toLowerCase().includes(search.toLowerCase()),
    )
    .filter((faculty) =>
      sortOption ? faculty.department === sortOption : true,
    );

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentFaculty = filteredFaculty.slice(startIndex, endIndex);
  const totalItems = filteredFaculty.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className='flex flex-col space-y-4'>
      <div className='grid grid-cols-3 gap-4'>
        {currentFaculty.map((faculty) => (
          <div
            key={faculty.id}
            className='bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow'
          >
            <div className='flex items-center space-x-4'>
              <div className='flex-shrink-0'>
                <div className='w-12 h-12 rounded-full overflow-hidden bg-[#124A69]'>
                  <Image
                    src='/icon-person.png'
                    alt={faculty.name}
                    width={48}
                    height={48}
                    className='object-cover w-full h-full'
                  />
                </div>
              </div>
              <div className='flex-1 min-w-0'>
                <div className='flex flex-col items-end space-y-2'>
                  <p className='text-sm font-medium text-gray-900 w-full truncate'>
                    {faculty.name}
                  </p>
                  <button
                    onClick={() => onTeacherClick(faculty)}
                    className='text-xs bg-[#124A69]/80 text-white px-3 py-1.5 rounded hover:bg-[#124A69] transition-colors'
                  >
                    View Schedule
                  </button>
                </div>
                <p
                  className='text-sm text-[#124A69] hover:underline cursor-pointer mt-1'
                  onClick={(e) => {
                    e.stopPropagation();
                    onDepartmentClick(faculty.department);
                  }}
                >
                  {faculty.department}
                </p>
              </div>
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
    </div>
  );
};

export default FacultyList;
