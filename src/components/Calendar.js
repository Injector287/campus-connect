'use client'

import React, { useState, useMemo, useEffect, useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

import calendarData from '../../calendar.json';
import timetableData from '../utils/timetable.json';
import { useTabState } from '@/hooks/useTabState'

const MONTHS_LIST = [
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

export default function CalendarPage() {
    const [todayStr, setTodayStr] = useState('');
    const [isMobile, setIsMobile] = useState(false);
    const [viewSlideDir, setViewSlideDir] = useState('');
    const [activeView, setActiveView] = useTabState('view', 'calendar');
    const [selectedDayOrder, setSelectedDayOrder] = useState('1');
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const today = new Date();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        return `${mm}.${yyyy}`;
    });
    const [slideDirection, setSlideDirection] = useState('');
    const topHeaderRef = React.useRef(null);
    const [topHeaderHeight, setTopHeaderHeight] = useState(0);

    const [dynamicTimetable, setDynamicTimetable] = useState(timetableData);
    const [isTimetableLoading, setIsTimetableLoading] = useState(false);
    
    const pathname = usePathname();
    const isVisible = pathname === '/dashboard/calendar';
    const [editModal, setEditModal] = useState(null); // { dayOrder, period, subject }
    const [subjectsList, setSubjectsList] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [viewportHeight, setViewportHeight] = useState('100vh');

    useEffect(() => {
        const updateHeight = () => {
            setViewportHeight(`${window.innerHeight}px`);
        };
        updateHeight();
        window.addEventListener('resize', updateHeight);
        return () => window.removeEventListener('resize', updateHeight);
    }, []);



    useEffect(() => {
        if (typeof window === 'undefined') return;
        
        if (isVisible && window.innerWidth >= 769) {
            window.scrollTo(0, 0);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [activeView, isVisible]);

    useEffect(() => {
        if (activeView === 'timetable') {
            const timer = setInterval(() => setCurrentTime(new Date()), 60000);
            return () => clearInterval(timer);
        }
    }, [activeView]);

    const todayData = useMemo(() => calendarData.find(d => d.date === todayStr), [todayStr]);
    const todayDayOrder = todayData?.is_working_day ? todayData.day_order.toString() : null;
    const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

    const fetchTimetableAndSubjects = async () => {
        setIsTimetableLoading(true);
        try {
            const [timeRes, gradesRes] = await Promise.all([
                fetch('/api/timetable'),
                fetch('/api/grades')
            ]);
            
            const timeData = await timeRes.json();
            if (timeData.success) setDynamicTimetable(timeData);

            const gradesData = await gradesRes.json();
            if (gradesData.success && gradesData.internalMarks) {
                setSubjectsList(gradesData.internalMarks.map(s => ({ code: s.code, desc: s.desc })));
            }
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setIsTimetableLoading(false);
        }
    };

    useEffect(() => {
        if (activeView === 'timetable') {
            fetchTimetableAndSubjects();
        }
    }, [activeView]);

    const handleSaveOverride = async (e) => {
        e.preventDefault();
        const newSubject = e.target.elements.subject.value.trim();
        const alias = e.target.elements.alias ? e.target.elements.alias.value : '';
        if (!newSubject) return;
        
        try {
            await fetch('/api/timetable', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'override', dayOrder: editModal.dayOrder, period: editModal.period, subject: newSubject, alias }) 
            });
            setEditModal(null);
            fetchTimetableAndSubjects(); // refresh
        } catch (err) {
            console.error(err);
        }
    };

    const handleSyncClass = async () => {
        if (!confirm('Are you sure you want to remove all personal overrides and sync with the class consensus?')) return;
        try {
            await fetch('/api/timetable', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'sync' }) });
            fetchTimetableAndSubjects();
        } catch (err) {}
    };

    const groupedByMonth = useMemo(() => {
        const groups = {};
        calendarData.forEach(day => {
            const [dd, mm, yyyy] = day.date.split('.');
            const monthYear = `${mm}.${yyyy}`;
            if (!groups[monthYear]) {
                const labelObj = MONTHS_LIST.find(m => m.value === monthYear);
                
                groups[monthYear] = {
                    label: labelObj ? labelObj.label : monthYear,
                    year: parseInt(yyyy, 10),
                    month: parseInt(mm, 10) - 1,
                    days: []
                };
            }
            groups[monthYear].days.push(day);
        });
        return groups;
    }, []);

    useEffect(() => {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        const tStr = `${dd}.${mm}.${yyyy}`;
        setTimeout(() => {
            setTodayStr(tStr);
        }, 0);

        const todayData = calendarData.find(d => d.date === tStr);
        if (todayData && todayData.is_working_day && todayData.day_order) {
            setTimeout(() => setSelectedDayOrder(todayData.day_order.toString()), 0);
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

    useIsomorphicLayoutEffect(() => {
        if (topHeaderRef.current) {
            setTopHeaderHeight(topHeaderRef.current.offsetHeight);
        }
    }, [activeView]);

    useIsomorphicLayoutEffect(() => {
        const scrollToToday = () => {
            if (window.innerWidth <= 768 && activeView === 'calendar') {
                const todayEl = document.getElementById('today-marker');
                if (todayEl) {
                    // Temporarily disable global smooth scrolling to force an instant jump
                    const style = document.createElement('style');
                    style.innerHTML = '* { scroll-behavior: auto !important; }';
                    document.head.appendChild(style);
                    
                    todayEl.scrollIntoView({ behavior: 'auto', block: 'center' });
                    
                    // Remove the style block after the scroll completes
                    requestAnimationFrame(() => {
                        document.head.removeChild(style);
                    });
                }
            }
        };
        
        // Scroll synchronously before paint
        if (todayStr && activeView === 'calendar') {
            scrollToToday();
        }
    }, [todayStr, activeView]);

    const handleTodayClick = () => {
        const today = new Date();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        setSelectedMonth(`${mm}.${yyyy}`);
        
        if (window.innerWidth <= 768) {
            const todayEl = document.getElementById('today-marker');
            if (todayEl) {
                todayEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    };

    const listData = useMemo(() => {
        return calendarData;
    }, []);

    const monthObj = MONTHS_LIST.find(m => m.value === selectedMonth) || MONTHS_LIST[0];
    const activeMonthIdx = MONTHS_LIST.findIndex(m => m.value === monthObj.value);
    const prevMonth = activeMonthIdx > 0 ? MONTHS_LIST[activeMonthIdx - 1] : null;
    const nextMonth = activeMonthIdx < MONTHS_LIST.length - 1 ? MONTHS_LIST[activeMonthIdx + 1] : null;

    const lastWheelTime = React.useRef(0);
    const handleWheel = (e) => {
        const now = Date.now();
        if (now - lastWheelTime.current < 250) return; // Debounce wheel events
        
        if (e.deltaY > 0 && nextMonth) {
            setSlideDirection('right');
            setSelectedMonth(nextMonth.value);
            lastWheelTime.current = now;
        } else if (e.deltaY < 0 && prevMonth) {
            setSlideDirection('left');
            setSelectedMonth(prevMonth.value);
            lastWheelTime.current = now;
        }
    };

    return (
        <>
            <div className="animate-slide-up responsive-padding-container calendar-container-wrapper" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                <style>{`
                    .mobile-view { display: none !important; }
                    .desktop-view { display: flex !important; }
                    .desktop-block { display: block !important; }
                    .desktop-grid { display: grid !important; }
                    .responsive-padding-container { padding: 1rem 2rem; }
                    .calendar-container-wrapper {
                        height: ${viewportHeight};
                        display: flex;
                        flex-direction: column;
                    }
                    @media (max-width: 768px) {
                        .mobile-view { display: flex !important; }
                        .desktop-view { display: none !important; }
                        .desktop-block { display: none !important; }
                        .desktop-grid { display: none !important; }
                        .responsive-padding-container { padding: 0.5rem 0.5rem 2rem 0.5rem; }
                        .calendar-container-wrapper {
                            height: auto;
                            display: block;
                        }
                    }
                    
                    .calendar-header {
                        position: sticky;
                        top: 0;
                        z-index: 50;
                        background: #0f172a;
                        margin: 0 -0.5rem;
                        padding: 0.5rem 1rem 0.25rem 1rem;
                    }
                    @media (min-width: 769px) {
                        .calendar-header {
                            position: relative;
                            background: transparent;
                            margin: 0 0 1rem 0;
                            padding: 0;
                        }
                    }
                `}</style>
                <div ref={topHeaderRef} className="calendar-header">
                    {/* Mobile Header */}
                    <div className="mobile-view" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
                                {activeView === 'calendar' ? 'Calendar' : 'Timetable'}
                            </h1>
                        </div>
                        <div style={{ display: 'flex', width: '100%' }}>
                            <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'rgba(0,0,0,0.2)', padding: '0.35rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)', width: '100%' }}>
                                <div style={{
                                    position: 'absolute', top: '0.35rem', bottom: '0.35rem',
                                    left: '0.35rem',
                                    width: 'calc(50% - 0.35rem)',
                                    background: 'var(--primary)', borderRadius: '10px',
                                    transform: activeView === 'calendar' ? 'translateX(0)' : 'translateX(100%)',
                                    willChange: 'transform',
                                    transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                                }} />
                                <button onClick={() => { setActiveView('calendar'); setViewSlideDir('left'); setSlideDirection(''); }} style={{ position: 'relative', zIndex: 1, padding: '0.6rem 1rem', borderRadius: '10px', border: 'none', background: 'transparent', color: activeView === 'calendar' ? 'white' : 'rgba(255,255,255,0.6)', fontWeight: '600', cursor: 'pointer', transition: 'color 0.3s', fontSize: '0.95rem', width: '100%' }}>Calendar</button>
                                <button onClick={() => { setActiveView('timetable'); setViewSlideDir('right'); setSlideDirection(''); }} style={{ position: 'relative', zIndex: 1, padding: '0.6rem 1rem', borderRadius: '10px', border: 'none', background: 'transparent', color: activeView === 'timetable' ? 'white' : 'rgba(255,255,255,0.6)', fontWeight: '600', cursor: 'pointer', transition: 'color 0.3s', fontSize: '0.95rem', width: '100%' }}>Timetable</button>
                            </div>
                        </div>

                        {activeView === 'timetable' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '0.5rem' }}>
                                <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none', scrollbarWidth: 'none', flex: 1 }}>
                                    {[1,2,3,4,5,6].map(day => {
                                        const isSelected = selectedDayOrder === day.toString();
                                        const isToday = todayDayOrder === day.toString();
                                        return (
                                            <button 
                                                key={day}
                                                onClick={() => setSelectedDayOrder(day.toString())}
                                                style={{
                                                    padding: '0.75rem 1.25rem', borderRadius: '12px', fontSize: '1rem', fontWeight: 'bold', flexShrink: 0,
                                                    background: isSelected ? 'var(--primary)' : (isToday ? 'rgba(59, 130, 246, 0.15)' : 'rgba(0,0,0,0.2)'),
                                                    color: isSelected ? 'white' : (isToday ? '#60a5fa' : 'rgba(255,255,255,0.7)'),
                                                    border: isSelected ? 'none' : (isToday ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid rgba(255,255,255,0.1)'),
                                                    boxShadow: isSelected ? '0 4px 12px rgba(var(--primary-rgb, 59, 130, 246), 0.4)' : 'none',
                                                    transition: 'transform 0.2s, opacity 0.2s, background-color 0.2s, border-color 0.2s', cursor: 'pointer', outline: 'none', WebkitTapHighlightColor: 'transparent'
                                                }}
                                            >
                                                Day {day}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button onClick={handleSyncClass} style={{ padding: '0.85rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }} title="Sync with Class">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.92-10.26l5.57 5.57"/></svg>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Desktop Header */}
                    <div className="desktop-view" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
                                {activeView === 'calendar' ? 'Calendar' : 'Timetable'}
                            </h1>
                            {activeView === 'calendar' && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <button onClick={() => {
                                        setSlideDirection('left');
                                        handleTodayClick();
                                    }} style={{ background: 'rgba(var(--primary-rgb, 59, 130, 246), 0.15)', color: 'var(--primary)', border: '1px solid rgba(var(--primary-rgb, 59, 130, 246), 0.3)', borderRadius: '12px', padding: '8px 16px', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', transition: 'transform 0.2s, opacity 0.2s, background-color 0.2s, border-color 0.2s' }} onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(var(--primary-rgb, 59, 130, 246), 0.25)' }} onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(var(--primary-rgb, 59, 130, 246), 0.15)' }}>
                                        Today
                                    </button>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <button onClick={() => {
                                            if (prevMonth) {
                                                setSlideDirection('left');
                                                setSelectedMonth(prevMonth.value);
                                            }
                                        }} style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', cursor: prevMonth ? 'pointer' : 'default', opacity: prevMonth ? 1 : 0.2, transition: 'transform 0.2s, opacity 0.2s, background-color 0.2s, border-color 0.2s', fontSize: '1.1rem' }} onMouseOver={(e) => { if(prevMonth) e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }} onMouseOut={(e) => { if(prevMonth) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                                        </button>
                                        <button onClick={() => {
                                            if (nextMonth) {
                                                setSlideDirection('right');
                                                setSelectedMonth(nextMonth.value);
                                            }
                                        }} style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', cursor: nextMonth ? 'pointer' : 'default', opacity: nextMonth ? 1 : 0.2, transition: 'transform 0.2s, opacity 0.2s, background-color 0.2s, border-color 0.2s', fontSize: '1.1rem' }} onMouseOver={(e) => { if(nextMonth) e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }} onMouseOut={(e) => { if(nextMonth) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                                        </button>
                                    </div>
                                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'white' }}>
                                        {monthObj.label}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'rgba(0,0,0,0.2)', padding: '0.35rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{
                                position: 'absolute', top: '0.35rem', bottom: '0.35rem',
                                left: '0.35rem',
                                width: 'calc(50% - 0.35rem)',
                                background: 'var(--primary)', borderRadius: '10px',
                                transform: activeView === 'calendar' ? 'translateX(0)' : 'translateX(100%)',
                                willChange: 'transform',
                                transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                            }} />
                            <button onClick={() => { setActiveView('calendar'); setViewSlideDir('left'); setSlideDirection(''); }} style={{ position: 'relative', zIndex: 1, padding: '0.5rem 1.5rem', borderRadius: '10px', border: 'none', background: 'transparent', color: activeView === 'calendar' ? 'white' : 'rgba(255,255,255,0.6)', fontWeight: '600', cursor: 'pointer', transition: 'color 0.3s', fontSize: '0.95rem' }}>Calendar</button>
                            <button onClick={() => { setActiveView('timetable'); setViewSlideDir('right'); setSlideDirection(''); }} style={{ position: 'relative', zIndex: 1, padding: '0.5rem 1.5rem', borderRadius: '10px', border: 'none', background: 'transparent', color: activeView === 'timetable' ? 'white' : 'rgba(255,255,255,0.6)', fontWeight: '600', cursor: 'pointer', transition: 'color 0.3s', fontSize: '0.95rem' }}>Timetable</button>
                        </div>
                    </div>
                </div>

                <div style={{ 
                    background: 'transparent', 
                    borderRadius: '16px', 
                    borderTopLeftRadius: '0',
                    borderTopRightRadius: '0',
                    overflow: 'visible',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0
                }}>
                    <div style={{ padding: '0', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, minHeight: 0 }}>
                        {activeView === 'calendar' && (
                            <div key="calendar-view" onWheel={handleWheel} className={viewSlideDir === 'left' ? "animate-slide-left" : ""} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                            <>                    {/* Mobile View */}
                        <div className="mobile-view" style={{ flexDirection: 'column', gap: '1rem' }}>
                        {(() => {
                            const items = [];
                            let lastMonth = '';
                            listData.forEach((dayData) => {
                                    const dateNum = dayData.date.split('.')[0];
                                    const monthYear = `${dayData.date.split('.')[1]}.${dayData.date.split('.')[2]}`;
                                    const monthLabel = MONTHS_LIST.find(m => m.value === monthYear)?.label || monthYear;
                                    const isToday = dayData.date === todayStr;
                                    
                                    if (monthYear !== lastMonth) {
                                        items.push(
                                            <div key={`header-${monthYear}`} style={{
                                                position: 'sticky',
                                                top: topHeaderHeight ? `${topHeaderHeight}px` : '75px',
                                                zIndex: 10,
                                                background: '#0f172a',
                                                padding: '0.5rem 1rem',
                                                margin: '0 -0.5rem',
                                                borderBottomLeftRadius: '16px',
                                                borderBottomRightRadius: '16px',
                                                color: 'white',
                                                fontWeight: 'bold',
                                                fontSize: '1.05rem',
                                                borderBottom: '1px solid rgba(255,255,255,0.1)',
                                                textTransform: 'uppercase',
                                                letterSpacing: '1px'
                                            }}>
                                                {monthLabel}
                                            </div>
                                        );
                                        lastMonth = monthYear;
                                    }
                                    const isExamEvent = dayData.event && dayData.event.toLowerCase().match(/\b(cia|exam(s|inations?)?)\b/);

                                    items.push(
                                        <React.Fragment key={dayData.date}>
                                            <div 
                                                id={isToday ? 'today-marker' : undefined}
                                                style={{ 
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    padding: '1rem 0.75rem', 
                                                    border: isToday ? '2px solid var(--primary)' : (isExamEvent ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(255,255,255,0.05)'),
                                                    borderRadius: '12px',
                                                    background: isToday ? 'rgba(var(--primary-rgb, 59, 130, 246), 0.15)' : (isExamEvent ? 'rgba(245, 158, 11, 0.08)' : (dayData.is_holiday ? 'rgba(239, 68, 68, 0.05)' : 'rgba(0,0,0,0.2)')),
                                                    transition: 'transform 0.2s, opacity 0.2s, background-color 0.2s, border-color 0.2s',
                                                    gap: '0.75rem'
                                                }}
                                                onMouseOver={(e) => { if(!isToday) e.currentTarget.style.background = isExamEvent ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255,255,255,0.05)' }}
                                                onMouseOut={(e) => { if(!isToday) e.currentTarget.style.background = isExamEvent ? 'rgba(245, 158, 11, 0.08)' : (dayData.is_holiday ? 'rgba(239, 68, 68, 0.05)' : 'rgba(0,0,0,0.2)') }}
                                            >
                                                {/* Date & Day Badge */}
                                                <div style={{ 
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                    width: '60px', height: '60px',
                                                    background: isToday ? 'var(--primary)' : (isExamEvent ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.05)'),
                                                    borderRadius: '12px',
                                                    color: isToday ? 'white' : (isExamEvent ? '#fbbf24' : (dayData.is_holiday ? '#ef4444' : 'white')),
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
                                                        <span style={{ 
                                                            fontSize: '0.95rem', 
                                                            fontWeight: '500', 
                                                            color: isExamEvent ? '#fbbf24' : 'white', 
                                                            marginTop: '0.25rem' 
                                                        }}>
                                                            {dayData.event}
                                                        </span>
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
                            return items;
                        })()}
                        </div>

                        {/* Desktop View */}
                        <div className="desktop-view" style={{ flexDirection: 'column', gap: '1.5rem', flex: 1, minHeight: 0 }}>
                        {(() => {
                                const activeMonthKey = monthObj.value;
                                const days = groupedByMonth[activeMonthKey]?.days || [];
                                
                                // Generate grid cells
                                const [monthStr, yearStr] = activeMonthKey.split('.');
                                const monthNum = parseInt(monthStr, 10);
                                const yearNum = parseInt(yearStr, 10);
                                const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
                                const rawFirstDay = new Date(yearNum, monthNum - 1, 1).getDay();
                                const firstDayOfWeek = (rawFirstDay + 6) % 7; // Shift to Monday-first (0 = Mon, 6 = Sun)
                                
                                const prevMonthDays = new Date(yearNum, monthNum - 1, 0).getDate();
                                const emptyCells = Array.from({ length: firstDayOfWeek }).map((_, i) => {
                                    const prevDateNum = prevMonthDays - firstDayOfWeek + 1 + i;
                                    return (
                                        <div key={`empty-${i}`} style={{ 
                                            padding: '0.5rem 0.75rem', 
                                            background: 'rgba(0,0,0,0.1)', 
                                            borderRight: '1px solid rgba(255,255,255,0.05)', 
                                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                                            opacity: 0.3,
                                            minHeight: 0
                                        }}>
                                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>
                                                {prevDateNum}
                                            </span>
                                        </div>
                                    );
                                });
                                
                                const dayCells = Array.from({ length: daysInMonth }).map((_, i) => {
                                    const dateNum = i + 1;
                                    const dateStr = `${String(dateNum).padStart(2, '0')}.${monthStr}.${yearStr}`;
                                    
                                    const dayData = days.find(d => d.date === dateStr);
                                    const isToday = dateStr === todayStr;
                                    
                                    const tParts = todayStr ? todayStr.split('.') : null;
                                    const todayDate = tParts ? new Date(tParts[2], parseInt(tParts[1])-1, parseInt(tParts[0])) : new Date();
                                    const isPast = new Date(yearNum, monthNum - 1, dateNum) < todayDate;
                                    const isExamEvent = dayData?.event && dayData.event.toLowerCase().match(/\b(cia|exam(s|inations?)?)\b/);
                                    
                                    return (
                                        <div key={dateStr} style={{ 
                                            padding: '0.5rem 0.75rem', 
                                            background: isToday ? 'rgba(var(--primary-rgb, 59, 130, 246), 0.1)' : (isExamEvent ? 'rgba(245, 158, 11, 0.08)' : (dayData?.is_holiday ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255,255,255,0.02)')), 
                                            borderRight: '1px solid rgba(255,255,255,0.05)', 
                                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                                            border: isToday ? '1px solid var(--primary)' : (isExamEvent ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(255,255,255,0.05)'),
                                            display: 'flex', flexDirection: 'column', gap: '0.2rem',
                                            minHeight: 0,
                                            opacity: isPast ? 0.4 : 1,
                                            transition: 'opacity 0.2s, background 0.2s',
                                        }}
                                        onMouseOver={(e) => { if(!isToday) e.currentTarget.style.background = isExamEvent ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255,255,255,0.05)' }}
                                        onMouseOut={(e) => { if(!isToday) e.currentTarget.style.background = isExamEvent ? 'rgba(245, 158, 11, 0.08)' : (dayData?.is_holiday ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255,255,255,0.02)') }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: isToday ? 'var(--primary)' : (isExamEvent ? '#fbbf24' : (dayData?.is_holiday ? '#ef4444' : 'white')) }}>
                                                    {dateNum}
                                                </span>
                                                {dayData?.is_working_day && (
                                                    <span style={{ background: 'var(--primary)', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '6px', fontWeight: 'bold' }}>
                                                        D{dayData.day_order}
                                                    </span>
                                                )}
                                            </div>
                                            
                                            {dayData?.event && (
                                                <div 
                                                    title={dayData.event}
                                                    style={{ 
                                                    fontSize: '0.85rem', 
                                                    fontWeight: '500', 
                                                    color: isExamEvent ? '#fbbf24' : 'rgba(255,255,255,0.9)', 
                                                    lineHeight: '1.2',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}>
                                                    {dayData.event}
                                                </div>
                                            )}
                                        </div>
                                    );
                                });

                                const totalCells = emptyCells.length + dayCells.length;
                                const totalWeeks = Math.ceil(totalCells / 7);
                                const remainingCells = (totalWeeks * 7) - totalCells;
                                const trailingEmptyCells = Array.from({ length: remainingCells }).map((_, i) => {
                                    const nextDateNum = i + 1;
                                    return (
                                        <div key={`trail-${i}`} style={{ 
                                            padding: '0.5rem 0.75rem', 
                                            background: 'rgba(0,0,0,0.1)', 
                                            borderRight: '1px solid rgba(255,255,255,0.05)', 
                                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                                            opacity: 0.3,
                                            minHeight: 0
                                        }}>
                                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>
                                                {nextDateNum}
                                            </span>
                                        </div>
                                    );
                                });

                                return (
                                    <React.Fragment>
                                        {/* Month Grid */}
                                        <div key={activeMonthKey} className={slideDirection === 'left' ? 'animate-slide-left' : (slideDirection === 'right' ? 'animate-slide-right' : '')} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                                            <div style={{ 
                                                background: 'rgba(0,0,0,0.2)', 
                                                borderRadius: '16px', 
                                                border: '1px solid rgba(255,255,255,0.05)', 
                                                display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0,
                                                overflow: 'hidden' 
                                            }}>
                                                <div style={{ 
                                                    display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', 
                                                    background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)',
                                                    fontWeight: 'bold', textAlign: 'center'
                                                }}>
                                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                                        <div key={day} style={{ padding: '0.75rem', borderRight: day !== 'Sun' ? '1px solid rgba(255,255,255,0.05)' : 'none', color: day === 'Sun' ? '#ef4444' : 'rgba(255,255,255,0.7)' }}>{day}</div>
                                                    ))}
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: `repeat(${totalWeeks}, 1fr)`, flex: 1, minHeight: 0 }}>
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
                        </div>
                        )}

                        {activeView === 'timetable' && (
                            <div key="timetable-view" className={viewSlideDir === 'right' ? "animate-slide-right" : ""} style={{ display: 'block', height: '100%' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.5rem 0', height: '100%' }}>
                                <div className="mobile-view" style={{ flexDirection: 'column', height: 'auto' }}>
                                        {/* Timetable List */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%' }}>
                                            {(() => {
                                                if (isTimetableLoading && !dynamicTimetable.userOverrides) return <div style={{ color: 'white', textAlign: 'center', padding: '2rem' }}>Loading...</div>;
                                                const dayTimetable = dynamicTimetable.timetable[selectedDayOrder];
                                                if (!dayTimetable) return <div style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '2rem' }}>No timetable available for Day {selectedDayOrder}</div>;
                                                
                                                const periods = [
                                                    { id: '1', type: 'class' },
                                                    { id: '2', type: 'class' },
                                                    { id: '3', type: 'class' },
                                                    { id: '4', type: 'class' },
                                                    { id: '5', type: 'class' }
                                                ];

                                                return periods.map((p, idx) => {
                                                    const timeStr = dynamicTimetable.timings[p.id];
                                                    const rawSubject = p.type === 'class' ? dayTimetable[p.id] : 'Break';
                                                    const subject = p.type === 'class' && dynamicTimetable.aliases && dynamicTimetable.aliases[rawSubject] ? dynamicTimetable.aliases[rawSubject] : rawSubject;
                                                    
                                                    let isActive = false;
                                                    if (timeStr && selectedDayOrder === todayDayOrder) {
                                                        const [startStr, endStr] = timeStr.split(' - ');
                                                        const [sh, sm] = startStr.split(':').map(Number);
                                                        const [eh, em] = endStr.split(':').map(Number);
                                                        const startMinutes = sh * 60 + sm;
                                                        const endMinutes = eh * 60 + em;
                                                        isActive = nowMinutes >= startMinutes && nowMinutes < endMinutes;
                                                    }

                                                    return (
                                                        <div key={idx} style={{ 
                                                            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.25rem 1rem',
                                                            background: p.type === 'break' ? 'rgba(255,255,255,0.02)' : (isActive ? 'rgba(59, 130, 246, 0.1)' : 'rgba(0,0,0,0.2)'),
                                                            border: isActive ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid rgba(255,255,255,0.05)', 
                                                            borderRadius: '16px',
                                                            boxShadow: isActive ? '0 0 15px rgba(59, 130, 246, 0.2)' : 'none',
                                                            transition: 'transform 0.3s, opacity 0.3s, background-color 0.3s, border-color 0.3s',
                                                            minHeight: '85px'
                                                        }}>
                                                            <div style={{ 
                                                                width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                                                background: p.type === 'break' ? 'transparent' : 'rgba(255,255,255,0.05)', borderRadius: '12px',
                                                                color: p.type === 'break' ? 'rgba(255,255,255,0.4)' : 'white', fontWeight: 'bold', fontSize: '1.1rem'
                                                            }}>
                                                                {p.type === 'class' ? p.id : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>}
                                                            </div>
                                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                                                <div 
                                                                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: p.type === 'class' ? 'context-menu' : 'default', overflow: 'hidden' }}
                                                                    onContextMenu={(e) => {
                                                                        if (p.type === 'class') {
                                                                            e.preventDefault();
                                                                            setEditModal({ dayOrder: selectedDayOrder, period: p.id, subject: rawSubject, alias: dynamicTimetable.aliases?.[rawSubject] || '' });
                                                                            setSelectedSubject(rawSubject === 'Elective (Tap to Select)' ? '' : rawSubject);
                                                                            setIsDropdownOpen(false);
                                                                        }
                                                                    }}
                                                                >
                                                                    <span title={subject} style={{ fontSize: '1.05rem', fontWeight: '600', color: p.type === 'break' ? 'rgba(255,255,255,0.5)' : 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: '100%' }}>{subject}</span>
                                                                </div>
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

                                <div className="desktop-view" style={{ flex: 1, minHeight: 0, flexDirection: 'column' }}>
                                    <div style={{ 
                                        background: 'rgba(0,0,0,0.2)', 
                                        borderRadius: '16px', 
                                        border: '1px solid rgba(255,255,255,0.05)', 
                                        overflow: 'hidden',
                                        display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0
                                    }}>
                                        <div style={{ 
                                            display: 'grid', gridTemplateColumns: '100px repeat(5, 1fr)', 
                                            background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)',
                                            fontWeight: 'bold'
                                        }}>
                                            <div style={{ padding: '1rem', borderRight: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                                                <button onClick={handleSyncClass} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem', cursor: 'pointer', marginTop: '4px' }}>Sync</button>
                                            </div>
                                            {['1', '2', '3', '4', '5'].map(p => (
                                                <div key={p} style={{ padding: '1rem', borderRight: p !== '5' ? '1px solid rgba(255,255,255,0.1)' : 'none', textAlign: 'center' }}>
                                                    <div>{p}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>{dynamicTimetable.timings[p]}</div>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        <div style={{ display: 'grid', gridTemplateRows: 'repeat(6, 1fr)', flex: 1, minHeight: 0 }}>
                                            {[1, 2, 3, 4, 5, 6].map((day, rowIndex) => (
                                                <div key={day} style={{ 
                                                    display: 'grid', gridTemplateColumns: '100px repeat(5, 1fr)', 
                                                    borderBottom: rowIndex !== 5 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                                    background: selectedDayOrder === day.toString() ? 'rgba(var(--primary-rgb, 59, 130, 246), 0.15)' : 'transparent',
                                                    transition: 'background 0.2s',
                                                    minHeight: 0
                                                }}>
                                                    <div style={{ padding: '0.5rem 1rem', borderRight: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                                        Day {day}
                                                    </div>
                                                {['1', '2', '3', '4', '5'].map(p => {
                                                    const rawSubject = dynamicTimetable.timetable[day] ? dynamicTimetable.timetable[day][p] : '-';
                                                    const subject = rawSubject !== '-' && dynamicTimetable.aliases && dynamicTimetable.aliases[rawSubject] ? dynamicTimetable.aliases[rawSubject] : rawSubject;
                                                    
                                                    return (
                                                        <div key={p} style={{ 
                                                            padding: '0.5rem 1rem', 
                                                            borderRight: p !== '5' ? '1px solid rgba(255,255,255,0.05)' : 'none', 
                                                            textAlign: 'center',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            color: 'white',
                                                            fontWeight: '500',
                                                            position: 'relative',
                                                            cursor: 'context-menu',
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            maxWidth: '100%'
                                                        }}
                                                        title={rawSubject}
                                                        onContextMenu={(e) => {
                                                            e.preventDefault();
                                                            setEditModal({ dayOrder: day.toString(), period: p, subject: rawSubject, alias: dynamicTimetable.aliases?.[rawSubject] || '' });
                                                            setSelectedSubject(rawSubject === 'Elective (Tap to Select)' ? '' : rawSubject);
                                                            setIsDropdownOpen(false);
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
                            </div>
                        </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Floating Mobile Today Button */}
            {activeView === 'calendar' && (
                <button
                    className="mobile-view"
                    onClick={handleTodayClick}
                    style={{
                        position: 'fixed',
                        bottom: '80px', // Above bottom navigation if any
                        right: '20px',
                        zIndex: 50,
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50px',
                        padding: '12px 24px',
                        fontWeight: 'bold',
                        fontSize: '0.95rem',
                        boxShadow: '0 4px 20px rgba(var(--primary-rgb, 59, 130, 246), 0.6)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(var(--primary-rgb, 59, 130, 246), 0.8)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(var(--primary-rgb, 59, 130, 246), 0.6)'; }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    Today
                </button>
            )}

            {/* Edit Modal */}
            {editModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ background: '#1e1e1e', padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '400px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <h3 style={{ margin: '0 0 1rem 0', color: 'white' }}>Edit Period</h3>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            Day {editModal.dayOrder}, Period {editModal.period}
                        </p>
                        <form onSubmit={handleSaveOverride}>
                            {subjectsList.length > 0 ? (
                                <div style={{ position: 'relative', marginBottom: '1rem' }}>
                                    <input type="hidden" name="subject" value={selectedSubject} />
                                    <div 
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: '#1e1e1e', color: 'white', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                    >
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {selectedSubject || 'Select a subject'}
                                        </span>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginLeft: '8px' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
                                    </div>
                                    {isDropdownOpen && (
                                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', background: '#2d2d2d', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', zIndex: 10, maxHeight: '200px', overflowY: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                                            {subjectsList.map(subj => (
                                                <div 
                                                    key={subj.code} 
                                                    onClick={() => { setSelectedSubject(subj.desc); setIsDropdownOpen(false); }}
                                                    style={{ padding: '0.75rem', color: 'white', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.95rem' }}
                                                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    {subj.desc}
                                                </div>
                                            ))}
                                            <div 
                                                onClick={() => { setSelectedSubject('Free Period'); setIsDropdownOpen(false); }}
                                                style={{ padding: '0.75rem', color: 'white', cursor: 'pointer', fontSize: '0.95rem' }}
                                                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                Free Period
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <input 
                                    name="subject"
                                    defaultValue={editModal.subject === 'Elective (Tap to Select)' ? '' : editModal.subject}
                                    placeholder="Enter Subject Code"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: 'white', marginBottom: '1rem', outline: 'none' }}
                                    autoFocus
                                />
                            )}
                            <input 
                                name="alias"
                                defaultValue={editModal.alias}
                                placeholder="Alias (e.g. RDBMS) - Optional"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: 'white', marginBottom: '1.5rem', outline: 'none' }}
                            />
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" onClick={() => setEditModal(null)} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'white', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Save Override</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
