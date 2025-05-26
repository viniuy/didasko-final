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
      <div className='grid grid-cols-7 gap-4 p-4'>
        {days.map((day) => (
          <div
            key={day}
            className={`${day === currentDay ? 'bg-blue-50 rounded-lg' : ''}`}
          >
            <div className='text-center font-semibold mb-4 text-[#124A69] text-sm'>
              {day}
            </div>
            <div className='space-y-2'>
              {getSchedulesForDay(day).map((schedule) => (
                <div key={schedule.id} className='group perspective'>
                  <div className='preserve-3d'>
                    {/* Front of card */}
                    <div className='backface-hidden'>
                      <div className='bg-[#FAEDCB] rounded-lg p-2 text-[#124A69] shadow-sm text-center h-[80px] flex flex-col justify-center'>
                        <div className='font-bold text-sm'>
                          {schedule.course.title}
                        </div>
                        <div className='text-xs mt-1'>
                          {formatTime(schedule.fromTime)} -{' '}
                          {formatTime(schedule.toTime)}
                        </div>
                      </div>
                    </div>
                    {/* Back of card */}
                    <div className='backface-hidden rotate-y-180'>
                      <div className='bg-[#124A69] rounded-lg p-2 text-white shadow-sm text-center h-[80px] flex flex-col justify-center'>
                        <div className='text-xs space-y-1'>
                          <div className='font-semibold'>
                            {schedule.course.code}
                          </div>
                          <div>Section {schedule.course.section}</div>
                          <div>Room {schedule.course.room}</div>
                          <div>Semester {schedule.course.semester}</div>
                        </div>
                      </div>
                    </div>
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
