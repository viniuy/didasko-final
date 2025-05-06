import jwt from 'jsonwebtoken';
import axiosInstance from './axios';

export async function getCurrentUser() {
  try {
    const response = await axiosInstance.get('/auth/me');
    return response.data.user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}
