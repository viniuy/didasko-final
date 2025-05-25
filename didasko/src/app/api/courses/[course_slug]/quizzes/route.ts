import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function GET(
  req: Request,
  { params }: { params: { course_slug: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { course_slug } = params;
  try {
    // First find the course using the slug
    const course = await prisma.course.findUnique({
      where: { slug: course_slug },
      select: { id: true },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const quizzes = await prisma.quiz.findMany({
      where: { courseId: course.id },
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
  { params }: { params: { course_slug: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { course_slug } = params;
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

    // First find the course using the slug
    const course = await prisma.course.findUnique({
      where: { slug: course_slug },
      select: { id: true },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const quiz = await prisma.quiz.create({
      data: {
        name,
        courseId: course.id,
        quizDate: new Date(quizDate),
        attendanceRangeStart: new Date(attendanceRangeStart),
        attendanceRangeEnd: new Date(attendanceRangeEnd),
        maxScore,
        passingRate,
      },
    });
    return NextResponse.json(quiz);
  } catch (error) {
    console.error('Error creating quiz:', error);
    return NextResponse.json(
      { error: 'Failed to create quiz' },
      { status: 500 },
    );
  }
}
