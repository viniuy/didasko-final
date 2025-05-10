import axiosInstance from '@/lib/axios';
import { User, UserCreateInput } from '@/types/user';

export const userService = {
  // Get all users with optional filters
  getAll: async (params?: {
    search?: string;
    role?: string;
    department?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await axiosInstance.get('/users', { params });
    return response.data;
  },

  // Get a single user by ID
  getById: async (id: string) => {
    const response = await axiosInstance.get(`/users/${id}`);
    return response.data;
  },

  // Get a user by email
  getByEmail: async (email: string) => {
    const response = await axiosInstance.get('/users', { params: { email } });
    return response.data;
  },

  // Create a new user
  create: async (data: UserCreateInput) => {
    const response = await axiosInstance.post('/users', data);
    return response.data;
  },

  // Update a user
  update: async (id: string, data: Partial<UserCreateInput>) => {
    const response = await axiosInstance.put(`/users/${id}`, data);
    return response.data;
  },

  // Delete a user
  delete: async (id: string) => {
    const response = await axiosInstance.delete(`/users/${id}`);
    return response.data;
  },

  // Import users
  import: async (users: UserCreateInput[]) => {
    const response = await axiosInstance.post('/users/import', { users });
    return response.data;
  },
};
