import { PrismaClient, Role, WorkType, Permission } from '@prisma/client';

const prisma = new PrismaClient();

const facultyMembers = [
  {
    name: 'Ricson Ricardo',
    email: 'ricson.ricardo@alabang.sti.edu.ph',
    department: 'IT Department',
    workType: WorkType.FULL_TIME,
    role: Role.ACADEMIC_HEAD,
    permission: Permission.GRANTED,
  },
  {
    name: 'Darryl Pauline Nietes',
    email: 'darryl.nietes@alabang.sti.edu.ph',
    department: 'BA Department',
    workType: WorkType.FULL_TIME,
    role: Role.FACULTY,
    permission: Permission.GRANTED,
  },
  {
    name: 'Rod Mark Rufino',
    email: 'rod.rufino@alabang.sti.edu.ph',
    department: 'TM Department',
    workType: WorkType.FULL_TIME,
    role: Role.FACULTY,
    permission: Permission.GRANTED,
  },
  {
    name: 'Jerryfel Laraga',
    email: 'jerryfel.laraga@alabang.sti.edu.ph',
    department: 'HM Department',
    workType: WorkType.FULL_TIME,
    role: Role.FACULTY,
    permission: Permission.GRANTED,
  },
  {
    name: 'Justin Joseph Gorospe',
    email: 'justin.gorospe@alabang.sti.edu.ph',
    department: 'SHS Department',
    workType: WorkType.FULL_TIME,
    role: Role.FACULTY,
    permission: Permission.GRANTED,
  },
  {
    name: 'Manuel Jojo Simon',
    email: 'manuel.simon@alabang.sti.edu.ph',
    department: 'IT Department',
    workType: WorkType.FULL_TIME,
    role: Role.FACULTY,
    permission: Permission.GRANTED,
  },
  {
    name: 'Arvin Marlin',
    email: 'arvin.marlin@alabang.sti.edu.ph',
    department: 'BA Department',
    workType: WorkType.FULL_TIME,
    role: Role.FACULTY,
    permission: Permission.GRANTED,
  },
  {
    name: 'John Renaund Baybay',
    email: 'john.baybay@alabang.sti.edu.ph',
    department: 'TM Department',
    workType: WorkType.FULL_TIME,
    role: Role.FACULTY,
    permission: Permission.GRANTED,
  },
  {
    name: 'Ma. Diana Moral',
    email: 'diana.moral@alabang.sti.edu.ph',
    department: 'HM Department',
    workType: WorkType.FULL_TIME,
    role: Role.FACULTY,
    permission: Permission.GRANTED,
  },
  {
    name: 'Redmond Laurel',
    email: 'redmond.laurel@alabang.sti.edu.ph',
    department: 'SHS Department',
    workType: WorkType.FULL_TIME,
    role: Role.FACULTY,
    permission: Permission.GRANTED,
  },
];

const students = [
  {
    firstName: 'Realyn',
    lastName: 'Babagay',
    middleInitial: '',
    studentId: '2024-0001',
  },
  {
    firstName: 'Lean Jared',
    lastName: 'Batac',
    middleInitial: '',
    studentId: '2024-0002',
  },
  {
    firstName: 'Mark Jecil',
    lastName: 'Bausa',
    middleInitial: '',
    studentId: '2024-0003',
  },
  {
    firstName: 'Josh Raizen',
    lastName: 'Calinog',
    middleInitial: '',
    studentId: '2024-0004',
  },
  {
    firstName: 'Allyza Rose',
    lastName: 'Cayer',
    middleInitial: '',
    studentId: '2024-0005',
  },
  {
    firstName: 'Jonathan Francis',
    lastName: 'Corpuz',
    middleInitial: '',
    studentId: '2024-0006',
  },
  {
    firstName: 'Eliiah Oscar',
    lastName: 'Del Mundo',
    middleInitial: '',
    studentId: '2024-0007',
  },
  {
    firstName: 'Mj',
    lastName: 'Despi',
    middleInitial: '',
    studentId: '2024-0008',
  },
  {
    firstName: 'Brandon Jake',
    lastName: 'Diaz',
    middleInitial: '',
    studentId: '2024-0009',
  },
  {
    firstName: 'John Keith',
    lastName: 'Dimaano',
    middleInitial: '',
    studentId: '2024-0010',
  },
  {
    firstName: 'Lance',
    lastName: 'Dimero',
    middleInitial: '',
    studentId: '2024-0011',
  },
  {
    firstName: 'Vincent',
    lastName: 'Dizon',
    middleInitial: '',
    studentId: '2024-0012',
  },
  {
    firstName: 'Suzanne Alyanna',
    lastName: 'Esplana',
    middleInitial: '',
    studentId: '2024-0013',
  },
  {
    firstName: 'Ivan',
    lastName: 'Gonzales',
    middleInitial: '',
    studentId: '2024-0014',
  },
  {
    firstName: 'John Lester',
    lastName: 'Inso',
    middleInitial: '',
    studentId: '2024-0015',
  },
  {
    firstName: 'Julius',
    lastName: 'Lazatin',
    middleInitial: '',
    studentId: '2024-0016',
  },
  {
    firstName: 'Janrei Marcus',
    lastName: 'Lopez',
    middleInitial: '',
    studentId: '2024-0017',
  },
  {
    firstName: 'Mica Ella',
    lastName: 'Loresca',
    middleInitial: '',
    studentId: '2024-0018',
  },
  {
    firstName: 'Keith Izam',
    lastName: 'Magante',
    middleInitial: '',
    studentId: '2024-0019',
  },
  {
    firstName: 'Jovial',
    lastName: 'Magdadaro',
    middleInitial: '',
    studentId: '2024-0020',
  },
  {
    firstName: 'Ric Marion',
    lastName: 'Mandani',
    middleInitial: '',
    studentId: '2024-0021',
  },
  {
    firstName: 'Vince Ivan',
    lastName: 'Mangampo',
    middleInitial: '',
    studentId: '2024-0022',
  },
  {
    firstName: 'Arley Mae',
    lastName: 'Marabut',
    middleInitial: '',
    studentId: '2024-0023',
  },
  {
    firstName: 'Ronalyn',
    lastName: 'Molera',
    middleInitial: '',
    studentId: '2024-0024',
  },
  {
    firstName: 'Toby Lee',
    lastName: 'Paez',
    middleInitial: '',
    studentId: '2024-0025',
  },
  {
    firstName: 'Jayve',
    lastName: 'Paloma',
    middleInitial: '',
    studentId: '2024-0026',
  },
  {
    firstName: 'Mark Ronald',
    lastName: 'Paningbatan',
    middleInitial: '',
    studentId: '2024-0027',
  },
  {
    firstName: 'Omar',
    lastName: 'Regla',
    middleInitial: '',
    studentId: '2024-0028',
  },
  {
    firstName: 'Denys John',
    lastName: 'Santayana',
    middleInitial: '',
    studentId: '2024-0029',
  },
  {
    firstName: 'Clarenz',
    lastName: 'Santos',
    middleInitial: '',
    studentId: '2024-0030',
  },
  {
    firstName: 'Sophia Jean',
    lastName: 'Santos',
    middleInitial: '',
    studentId: '2024-0031',
  },
  {
    firstName: 'Mark Tonie',
    lastName: 'Seva',
    middleInitial: '',
    studentId: '2024-0032',
  },
  {
    firstName: 'Adrian',
    lastName: 'Sevilla',
    middleInitial: '',
    studentId: '2024-0033',
  },
];

