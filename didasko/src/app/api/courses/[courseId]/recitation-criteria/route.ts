import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth-options';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export async function GET(
  request: Request,
  context: { params: Promise<{ courseId: string }> },
) {
  try {
    const { courseId } = await context.params;
    if (!courseId || typeof courseId !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid courseId' },
        { status: 400 },
      );
    }
    console.log('Fetching recitation criteria for course:', courseId);

    const criteria = await prisma.criteria.findMany({
      where: {
        courseId: courseId,
        isRecitationCriteria: true,
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

    // Fetch rubrics for each filtered criteria (for consistent response)
    const criteriaWithRubrics = await Promise.all(
      criteria.map(async (c) => ({
        ...c,
        rubrics: await prisma.rubric.findMany({ where: { criteriaId: c.id } }),
      })),
    );

    console.log(`Found ${criteria.length} recitation criteria`);
    return NextResponse.json(criteriaWithRubrics);
  } catch (error) {
    let errorMessage = 'Unknown error';
    if (error instanceof Error) errorMessage = error.message;
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2023') {
        return NextResponse.json(
          { error: 'Invalid ID format', details: errorMessage },
          { status: 400 },
        );
      }
    }
    console.error('Error details:', {
      message: errorMessage,
      courseId: (await context.params).courseId,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Failed to fetch recitation criteria', details: errorMessage },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ courseId: string }> },
) {
  try {
    const { courseId } = await context.params;
    if (!courseId || typeof courseId !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid courseId' },
        { status: 400 },
      );
    }
    const data = await request.json();
    console.log('Creating recitation criteria with data:', {
      courseId,
      ...data,
    });

    const scoringRange =
      typeof data.scoringRange === 'number'
        ? String(data.scoringRange)
        : data.scoringRange;

    const passingScore =
      typeof data.passingScore === 'number'
        ? String(data.passingScore)
        : data.passingScore;

    const criteria = await prisma.criteria.create({
      data: {
        name: data.name,
        courseId,
        userId: data.userId,
        date: new Date(data.date),
        scoringRange,
        passingScore,
        isGroupCriteria: false,
        isRecitationCriteria: true, // Set this to true for recitation criteria
        rubrics: {
          create: Array.isArray(data.rubrics)
            ? data.rubrics.map((r: any) => ({
                name: r.name,
                percentage: r.weight ?? r.percentage,
              }))
            : [],
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
    let errorMessage = 'Unknown error';
    if (error instanceof Error) errorMessage = error.message;
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        return NextResponse.json(
          { error: 'Course or user not found', details: errorMessage },
          { status: 404 },
        );
      }
      if (error.code === 'P2023') {
        return NextResponse.json(
          { error: 'Invalid ID format', details: errorMessage },
          { status: 400 },
        );
      }
    }
    console.error('Error details:', {
      message: errorMessage,
      courseId: (await context.params).courseId,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Failed to create recitation criteria', details: errorMessage },
      { status: 500 },
    );
  }
}
