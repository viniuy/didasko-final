import axiosInstance from '@/lib/axios';
import { Attendance, AttendanceCreateInput } from '@/types/attendance';

export const attendanceService = {
  // Get all attendance records with optional filters
  getAll: async (params?: {
    courseId?: string;
    studentId?: string;
    date?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await axiosInstance.get('/attendance', { params });
    return response.data;
  },

  // Get attendance stats for a course
  getStats: async (courseId: string) => {
    const response = await axiosInstance.get(`/attendance/stats/${courseId}`);
    return response.data;
  },

  // Create a new attendance record
  create: async (data: AttendanceCreateInput) => {
    const response = await axiosInstance.post('/attendance', data);
    return response.data;
  },

  // Update an attendance record
  update: async (id: string, data: Partial<AttendanceCreateInput>) => {
    const response = await axiosInstance.put(`/attendance/${id}`, data);
    return response.data;
  },

  // Delete an attendance record
  delete: async (id: string) => {
    const response = await axiosInstance.delete(`/attendance/${id}`);
    return response.data;
  },

  // Bulk create attendance records
  bulkCreate: async (records: AttendanceCreateInput[]) => {
    const response = await axiosInstance.post('/attendance/bulk', { records });
    return response.data;
  },
};
