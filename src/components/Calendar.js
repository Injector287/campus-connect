'use client'

import React, { useState, useMemo, useEffect } from 'react';
import calendarData from '../../calendar.json';

export default function CalendarPage() {
    const [todayStr, setTodayStr] = useState('');
    const [showPast, setShowPast] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const topHeaderRef = React.useRef(null);
    const [topHeaderHeight, setTopHeaderHeight] = useState(0);

    useEffect(() => {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        setTodayStr(`${dd}.${mm}.${yyyy}`);
    }, []);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        handleResize(); // Initial check
        window.addEventListener('resize', handleResize);
        
        const observer = new ResizeObserver(() => {
            if (topHeaderRef.current) {
                setTopHeaderHeight(topHeaderRef.current.offsetHeight);
            }
        });
        if (topHeaderRef.current) observer.observe(topHeaderRef.current);

        return () => {
            window.removeEventListener('resize', handleResize);
            observer.disconnect();
        };
    }, []);

    const listData = useMemo(() => {
        if (showPast || !todayStr) return calendarData;
        const todayIdx = calendarData.findIndex(d => d.date === todayStr);
        if (todayIdx === -1) return calendarData;
        
        // Show from today onwards
        return calendarData.slice(todayIdx);
    }, [todayStr, showPast]);

    const months = [
        { label: 'June 2026', value: '06.2026' },
        { label: 'July 2026', value: '07.2026' },
        { label: 'August 2026', value: '08.2026' },
        { label: 'September 2026', value: '09.2026' },
        { label: 'October 2026', value: '10.2026' },
        { label: 'November 2026', value: '11.2026' },
        { label: 'December 2026', value: '12.2026' },
        { label: 'January 2027', value: '01.2027' },
        { label: 'February 2027', value: '02.2027' },
        { label: 'March 2027', value: '03.2027' },
        { label: 'April 2027', value: '04.2027' },
        { label: 'May 2027', value: '05.2027' },
    ];

    return (
        <div className="animate-slide-up" style={{ paddingTop: isMobile ? '0.5rem' : '2rem', paddingRight: isMobile ? '0.5rem' : '2rem', paddingLeft: isMobile ? '0.5rem' : '2rem', paddingBottom: '6rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div ref={topHeaderRef} style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                marginBottom: '0',
                position: 'sticky',
                top: '0',
                zIndex: 20,
                background: 'rgba(15, 23, 42, 0.95)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                padding: '1rem',
                borderTopLeftRadius: '16px',
                borderTopRightRadius: '16px',
                borderBottomLeftRadius: '0',
                borderBottomRightRadius: '0',
                border: '1px solid rgba(255,255,255,0.05)',
                borderBottom: 'none'
            }}>
                <h1 className="text-gradient" style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 'bold', margin: 0 }}>Calendar</h1>
            </div>

            <div style={{ 
                background: 'rgba(30, 41, 59, 0.7)', 
                backdropFilter: 'blur(20px)', 
                borderRadius: '16px', 
                borderTopLeftRadius: '0',
                borderTopRightRadius: '0',
                border: 'none',
                overflow: 'visible'
            }}>
                <div style={{ padding: '0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    
                    {!showPast && todayStr && (
                        <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center' }}>
                            <button 
                                onClick={() => setShowPast(true)}
                                style={{ 
                                    background: 'rgba(255,255,255,0.05)', 
                                    border: '1px solid rgba(255,255,255,0.1)', 
                                    color: 'rgba(255,255,255,0.8)', 
                                    padding: '0.75rem 1.5rem', 
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    transition: 'all 0.2s',
                                    fontSize: '0.9rem'
                                }}
                                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            >
                                &uarr; Show Past Dates
                            </button>
                        </div>
                    )}

                    {(() => {
                        let lastMonth = '';
                        return listData.map((dayData) => {
                            const dateNum = dayData.date.split('.')[0];
                            const monthYear = `${dayData.date.split('.')[1]}.${dayData.date.split('.')[2]}`;
                            const monthLabel = months.find(m => m.value === monthYear)?.label || monthYear;
                            const isToday = dayData.date === todayStr;
                            
                            let header = null;
                            if (monthYear !== lastMonth) {
                                header = (
                                    <div key={`header-${monthYear}`} style={{
                                        position: 'sticky',
                                        top: topHeaderHeight > 0 ? `${topHeaderHeight}px` : (isMobile ? '62px' : '76px'), 
                                        zIndex: 10,
                                        background: 'rgba(15, 23, 42, 0.95)', 
                                        backdropFilter: 'blur(16px)',
                                        WebkitBackdropFilter: 'blur(16px)',
                                        padding: '1rem',
                                        marginTop: '0',
                                        borderBottomLeftRadius: '16px',
                                        borderBottomRightRadius: '16px',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        fontSize: '1.1rem',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        borderTop: 'none',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px'
                                    }}>
                                        {monthLabel}
                                    </div>
                                );
                                lastMonth = monthYear;
                            }

                            return (
                                <React.Fragment key={dayData.date}>
                                    {header}
                                    <div style={{ 
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: isMobile ? '1rem 0.75rem' : '1rem 1.5rem', 
                                        border: isToday ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.05)',
                                        borderRadius: '12px',
                                        background: isToday ? 'rgba(var(--primary-rgb, 59, 130, 246), 0.15)' : dayData.is_holiday ? 'rgba(239, 68, 68, 0.05)' : 'rgba(0,0,0,0.2)',
                                        transition: 'all 0.2s',
                                        gap: isMobile ? '0.75rem' : '1.5rem'
                                    }}
                                    onMouseOver={(e) => { if(!isToday) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                                    onMouseOut={(e) => { if(!isToday) e.currentTarget.style.background = dayData.is_holiday ? 'rgba(239, 68, 68, 0.05)' : 'rgba(0,0,0,0.2)' }}
                                    >
                                        {/* Date & Day Badge */}
                                        <div style={{ 
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                            width: '60px', height: '60px',
                                            background: isToday ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                            borderRadius: '12px',
                                            color: isToday ? 'white' : dayData.is_holiday ? '#ef4444' : 'white',
                                            flexShrink: 0,
                                            boxShadow: isToday ? '0 4px 12px rgba(var(--primary-rgb, 59, 130, 246), 0.4)' : 'none'
                                        }}>
                                            <span style={{ fontSize: '0.8rem', opacity: 0.8, fontWeight: 'bold' }}>{dayData.day}</span>
                                            <span style={{ fontSize: '1.5rem', fontWeight: '800' }}>{parseInt(dateNum, 10)}</span>
                                        </div>

                                        {/* Event Details */}
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            {isToday && (
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    <span style={{ background: 'var(--primary)', color: 'white', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                        Today
                                                    </span>
                                                </div>
                                            )}
                                            {dayData.event && (
                                                <span style={{ fontSize: '1.1rem', fontWeight: '500', color: 'white', marginTop: '0.25rem' }}>{dayData.event}</span>
                                            )}
                                            {dayData.is_holiday && <span style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: '600' }}>Holiday</span>}
                                        </div>

                                        {/* Working Day Badges */}
                                        {dayData.is_working_day && (
                                            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.5rem', flexShrink: 0 }}>
                                                <span style={{ background: 'var(--primary)', color: 'white', fontSize: isMobile ? '0.75rem' : '0.9rem', padding: isMobile ? '4px 8px' : '6px 12px', borderRadius: '8px', fontWeight: 'bold', textAlign: 'center' }}>
                                                    Day {dayData.day_order}
                                                </span>
                                                {dayData.week && (
                                                    <span style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', fontSize: isMobile ? '0.75rem' : '0.9rem', padding: isMobile ? '4px 8px' : '6px 12px', borderRadius: '8px', textAlign: 'center' }}>
                                                        W{dayData.week}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </React.Fragment>
                            );
                        })
                    })()}
                </div>
            </div>
        </div>
    );
}
