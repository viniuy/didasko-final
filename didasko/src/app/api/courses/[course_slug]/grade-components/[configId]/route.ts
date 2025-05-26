import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth-options';

export async function PUT(
  request: Request,
  context: { params: { course_slug: string; configId: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await Promise.resolve(context.params);
    const { course_slug, configId } = params;
    const body = await request.json();
    const { components } = body;

    // Get the course first
    const course = await prisma.course.findUnique({
      where: { slug: course_slug },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check if the grade configuration exists
    const existingConfig = await prisma.gradeConfiguration.findUnique({
      where: { id: configId },
    });

    if (!existingConfig) {
      return NextResponse.json(
        { error: 'Grade configuration not found' },
        { status: 404 },
      );
    }

    // Update the grade configuration
    const updatedConfig = await prisma.gradeConfiguration.update({
      where: { id: configId },
      data: {
        name: components.name,
        reportingWeight: components.reportingWeight,
        recitationWeight: components.recitationWeight,
        quizWeight: components.quizWeight,
        passingThreshold: components.passingThreshold,
        startDate: components.startDate ? new Date(components.startDate) : null,
        endDate: components.endDate ? new Date(components.endDate) : null,
      },
    });

    return NextResponse.json(updatedConfig);
  } catch (error) {
    console.error('Error updating grade configuration:', error);
    return NextResponse.json(
      { error: 'Failed to update grade configuration' },
      { status: 500 },
    );
  }
}
