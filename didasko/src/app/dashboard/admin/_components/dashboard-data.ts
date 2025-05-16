import axiosInstance from '@/lib/axios';

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

const fetchDashboardData = async () => {
  const [
    studentsCount,
    teachersCount,
    coursesCount,
    attendanceCount,
    recentActivity,
  ] = await Promise.all([
    axiosInstance.get('/api/students/count').then((res) => res.data),
    axiosInstance.get('/api/teachers/count').then((res) => res.data),
    axiosInstance.get('/api/courses/count').then((res) => res.data),
    axiosInstance.get('/api/attendance/count').then((res) => res.data),
    axiosInstance.get('/api/activity/recent').then((res) => res.data),
  ]);

  return {
    totalStudents: studentsCount,
    totalTeachers: teachersCount,
    totalCourses: coursesCount,
    totalAttendance: attendanceCount,
    recentActivity,
  };
};

export async function getDashboardData(): Promise<DashboardData> {
  return fetchDashboardData();
}
