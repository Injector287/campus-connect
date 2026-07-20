'use client'

import React, { useState } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import { fetcher } from '@/utils/fetcher'
import { useTabState } from '@/hooks/useTabState'

export default function GradesPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useTabState('tab', 'internal') // 'internal', 'exam'
  const [expandedInternal, setExpandedInternal] = useState(null)
  
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
  const { data: json, error, isLoading } = useSWR('/api/grades', fetcher)

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
        <p style={{ marginTop: '1rem', color: 'rgba(255,255,255,0.7)' }}>Loading Grades...</p>
      </main>
    )
  }

  const grades = json?.grades || {}
  if (!json) return null



  const renderInternal = () => {
      if (!grades.internalMarks || grades.internalMarks.length === 0) {
          return <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>No internal marks found.</div>
      }
      return (
        <>
        {/* Desktop Data Grid View */}
        <div className="desktop-view glass-panel" style={{ padding: '0', overflow: 'hidden', marginBottom: '2rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <th style={{ width: '40%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subject</th>
                        <th style={{ width: '25%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Course Code</th>
                        <th style={{ width: '35%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Score & Progress</th>
                    </tr>
                </thead>
                <tbody>
                    {grades.internalMarks.map((subj, idx) => (
                        <React.Fragment key={idx}>
                            <tr style={{ borderBottom: idx === grades.internalMarks.length - 1 && expandedInternal !== idx ? 'none' : '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s', cursor: 'pointer' }}
                                onClick={() => setExpandedInternal(expandedInternal === idx ? null : idx)}
                                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <td style={{ padding: '1.25rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: '700', color: 'white', fontSize: '0.95rem', marginBottom: '0.2rem' }}>{formatSubjectName(subj.desc)}</span>
                                    </div>
                                </td>
                                <td style={{ padding: '1.25rem', textAlign: 'center', fontWeight: '600', color: 'var(--primary)' }}>
                                    {subj.code}
                                </td>
                                <td style={{ padding: '1.25rem' }}>
                                    {(() => {
                                        const obtained = parseFloat(subj.obtained) || 0;
                                        const max = parseFloat(subj.max) || 100;
                                        const pct = max > 0 ? (obtained / max) * 100 : 0;
                                        const pctColor = pct >= 75 ? '#4ade80' : pct >= 50 ? '#facc15' : '#ef4444';
                                        return (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '80%', margin: '0 auto' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                                    <span style={{ fontSize: '1.1rem', fontWeight: '800', color: obtained === 0 ? 'rgba(255,255,255,0.3)' : 'white' }}>{subj.obtained}</span>
                                                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>/ {subj.max}</span>
                                                </div>
                                                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: obtained === 0 ? 'rgba(255,255,255,0.1)' : pctColor, borderRadius: '3px', transition: 'width 0.5s ease' }}></div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </td>
                            </tr>
                            {expandedInternal === idx && subj.components && subj.components.length > 0 && (
                                <tr>
                                    <td colSpan="3" style={{ padding: 0 }}>
                                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderBottom: idx === grades.internalMarks.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                                            <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '0.75rem', fontWeight: '600' }}>Component Breakdown</p>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                                                {subj.components.map((comp, cIdx) => (
                                                    <div key={cIdx} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>{comp.name}</span>
                                                        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--primary)' }}>{comp.mark}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>

        {/* Mobile Cards View */}
        <div className="responsive-grid mobile-view">
          {grades.internalMarks.map((subj, idx) => (
            <div key={idx} className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                <div 
                    onClick={() => setExpandedInternal(expandedInternal === idx ? null : idx)}
                    style={{ padding: '1.25rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                    <div style={{ flex: 1, paddingRight: '1rem' }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'white', lineHeight: '1.4', marginBottom: '0.25rem' }}>{formatSubjectName(subj.desc)}</h3>
                        <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '600' }}>{subj.code}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: '800', color: subj.obtained === '0' ? 'rgba(255,255,255,0.3)' : 'white' }}>
                            {subj.obtained}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>out of {subj.max}</div>
                    </div>
                </div>
                
                {expandedInternal === idx && subj.components && subj.components.length > 0 && (
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem', fontWeight: '600' }}>Component Breakdown</p>
                        {subj.components.map((comp, cIdx) => (
                            <div key={cIdx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: cIdx === subj.components.length - 1 ? 'none' : '1px dashed rgba(255,255,255,0.1)' }}>
                                <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>{comp.name}</span>
                                <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>{comp.mark}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
          ))}
        </div>
        </>
      )
  }

  const renderExam = () => {
      // Group by semester
      const grouped = {};
      let totalCreditPoints = 0;
      let totalCreditsForCgpa = 0;
      
      (grades.examMarks || []).forEach(subj => {
          const sem = subj.semester || 'Other';
          if (!grouped[sem]) grouped[sem] = [];
          grouped[sem].push(subj);
          
          const credit = parseFloat(subj.credit);
          const points = parseFloat(subj.points);
          
          if (!isNaN(credit) && !isNaN(points) && credit > 0) {
              totalCreditPoints += (credit * points);
              totalCreditsForCgpa += credit;
          }
      });
      
      const currentCgpa = totalCreditsForCgpa > 0 ? (totalCreditPoints / totalCreditsForCgpa).toFixed(2) : 'N/A';

      // Sort semesters descending
      const semesters = Object.keys(grouped).sort((a, b) => {
          const numA = parseInt(a);
          const numB = parseInt(b);
          if (!isNaN(numA) && !isNaN(numB)) return numB - numA;
          return b.localeCompare(a); // fallback
      });

      const getCategoryPriority = (category) => {
          if (!category) return 99;
          if (category.includes('MAJOR (CORE)')) return 1;
          if (category.includes('ALLIED (REQUIRED)')) return 2;
          if (category.includes('ALLIED (OPTIONAL)')) return 3;
          if (category.includes('GENERAL ENGLISH')) return 4;
          if (category.includes('GENERAL LANGUAGE')) return 5;
          if (category.includes('CROSS DISCIPLINARY')) return 6;
          return 7;
      };

      // Sort subjects within each semester by category priority
      Object.keys(grouped).forEach(sem => {
          grouped[sem].sort((a, b) => {
              return getCategoryPriority(a.category) - getCategoryPriority(b.category);
          });
      });

      return (
          <>
             {grades.summary && grades.summary.totalCredits && (
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', padding: '1rem', marginBottom: '1rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--glass-border)' }}>
                     <div style={{ textAlign: 'center' }}>
                         <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'white' }}>{grades.summary.acquiredCredits}</div>
                         <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>Acquired</div>
                     </div>
                     <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.1)', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                         <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--primary)' }}>{grades.summary.totalCredits}</div>
                         <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>Total</div>
                     </div>
                     <div style={{ textAlign: 'center' }}>
                         <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--error)' }}>{grades.summary.remainingCredits}</div>
                         <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>Remaining</div>
                     </div>
                 </div>
             )}
             
             {currentCgpa !== 'N/A' && (
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', marginBottom: '2.5rem', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(16, 185, 129, 0.05))', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                     <div>
                         <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)', letterSpacing: '1px', marginBottom: '0.25rem', fontWeight: '600' }}>Current CGPA</h3>
                         <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Based on acquired credits</p>
                     </div>
                     <div style={{ fontSize: '2.25rem', fontWeight: '800', color: 'white' }}>
                         {currentCgpa}
                     </div>
                 </div>
             )}

             {semesters.map(sem => (
                 <div key={sem} style={{ marginBottom: '2.5rem' }}>
                     <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'white', marginBottom: '1rem', paddingLeft: '0.5rem' }}>Semester {sem}</h2>
                     
                     <div className="desktop-view glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                         <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                             <thead>
                                 <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                     <th style={{ width: '30%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subject</th>
                                     <th style={{ width: '10%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Credits</th>
                                     <th style={{ width: '10%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Internal</th>
                                     <th style={{ width: '10%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>External</th>
                                     <th style={{ width: '10%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Total</th>
                                     <th style={{ width: '10%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Points</th>
                                     <th style={{ width: '20%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Grade</th>
                                 </tr>
                             </thead>
                             <tbody>
                                 {grouped[sem].map((subj, idx) => (
                                     <tr key={idx} style={{ borderBottom: idx === grouped[sem].length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s', cursor: 'default' }}
                                         onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                         onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                     >
                                         <td style={{ padding: '1.25rem' }}>
                                             <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                 <span style={{ fontWeight: '700', color: 'white', fontSize: '0.95rem', marginBottom: '0.2rem' }}>{formatSubjectName(subj.desc)}</span>
                                                 <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>{subj.code} • {subj.category || 'Course'}</span>
                                             </div>
                                         </td>
                                         <td style={{ padding: '1.25rem', textAlign: 'center', fontWeight: '600', color: 'var(--primary)' }}>{subj.credit}</td>
                                         <td style={{ padding: '1.25rem', textAlign: 'center', fontWeight: '600', color: 'rgba(255,255,255,0.9)' }}>{subj.internal}</td>
                                         <td style={{ padding: '1.25rem', textAlign: 'center', fontWeight: '600', color: 'rgba(255,255,255,0.9)' }}>{subj.external}</td>
                                         <td style={{ padding: '1.25rem', textAlign: 'center', fontWeight: '800', color: 'var(--primary)' }}>{subj.total}</td>
                                         <td style={{ padding: '1.25rem', textAlign: 'center', fontWeight: '600', color: '#facc15' }}>{subj.points}</td>
                                         <td style={{ padding: '1.25rem', textAlign: 'right' }}>
                                             <div style={{ 
                                                 display: 'inline-block',
                                                 background: subj.result === 'PASS' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(239, 68, 68, 0.2)', 
                                                 color: subj.result === 'PASS' ? '#4ade80' : '#ef4444',
                                                 padding: '0.3rem 0.6rem', 
                                                 borderRadius: '8px', 
                                                 fontSize: '1rem', 
                                                 fontWeight: '800' 
                                             }}>
                                                 {subj.grade}
                                             </div>
                                         </td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                     </div>

                     <div className="responsive-grid mobile-view">
                         {grouped[sem].map((subj, idx) => (
                             <div key={idx} className="glass-panel" style={{ padding: '1.25rem' }}>
                                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                     <div style={{ flex: 1, paddingRight: '1rem' }}>
                                         <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'white', lineHeight: '1.4', marginBottom: '0.25rem' }}>{formatSubjectName(subj.desc)}</h3>
                                         <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{subj.code} • {subj.category || 'Course'}</span>
                                     </div>
                                     <div style={{ textAlign: 'right' }}>
                                         <div style={{ 
                                             display: 'inline-block',
                                             background: subj.result === 'PASS' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(239, 68, 68, 0.2)', 
                                             color: subj.result === 'PASS' ? '#4ade80' : '#ef4444',
                                             padding: '0.3rem 0.6rem', 
                                             borderRadius: '8px', 
                                             fontSize: '1rem', 
                                             fontWeight: '800' 
                                         }}>
                                             {subj.grade}
                                         </div>
                                     </div>
                                 </div>
    
                                 <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px' }}>
                                     <div style={{ textAlign: 'center' }}>
                                         <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem' }}>Internal</div>
                                         <div style={{ fontSize: '1rem', fontWeight: '600' }}>{subj.internal}</div>
                                     </div>
                                     <div style={{ textAlign: 'center' }}>
                                         <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem' }}>External</div>
                                         <div style={{ fontSize: '1rem', fontWeight: '600' }}>{subj.external}</div>
                                     </div>
                                     <div style={{ textAlign: 'center' }}>
                                         <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem' }}>Total</div>
                                         <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--primary)' }}>{subj.total}</div>
                                     </div>
                                     <div style={{ textAlign: 'center' }}>
                                         <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem' }}>Points</div>
                                         <div style={{ fontSize: '1rem', fontWeight: '600', color: '#facc15' }}>{subj.points}</div>
                                     </div>
                                 </div>
                             </div>
                         ))}
                     </div>
                 </div>
             ))}
             
             {(!grades.examMarks || grades.examMarks.length === 0) && (
                 <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>No exam marks found.</div>
             )}
          </>
      )
  }

  return (
    <main className="main-container animate-slide-up" style={{ justifyContent: 'flex-start' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '2rem', margin: 0 }}>Grades</h1>
      </div>

      <style>{`
        .mobile-view { display: none; }
        .desktop-view { display: block; }
        @media (max-width: 768px) {
            .mobile-view { display: block; }
            .desktop-view { display: none; }
        }
      `}</style>

      {/* Tabs */}
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '0.25rem', marginBottom: '1.5rem' }}>
          <button 
              onClick={() => setActiveTab('internal')}
              style={{ flex: 1, padding: '0.75rem 0', borderRadius: '8px', border: 'none', background: activeTab === 'internal' ? 'var(--primary)' : 'transparent', color: activeTab === 'internal' ? '#fff' : 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: '0.875rem', transition: 'all 0.3s ease', cursor: 'pointer' }}
          >
              Internal Marks
          </button>
          <button 
              onClick={() => setActiveTab('exam')}
              style={{ flex: 1, padding: '0.75rem 0', borderRadius: '8px', border: 'none', background: activeTab === 'exam' ? 'var(--primary)' : 'transparent', color: activeTab === 'exam' ? '#fff' : 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: '0.875rem', transition: 'all 0.3s ease', cursor: 'pointer' }}
          >
              Exam Results
          </button>
      </div>

      <div>
          {activeTab === 'internal' && renderInternal()}
          {activeTab === 'exam' && renderExam()}
      </div>
      
    </main>
  )
}
