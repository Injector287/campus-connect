import { redirect } from 'next/navigation';
import { checkAdmin } from '@/utils/adminAuth';
import AdminShell from './AdminShell';

export default async function AdminLayout({ children }) {
  const admin = await checkAdmin();

  if (!admin) {
    redirect('/'); // Redirect non-admins to home or login
  }

  return <AdminShell>{children}</AdminShell>;
}
