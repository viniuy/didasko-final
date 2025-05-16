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

    // First get the course ID using either the course code or ID
    const course = await prisma.course.findFirst({
      where: {
        OR: [{ id: courseId }, { code: courseId.toUpperCase() }],
      },
      select: { id: true },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Get the group
    const group = await prisma.group.findFirst({
      where: {
        id: group_id,
        courseId: course.id,
      },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Get criteria for this group
    const criteria = await prisma.criteria.findMany({
      where: {
        courseId: course.id,
        isGroupCriteria: true,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
        rubrics: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(criteria);
  } catch (error) {
    console.error('Error fetching group criteria:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group criteria' },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  context: { params: { courseId: string; group_id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await Promise.resolve(context.params);
    const { courseId, group_id } = params;
    const body = await request.json();
    const { name, rubrics, scoringRange, passingScore, date } = body;

    // First get the course ID using either the course code or ID
    const course = await prisma.course.findFirst({
      where: {
        OR: [{ id: courseId }, { code: courseId.toUpperCase() }],
      },
      select: { id: true },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Get the group
    const group = await prisma.group.findFirst({
      where: {
        id: group_id,
        courseId: course.id,
      },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Create criteria with group-specific rubrics
    const criteria = await prisma.criteria.create({
      data: {
        name,
        courseId: course.id,
        userId: session.user.id,
        date: new Date(date),
        scoringRange: String(scoringRange),
        passingScore: String(passingScore),
        isGroupCriteria: true,
        rubrics: {
          create: rubrics.map((r: any) => ({
            name: r.name,
            percentage: r.weight ?? r.percentage,
          })),
        },
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
        rubrics: true,
      },
    });

    return NextResponse.json(criteria);
  } catch (error) {
    console.error('Error creating group criteria:', error);
    return NextResponse.json(
      { error: 'Failed to create group criteria' },
      { status: 500 },
    );
  }
}
