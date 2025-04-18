import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } },
) {
  try {
    const courseId = params.courseId;
    console.log('Fetching criteria for course:', courseId);

    const criteria = await prisma.criteria.findMany({
      where: {
        courseId: courseId,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`Found ${criteria.length} criteria`);
    return NextResponse.json(criteria);
  } catch (error) {
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      courseId: params.courseId,
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2023') {
        return NextResponse.json(
          { error: 'Invalid ID format' },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch criteria' },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string } },
) {
  try {
    const courseId = params.courseId;
    const data = await request.json();
    console.log('Creating criteria with data:', { courseId, ...data });

    const criteria = await prisma.criteria.create({
      data: {
        name: data.name,
        courseId: courseId,
        userId: data.userId,
        rubrics: data.rubrics,
        scoringRange: data.scoringRange,
        passingScore: data.passingScore,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    console.log('Created criteria:', criteria.id);
    return NextResponse.json(criteria);
  } catch (error) {
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      courseId: params.courseId,
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        return NextResponse.json(
          { error: 'Course or user not found' },
          { status: 404 },
        );
      }
      if (error.code === 'P2023') {
        return NextResponse.json(
          { error: 'Invalid ID format' },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to create criteria' },
      { status: 500 },
    );
  }
}
