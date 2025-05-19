import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  context: { params: { courseId: string } },
) {
  const { courseId } = context.params;
  try {
    const config = await prisma.gradeConfiguration.findFirst({
      where: { courseId },
      orderBy: { createdAt: 'desc' },
    });
    if (!config) {
      return NextResponse.json(
        { error: 'No current grade configuration found' },
        { status: 404 },
      );
    }
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching current grade configuration:', error);
    return NextResponse.json(
      { error: 'Failed to fetch current grade configuration' },
      { status: 500 },
    );
  }
}
