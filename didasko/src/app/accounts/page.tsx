'use client';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/shared/layout/app-sidebar';
import Header from '@/components/shared/layout/header';
import Rightsidebar from '@/components/shared/layout/right-sidebar';
import React, { useState } from 'react';
import { WorkType } from '@prisma/client';
import AccountList from '@/components/accounts/account-list';
import AccountDetails from '@/components/accounts/account-details';
import AddCourseSheet from '@/components/courses/add-course-sheet';

interface Account {
  id: string;
  name: string;
  email: string;
  workType: WorkType;
}

export default function AccountsPage() {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = useState('');
  const [sortOption, setSortOption] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(
    null,
  );
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

  const handleAddSubject = (teacherId: string) => {
    setSelectedTeacherId(teacherId);
    setIsAddCourseOpen(true);
  };

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <div className='relative h-screen w-screen overflow-hidden'>
        <AppSidebar />

        <main className='h-full w-full lg:w-[calc(100%-22.5rem)] pl-[4rem] sm:pl-[5rem] transition-all overflow-y-auto'>
          <div className='flex flex-col flex-grow px-4'>
            <Header />

            {/* Search Bar */}
            <div className='bg-[#124A69] text-white p-4 rounded-t-lg flex justify-between items-center'>
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
              </div>
              <div className='flex items-center gap-4'>
                <div className='relative'>
                  <input
                    type='text'
                    placeholder='Search by name here'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className='bg-white text-black px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 w-100'
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
                    className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4'
                  >
                    <circle cx='11' cy='11' r='8' />
                    <path d='m21 21-4.3-4.3' />
                  </svg>
                </div>
                <button className='bg-white text-[#124A69] px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2'>
                  <span>Add filter</span>
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
                    className='h-4 w-4'
                  >
                    <path d='M12 5v14' />
                    <path d='M5 12h14' />
                  </svg>
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className='flex-grow overflow-auto p-4'>
              <div className='grid grid-cols-1 gap-4 mb-4'>
                {selectedAccount ? (
                  <AccountDetails
                    account={selectedAccount}
                    onClose={handleBack}
                  />
                ) : (
                  <AccountList
                    search={search}
                    sortOption={sortOption}
                    currentPage={currentPage}
                    itemsPerPage={itemsPerPage}
                    onDepartmentClick={handleDepartmentClick}
                    onAccountClick={handleAccountClick}
                    onPageChange={handlePageChange}
                    onAddSubject={handleAddSubject}
                  />
                )}
              </div>
            </div>
          </div>

          <Rightsidebar />
        </main>
      </div>

      <AddCourseSheet
        open={isAddCourseOpen}
        onOpenChange={setIsAddCourseOpen}
        teacherId={selectedTeacherId}
      />
    </SidebarProvider>
  );
}
