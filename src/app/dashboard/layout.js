'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close drawer on path change
  useEffect(() => {
      setIsMobileMenuOpen(false);
  }, [pathname]);
  
  const navGroups = [
    {
      title: 'Academics',
      items: [
        { href: '/dashboard', label: 'Attendance', icon: <><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></> },
        { href: '/dashboard/subjects', label: 'Subjects', icon: <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path> },
        { href: '/dashboard/grades', label: 'Grades', icon: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></> },
        { href: '/dashboard/calendar', label: 'Calendar', icon: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></> }
      ]
    },
    {
      title: 'Administration',
      items: [
        { href: '/dashboard/library', label: 'Library', icon: <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></> },
        { href: '/dashboard/finance', label: 'Finance', icon: <><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></> },
        { href: '/dashboard/leaves', label: 'Leaves', icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></> },
      ]
    },
    {
      title: 'Personal',
      items: [
        { href: '/dashboard/profile', label: 'Profile', icon: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></> }
      ]
    }
  ];

  const mobilePrimaryNav = [
    { href: '/dashboard', label: 'Home', icon: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></> },
    { href: '/dashboard/calendar', label: 'Calendar', icon: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></> },
    { href: '/dashboard/profile', label: 'Profile', icon: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></> }
  ];

  return (
    <div className="layout-wrapper" style={{ position: 'relative' }}>
      
      {/* Desktop Sidebar */}
      <nav className="desktop-only" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: '250px',
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        flexDirection: 'column',
        padding: '2rem 1rem',
        zIndex: 50,
        overflowY: 'auto'
      }}>
        <div style={{ marginBottom: '2.5rem', paddingLeft: '1rem' }}>
           <h2 className="text-gradient" style={{ fontSize: '1.5rem', margin: 0 }}>Loyola ERP</h2>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {navGroups.map((group, idx) => (
                <div key={idx}>
                    <h3 style={{ 
                        fontSize: '0.75rem', 
                        textTransform: 'uppercase', 
                        letterSpacing: '1px', 
                        color: 'rgba(255,255,255,0.4)', 
                        margin: '0 0 0.75rem 1rem',
                        fontWeight: '600'
                    }}>
                        {group.title}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        {group.items.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link key={item.href} href={item.href} style={{ 
                                    display: 'flex', alignItems: 'center', gap: '1rem', 
                                    padding: '0.85rem 1rem', borderRadius: '12px',
                                    textDecoration: 'none', 
                                    color: isActive ? 'white' : 'rgba(255,255,255,0.6)',
                                    background: isActive ? 'var(--primary)' : 'transparent',
                                    transition: 'all 0.2s ease',
                                    fontWeight: isActive ? '600' : '500'
                                }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        {item.icon}
                                    </svg>
                                    {item.label}
                                </Link>
                            )
                        })}
                    </div>
                </div>
            ))}
        </div>
      </nav>

      {/* Page Content */}
      <div className="layout-content" style={{ paddingBottom: '80px', width: '100%' }}>
        {children}
      </div>

      {/* Mobile Drawer (Overlay) */}
      <div className="mobile-only" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 100,
          opacity: isMobileMenuOpen ? 1 : 0,
          pointerEvents: isMobileMenuOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease'
      }} onClick={() => setIsMobileMenuOpen(false)}>
          <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              padding: '2rem 1.5rem',
              transform: isMobileMenuOpen ? 'translateY(0)' : 'translateY(100%)',
              transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              maxHeight: '85vh',
              overflowY: 'auto'
          }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'white', fontWeight: 'bold' }}>Menu</h3>
                  <button onClick={() => setIsMobileMenuOpen(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '2rem' }}>
                {navGroups.map((group, idx) => (
                    <div key={idx}>
                        <h4 style={{ 
                            fontSize: '0.75rem', 
                            textTransform: 'uppercase', 
                            letterSpacing: '1px', 
                            color: 'rgba(255,255,255,0.4)', 
                            margin: '0 0 1rem 0',
                            fontWeight: '600'
                        }}>
                            {group.title}
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                            {group.items.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)} style={{ 
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', 
                                        padding: '1rem', borderRadius: '16px',
                                        textDecoration: 'none', 
                                        color: isActive ? 'white' : 'rgba(255,255,255,0.8)',
                                        background: isActive ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                        transition: 'all 0.2s ease',
                                        textAlign: 'center'
                                    }}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            {item.icon}
                                        </svg>
                                        <span style={{ fontSize: '0.85rem', fontWeight: isActive ? '600' : '500' }}>{item.label}</span>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                ))}
              </div>
          </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-only" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '70px',
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '0 0.5rem',
        zIndex: 90
      }}>
        {mobilePrimaryNav.map((item) => {
            const isActive = pathname === item.href && !isMobileMenuOpen;
            return (
                <Link key={item.href} href={item.href} style={{ 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', 
                    textDecoration: 'none', 
                    color: isActive ? 'var(--primary)' : 'rgba(255,255,255,0.5)',
                    transition: 'all 0.2s ease',
                    flex: 1
                }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {item.icon}
                    </svg>
                    <span style={{ fontSize: '0.7rem', marginTop: '4px', fontWeight: '500' }}>{item.label}</span>
                </Link>
            )
        })}
        {/* Menu Toggle Button */}
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} style={{ 
            display: 'flex', flexDirection: 'column', alignItems: 'center', 
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: isMobileMenuOpen ? 'white' : 'rgba(255,255,255,0.5)',
            transition: 'all 0.2s ease',
            flex: 1
        }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
            <span style={{ fontSize: '0.7rem', marginTop: '4px', fontWeight: '500' }}>Menu</span>
        </button>
      </nav>
    </div>
  )
}
