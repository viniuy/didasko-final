'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { CourseSchedule } from '@prisma/client';

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface ScheduleWithCourse extends CourseSchedule {
  course: {
    title: string;
    code: string;
    description: string;
  };
}

interface Teacher {
  email: string;
}

interface WeeklyScheduleProps {
  teacherInfo: Teacher;
}

export default function WeeklySchedule({ teacherInfo }: WeeklyScheduleProps) {
  const { data: session } = useSession();
  const [schedules, setSchedules] = useState<ScheduleWithCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const currentDay = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
  });

  const fetchUserIdByEmail = async (email: string) => {
    try {
      const response = await fetch(`/api/users?email=${email}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      const data = await response.json();
      return data.id;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  };

  const fetchSchedules = async () => {
    if (!teacherInfo?.email) {
      console.log('No teacher email provided');
      setLoading(false);
      return;
    }

    const userId = await fetchUserIdByEmail(teacherInfo.email);
    if (!userId) {
      console.log('No user ID found');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/courses/schedules?facultyId=${userId}`,
      );
      const data = await response.json();
      if (response.ok) {
        setSchedules(data);
      } else {
        console.error('Error fetching schedules:', data.error);
      }
    } catch (error) {
      console.error('Error in fetchSchedules:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchSchedules();
  }, [teacherInfo?.email]);

  const getSchedulesForDay = (dayName: string) => {
    return schedules
      .filter((schedule) => {
        const scheduleDay = new Date(schedule.day).toLocaleDateString('en-US', {
          weekday: 'short',
        });
        return scheduleDay === dayName;
      })
      .sort((a, b) => {
        return a.fromTime.localeCompare(b.fromTime);
      });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${formattedHour}:${minutes} ${period}`;
  };

  if (loading) {
    return (
      <div className='bg-white rounded-lg shadow p-4'>
        <div className='animate-pulse'>
          <div className='h-4 bg-gray-200 rounded w-1/4 mb-4'></div>
          <div className='space-y-3'>
            <div className='h-4 bg-gray-200 rounded'></div>
            <div className='h-4 bg-gray-200 rounded'></div>
            <div className='h-4 bg-gray-200 rounded'></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-white rounded-lg shadow-sm'>
      <div className='p-4 border-b'>
        <h2 className='text-xl font-bold text-center text-[#124A69]'>
          MY WEEKLY COURSE SCHEDULE
        </h2>
      </div>
      <div className='grid grid-cols-7 gap-4 p-4'>
        {days.map((day) => (
          <div key={day} className='flex flex-col'>
            <div
              className={`text-center font-semibold mb-2 text-[#124A69] ${
                day === currentDay ? 'text-lg -mt-2' : 'text-sm'
              }`}
            >
              {day}
            </div>
            <div className='space-y-2'>
              {getSchedulesForDay(day).map((schedule) => (
                <div
                  key={schedule.id}
                  className='bg-[#FAEDCB] rounded-lg p-3 text-[#124A69] shadow-sm'
                >
                  <div className='font-bold text-sm'>
                    {schedule.course.title}
                  </div>
                  <div className='text-xs opacity-75'>
                    {schedule.course.code}
                  </div>
                  <div className='text-xs mt-1'>
                    {formatTime(schedule.fromTime)} -{' '}
                    {formatTime(schedule.toTime)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
