'use client';
import React from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import FacultyLoad from '@/components/faculty-load/faculty-load';
import { SidebarProvider } from '@/components/ui/sidebar';
import Rightsidebar from '@/components/right-sidebar';
import Header from '@/components/header';
import ChatbotButton from '@/components/chatbot-button';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <div className='flex h-screen w-screen overflow-hidden relative'>
        <AppSidebar />
        <main className='flex flex-1 h-screen overflow-hidden transition-all'>
          <div className='flex flex-col flex-grow px-4'>
            <Header />
            <h2 className='px-5 text-3xl font-bold text-[#909090]'>
              Faculty Load
            </h2>
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
