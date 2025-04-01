'use client';
import React from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import FacultyLoad from '@/components/faculty-load/faculty-load';
import { SidebarProvider } from '@/components/ui/sidebar';
import Rightsidebar from '@/components/right-sidebar';
import Header from '@/components/header';
import ChatbotButton from '@/components/chatbot-button';

const FacultyLoadPage = () => {
  const [open, setOpen] = React.useState(false);

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <div className="flex h-screen w-screen overflow-hidden relative">
        <div className="w-[15%] h-full absolute left-0 hover:z-50">
          <AppSidebar />
        </div>

        <div className="w-[100%] h-full overflow-hidden flex flex-col pl-6 ml-[3%]">
          <div className="flex items-center justify-between p-4">
            <Header />
            <div className="flex items-center gap-4">
              <button className="text-gray-600 hover:text-gray-900">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
            </div>
          </div>
          <h2 className="px-5 text-3xl font-bold text-[#909090]">Faculty Load</h2>
          <div className="flex-1 p-4">
            <FacultyLoad />
          </div>
        </div>

        <div className="w-[26%] h-full">
          <Rightsidebar />
        </div>
      </div>
      <ChatbotButton />
    </SidebarProvider>
  );
};

export default FacultyLoadPage;
