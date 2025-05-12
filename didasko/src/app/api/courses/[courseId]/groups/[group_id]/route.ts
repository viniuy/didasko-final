import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth-options';

export async function GET(
  request: Request,
  context: { params: { courseId: string; group_id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await Promise.resolve(context.params);
    const { courseId, group_id } = params;

    // First get the course ID using the course code
    const course = await prisma.course.findFirst({
      where: { code: courseId.toUpperCase() },
      select: { id: true },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Get the specific group
    const group = await prisma.group.findFirst({
      where: {
        id: group_id,
        courseId: course.id,
      },
      include: {
        students: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleInitial: true,
            image: true,
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group' },
      { status: 500 },
    );
  }
}
