'use client'

import { useState } from 'react'

import useSWR from 'swr'
import { useTabState } from '@/hooks/useTabState'
import { useRouter } from 'next/navigation'
import { fetcher } from '@/utils/fetcher'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import CurrentPeriod from '@/components/CurrentPeriod'

const formatSubjectName = (name) => {
    if (!name) return '';
    const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    return name.toLowerCase().split(' ').map(word => {
        const upperWord = word.toUpperCase();
        // Keep roman numerals uppercase, otherwise capitalize first letter
        if (romanNumerals.includes(upperWord)) return upperWord;
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
};

export default function DashboardPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useTabState('tab', 'hourWise') // 'hourWise', 'subjectWise'
  const { data: json, error, isLoading } = useSWR('/api/dashboard', fetcher)

  if (error) {
    if (error.status === 401) {
      router.push('/')
      return null
    }
    return (
      <main className="main-container">
        <div className="glass-panel" style={{ textAlign: 'center' }}>
           <h2 className="text-gradient">Oops!</h2>
           <p style={{ marginTop: '1rem' }}>{error.message || 'A network error occurred.'}</p>
           <button onClick={() => window.location.reload()} className="btn-secondary" style={{ marginTop: '2rem' }}>Retry</button>
        </div>
      </main>
    )
  }

  if (isLoading && !json) {
    return (
      <main className="main-container" style={{ alignItems: 'center' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }}></div>
        <p style={{ marginTop: '1rem', color: 'rgba(255,255,255,0.7)' }}>Crunching ERP data...</p>
      </main>
    )
  }

  const data = json
  if (!data) return null



  const { stats = {}, allDays = [], subjectWise = [], outreachData = null, hasODColumn = false } = data || {};
  
  const getStatusColor = (status) => {
    if (status === 'P') return '#4db8ff'; // vibrant blue
    if (status === 'A') return '#f59f00'; // vibrant orange
    if (status === 'ML' || status === 'OD') return '#4caf50'; // green
    if (status === 'CL') return '#c0ca33';
    if (status === 'DA' || status === 'LA') return '#e11d48'; 
    return 'transparent'; // empty or other
  }

  // Data for PieChart mapping to the ERP colors
  const pieData = [
    { name: 'Present', value: stats.hrsPresent, fill: '#4ab4c4' },
    { name: 'Absent', value: stats.hrsAbsent, fill: '#f2a632' },
    { name: 'CL', value: stats.hrsCL, fill: '#c0ca33' },
    { name: 'ML', value: stats.hrsML, fill: '#5e9973' },
    { name: 'OD', value: stats.hrsOD, fill: '#8a9b5f' },
    { name: 'DA', value: stats.hrsDA, fill: '#8f9218' },
    { name: 'LA', value: stats.hrsLA, fill: '#8f2e62' }
  ].filter(item => item.value > 0);

  // Group by month
  const groupedDays = allDays.reduce((acc, day) => {
      // day.date format is like "15-Jul-2026"
      const parts = day.date.split('-');
      if (parts.length === 3) {
          const monthYear = `${parts[1]} ${parts[2]}`;
          if (!acc[monthYear]) acc[monthYear] = [];
          acc[monthYear].push(day);
      } else {
          if (!acc['Other']) acc['Other'] = [];
          acc['Other'].push(day);
      }
      return acc;
  }, {});

  // Custom label for Pie chart slices to match the ERP reference exactly
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
  
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={600} opacity={0.9}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const renderHourWise = () => {
    const totalConducted = [stats.hrsPresent, stats.hrsAbsent, stats.hrsCL, stats.hrsML, stats.hrsOD, stats.hrsDA, stats.hrsLA].reduce((a, b) => a + (b || 0), 0);
    const currentPresent = (stats.hrsPresent || 0) + (stats.hrsML || 0) + (stats.hrsOD || 0);
    const currentPercentage = totalConducted > 0 ? (currentPresent / totalConducted) * 100 : 0;

    return (
    <div className="responsive-split">
      {/* Pie Chart Card */}
      <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center', marginBottom: '2rem' }}>
         <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.9)' }}>Attendance Breakdown</h2>
         <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie 
                  data={pieData} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={100} 
                  labelLine={false}
                  label={renderCustomizedLabel}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth={2}
                  isAnimationActive={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} 
                  itemStyle={{ color: '#fff', fontWeight: '500' }} 
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '0.875rem' }} />
              </PieChart>
            </ResponsiveContainer>
         </div>
         <div style={{ marginTop: '0.5rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '700' }}>{currentPercentage.toFixed(1)}%</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>Effective Attendance</p>
         </div>

         <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '1.5rem' }}>
             <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: '70px' }}>
                 <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#4ab4c4' }}>{stats.hrsPresent || 0}</span>
                 <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem', letterSpacing: '0.05em' }}>Present</span>
             </div>
             <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: '70px' }}>
                 <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#f2a632' }}>{stats.hrsAbsent || 0}</span>
                 <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem', letterSpacing: '0.05em' }}>Absent</span>
             </div>
             <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: '70px' }}>
                 <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#8a9b5f' }}>{stats.hrsOD || 0}</span>
                 <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem', letterSpacing: '0.05em' }}>OD</span>
             </div>
             <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: '70px' }}>
                 <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#5e9973' }}>{stats.hrsML || 0}</span>
                 <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem', letterSpacing: '0.05em' }}>ML</span>
             </div>
         </div>

         {/* 80% Attendance Goal Box */}
         {(() => {
             const reqClasses = Math.ceil((0.8 * totalConducted - currentPresent) / 0.2);
             const safeToMiss = Math.floor((currentPresent - 0.8 * totalConducted) / 0.8);
             
             const isDanger = currentPercentage < 80;
             const cardBg = isDanger ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.02))' : 'linear-gradient(135deg, rgba(74, 222, 128, 0.1), rgba(34, 197, 94, 0.02))';
             const borderColor = isDanger ? 'rgba(239, 68, 68, 0.2)' : 'rgba(74, 222, 128, 0.2)';
             const iconColor = isDanger ? '#ef4444' : '#4ade80';
             
             return (
                 <div style={{ 
                     marginTop: '2rem', 
                     padding: '1.25rem', 
                     background: cardBg, 
                     borderRadius: '16px', 
                     border: `1px solid ${borderColor}`,
                     textAlign: 'left',
                     boxShadow: `0 4px 20px ${isDanger ? 'rgba(239, 68, 68, 0.05)' : 'rgba(74, 222, 128, 0.05)'}`,
                     display: 'flex',
                     flexDirection: 'column',
                     gap: '1rem'
                 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ 
                            width: '32px', height: '32px', 
                            borderRadius: '8px', 
                            background: isDanger ? 'rgba(239, 68, 68, 0.15)' : 'rgba(74, 222, 128, 0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: iconColor
                        }}>
                            {isDanger ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                            )}
                        </div>
                        <h3 style={{ fontSize: '0.85rem', color: isDanger ? '#fca5a5' : '#86efac', textTransform: 'uppercase', margin: 0, letterSpacing: '0.05em', fontWeight: '700' }}>80% Attendance Goal</h3>
                    </div>
                    
                    <div>
                        {isDanger ? (
                            <p style={{ fontSize: '0.95rem', fontWeight: '500', color: 'rgba(255,255,255,0.9)', lineHeight: '1.5', margin: 0 }}>
                                You need to attend <span style={{ fontWeight: '800', color: '#ef4444', fontSize: '1.1rem' }}>{reqClasses > 0 ? reqClasses : 1}</span> more consecutive periods to reach the 80% minimum.
                            </p>
                        ) : (
                            <p style={{ fontSize: '0.95rem', fontWeight: '500', color: 'rgba(255,255,255,0.9)', lineHeight: '1.5', margin: 0 }}>
                                You are above 80%! You can afford to miss <span style={{ fontWeight: '800', color: '#4ade80', fontSize: '1.1rem' }}>{safeToMiss > 0 ? safeToMiss : 0}</span> periods.
                            </p>
                        )}
                    </div>
                    
                    {/* Progress Bar visualization towards 80% */}
                    <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.3)', borderRadius: '3px', overflow: 'hidden', position: 'relative' }}>
                        <div style={{ width: `${Math.min(currentPercentage, 100)}%`, height: '100%', background: iconColor, borderRadius: '3px', transition: 'width 1s ease-out' }}></div>
                        {/* The 80% Marker line */}
                        <div style={{ position: 'absolute', left: '80%', top: 0, bottom: 0, width: '2px', background: 'rgba(255,255,255,0.5)', zIndex: 2 }}></div>
                    </div>
                 </div>
             );
         })()}

         {/* Outreach Progress Widget (if applicable) */}
         {outreachData && (
             <div style={{
                 marginTop: '2rem',
                 padding: '1.25rem',
                 background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(168, 85, 247, 0.02))',
                 borderRadius: '16px',
                 border: '1px solid rgba(168, 85, 247, 0.2)',
                 textAlign: 'left',
                 boxShadow: '0 4px 20px rgba(168, 85, 247, 0.05)',
                 display: 'flex',
                 flexDirection: 'column',
                 gap: '1rem'
             }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                     <div style={{
                         width: '32px', height: '32px',
                         borderRadius: '8px',
                         background: 'rgba(168, 85, 247, 0.15)',
                         display: 'flex', alignItems: 'center', justifyContent: 'center',
                         color: '#c084fc'
                     }}>
                         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                     </div>
                     <div>
                         <h3 style={{ fontSize: '0.85rem', color: '#d8b4fe', textTransform: 'uppercase', margin: 0, letterSpacing: '0.05em', fontWeight: '700' }}>Outreach Progress</h3>
                         <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>{outreachData.team}</span>
                     </div>
                 </div>

                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.5rem' }}>
                     <div style={{ display: 'flex', flexDirection: 'column' }}>
                         <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Hours Completed</span>
                         <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                             <span style={{ fontSize: '2.5rem', fontWeight: '800', color: '#c084fc', lineHeight: 1 }}>{outreachData.present}</span>
                             <span style={{ fontSize: '1.25rem', fontWeight: '600', color: 'rgba(255,255,255,0.4)' }}>/ 90</span>
                         </div>
                     </div>
                 </div>

                 <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', overflow: 'hidden' }}>
                     <div style={{ width: `${Math.min((outreachData.present / 90) * 100, 100)}%`, height: '100%', background: 'linear-gradient(90deg, #c084fc, #a855f7)', borderRadius: '4px', transition: 'width 1s ease-out' }}></div>
                 </div>
             </div>
         )}
      </div>

      {/* Complete Attendance List Grouped by Month */}
      <div>
          
          {Object.entries(groupedDays).map(([month, days]) => (
            <div key={month} style={{ marginBottom: '2rem' }}>
               <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--primary)', marginBottom: '0.75rem', paddingLeft: '0.5rem' }}>
                   {month}
               </h4>
               <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                 {days.map((day, idx) => (
                   <div key={idx} style={{ 
                     display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                     padding: '1rem', 
                     borderBottom: idx === days.length - 1 ? 'none' : '1px solid var(--glass-border)' 
                   }}>
                     <div style={{ display: 'flex', flexDirection: 'column' }}>
                         <p style={{ fontSize: '1.25rem', fontWeight: '700', color: 'white' }}>{day.date.split('-')[0]}</p>
                         <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>{day.date.split('-')[1]}</p>
                     </div>
                     <div style={{ display: 'flex', gap: '0.25rem' }}>
                       {day.hours.map((status, i) => (
                         <div key={i} style={{
                           width: '28px', height: '28px', 
                           borderRadius: '6px', 
                           background: getStatusColor(status), 
                           display: 'flex', alignItems: 'center', justifyContent: 'center',
                           fontSize: '0.75rem', fontWeight: '700', 
                           color: status === '-' ? 'rgba(255,255,255,0.2)' : '#fff',
                           border: status === '-' ? '1px solid rgba(255,255,255,0.1)' : 'none'
                         }}>
                           {status}
                         </div>
                       ))}
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          ))}
      </div>
    </div>
    )
  }

  const renderSubjectWise = () => {
    if (!subjectWise || subjectWise.length === 0) {
        return <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>No subject wise data found.</div>
    }

    return (
      <>
      {/* Desktop Data Grid View */}
      <div className="desktop-view glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <th style={{ width: '35%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subject</th>
                      <th style={{ width: '10%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Total Hrs</th>
                      <th style={{ width: '10%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Present</th>
                      <th style={{ width: '8%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Absent</th>
                      <th style={{ width: '8%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>ML</th>
                      {hasODColumn && <th style={{ width: '8%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>OD</th>}
                      <th style={{ width: '25%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Progress</th>
                  </tr>
              </thead>
              <tbody>
                  {subjectWise.map((subj, idx) => {
                      const pct = parseFloat(subj.percentage);
                      const isDanger = pct < 75;
                      const pctColor = isDanger ? '#ef4444' : '#4ade80';

                      return (
                          <tr key={idx} style={{ borderBottom: idx === subjectWise.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s', cursor: 'default' }}
                              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                              <td style={{ padding: '1.25rem' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                      <span style={{ fontWeight: '700', color: 'white', fontSize: '0.95rem', marginBottom: '0.2rem' }}>{formatSubjectName(subj.desc)}</span>
                                      <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>{subj.code}</span>
                                  </div>
                              </td>
                              <td style={{ padding: '1.25rem', textAlign: 'center', fontWeight: '600', color: 'rgba(255,255,255,0.9)' }}>{subj.total}</td>
                              <td style={{ padding: '1.25rem', textAlign: 'center', fontWeight: '600', color: '#4ade80' }}>{subj.present}</td>
                              <td style={{ padding: '1.25rem', textAlign: 'center', fontWeight: '600', color: '#ef4444' }}>{subj.absent}</td>
                              <td style={{ padding: '1.25rem', textAlign: 'center', fontWeight: '600', color: '#facc15' }}>{subj.ml}</td>
                              {hasODColumn && <td style={{ padding: '1.25rem', textAlign: 'center', fontWeight: '600', color: '#60a5fa' }}>{subj.od || 0}</td>}
                              <td style={{ padding: '1.25rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                      <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                          <div style={{ width: `${pct}%`, height: '100%', background: pctColor, borderRadius: '3px', transition: 'width 0.5s ease' }}></div>
                                      </div>
                                      <span style={{ fontWeight: '800', color: pctColor, fontSize: '1rem', minWidth: '60px', textAlign: 'right' }}>{subj.percentage}%</span>
                                  </div>
                              </td>
                          </tr>
                      );
                  })}
                  {/* Total Row */}
                  <tr style={{ background: 'rgba(255,255,255,0.05)', borderTop: '2px solid rgba(255,255,255,0.1)' }}>
                      <td style={{ padding: '1.25rem', fontWeight: '800', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</td>
                      <td style={{ padding: '1.25rem', textAlign: 'center', fontWeight: '800', color: 'white' }}>{subjectWise.reduce((sum, s) => sum + s.total, 0)}</td>
                      <td style={{ padding: '1.25rem', textAlign: 'center', fontWeight: '800', color: '#4ade80' }}>{subjectWise.reduce((sum, s) => sum + s.present, 0)}</td>
                      <td style={{ padding: '1.25rem', textAlign: 'center', fontWeight: '800', color: '#ef4444' }}>{subjectWise.reduce((sum, s) => sum + s.absent, 0)}</td>
                      <td style={{ padding: '1.25rem', textAlign: 'center', fontWeight: '800', color: '#facc15' }}>{subjectWise.reduce((sum, s) => sum + s.ml, 0)}</td>
                      {hasODColumn && <td style={{ padding: '1.25rem', textAlign: 'center', fontWeight: '800', color: '#60a5fa' }}>{subjectWise.reduce((sum, s) => sum + (s.od || 0), 0)}</td>}
                      <td style={{ padding: '1.25rem' }}>
                          <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'white', textAlign: 'right' }}>
                              {(() => {
                                  const totalPresent = subjectWise.reduce((sum, s) => sum + s.present + s.ml + (s.od || 0), 0);
                                  const totalScheduled = subjectWise.reduce((sum, s) => sum + s.total, 0);
                                  return totalScheduled > 0 ? ((totalPresent / totalScheduled) * 100).toFixed(2) + '%' : '0.00%';
                              })()}
                          </div>
                      </td>
                  </tr>
              </tbody>
          </table>
      </div>

      {/* Mobile Cards View */}
      <div className="responsive-grid mobile-view">
        {subjectWise.map((subj, idx) => {
          const pct = parseFloat(subj.percentage);
          const isDanger = pct < 75;
          const pctColor = isDanger ? '#ef4444' : '#4ade80';

          return (
            <div key={idx} className="glass-panel" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ flex: 1, paddingRight: '1rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'white', lineHeight: '1.4', marginBottom: '0.25rem' }}>{formatSubjectName(subj.desc)}</h3>
                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{subj.code}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: '800', color: pctColor }}>
                            {subj.percentage}%
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginBottom: '1rem', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: pctColor, borderRadius: '4px', transition: 'width 0.5s ease' }}></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem' }}>Total Hrs</div>
                        <div style={{ fontSize: '1rem', fontWeight: '600' }}>{subj.total}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem' }}>Present</div>
                        <div style={{ fontSize: '1rem', fontWeight: '600', color: '#4ade80' }}>{subj.present}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem' }}>Absent</div>
                        <div style={{ fontSize: '1rem', fontWeight: '600', color: '#ef4444' }}>{subj.absent}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem' }}>ML</div>
                        <div style={{ fontSize: '1rem', fontWeight: '600', color: '#facc15' }}>{subj.ml}</div>
                    </div>
                    {hasODColumn && (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem' }}>OD</div>
                            <div style={{ fontSize: '1rem', fontWeight: '600', color: '#60a5fa' }}>{subj.od || 0}</div>
                        </div>
                    )}
                </div>
            </div>
          )
        })}
        
        {/* Mobile Total Card */}
        <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', textAlign: 'center' }}>Overall Total</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem' }}>Total</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'white' }}>{subjectWise.reduce((sum, s) => sum + s.total, 0)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem' }}>Present</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#4ade80' }}>{subjectWise.reduce((sum, s) => sum + s.present, 0)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem' }}>Absent</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#ef4444' }}>{subjectWise.reduce((sum, s) => sum + s.absent, 0)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem' }}>ML</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#facc15' }}>{subjectWise.reduce((sum, s) => sum + s.ml, 0)}</div>
                </div>
                {hasODColumn && (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem' }}>OD</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#60a5fa' }}>{subjectWise.reduce((sum, s) => sum + (s.od || 0), 0)}</div>
                    </div>
                )}
            </div>
            <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '2rem', fontWeight: '800', color: 'white' }}>
                {(() => {
                    const totalPresent = subjectWise.reduce((sum, s) => sum + s.present + s.ml + (s.od || 0), 0);
                    const totalScheduled = subjectWise.reduce((sum, s) => sum + s.total, 0);
                    return totalScheduled > 0 ? ((totalPresent / totalScheduled) * 100).toFixed(2) + '%' : '0.00%';
                })()}
            </div>
        </div>
      </div>
      </>
    )
  }

  return (
    <main className="main-container animate-slide-up" style={{ justifyContent: 'flex-start' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '2rem', margin: 0 }}>Attendance</h1>
      </div>

      <style>{`
        .mobile-view { display: none; }
        .desktop-view { display: block; }
        @media (max-width: 768px) {
            .mobile-view { display: block; }
            .desktop-view { display: none; }
        }
      `}</style>

      {/* Current Time and Period */}
      <CurrentPeriod />

      {/* Tabs */}
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '0.25rem', marginBottom: '1.5rem' }}>
          <button 
              onClick={() => setActiveTab('hourWise')}
              style={{ flex: 1, padding: '0.75rem 0', borderRadius: '8px', border: 'none', background: activeTab === 'hourWise' ? 'var(--primary)' : 'transparent', color: activeTab === 'hourWise' ? '#fff' : 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: '0.875rem', transition: 'all 0.3s ease', cursor: 'pointer' }}
          >
              Hour Wise
          </button>
          <button 
              onClick={() => setActiveTab('subjectWise')}
              style={{ flex: 1, padding: '0.75rem 0', borderRadius: '8px', border: 'none', background: activeTab === 'subjectWise' ? 'var(--primary)' : 'transparent', color: activeTab === 'subjectWise' ? '#fff' : 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: '0.875rem', transition: 'all 0.3s ease', cursor: 'pointer' }}
          >
              Subject Wise
          </button>
      </div>

      {activeTab === 'hourWise' ? renderHourWise() : renderSubjectWise()}
      
    </main>
  )
}
