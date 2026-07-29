const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { registerNum: '25-UCS-003' },
    update: {
      role: 'ADMIN',
      status: 'APPROVED'
    },
    create: {
      registerNum: '25-UCS-003',
      password: 'password123',
      role: 'ADMIN',
      status: 'APPROVED'
    },
  });
  console.log('Admin user seeded:', user);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
