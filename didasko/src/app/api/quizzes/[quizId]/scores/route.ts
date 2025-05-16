import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function POST(
  req: Request,
  { params }: { params: { quizId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { quizId } = params;
  try {
    const body = await req.json();
    const { studentId, score, attendance, plusPoints, totalGrade } = body;

    if (
      !studentId ||
      score === undefined ||
      !attendance ||
      plusPoints === undefined ||
      totalGrade === undefined
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    // Upsert the quiz score
    const quizScore = await prisma.quizScore.upsert({
      where: {
        quizId_studentId: {
          quizId,
          studentId,
        },
      },
      update: {
        score,
        attendance,
        plusPoints,
        totalGrade,
      },
      create: {
        quizId,
        studentId,
        score,
        attendance,
        plusPoints,
        totalGrade,
      },
    });

    return NextResponse.json(quizScore);
  } catch (error) {
    console.error('Error saving quiz score:', error);
    return NextResponse.json(
      { error: 'Failed to save quiz score' },
      { status: 500 },
    );
  }
}
