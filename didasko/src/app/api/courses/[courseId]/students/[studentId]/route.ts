import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function DELETE(
  request: Request,
  context: { params: { courseId: string; studentId: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await Promise.resolve(context.params);
    const { courseId, studentId } = params;

    // Update the course by disconnecting the student
    const updatedCourse = await prisma.course.update({
      where: {
        id: courseId,
      },
      data: {
        students: {
          disconnect: {
            id: studentId,
          },
        },
      },
    });

    // Also remove any attendance records for this student in this course
    await prisma.attendance.deleteMany({
      where: {
        studentId: studentId,
        courseId: courseId,
      },
    });

    return NextResponse.json({
      message: 'Student removed from course successfully',
      course: updatedCourse,
    });
  } catch (error) {
    console.error('Error removing student from course:', error);
    return NextResponse.json(
      { error: 'Failed to remove student from course' },
      { status: 500 },
    );
  }
}
