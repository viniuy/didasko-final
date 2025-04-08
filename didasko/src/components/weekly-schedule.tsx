import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';

interface WeeklyScheduleProps {
  teacherId?: string;
  teacherInfo: {
    id: string;
    name: string;
    department: string;
    image: string;
  };
  onBack: () => void;
}

const scheduleData = [
  {
    day: 'Mon',
    course: 'IT CAPSTONE',
    time: '8:00 AM - 10:30 AM',
    details: 'Room: 101 | Section: A | Students: 30',
  },
  {
    day: 'Mon',
    course: 'OOP',
    time: '11:00 AM - 2:00 PM',
    details: 'Room: 101 | Section: A | Students: 30',
  },
  {
    day: 'Mon',
    course: 'PIIST',
    time: '3:00 PM - 5:30 PM',
    details: 'Room: 101 | Section: A | Students: 30',
  },
  {
    day: 'Tue',
    course: 'IAS',
    time: '8:00 AM - 10:30 AM',
    details: 'Room: 101 | Section: A | Students: 30',
  },
  {
    day: 'Tue',
    course: 'EUTHENICS',
    time: '11:00 AM - 2:00 PM',
    details: 'Room: 101 | Section: A | Students: 30',
  },
  {
    day: 'Wed',
    course: 'MOBSTECH',
    time: '10:30 AM - 1:30 PM',
    details: 'Room: 101 | Section: A | Students: 30',
  },
  {
    day: 'Wed',
    course: 'MIS',
    time: '2:00 PM - 4:30 PM',
    details: 'Room: 101 | Section: A | Students: 30',
  },
  {
    day: 'Thu',
    course: 'ETHICS',
    time: '8:00 AM - 10:30 AM',
    details: 'Room: 101 | Section: A | Students: 30',
  },
  {
    day: 'Thu',
    course: 'GREAT BOOKS',
    time: '11:30 AM - 2:30 PM',
    details: 'Room: 101 | Section: A | Students: 30',
  },
  {
    day: 'Thu',
    course: 'WEBSTECH',
    time: '11:00 AM - 2:00 PM',
    details: 'Room: 101 | Section: A | Students: 30',
  },
  {
    day: 'Fri',
    course: 'COMPRO 2',
    time: '9:30 AM - 12:00 PM',
    details: 'Room: 101 | Section: A | Students: 30',
  },
  {
    day: 'Fri',
    course: 'PROLANS',
    time: '5:30 PM - 7:30 PM',
    details: 'Room: 101 | Section: A | Students: 30',
  },
  {
    day: 'Fri',
    course: 'IT CAPSTONE',
    time: '8:00 AM - 10:30 AM',
    details: 'Room: 101 | Section: A | Students: 30',
  },
];

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function WeeklySchedule({
  teacherInfo,
  onBack,
}: WeeklyScheduleProps) {
  const [today, setToday] = useState('');

  useEffect(() => {
    const currentDay = new Date().toLocaleDateString('en-US', {
      weekday: 'short',
    });
    setToday(currentDay);
  }, []);

  const handleBackClick = () => {
    console.log('Back button clicked in WeeklySchedule');
    onBack();
  };

  return (
    <div className='w-full h-full flex flex-col'>
      {/* Header with teacher info */}
      <div className='bg-[#124A69] rounded-lg p-4 mb-4 text-white w-full'>
        <div className='flex items-center'>
          <button
            onClick={handleBackClick}
            className='hover:opacity-80 p-2 transition-opacity cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50 rounded-full'
            aria-label='Back to list'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-6 w-6'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M15 19l-7-7 7-7'
              />
            </svg>
          </button>
          <div className='flex items-center ml-2'>
            <Image
              src='/icon-person.png'
              alt='Teacher'
              width={48}
              height={48}
              className='rounded-full mr-3'
            />
            <div>
              <h3 className='font-semibold text-lg'>{teacherInfo.name}</h3>
              <p className='text-sm opacity-90'>{teacherInfo.department}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className='grid grid-cols-3 gap-4 mb-4'>
        <div className='bg-white rounded-lg p-4 shadow-sm'>
          <p className='text-gray-600 text-sm'>STUDENTS</p>
          <p className='text-3xl font-bold text-[#124A69]'>51</p>
          <div className='text-[#124A69] flex justify-end'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-6 w-6'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
              />
            </svg>
          </div>
        </div>
        <div className='bg-white rounded-lg p-4 shadow-sm'>
          <p className='text-gray-600 text-sm'>Classes</p>
          <p className='text-3xl font-bold text-[#124A69]'>7</p>
          <div className='text-[#124A69] flex justify-end'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-6 w-6'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
              />
            </svg>
          </div>
        </div>
        <div className='bg-white rounded-lg p-4 shadow-sm'>
          <p className='text-gray-600 text-sm'>TOTAL COURSES</p>
          <p className='text-3xl font-bold text-[#124A69]'>7</p>
          <div className='text-[#124A69] flex justify-end'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-6 w-6'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
              />
            </svg>
          </div>
        </div>
      </div>

      <h2 className='text-[#124A69] text-center text-2xl font-bold mb-4'>
        WEEKLY COURSE SCHEDULE
      </h2>
      <div className='flex-1 overflow-auto'>
        <div className='grid grid-cols-7 gap-4 h-full'>
          {days.map((day) => (
            <div key={day} className='flex flex-col h-full'>
              <h3
                className={`font-semibold text-center ${
                  day === today
                    ? 'font-bold text-[#124A69] text-2xl mb-4'
                    : 'text-gray-500 mb-6'
                }`}
              >
                {day}
              </h3>
              <div className='space-y-2 flex-1'>
                {scheduleData
                  .filter((item) => item.day === day)
                  .map((course, index) => (
                    <Card
                      key={index}
                      className='bg-yellow-100 text-center w-full cursor-pointer transition-all duration-300 hover:bg-white hover:shadow-lg'
                    >
                      <CardContent className='p-3'>
                        <p className='font-bold'>{course.course}</p>
                        <p className='text-sm'>{course.time}</p>
                        <div className='hidden group-hover:block mt-2 text-xs text-gray-600'>
                          <p>{course.details}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
