import { prisma } from '@/lib/db';
import { Permission, Role, WorkType } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Library, Users, UserCheck, UserX } from 'lucide-react';
import { AdminDataTable } from './_components/admin-data-table';
import { AppSidebar } from '@/components/app-sidebar';
import Header from '@/components/header';
import Rightsidebar from '@/components/right-sidebar';

export default async function AdminDashboardPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const fullTimeCount = await prisma.user.count({
    where: { workType: WorkType.FULL_TIME, role: Role.FACULTY },
  });

  const partTimeCount = await prisma.user.count({
    where: { workType: WorkType.PART_TIME, role: Role.FACULTY },
  });

  const grantedCount = await prisma.user.count({
    where: { permission: Permission.GRANTED },
  });

  const deniedCount = await prisma.user.count({
    where: { permission: Permission.DENIED },
  });

  const totalUsers = await prisma.user.count();

  return (
    <div className='flex h-screen w-screen overflow-hidden relative'>
      <AppSidebar />

      <main className='flex flex-1 h-screen overflow-hidden transition-all'>
        <div className='flex flex-col flex-grow px-4'>
          <Header />

          {/* Stats Cards */}
          <div className='grid gap-4 grid-cols-2 md:grid-cols-5 mb-6 mt-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Faculty Full-Time
                </CardTitle>
                <User className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{fullTimeCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Faculty Part-Time
                </CardTitle>
                <Library className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{partTimeCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Granted Users
                </CardTitle>
                <UserCheck className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{grantedCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Denied Users
                </CardTitle>
                <UserX className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{deniedCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Total Users
                </CardTitle>
                <Users className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{totalUsers}</div>
              </CardContent>
            </Card>
          </div>

          {/* Users Table */}
          <div className='mb-4'>
            <h2 className='pl-2 pb-1 text-2xl font-bold text-muted-foreground'>
              Users Management
            </h2>
            <AdminDataTable users={users} />
          </div>
        </div>

        {/* Right Sidebar */}
        <Rightsidebar />
      </main>
    </div>
  );
}
