'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { fetcher } from '@/utils/fetcher'

export default function SubjectsPage() {
  const router = useRouter()
  
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
  
  const getSemStyle = (sem) => {
      const styles = {
          '1': { bg: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5' },   // Red
          '2': { bg: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd' },   // Blue
          '3': { bg: 'rgba(16, 185, 129, 0.15)', color: '#6ee7b7' },   // Green
          '4': { bg: 'rgba(245, 158, 11, 0.15)', color: '#fcd34d' },   // Yellow
          '5': { bg: 'rgba(168, 85, 247, 0.15)', color: '#d8b4fe' },   // Purple
          '6': { bg: 'rgba(236, 72, 153, 0.15)', color: '#f9a8d4' },   // Pink
      };
      const def = { bg: 'rgba(255,255,255,0.1)', color: 'white' };
      return styles[sem?.toString()] || def;
  };
  
  const { data: json, error, isLoading } = useSWR('/api/subjects', fetcher)

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
        <p style={{ marginTop: '1rem', color: 'rgba(255,255,255,0.7)' }}>Loading Subjects...</p>
      </main>
    )
  }

  const categories = json?.categories || []
  if (!categories) return null



  return (
    <main className="main-container animate-slide-up" style={{ justifyContent: 'flex-start' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '2rem', margin: 0 }}>Subjects</h1>
      </div>

      <style>{`
        .mobile-view { display: none; }
        .desktop-view { display: block; }
        @media (max-width: 768px) {
            .mobile-view { display: block; }
            .desktop-view { display: none; }
        }
      `}</style>

      {categories.map((category, catIdx) => {
         const sortedSubjects = [...category.subjects].sort((a, b) => {
             const semA = parseInt(a.semester) || 0;
             const semB = parseInt(b.semester) || 0;
             if (semB !== semA) {
                 return semB - semA;
             }
             const creditA = parseInt(a.credit) || 0;
             const creditB = parseInt(b.credit) || 0;
             return creditB - creditA;
         });
         
         return (
         <div key={catIdx} style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--primary)', marginBottom: '1rem', paddingLeft: '0.5rem', textTransform: 'capitalize' }}>
                {category.name.toLowerCase() === 'regulars' ? 'Current Semester' : 
                 category.name.toLowerCase() === 'others' ? 'Previous Semesters' : 
                 category.name.toLowerCase()}
            </h2>
            {/* Desktop Data Grid View */}
            <div className="desktop-view glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <th style={{ width: '40%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subject</th>
                            <th style={{ width: '10%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sem</th>
                            <th style={{ width: '15%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Code</th>
                            <th style={{ width: '10%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Credits</th>
                            <th style={{ width: '25%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Faculty</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedSubjects.map((subject, idx) => (
                            <tr key={idx} style={{ borderBottom: idx === sortedSubjects.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s', cursor: 'default' }}
                                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <td style={{ padding: '1.25rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <span style={{ fontWeight: '700', color: 'white', fontSize: '0.95rem' }}>{formatSubjectName(subject.description)}</span>
                                    </div>
                                </td>
                                <td style={{ padding: '1.25rem' }}>
                                    <span style={{ background: getSemStyle(subject.semester).bg, padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', color: getSemStyle(subject.semester).color, fontWeight: '800', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sem {subject.semester}</span>
                                </td>
                                <td style={{ padding: '1.25rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', fontWeight: '500' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'rgba(255,255,255,0.3)' }}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                                        {subject.code}
                                    </div>
                                </td>
                                <td style={{ padding: '1.25rem', color: 'rgba(255,255,255,0.9)', fontSize: '1rem', fontWeight: '700' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#fbbf24' }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                        {subject.credit}
                                    </div>
                                </td>
                                <td style={{ padding: '1.25rem', color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
                                    {subject.faculty.includes('No Faculty Assigned') ? (
                                        <span style={{ color: 'var(--error)', fontWeight: '600' }}>Not Assigned</span>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                            {subject.faculty.split(',').map((fac, fIdx) => (
                                                <div key={fIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <svg width="14" height="14" style={{ minWidth: '14px', minHeight: '14px', color: 'rgba(255,255,255,0.4)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                                    <span>{fac.trim()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards View */}
            <div className="responsive-grid mobile-view">
                {sortedSubjects.map((subject, idx) => (
                    <div key={idx} className="glass-panel" style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'white', lineHeight: '1.4', paddingRight: '1rem' }}>
                                {formatSubjectName(subject.description)}
                            </h3>
                            <span style={{ 
                                background: getSemStyle(subject.semester).bg, 
                                padding: '0.2rem 0.6rem', 
                                borderRadius: '6px', 
                                fontSize: '0.75rem', 
                                fontWeight: '800',
                                color: getSemStyle(subject.semester).color,
                                whiteSpace: 'nowrap',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>
                                Sem {subject.semester}
                            </span>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.75rem' }}>
                            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                                <span style={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontSize: '0.7rem' }}>Code:</span><br/> 
                                {subject.code}
                            </p>
                            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                                <span style={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontSize: '0.7rem' }}>Credits:</span><br/> 
                                {subject.credit}
                            </p>
                        </div>

                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px' }}>
                            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', marginBottom: '0.4rem' }}>
                                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>Faculty: </span>
                            </p>
                            {subject.faculty.includes('No Faculty Assigned') ? (
                                <span style={{ color: 'var(--error)', fontSize: '0.85rem' }}>Not Assigned</span>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                    {subject.faculty.split(',').map((fac, fIdx) => (
                                        <div key={fIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
                                            <svg width="12" height="12" style={{ minWidth: '12px', minHeight: '12px', color: 'rgba(255,255,255,0.4)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                            <span>{fac.trim()}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
         </div>
      )})}
      
    </main>
  )
}
