import { cookies } from 'next/headers';
import { db as prisma } from '@/lib/db';
import { normalizeUsername } from '@/utils/auth';

export async function checkAdmin() {
  const cookieStore = await cookies();
  const username = normalizeUsername(cookieStore.get('ERP_USERNAME')?.value);

  if (!username) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { registerNum: username },
  });

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return user;
}
