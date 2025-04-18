import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

interface Student {
  id: string;
  lastName: string;
  firstName: string;
  middleInitial: string | null;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ courseId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = await context.params;

    // First try to find by code, if not found try by ID
    let course = await prisma.course.findFirst({
      where: { code: courseId.toUpperCase() },
      include: {
        faculty: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
          },
        },
        students: {
          select: {
            id: true,
            lastName: true,
            firstName: true,
            middleInitial: true,
          },
        },
        schedules: true,
      },
    });

    // If not found by code, try by ID
    if (!course) {
      course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          faculty: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
            },
          },
          students: {
            select: {
              id: true,
              lastName: true,
              firstName: true,
              middleInitial: true,
            },
          },
          schedules: true,
        },
      });
    }

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Transform student data to include full name
    const transformedCourse = {
      ...course,
      students: course.students.map((student: Student) => ({
        id: student.id,
        name: `${student.lastName}, ${student.firstName}${
          student.middleInitial ? ` ${student.middleInitial}.` : ''
        }`,
      })),
    };

    return NextResponse.json(transformedCourse);
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ courseId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = await context.params;
    const body = await request.json();
    const { code, title, description, facultyId } = body;

    // Validate required fields
    if (!code || !title || !facultyId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    // Check if course code already exists (excluding current course)
    const existingCourse = await prisma.course.findFirst({
      where: {
        code,
        NOT: { id: courseId },
      },
    });

    if (existingCourse) {
      return NextResponse.json(
        { error: 'Course code already exists' },
        { status: 400 },
      );
    }

    const course = await prisma.course.update({
      where: { id: courseId },
      data: {
        code,
        title,
        description,
        facultyId,
      },
      include: {
        faculty: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
          },
        },
        students: {
          select: {
            id: true,
            lastName: true,
            firstName: true,
            middleInitial: true,
          },
        },
        schedules: true,
      },
    });

    return NextResponse.json(course);
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ courseId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = await context.params;

    await prisma.course.delete({
      where: { id: courseId },
    });

    return NextResponse.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 },
    );
  }
}
