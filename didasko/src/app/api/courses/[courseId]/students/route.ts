import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface StudentRecord {
  id: string;
  firstName: string;
  lastName: string;
  middleInitial: string | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } },
) {
  try {
    const courseId = params.courseId;

    // Fetch students enrolled in the course
    const students = await prisma.student.findMany({
      where: {
        coursesEnrolled: {
          some: {
            id: courseId,
          },
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        middleInitial: true,
      },
      orderBy: {
        lastName: 'asc',
      },
    });

    // Format student names
    const formattedStudents = students.map((student: StudentRecord) => ({
      id: student.id,
      name: `${student.lastName}, ${student.firstName}${
        student.middleInitial ? ` ${student.middleInitial}.` : ''
      }`,
    }));

    return NextResponse.json(formattedStudents);
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 },
    );
  }
}
