import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth-options';

// Helper to get grade percentages for a student
async function getStudentGradePercentages(courseId: string, studentId: string) {
  // Get the latest grade configuration
  const gradeConfig = await prisma.gradeConfiguration.findFirst({
    where: { courseId },
    orderBy: { createdAt: 'desc' },
  });

  if (!gradeConfig) {
    return { reporting: 0, recitation: 0, quiz: 0 };
  }

  // Get the student's grade scores
  const gradeScore = await prisma.gradeScore.findFirst({
    where: {
      courseId,
      studentId,
      configId: gradeConfig.id,
    },
  });

  if (!gradeScore) {
    return { reporting: 0, recitation: 0, quiz: 0 };
  }

  return {
    reporting: gradeScore.reportingScore || 0,
    recitation: gradeScore.recitationScore || 0,
    quiz: gradeScore.quizScore || 0,
  };
}

export async function GET(
  request: Request,
  context: { params: { course_slug: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await Promise.resolve(context.params);
    const { course_slug } = params;

    // Get the course first
    const course = await prisma.course.findUnique({
      where: { slug: course_slug },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Get all grade configurations for the course
    const configs = await prisma.gradeConfiguration.findMany({
      where: { courseId: course.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ configurations: configs });
  } catch (error) {
    console.error('Error fetching grade configurations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grade configurations' },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  context: { params: { course_slug: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await Promise.resolve(context.params);
    const { course_slug } = params;
    const body = await request.json();
    const { components } = body;

    // Get the course first
    const course = await prisma.course.findUnique({
      where: { slug: course_slug },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Create new grade configuration
    const config = await prisma.gradeConfiguration.create({
      data: {
        id: `${course.id}_${Date.now()}`,
        name: components.name,
        reportingWeight: components.reportingWeight,
        recitationWeight: components.recitationWeight,
        quizWeight: components.quizWeight,
        passingThreshold: components.passingThreshold,
        startDate: new Date(components.startDate),
        endDate: new Date(components.endDate),
        course: {
          connect: {
            id: course.id,
          },
        },
      },
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error creating grade configuration:', error);
    return NextResponse.json(
      { error: 'Failed to create grade configuration' },
      { status: 500 },
    );
  }
}
