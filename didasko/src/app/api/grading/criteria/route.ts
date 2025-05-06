import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  Criteria,
  CriteriaCreateInput,
  CriteriaResponse,
} from '@/types/grading';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, courseId, rubrics, scoringRange, passingScore } =
      body as CriteriaCreateInput;

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
        userId: session.user.id,
        rubrics: JSON.stringify(rubrics),
        scoringRange,
        passingScore,
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

    // Transform the response to match the Criteria type
    const transformedCriteria: Criteria = {
      ...criteria,
      rubrics: JSON.parse(criteria.rubrics as string),
    };

    return NextResponse.json(transformedCriteria);
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
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 },
      );
    }

    // Get total count for pagination
    const total = await prisma.criteria.count({
      where: { courseId },
    });

    const criteria = await prisma.criteria.findMany({
      where: { courseId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    // Transform the response to match the Criteria type
    const transformedCriteria: Criteria[] = criteria.map((c) => ({
      ...c,
      rubrics: JSON.parse(c.rubrics as string),
    }));

    const response: CriteriaResponse = {
      criteria: transformedCriteria,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching criteria:', error);
    return NextResponse.json(
      { error: 'Failed to fetch criteria' },
      { status: 500 },
    );
  }
}
