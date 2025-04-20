import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function GET(
  request: Request,
  { params }: { params: { courseId: string } },
) {
  try {
    console.log('Starting GET request for course:', params.courseId);

    const session = await getServerSession(authOptions);
    console.log('Session:', session);

    if (!session?.user?.email) {
      console.log('No session found');
      return NextResponse.json(
        { error: 'Unauthorized - No session' },
        { status: 401 },
      );
    }

    // Get user from database using session email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        role: true,
      },
    });

    console.log('User found:', user);

    if (!user) {
      console.log('No user found with session email');
      return NextResponse.json(
        { error: 'Unauthorized - User not found' },
        { status: 401 },
      );
    }

    const { courseId } = params;
    console.log('Fetching course with ID:', courseId);

    // Fetch course details first
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        students: {
          include: {
            attendance: {
              where: {
                courseId: courseId,
              },
            },
          },
        },
      },
    });

    console.log('Course fetch result:', course ? 'Found' : 'Not found');

    if (!course) {
      console.log('Course not found in database');
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    console.log('Number of students found:', course.students.length);

    // Transform the data to match the frontend interface
    const students = course.students.map((student) => {
      console.log('Processing student:', student.id);
      return {
        id: student.id,
        name: `${student.lastName}, ${student.firstName}${
          student.middleInitial ? ` ${student.middleInitial}.` : ''
        }`,
        image: student.image || undefined,
        status: student.attendance[0]?.status || 'NOT SET',
        attendanceRecords: student.attendance,
      };
    });

    console.log('Successfully processed all students');

    return NextResponse.json({
      course: {
        code: course.code,
        section: course.section,
      },
      students,
    });
  } catch (error) {
    console.error(
      'Detailed error in GET /api/courses/[courseId]/students:',
      error,
    );
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 },
    );
  }
}
