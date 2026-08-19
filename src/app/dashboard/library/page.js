'use client'
import { useEffect } from 'react';

import { useState } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import { fetcher } from '@/utils/fetcher'
import { useTabState } from '@/hooks/useTabState'
import SkeletonPage from '@/components/SkeletonPage';

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useTabState('tab', 'hand') // 'hand', 'activities', 'fines'
  const [slideDirection, setSlideDirection] = useState('');
  const router = useRouter()
  const { data: json, error, isLoading } = useSWR('/api/library', fetcher)

  useEffect(() => {
    if (error && error.status === 401) {
      router.push('/')
    }
  }, [error, router])

  if (error) {
    if (error.status === 401) {
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
    return <SkeletonPage />;
  }

  const library = json?.library || {}
  if (!json) return null

  const renderBooks = (rawBooks) => {
      if (!rawBooks || rawBooks.length === 0) {
          return (
              <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)', gridColumn: '1 / -1' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 1rem auto', display: 'block', opacity: 0.5 }}>
                      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
                  </svg>
                  <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>No records found.</p>
              </div>
          )
      }
      
      const parseDate = (dStr) => {
          if (!dStr) return 0;
          const str = dStr.split(' ')[0];
          const parts = str.split(/[-./]/);
          if (parts.length === 3 && parts[2].length === 4) {
              return new Date(parts[2], parts[1]-1, parts[0]).getTime();
          }
          return new Date(str).getTime() || 0;
      };

      const books = [...rawBooks].sort((a, b) => parseDate(b.borrowedDate) - parseDate(a.borrowedDate));

      return (
        <>
        {/* Desktop Data Grid View */}
        <div className="desktop-view glass-panel" style={{ padding: '0', overflow: 'hidden', marginBottom: '2rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <th style={{ width: '40%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Title</th>
                        <th style={{ width: '20%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Borrowed</th>
                        <th style={{ width: '20%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Due Date</th>
                        <th style={{ width: '20%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {books.map((book, idx) => (
                        <tr key={idx} style={{ borderBottom: idx === books.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <td style={{ padding: '1.25rem' }}>
                                <span style={{ fontWeight: '700', color: 'white', fontSize: '0.95rem' }}>{book.title}</span>
                            </td>
                            <td style={{ padding: '1.25rem', textAlign: 'center', fontWeight: '500', color: 'rgba(255,255,255,0.8)' }}>
                                {book.borrowedDate ? book.borrowedDate.split(' ')[0] : '-'}
                            </td>
                            <td style={{ padding: '1.25rem', textAlign: 'center', fontWeight: '600', color: 'var(--primary)' }}>
                                {book.dueDate || '-'}
                            </td>
                            <td style={{ padding: '1.25rem', textAlign: 'right' }}>
                                {book.returnedDate ? (
                                    <span style={{ background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700' }}>
                                        Returned: {book.returnedDate}
                                    </span>
                                ) : book.fineAmount ? (
                                    <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700' }}>
                                        Fine: ₹{book.fineAmount}
                                    </span>
                                ) : (
                                    <span style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'rgba(255,255,255,0.7)', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600' }}>
                                        Pending
                                    </span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* Mobile Cards View */}
        <div className="responsive-grid mobile-view">
          {books.map((book, idx) => (
              <div key={idx} className="glass-panel" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'white', lineHeight: '1.4', paddingRight: '1rem' }}>
                          {book.title}
                      </h3>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                          <span style={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontSize: '0.7rem' }}>Borrowed:</span><br/> 
                          {book.borrowedDate ? book.borrowedDate.split(' ')[0] : '-'}
                      </p>
                      <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                          <span style={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontSize: '0.7rem' }}>Due Date:</span><br/> 
                          <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{book.dueDate || '-'}</span>
                      </p>
                  </div>
                  
                  {book.returnedDate && (
                      <div style={{ background: 'rgba(74, 222, 128, 0.1)', padding: '0.5rem 0.75rem', borderRadius: '8px', borderLeft: '3px solid #4ade80' }}>
                          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)' }}>
                              <span style={{ color: '#4ade80', fontSize: '0.75rem', fontWeight: '700' }}>Returned on: </span>
                              {book.returnedDate}
                          </p>
                      </div>
                  )}
                  {book.fineAmount && (
                      <div style={{ marginTop: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem 0.75rem', borderRadius: '8px', borderLeft: '3px solid #ef4444' }}>
                          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)' }}>
                              <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: '700' }}>Fine: </span>
                              ₹{book.fineAmount} {book.status ? `(${book.status})` : ''}
                          </p>
                      </div>
                  )}
              </div>
          ))}
        </div>
        </>
      )
  }

  return (
    <main className="main-container animate-slide-up" style={{ justifyContent: 'flex-start', minHeight: '101vh' }}>
      
      {/* Header */}
      <div className="desktop-view" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '2rem', margin: 0 }}>Library</h1>
        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', background: 'rgba(0,0,0,0.2)', padding: '0.35rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)', width: 'fit-content' }}>
            <div style={{
                position: 'absolute', top: '0.35rem', bottom: '0.35rem',
                left: '0.35rem',
                transform: activeTab === 'hand' ? 'translateX(0)' : activeTab === 'activities' ? 'translateX(100%)' : 'translateX(200%)',
                width: 'calc((100% - 0.7rem) / 3)',
                background: 'var(--primary)', borderRadius: '10px',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                willChange: 'transform'
            }} />
            <button 
                onClick={() => { setSlideDirection('left'); setActiveTab('hand'); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1, padding: '0.5rem 1rem', borderRadius: '10px', border: 'none', background: 'transparent', color: activeTab === 'hand' ? 'white' : 'rgba(255,255,255,0.6)', fontWeight: '600', cursor: 'pointer', transition: 'color 0.3s', fontSize: '0.9rem', outline: 'none', WebkitTapHighlightColor: 'transparent', userSelect: 'none' }}
            >
                In Hand
            </button>
            <button 
                onClick={() => { setSlideDirection(activeTab === 'hand' ? 'right' : 'left'); setActiveTab('activities'); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1, padding: '0.5rem 1rem', borderRadius: '10px', border: 'none', background: 'transparent', color: activeTab === 'activities' ? 'white' : 'rgba(255,255,255,0.6)', fontWeight: '600', cursor: 'pointer', transition: 'color 0.3s', fontSize: '0.9rem', outline: 'none', WebkitTapHighlightColor: 'transparent', userSelect: 'none' }}
            >
                History
            </button>
            <button 
                onClick={() => { setSlideDirection('right'); setActiveTab('fines'); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1, padding: '0.5rem 1rem', borderRadius: '10px', border: 'none', background: 'transparent', color: activeTab === 'fines' ? 'white' : 'rgba(255,255,255,0.6)', fontWeight: '600', cursor: 'pointer', transition: 'color 0.3s', fontSize: '0.9rem', outline: 'none', WebkitTapHighlightColor: 'transparent', userSelect: 'none' }}
            >
                Fines
            </button>
        </div>
      </div>

      <div className="mobile-view" style={{ marginBottom: '1.5rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '2rem', margin: 0 }}>Library</h1>
      </div>      {/* Mobile Tabs */}
      <div className="mobile-view" style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', background: 'rgba(0,0,0,0.2)', padding: '0.35rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '1.5rem', width: '100%' }}>
          <div style={{
              position: 'absolute', top: '0.35rem', bottom: '0.35rem',
              left: '0.35rem',
              transform: activeTab === 'hand' ? 'translateX(0)' : activeTab === 'activities' ? 'translateX(100%)' : 'translateX(200%)',
              width: 'calc((100% - 0.7rem) / 3)',
              background: 'var(--primary)', borderRadius: '10px',
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              willChange: 'transform'
          }} />
          <button 
              onClick={() => { setSlideDirection('left'); setActiveTab('hand'); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1, padding: '0.5rem 0', borderRadius: '10px', border: 'none', background: 'transparent', color: activeTab === 'hand' ? 'white' : 'rgba(255,255,255,0.6)', fontWeight: '600', cursor: 'pointer', transition: 'color 0.3s', fontSize: '0.85rem', outline: 'none', WebkitTapHighlightColor: 'transparent', userSelect: 'none' }}
          >
              In Hand
          </button>
          <button 
              onClick={() => { setSlideDirection(activeTab === 'hand' ? 'right' : 'left'); setActiveTab('activities'); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1, padding: '0.5rem 0', borderRadius: '10px', border: 'none', background: 'transparent', color: activeTab === 'activities' ? 'white' : 'rgba(255,255,255,0.6)', fontWeight: '600', cursor: 'pointer', transition: 'color 0.3s', fontSize: '0.85rem', outline: 'none', WebkitTapHighlightColor: 'transparent', userSelect: 'none' }}
          >
              History
          </button>
          <button 
              onClick={() => { setSlideDirection('right'); setActiveTab('fines'); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1, padding: '0.5rem 0', borderRadius: '10px', border: 'none', background: 'transparent', color: activeTab === 'fines' ? 'white' : 'rgba(255,255,255,0.6)', fontWeight: '600', cursor: 'pointer', transition: 'color 0.3s', fontSize: '0.85rem', outline: 'none', WebkitTapHighlightColor: 'transparent', userSelect: 'none' }}
          >
              Fines
          </button>
      </div>

      <style>{`
        .mobile-view { display: none; }
        .desktop-view { display: block; }
        @media (max-width: 768px) {
            .mobile-view { display: block; }
            .desktop-view { display: none; }
        }
      `}</style>

      <div key={activeTab} className={slideDirection ? (slideDirection === 'left' ? 'animate-slide-left' : 'animate-slide-right') : ''}>
          {activeTab === 'hand' && renderBooks(library.booksInHand)}
          {activeTab === 'activities' && renderBooks(library.activities)}
          {activeTab === 'fines' && renderBooks(library.fines)}
      </div>
      
    </main>
  )
}
