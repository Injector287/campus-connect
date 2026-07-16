'use client'

import React, { useState, useMemo, useEffect } from 'react';
import calendarData from '../../../../calendar.json';

export default function CalendarPage() {
    const [currentMonthStr, setCurrentMonthStr] = useState('06.2026');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [todayStr, setTodayStr] = useState('');

    useEffect(() => {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        setTodayStr(`${dd}.${mm}.${yyyy}`);
    }, []);

    useEffect(() => {
        if (viewMode === 'list') {
            setTimeout(() => {
                document.getElementById('today-row')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }, [viewMode, todayStr]);

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

    const currentMonthData = useMemo(() => {
        return calendarData.filter(d => {
            const parts = d.date.split('.');
            return `${parts[1]}.${parts[2]}` === currentMonthStr;
        });
    }, [currentMonthStr]);

    const handlePrev = () => {
        const idx = months.findIndex(m => m.value === currentMonthStr);
        if (idx > 0) setCurrentMonthStr(months[idx - 1].value);
    };

    const handleNext = () => {
        const idx = months.findIndex(m => m.value === currentMonthStr);
        if (idx < months.length - 1) setCurrentMonthStr(months[idx + 1].value);
    };

    const [isMobile, setIsMobile] = useState(false);
    const topHeaderRef = React.useRef(null);
    const [topHeaderHeight, setTopHeaderHeight] = useState(0);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            if (mobile) {
                setViewMode('list');
            }
            if (topHeaderRef.current) {
                setTopHeaderHeight(topHeaderRef.current.offsetHeight);
            }
        };
        handleResize(); // Initial check
        window.addEventListener('resize', handleResize);
        
        // Use ResizeObserver for precise measurement if content loads late
        const observer = new ResizeObserver(() => {
            if (topHeaderRef.current) {
                setTopHeaderHeight(topHeaderRef.current.offsetHeight);
            }
        });
        if (topHeaderRef.current) {
            observer.observe(topHeaderRef.current);
        }

        return () => {
            window.removeEventListener('resize', handleResize);
            observer.disconnect();
        };
    }, [viewMode]);

    const firstDayIndex = useMemo(() => {
        if (!currentMonthData.length) return 0;
        const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        return days.indexOf(currentMonthData[0].day);
    }, [currentMonthData]);

    return (
        <div style={{ padding: isMobile ? '0.5rem' : '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div ref={topHeaderRef} style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                marginBottom: viewMode === 'grid' ? (isMobile ? '1rem' : '2rem') : '0',
                position: 'sticky',
                top: '0',
                zIndex: 20,
                background: 'rgba(15, 23, 42, 0.95)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                padding: '1rem',
                borderTopLeftRadius: '16px',
                borderTopRightRadius: '16px',
                borderBottomLeftRadius: viewMode === 'grid' ? '16px' : '0',
                borderBottomRightRadius: viewMode === 'grid' ? '16px' : '0',
                border: '1px solid rgba(255,255,255,0.05)',
                borderBottom: viewMode === 'grid' ? '1px solid rgba(255,255,255,0.05)' : 'none'
            }}>
                <h1 className="text-gradient" style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 'bold', margin: 0 }}>Academic Calendar</h1>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className="desktop-only" style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', overflow: 'hidden', marginRight: viewMode === 'grid' ? '1rem' : '0' }}>
                        <button onClick={() => setViewMode('grid')} style={{ padding: '0.5rem 1rem', border: 'none', background: viewMode === 'grid' ? 'var(--primary)' : 'transparent', color: viewMode === 'grid' ? 'white' : 'rgba(255,255,255,0.6)', cursor: 'pointer', transition: 'all 0.2s' }}>Grid</button>
                        <button onClick={() => setViewMode('list')} style={{ padding: '0.5rem 1rem', border: 'none', background: viewMode === 'list' ? 'var(--primary)' : 'transparent', color: viewMode === 'list' ? 'white' : 'rgba(255,255,255,0.6)', cursor: 'pointer', transition: 'all 0.2s' }}>List</button>
                    </div>

                    {viewMode === 'grid' && (
                        <>
                            <button onClick={handlePrev} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', color: 'white', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>&larr; Prev</button>
                            <select 
                                value={currentMonthStr} 
                                onChange={e => setCurrentMonthStr(e.target.value)}
                                style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem 1rem', borderRadius: '8px', outline: 'none' }}
                            >
                                {months.map(m => <option key={m.value} value={m.value} style={{ color: 'black' }}>{m.label}</option>)}
                            </select>
                            <button onClick={handleNext} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', color: 'white', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>Next &rarr;</button>
                        </>
                    )}
                </div>
            </div>

            <div style={{ 
                background: 'rgba(30, 41, 59, 0.7)', 
                backdropFilter: 'blur(20px)', 
                borderRadius: '16px', 
                border: viewMode === 'grid' ? '1px solid rgba(255,255,255,0.05)' : 'none',
                overflow: viewMode === 'grid' ? 'hidden' : 'visible'
            }}>
                {viewMode === 'grid' ? (
                    <>
                        {/* Header */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
                            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                                <div key={day} style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold', color: 'rgba(255,255,255,0.6)' }}>
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                            {Array.from({ length: firstDayIndex }).map((_, i) => (
                                <div key={`empty-${i}`} style={{ padding: '1rem', minHeight: '120px', borderRight: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}></div>
                            ))}
                            
                            {currentMonthData.map((dayData, i) => {
                                const dateNum = dayData.date.split('.')[0];
                                const isToday = dayData.date === todayStr;
                                
                                return (
                                    <div key={dayData.date} style={{ 
                                        padding: '1rem', 
                                        minHeight: '120px', 
                                        borderRight: '1px solid rgba(255,255,255,0.05)', 
                                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                                        background: isToday ? 'rgba(var(--primary-rgb), 0.2)' : dayData.is_holiday ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                                        transition: 'all 0.2s',
                                        position: 'relative',
                                        outline: isToday ? '2px solid var(--primary)' : 'none',
                                        outlineOffset: '-2px'
                                    }}
                                    onMouseOver={(e) => { if (!isToday) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                                    onMouseOut={(e) => { if (!isToday) e.currentTarget.style.background = dayData.is_holiday ? 'rgba(239, 68, 68, 0.1)' : 'transparent' }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                            <span style={{ 
                                                fontSize: '1.2rem', 
                                                fontWeight: '600', 
                                                color: isToday ? 'white' : dayData.is_holiday ? '#ef4444' : 'white',
                                                width: '30px',
                                                height: '30px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderRadius: '50%',
                                                background: isToday ? 'var(--primary)' : 'transparent'
                                            }}>
                                                {parseInt(dateNum, 10)}
                                            </span>
                                            {dayData.is_working_day && (
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                                    <span style={{ background: 'var(--primary)', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                                                        Day {dayData.day_order}
                                                    </span>
                                                    {dayData.week && (
                                                        <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px' }}>
                                                            W{dayData.week}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {dayData.event && (
                                            <div style={{ 
                                                fontSize: '0.75rem', 
                                                color: 'rgba(255,255,255,0.8)', 
                                                background: 'rgba(255,255,255,0.1)', 
                                                padding: '6px', 
                                                borderRadius: '6px',
                                                marginTop: '4px',
                                                lineHeight: '1.4'
                                            }}>
                                                {dayData.event}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div style={{ padding: '0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {(() => {
                            let lastMonth = '';
                            return calendarData.map((dayData, i) => {
                                const dateNum = dayData.date.split('.')[0];
                                const monthYear = `${dayData.date.split('.')[1]}.${dayData.date.split('.')[2]}`;
                                const monthLabel = months.find(m => m.value === monthYear)?.label || monthYear;
                                const isToday = dayData.date === todayStr;
                                
                                let header = null;
                                if (monthYear !== lastMonth) {
                                    header = (
                                        <div key={`header-${monthYear}`} style={{
                                            position: 'sticky',
                                            top: topHeaderHeight > 0 ? `${topHeaderHeight}px` : (isMobile ? '62px' : '76px'), // dynamic pixel-perfect placement
                                            zIndex: 10,
                                            background: 'rgba(15, 23, 42, 0.95)', // Match background of top header
                                            backdropFilter: 'blur(16px)',
                                            WebkitBackdropFilter: 'blur(16px)',
                                            padding: '1rem',
                                            marginTop: '0',
                                            borderTopLeftRadius: '0',
                                            borderTopRightRadius: '0',
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
                                        <div id={isToday ? "today-row" : ""} style={{ 
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
                )}
            </div>
        </div>
    );
}
