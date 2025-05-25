import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { course_slug: string } },
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const number = searchParams.get('number');

    if (!number) {
      return new NextResponse('Group number is required', { status: 400 });
    }

    const groupNumber = parseInt(number);
    if (isNaN(groupNumber)) {
      return new NextResponse('Invalid group number', { status: 400 });
    }

    // Get the course
    const course = await prisma.course.findUnique({
      where: { slug: params.course_slug },
    });

    if (!course) {
      return new NextResponse('Course not found', { status: 404 });
    }

    // Check if a group with this number already exists in the course
    const existingGroup = await prisma.group.findFirst({
      where: {
        courseId: course.id,
        number: groupNumber.toString(),
      },
    });

    return NextResponse.json({ exists: !!existingGroup });
  } catch (error) {
    console.error('Error checking group number:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
