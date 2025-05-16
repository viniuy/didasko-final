import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { Prisma, AttendanceStatus } from '@prisma/client';
import { AttendanceResponse, AttendanceCreateInput } from '@/types/attendance';

export async function GET(
  request: Request,
  context: { params: { courseId: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await Promise.resolve(context.params);
    const { courseId } = params;

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 },
      );
    }

    // Create start and end of day dates to ensure we catch all records for the day
    const startDate = new Date(date);
    startDate.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setUTCHours(23, 59, 59, 999);

    // Get total count for pagination
    const total = await prisma.attendance.count({
      where: {
        courseId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        courseId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        student: {
          select: {
            id: true,
            lastName: true,
            firstName: true,
            middleInitial: true,
          },
        },
        course: {
          select: {
            id: true,
            code: true,
            title: true,
            section: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    const response: AttendanceResponse = {
      attendance: attendanceRecords,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance records' },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  context: { params: { courseId: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await Promise.resolve(context.params);
    const { courseId } = params;

    const { date, attendance } = await request.json();

    // Create a UTC date at the start of the day
    const utcDate = new Date(date);
    utcDate.setUTCHours(0, 0, 0, 0);

    // Validate the course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Process each attendance record
    const result = await prisma.$transaction(async (tx) => {
      const records = [];
      for (const record of attendance) {
        // First try to find an existing record for this student on this date
        const existingRecord = await tx.attendance.findFirst({
          where: {
            studentId: record.studentId,
            courseId: courseId,
            date: {
              gte: utcDate,
              lt: new Date(utcDate.getTime() + 24 * 60 * 60 * 1000), // Next day
            },
          },
        });

        if (existingRecord) {
          // Update existing record
          const updated = await tx.attendance.update({
            where: { id: existingRecord.id },
            data: { status: record.status },
            include: {
              student: {
                select: {
                  id: true,
                  lastName: true,
                  firstName: true,
                  middleInitial: true,
                },
              },
              course: {
                select: {
                  id: true,
                  code: true,
                  title: true,
                  section: true,
                },
              },
            },
          });
          records.push(updated);
        } else {
          // Create new record only if one doesn't exist
          const created = await tx.attendance.create({
            data: {
              studentId: record.studentId,
              courseId: courseId,
              date: utcDate,
              status: record.status,
            },
            include: {
              student: {
                select: {
                  id: true,
                  lastName: true,
                  firstName: true,
                  middleInitial: true,
                },
              },
              course: {
                select: {
                  id: true,
                  code: true,
                  title: true,
                  section: true,
                },
              },
            },
          });
          records.push(created);
        }
      }
      return records;
    });

    return NextResponse.json({
      message: 'Attendance saved successfully',
      records: result,
    });
  } catch (error) {
    console.error('Error saving attendance:', error);
    return NextResponse.json(
      { error: 'Failed to save attendance' },
      { status: 500 },
    );
  }
}
