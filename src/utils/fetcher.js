import { ALLOWED_USERNAME } from '@/utils/auth'

export const fetcher = async (url) => {
  let res = await fetch(url)
  
  if (res.status === 401) {
    try {
      const sessions = JSON.parse(localStorage.getItem('erp_sessions') || '[]').filter((session) => session.username === ALLOWED_USERNAME)
      localStorage.setItem('erp_sessions', JSON.stringify(sessions))
      if (sessions.length > 0) {
        const lastSession = sessions[sessions.length - 1]
        const loginRes = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
             username: lastSession.username, 
             password: lastSession.password,
             stayLoggedIn: true
          })
        })
        
        if (loginRes.ok) {
          // Re-attempt original request
          res = await fetch(url)
        } else {
          const error = new Error('Unauthorized')
          error.status = 401
          throw error
        }
      } else {
        const error = new Error('Unauthorized')
        error.status = 401
        throw error
      }
    } catch (e) {
      if (e.status === 401) throw e
      const error = new Error('Unauthorized')
      error.status = 401
      throw error
    }
  }

  const json = await res.json()
  if (json.error) {
    throw new Error(json.error)
  }
  return json
}
