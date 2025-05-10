import axiosInstance from '@/lib/axios';
import { Course, CourseCreateInput } from '@/types/course';

export const courseService = {
  // Get all courses with optional filters
  getAll: async (params?: {
    facultyId?: string;
    search?: string;
    department?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await axiosInstance.get('/courses', { params });
    return response.data;
  },

  // Get a single course by ID
  getById: async (id: string) => {
    const response = await axiosInstance.get(`/courses/${id}`);
    return response.data;
  },

  // Create a new course
  create: async (data: CourseCreateInput) => {
    const response = await axiosInstance.post('/courses', data);
    return response.data;
  },

  // Update a course
  update: async (id: string, data: Partial<CourseCreateInput>) => {
    const response = await axiosInstance.put(`/courses/${id}`, data);
    return response.data;
  },

  // Delete a course
  delete: async (id: string) => {
    const response = await axiosInstance.delete(`/courses/${id}`);
    return response.data;
  },

  // Get course schedules
  getSchedules: async (courseId: string) => {
    const response = await axiosInstance.get(`/courses/${courseId}/schedules`);
    return response.data;
  },

  // Get course attendance stats
  getAttendanceStats: async (courseId: string) => {
    const response = await axiosInstance.get(
      `/courses/${courseId}/attendance/stats`,
    );
    return response.data;
  },
};
