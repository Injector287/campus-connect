const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.user.updateMany({ where: { status: 'ACTIVE' }, data: { status: 'APPROVED' } });
  await prisma.user.updateMany({ where: { status: 'WHITELISTED' }, data: { status: 'APPROVED' } });
  await prisma.user.updateMany({ where: { status: 'BLACKLISTED' }, data: { status: 'BANNED' } });
  console.log('Done');
}
main();
