import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const mockSchedules = [
  // First Semester Courses
  {
    day: 'Monday',
    course: 'IT CAPSTONE',
    section: 'BSIT-111',
    time: '8:00 AM - 10:30 AM',
    room: 'Room: 101',
    semester: '1st Semester',
  },
  {
    day: 'Monday',
    course: 'OOP',
    section: 'BSIT-112',
    time: '11:00 AM - 2:00 PM',
    room: 'Room: 101',
    semester: '1st Semester',
  },
  {
    day: 'Tuesday',
    course: 'IAS',
    section: 'BSIT-113',
    time: '8:00 AM - 10:30 AM',
    room: 'Room: 101',
    semester: '1st Semester',
  },
  {
    day: 'Wednesday',
    course: 'MOBSTECH',
    section: 'BSIT-114',
    time: '10:30 AM - 1:30 PM',
    room: 'Room: 101',
    semester: '1st Semester',
  },
  {
    day: 'Thursday',
    course: 'ETHICS',
    section: 'BSIT-115',
    time: '8:00 AM - 10:30 AM',
    room: 'Room: 101',
    semester: '1st Semester',
  },
  {
    day: 'Friday',
    course: 'COMPRO 2',
    section: 'BSIT-116',
    time: '9:30 AM - 12:00 PM',
    room: 'Room: 101',
    semester: '1st Semester',
  },
  // Second Semester Courses
  {
    day: 'Monday',
    course: 'PIIST',
    section: 'BSIT-211',
    time: '3:00 PM - 5:30 PM',
    room: 'Room: 101',
    semester: '2nd Semester',
  },
  {
    day: 'Tuesday',
    course: 'EUTHENICS',
    section: 'BSIT-212',
    time: '11:00 AM - 2:00 PM',
    room: 'Room: 101',
    semester: '2nd Semester',
  },
  {
    day: 'Wednesday',
    course: 'MIS',
    section: 'BSIT-213',
    time: '2:00 PM - 4:30 PM',
    room: 'Room: 101',
    semester: '2nd Semester',
  },
  {
    day: 'Thursday',
    course: 'GREAT BOOKS',
    section: 'BSIT-214',
    time: '11:30 AM - 2:30 PM',
    room: 'Room: 101',
    semester: '2nd Semester',
  },
  {
    day: 'Thursday',
    course: 'WEBSTECH',
    section: 'BSIT-215',
    time: '11:00 AM - 2:00 PM',
    room: 'Room: 101',
    semester: '2nd Semester',
  },
  {
    day: 'Friday',
    course: 'PROLANS',
    section: 'BSIT-216',
    time: '5:30 PM - 7:30 PM',
    room: 'Room: 101',
    semester: '2nd Semester',
  },
];

async function main() {
  // Get the current user's ID from command line argument
  const userId = process.argv[2];

  if (!userId) {
    console.error('Please provide a user ID as a command line argument');
    console.error('Usage: npm run seed-schedules <userId>');
    process.exit(1);
  }

  // Verify the user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    console.error('User not found. Please provide a valid user ID');
    process.exit(1);
  }

  // First, create the courses
  const courses = await Promise.all(
    mockSchedules.map(async (schedule) => {
      const courseCode = schedule.course.replace(/\s+/g, '').toUpperCase();
      const academicYear = '2024-2025';
      const slug =
        `${courseCode}-${academicYear}-${schedule.section}`.toLowerCase();
      return prisma.course.upsert({
        where: { slug },
        update: {
          semester: schedule.semester,
        },
        create: {
          code: courseCode,
          title: schedule.course,
          room: schedule.room,
          semester: schedule.semester,
          section: schedule.section,
          facultyId: userId,
          slug,
          academicYear,
          status: 'ACTIVE',
        },
      });
    }),
  );

  // Then create the schedules
  await Promise.all(
    mockSchedules.map(async (schedule, index) => {
      const [fromTime, toTime] = schedule.time.split(' - ').map((t) => {
        const [time, period] = t.split(' ');
        const [hours, minutes] = time.split(':');
        let hour = parseInt(hours);
        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;
        return `${hour.toString().padStart(2, '0')}:${minutes}`;
      });

      // Get the next occurrence of the day
      const today = new Date();
      const dayOfWeek = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ].indexOf(schedule.day);
      const daysUntilNext = (dayOfWeek - today.getDay() + 7) % 7;
      const nextDay = new Date(today);
      nextDay.setDate(today.getDate() + daysUntilNext);

      return prisma.courseSchedule.create({
        data: {
          courseId: courses[index].id,
          day: schedule.day,
          fromTime,
          toTime,
        },
      });
    }),
  );

  console.log('Schedules have been seeded with semester information. 🌱');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
