'use client';

import {
  Home,
  LogOut,
  Book,
  CalendarCheck,
  ClipboardList,
  Settings,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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

const items = [
  { title: 'Dashboard', url: '#', icon: Home },
  { title: 'Courses', url: '#', icon: Book },
  { title: 'Attendance', url: '#', icon: CalendarCheck },
  { title: 'Grading', url: '#', icon: ClipboardList },
  { title: 'Settings', url: '#', icon: Settings },
];

export function AppSidebar() {
  const { open, setOpen } = useSidebar();
  const { data: session } = useSession();

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <Sidebar
      collapsible='icon'
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className='h-screen flex flex-col'
    >
      <SidebarContent className='flex-1'>
        {/* User Profile */}
        <SidebarHeader className='flex flex-row items-center gap-3 px-2 mt-4'>
          <Avatar className='w-12 h-12 shrink-0'>
            <AvatarImage
              src={session?.user?.image || 'https://i.imgur.com/kT3j3Lf.jpeg'}
              className='object-cover'
            />
            <AvatarFallback className='text-xl'>
              {session?.user?.name ? session.user.name.charAt(0) : '?'}
            </AvatarFallback>
          </Avatar>
          <div
            className={`overflow-hidden transition-all duration-300 delay-150 ${
              open
                ? 'opacity-100 translate-x-0 w-auto'
                : 'opacity-0 translate-x-[-10px] w-0'
            }`}
          >
            <p className='text-lg font-semibold whitespace-nowrap'>
              {session?.user?.name || 'Guest User'}
            </p>
            <p className='text-sm text-gray-400 whitespace-nowrap'>
              Academic Head
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
                    className='flex items-center gap-3 p-3 rounded hover:bg-blue-950 w-full'
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Logout Button in Sidebar Footer */}
      <SidebarFooter className='p-4'>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className='flex items-center gap-3 p-3 rounded hover:bg-blue-950 text-black-600'>
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
              <AlertDialogTitle>
                Are you sure you want to logout?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action will log you out of your account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setOpen(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout}>
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarFooter>
    </Sidebar>
  );
}
