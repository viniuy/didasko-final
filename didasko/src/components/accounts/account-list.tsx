'use client';
import React, { useEffect, useState } from 'react';
import { Role, WorkType, Permission } from '@prisma/client';
import { UserCircle2 } from 'lucide-react';

interface Account {
  id: string;
  name: string;
  email: string;
  department: string;
  workType: WorkType;
  role: Role;
  permission: Permission;
}

interface AccountListProps {
  search: string;
  sortOption: string;
  currentPage: number;
  itemsPerPage: number;
  onDepartmentClick: (department: string) => void;
  onAccountClick: (account: Account) => void;
  onPageChange: (page: number) => void;
  onAddSubject: (teacherId: string) => void;
}

const AccountList: React.FC<AccountListProps> = ({
  search,
  sortOption,
  currentPage,
  itemsPerPage,
  onDepartmentClick,
  onAccountClick,
  onPageChange,
  onAddSubject,
}) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await fetch('/api/users');
        if (!response.ok) {
          throw new Error('Failed to fetch accounts');
        }
        const data = await response.json();
        setAccounts(data.users);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch accounts',
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccounts();
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

  const filteredAccounts = accounts
    .filter(
      (account) =>
        account.name.toLowerCase().includes(search.toLowerCase()) ||
        account.email.toLowerCase().includes(search.toLowerCase()),
    )
    .filter((account) =>
      sortOption ? account.department === sortOption : true,
    );

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAccounts = filteredAccounts.slice(startIndex, endIndex);
  const totalItems = filteredAccounts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className='flex flex-col space-y-4'>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {currentAccounts.map((account) => (
          <div
            key={account.id}
            className='bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer'
            onClick={() => onAccountClick(account)}
          >
            <div className='flex flex-col items-center space-y-4'>
              {/* Profile Picture */}
              <div className='w-24 h-24 rounded-full overflow-hidden bg-[#124A69] flex items-center justify-center text-white'>
                <UserCircle2 size={64} />
              </div>

              {/* Name */}
              <h3 className='text-lg font-semibold text-gray-900 text-center'>
                {account.name}
              </h3>

              {/* Department */}
              <p
                className='text-sm text-[#124A69] hover:underline cursor-pointer text-center'
                onClick={(e) => {
                  e.stopPropagation();
                  onDepartmentClick(account.department);
                }}
              >
                {account.department}
              </p>

              {/* Role and Permission */}
              <div className='flex items-center space-x-2'>
                <span className='px-2 py-1 text-xs rounded-full bg-[#124A69] text-white'>
                  {account.role}
                </span>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    account.permission === 'GRANTED'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {account.permission}
                </span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddSubject(account.id);
                }}
                className='w-full py-2 bg-[#124A69] text-white text-sm font-medium hover:bg-[#0d3a52] transition-colors flex items-center justify-center gap-1'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='16'
                  height='16'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  className='h-4 w-4'
                >
                  <path d='M12 5v14' />
                  <path d='M5 12h14' />
                </svg>
                Add Subject
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className='flex items-center justify-between'>
        <span className='text-sm text-gray-500'>
          Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} out of{' '}
          {totalItems} accounts
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

export default AccountList;
