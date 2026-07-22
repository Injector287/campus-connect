"use client";

import { useEffect, useState } from 'react';

export default function RateLimitPage() {
  const [globalLimit, setGlobalLimit] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingGlobal, setSavingGlobal] = useState(false);

  const fetchData = () => {
    Promise.all([
      fetch('/api/admin/settings').then(res => res.json()),
      fetch('/api/admin/users').then(res => res.json())
    ]).then(([settings, usersData]) => {
      setGlobalLimit(settings.GLOBAL_RATE_LIMIT || '60');
      setUsers(usersData.users || []);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const saveGlobalLimit = async () => {
    setSavingGlobal(true);
    await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'GLOBAL_RATE_LIMIT', value: globalLimit })
    });
    setSavingGlobal(false);
    alert('Global limit saved!');
  };

  const saveCustomLimit = async (userId, limitStr) => {
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customRateLimit: limitStr })
    });
    fetchData();
  };

  if (loading) {
    return (
      <main className="main-container" style={{ alignItems: 'center' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }}></div>
        <p style={{ marginTop: '1rem', color: 'rgba(255,255,255,0.7)' }}>Loading Rate Limits...</p>
      </main>
    );
  }

  return (
    <main className="main-container animate-slide-up" style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '2rem', margin: 0 }}>Rate Limiting</h1>
      </div>
      
      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', color: 'white', marginBottom: '1rem' }}>Global Configuration</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem', fontWeight: '500' }}>Requests per minute</label>
              <input 
                type="number" 
                style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.75rem', borderRadius: '12px', outline: 'none' }}
                value={globalLimit}
                onChange={e => setGlobalLimit(e.target.value)}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
          </div>
          <div style={{ alignSelf: 'flex-end' }}>
              <button 
                onClick={saveGlobalLimit}
                disabled={savingGlobal}
                style={{ 
                    background: 'var(--primary)', color: 'white', border: 'none', 
                    padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: '600', 
                    cursor: savingGlobal ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                    opacity: savingGlobal ? 0.7 : 1
                }}
              >
                {savingGlobal ? 'Saving...' : 'Save Global Limit'}
              </button>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', color: 'white', margin: 0 }}>Custom User Limits</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', margin: '0.5rem 0 0 0', fontSize: '0.85rem' }}>Set specific rate limits for users. Leave blank to use global limit.</p>
        </div>
        <div className="desktop-view">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <th style={{ width: '25%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Register No.</th>
                <th style={{ width: '25%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</th>
                <th style={{ width: '25%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Custom Limit</th>
                <th style={{ width: '25%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action</th>
                </tr>
            </thead>
            <tbody>
                {users.map((user, idx) => (
                <tr key={user.id} style={{ borderBottom: idx === users.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                    <td style={{ padding: '1.25rem', color: 'white', fontWeight: '500', fontSize: '0.9rem' }}>{user.registerNum}</td>
                    <td style={{ padding: '1.25rem', color: 'rgba(255,255,255,0.8)' }}>
                        <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{user.role}</span>
                    </td>
                    <td style={{ padding: '1.25rem' }}>
                    <input 
                        type="number"
                        placeholder="Global"
                        defaultValue={user.customRateLimit || ''}
                        onBlur={e => saveCustomLimit(user.id, e.target.value)}
                        style={{ width: '100px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.5rem 0.75rem', borderRadius: '8px', outline: 'none' }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                    />
                    </td>
                    <td style={{ padding: '1.25rem' }}>
                        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>Auto-saves on blur</span>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>

        <div className="mobile-only" style={{ padding: '0 1.5rem 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {users.map((user) => (
               <div key={user.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ color: 'white', fontWeight: '600' }}>{user.registerNum}</span>
                      <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.1)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{user.role}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>Custom Limit (Auto-saves on blur):</label>
                      <input 
                        type="number"
                        placeholder="Global"
                        defaultValue={user.customRateLimit || ''}
                        onBlur={e => saveCustomLimit(user.id, e.target.value)}
                        style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.75rem', borderRadius: '8px', outline: 'none' }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                      />
                  </div>
               </div>
            ))}
        </div>
      </div>
    </main>
  );
}
