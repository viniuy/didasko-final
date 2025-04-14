import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'epickiller312873@gmail.com';
  const name = 'Epic Killer';

  // Create admin user
  await prisma.user.upsert({
    where: { email },
    update: {
      role: 'ADMIN',
      permission: 'GRANTED',
    },
    create: {
      name,
      email,
      department: 'Administration',
      workType: 'FULL_TIME',
      role: 'ADMIN',
      permission: 'GRANTED',
    },
  });

  console.log(`User ${email} has been added as an admin. 🌱`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
