import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lastName, firstName, middleInitial, image, courseId } = body;

    // Validate required fields
    if (!lastName || !firstName || !courseId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
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
    });

    return NextResponse.json(student);
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 },
    );
  }
}
