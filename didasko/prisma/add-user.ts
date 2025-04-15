import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
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
