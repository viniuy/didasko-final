import { prisma } from '@/lib/db';

export async function getCoursesData() {
  const courses = await prisma.course.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      faculty: {
        select: {
          id: true,
          name: true,
        },
      },
      schedules: {
        select: {
          day: true,
          fromTime: true,
          toTime: true,
        },
      },
      students: {
        select: {
          id: true,
        },
      },
    },
  });

  const totalCourses = await prisma.course.count();
  const activeCourses = await prisma.course.count({
    where: { status: 'ACTIVE' },
  });
  const totalStudents = await prisma.student.count();
  const totalFaculty = await prisma.user.count({
    where: { role: 'FACULTY' },
  });

  return {
    courses: courses.map((course) => ({
      id: course.id,
      courseCode: course.code,
      courseTitle: course.title,
      semester: course.semester,
      room: course.room,
      date: course.schedules[0]?.day.toISOString().split('T')[0] || '',
      time: course.schedules[0]
        ? `${course.schedules[0].fromTime} - ${course.schedules[0].toTime}`
        : '',
      numberOfStudents: course.students.length,
      facultyId: course.faculty?.id || '',
      facultyName: course.faculty?.name || 'Unassigned',
      status: course.status,
      academicYear: course.academicYear,
      section: course.section,
      slug: course.slug,
    })),
    totalCourses,
    activeCourses,
    totalStudents,
    totalFaculty,
  };
}
