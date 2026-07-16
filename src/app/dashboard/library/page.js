'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import { fetcher } from '@/utils/fetcher'

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState('hand') // 'hand', 'activities', 'fines'
  const router = useRouter()
  const { data: json, error, isLoading } = useSWR('/api/library', fetcher)

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
        <p style={{ marginTop: '1rem', color: 'rgba(255,255,255,0.7)' }}>Loading Library...</p>
      </main>
    )
  }

  const library = json?.library
  if (!json) return null

  const renderBooks = (books) => {
      if (!books || books.length === 0) {
          return (
              <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)', gridColumn: '1 / -1' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 1rem auto', display: 'block', opacity: 0.5 }}>
                      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
                  </svg>
                  <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>No records found.</p>
              </div>
          )
      }
      
      return books.map((book, idx) => (
          <div key={idx} className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'white', lineHeight: '1.4', paddingRight: '1rem' }}>
                      {book.title}
                  </h3>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                      <span style={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontSize: '0.7rem' }}>Borrowed:</span><br/> 
                      {book.borrowedDate.split(' ')[0]}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                      <span style={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontSize: '0.7rem' }}>Due Date:</span><br/> 
                      <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{book.dueDate}</span>
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
                          ₹{book.fineAmount} ({book.status})
                      </p>
                  </div>
              )}
          </div>
      ))
  }

  return (
    <main className="main-container animate-slide-up" style={{ justifyContent: 'flex-start', paddingBottom: '6rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '2rem', margin: 0 }}>Library</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '0.25rem', marginBottom: '1.5rem' }}>
          <button 
              onClick={() => setActiveTab('hand')}
              style={{ flex: 1, padding: '0.75rem 0', borderRadius: '8px', border: 'none', background: activeTab === 'hand' ? 'var(--primary)' : 'transparent', color: activeTab === 'hand' ? '#fff' : 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: '0.875rem', transition: 'all 0.3s ease', cursor: 'pointer' }}
          >
              In Hand
          </button>
          <button 
              onClick={() => setActiveTab('activities')}
              style={{ flex: 1, padding: '0.75rem 0', borderRadius: '8px', border: 'none', background: activeTab === 'activities' ? 'var(--primary)' : 'transparent', color: activeTab === 'activities' ? '#fff' : 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: '0.875rem', transition: 'all 0.3s ease', cursor: 'pointer' }}
          >
              History
          </button>
          <button 
              onClick={() => setActiveTab('fines')}
              style={{ flex: 1, padding: '0.75rem 0', borderRadius: '8px', border: 'none', background: activeTab === 'fines' ? 'var(--primary)' : 'transparent', color: activeTab === 'fines' ? '#fff' : 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: '0.875rem', transition: 'all 0.3s ease', cursor: 'pointer' }}
          >
              Fines
          </button>
      </div>

      <div className="responsive-grid">
          {activeTab === 'hand' && renderBooks(library.booksInHand)}
          {activeTab === 'activities' && renderBooks(library.activities)}
          {activeTab === 'fines' && renderBooks(library.fines)}
      </div>
      
    </main>
  )
}
