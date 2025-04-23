'use client';
import React, { useState } from 'react';
import AccountList from './account-list';
import AccountDetails from './account-details';
import { Role, WorkType, Permission } from '@prisma/client';

interface Account {
  id: string;
  name: string;
  email: string;
  department: string;
  workType: WorkType;
  role: Role;
  permission: Permission;
}

export default function Accounts() {
  const [search, setSearch] = useState('');
  const [sortOption, setSortOption] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const itemsPerPage = 15;

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleDepartmentClick = (department: string) => {
    setSortOption(department);
    setCurrentPage(1);
  };

  const handleAccountClick = (account: Account) => {
    setSelectedAccount(account);
  };

  const handleBack = () => {
    setSelectedAccount(null);
  };

  return (
    <div className='h-full flex flex-col'>
      {/* Search and Filter Bar */}
      <div className='bg-[#124A69] text-white p-4 rounded-t-lg'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            {selectedAccount && (
              <button
                onClick={handleBack}
                className='flex items-center gap-2 text-white hover:text-gray-300 transition-colors'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='24'
                  height='24'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  className='h-5 w-5'
                >
                  <path d='m15 18-6-6 6-6' />
                </svg>
              </button>
            )}
            <h2 className='text-2xl font-bold'>Accounts</h2>
          </div>
          <div className='flex items-center gap-4'>
            <div className='relative'>
              <input
                type='text'
                placeholder='Search...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='bg-white text-black px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 w-64'
              />
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='24'
                height='24'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
                className='absolute right-3 top-1/2 transform -translate-y-1/2 text-white h-4 w-4'
              >
                <circle cx='11' cy='11' r='8' />
                <path d='m21 21-4.3-4.3' />
              </svg>
            </div>
            <select
              value={sortOption}
              onChange={(e) => handleDepartmentClick(e.target.value)}
              className='bg-[#124A69] text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20'
            >
              <option value=''>All Departments</option>
              <option value='IT Department'>IT Department</option>
              <option value='BA Department'>BA Department</option>
              <option value='TM Department'>TM Department</option>
              <option value='HM Department'>HM Department</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className='flex-grow overflow-auto'>
        <div className='grid grid-cols-1 gap-4 mb-4'>
          {selectedAccount ? (
            <AccountDetails account={selectedAccount} />
          ) : (
            <AccountList
              search={search}
              sortOption={sortOption}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              onDepartmentClick={handleDepartmentClick}
              onAccountClick={handleAccountClick}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}
