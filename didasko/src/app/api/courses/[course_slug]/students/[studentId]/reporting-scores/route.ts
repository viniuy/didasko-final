import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth-options';

export async function GET(
  request: Request,
  context: { params: { courseId: string; studentId: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const courseId = context.params.courseId;
    const studentId = context.params.studentId;
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // Get the latest grade score for the student in the course
    const gradeScore = await prisma.gradeScore.findFirst({
      where: {
        studentId,
        courseId,
        ...(from && to
          ? {
              createdAt: {
                gte: new Date(from),
                lte: new Date(to),
              },
            }
          : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!gradeScore) {
      return NextResponse.json({
        score: 0,
        createdAt: null,
      });
    }

    return NextResponse.json({
      score: gradeScore.reportingScore || 0,
      createdAt: gradeScore.createdAt,
    });
  } catch (error) {
    console.error('Error fetching reporting score:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reporting score' },
      { status: 500 },
    );
  }
}
