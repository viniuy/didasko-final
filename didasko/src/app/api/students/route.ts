import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lastName, firstName, middleInitial, image, courseId } = body;

    console.log('Creating student:', { lastName, firstName, courseId });

    // Validate required fields
    if (!lastName || !firstName || !courseId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    console.log('Found course:', course);

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Create the student
    const student = await prisma.student.create({
      data: {
        lastName,
        firstName,
        middleInitial,
        image: image || null,
        coursesEnrolled: {
          connect: {
            id: courseId,
          },
        },
      },
      include: {
        coursesEnrolled: true,
      },
    });

    console.log('Created student:', student);

    return NextResponse.json(student);
  } catch (error) {
    console.error('Error creating student:', error);

    // Check for specific Prisma errors
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'Course not found or invalid course ID' },
          { status: 404 },
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to create student',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
