import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function GET(
  req: Request,
  context: { params: { courseId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { courseId } = await context.params;
  try {
    const quizzes = await prisma.quiz.findMany({
      where: { courseId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(quizzes);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch quizzes' },
      { status: 500 },
    );
  }
}

export async function POST(
  req: Request,
  context: { params: { courseId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { courseId } = await context.params;
  try {
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
    const quiz = await prisma.quiz.create({
      data: {
        name,
        courseId,
        quizDate: new Date(quizDate),
        attendanceRangeStart: new Date(attendanceRangeStart),
        attendanceRangeEnd: new Date(attendanceRangeEnd),
        maxScore,
        passingRate,
      },
    });
    return NextResponse.json(quiz);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create quiz' },
      { status: 500 },
    );
  }
}
