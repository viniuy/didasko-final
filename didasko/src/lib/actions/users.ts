'use server';

import { prisma } from '@/lib/db';
import { Permission, Role } from '@prisma/client';
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
