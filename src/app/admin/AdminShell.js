'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect, Suspense } from 'react'

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close drawer on path change
  useEffect(() => {
      setTimeout(() => {
          setIsMobileMenuOpen(false);
      }, 0);
  }, [pathname]);

  const handleLogout = async () => {
      try {
          await fetch('/api/logout', { method: 'POST' });
      } catch (e) {}
      localStorage.removeItem('erp_sessions');
      import('@/utils/fetchWithCache').then(m => m.clearCache());
      router.push('/');
  };
  
  const navItems = [
    { href: '/admin/health', label: 'Engine Health', icon: <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></> },
    { href: '/admin/users', label: 'User Management', icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></> },
    { href: '/admin/rate-limit', label: 'Rate Limiting', icon: <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></> },
    { href: '/admin/announcements', label: 'Announcements', icon: <><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"></path></> },
    { href: '/admin/suggestions', label: 'Suggestions', icon: <><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></> }
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
        padding: '1.5rem 1rem',
        zIndex: 50,
        overflowY: 'auto',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        <div style={{ marginBottom: '1.5rem', paddingLeft: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
           <h2 className="text-gradient" style={{ fontSize: '1.5rem', margin: 0 }}>ERP Admin</h2>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
                <h3 style={{ 
                    fontSize: '0.75rem', 
                    textTransform: 'uppercase', 
                    letterSpacing: '1px', 
                    color: 'rgba(255,255,255,0.4)', 
                    margin: '0 0 0.5rem 1rem',
                    fontWeight: '600'
                }}>
                    System Controls
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.href} href={item.href} style={{ 
                                display: 'flex', alignItems: 'center', gap: '0.85rem', 
                                padding: '0.65rem 1rem', borderRadius: '12px',
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
            
            <div>
                <h3 style={{ 
                    fontSize: '0.75rem', 
                    textTransform: 'uppercase', 
                    letterSpacing: '1px', 
                    color: 'rgba(255,255,255,0.4)', 
                    margin: '0 0 0.5rem 1rem',
                    fontWeight: '600'
                }}>
                    User App
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <Link href="/dashboard" style={{ 
                        display: 'flex', alignItems: 'center', gap: '0.85rem', 
                        padding: '0.65rem 1rem', borderRadius: '12px',
                        textDecoration: 'none', 
                        color: 'rgba(255,255,255,0.6)',
                        background: 'transparent',
                        transition: 'all 0.2s ease',
                        fontWeight: '500'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'white'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>
                        </svg>
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
        
        <div style={{ marginTop: 'auto', paddingTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
            <button onClick={handleLogout} style={{ 
                background: 'rgba(239, 68, 68, 0.1)', 
                border: '1px solid rgba(239, 68, 68, 0.3)', 
                color: '#ef4444', 
                padding: '0.65rem 2rem', 
                borderRadius: '999px',
                cursor: 'pointer', 
                fontSize: '0.875rem',
                fontWeight: '600',
                transition: 'all 0.2s ease',
                width: 'calc(100% - 2rem)'
            }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'; }}
            >
              Logout
            </button>
        </div>
      </nav>

      {/* Page Content */}
      <div className="layout-content" style={{ paddingBottom: '80px', width: '100%' }}>
         <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>Loading admin...</div>}>
            {children}
         </Suspense>
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
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'white', fontWeight: 'bold' }}>
                      Admin Menu
                  </h3>
                  <button onClick={() => { setIsMobileMenuOpen(false); }} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '2rem' }}>
                  <div>
                      <h4 style={{ 
                          fontSize: '0.75rem', 
                          textTransform: 'uppercase', 
                          letterSpacing: '1px', 
                          color: 'rgba(255,255,255,0.4)', 
                          margin: '0 0 1rem 0',
                          fontWeight: '600'
                      }}>
                          System Controls
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                          {navItems.map((item) => {
                              const isActive = pathname === item.href;
                              return (
                                  <Link key={item.href} href={item.href} onClick={() => {
                                      setIsMobileMenuOpen(false);
                                  }} style={{ 
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
                          <Link href="/dashboard" onClick={() => {
                                setIsMobileMenuOpen(false);
                            }} style={{ 
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', 
                                padding: '1rem', borderRadius: '16px',
                                textDecoration: 'none', 
                                color: 'rgba(255,255,255,0.8)',
                                background: 'rgba(255,255,255,0.05)',
                                transition: 'all 0.2s ease',
                                textAlign: 'center'
                            }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>
                                </svg>
                                <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>Dashboard</span>
                          </Link>
                      </div>
                  </div>
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
                  <button onClick={handleLogout} style={{ 
                      background: 'rgba(239, 68, 68, 0.1)', 
                      border: '1px solid rgba(239, 68, 68, 0.3)', 
                      color: '#ef4444', 
                      padding: '0.75rem 2rem', 
                      borderRadius: '999px',
                      cursor: 'pointer', 
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      transition: 'all 0.2s ease',
                      width: '100%'
                  }}>
                    Logout
                  </button>
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
        {navItems.slice(0,3).map((item) => {
            const isActive = pathname === item.href && !isMobileMenuOpen;
            return (
                <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)} style={{ 
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
            <span style={{ fontSize: '0.7rem', marginTop: '4px', fontWeight: '500' }}>More</span>
        </button>
      </nav>
    </div>
  )
}
