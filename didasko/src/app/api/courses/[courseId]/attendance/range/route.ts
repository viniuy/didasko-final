import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { AttendanceStatus } from '@prisma/client';

interface AttendanceStats {
  totalClasses: number;
  studentStats: {
    studentId: string;
    firstName: string;
    lastName: string;
    middleInitial: string | null;
    present: number;
    late: number;
    absent: number;
    attendanceRate: number;
  }[];
  uniqueDates: string[];
}

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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 },
      );
    }

    // Parse dates and set to start/end of day
    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);

    // Get the course with its students
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        students: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleInitial: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Get all unique dates where attendance was taken within the range
    const uniqueDates = await prisma.attendance.findMany({
      where: {
        courseId,
        date: {
          gte: start,
          lte: end,
        },
      },
      select: {
        date: true,
      },
      distinct: ['date'],
      orderBy: {
        date: 'asc',
      },
    });

    const totalClasses = uniqueDates.length;

    // Get all attendance records for each student within the date range
    const studentStats = await Promise.all(
      course.students.map(async (student) => {
        const attendanceRecords = await prisma.attendance.findMany({
          where: {
            courseId,
            studentId: student.id,
            date: {
              gte: start,
              lte: end,
            },
          },
          select: {
            status: true,
          },
        });

        const present = attendanceRecords.filter(
          (record) => record.status === 'PRESENT',
        ).length;
        const late = attendanceRecords.filter(
          (record) => record.status === 'LATE',
        ).length;
        const absent = attendanceRecords.filter(
          (record) => record.status === 'ABSENT',
        ).length;

        const attendanceRate =
          totalClasses > 0 ? ((present + late) / totalClasses) * 100 : 0;

        return {
          studentId: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          middleInitial: student.middleInitial,
          present,
          late,
          absent,
          attendanceRate,
        };
      }),
    );

    const stats: AttendanceStats = {
      totalClasses,
      studentStats,
      uniqueDates: uniqueDates.map((date) => date.date.toISOString()),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching attendance range stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance statistics' },
      { status: 500 },
    );
  }
}
