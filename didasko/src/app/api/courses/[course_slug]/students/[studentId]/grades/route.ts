import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth-options';

export async function GET(
  request: Request,
  context: { params: { course_slug: string; studentId: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await Promise.resolve(context.params);
    const { course_slug, studentId } = params;
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    console.log('Backend received from:', from, 'to:', to);

    // Parse dates and ensure they are in UTC
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;

    // Validate dates
    if (from && isNaN(fromDate.getTime())) {
      return NextResponse.json({ error: 'Invalid from date' }, { status: 400 });
    }
    if (to && isNaN(toDate.getTime())) {
      return NextResponse.json({ error: 'Invalid to date' }, { status: 400 });
    }

    // Get the course using the slug
    const course = await prisma.course.findUnique({
      where: { slug: course_slug },
      select: { id: true },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Get all grades for the student
    const grades = await prisma.grade.findMany({
      where: {
        courseId: course.id,
        studentId,
        ...(fromDate && toDate
          ? {
              date: {
                gte: fromDate,
                lte: toDate,
              },
            }
          : fromDate
          ? { date: { gte: fromDate } }
          : toDate
          ? { date: { lte: toDate } }
          : {}),
      },
      orderBy: { date: 'desc' },
    });

    console.log(
      'Grades query date range:',
      fromDate ? fromDate.toISOString() : 'no from',
      toDate ? toDate.toISOString() : 'no to',
    );

    // Get the latest grade configuration
    const gradeConfig = await prisma.gradeConfiguration.findFirst({
      where: { courseId: course.id },
      orderBy: { createdAt: 'desc' },
    });

    if (!gradeConfig) {
      return NextResponse.json(
        { error: 'No grade configuration found' },
        { status: 404 },
      );
    }

    // Calculate reporting and recitation scores from grades
    const reportingGrades = grades.filter((grade) => grade.reportingScore);
    const recitationGrades = grades.filter((grade) => grade.recitationScore);

    // Calculate averages for reporting and recitation scores
    const reportingScore =
      reportingGrades.length > 0
        ? reportingGrades.reduce((sum, grade) => sum + grade.total, 0) /
          reportingGrades.length
        : 0;

    const recitationScore =
      recitationGrades.length > 0
        ? recitationGrades.reduce((sum, grade) => sum + grade.total, 0) /
          recitationGrades.length
        : 0;

    // Get quiz scores
    const quizScores = await prisma.quizScore.findMany({
      where: {
        student: { id: studentId },
        quiz: { courseId: course.id },
        ...(fromDate && toDate
          ? {
              createdAt: {
                gte: fromDate,
                lte: toDate,
              },
            }
          : fromDate
          ? { createdAt: { gte: fromDate } }
          : toDate
          ? { createdAt: { lte: toDate } }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log('Found quiz scores:', quizScores);
    console.log('Date range:', {
      from: fromDate ? fromDate.toISOString() : 'no from',
      to: toDate ? toDate.toISOString() : 'no to',
    });

    // Calculate quiz score average using totalGrade
    const quizScore =
      quizScores.length > 0
        ? quizScores.reduce((sum, score) => sum + (score.totalGrade || 0), 0) /
          quizScores.length
        : 0;

    // Calculate total score based on weights
    const totalScore =
      (reportingScore * gradeConfig.reportingWeight) / 100 +
      (recitationScore * gradeConfig.recitationWeight) / 100 +
      (quizScore * gradeConfig.quizWeight) / 100;

    // Determine remarks
    let remarks = 'NO GRADE';
    if (totalScore >= gradeConfig.passingThreshold) {
      remarks = 'PASSED';
    } else if (totalScore < gradeConfig.passingThreshold) {
      remarks = 'FAILED';
    }

    return NextResponse.json({
      reportingScore,
      recitationScore,
      quizScore,
      totalScore,
      remarks,
      gradeDetails: {
        reportingGrades: reportingGrades.length,
        recitationGrades: recitationGrades.length,
        quizGrades: quizScores.length,
      },
      rawGrades: grades,
      rawQuizScores: quizScores,
    });
  } catch (error) {
    console.error('Error fetching student grades:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student grades' },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  context: { params: { courseId: string; studentId: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await Promise.resolve(context.params);
    const { courseId, studentId } = params;
    const body = await request.json();
    const { reportingScore, recitationScore, quizScore } = body;

    // Get the latest grade configuration
    const gradeConfig = await prisma.gradeConfiguration.findFirst({
      where: { courseId },
      orderBy: { createdAt: 'desc' },
    });

    if (!gradeConfig) {
      return NextResponse.json(
        { error: 'No grade configuration found' },
        { status: 404 },
      );
    }

    // Calculate total score based on weights
    const totalScore =
      ((reportingScore || 0) * gradeConfig.reportingWeight) / 100 +
      ((recitationScore || 0) * gradeConfig.recitationWeight) / 100 +
      ((quizScore || 0) * gradeConfig.quizWeight) / 100;

    // Determine remarks
    let remarks = 'NO GRADE';
    if (totalScore >= gradeConfig.passingThreshold) {
      remarks = 'PASSED';
    } else if (totalScore < gradeConfig.passingThreshold) {
      remarks = 'FAILED';
    }

    // Create new grade score
    const gradeScore = await prisma.gradeScore.create({
      data: {
        courseId,
        studentId,
        configId: gradeConfig.id,
        reportingScore: reportingScore || 0,
        recitationScore: recitationScore || 0,
        quizScore: quizScore || 0,
        totalScore,
        remarks,
      },
    });

    return NextResponse.json(gradeScore);
  } catch (error) {
    console.error('Error saving student grades:', error);
    return NextResponse.json(
      { error: 'Failed to save student grades' },
      { status: 500 },
    );
  }
}
