import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthCookie, verifyToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const tokenStr = await getAuthCookie();
    if (!tokenStr) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = await verifyToken(tokenStr);
    if (!token) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const data = await request.json();
    const { name, courseId, rubrics, scoringRange, passingScore } = data;

    // Validate required fields
    if (!name || !courseId || !rubrics || !scoringRange || !passingScore) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    // Create new criteria
    const criteria = await prisma.criteria.create({
      data: {
        name,
        courseId,
        userId: token.id,
        rubrics,
        scoringRange,
        passingScore,
      },
    });

    return NextResponse.json(criteria);
  } catch (error) {
    console.error('Error creating criteria:', error);
    return NextResponse.json(
      { error: 'Failed to create criteria' },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const tokenStr = await getAuthCookie();
    if (!tokenStr) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = await verifyToken(tokenStr);
    if (!token) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 },
      );
    }

    const criteria = await prisma.criteria.findMany({
      where: {
        courseId,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(criteria);
  } catch (error) {
    console.error('Error fetching criteria:', error);
    return NextResponse.json(
      { error: 'Failed to fetch criteria' },
      { status: 500 },
    );
  }
}
