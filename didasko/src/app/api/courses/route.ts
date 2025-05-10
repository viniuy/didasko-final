import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { CourseResponse, CourseCreateInput } from '@/types/course';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const facultyId = searchParams.get('facultyId');
    const search = searchParams.get('search');
    const department = searchParams.get('department');
    const semester = searchParams.get('semester');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build where clause based on filters
    const where: Prisma.CourseWhereInput = {
      AND: [
        facultyId ? { facultyId } : {},
        department ? { faculty: { department } } : {},
        semester ? { semester } : {},
        search
          ? {
              OR: [
                {
                  title: {
                    contains: search,
                    mode: 'insensitive' as Prisma.QueryMode,
                  },
                },
                {
                  code: {
                    contains: search,
                    mode: 'insensitive' as Prisma.QueryMode,
                  },
                },
                {
                  room: {
                    contains: search,
                    mode: 'insensitive' as Prisma.QueryMode,
                  },
                },
              ],
            }
          : {},
      ].filter((condition) => Object.keys(condition).length > 0),
    };

    // Get total count for pagination
    const total = await prisma.course.count({ where });

    // Get courses with pagination and include related data
    const courses = await prisma.course.findMany({
      where,
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
      skip,
      take: limit,
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    });

    const response: CourseResponse = {
      courses: courses.map((course) => ({
        ...course,
        students: course.students?.map((student) => ({
          ...student,
          middleInitial: student.middleInitial || undefined,
        })),
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CourseCreateInput = await request.json();
    const { code, title, room, facultyId, semester, section } = body;

    // Validate required fields
    if (!code || !title || !facultyId || !semester || !section) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    // Ensure semester and section are strings
    if (typeof semester !== 'string' || typeof section !== 'string') {
      return NextResponse.json(
        { error: 'Semester and section must be strings' },
        { status: 400 },
      );
    }

    // Check if course code already exists
    const existingCourse = await prisma.course.findFirst({
      where: {
        code,
        NOT: { id: body.id || undefined },
      },
    });

    if (existingCourse) {
      return NextResponse.json(
        { error: 'Course code already exists' },
        { status: 400 },
      );
    }

    const course = await prisma.course.create({
      data: {
        code,
        title,
        room: room || '', // Ensure room is not null
        semester,
        section,
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
    console.error('Error creating course:', error);
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 },
      );
    }

    await prisma.course.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 },
    );
  }
}
