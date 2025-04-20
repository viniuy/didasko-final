import { PrismaClient } from '@prisma/client';
import { Role, Permission, WorkType } from '../src/lib/types';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'epickiller312873@gmail.com' },
    update: {},
    create: {
      name: 'Vincent Dizon',
      email: 'epickiller312873@gmail.com',
      department: 'Administration',
      workType: WorkType.FULL_TIME,
      role: Role.ADMIN,
      permission: Permission.GRANTED,
    },
  });

  // Create faculty user
  const faculty = await prisma.user.upsert({
    where: { email: 'faculty@didasko.com' },
    update: {},
    create: {
      name: 'Faculty User',
      email: 'faculty@didasko.com',
      department: 'Computer Science',
      workType: WorkType.FULL_TIME,
      role: Role.FACULTY,
      permission: Permission.GRANTED,
    },
  });

  // Create academic head user
  const academicHead = await prisma.user.upsert({
    where: { email: 'vincent.enolpe@gmail.com' },
    update: {},
    create: {
      name: 'Lauraine Savannah',
      email: 'vincent.enolpe@gmail.com',
      department: 'Computer Science',
      workType: WorkType.FULL_TIME,
      role: Role.ACADEMIC_HEAD,
      permission: Permission.GRANTED,
    },
  });

  console.log({ admin, faculty, academicHead });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
