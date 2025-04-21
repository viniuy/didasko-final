import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function GET(
  request: Request,
  context: { params: { courseId: string } },
) {
  try {
    console.log('Starting GET request for course');

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

    const params = await Promise.resolve(context.params);
    const { courseId } = params;
    console.log('Fetching course with ID:', courseId);

    // Fetch course details first
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        students: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleInitial: true,
            image: true,
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

export async function POST(
  request: Request,
  { params }: { params: { courseId: string } },
) {
  try {
    const body = await request.json();
    const { studentId } = body;

    console.log('Adding student to course:', {
      courseId: params.courseId,
      studentId: studentId,
    });

    // Check if student is already enrolled
    const existingEnrollment = await prisma.course.findFirst({
      where: {
        id: params.courseId,
        students: {
          some: {
            id: studentId,
          },
        },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'Student is already enrolled in this course' },
        { status: 400 },
      );
    }

    // Add student to course
    const updatedCourse = await prisma.course.update({
      where: {
        id: params.courseId,
      },
      data: {
        students: {
          connect: {
            id: studentId,
          },
        },
      },
      include: {
        students: true,
      },
    });

    console.log('Successfully added student to course');

    return NextResponse.json({
      message: 'Student added successfully',
      course: updatedCourse,
    });
  } catch (error) {
    console.error('Error adding student to course:', error);
    return NextResponse.json(
      { error: 'Failed to add student to course' },
      { status: 500 },
    );
  }
}
