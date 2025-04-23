export interface DashboardData {
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  totalAttendance: number;
  recentActivity: {
    id: string;
    type: 'attendance' | 'course' | 'user';
    description: string;
    timestamp: string;
  }[];
}

export async function getDashboardData(): Promise<DashboardData> {
  // Fetch data from your API endpoints
  const [
    studentsCount,
    teachersCount,
    coursesCount,
    attendanceCount,
    activity,
  ] = await Promise.all([
    fetch('/api/students/count').then((res) => res.json()),
    fetch('/api/teachers/count').then((res) => res.json()),
    fetch('/api/courses/count').then((res) => res.json()),
    fetch('/api/attendance/count').then((res) => res.json()),
    fetch('/api/activity/recent').then((res) => res.json()),
  ]);

  return {
    totalStudents: studentsCount,
    totalTeachers: teachersCount,
    totalCourses: coursesCount,
    totalAttendance: attendanceCount,
    recentActivity: activity,
  };
}
