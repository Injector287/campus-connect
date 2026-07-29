'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginContent() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [stayLoggedIn, setStayLoggedIn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const errorParam = searchParams.get('error')
    
    // If the dashboard kicked them out, wipe their saved sessions so they don't auto-login and loop
    if (errorParam === '401') {
      localStorage.removeItem('erp_sessions')
      setTimeout(() => {
        setError('Your session has expired or you have been logged out. Please log in again.')
      }, 0)
      return
    }

    const sessions = JSON.parse(localStorage.getItem('erp_sessions') || '[]')
    if (sessions.length > 0) {
      // Safely auto-login
      router.push('/dashboard')
    }
  }, [router, searchParams])

  const handleLogin = async (e) => {
    e.preventDefault()
    handleLoginAction(username, password, stayLoggedIn)
  }

  const handleLoginAction = async (user, pass, stayLog) => {
    if (!user || !pass) {
      setError('Please enter both your Student ID and Password.')
      return
    }
    
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass, stayLoggedIn: stayLog })
      })

      const data = await res.json()

      if (res.ok) {
        if (stayLog) {
          const currentSessions = JSON.parse(localStorage.getItem('erp_sessions') || '[]')
          const existingIndex = currentSessions.findIndex(s => s.username === user)
          if (existingIndex >= 0) {
             currentSessions[existingIndex].password = pass
          } else {
           currentSessions.push({ username: user, password: pass })
          }
          localStorage.setItem('erp_sessions', JSON.stringify(currentSessions))
        }
        router.push('/dashboard')
      } else {
        setError(data.error || 'Login failed. Please check your credentials.')
      }
    } catch (err) {
      setError('A network error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="main-container animate-slide-up" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Loyola ERP</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>Sign in with your student credentials.</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label className="input-label" htmlFor="username">Student ID (Dept. No.)</label>
            <input 
              id="username"
              type="text" 
              className="input-field" 
              placeholder="e.g. 19UCO123"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoComplete="username"
            />
          </div>
          
          <div className="input-group">
            <label className="input-label" htmlFor="password">Password</label>
            <input 
              id="password"
              type="password" 
              className="input-field" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', marginLeft: '0.25rem' }}>
             <input 
                 type="checkbox" 
                 id="stayLoggedIn" 
                 checked={stayLoggedIn}
                 onChange={(e) => setStayLoggedIn(e.target.checked)}
                 disabled={loading}
                 style={{ accentColor: 'var(--primary)', width: '16px', height: '16px', cursor: 'pointer' }}
             />
             <label htmlFor="stayLoggedIn" style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', userSelect: 'none' }}>
                 Stay logged in
             </label>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <><span className="spinner"></span> <span style={{marginLeft: '0.5rem'}}>Authenticating...</span></>
            ) : 'Sign In'}
          </button>
        </form>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="main-container" style={{ alignItems: 'center' }}><div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }}></div></div>}>
      <LoginContent />
    </Suspense>
  )
}
