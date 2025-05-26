import { prisma } from '@/lib/db';

const formatTime12Hour = (time: string) => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${period}`;
};

export async function getCoursesData() {
  const [courses, facultyUsers] = await Promise.all([
    prisma.course.findMany({
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
    }),
    prisma.user.findMany({
      where: { role: 'FACULTY' },
      select: {
        id: true,
        name: true,
      },
    }),
  ]);

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
      date: course.schedules[0]?.day || '',
      day: course.schedules[0]?.day || '',
      time: course.schedules[0]
        ? `${formatTime12Hour(
            course.schedules[0].fromTime,
          )} - ${formatTime12Hour(course.schedules[0].toTime)}`
        : '',
      numberOfStudents: course.students.length,
      facultyId: course.faculty?.id || '',
      facultyName: course.faculty?.name || 'Unassigned',
      status: course.status,
      academicYear: course.academicYear,
      section: course.section,
      slug: course.slug,
    })),
    facultyUsers,
    totalCourses,
    activeCourses,
    totalStudents,
    totalFaculty,
  };
}
