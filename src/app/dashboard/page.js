'use client';
import { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { fetcher } from '@/utils/fetcher';
import Link from 'next/link';
import calendarData from '../../../calendar.json';

import DashboardReminders, { useReminders } from '@/components/DashboardReminders';

// Helper to get today's date in DD.MM.YYYY format
const getTodayStr = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
};

const getStatusColor = (status) => {
    if (status === 'P') return '#4db8ff'; // vibrant blue
    if (status === 'A') return '#f59f00'; // vibrant orange
    if (status === 'ML' || status === 'OD') return '#4caf50'; // green
    if (status === 'CL') return '#c0ca33';
    if (status === 'DA' || status === 'LA') return '#e11d48'; 
    return 'transparent'; // empty or other
};

const getWeatherCaption = (condition, temp) => {
    const c = (condition || '').toLowerCase();
    if (c.includes('rain') || c.includes('shower') || c.includes('drizzle')) return "Don't forget your umbrella! ☔";
    if (c.includes('thunder')) return "Thunderstorms expected. Stay safe! 🌩️";
    if (c.includes('snow')) return "Bundle up, it's snowing! ❄️";
    if (temp > 30 && (c.includes('clear') || c.includes('sun'))) return "It's hot! Wear sunscreen and stay hydrated. 🧴☀️";
    if (temp < 15) return "It's chilly! Grab a jacket. 🧥";
    if (c.includes('clear') || c.includes('sun')) return "Beautiful day! Enjoy the sunshine. 🌞";
    if (c.includes('cloud')) return "A bit cloudy, but a great day ahead. ☁️";
    if (c.includes('fog') || c.includes('mist')) return "It's foggy. Be careful if you're driving! 🌫️";
    return "Have a great day ahead! ✨";
};

