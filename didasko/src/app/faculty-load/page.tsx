'use client';
import React from 'react';
import { AppSidebar } from '@/components/shared/layout/app-sidebar';
import FacultyLoad from '@/components/faculty-load/faculty-load';
import { SidebarProvider } from '@/components/ui/sidebar';
import Rightsidebar from '@/components/shared/layout/right-sidebar';
import Header from '@/components/shared/layout/header';
import dynamic from 'next/dynamic';

const ChatbotButton = dynamic(() => import('@/components/chatbot-button'), {
  ssr: false,
});

export default function FacultyLoadPage() {
  const [open, setOpen] = React.useState(false);

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <div className='relative h-screen w-screen overflow-hidden'>
        <AppSidebar />
        <main className='h-full w-full lg:w-[calc(100%-22.5rem)] pl-[4rem] sm:pl-[5rem] transition-all'>
          <div className='flex flex-col flex-grow px-4'>
            <Header />

            <div className='flex-1 p-4'>
              <FacultyLoad />
            </div>
          </div>
          <Rightsidebar />
        </main>
      </div>
      <ChatbotButton />
    </SidebarProvider>
  );
}
