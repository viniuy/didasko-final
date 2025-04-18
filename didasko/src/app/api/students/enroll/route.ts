import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthCookie, verifyToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    // Make authentication optional in development
    if (process.env.NODE_ENV === 'production') {
      // Check authentication in production only
      const token = await getAuthCookie();
      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const user = verifyToken(token);
      if (!user) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
    }

    // Parse request body
    const body = await req.json();
    const { studentId, courseId } = body;

    console.log('Enrolling student:', { studentId, courseId });

    if (!studentId || !courseId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        coursesEnrolled: true,
      },
    });

    console.log('Found student:', student);

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        students: true,
      },
    });

    console.log('Found course:', course);

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check if student is already enrolled
    const isEnrolled = student.coursesEnrolled.some((c) => c.id === courseId);

    console.log('Is student enrolled:', isEnrolled);

    if (isEnrolled) {
      return NextResponse.json(
        { error: 'Student is already enrolled in this course' },
        { status: 409 },
      );
    }

    // Enroll student in course using connect
    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        students: {
          connect: { id: studentId },
        },
      },
      include: {
        students: true,
      },
    });

    console.log('Updated course:', updatedCourse);

    return NextResponse.json({
      message: 'Student enrolled successfully',
      course: updatedCourse,
    });
  } catch (error) {
    console.error('Error enrolling student:', error);
    return NextResponse.json(
      {
        error: 'Failed to enroll student',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