export default function DashboardHomePage() {
    const router = useRouter();
    const [todayStr, setTodayStr] = useState('');
    const [todayCalendar, setTodayCalendar] = useState(null);
    const reminders = useReminders();

    useEffect(() => {
        const today = getTodayStr();
        setTodayStr(today);
        const calData = calendarData.find(d => d.date === today) || null;
        setTodayCalendar(calData);
    }, []);

    const { data: attendanceData, error: attendanceError, mutate: mutateAttendance } = useSWR('/api/dashboard', fetcher, { keepPreviousData: true });
    const { data: financeData, error: financeError, mutate: mutateFinance } = useSWR('/api/finance', fetcher);
    const { data: libraryData, mutate: mutateLibrary } = useSWR('/api/library', fetcher);
    const { data: weatherData, mutate: mutateWeather } = useSWR('/api/weather', fetcher);
    const { data: timetableData, mutate: mutateTimetable } = useSWR('/api/timetable', fetcher);
    const { data: profileData, mutate: mutateProfile } = useSWR('/api/profile', fetcher);
    const { data: gradesData, mutate: mutateGrades } = useSWR('/api/grades', fetcher);

    const [liveMins, setLiveMins] = useState(0);
    const [liveCooldown, setLiveCooldown] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const [shakeTimeout, setShakeTimeout] = useState(null);
    const [currentTime, setCurrentTime] = useState(null);
    const [showHourlyWeather, setShowHourlyWeather] = useState(false);
    const [weatherInteracted, setWeatherInteracted] = useState(false);
    const weatherScrollRef = useRef(null);

    const handleWeatherScroll = (e) => {
        if (weatherScrollRef.current) {
            weatherScrollRef.current.scrollBy({ left: e.deltaY, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        setCurrentTime(new Date());
        const timer = setInterval(() => setCurrentTime(new Date()), 10000);
        return () => clearInterval(timer);
    }, []);

    const handleSyncClick = async () => {
        if (isSyncing) return;
        if (liveCooldown > 0) {
            // Shake effect
            const el = document.getElementById('sync-bubble');
            if (el) {
                el.classList.remove('shake-anim');
                void el.offsetWidth; // trigger reflow
                el.classList.add('shake-anim');
            }
            return;
        }
        setIsSyncing(true);
        try {
            const endpoints = [
                { url: '/api/dashboard?force=true', mutate: mutateAttendance },
                { url: '/api/finance?force=true', mutate: mutateFinance },
                { url: '/api/library?force=true', mutate: mutateLibrary },
                { url: '/api/profile?force=true', mutate: mutateProfile },
                { url: '/api/grades?force=true', mutate: mutateGrades },
                { url: '/api/subjects?force=true', mutate: null },
                { url: '/api/leaves?force=true', mutate: null }
            ];

            const results = await Promise.allSettled(
                endpoints.map(ep => fetch(ep.url).then(res => res.json()))
            );

            results.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value.success && endpoints[index].mutate) {
                    endpoints[index].mutate(result.value, { revalidate: false });
                }
            });

            // Smooth pulse animation to indicate new data
            const card = document.getElementById('attendance-card');
            if (card) {
                card.style.transition = 'box-shadow 0.5s ease, border-color 0.5s ease';
                card.style.boxShadow = '0 0 30px rgba(74, 222, 128, 0.2)';
                card.style.borderColor = 'rgba(74, 222, 128, 0.5)';
                setTimeout(() => {
                    card.style.boxShadow = 'none';
                    card.style.borderColor = 'rgba(255,255,255,0.1)';
                }, 1500);
            }
        } catch (e) {
            console.error('Sync failed', e);
        } finally {
            setIsSyncing(false);
        }
    };

    useEffect(() => {
        if (attendanceData) {
            setTimeout(() => {
                setLiveMins(attendanceData.lastSyncMinutesAgo);
                setLiveCooldown(attendanceData.cooldownRemaining);
            }, 0);
        }
    }, [attendanceData]);

    useEffect(() => {
        const interval = setInterval(() => {
            setLiveMins(prev => (prev !== undefined && prev !== null) ? prev + 1 : prev);
            setLiveCooldown(prev => prev > 0 ? prev - 1 : 0);
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if ((attendanceError && attendanceError.status === 401) || (financeError && financeError.status === 401)) {
            router.push('/?error=401');
        }
    }, [attendanceError, financeError, router]);

    // Handle day order classes
    let todaysClasses = [];
    if (todayCalendar && todayCalendar.day_order && timetableData?.timetable) {
        const dayOrderStr = String(todayCalendar.day_order);
        const dayTimetable = timetableData.timetable[dayOrderStr];
        if (dayTimetable) {
            todaysClasses = Object.entries(dayTimetable).map(([period, subject]) => {
                const isOverride = timetableData.userOverrides?.some(o => o.dayOrder === dayOrderStr && o.period === period);
                const isAlias = !!timetableData.aliases?.[subject];
                const displaySubject = timetableData.aliases?.[subject] || subject;
                return { period, subject: displaySubject, isOverride, isAlias, originalSubject: subject };
            });
        }
    }

    // Attendance stats
    const { stats = {} } = attendanceData || {};
    const totalConducted = [stats.hrsPresent, stats.hrsAbsent, stats.hrsCL, stats.hrsML, stats.hrsOD, stats.hrsDA, stats.hrsLA].reduce((a, b) => a + (b || 0), 0);
    const currentPresent = (stats.hrsPresent || 0) + (stats.hrsML || 0) + (stats.hrsOD || 0);
    const currentPercentage = totalConducted > 0 ? (currentPresent / totalConducted) * 100 : 0;

    // Finance & Library dues
    let pendingDuesTotal = 0;
    if (financeData?.due?.data) {
        pendingDuesTotal += financeData.due.data.reduce((sum, item) => {
            const amt = parseFloat(String(item.dueAmount).replace(/,/g, ''));
            return sum + (isNaN(amt) ? 0 : amt);
        }, 0);
    }
    if (libraryData?.library?.fines) {
        pendingDuesTotal += libraryData.library.fines.reduce((sum, item) => {
            if (item.status && item.status.toLowerCase().includes('paid')) {
                return sum;
            }
            const amt = parseFloat(String(item.fineAmount).replace(/,/g, ''));
            return sum + (isNaN(amt) ? 0 : amt);
        }, 0);
    }

    // Grades & CGPA
    let currentCgpa = 'N/A';
    if (gradesData?.grades?.examMarks) {
        let totalCreditPoints = 0;
        let totalCreditsForCgpa = 0;
        gradesData.grades.examMarks.forEach(subj => {
            const credit = parseFloat(subj.credit);
            const points = parseFloat(subj.points);
            if (!isNaN(credit) && !isNaN(points) && credit > 0) {
                totalCreditPoints += (credit * points);
                totalCreditsForCgpa += credit;
            }
        });
        if (totalCreditsForCgpa > 0) {
            currentCgpa = (totalCreditPoints / totalCreditsForCgpa).toFixed(2);
        }
    }

    // Greeting logic
    let greeting = 'Good day';
    const hour = new Date().getHours();
    if (hour < 12) greeting = 'Good Morning';
    else if (hour < 18) greeting = 'Good Afternoon';
    else greeting = 'Good Evening';

    let firstName = '';
    if (profileData?.profile?.name) {
        firstName = profileData.profile.name.split(' ')[0];
        // Capitalize first letter properly
        firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
    }

    return (
        <main className="main-container dashboard-main animate-slide-up" style={{ justifyContent: 'flex-start' }}>
            <style>{`
                .dash-greeting {
                    font-size: 2rem;
                    max-width: 100%;
                }
                @media (max-width: 768px) {
                    .dash-greeting-container {
                        width: 100%;
                    }
                    .dash-greeting {
                        font-size: clamp(1.4rem, 7vw, 1.9rem) !important;
                        width: 100%;
                        padding-right: 0.5rem;
                    }
                }
            `}</style>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                <div className="dash-greeting-container" style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                    <h1 className="text-gradient dash-greeting" style={{ margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {firstName ? `${greeting}, ${firstName}!` : "Overview"}
                    </h1>
                    {todayCalendar?.event && (
                        <div style={{ background: "rgba(168, 85, 247, 0.15)", color: "#d8b4fe", border: "1px solid rgba(168, 85, 247, 0.3)", padding: "0.35rem 0.85rem", borderRadius: "999px", fontWeight: "600", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                            {todayCalendar.event}
                        </div>
                    )}
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
{attendanceData && (

                    <div 
                       id="sync-bubble"
                       onClick={handleSyncClick}
                       style={{ 
                           background: 'rgba(255,255,255,0.05)', 
                           border: '1px solid rgba(255,255,255,0.1)', 
                           padding: '0.35rem 0.85rem', 
                           borderRadius: '999px',
                           fontSize: '0.75rem',
                           color: 'rgba(255,255,255,0.8)',
                           display: 'flex',
                           alignItems: 'center',
                           gap: '0.5rem',
                           cursor: (isSyncing || liveCooldown > 0) ? 'not-allowed' : 'pointer',
                           transition: 'transform 0.3s ease, opacity 0.3s ease, background-color 0.3s ease, border-color 0.3s ease',
                           userSelect: 'none'
                       }}
                       onMouseOver={e => { if (!isSyncing && liveCooldown === 0) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                       onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    >
                       <style>{`
                           @keyframes shake {
                               0%, 100% { transform: translateX(0); }
                               25% { transform: translateX(-4px); }
                               75% { transform: translateX(4px); }
                           }
                           .shake-anim {
                               animation: shake 0.3s ease-in-out;
                           }
                           @keyframes spin {
                               100% { transform: rotate(360deg); }
                           }
                           .spin-anim {
                               animation: spin 1s linear infinite;
                           }
                       `}</style>
                       {isSyncing ? (
                           <>
                               <svg className="spin-anim" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#60a5fa' }}>
                                   <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                               </svg>
                               <span>Syncing...</span>
                           </>
                       ) : (
                           <>
                               <span style={{ 
                                   width: 8, 
                                   height: 8, 
                                   background: (liveCooldown && liveCooldown > 0) ? '#facc15' : (attendanceData.isCached ? '#4ade80' : '#60a5fa'), 
                                   borderRadius: '50%', 
                                   display: 'inline-block',
                                   boxShadow: (liveCooldown && liveCooldown > 0) ? '0 0 8px rgba(250,204,21,0.5)' : 'none',
                                   transition: 'background 0.3s ease'
                               }}></span>
                               <span>{attendanceData.isCached ? `Synced ${(() => {
                                   if (liveMins < 60) return `${liveMins}m`;
                                   const hours = Math.floor(liveMins / 60);
                                   if (hours < 24) return `${hours}h`;
                                   const days = Math.floor(hours / 24);
                                   if (days < 30) return `${days}d`;
                                   const months = Math.floor(days / 30);
                                   if (months < 12) return `${months}m`;
                                   const years = Math.floor(months / 12);
                                   return `${years}y`;
                               })()} ago` : 'Just synced'}</span>
                           </>
                       )}
                    </div>
                )}
                </div>
            </div>

            <div className="dashboard-grid" style={{ display: 'grid', gap: '1.5rem', alignItems: 'stretch' }}>
                <style>{`
                    .weather-widget:hover .weather-arrow {
                        opacity: 1 !important;
                        transform: translateX(0) !important;
                    }
                    .weather-arrow {
                        opacity: 0;
                        transform: translateX(10px);
                        transition: all 0.3s ease;
                        cursor: pointer;
                        position: absolute;
                        right: 1.5rem;
                        background: rgba(255,255,255,0.1);
                        border-radius: 50%;
                        width: 32px;
                        height: 32px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 10;
                    }
                    .weather-arrow:hover {
                        background: rgba(255,255,255,0.2);
                    }
                    .weather-arrow-left {
                        right: auto;
                        left: 1.5rem;
                        transform: translateX(-10px);
                    }
                    @media (min-width: 1024px) {
                        .dashboard-grid { 
                            grid-template-columns: 1fr 420px; 
                            flex: 1;
                            min-height: 0;
                        }
                        .dashboard-main { 
                            height: 100vh;
                            overflow: hidden;
                            display: flex;
                            flex-direction: column;
                            padding-bottom: 3rem !important;
                        }
                        .dash-left-col, .dash-right-col {
                            min-height: 0;
                            min-width: 0;
                        }
                        .desktop-contents {
                            grid-template-columns: 1fr 2fr !important;
                        }
                    }
                    @media (max-width: 1023px) {
                        .dashboard-grid { grid-template-columns: 1fr; }
                        .pc-only { display: none !important; }
                        .dash-left-col {
                            display: grid !important;
                            grid-template-columns: 1fr 1fr;
                            gap: 1.5rem;
                        }
                        .desktop-contents {
                            display: contents !important;
                        }
                        .pending-wrapper {
                            grid-column: 1 / 2;
                            order: 1;
                            padding: 1rem !important;
                            aspect-ratio: 1 / 1 !important;
                        }
                        .pc-weather-widget {
                            grid-column: 2 / 3;
                            order: 2;
                            padding: 1rem !important;
                            aspect-ratio: 1 / 1 !important;
                        }
                        .weather-inner-wrapper {
                            height: 100% !important;
                        }
                        .weather-main-view {
                            display: block !important;
                            height: 100% !important;
                            width: 100% !important;
                            transform: none !important;
                            opacity: 1 !important;
                        }
                        .hourly-view {
                            display: none !important;
                        }
                        .weather-top-row {
                            display: block !important;
                        }
                        .weather-icon-main {
                            position: absolute !important;
                            top: 0 !important;
                            left: 0 !important;
                            width: 50px !important;
                            height: 50px !important;
                        }
                        .weather-temp-main {
                            position: absolute !important;
                            top: 50% !important;
                            left: 50% !important;
                            transform: translate(-50%, -50%) !important;
                            font-size: 3.5rem !important;
                            margin: 0 !important;
                        }
                        .weather-desc-container {
                            position: absolute !important;
                            top: 72% !important;
                            left: 0 !important;
                            width: 100% !important;
                            align-items: center !important;
                            text-align: center !important;
                        }
                        .weather-desc-main {
                            font-size: 1rem !important;
                        }
                        .weather-caption-main {
                            display: none !important;
                        }
                        .attendance-wrapper {
                            grid-column: 1 / -1;
                            order: 3;
                        }
                        .grades-wrapper {
                            grid-column: 1 / -1;
                            order: 4;
                        }
                    }
                `}</style>
    {/* Left Main Column (Takes 2/3 width on PC) */}
    <div className="dash-left-col" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="desktop-contents" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1.5rem' }}>
                    {/* Finance Snapshot Widget with Reminders inside */}
                    <div className="glass-panel widget-square pending-wrapper" style={{ padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', border: '1px solid rgba(255,255,255,0.1)', minWidth: 0, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <Link href="/dashboard/finance" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'flex-start', flexWrap: 'nowrap' }}>
                                <h2 style={{ fontSize: '1rem', fontWeight: '700', color: 'rgba(255,255,255,0.9)', margin: 0, lineHeight: 1.2, whiteSpace: 'nowrap' }}>Pending Items</h2>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" style={{ flexShrink: 0 }}><path d="M9 18l6-6-6-6"/></svg>
                            </Link>
                        </div>
                        {financeData ? (
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
                                {pendingDuesTotal > 0 ? (
                                    <div style={{ marginBottom: '1rem' }}>
                                        <div style={{ fontSize: '2rem', fontWeight: '800', color: '#ef4444', lineHeight: 1, marginBottom: '0.5rem', wordBreak: 'break-all' }}>
                                            ₹{pendingDuesTotal.toLocaleString('en-IN')}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Pending fees</div>
                                    </div>
                                ) : (
                                    reminders.length === 0 && (
                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#4ade80', lineHeight: 1, wordBreak: 'break-word', textAlign: 'center' }}>
                                                All Clear!
                                            </div>
                                        </div>
                                    )
                                )}
                                {reminders.length > 0 && (
                                    <div style={{ marginTop: 'auto', margin: '0 -1.25rem -1.25rem -1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minWidth: 0 }}>
                                        <DashboardReminders style={{ marginBottom: 0, marginTop: 'auto' }} />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="skeleton-container" style={{ marginTop: 'auto', padding: 0 }}>
                                <div className="skeleton skeleton-text" style={{ height: '2rem', width: '60%', marginBottom: '0.5rem' }}></div>
                                <div className="skeleton skeleton-text-short" style={{ width: '40%' }}></div>
                            </div>
                        )}
                    </div>

                    {/* Attendance Snapshot Widget */}
                    <div className="attendance-wrapper">
                        <Link href="/dashboard/attendance" style={{ textDecoration: 'none' }}>
                            <div id="attendance-card" className="glass-panel" style={{ padding: '1.25rem', height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'transform 0.2s, background 0.2s, box-shadow 0.5s, border-color 0.5s', border: '1px solid rgba(255,255,255,0.1)' }}
                                 onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                 onMouseOut={e => e.currentTarget.style.background = 'rgba(15, 23, 42, 0.6)'}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'rgba(255,255,255,0.9)', margin: 0 }}>Attendance</h2>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                    {attendanceData ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                            {(() => {
                                                const reqClasses = Math.ceil((0.8 * totalConducted - currentPresent) / 0.2);
                                                const safeToMiss = Math.floor((currentPresent - 0.8 * totalConducted) / 0.8);
                                                const isDanger = currentPercentage < 80;
                                                const iconColor = isDanger ? '#ef4444' : '#4ade80';
                                                const cardBg = isDanger ? 'rgba(239, 68, 68, 0.1)' : 'rgba(74, 222, 128, 0.1)';
                                                const borderColor = isDanger ? 'rgba(239, 68, 68, 0.2)' : 'rgba(74, 222, 128, 0.2)';

                                                return (
                                                    <div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                            <div style={{ fontSize: '2.5rem', fontWeight: '800', color: iconColor, lineHeight: 1 }}>
                                                                {currentPercentage.toFixed(1)}%
                                                            </div>
                                                            
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: cardBg, padding: '0.35rem 0.65rem', borderRadius: '999px', border: `1px solid ${borderColor}` }}>
                                                                <div style={{ color: iconColor, display: 'flex' }}>
                                                                    {isDanger ? (
                                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                                                    ) : (
                                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                                                    )}
                                                                </div>
                                                                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'rgba(255,255,255,0.9)' }}>
                                                                    {isDanger ? (
                                                                        <>Attend <strong style={{color: '#ef4444'}}>{reqClasses > 0 ? reqClasses : 1}h</strong> more</>
                                                                    ) : (
                                                                        <>Safe to miss <strong style={{color: '#4ade80'}}>{safeToMiss > 0 ? safeToMiss : 0}h</strong></>
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        
                                                        <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.3)', borderRadius: '3px', overflow: 'hidden', position: 'relative' }}>
                                                            <div style={{ width: `${Math.min(currentPercentage, 100)}%`, height: '100%', background: iconColor, borderRadius: '3px' }}></div>
                                                            <div style={{ position: 'absolute', left: '80%', top: 0, bottom: 0, width: '2px', background: 'rgba(255,255,255,0.5)', zIndex: 2 }}></div>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                            
                                            {attendanceData.allDays && attendanceData.allDays.length > 0 && (
                                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                                                    {attendanceData.allDays.slice(0, 5).map((day, idx) => (
                                                        <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem 0.25rem', borderRadius: '8px', minWidth: '40px' }}>
                                                            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>{day.date.split('-')[0]}</span>
                                                            <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                                                {day.hours.map((status, i) => (
                                                                    <div key={i} style={{
                                                                        width: '6px', height: '6px', borderRadius: '50%',
                                                                        background: getStatusColor(status),
                                                                        opacity: status === '-' ? 0.2 : 1
                                                                    }} title={status} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="skeleton-container" style={{ marginTop: 'auto', padding: 0 }}>
                                <div className="skeleton skeleton-text" style={{ height: '2rem', width: '60%', marginBottom: '0.5rem' }}></div>
                                <div className="skeleton skeleton-text-short" style={{ width: '40%' }}></div>
                            </div>
                                    )}
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
        
        {/* Weather & Day Overview Widget */}
        <div className="glass-panel weather-widget pc-weather-widget" style={{ padding: '1.5rem', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.05))', border: '1px solid rgba(59, 130, 246, 0.2)', minWidth: 0, textAlign: 'center', position: 'relative' }}>
            {weatherData ? (
                <div className="weather-inner-wrapper" style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80px' }}>
                    
                    {/* Main Weather View */}
                    <div className="weather-main-view" style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap', transition: weatherInteracted ? 'transform 0.4s ease, opacity 0.4s ease' : 'none', transform: showHourlyWeather ? 'translateX(-100%)' : 'translateX(0)', opacity: showHourlyWeather ? 0 : 1, position: showHourlyWeather ? 'absolute' : 'relative', width: '100%' }}>
                        <div className="weather-top-row" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <img className="weather-icon-main" src={`https://openweathermap.org/img/wn/${weatherData.icon}@2x.png`} alt="weather icon" style={{ width: '80px', height: '80px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }} />
                            <div className="weather-temp-main" style={{ fontSize: '3rem', fontWeight: '800', color: 'white', lineHeight: 1, position: 'relative', display: 'inline-block' }}>
                                {Math.round(weatherData.temp)}
                                <span style={{ position: 'absolute', left: '100%', top: '0.1em', fontSize: '0.5em' }}>°</span>
                            </div>
                        </div>
                        <div className="weather-desc-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
                            <div className="weather-desc-main" style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.9)', fontWeight: '700', textTransform: 'capitalize' }}>
                                {weatherData.description}
                            </div>
                            <div className="weather-caption-main" style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.25rem' }}>
                                {getWeatherCaption(weatherData.condition, weatherData.temp)}
                            </div>
                        </div>
                        {weatherData.hourly && weatherData.hourly.length > 0 && (
                            <div className="weather-arrow pc-only" onClick={() => { setWeatherInteracted(true); setShowHourlyWeather(true); }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                            </div>
                        )}
                    </div>

                    {/* Hourly Forecast View */}
                    <div className="hourly-view" style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center', transition: weatherInteracted ? 'transform 0.4s ease, opacity 0.4s ease' : 'none', transform: showHourlyWeather ? 'translateX(0)' : 'translateX(100%)', opacity: showHourlyWeather ? 1 : 0, position: showHourlyWeather ? 'relative' : 'absolute', width: '100%', top: 0 }}>
                        <div className="weather-arrow weather-arrow-left pc-only" onClick={() => { setWeatherInteracted(true); setShowHourlyWeather(false); }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                        </div>
                        
                        <div 
                            ref={weatherScrollRef} 
                            onWheel={handleWeatherScroll}
                            style={{ display: 'flex', gap: '0.85rem', overflowX: 'auto', paddingTop: 0, paddingRight: '2rem', paddingBottom: 0, paddingLeft: '3.5rem', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {weatherData.hourly?.map((hour, idx) => (
                                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', minWidth: '35px', flexShrink: 0 }}>
                                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>{hour.time}</span>
                                    <img src={`https://openweathermap.org/img/wn/${hour.icon}.png`} alt="icon" style={{ width: '32px', height: '32px' }} />
                                    <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'white' }}>{Math.round(hour.temp)}°</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: '80px' }}>
                    <div className="skeleton skeleton-avatar" style={{ width: '60px', height: '60px' }}></div>
                    <div className="skeleton skeleton-text" style={{ width: '80px', height: '40px', margin: 0 }}></div>
                </div>
            )}
        </div>

        {/* Grades Widget */}
        <div className="glass-panel grades-wrapper" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1, border: '1px solid rgba(255,255,255,0.1)' }}>
            <Link href="/dashboard/grades" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'rgba(255,255,255,0.9)', margin: 0 }}>Academic Grades</h2>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </Link>
            
            {gradesData ? (
                <div style={{ display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem', fontWeight: '600' }}>Overall CGPA</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'white', lineHeight: 1 }}>{currentCgpa}</div>
                        </div>
                        {gradesData.grades?.summary && (
                            <div style={{ display: 'flex', gap: '1.5rem', textAlign: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#60a5fa' }}>{gradesData.grades.summary.acquiredCredits}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Credits</div>
                                </div>
                                <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '1.5rem' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#4ade80' }}>
                                        {gradesData.grades.internalMarks?.length || 0}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Subjects</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="skeleton-container" style={{ flex: 1, justifyContent: 'center' }}>
                    <div className="skeleton skeleton-card" style={{ height: '100px', width: '100%', margin: 0 }}></div>
                </div>
            )}
        </div>
    </div>

    {/* Right Sidebar (Takes 1/3 width on PC) */}
    <div className="dash-right-col" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Today&apos;s Classes Widget */}
            {todaysClasses.length > 0 ? (
                    <div className="glass-panel" style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'white', margin: 0 }}>Today&apos;s Classes</h2>
                {todayCalendar?.day_order && (
                    <div style={{ 
                        background: "rgba(59, 130, 246, 0.15)", 
                        border: "1px solid rgba(59, 130, 246, 0.3)", 
                        color: "#60a5fa", 
                        padding: "0.35rem 0.85rem", 
                        borderRadius: "999px", 
                        fontWeight: "700", 
                        fontSize: "0.85rem" 
                    }}>
                        Day Order {todayCalendar.day_order}
                    </div>
                )}
            </div>
                        <div style={{ position: 'relative', maxWidth: '800px', margin: 'auto 0', width: '100%', display: 'flex', flexDirection: 'column' }}>
                            <div className="timeline-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative', zIndex: 1 }}>
                                {/* The vertical timeline connector line */}
                                <div className="timeline-line" style={{ position: 'absolute', top: '18px', bottom: '18px', left: '17px', width: '2px', background: 'rgba(255,255,255,0.05)', zIndex: -1 }}></div>
                                {todaysClasses.map((cls, idx) => {
                                    let isCurrent = false;
                                    const timeStr = timetableData.timings?.[cls.period];
                                    if (timeStr && currentTime) {
                                        const [startStr, endStr] = timeStr.split(' - ');
                                        if (startStr && endStr) {
                                            const [sh, sm] = startStr.split(':').map(Number);
                                            const [eh, em] = endStr.split(':').map(Number);
                                            const startMinutes = sh * 60 + sm;
                                            const endMinutes = eh * 60 + em;
                                            const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
                                            if (nowMinutes >= startMinutes && nowMinutes < endMinutes) {
                                                isCurrent = true;
                                            }
                                        }
                                    }

                                    return (
                                        <div key={idx} className="timeline-item" style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
                                            {/* Period Node */}
                                            <div className="timeline-node" style={{ 
                                                width: '36px', height: '36px', borderRadius: '50%', 
                                                background: 'rgba(15, 23, 42, 1)', 
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                                zIndex: 2,
                                                boxShadow: isCurrent ? '0 0 0 4px rgba(15, 23, 42, 1), 0 0 10px rgba(59, 130, 246, 0.5)' : 'none'
                                            }}>
                                                <div style={{
                                                    width: '100%', height: '100%', borderRadius: '50%',
                                                    background: isCurrent ? 'linear-gradient(135deg, var(--primary), #2563eb)' : 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(37,99,235,0.05))',
                                                    border: isCurrent ? '1px solid #93c5fd' : '1px solid rgba(59,130,246,0.3)',
                                                    color: isCurrent ? 'white' : '#60a5fa', 
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontWeight: '800', fontSize: '0.9rem',
                                                    boxShadow: isCurrent ? 'inset 0 2px 4px rgba(255,255,255,0.3)' : 'none'
                                                }}>
                                                    {cls.period}
                                                </div>
                                            </div>
                                            
                                            {/* Class Card */}
                                            <div style={{ 
                                                flex: 1, 
                                                background: isCurrent ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.05))' : 'rgba(255,255,255,0.02)', 
                                                border: isCurrent ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(255,255,255,0.05)', 
                                                borderRadius: '12px', padding: '0.85rem 1rem',
                                                transition: 'transform 0.2s, background 0.2s',
                                                boxShadow: isCurrent ? '0 4px 15px rgba(59, 130, 246, 0.1)' : 'none'
                                            }}
                                            onMouseOver={e => {
                                                if (!isCurrent) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                                            }}
                                            onMouseOut={e => {
                                                if (!isCurrent) e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                                            }}
                                            >
                                                <div style={{ fontSize: '1.1rem', fontWeight: '700', color: isCurrent ? '#60a5fa' : 'white' }}>{cls.subject}</div>
                                                <div style={{ fontSize: '0.85rem', color: isCurrent ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.5)', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                                    {timetableData.timings?.[cls.period]}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="glass-panel" style={{ padding: '1.5rem', flex: 1, textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'white', margin: 0, textAlign: 'left' }}>Today&apos;s Classes</h2>
                            {todayCalendar?.day_order && (
                                <div style={{ 
                                    background: "rgba(59, 130, 246, 0.15)", 
                                    border: "1px solid rgba(59, 130, 246, 0.3)", 
                                    color: "#60a5fa", 
                                    padding: "0.35rem 0.85rem", 
                                    borderRadius: "999px", 
                                    fontWeight: "700", 
                                    fontSize: "0.85rem" 
                                }}>
                                    Day Order {todayCalendar.day_order}
                                </div>
                            )}
                        </div>
                        {todayCalendar?.day_order ? (
                            <div className="skeleton-container" style={{ width: '100%', padding: '1rem', marginTop: '1rem' }}>
                                <div className="skeleton skeleton-card" style={{ height: '70px' }}></div>
                                <div className="skeleton skeleton-card" style={{ height: '70px' }}></div>
                                <div className="skeleton skeleton-card" style={{ height: '70px' }}></div>
                            </div>
                        ) : 'Enjoy your day off!'}
                    </div>
                )}
            </div>
        </div>
    </main>
    );
}
