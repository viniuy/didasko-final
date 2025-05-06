import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthCookie, verifyToken } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function GET(
  request: Request,
  { params }: { params: { courseId: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const criteriaId = searchParams.get('criteriaId');

    if (!date || !criteriaId) {
      return NextResponse.json(
        { error: 'Date and criteriaId are required' },
        { status: 400 },
      );
    }

    // Ensure params is properly awaited
    const courseId = params.courseId;

    const grades = await prisma.grade.findMany({
      where: {
        courseId: courseId,
        criteriaId: criteriaId,
        date: new Date(date),
      },
      include: {
        student: {
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

    console.log('Found grades:', grades);

    return NextResponse.json(grades);
  } catch (error) {
    console.error('Error fetching grades:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grades' },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string } },
) {
  try {
    const { date, criteriaId, grades } = await request.json();
    const authCookie = getAuthCookie();

    console.log('POST grades request:', {
      courseId: params.courseId,
      date,
      criteriaId,
      gradesCount: grades?.length,
    });

    if (!authCookie) {
      console.log('No auth cookie found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!date || !criteriaId || !grades || !Array.isArray(grades)) {
      console.log('Invalid request data');
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 },
      );
    }

    // Delete existing grades for this date and criteria
    console.log('Deleting existing grades');
    await prisma.grade.deleteMany({
      where: {
        courseId: params.courseId,
        criteriaId: criteriaId,
        date: new Date(date),
      },
    });

    // Create new grades
    console.log('Creating new grades');
    const createdGrades = await prisma.grade.createMany({
      data: grades.map(
        (grade: { studentId: string; scores: number[]; total: number }) => ({
          courseId: params.courseId,
          criteriaId: criteriaId,
          studentId: grade.studentId,
          value: grade.total,
          scores: grade.scores,
          total: grade.total,
          date: new Date(date),
        }),
      ),
    });

    console.log('Created grades:', createdGrades);
    return NextResponse.json(createdGrades);
  } catch (error) {
    console.error('Error saving grades:', error);
    return NextResponse.json(
      { error: 'Failed to save grades' },
      { status: 500 },
    );
  }
}
