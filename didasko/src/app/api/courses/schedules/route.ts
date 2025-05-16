import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import {
  Schedule,
  ScheduleCreateInput,
  ScheduleResponse,
} from '@/types/schedule';

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
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const facultyId = searchParams.get('facultyId');
    const semester = searchParams.get('semester');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    if (!facultyId) {
      return NextResponse.json(
        { error: 'Faculty ID is required' },
        { status: 400 },
      );
    }

    // Verify the user exists
    const user = await prisma.user.findUnique({
      where: { id: facultyId },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Faculty not found' }, { status: 404 });
    }

    // Get total count for pagination
    const total = await prisma.courseSchedule.count({
      where: {
        course: {
          facultyId,
          ...(semester ? { semester } : {}),
        },
      },
    });

    // Get schedules with pagination
    const schedules = await prisma.courseSchedule.findMany({
      where: {
        course: {
          facultyId,
          ...(semester ? { semester } : {}),
        },
      },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            title: true,
            room: true,
            semester: true,
            section: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { day: 'asc' },
    });

    const response: ScheduleResponse = {
      schedules,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedules' },
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
    const { courseId, day, fromTime, toTime } = body as ScheduleCreateInput;

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
        course: {
          select: {
            id: true,
            code: true,
            title: true,
            room: true,
            semester: true,
            section: true,
          },
        },
      },
    });

    return NextResponse.json(schedule as Schedule);
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
    const scheduleId = searchParams.get('id');

    if (!scheduleId) {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 },
      );
    }

    await prisma.courseSchedule.delete({
      where: { id: scheduleId },
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
