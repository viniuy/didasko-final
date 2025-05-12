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
    const {
      name,
      courseId,
      rubrics,
      scoringRange,
      passingScore,
      date,
      isGroupCriteria,
    } = body as any;

    // Validate required fields
    if (
      !name ||
      !courseId ||
      !rubrics ||
      !scoringRange ||
      !passingScore ||
      !date
    ) {
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
        scoringRange,
        passingScore,
        date: new Date(date),
        isGroupCriteria: isGroupCriteria === true, // default to false if not provided
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
            email: true,
          },
        },
        rubrics: true,
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
        rubrics: true,
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const response: CriteriaResponse = {
      criteria,
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
