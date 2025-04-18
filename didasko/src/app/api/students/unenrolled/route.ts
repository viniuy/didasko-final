import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    console.log('Received courseId:', courseId);

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 },
      );
    }

    // First, verify if the course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    console.log('Found course:', course);

    // Get all students who are not enrolled in the specified course
    const unenrolledStudents = await prisma.student.findMany({
      where: {
        NOT: {
          coursesEnrolled: {
            some: {
              id: courseId,
            },
          },
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        middleInitial: true,
        image: true,
      },
    });

    console.log('Found unenrolled students:', unenrolledStudents);
    return NextResponse.json({ students: unenrolledStudents });
  } catch (error) {
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('Prisma error code:', error.code);
    }

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to fetch unenrolled students', details: errorMessage },
      { status: 500 },
    );
  }
}
