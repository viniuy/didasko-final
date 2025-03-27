import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';

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

export default function WeeklySchedule() {
  const [today, setToday] = useState('');

  useEffect(() => {
    const currentDay = new Date().toLocaleDateString('en-US', {
      weekday: 'short',
    });
    setToday(currentDay);
  }, []);

  return (
    <div className='container mx-auto p-4'>
      <h2 className='text-[#124A69] text-center text-2xl font-bold mb-4'>
        MY WEEKLY COURSE SCHEDULE
      </h2>
      <div className='grid grid-cols-7 gap-4'>
        {days.map((day) => (
          <div key={day} className='flex flex-col items-center rounded-lg'>
            <h3
              className={`font-semibold ${
                day === today
                  ? 'font-bold text-[#124A69] text-2xl mb-4'
                  : 'text-gray-500 mb-6'
              }`}
            >
              {day}
            </h3>
            <div className='space-y-2'>
              {scheduleData
                .filter((item) => item.day === day)
                .map((course, index) => (
                  <Card
                    key={index}
                    className='bg-yellow-100 text-center w-[100%] cursor-pointer transition-all duration-300 hover:bg-white hover:shadow-lg'
                  >
                    <CardContent>
                      <p className='font-bold'>{course.course}</p>
                      <p className='text-sm'>{course.time}</p>
                      <div className='hidden hover:inline mt-2 text-xs text-gray-600'>
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
  );
}
