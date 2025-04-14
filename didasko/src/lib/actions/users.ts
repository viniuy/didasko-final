'use server';

import { prisma } from '@/lib/db';
import { Permission, Role, WorkType } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function updateUserPermission(
  userId: string,
  permission: Permission,
) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { permission },
    });
    revalidatePath('/dashboard/admin');
    return { success: true };
  } catch (error) {
    console.error('Error updating user permission:', error);
    return { success: false, error: 'Failed to update user permission' };
  }
}

export async function updateUserRole(userId: string, role: Role) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role },
    });
    revalidatePath('/dashboard/admin');
    return { success: true };
  } catch (error) {
    console.error('Error updating user role:', error);
    return { success: false, error: 'Failed to update user role' };
  }
}

interface AddUserParams {
  name: string;
  email: string;
  department: string;
  workType: WorkType;
  permission: Permission;
  role: Role;
}

export async function addUser(userData: AddUserParams) {
  try {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      return { success: false, error: 'Email already exists' };
    }

    // Create the user
    await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        department: userData.department,
        workType: userData.workType,
        permission: userData.permission,
        role: userData.role,
      },
    });

    revalidatePath('/dashboard/admin');
    return { success: true };
  } catch (error) {
    console.error('Error adding user:', error);
    return { success: false, error: 'Failed to add user' };
  }
}
