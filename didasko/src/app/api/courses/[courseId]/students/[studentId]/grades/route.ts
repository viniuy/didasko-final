import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth-options';

export async function GET(
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
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    console.log('Backend received from:', from, 'to:', to);

    // Get all grades for the student
    const grades = await prisma.grade.findMany({
      where: {
        courseId,
        studentId,
        ...(from && to
          ? { date: { gte: new Date(from), lte: new Date(to) } }
          : from
          ? { date: { gte: new Date(from) } }
          : to
          ? { date: { lte: new Date(to) } }
          : {}),
      },
      orderBy: { date: 'desc' },
    });

    console.log(
      'Grades query date range:',
      from ? new Date(`${from}T00:00:00.000Z`) : 'no from',
      to ? new Date(`${to}T23:59:59.999Z`) : 'no to',
    );

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
        quiz: { courseId },
        ...(from && to
          ? { createdAt: { gte: new Date(from), lte: new Date(to) } }
          : from
          ? { createdAt: { gte: new Date(from) } }
          : to
          ? { createdAt: { lte: new Date(to) } }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(
      'Quiz scores query date range:',
      from ? new Date(`${from}T00:00:00.000Z`) : 'no from',
      to ? new Date(`${to}T23:59:59.999Z`) : 'no to',
    );

    // Calculate quiz score average
    const quizScore =
      quizScores.length > 0
        ? quizScores.reduce((sum, score) => sum + score.totalGrade, 0) /
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
