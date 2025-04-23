import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import { CourseSchedule } from '@/lib/types';

const prisma = new PrismaClient();

// Helper function to check for schedule overlaps
async function hasScheduleOverlap(
  courseId: string,
  day: Date,
  fromTime: string,
  toTime: string,
  excludeScheduleId?: string,
) {
  const existingSchedules = await prisma.courseSchedule.findMany({
    where: {
      courseId,
      day,
      id: excludeScheduleId ? { not: excludeScheduleId } : undefined,
    },
  });

  const newFromTime = new Date(`1970-01-01T${fromTime}`);
  const newToTime = new Date(`1970-01-01T${toTime}`);

  return existingSchedules.some((schedule) => {
    const existingFromTime = new Date(`1970-01-01T${schedule.fromTime}`);
    const existingToTime = new Date(`1970-01-01T${schedule.toTime}`);

    return (
      (newFromTime >= existingFromTime && newFromTime < existingToTime) ||
      (newToTime > existingFromTime && newToTime <= existingToTime) ||
      (newFromTime <= existingFromTime && newToTime >= existingToTime)
    );
  });
}

export async function GET(request: Request) {
  try {
    console.log('Starting GET request for schedules');
    const session = await getServerSession(authOptions);
    console.log('Session:', JSON.stringify(session, null, 2));

    if (!session) {
      console.log('No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const facultyId = searchParams.get('facultyId');
    console.log('FacultyId from params:', facultyId);

    if (!facultyId) {
      return NextResponse.json(
        { error: 'Faculty ID is required' },
        { status: 400 },
      );
    }

    // Verify the user exists
    const user = await prisma.user.findUnique({
      where: {
        id: facultyId,
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    console.log('Found user:', JSON.stringify(user, null, 2));

    if (!user) {
      console.log('User not found in database');
      return NextResponse.json({ error: 'Faculty not found' }, { status: 404 });
    }

    // First get all courses for this faculty
    console.log('Finding courses for faculty:', facultyId);
    const courses = await prisma.$queryRaw<
      Array<{ id: string; title: string }>
    >`
      SELECT id, title 
      FROM courses 
      WHERE "facultyId" = ${facultyId}
    `;
    console.log('Found courses:', JSON.stringify(courses, null, 2));

    if (!Array.isArray(courses) || courses.length === 0) {
      console.log('No courses found for faculty');
      return NextResponse.json([]);
    }

    const courseIds = courses.map((course) => course.id);
    console.log('Course IDs:', courseIds);

    // Then get schedules for these courses
    console.log('Finding schedules for courses:', courseIds);
    const schedules = await prisma.$queryRaw<
      Array<{
        id: string;
        courseId: string;
        day: Date;
        fromTime: string;
        toTime: string;
        course: {
          code: string;
          title: string;
          room: string;
        };
      }>
    >`
      SELECT 
        cs.id,
        cs."courseId",
        cs.day,
        cs."fromTime",
        cs."toTime",
        json_build_object(
          'id', c.id,
          'code', c.code,
          'title', c.title,
          'room', c.room,
          'semester', c.semester,
          'section', c.section
        ) as course
      FROM course_schedules cs
      JOIN courses c ON cs."courseId" = c.id
      WHERE cs."courseId" = ANY(${courseIds})
      ORDER BY cs.day ASC
    `;
    console.log('Found schedules:', JSON.stringify(schedules, null, 2));

    return NextResponse.json(schedules);
  } catch (error: any) {
    console.error('Detailed error in GET /api/courses/schedules:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
      cause: error?.cause,
      prismaAvailable: !!prisma,
      prismaModels: Object.keys(prisma),
    });

    return NextResponse.json(
      {
        error: 'Failed to fetch schedules',
        details: error?.message || 'Unknown error',
      },
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

    const body = await request.json();
    const { courseId, day, fromTime, toTime } = body;

    // Validate required fields
    if (!courseId || !day || !fromTime || !toTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    // Check for schedule overlap
    const hasOverlap = await hasScheduleOverlap(
      courseId,
      new Date(day),
      fromTime,
      toTime,
    );
    if (hasOverlap) {
      return NextResponse.json(
        { error: 'Schedule overlaps with existing schedule' },
        { status: 400 },
      );
    }

    const schedule = await prisma.courseSchedule.create({
      data: {
        courseId,
        day: new Date(day),
        fromTime,
        toTime,
      },
      include: {
        course: true,
      },
    });

    return NextResponse.json(schedule);
  } catch (error) {
    console.error('Error creating schedule:', error);
    return NextResponse.json(
      { error: 'Failed to create schedule' },
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
        { error: 'Schedule ID is required' },
        { status: 400 },
      );
    }

    await prisma.courseSchedule.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    return NextResponse.json(
      { error: 'Failed to delete schedule' },
      { status: 500 },
    );
  }
}
