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
    <main className="main-container animate-slide-up" style={{ justifyContent: 'flex-start', paddingBottom: '6rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '2rem', margin: 0 }}>Subjects</h1>
      </div>

      {categories.map((category, catIdx) => (
         <div key={catIdx} style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--primary)', marginBottom: '1rem', paddingLeft: '0.5rem', textTransform: 'capitalize' }}>
                {category.name.toLowerCase() === 'regulars' ? 'Current Semester' : 
                 category.name.toLowerCase() === 'others' ? 'Previous Semesters' : 
                 category.name.toLowerCase()}
            </h2>
            <div className="responsive-grid">
                {category.subjects.map((subject, idx) => (
                    <div key={idx} className="glass-panel" style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'white', lineHeight: '1.4', paddingRight: '1rem' }}>
                                {formatSubjectName(subject.description)}
                            </h3>
                            <span style={{ 
                                background: 'rgba(255,255,255,0.1)', 
                                padding: '0.2rem 0.6rem', 
                                borderRadius: '6px', 
                                fontSize: '0.75rem', 
                                fontWeight: '700',
                                color: 'var(--primary)',
                                whiteSpace: 'nowrap'
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
                            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
                                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>Faculty: </span>
                                {subject.faculty.includes('No Faculty Assigned') ? (
                                    <span style={{ color: 'var(--error)' }}>Not Assigned</span>
                                ) : (
                                    subject.faculty
                                )}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
         </div>
      ))}
      
    </main>
  )
}
