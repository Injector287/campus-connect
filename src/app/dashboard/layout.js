import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import ClientLayout from './ClientLayout';

export default async function DashboardLayout({ children }) {
    const cookieStore = await cookies();
    const registerNum = cookieStore.get('ERP_USERNAME')?.value;
    
    let initialMobileNav = ['/dashboard', '/dashboard/calendar', '/dashboard/profile'];
    
    if (registerNum) {
        try {
            const user = await db.user.findUnique({ 
                where: { registerNum }, 
                select: { mobileNav: true } 
            });
            
            if (user?.mobileNav) {
                const parsed = JSON.parse(user.mobileNav);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    initialMobileNav = parsed;
                }
            }
        } catch (error) {
            console.error('[Dashboard Layout] Failed to fetch mobile nav:', error);
        }
    }
    
    return <ClientLayout initialMobileNav={initialMobileNav}>{children}</ClientLayout>;
}
