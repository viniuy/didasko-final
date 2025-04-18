import jwt from 'jsonwebtoken';

export async function getCurrentUser() {
  try {
    const response = await fetch('/api/auth/me');
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}
