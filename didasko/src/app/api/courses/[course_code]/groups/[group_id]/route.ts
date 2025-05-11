import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth-options';

export async function GET(
  request: Request,
  { params }: { params: { course_code: string; group_id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First get the course ID using the course code
    const course = await prisma.course.findFirst({
      where: { code: params.course_code.toUpperCase() },
      select: { id: true }
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Get the specific group
    const group = await prisma.group.findUnique({
      where: {
        id: params.group_id
      },
      include: {
        students: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleInitial: true,
            image: true
          }
        },
        leader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleInitial: true,
            image: true
          }
        }
      }
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Verify that the group belongs to the course
    if (group.courseId !== course.id) {
      return NextResponse.json({ error: 'Group not found in this course' }, { status: 404 });
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group' },
      { status: 500 }
    );
  }
} 