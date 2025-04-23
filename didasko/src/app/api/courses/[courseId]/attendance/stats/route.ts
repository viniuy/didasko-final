import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { AttendanceStatus } from '@prisma/client';

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

    // Get the course with its students
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        students: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Get the most recent attendance date for this course
    const mostRecentAttendance = await prisma.attendance.findFirst({
      where: {
        courseId,
      },
      orderBy: {
        date: 'desc',
      },
      select: {
        date: true,
      },
    });

    if (!mostRecentAttendance) {
      return NextResponse.json({
        totalAbsents: 0,
        lastAttendanceDate: null,
      });
    }

    // Get all attendance records for the most recent date
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        courseId,
        date: mostRecentAttendance.date,
      },
      select: {
        studentId: true,
        status: true,
      },
    });

    // Create a map of student IDs to their attendance status
    const attendanceMap = new Map(
      attendanceRecords.map((record) => [record.studentId, record.status]),
    );

    // Count absents:
    // 1. Students marked as ABSENT in the database
    // 2. Students not present in the attendance records (NOT_SET)
    let totalAbsents = 0;
    course.students.forEach((student: { id: string }) => {
      const status = attendanceMap.get(student.id);
      if (status === 'ABSENT' || !status) {
        totalAbsents++;
      }
    });

    return NextResponse.json({
      totalAbsents,
      lastAttendanceDate: mostRecentAttendance.date,
    });
  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance statistics' },
      { status: 500 },
    );
  }
}
