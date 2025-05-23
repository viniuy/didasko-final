'use client';

import {
  Home,
  LogOut,
  CalendarCheck,
  ClipboardList,
  Settings,
  ChevronDown,
  Presentation,
  NotebookPen,
  BookCheck,
  CalendarClock,
  BookUser,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { cn } from '@/lib/utils';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useSession, signOut } from 'next-auth/react';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { usePathname } from 'next/navigation';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useEffect, useState } from 'react';

const adminItems = [
  { title: 'Home', url: '/dashboard/admin', icon: Home },
  { title: 'Accounts', url: '/accounts', icon: Settings },
];

const academicHeadItems = [
  { title: 'Dashboard', url: '/dashboard/academic-head', icon: Home },
  { title: 'Attendance', url: '/attendance', icon: CalendarCheck },
  { title: 'Faculty Load', url: '/faculty-load', icon: CalendarClock },
];

const gradingSubItems = [
  { title: 'Gradebook', url: '/grading/gradebook', icon: BookUser },
  { title: 'Reporting', url: '/grading/reporting', icon: Presentation },
  { title: 'Recitation', url: '/grading/recitation', icon: BookCheck },
  { title: 'Quiz', url: '/grading/quiz', icon: NotebookPen },
];

function SidebarSkeleton() {
  return (
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
  );
}

export function AppSidebar() {
  const [isGradingOpen, setIsGradingOpen] = useState(false);
  const { open, setOpen } = useSidebar();
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const isAdmin = session?.user?.role === 'ADMIN';
  const items = isAdmin ? adminItems : academicHeadItems;

  const handleLogout = async () => {
    try {
      // First call our custom logout endpoint
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      // Then sign out from NextAuth
      await signOut({
        callbackUrl: '/',
        redirect: true,
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Even if our custom logout fails, still try to sign out from NextAuth
      await signOut({
        callbackUrl: '/',
        redirect: true,
      });
    }
  };

  useEffect(() => {
    if (!open) setIsGradingOpen(false);
  }, [open]);

  if (status === 'loading') {
    return <SidebarSkeleton />;
  }

  const displayName = session?.user?.name || 'Loading...';
  const displayDepartment =
    session?.user?.department || (isAdmin ? 'Administrator' : 'Academic Head');
  const avatarInitial = displayName.charAt(0);
  const userImage = session?.user?.image || undefined;

  return (
    <Sidebar
      collapsible='icon'
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className='fixed top-0 left-0 z-50 h-screen bg-[#124A69] text-white border-[#124A69]'
    >
      <SidebarContent className='flex-1'>
        {/* User Profile */}
        <SidebarHeader className='flex flex-row items-center gap-3 px-2 mt-4'>
          <Avatar className='w-12 h-12 shrink-0'>
            <AvatarImage src={userImage} className='object-cover' />
            <AvatarFallback className='text-xl'>{avatarInitial}</AvatarFallback>
          </Avatar>
          <div
            className={`overflow-hidden transition-all duration-300 delay-150 ${
              open
                ? 'opacity-100 translate-x-0 w-auto'
                : 'opacity-0 translate-x-[-10px] w-0'
            }`}
          >
            <p className='text-lg font-semibold whitespace-nowrap'>
              {displayName}
            </p>
            <p className='text-sm text-gray-400 whitespace-nowrap'>
              {displayDepartment}
            </p>
          </div>
        </SidebarHeader>
        {/* Sidebar Menu */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <a
                    href={item.url}
                    className={`flex items-center gap-3 p-3 rounded hover:bg-gray-800 w-full ${
                      pathname.startsWith(item.url) ? 'bg-gray-800' : ''
                    }`}
                  >
                    <item.icon className='w-6 h-6 shrink-0' />
                    <span
                      className={`whitespace-nowrap transition-all duration-300 ${
                        open
                          ? 'opacity-100 translate-x-0 delay-200'
                          : 'opacity-0 translate-x-[-10px] delay-0'
                      }`}
                    >
                      {open && item.title}
                    </span>
                  </a>
                </SidebarMenuItem>
              ))}

              {!isAdmin && (
                <>
                  <SidebarMenuItem>
                    <Collapsible
                      open={isGradingOpen}
                      onOpenChange={setIsGradingOpen}
                      className='group/collapsible w-full'
                    >
                      <CollapsibleTrigger asChild>
                        <button
                          className={`flex items-center gap-3 p-3 rounded hover:bg-gray-800 w-full ${
                            pathname.startsWith('/grading') ? 'bg-gray-800' : ''
                          }`}
                        >
                          <ClipboardList className='w-6 h-6 shrink-0' />
                          <span
                            className={`whitespace-nowrap transition-all duration-300 ${
                              open
                                ? 'opacity-100 translate-x-0 delay-200'
                                : 'opacity-0 translate-x-[-10px] delay-0'
                            }`}
                          >
                            {open && 'Grading'}
                          </span>
                          <ChevronDown
                            className={`ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180 ${
                              open ? 'opacity-100' : 'opacity-0'
                            }`}
                          />
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className='data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up overflow-hidden'>
                        <SidebarGroupContent>
                          <SidebarMenu>
                            {gradingSubItems.map((item) => (
                              <SidebarMenuItem key={item.title}>
                                <a
                                  href={item.url}
                                  className={`flex items-center gap-3 p-3 rounded hover:bg-gray-800 w-56 h-10 ml-4 ${
                                    pathname.startsWith(item.url)
                                      ? 'bg-gray-800'
                                      : ''
                                  }`}
                                >
                                  <item.icon className='w-6 h-6 shrink-0' />
                                  <span
                                    className={`text-sm transition-all duration-1000 ${
                                      open
                                        ? 'opacity-100 translate-x-0 '
                                        : 'opacity-0 translate-x-[-10px]'
                                    }`}
                                  >
                                    {item.title}
                                  </span>
                                </a>
                              </SidebarMenuItem>
                            ))}
                          </SidebarMenu>
                        </SidebarGroupContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Logout Button in Sidebar Footer */}
      <SidebarFooter className='p-4'>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className='flex items-center gap-3 p-3 rounded hover:bg-gray-800 text-black-600'>
              <LogOut className='w-6 h-6 shrink-0' />
              <span
                className={`transition-all duration-300 ${
                  open
                    ? 'opacity-100 translate-x-0 delay-200'
                    : 'opacity-0 translate-x-[-10px] delay-0'
                }`}
              >
                {open && 'Logout'}
              </span>
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className='text-xl font-semibold'>
                Are you sure you want to logout?
              </AlertDialogTitle>
              <AlertDialogDescription className='text-gray-600'>
                This action will log you out of your account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className='gap-2'>
              <AlertDialogCancel
                onClick={() => setOpen(false)}
                className='border-0 bg-gray-100 hover:bg-gray-200 text-gray-900'
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleLogout}
                className='bg-[#124A69] hover:bg-[#0a2f42] text-white'
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarFooter>
    </Sidebar>
  );
}
