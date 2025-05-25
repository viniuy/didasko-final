import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth-options';

export async function PUT(
  request: Request,
  context: { params: { courseId: string; configId: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId, configId } = context.params;

    // First verify that the configuration exists and belongs to the course
    const config = await prisma.gradeConfiguration.findFirst({
      where: {
        id: configId,
        courseId,
      },
      include: {
        scores: {
          include: {
            student: true
          }
        }
      }
    });

    if (!config) {
      return NextResponse.json(
        { error: 'Grade configuration not found' },
        { status: 404 },
      );
    }

    // Return the configuration with student scores
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error setting current grade configuration:', error);
    return NextResponse.json(
      { error: 'Failed to set current grade configuration' },
      { status: 500 },
    );
  }
} 