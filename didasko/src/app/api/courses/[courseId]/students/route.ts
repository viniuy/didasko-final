import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { courseId: string } },
) {
  try {
    const { courseId } = params;

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
        lastName: true,
        firstName: true,
        middleInitial: true,
      },
    });

    // Transform the data to match the Student interface
    const formattedStudents = students.map((student) => ({
      id: student.id,
      name: `${student.lastName}, ${student.firstName}${
        student.middleInitial ? ` ${student.middleInitial}.` : ''
      }`,
      status: '', // Default status
      date: new Date().toISOString().split('T')[0], // Current date
      semester: '1st Semester', // Default semester, you might want to get this from the course
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
