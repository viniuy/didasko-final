import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function PUT(
  req: Request,
  context: { params: { quiz_id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const params = await Promise.resolve(context.params);
    const { quiz_id } = params;
    const body = await req.json();
    const {
      name,
      maxScore,
      attendanceRangeStart,
      attendanceRangeEnd,
      quizDate,
      passingRate,
    } = body;

    if (
      !name ||
      !maxScore ||
      !attendanceRangeStart ||
      !attendanceRangeEnd ||
      !quizDate ||
      !passingRate
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    // First find the quiz
    const existingQuiz = await prisma.quiz.findUnique({
      where: { id: quiz_id },
    });

    if (!existingQuiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    // Update the quiz
    const updatedQuiz = await prisma.quiz.update({
      where: { id: quiz_id },
      data: {
        name,
        quizDate: new Date(quizDate),
        attendanceRangeStart: new Date(attendanceRangeStart),
        attendanceRangeEnd: new Date(attendanceRangeEnd),
        maxScore,
        passingRate,
      },
    });

    return NextResponse.json(updatedQuiz);
  } catch (error) {
    console.error('Error updating quiz:', error);
    return NextResponse.json(
      { error: 'Failed to update quiz' },
      { status: 500 },
    );
  }
}
