import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admin_email = 'epickiller312873@gmail.com';
  const admin_name = 'Epic Killer';

  // Create admin user
  await prisma.user.upsert({
    where: { email: admin_email },
    update: {
      role: 'ADMIN',
      permission: 'GRANTED',
    },
    create: {
      name: admin_name,
      email: admin_email,
      department: 'Administration',
      workType: 'FULL_TIME',
      role: 'ADMIN',
      permission: 'GRANTED',
    },
  });

  const email = 'vincent.enolpe@gmail.com';
  const name = 'Epic Killer'; // You can change this name if you'd like

  // Create academic head user
  await prisma.user.upsert({
    where: { email },
    update: {
      role: 'ACADEMIC_HEAD',
      permission: 'GRANTED',
    },
    create: {
      name,
      email,
      department: 'Computer Science',
      workType: 'FULL_TIME',
      role: 'ACADEMIC_HEAD',
      permission: 'GRANTED',
    },
  });

  console.log(`User ${admin_email} has been added as an admin. 🌱`);
  console.log(`User ${email} has been added as an academic head. 🌱`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
