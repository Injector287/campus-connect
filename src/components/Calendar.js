'use client'

import React, { useState, useMemo, useEffect } from 'react';
import calendarData from '../../calendar.json';
import timetableData from '../utils/timetable.json';
import { useTabState } from '@/hooks/useTabState'

export default function CalendarPage() {
    const [todayStr, setTodayStr] = useState('');
    const [showPast, setShowPast] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [activeView, setActiveView] = useTabState('view', 'calendar');
    const [selectedDayOrder, setSelectedDayOrder] = useState('1');
    const [selectedMonth, setSelectedMonth] = useState('06.2026');
    const topHeaderRef = React.useRef(null);
    const [topHeaderHeight, setTopHeaderHeight] = useState(0);

    useEffect(() => {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        const tStr = `${dd}.${mm}.${yyyy}`;
        setTodayStr(tStr);
        setSelectedMonth(`${mm}.${yyyy}`);

        const todayData = calendarData.find(d => d.date === tStr);
        if (todayData && todayData.is_working_day && todayData.day_order) {
            setSelectedDayOrder(todayData.day_order.toString());
        }
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

    const handleShowPastDates = () => {
        const todayEl = document.getElementById('today-marker');
        let offset = 0;
        if (todayEl) {
             offset = todayEl.getBoundingClientRect().top;
        }
        setShowPast(true);
        // After render, maintain the exact visual scroll position relative to today's date
        setTimeout(() => {
            const newTodayEl = document.getElementById('today-marker');
            if (newTodayEl) {
                const newY = newTodayEl.getBoundingClientRect().top + window.scrollY;
                window.scrollTo({ top: newY - offset, behavior: 'auto' });
            }
        }, 50);
    };

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
        <div className="animate-slide-up responsive-padding-container" style={{ paddingBottom: '6rem', maxWidth: '1200px', margin: '0 auto' }}>
            <style>{`
                .mobile-view { display: none !important; }
                .desktop-view { display: flex !important; }
                .desktop-block { display: block !important; }
                .desktop-grid { display: grid !important; }
                .responsive-padding-container { padding-top: 2rem; padding-left: 2rem; padding-right: 2rem; }
                @media (max-width: 768px) {
                    .mobile-view { display: flex !important; }
                    .desktop-view { display: none !important; }
                    .desktop-block { display: none !important; }
                    .desktop-grid { display: none !important; }
                    .responsive-padding-container { padding-top: 0.5rem; padding-left: 0.5rem; padding-right: 0.5rem; }
                }
            `}</style>
            <div ref={topHeaderRef} style={{ 
                display: 'flex', flexDirection: 'column', gap: '1rem', 
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <h1 className="text-gradient" style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 'bold', margin: 0 }}>
                        {activeView === 'calendar' ? 'Calendar' : 'Timetable'}
                    </h1>
                </div>
                
                <div style={{ 
                    display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '4px', width: '100%',
                    border: '1px solid rgba(255,255,255,0.05)'
                }}>
                    <button 
                        onClick={() => setActiveView('calendar')}
                        style={{
                            flex: 1, padding: '0.6rem', borderRadius: '10px', fontSize: '0.9rem', fontWeight: '600',
                            background: activeView === 'calendar' ? 'rgba(255,255,255,0.1)' : 'transparent',
                            color: activeView === 'calendar' ? 'white' : 'rgba(255,255,255,0.5)',
                            transition: 'all 0.2s', border: 'none', cursor: 'pointer'
                        }}
                    >Events</button>
                    <button 
                        onClick={() => setActiveView('timetable')}
                        style={{
                            flex: 1, padding: '0.6rem', borderRadius: '10px', fontSize: '0.9rem', fontWeight: '600',
                            background: activeView === 'timetable' ? 'rgba(255,255,255,0.1)' : 'transparent',
                            color: activeView === 'timetable' ? 'white' : 'rgba(255,255,255,0.5)',
                            transition: 'all 0.2s', border: 'none', cursor: 'pointer'
                        }}
                    >Timetable</button>
                </div>
            </div>

            <div style={{ 
                background: 'transparent', 
                borderRadius: '16px', 
                borderTopLeftRadius: '0',
                borderTopRightRadius: '0',
                overflow: 'visible'
            }}>
                <div style={{ padding: '0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {activeView === 'calendar' && (
                        <>
                    {!showPast && todayStr && (
                        <div className="mobile-view" style={{ padding: '1rem', justifyContent: 'center' }}>
                            <button 
                                onClick={handleShowPastDates}
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

                    {/* Mobile View */}
                    <div className="mobile-view" style={{ flexDirection: 'column', gap: '1rem' }}>
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
                                            top: topHeaderHeight > 0 ? `${topHeaderHeight}px` : '62px', 
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
                                        <div 
                                            id={isToday ? 'today-marker' : undefined}
                                            style={{ 
                                                display: 'flex',
                                                alignItems: 'center',
                                                padding: '1rem 0.75rem', 
                                                border: isToday ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.05)',
                                                borderRadius: '12px',
                                                background: isToday ? 'rgba(var(--primary-rgb, 59, 130, 246), 0.15)' : dayData.is_holiday ? 'rgba(239, 68, 68, 0.05)' : 'rgba(0,0,0,0.2)',
                                                transition: 'all 0.2s',
                                                gap: '0.75rem'
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
                                                    <span style={{ fontSize: '0.95rem', fontWeight: '500', color: 'white', marginTop: '0.25rem' }}>{dayData.event}</span>
                                                )}
                                                {dayData.is_holiday && <span style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: '600' }}>Holiday</span>}
                                            </div>

                                            {/* Working Day Badges */}
                                            {dayData.is_working_day && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flexShrink: 0 }}>
                                                    <span style={{ background: 'var(--primary)', color: 'white', fontSize: '0.75rem', padding: '4px 8px', borderRadius: '8px', fontWeight: 'bold', textAlign: 'center' }}>
                                                        Day {dayData.day_order}
                                                    </span>
                                                    {dayData.week && (
                                                        <span style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', fontSize: '0.75rem', padding: '4px 8px', borderRadius: '8px', textAlign: 'center' }}>
                                                            W{dayData.week}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </React.Fragment>
                                );
                            });
                    })()}
                    </div>

                    {/* Desktop View */}
                    <div className="desktop-view" style={{ flexDirection: 'column', gap: '1.5rem' }}>
                    {(() => {
                            // Desktop Calendar Grid Grouped by Month
                            const groupedByMonth = {};
                            calendarData.forEach(day => {
                                const [dd, mm, yyyy] = day.date.split('.');
                                const monthYear = `${mm}.${yyyy}`;
                                if (!groupedByMonth[monthYear]) {
                                    groupedByMonth[monthYear] = {
                                        label: months.find(m => m.value === monthYear)?.label || monthYear,
                                        year: parseInt(yyyy, 10),
                                        month: parseInt(mm, 10) - 1,
                                        days: []
                                    };
                                }
                                groupedByMonth[monthYear].days.push(day);
                            });

                            const activeMonthKey = selectedMonth && groupedByMonth[selectedMonth] ? selectedMonth : Object.keys(groupedByMonth)[0];
                            const monthObj = groupedByMonth[activeMonthKey];
                            
                            if (!monthObj) return null;

                            const startDayOfWeek = new Date(monthObj.year, monthObj.month, 1).getDay(); // 0 = Sun
                            
                            const emptyCells = Array.from({ length: startDayOfWeek }).map((_, i) => <div key={`empty-${i}`} style={{ padding: '1rem', background: 'rgba(0,0,0,0.1)', borderRight: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}></div>);
                            
                            const dayCells = monthObj.days.map((dayData, index) => {
                                const dateNum = parseInt(dayData.date.split('.')[0], 10);
                                const isToday = dayData.date === todayStr;
                                
                                // Calculate if this date is past
                                let isPast = false;
                                if (todayStr) {
                                    const [tDD, tMM, tYYYY] = todayStr.split('.').map(Number);
                                    const tDate = new Date(tYYYY, tMM - 1, tDD);
                                    const [cDD, cMM, cYYYY] = dayData.date.split('.').map(Number);
                                    const cDate = new Date(cYYYY, cMM - 1, cDD);
                                    isPast = cDate < tDate;
                                }

                                return (
                                    <div key={dayData.date} style={{ 
                                        padding: '0.75rem', 
                                        background: isToday ? 'rgba(var(--primary-rgb, 59, 130, 246), 0.15)' : (dayData.is_holiday ? 'rgba(239, 68, 68, 0.05)' : 'rgba(0,0,0,0.2)'),
                                        borderRight: '1px solid rgba(255,255,255,0.05)', 
                                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                                        border: isToday ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.05)',
                                        display: 'flex', flexDirection: 'column', gap: '0.5rem',
                                        minHeight: '120px',
                                        opacity: isPast ? 0.4 : 1,
                                        transition: 'opacity 0.2s, background 0.2s',
                                    }}
                                    onMouseOver={(e) => { if(!isToday) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                                    onMouseOut={(e) => { if(!isToday) e.currentTarget.style.background = dayData.is_holiday ? 'rgba(239, 68, 68, 0.05)' : 'rgba(0,0,0,0.2)' }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: isToday ? 'var(--primary)' : (dayData.is_holiday ? '#ef4444' : 'white') }}>
                                                {dateNum}
                                            </span>
                                            {dayData.is_working_day && (
                                                <span style={{ background: 'var(--primary)', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '6px', fontWeight: 'bold' }}>
                                                    D{dayData.day_order}
                                                </span>
                                            )}
                                        </div>
                                        
                                        {dayData.event && (
                                            <div style={{ fontSize: '0.85rem', fontWeight: '500', color: 'rgba(255,255,255,0.9)', lineHeight: '1.2' }}>
                                                {dayData.event}
                                            </div>
                                        )}
                                    </div>
                                );
                            });

                            const totalCells = emptyCells.length + dayCells.length;
                            const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
                            const trailingEmptyCells = Array.from({ length: remainingCells }).map((_, i) => <div key={`trail-${i}`} style={{ padding: '1rem', background: 'rgba(0,0,0,0.1)', borderRight: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}></div>);

                            const activeMonthIdx = months.findIndex(m => m.value === activeMonthKey);
                            const prevMonth = activeMonthIdx > 0 ? months[activeMonthIdx - 1] : null;
                            const nextMonth = activeMonthIdx < months.length - 1 ? months[activeMonthIdx + 1] : null;

                            return (
                                <React.Fragment>
                                    {/* Month Selector */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', padding: '0.5rem 0' }}>
                                        <button 
                                            onClick={() => prevMonth && setSelectedMonth(prevMonth.value)}
                                            style={{ 
                                                width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)',
                                                cursor: prevMonth ? 'pointer' : 'default', opacity: prevMonth ? 1 : 0.2,
                                                transition: 'all 0.2s', fontSize: '1.2rem'
                                            }}
                                            onMouseOver={(e) => { if(prevMonth) e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
                                            onMouseOut={(e) => { if(prevMonth) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                                        >
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                                        </button>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 'bold', width: '200px', textAlign: 'center', color: 'white' }}>
                                            {monthObj.label}
                                        </div>
                                        <button 
                                            onClick={() => nextMonth && setSelectedMonth(nextMonth.value)}
                                            style={{ 
                                                width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)',
                                                cursor: nextMonth ? 'pointer' : 'default', opacity: nextMonth ? 1 : 0.2,
                                                transition: 'all 0.2s', fontSize: '1.2rem'
                                            }}
                                            onMouseOver={(e) => { if(nextMonth) e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
                                            onMouseOut={(e) => { if(nextMonth) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                                        >
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                                        </button>
                                    </div>

                                    {/* Month Grid */}
                                    <div key={activeMonthKey} style={{ marginBottom: '2rem' }}>
                                        <div style={{ 
                                            background: 'rgba(0,0,0,0.2)', 
                                            borderRadius: '16px', 
                                            border: '1px solid rgba(255,255,255,0.05)', 
                                            overflow: 'hidden' 
                                        }}>
                                            <div style={{ 
                                                display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', 
                                                background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)',
                                                fontWeight: 'bold', textAlign: 'center'
                                            }}>
                                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                                    <div key={day} style={{ padding: '0.75rem', borderRight: day !== 'Sat' ? '1px solid rgba(255,255,255,0.05)' : 'none', color: day === 'Sun' ? '#ef4444' : 'rgba(255,255,255,0.7)' }}>{day}</div>
                                                ))}
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                                                {emptyCells}
                                                {dayCells}
                                                {trailingEmptyCells}
                                            </div>
                                        </div>
                                    </div>
                                </React.Fragment>
                            );
                    })()}
                    </div>
                        </>
                    )}

                    {activeView === 'timetable' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
                            <div className="mobile-view" style={{ flexDirection: 'column' }}>
                                    {/* Day Selector */}
                                    <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                                        {[1,2,3,4,5,6].map(day => (
                                            <button 
                                                key={day}
                                                onClick={() => setSelectedDayOrder(day.toString())}
                                                style={{
                                                    padding: '0.75rem 1.25rem', borderRadius: '12px', fontSize: '1rem', fontWeight: 'bold', flexShrink: 0,
                                                    background: selectedDayOrder === day.toString() ? 'var(--primary)' : 'rgba(0,0,0,0.2)',
                                                    color: selectedDayOrder === day.toString() ? 'white' : 'rgba(255,255,255,0.7)',
                                                    border: selectedDayOrder === day.toString() ? 'none' : '1px solid rgba(255,255,255,0.1)',
                                                    boxShadow: selectedDayOrder === day.toString() ? '0 4px 12px rgba(var(--primary-rgb, 59, 130, 246), 0.4)' : 'none',
                                                    transition: 'all 0.2s', cursor: 'pointer'
                                                }}
                                            >
                                                Day {day}
                                            </button>
                                        ))}
                                    </div>
                                    
                                    {/* Timetable List */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                                        {(() => {
                                            const dayTimetable = timetableData.timetable[selectedDayOrder];
                                            if (!dayTimetable) return <div style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '2rem' }}>No timetable available for Day {selectedDayOrder}</div>;
                                            
                                            const periods = [
                                                { id: '1', type: 'class' },
                                                { id: '2', type: 'class' },
                                                { id: '3', type: 'class' },
                                                { id: 'Break', type: 'break' },
                                                { id: '4', type: 'class' },
                                                { id: '5', type: 'class' }
                                            ];

                                            return periods.map((p, idx) => {
                                                const timeStr = timetableData.timings[p.id];
                                                const subject = p.type === 'class' ? dayTimetable[p.id] : 'Break';
                                                
                                                return (
                                                    <div key={idx} style={{ 
                                                        display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem',
                                                        background: p.type === 'break' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.2)',
                                                        border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px'
                                                    }}>
                                                        <div style={{ 
                                                            width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                                            background: p.type === 'break' ? 'transparent' : 'rgba(255,255,255,0.05)', borderRadius: '12px',
                                                            color: p.type === 'break' ? 'rgba(255,255,255,0.4)' : 'white', fontWeight: 'bold', fontSize: '1.2rem'
                                                        }}>
                                                            {p.type === 'class' ? p.id : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>}
                                                        </div>
                                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                                            <span style={{ fontSize: '1.1rem', fontWeight: '600', color: p.type === 'break' ? 'rgba(255,255,255,0.5)' : 'white' }}>{subject}</span>
                                                            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                                                {timeStr}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                            </div>

                            <div className="desktop-block">
                                <div style={{ 
                                    background: 'rgba(0,0,0,0.2)', 
                                    borderRadius: '16px', 
                                    border: '1px solid rgba(255,255,255,0.05)', 
                                    overflow: 'hidden' 
                                }}>
                                    <div style={{ 
                                        display: 'grid', gridTemplateColumns: '100px repeat(6, 1fr)', 
                                        background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)',
                                        fontWeight: 'bold'
                                    }}>
                                        <div style={{ padding: '1rem', borderRight: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>Day</div>
                                        {['1', '2', '3', 'Break', '4', '5'].map(p => (
                                            <div key={p} style={{ padding: '1rem', borderRight: p !== '5' ? '1px solid rgba(255,255,255,0.1)' : 'none', textAlign: 'center' }}>
                                                <div>{p}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>{timetableData.timings[p]}</div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {[1, 2, 3, 4, 5, 6].map((day, rowIndex) => (
                                        <div key={day} style={{ 
                                            display: 'grid', gridTemplateColumns: '100px repeat(6, 1fr)', 
                                            borderBottom: rowIndex !== 5 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                            background: selectedDayOrder === day.toString() ? 'rgba(var(--primary-rgb, 59, 130, 246), 0.15)' : 'transparent',
                                            transition: 'background 0.2s'
                                        }}>
                                            <div style={{ padding: '1rem', borderRight: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                                Day {day}
                                            </div>
                                            {['1', '2', '3', 'Break', '4', '5'].map(p => {
                                                const subject = p === 'Break' ? 'Break' : (timetableData.timetable[day] ? timetableData.timetable[day][p] : '-');
                                                return (
                                                    <div key={p} style={{ 
                                                        padding: '1rem', 
                                                        borderRight: p !== '5' ? '1px solid rgba(255,255,255,0.05)' : 'none', 
                                                        textAlign: 'center',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: p === 'Break' ? 'rgba(255,255,255,0.4)' : 'white',
                                                        fontWeight: '500'
                                                    }}>
                                                        {subject}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
