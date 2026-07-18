'use client'

import { useState, useEffect } from 'react';
import calendarData from '../../calendar.json';
import timetableData from '../utils/timetable.json';

export default function CurrentPeriod() {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [currentPeriodInfo, setCurrentPeriodInfo] = useState(null);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const dd = String(currentTime.getDate()).padStart(2, '0');
        const mm = String(currentTime.getMonth() + 1).padStart(2, '0');
        const yyyy = currentTime.getFullYear();
        const dateStr = `${dd}.${mm}.${yyyy}`;

        const todayData = calendarData.find(d => d.date === dateStr);
        if (!todayData || todayData.is_holiday || !todayData.is_working_day || !todayData.day_order) {
            setCurrentPeriodInfo({ isOff: true, message: 'No classes today' });
            return;
        }

        const dayOrder = todayData.day_order.toString();
        const dayTimetable = timetableData.timetable[dayOrder];
        if (!dayTimetable) {
            setCurrentPeriodInfo({ isOff: true, message: 'No timetable found for today' });
            return;
        }

        const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
        
        let currentPeriod = null;
        let isBreak = false;
        let periodName = '';

        for (const [periodStr, timeStr] of Object.entries(timetableData.timings)) {
            const [startStr, endStr] = timeStr.split(' - ');
            const [sh, sm] = startStr.split(':').map(Number);
            const [eh, em] = endStr.split(':').map(Number);
            
            const startMinutes = sh * 60 + sm;
            const endMinutes = eh * 60 + em;

            if (nowMinutes >= startMinutes && nowMinutes < endMinutes) {
                if (periodStr === 'Break') {
                    isBreak = true;
                    periodName = 'Break';
                } else {
                    currentPeriod = periodStr;
                    periodName = dayTimetable[periodStr];
                }
                break;
            }
        }

        if (!currentPeriod && !isBreak) {
            // Check if before classes
            const [firstStartH, firstStartM] = timetableData.timings['1'].split(' - ')[0].split(':').map(Number);
            const firstStartMinutes = firstStartH * 60 + firstStartM;
            
            const [lastEndH, lastEndM] = timetableData.timings['5'].split(' - ')[1].split(':').map(Number);
            const lastEndMinutes = lastEndH * 60 + lastEndM;

            if (nowMinutes < firstStartMinutes) {
                setCurrentPeriodInfo({ isOff: true, message: 'Classes have not started yet' });
            } else if (nowMinutes >= lastEndMinutes) {
                setCurrentPeriodInfo({ isOff: true, message: 'Classes are over for today' });
            } else {
                setCurrentPeriodInfo({ isOff: true, message: 'Transitioning...' }); // Between periods
            }
        } else {
            setCurrentPeriodInfo({ 
                isOff: false, 
                isBreak, 
                period: currentPeriod, 
                periodName, 
                dayOrder,
                timeStr: timetableData.timings[isBreak ? 'Break' : currentPeriod]
            });
        }
    }, [currentTime]);

    if (!currentPeriodInfo || currentPeriodInfo.isOff) return null;

    const isBreakBg = currentPeriodInfo.isBreak;
    const bgGradient = isBreakBg 
        ? 'linear-gradient(135deg, rgba(245, 159, 0, 0.1), rgba(245, 159, 0, 0.02))' 
        : 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(16, 185, 129, 0.05))';
    const borderColor = isBreakBg ? 'rgba(245, 159, 0, 0.2)' : 'rgba(59, 130, 246, 0.2)';

    return (
        <div className="glass-panel current-period-bar" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: bgGradient, border: `1px solid ${borderColor}` }}>
            <div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '500' }}>
                    Period Timings
                </p>
                <h2 style={{ margin: '0.25rem 0 0 0', fontSize: '1.75rem', fontWeight: 'bold', color: 'white', fontVariantNumeric: 'tabular-nums' }}>
                    {currentPeriodInfo.timeStr}
                </h2>
            </div>
            <div style={{ textAlign: 'right' }}>
                {currentPeriodInfo.isBreak ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'flex-end' }}>
                        <div>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '500' }}>Day {currentPeriodInfo.dayOrder} &bull; Break Time</p>
                            <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.25rem', fontWeight: '600', color: '#f59f00' }}>Take a Break!</h3>
                        </div>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59f00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                            <line x1="6" y1="1" x2="6" y2="4"></line>
                            <line x1="10" y1="1" x2="10" y2="4"></line>
                            <line x1="14" y1="1" x2="14" y2="4"></line>
                        </svg>
                    </div>
                ) : (
                    <>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '500' }}>Day {currentPeriodInfo.dayOrder} &bull; Period {currentPeriodInfo.period}</p>
                        <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.25rem', fontWeight: '600', color: '#4ade80' }}>{currentPeriodInfo.periodName}</h3>
                    </>
                )}
            </div>
        </div>
    );
}
