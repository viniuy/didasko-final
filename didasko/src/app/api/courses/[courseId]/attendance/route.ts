import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { AttendanceStatus } from '@prisma/client';

interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
}

export async function GET(
  request: Request,
  context: { params: { courseId: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const courseId = context.params.courseId;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 },
      );
    }

    // Validate the course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Create start and end of day dates to ensure we catch all records for the day
    const startDate = new Date(date);
    startDate.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setUTCHours(23, 59, 59, 999);

    // Fetch attendance records for the specified date
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        courseId: courseId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleInitial: true,
          },
        },
      },
    });

    return NextResponse.json(attendanceRecords);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance' },
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

    const courseId = context.params.courseId;
    const { date, attendance } = (await request.json()) as {
      date: string;
      attendance: (AttendanceRecord & { id?: string })[];
    };

    console.log('POST Attendance - Received data:', { date, attendance });

    // Create a UTC date at the start of the day
    const utcDate = new Date(date);
    utcDate.setUTCHours(0, 0, 0, 0);

    console.log('Normalized UTC date:', utcDate.toISOString());

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
        console.log('Processing record:', record);

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
          console.log('Updating existing record:', existingRecord.id);
          // Update existing record
          const updated = await tx.attendance.update({
            where: { id: existingRecord.id },
            data: { status: record.status },
          });
          console.log('Updated record:', updated);
          records.push(updated);
        } else {
          console.log('Creating new record for student:', record.studentId);
          // Create new record only if one doesn't exist
          const created = await tx.attendance.create({
            data: {
              studentId: record.studentId,
              courseId: courseId,
              date: utcDate,
              status: record.status,
            },
          });
          console.log('Created record:', created);
          records.push(created);
        }
      }
      return records;
    });

    console.log('Final result:', result);
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
