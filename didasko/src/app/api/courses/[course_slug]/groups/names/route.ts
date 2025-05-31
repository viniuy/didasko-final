import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function GET(
  request: Request,
  context: { params: { course_slug: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await Promise.resolve(context.params);
    const { course_slug } = params;

    // Get the course
    const course = await prisma.course.findUnique({
      where: { slug: course_slug },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Get all groups for the course
    const groups = await prisma.group.findMany({
      where: {
        courseId: course.id,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ groups });
  } catch (error) {
    console.error('Error fetching group names:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group names' },
      { status: 500 },
    );
  }
}
