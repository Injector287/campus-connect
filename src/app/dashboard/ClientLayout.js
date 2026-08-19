'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect, Suspense, useRef } from 'react'
import useSWR from 'swr'
import { fetcher } from '@/utils/fetcher'
import dynamic from 'next/dynamic'
import { DndContext, closestCenter, TouchSensor, MouseSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { SortableNavItem } from '@/components/SortableNavItem'

const CalendarPage = dynamic(() => import('@/components/Calendar'))

export default function ClientLayout({ children, initialMobileNav }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [customMobileNav, setCustomMobileNav] = useState(initialMobileNav);
  const [isEditNavMode, setIsEditNavMode] = useState(false);

  const navContainerRef = useRef(null);
  const [activeLinkStyle, setActiveLinkStyle] = useState({ top: 0, height: 0, opacity: 0 });

  useEffect(() => {
    if (!navContainerRef.current) return;
    // Small delay to ensure layout is done
    const timeoutId = setTimeout(() => {
        const activeLink = navContainerRef.current?.querySelector('a[data-active="true"]');
        if (activeLink) {
            setActiveLinkStyle({
                top: activeLink.offsetTop,
                height: activeLink.offsetHeight,
                opacity: 1,
            });
        }
    }, 50);
    return () => clearTimeout(timeoutId);
  }, [pathname]);

  // Sync localStorage just in case, and listen for client-side modifications
  useEffect(() => {
    localStorage.setItem('erp_mobile_nav', JSON.stringify(customMobileNav));
  }, [customMobileNav]);

  const syncNavToDB = (navArray) => {
      fetch('/api/profile/nav', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobileNav: navArray })
      }).catch(() => {});
  };

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } })
  );

  const handleNavChange = (href, isAdding) => {
      if (isAdding) {
          if (customMobileNav.length >= 4) {
              if (navigator.vibrate) navigator.vibrate(50);
              return;
          }
          const newNav = [...customMobileNav, href];
          setCustomMobileNav(newNav);
          localStorage.setItem('erp_mobile_nav', JSON.stringify(newNav));
          syncNavToDB(newNav);
      } else {
          if (customMobileNav.length <= 2) {
              if (navigator.vibrate) navigator.vibrate(50);
              return;
          }
          const newNav = customMobileNav.filter(item => item !== href);
          setCustomMobileNav(newNav);
          localStorage.setItem('erp_mobile_nav', JSON.stringify(newNav));
          syncNavToDB(newNav);
      }
  };

  const handleDragEnd = (event) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
          setCustomMobileNav((items) => {
              const oldIndex = items.indexOf(active.id);
              const newIndex = items.indexOf(over.id);
              const newItems = arrayMove(items, oldIndex, newIndex);
              localStorage.setItem('erp_mobile_nav', JSON.stringify(newItems));
              syncNavToDB(newItems);
              return newItems;
          });
      }
  };

  // Background prefetch all pages once layout mounts
  useSWR('/api/dashboard', fetcher, { revalidateOnFocus: false });
  useSWR('/api/subjects', fetcher, { revalidateOnFocus: false });
  useSWR('/api/grades', fetcher, { revalidateOnFocus: false });
  useSWR('/api/library', fetcher, { revalidateOnFocus: false });
  useSWR('/api/finance', fetcher, { revalidateOnFocus: false });
  const { data: profile } = useSWR('/api/profile', fetcher, { revalidateOnFocus: false });

  // Sync DB navigation preference to local state when profile updates in background
  useEffect(() => {
    if (profile && profile.mobileNav) {
      try {
        const dbNav = JSON.parse(profile.mobileNav);
        if (dbNav && Array.isArray(dbNav)) {
          // If server fetched a newer state than we have, adopt it
          if (JSON.stringify(dbNav) !== JSON.stringify(customMobileNav)) {
             setCustomMobileNav(dbNav);
             localStorage.setItem('erp_mobile_nav', profile.mobileNav);
          }
        }
      } catch (e) {}
    }
  }, [profile]);
  
  const isAdmin = profile?.role === 'ADMIN';

  // Close drawer on path change
  useEffect(() => {
      setTimeout(() => {
          setIsMobileMenuOpen(false);
          setIsEditNavMode(false);
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
  
  const navGroups = [
    {
      title: 'Overview',
      items: [
        { href: '/dashboard', label: 'Home', icon: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></> },
      ]
    },
    {
      title: 'Academics',
      items: [
        { href: '/dashboard/attendance', label: 'Attendance', icon: <><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></> },
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
        ...(isAdmin ? [{ href: '/admin', label: 'Admin Panel', icon: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></> }] : [])
      ]
    },
    {
      title: 'Personal',
      items: [
        { href: '/dashboard/profile', label: 'Profile', icon: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></> },
        { href: '/dashboard/suggestions', label: 'Suggestions', icon: <><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></> }
      ]
    }
  ];

  const mobilePrimaryNav = [
    { href: '/dashboard', label: 'Home', icon: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></> },
    { href: '/dashboard/calendar', label: 'Calendar', icon: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></> },
    { href: '/dashboard/profile', label: 'Profile', icon: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></> }
  ];

  // Helper to get item details
  const getNavItem = (href) => {
      if (href === '/dashboard') return mobilePrimaryNav[0]; // Prefer Home icon
      
      for (const group of navGroups) {
          const found = group.items.find(item => item.href === href);
          if (found) return found;
      }
      return null;
  };

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
        <style>{`
          .desktop-only::-webkit-scrollbar { display: none; }
        `}</style>
        <div style={{ marginBottom: '1rem', paddingLeft: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
           <h2 className="text-gradient" style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.5px', margin: 0 }}>Flow</h2>
        </div>
        
        <div ref={navContainerRef} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative' }}>
            {activeLinkStyle.opacity > 0 && (
                <div style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: 0,
                    height: activeLinkStyle.height,
                    background: 'var(--primary)',
                    borderRadius: '12px',
                    transform: `translateY(${activeLinkStyle.top}px)`,
                    transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), height 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
                    opacity: activeLinkStyle.opacity,
                    zIndex: 0,
                    pointerEvents: 'none'
                }} />
            )}
            {navGroups.map((group, idx) => (
                <div key={idx}>
                    <h3 style={{ 
                        fontSize: '0.75rem', 
                        textTransform: 'uppercase', 
                        letterSpacing: '1px', 
                        color: 'rgba(255,255,255,0.4)', 
                        margin: '0 0 0.25rem 1rem',
                        fontWeight: '600'
                    }}>
                        {group.title}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        {group.items.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link key={item.href} href={item.href} data-active={isActive} onMouseEnter={() => router.prefetch(item.href)} onTouchStart={() => router.prefetch(item.href)} onClick={() => {
                                    if (pathname === '/dashboard') sessionStorage.setItem('calendarScrollPos', window.scrollY.toString());
                                }} style={{ 
                                    display: 'flex', alignItems: 'center', gap: '0.85rem', 
                                    padding: '0.5rem 1rem', borderRadius: '12px',
                                    textDecoration: 'none', 
                                    color: isActive ? 'white' : 'rgba(255,255,255,0.6)',
                                    background: 'transparent',
                                    position: 'relative', zIndex: 1,
                                    transition: 'color 0.3s ease',
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
                transition: 'transform 0.2s ease, opacity 0.2s ease, background-color 0.2s ease, border-color 0.2s ease',
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
        <div style={{ display: pathname === '/dashboard/calendar' ? 'block' : 'none' }}>
            <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>Loading calendar...</div>}>
                <CalendarPage />
            </Suspense>
        </div>
        <div style={{ display: pathname === '/dashboard/calendar' ? 'none' : 'block' }}>
            <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>Loading...</div>}>
                {children}
            </Suspense>
        </div>
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
              transform: isMobileMenuOpen ? 'translateY(0) translateZ(0)' : 'translateY(100%) translateZ(0)',
              willChange: 'transform',
              transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column'
          }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 1.5rem 1rem 1.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'white', fontWeight: 'bold' }}>
                      {isEditNavMode ? 'Edit Navigation' : 'Menu'}
                  </h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => setIsEditNavMode(!isEditNavMode)} style={{ background: isEditNavMode ? 'var(--primary)' : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', transition: 'transform 0.2s ease, opacity 0.2s ease, background-color 0.2s ease, border-color 0.2s ease' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                          </svg>
                      </button>
                      <button onClick={() => { setIsMobileMenuOpen(false); setIsEditNavMode(false); }} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                  </div>
              </div>

              <div style={{ padding: '0 1.5rem', overflowY: 'auto', flex: 1, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  <style>{`
                      .mobile-only div::-webkit-scrollbar { display: none; }
                  `}</style>
                  {!isEditNavMode ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '1.5rem' }}>
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
                                              <Link key={item.href} href={item.href} onMouseEnter={() => router.prefetch(item.href)} onTouchStart={() => router.prefetch(item.href)} onClick={() => {
                                                  if (pathname === '/dashboard') sessionStorage.setItem('calendarScrollPos', window.scrollY.toString());
                                                  setIsMobileMenuOpen(false);
                                              }} style={{ 
                                                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', 
                                                  padding: '1rem', borderRadius: '16px',
                                                  textDecoration: 'none', 
                                                  color: isActive ? 'white' : 'rgba(255,255,255,0.8)',
                                                  background: isActive ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                                  transition: 'transform 0.2s ease, opacity 0.2s ease, background-color 0.2s ease, border-color 0.2s ease',
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
                  ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '2rem' }}>
                          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', margin: '-0.5rem 0 0 0' }}>
                              Select 2 to 4 items for quick access. Drag (≡) to reorder active items.
                          </p>
                          
                          {/* ACTIVE ITEMS (Draggable) */}
                          <div>
                              <h4 style={{ 
                                  fontSize: '0.75rem', 
                                  textTransform: 'uppercase', 
                                  letterSpacing: '1px', 
                                  color: 'rgba(255,255,255,0.4)', 
                                  margin: '0 0 1rem 0',
                                  fontWeight: '600'
                              }}>
                                  Active Quick Access
                              </h4>
                              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                  <SortableContext items={customMobileNav} strategy={verticalListSortingStrategy}>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                          {customMobileNav.map((href) => {
                                              const item = getNavItem(href);
                                              if (!item) return null;
                                              const icon = href === '/dashboard' ? mobilePrimaryNav[0].icon : item.icon;
                                              const label = href === '/dashboard' ? 'Home' : item.label;
                                              
                                              return (
                                                  <SortableNavItem 
                                                      key={href} 
                                                      id={href} 
                                                      item={{ ...item, icon, label }} 
                                                      onRemove={(id) => handleNavChange(id, false)} 
                                                      atMin={customMobileNav.length <= 2}
                                                  />
                                              );
                                          })}
                                      </div>
                                  </SortableContext>
                              </DndContext>
                          </div>

                          {/* AVAILABLE ITEMS */}
                          <div>
                              <h4 style={{ 
                                  fontSize: '0.75rem', 
                                  textTransform: 'uppercase', 
                                  letterSpacing: '1px', 
                                  color: 'rgba(255,255,255,0.4)', 
                                  margin: '0 0 1rem 0',
                                  fontWeight: '600'
                              }}>
                                  Available Items
                              </h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                  {navGroups.map((group) => {
                                      return group.items.map((item) => {
                                          if (customMobileNav.includes(item.href)) return null;
                                          
                                          const atMax = customMobileNav.length >= 4;
                                          
                                          return (
                                              <div key={item.href} style={{ 
                                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                  padding: '0.75rem 1rem', borderRadius: '12px',
                                                  background: 'rgba(0,0,0,0.2)',
                                                  border: '1px solid rgba(255,255,255,0.02)'
                                              }}>
                                                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'rgba(255,255,255,0.6)' }}>
                                                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                          {item.href === '/dashboard' ? mobilePrimaryNav[0].icon : item.icon}
                                                      </svg>
                                                      <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                                                          {item.href === '/dashboard' ? 'Home' : item.label}
                                                      </span>
                                                  </div>
                                                  
                                                  <button 
                                                      onClick={() => !atMax && handleNavChange(item.href, true)}
                                                      style={{
                                                          background: atMax ? 'rgba(255,255,255,0.1)' : 'rgba(74, 222, 128, 0.2)',
                                                          color: atMax ? 'rgba(255,255,255,0.3)' : '#4ade80',
                                                          border: 'none',
                                                          borderRadius: '8px',
                                                          padding: '0.5rem',
                                                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                          cursor: atMax ? 'not-allowed' : 'pointer',
                                                          transition: 'transform 0.2s ease, opacity 0.2s ease, background-color 0.2s ease, border-color 0.2s ease',
                                                          opacity: atMax ? 0.5 : 1
                                                      }}
                                                  >
                                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                                  </button>
                                              </div>
                                          );
                                      });
                                  })}
                              </div>
                          </div>
                      </div>
                  )}
              </div>

              {/* Fixed Footer */}
              <div style={{ padding: '1rem 1.5rem 2rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(15, 23, 42, 0.95)' }}>
                  {!isEditNavMode ? (
                      <button onClick={handleLogout} style={{ 
                          background: 'rgba(239, 68, 68, 0.1)', 
                          border: '1px solid rgba(239, 68, 68, 0.3)', 
                          color: '#ef4444', 
                          padding: '0.75rem 2rem', 
                          borderRadius: '999px',
                          cursor: 'pointer', 
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          transition: 'transform 0.2s ease, opacity 0.2s ease, background-color 0.2s ease, border-color 0.2s ease',
                          width: '100%'
                      }}>
                          Logout
                      </button>
                  ) : (
                      <button onClick={() => setIsEditNavMode(false)} style={{
                          width: '100%', padding: '0.85rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '999px', fontWeight: '600', cursor: 'pointer'
                      }}>
                          Done Editing
                      </button>
                  )}
              </div>
          </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-only" suppressHydrationWarning style={{
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
        {customMobileNav.map((href) => {
            const item = getNavItem(href);
            if (!item) return null;
            const isActive = pathname === item.href && !isMobileMenuOpen;
            return (
                <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)} style={{ 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', 
                    textDecoration: 'none', 
                    color: isActive ? 'var(--primary)' : 'rgba(255,255,255,0.5)',
                    transition: 'transform 0.2s ease, opacity 0.2s ease, background-color 0.2s ease, border-color 0.2s ease',
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
            transition: 'transform 0.2s ease, opacity 0.2s ease, background-color 0.2s ease, border-color 0.2s ease',
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
