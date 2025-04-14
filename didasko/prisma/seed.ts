import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@example.com',
      department: 'Administration',
      workType: 'FULL_TIME',
      role: 'ADMIN',
      permission: 'GRANTED',
    },
  });

  // Create faculty user
  await prisma.user.upsert({
    where: { email: 'faculty@example.com' },
    update: {},
    create: {
      name: 'Faculty User',
      email: 'faculty@example.com',
      department: 'Computer Science',
      workType: 'FULL_TIME',
      role: 'FACULTY',
      permission: 'GRANTED',
    },
  });

  // Create academic head user
  await prisma.user.upsert({
    where: { email: 'academic@example.com' },
    update: {},
    create: {
      name: 'Academic Head User',
      email: 'academic@example.com',
      department: 'Computer Science',
      workType: 'FULL_TIME',
      role: 'ACADEMIC_HEAD',
      permission: 'GRANTED',
    },
  });

  console.log('Database has been seeded. 🌱');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
