'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { CourseSchedule } from '@prisma/client';
import axiosInstance from '@/lib/axios';
import { ScheduleResponse } from '@/types/schedule';

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const START_HOUR = 7; // 7 AM
const END_HOUR = 20; // 8 PM
const TOTAL_HOURS = END_HOUR - START_HOUR;

interface ScheduleWithCourse extends CourseSchedule {
  course: {
    id: string;
    code: string;
    title: string;
    room: string;
    semester: string;
    section: string;
  };
}

interface Teacher {
  id: string;
}

interface WeeklyScheduleProps {
  teacherInfo: Teacher;
}

export default function WeeklySchedule({ teacherInfo }: WeeklyScheduleProps) {
  const { data: session, status } = useSession();
  const [schedules, setSchedules] = useState<ScheduleWithCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentDay = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
  });

  const fetchSchedules = async () => {
    if (!teacherInfo?.id) {
      console.log('No teacher ID provided');
      setLoading(false);
      return;
    }

    if (status === 'loading') {
      return;
    }

    if (status === 'unauthenticated') {
      setError('Please sign in to view schedules');
      setLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.get<ScheduleResponse>(
        '/courses/schedules',
        {
          params: {
            facultyId: teacherInfo.id,
            limit: 100,
          },
        },
      );

      if (response.data && Array.isArray(response.data.schedules)) {
        setSchedules(response.data.schedules as ScheduleWithCourse[]);
        setError(null);
      } else {
        console.error('Error fetching schedules: Invalid response format');
        setError('Failed to load schedules');
        setSchedules([]);
      }
    } catch (error) {
      console.error('Error in fetchSchedules:', error);
      setError('Failed to load schedules');
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchSchedules();
  }, [teacherInfo?.id, status]);

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

  const getPositionStyles = (fromTime: string, toTime: string) => {
    const [fromHour, fromMinute] = fromTime.split(':').map(Number);
    const [toHour, toMinute] = toTime.split(':').map(Number);

    const startPosition =
      (fromHour - START_HOUR + fromMinute / 60) * (100 / TOTAL_HOURS);
    const duration =
      (toHour - fromHour + (toMinute - fromMinute) / 60) * (100 / TOTAL_HOURS);

    return {
      top: `${startPosition}%`,
      height: `${duration}%`,
    };
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

  if (error) {
    return (
      <div className='bg-white rounded-lg shadow p-4'>
        <div className='text-red-500 text-center'>{error}</div>
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
      <div className='grid grid-cols-7 gap-0.5 p-4 relative min-h-[400px]'>
        {/* Time grid lines */}
        <div className='absolute inset-0 grid grid-rows-[13] gap-0 pointer-events-none'>
          {Array.from({ length: TOTAL_HOURS + 1 }).map((_, i) => (
            <div key={i} className='w-full border-t border-gray-100' />
          ))}
        </div>

        {days.map((day) => (
          <div key={day} className='relative'>
            <div
              className={`text-center font-semibold mb-4 text-[#124A69] ${
                day === currentDay ? 'text-lg' : 'text-sm'
              }`}
            >
              {day}
            </div>
            <div className='relative h-full flex justify-center'>
              {getSchedulesForDay(day).map((schedule) => {
                const styles = getPositionStyles(
                  schedule.fromTime,
                  schedule.toTime,
                );
                return (
                  <div
                    key={schedule.id}
                    className='absolute w-[90%] bg-[#FAEDCB] rounded-lg p-1 text-[#124A69] shadow-sm items-center'
                    style={styles}
                  >
                    <div className='font-bold text-1xl flex justify-center items-center mt-3 md:text-sm '>
                      {schedule.course.title}
                    </div>
                    <div className='text-sm mt-0.5 flex justify-center md:text-xs'>
                      {formatTime(schedule.fromTime)} -{' '}
                      {formatTime(schedule.toTime)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
