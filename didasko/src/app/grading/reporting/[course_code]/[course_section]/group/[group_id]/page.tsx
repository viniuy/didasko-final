'use client';

import React from 'react';
import { AppSidebar } from '@/components/shared/layout/app-sidebar';
import Header from '@/components/shared/layout/header';
import Rightsidebar from '@/components/shared/layout/right-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Users, Loader2, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { Group } from '@/components/groups/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GradingTable } from '@/components/grading/grading-table';
import { GroupGradingTable } from '@/components/groups/GroupGradingTable';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/lib/axios';
import { Checkbox } from '@/components/ui/checkbox';

interface Course {
  id: string;
  code: string;
  section: string;
  name: string;
}

interface Rubric {
  id: string;
  name: string;
  date: string;
  criteria: {
    name: string;
    weight: number;
    isGroupCriteria: boolean;
  }[];
  scoringRange: string;
  passingScore: string;
}

interface GradingScore {
  studentId: string;
  scores: number[];
  total: number;
}

export default function GroupGradingPage({
  params,
}: {
  params: Promise<{
    course_code: string;
    course_section: string;
    group_id: string;
  }>;
}) {
  const resolvedParams = React.use(params);
  const [open, setOpen] = React.useState(false);
  const [course, setCourse] = React.useState<Course | null>(null);
  const [group, setGroup] = React.useState<Group | null>(null);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    new Date(),
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseRes, groupRes] = await Promise.all([
          axiosInstance.get(
            `/courses/${resolvedParams.course_code}?section=${resolvedParams.course_section}`,
          ),
          axiosInstance.get(
            `/courses/${resolvedParams.course_code}/groups/${resolvedParams.group_id}`,
          ),
        ]);
        setCourse(courseRes.data);
        if (groupRes.data) {
          const transformedGroup: Group = {
            id: groupRes.data.id,
            number: groupRes.data.number,
            name: groupRes.data.name,
            students: groupRes.data.students.map((student: any) => ({
              id: student.id,
              firstName: student.firstName,
              lastName: student.lastName,
              middleInitial: student.middleInitial,
              image: student.image,
            })),
            leader: groupRes.data.leader
              ? {
                  id: groupRes.data.leader.id,
                  firstName: groupRes.data.leader.firstName,
                  lastName: groupRes.data.leader.lastName,
                  middleInitial: groupRes.data.leader.middleInitial,
                  image: groupRes.data.leader.image,
                }
              : null,
          };
          setGroup(transformedGroup);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [
    resolvedParams.course_code,
    resolvedParams.course_section,
    resolvedParams.group_id,
  ]);

  if (isLoading) {
    return (
      <SidebarProvider open={open} onOpenChange={setOpen}>
        <div className='relative h-screen w-screen overflow-hidden'>
          <AppSidebar />
          <main className='h-full w-full lg:w-[calc(100%-22.5rem)] pl-[4rem] sm:pl-[5rem] transition-all'>
            <div className='flex flex-col flex-grow px-4'>
              <Header />
              <div className='flex items-center justify-center h-full'>
                <p className='text-muted-foreground'>
                  Loading group information...
                </p>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!course || !group) {
    return (
      <SidebarProvider open={open} onOpenChange={setOpen}>
        <div className='relative h-screen w-screen overflow-hidden'>
          <AppSidebar />
          <main className='h-full w-full lg:w-[calc(100%-22.5rem)] pl-[4rem] sm:pl-[5rem] transition-all'>
            <div className='flex flex-col flex-grow px-4'>
              <Header />
              <div className='flex flex-col items-center justify-center h-full gap-4'>
                <Loader2 className='h-8 w-8 animate-spin text-[#124A69]' />
                <p className='text-muted-foreground'>
                  Fetching group information...
                </p>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <div className='relative h-screen w-screen overflow-hidden'>
        <AppSidebar />
        <main className='h-full w-full lg:w-[calc(100%-22.5rem)] pl-[4rem] sm:pl-[5rem] transition-all'>
          <div className='flex flex-col flex-grow px-4'>
            <Header />
            <div className='flex items-center justify-between mb-8'>
              <h1 className='text-3xl font-bold tracking-tight text-[#A0A0A0]'>
                Group {group.number} - {group.name}
              </h1>
              <h1 className='text-2xl font-bold tracking-tight text-[#A0A0A0]'>
                {format(new Date(), 'EEEE, MMMM d')}
              </h1>
            </div>

            <div className='flex-1 overflow-y-auto pb-6'>
              <GradingTable
                courseId={course.id}
                courseCode={course.code}
                courseSection={course.section}
                selectedDate={selectedDate}
                onDateSelect={(date) => setSelectedDate(date)}
                groupId={group.id}
                isGroupView={true}
              />
            </div>
          </div>

          <Rightsidebar />
        </main>
      </div>
    </SidebarProvider>
  );
}
