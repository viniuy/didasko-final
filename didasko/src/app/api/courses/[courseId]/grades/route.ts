import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { courseId: string } },
) {
  try {
    const { courseId } = params;

    // Fetch students enrolled in the course with their grades
    const students = await prisma.student.findMany({
      where: {
        coursesEnrolled: {
          some: {
            id: courseId,
          },
        },
      },
      include: {
        grades: {
          include: {
            gradeItem: true,
          },
        },
      },
    });

    // Transform the data to match the frontend interface
    const formattedStudents = students.map((student) => {
      // Group grades by type
      const gradesByType = student.grades.reduce((acc, grade) => {
        acc[grade.gradeItem.type] = grade.value;
        return acc;
      }, {} as Record<string, number>);

      // Calculate total (assuming content and clarity are out of 10)
      const content = gradesByType['CONTENT'] || 0;
      const clarity = gradesByType['CLARITY'] || 0;
      const total = ((content + clarity) / 20) * 100; // Convert to percentage

      // Determine remarks based on total
      const remarks = total >= 75 ? 'PASSED' : 'FAILED';

      return {
        id: student.id,
        name: `${student.lastName}, ${student.firstName}${
          student.middleInitial ? ` ${student.middleInitial}.` : ''
        }`,
        content: gradesByType['CONTENT'] || null,
        clarity: gradesByType['CLARITY'] || null,
        totalGrade: `${total.toFixed(0)}%`,
        remarks,
      };
    });

    return NextResponse.json(formattedStudents);
  } catch (error) {
    console.error('Error fetching grades:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grades' },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { courseId: string } },
) {
  try {
    const { courseId } = params;
    const body = await request.json();
    const { studentId, gradeType, value } = body;

    // Validate required fields
    if (!studentId || !gradeType || value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    // Find or create grade item
    const gradeItem = await prisma.gradeItem.upsert({
      where: {
        courseId_type: {
          courseId,
          type: gradeType,
        },
      },
      update: {},
      create: {
        courseId,
        type: gradeType,
        name: gradeType.toLowerCase(),
        weight: 50, // Both content and clarity are worth 50%
      },
    });

    // Create or update the grade
    const grade = await prisma.grade.upsert({
      where: {
        studentId_gradeItemId: {
          studentId,
          gradeItemId: gradeItem.id,
        },
      },
      update: {
        value,
      },
      create: {
        value,
        studentId,
        gradeItemId: gradeItem.id,
      },
    });

    return NextResponse.json(grade);
  } catch (error) {
    console.error('Error updating grade:', error);
    return NextResponse.json(
      { error: 'Failed to update grade' },
      { status: 500 },
    );
  }
}
