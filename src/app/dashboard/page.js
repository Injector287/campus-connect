'use client';
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { fetcher } from '@/utils/fetcher';
import Link from 'next/link';
import calendarData from '../../../calendar.json';
import CurrentPeriod from '@/components/CurrentPeriod';

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

    useEffect(() => {
        const today = getTodayStr();
        setTodayStr(today);
        const calData = calendarData.find(d => d.date === today) || null;
        setTodayCalendar(calData);
    }, []);

    const { data: attendanceData, error: attendanceError, mutate: mutateAttendance } = useSWR('/api/dashboard', fetcher, { keepPreviousData: true });
    const { data: financeData, error: financeError } = useSWR('/api/finance', fetcher);
    const { data: weatherData } = useSWR('/api/weather', fetcher);
    const { data: timetableData } = useSWR('/api/timetable', fetcher);
    const { data: profileData } = useSWR('/api/profile', fetcher);

    const [liveMins, setLiveMins] = useState(0);
    const [liveCooldown, setLiveCooldown] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const [shakeTimeout, setShakeTimeout] = useState(null);

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
            const res = await fetch('/api/dashboard?force=true');
            const newData = await res.json();
            if (newData.success) {
                mutateAttendance(newData, { revalidate: false });
                
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

    // Finance dues
    let pendingDuesTotal = 0;
    if (financeData?.due?.data) {
        pendingDuesTotal = financeData.due.data.reduce((sum, item) => {
            const amt = parseFloat(String(item.dueAmount).replace(/,/g, ''));
            return sum + (isNaN(amt) ? 0 : amt);
        }, 0);
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
        <main className="main-container animate-slide-up" style={{ justifyContent: 'flex-start' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 className="text-gradient" style={{ fontSize: '2rem', margin: 0 }}>
                    {firstName ? `${greeting}, ${firstName}!` : 'Overview'}
                </h1>
                
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

            <CurrentPeriod />

            <div className="responsive-grid">
                
                {/* Weather & Day Overview Widget */}
                <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.05))', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'white', margin: 0 }}>Today</h2>
                            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', margin: 0 }}>{todayStr}</p>
                        </div>
                        {weatherData && (
                            <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white' }}>{Math.round(weatherData.temp)}°C</div>
                                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', textTransform: 'capitalize' }}>{weatherData.description}</div>
                                </div>
                                <img src={`https://openweathermap.org/img/wn/${weatherData.icon}@2x.png`} alt="weather icon" style={{ width: '48px', height: '48px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
                            </div>
                        )}
                    </div>

                    {/* Hourly Forecast */}
                    {weatherData?.hourly && weatherData.hourly.length > 0 && (
                        <div style={{ 
                            display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem', 
                            scrollbarWidth: 'none', msOverflowStyle: 'none'
                        }}>
                            <style>{`.glass-panel::-webkit-scrollbar { display: none; }`}</style>
                            {weatherData.hourly.map((hour, idx) => (
                                <div key={idx} style={{ 
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', 
                                    background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '12px',
                                    minWidth: '60px'
                                }}>
                                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)' }}>{hour.time}</span>
                                    <img src={`https://openweathermap.org/img/wn/${hour.icon}.png`} alt={hour.description} style={{ width: '32px', height: '32px', margin: '0.25rem 0' }} />
                                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'white' }}>{Math.round(hour.temp)}°</span>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {weatherData && (
                        <div style={{ 
                            marginTop: 'auto', 
                            background: 'rgba(255,255,255,0.05)', 
                            padding: '0.75rem', 
                            borderRadius: '8px', 
                            color: 'rgba(255,255,255,0.9)', 
                            fontSize: '0.85rem',
                            fontWeight: '500',
                            textAlign: 'center',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            {getWeatherCaption(weatherData.condition, weatherData.temp)}
                        </div>
                    )}
                </div>

                {/* Attendance Snapshot Widget */}
                <Link href="/dashboard/attendance" style={{ textDecoration: 'none' }}>
                    <div id="attendance-card" className="glass-panel" style={{ padding: '1.25rem', height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'transform 0.2s, background 0.2s, box-shadow 0.5s, border-color 0.5s', border: '1px solid rgba(255,255,255,0.1)' }}
                         onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                         onMouseOut={e => e.currentTarget.style.background = 'rgba(15, 23, 42, 0.6)'}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'rgba(255,255,255,0.9)', margin: 0 }}>Attendance</h2>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                        </div>
                        {attendanceData ? (
                            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <div style={{ fontSize: '2.5rem', fontWeight: '800', color: currentPercentage >= 80 ? '#4ade80' : '#ef4444', lineHeight: 1, marginBottom: '0.5rem' }}>
                                        {currentPercentage.toFixed(1)}%
                                    </div>
                                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ width: `${Math.min(currentPercentage, 100)}%`, height: '100%', background: currentPercentage >= 80 ? '#4ade80' : '#ef4444', borderRadius: '3px' }}></div>
                                    </div>
                                </div>
                                
                                {attendanceData.allDays && attendanceData.allDays.length > 0 && (
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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
                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginTop: 'auto' }}>Loading...</div>
                        )}
                    </div>
                </Link>

                {/* Finance Snapshot Widget */}
                <Link href="/dashboard/finance" style={{ textDecoration: 'none' }}>
                    <div className="glass-panel" style={{ padding: '1.25rem', height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'transform 0.2s, background 0.2s' }}
                         onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                         onMouseOut={e => e.currentTarget.style.background = 'rgba(15, 23, 42, 0.6)'}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'rgba(255,255,255,0.9)', margin: 0 }}>Pending Dues</h2>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                        </div>
                        {financeData ? (
                            <div style={{ marginTop: 'auto' }}>
                                {pendingDuesTotal > 0 ? (
                                    <>
                                        <div style={{ fontSize: '2rem', fontWeight: '800', color: '#ef4444', lineHeight: 1, marginBottom: '0.5rem' }}>
                                            ₹{pendingDuesTotal.toLocaleString('en-IN')}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Action required</div>
                                    </>
                                ) : (
                                    <>
                                        <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#4ade80', lineHeight: 1, marginBottom: '0.5rem' }}>
                                            All Clear!
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>No pending fees</div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginTop: 'auto' }}>Loading...</div>
                        )}
                    </div>
                </Link>

            </div>

            {/* Today's Classes Widget */}
            <div style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'white', margin: 0 }}>Today's Classes</h2>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {todayCalendar?.day_order ? (
                            <span style={{ background: 'var(--primary)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontWeight: '700', fontSize: '0.85rem' }}>
                                Day Order {todayCalendar.day_order}
                            </span>
                        ) : (
                            <span style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontWeight: '600', fontSize: '0.85rem' }}>
                                No classes today
                            </span>
                        )}
                        {todayCalendar?.event && (
                            <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontWeight: '600', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                {todayCalendar.event}
                            </span>
                        )}
                    </div>
                </div>
                {todaysClasses.length > 0 ? (
                    <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                        {todaysClasses.map((cls, idx) => (
                            <div key={idx} style={{ 
                                display: 'flex', alignItems: 'center', gap: '1rem', 
                                padding: '1rem', 
                                borderBottom: idx === todaysClasses.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)'
                            }}>
                                <div style={{ 
                                    width: '40px', height: '40px', borderRadius: '8px', 
                                    background: 'rgba(255,255,255,0.05)', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: '800', color: 'var(--primary)'
                                }}>
                                    {cls.period}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '1rem', fontWeight: '600', color: 'white' }}>{cls.subject}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.15rem' }}>
                                        {timetableData.timings?.[cls.period]}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                        {todayCalendar?.day_order ? 'Loading classes...' : 'Enjoy your day off!'}
                    </div>
                )}
            </div>

        </main>
    );
}
