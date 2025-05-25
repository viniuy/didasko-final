import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

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

    // Get all students not enrolled in the specified course
    const availableStudents = await prisma.student.findMany({
      where: {
        NOT: {
          coursesEnrolled: {
            some: {
              id: courseId,
            },
          },
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        middleInitial: true,
        image: true,
      },
    });

    return NextResponse.json(availableStudents);
  } catch (error) {
    console.error('Error fetching available students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available students' },
      { status: 500 },
    );
  }
}
