'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import { fetcher } from '@/utils/fetcher'

export default function GradesPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('internal') // 'internal', 'exam'
  const [expandedInternal, setExpandedInternal] = useState(null)
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

  const grades = json?.grades
  if (!json) return null



  const renderInternal = () => {
      if (!grades.internalMarks || grades.internalMarks.length === 0) {
          return <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>No internal marks found.</div>
      }
      return (
        <div className="responsive-grid">
          {grades.internalMarks.map((subj, idx) => (
            <div key={idx} className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                <div 
                    onClick={() => setExpandedInternal(expandedInternal === idx ? null : idx)}
                    style={{ padding: '1.25rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                    <div style={{ flex: 1, paddingRight: '1rem' }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'white', lineHeight: '1.4', marginBottom: '0.25rem', textTransform: 'capitalize' }}>{subj.desc.toLowerCase()}</h3>
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
      )
  }

  const renderExam = () => {
      // Group by semester
      const grouped = {};
      (grades.examMarks || []).forEach(subj => {
          const sem = subj.semester || 'Other';
          if (!grouped[sem]) grouped[sem] = [];
          grouped[sem].push(subj);
      });

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
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--glass-border)' }}>
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

             {semesters.map(sem => (
                 <div key={sem} style={{ marginBottom: '2.5rem' }}>
                     <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'white', marginBottom: '1rem', paddingLeft: '0.5rem' }}>Semester {sem}</h2>
                     
                     <div className="responsive-grid">
                         {grouped[sem].map((subj, idx) => (
                             <div key={idx} className="glass-panel" style={{ padding: '1.25rem' }}>
                                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                     <div style={{ flex: 1, paddingRight: '1rem' }}>
                                         <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'white', lineHeight: '1.4', marginBottom: '0.25rem', textTransform: 'capitalize' }}>{subj.desc.toLowerCase()}</h3>
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
    <main className="main-container animate-slide-up" style={{ justifyContent: 'flex-start', paddingBottom: '6rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '2rem', margin: 0 }}>Grades</h1>
      </div>

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