const mockSchedules = [
  // First Semester Courses
  {
    day: 'Monday',
    course: 'IT CAPSTONE',
    section: 'BSIT-611',
    time: '8:00 AM - 10:30 AM',
    room: 'Room: 401',
    semester: '1st Semester',
  },
  {
    day: 'Monday',
    course: 'OOP',
    section: 'BSIT-611',
    time: '11:00 AM - 2:00 PM',
    room: 'Room: 402',
    semester: '1st Semester',
  },
  {
    day: 'Tuesday',
    course: 'IAS',
    section: 'BSIT-611',
    time: '8:00 AM - 10:30 AM',
    room: 'Room: 403',
    semester: '1st Semester',
  },
  {
    day: 'Wednesday',
    course: 'MOBSTECH',
    section: 'BSIT-611',
    time: '10:30 AM - 1:30 PM',
    room: 'LAB 1',
    semester: '1st Semester',
  },
  {
    day: 'Thursday',
    course: 'ETHICS',
    section: 'BSIT-611',
    time: '8:00 AM - 10:30 AM',
    room: 'Room: 404',
    semester: '1st Semester',
  },
  {
    day: 'Friday',
    course: 'COMPRO 2',
    section: 'BSIT-611',
    time: '9:30 AM - 12:00 PM',
    room: 'LAB 2',
    semester: '1st Semester',
  },
  // Second Semester Courses
  {
    day: 'Monday',
    course: 'PIIST',
    section: 'BSIT-611',
    time: '3:00 PM - 5:30 PM',
    room: 'Room: 401',
    semester: '2nd Semester',
  },
  {
    day: 'Tuesday',
    course: 'EUTHENICS',
    section: 'BSIT-611',
    time: '11:00 AM - 2:00 PM',
    room: 'Room: 402',
    semester: '2nd Semester',
  },
  {
    day: 'Wednesday',
    course: 'MIS',
    section: 'BSIT-611',
    time: '2:00 PM - 4:30 PM',
    room: 'Room: 403',
    semester: '2nd Semester',
  },
  {
    day: 'Thursday',
    course: 'GREAT BOOKS',
    section: 'BSIT-611',
    time: '11:30 AM - 2:30 PM',
    room: 'Room: 404',
    semester: '2nd Semester',
  },
  {
    day: 'Thursday',
    course: 'WEBSTECH',
    section: 'BSIT-611',
    time: '11:00 AM - 2:00 PM',
    room: 'LAB 1',
    semester: '2nd Semester',
  },
  {
    day: 'Friday',
    course: 'PROLANS',
    section: 'BSIT-611',
    time: '5:30 PM - 7:30 PM',
    room: 'LAB 2',
    semester: '2nd Semester',
  },
];

async function main() {
  try {
    // Create faculty members
    for (const faculty of facultyMembers) {
      await prisma.user.create({
        data: faculty,
      });
    }
    console.log('Faculty members seeded successfully');

    // Create students
    const createdStudents = await Promise.all(
      students.map((student) =>
        prisma.student.create({
          data: student,
        }),
      ),
    );
    console.log(`Successfully created ${createdStudents.length} students`);

    // Create courses and schedules
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
            slug,
            academicYear,
            status: 'ACTIVE',
          } as any,
        });
      }),
    );

    // Create schedules
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
    console.log('Schedules have been seeded successfully! 🌱');
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
