import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function POST(
  req: Request,
  { params }: { params: { quiz_id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { quiz_id: quizId } = await Promise.resolve(params);
  if (!quizId) {
    return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { scores } = body;

    if (!Array.isArray(scores) || scores.length === 0) {
      return NextResponse.json(
        { error: 'Scores array is required' },
        { status: 400 },
      );
    }

    // Validate all scores have required fields
    for (const score of scores) {
      if (
        !score.studentId ||
        score.score === undefined ||
        !score.attendance ||
        score.plusPoints === undefined ||
        score.totalGrade === undefined
      ) {
        return NextResponse.json(
          { error: 'Missing required fields in one or more scores' },
          { status: 400 },
        );
      }
    }

    // Use a transaction to save all scores
    const savedScores = await prisma.$transaction(
      scores.map((score) =>
        prisma.quizScore.upsert({
          where: {
            quizId_studentId: {
              quizId,
              studentId: score.studentId,
            },
          },
          update: {
            score: score.score,
            attendance: score.attendance,
            plusPoints: score.plusPoints,
            totalGrade: score.totalGrade,
          },
          create: {
            quizId,
            studentId: score.studentId,
            score: score.score,
            attendance: score.attendance,
            plusPoints: score.plusPoints,
            totalGrade: score.totalGrade,
          },
        }),
      ),
    );

    return NextResponse.json({
      message: 'Quiz scores saved successfully',
      scores: savedScores,
    });
  } catch (error) {
    console.error('Error saving quiz scores:', error);
    return NextResponse.json(
      { error: 'Failed to save quiz scores' },
      { status: 500 },
    );
  }
}
