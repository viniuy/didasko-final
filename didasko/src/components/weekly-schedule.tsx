'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { CourseSchedule } from '@prisma/client';

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const START_HOUR = 7; // 7 AM
const END_HOUR = 20; // 8 PM
const TOTAL_HOURS = END_HOUR - START_HOUR;

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
                    className='absolute w-[90%] bg-[#FAEDCB] rounded-lg p-2 text-[#124A69] shadow-sm'
                    style={styles}
                  >
                    <div className='font-bold text-1xl flex justify-center'>
                      {schedule.course.title}
                    </div>
                    <div className='text-sm mt-0.5 flex justify-center'>
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
