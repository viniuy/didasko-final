'use client';

import { Skeleton } from '@/components/ui/skeleton';
import {
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarProvider,
} from '@/components/ui/sidebar';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

export function DashboardSkeleton() {
  return (
    <SidebarProvider open={false} onOpenChange={() => {}}>
      <div className='flex h-screen w-screen overflow-hidden relative'>
        {/* Sidebar Skeleton */}
        <Sidebar
          collapsible='icon'
          className='h-screen flex flex-col bg-[#124A69] text-white'
        >
          <SidebarContent className='flex-1'>
            {/* User Profile Skeleton */}
            <SidebarHeader className='flex flex-row items-center gap-3 px-2 mt-4'>
              <div className='space-y-2'>
                <Skeleton className='h-12 w-12 rounded-full' />
              </div>
            </SidebarHeader>

            {/* Menu Items Skeleton */}
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {[1, 2, 3, 4].map((i) => (
                    <SidebarMenuItem key={i}>
                      <div className='flex items-center gap-3 p-3 rounded w-full'>
                        <Skeleton className='w-6 h-6' />
                        <Skeleton className='h-4 w-24' />
                      </div>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          {/* Footer Skeleton */}
          <SidebarFooter className='p-4'>
            <div className='flex items-center gap-3 p-3 rounded'>
              <Skeleton className='w-6 h-6' />
              <Skeleton className='h-4 w-16' />
            </div>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content Skeleton */}
        <main className='flex flex-1 h-screen overflow-hidden transition-all'>
          <div className='flex flex-col flex-grow px-6'>
            {/* Welcome Header */}
            <div className='flex justify-between items-center py-6'>
              <Skeleton className='h-8 w-[300px]' />
              <Skeleton className='h-6 w-[200px]' />
            </div>

            {/* Stats Cards */}
            <div className='grid grid-cols-2 gap-6 mb-8'>
              <div className='p-6 border rounded-lg bg-white'>
                <div className='flex justify-between items-center'>
                  <div>
                    <Skeleton className='h-4 w-[140px] mb-2' />
                    <Skeleton className='h-8 w-[60px]' />
                  </div>
                  <Skeleton className='h-10 w-10 rounded-full' />
                </div>
              </div>
              <div className='p-6 border rounded-lg bg-white'>
                <div className='flex justify-between items-center'>
                  <div>
                    <Skeleton className='h-4 w-[140px] mb-2' />
                    <Skeleton className='h-8 w-[60px]' />
                  </div>
                  <Skeleton className='h-10 w-10 rounded-full' />
                </div>
              </div>
            </div>

            {/* Courses Section */}
            <div className='space-y-4'>
              <Skeleton className='h-8 w-[120px] mb-4' />
              <div className='grid grid-cols-3 gap-6'>
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className='p-6 rounded-lg bg-[#124A69] text-white'
                  >
                    <Skeleton className='h-6 w-[100px] mb-3' />
                    <Skeleton className='h-5 w-[140px] mb-2' />
                    <Skeleton className='h-4 w-[160px] mb-4' />
                    <Skeleton className='h-9 w-[120px]' />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className='w-[320px] border-l p-6 bg-white'>
            <div className='space-y-6'>
              <div>
                <div className='flex justify-between items-center mb-4'>
                  <Skeleton className='h-6 w-[140px]' />
                  <Skeleton className='h-6 w-6' />
                </div>
                {[...Array(2)].map((_, i) => (
                  <div key={i} className='mb-4 p-4 border rounded-lg'>
                    <Skeleton className='h-5 w-[200px] mb-2' />
                    <Skeleton className='h-4 w-[120px]' />
                  </div>
                ))}
              </div>
              <div>
                <div className='flex justify-between items-center mb-4'>
                  <Skeleton className='h-6 w-[80px]' />
                  <Skeleton className='h-6 w-6' />
                </div>
                {[...Array(2)].map((_, i) => (
                  <div key={i} className='mb-4 p-4 border rounded-lg'>
                    <Skeleton className='h-5 w-[180px] mb-2' />
                    <Skeleton className='h-4 w-[100px]' />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
