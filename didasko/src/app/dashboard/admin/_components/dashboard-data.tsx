import { prisma } from '@/lib/db';
import { Permission, Role, WorkType } from '@/lib/types';

export async function getDashboardData() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const fullTimeCount = await prisma.user.count({
    where: { workType: WorkType.FULL_TIME, role: Role.FACULTY },
  });

  const partTimeCount = await prisma.user.count({
    where: { workType: WorkType.PART_TIME, role: Role.FACULTY },
  });

  const grantedCount = await prisma.user.count({
    where: { permission: Permission.GRANTED },
  });

  const deniedCount = await prisma.user.count({
    where: { permission: Permission.DENIED },
  });

  const totalUsers = await prisma.user.count();

  return {
    users,
    fullTimeCount,
    partTimeCount,
    grantedCount,
    deniedCount,
    totalUsers,
  };
}
