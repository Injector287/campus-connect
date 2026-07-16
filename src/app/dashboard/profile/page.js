'use client'

import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import { fetcher } from '@/utils/fetcher'

export default function ProfilePage() {
  const router = useRouter()
  const { data: json, error, isLoading } = useSWR('/api/profile', fetcher)

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
        <p style={{ marginTop: '1rem', color: 'rgba(255,255,255,0.7)' }}>Loading Profile...</p>
      </main>
    )
  }

  const profile = json?.profile
  if (!profile) return null



  return (
    <main className="main-container animate-slide-up" style={{ justifyContent: 'flex-start', paddingBottom: '6rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '2rem', margin: 0 }}>Profile</h1>
      </div>

      {/* Profile ID Card */}
      <div className="glass-panel" style={{ 
          marginBottom: '2rem', padding: '0', overflow: 'hidden', 
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))' 
      }}>
          <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              {profile.photo ? (
                  <img 
                      src={profile.photo} 
                      alt="Profile" 
                      style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--primary)', marginBottom: '1rem' }} 
                  />
              ) : (
                  <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '2rem', color: 'rgba(255,255,255,0.5)' }}>?</span>
                  </div>
              )}
              
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.25rem' }}>{profile.name}</h2>
              <p style={{ color: 'var(--primary)', fontWeight: '600', fontSize: '1rem', marginBottom: '0.5rem' }}>{profile.deptNo}</p>
              <span style={{ 
                  background: 'rgba(74, 222, 128, 0.2)', color: '#4ade80', 
                  padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600' 
              }}>
                  Active Student
              </span>
          </div>
          
          <div style={{ padding: '1.5rem' }}>
              <div className="responsive-grid-2col" style={{ gap: '1rem' }}>
                  
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px' }}>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Course</p>
                      <p style={{ fontSize: '0.95rem', fontWeight: '500' }}>{profile.course}</p>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px' }}>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Register Number (URN)</p>
                      <p style={{ fontSize: '0.95rem', fontWeight: '500' }}>{profile.urn}</p>
                  </div>

                  {profile.academicYear && profile.academicYear.includes(' / ') ? (
                      <>
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px' }}>
                              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Academic Year</p>
                              <p style={{ fontSize: '0.95rem', fontWeight: '500' }}>{profile.academicYear.split(' / ')[0]}</p>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px' }}>
                              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Semester</p>
                              <p style={{ fontSize: '0.95rem', fontWeight: '500' }}>{profile.academicYear.split(' / ')[1]}</p>
                          </div>
                          {profile.academicYear.split(' / ')[2] && (
                              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px' }}>
                                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Section</p>
                                  <p style={{ fontSize: '0.95rem', fontWeight: '500' }}>{profile.academicYear.split(' / ')[2]}</p>
                              </div>
                          )}
                      </>
                  ) : (
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px' }}>
                          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Academic Year / Semester</p>
                          <p style={{ fontSize: '0.95rem', fontWeight: '500' }}>{profile.academicYear}</p>
                      </div>
                  )}

                  {profile.dobGender && profile.dobGender.includes(' / ') ? (
                      <>
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px' }}>
                              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Date of Birth</p>
                              <p style={{ fontSize: '0.95rem', fontWeight: '500' }}>{profile.dobGender.split(' / ')[0]}</p>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px' }}>
                              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Gender</p>
                              <p style={{ fontSize: '0.95rem', fontWeight: '500' }}>{profile.dobGender.split(' / ')[1]}</p>
                          </div>
                      </>
                  ) : (
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px' }}>
                          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>DOB / Gender</p>
                          <p style={{ fontSize: '0.95rem', fontWeight: '500' }}>{profile.dobGender}</p>
                      </div>
                  )}
                  
                  {profile.contact && profile.contact.includes(' / ') ? (
                      <>
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px' }}>
                              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Phone Number</p>
                              <p style={{ fontSize: '0.95rem', fontWeight: '500' }}>{profile.contact.split(' / ')[0]}</p>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', wordBreak: 'break-all' }}>
                              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Email</p>
                              <p style={{ fontSize: '0.95rem', fontWeight: '500' }}>{profile.contact.split(' / ')[1]}</p>
                          </div>
                      </>
                  ) : (
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', wordBreak: 'break-all' }}>
                          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Contact Info</p>
                          <p style={{ fontSize: '0.95rem', fontWeight: '500' }}>{profile.contact}</p>
                      </div>
                  )}

                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', gridColumn: '1 / -1' }}>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Address</p>
                      <p style={{ fontSize: '0.95rem', fontWeight: '500', lineHeight: '1.5' }}>{profile.address}</p>
                  </div>
                  
              </div>
          </div>
      </div>
      
    </main>
  )
}
