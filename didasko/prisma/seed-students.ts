import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const students = [
  {
    firstName: 'John',
    lastName: 'Smith',
    middleInitial: 'A',
    studentId: '2024-0001'
  },
  {
    firstName: 'Maria',
    lastName: 'Garcia',
    middleInitial: 'B',
    studentId: '2024-0002'
  },
  {
    firstName: 'James',
    lastName: 'Johnson',
    middleInitial: 'C',
    studentId: '2024-0003'
  },
  {
    firstName: 'Sarah',
    lastName: 'Williams',
    middleInitial: 'D',
    studentId: '2024-0004'
  },
  {
    firstName: 'Michael',
    lastName: 'Brown',
    middleInitial: 'E',
    studentId: '2024-0005'
  },
  {
    firstName: 'Emily',
    lastName: 'Davis',
    middleInitial: 'F',
    studentId: '2024-0006'
  },
  {
    firstName: 'David',
    lastName: 'Miller',
    middleInitial: 'G',
    studentId: '2024-0007'
  },
  {
    firstName: 'Lisa',
    lastName: 'Wilson',
    middleInitial: 'H',
    studentId: '2024-0008'
  },
  {
    firstName: 'Robert',
    lastName: 'Moore',
    middleInitial: 'I',
    studentId: '2024-0009'
  },
  {
    firstName: 'Jennifer',
    lastName: 'Taylor',
    middleInitial: 'J',
    studentId: '2024-0010'
  },
  {
    firstName: 'William',
    lastName: 'Anderson',
    middleInitial: 'K',
    studentId: '2024-0011'
  },
  {
    firstName: 'Elizabeth',
    lastName: 'Thomas',
    middleInitial: 'L',
    studentId: '2024-0012'
  },
  {
    firstName: 'Richard',
    lastName: 'Jackson',
    middleInitial: 'M',
    studentId: '2024-0013'
  },
  {
    firstName: 'Patricia',
    lastName: 'White',
    middleInitial: 'N',
    studentId: '2024-0014'
  },
  {
    firstName: 'Joseph',
    lastName: 'Harris',
    middleInitial: 'O',
    studentId: '2024-0015'
  },
  {
    firstName: 'Margaret',
    lastName: 'Martin',
    middleInitial: 'P',
    studentId: '2024-0016'
  },
  {
    firstName: 'Charles',
    lastName: 'Thompson',
    middleInitial: 'Q',
    studentId: '2024-0017'
  },
  {
    firstName: 'Susan',
    lastName: 'Garcia',
    middleInitial: 'R',
    studentId: '2024-0018'
  },
  {
    firstName: 'Thomas',
    lastName: 'Martinez',
    middleInitial: 'S',
    studentId: '2024-0019'
  },
  {
    firstName: 'Jessica',
    lastName: 'Robinson',
    middleInitial: 'T',
    studentId: '2024-0020'
  }
];

async function main() {
  console.log('Please enter the course ID to enroll these students:');
  const courseId = process.argv[2];

  if (!courseId) {
    console.error('Please provide a course ID as an argument');
    process.exit(1);
  }

  try {
    // Create students
    const createdStudents = await Promise.all(
      students.map(student =>
        prisma.student.create({
          data: student
        })
      )
    );

    console.log('Successfully created students');

    // Enroll all students in the specified course
    await Promise.all(
      createdStudents.map(student =>
        prisma.course.update({
          where: { id: courseId },
          data: {
            students: {
              connect: { id: student.id }
            }
          }
        })
      )
    );

    console.log(`Successfully enrolled all students in course ${courseId}`);
  } catch (error) {
    console.error('Error seeding students:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 