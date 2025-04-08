'use client';
import React, { useState } from 'react';
import FacultyList from './faculty-list';
import WeeklySchedule from '../weekly-schedule';

interface Teacher {
  id: string;
  name: string;
  department: string;
  image: string;
}

export default function FacultyLoad() {
  const [search, setSearch] = useState('');
  const [sortOption, setSortOption] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const itemsPerPage = 15;

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleDepartmentClick = (department: string) => {
    setSortOption(department);
    setCurrentPage(1);
  };

  const handleTeacherClick = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
  };

  const handleBack = () => {
    setSelectedTeacher(null);
  };

  return (
    <div className='h-full flex flex-col'>
      {/* Search and Filter Bar */}
      {!selectedTeacher && (
        <div className='bg-[#124A69] p-4 rounded-lg mb-4'>
          <div className='flex items-center justify-between'>
            {/* Search Input */}
            <div className='relative'>
              <input
                type='text'
                placeholder='Search by name here'
                className='w-80 p-2 pl-10 rounded-md bg-white text-gray-600 placeholder-gray-400'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <svg
                className='absolute left-3 top-2.5 text-gray-400 w-5 h-5'
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 3a7.5 7.5 0 006.15 13.65z'
                />
              </svg>
            </div>

            {/* Filter Dropdown */}
            <div>
              <select
                className='w-48 p-2 rounded-md bg-white text-gray-600 border-0'
                value={sortOption}
                onChange={(e) => handleDepartmentClick(e.target.value)}
              >
                <option value=''>All</option>
                <option value='IT Department'>IT Department</option>
                <option value='BA Department'>BA Department</option>
                <option value='TM Department'>TM Department</option>
                <option value='HM Department'>HM Department</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className='flex-grow overflow-auto'>
        <div className='grid grid-cols-1 gap-4 mb-4'>
          {selectedTeacher ? (
            <WeeklySchedule teacherInfo={selectedTeacher} onBack={handleBack} />
          ) : (
            <FacultyList
              search={search}
              sortOption={sortOption}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              onDepartmentClick={handleDepartmentClick}
              onTeacherClick={handleTeacherClick}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}
