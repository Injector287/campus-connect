"use client";

import { useEffect, useState } from 'react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = () => {
    fetch('/api/admin/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data.users || []);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateUser = async (id, updates) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <main className="main-container" style={{ alignItems: 'center' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }}></div>
        <p style={{ marginTop: '1rem', color: 'rgba(255,255,255,0.7)' }}>Loading Users...</p>
      </main>
    );
  }

  return (
    <main className="main-container animate-slide-up" style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '2rem', margin: 0 }}>User Management</h1>
      </div>
      
      <div className="desktop-view glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <th style={{ width: '15%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Register No.</th>
              <th style={{ width: '15%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</th>
              <th style={{ width: '20%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
              <th style={{ width: '15%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rate Limit</th>
              <th style={{ width: '20%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Sync</th>
              <th style={{ width: '15%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, idx) => (
              <tr key={user.id} style={{ borderBottom: idx === users.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '1.25rem', color: 'white', fontWeight: '500', fontSize: '0.9rem' }}>{user.registerNum}</td>
                <td style={{ padding: '1.25rem' }}>
                  <select 
                    value={user.role} 
                    onChange={e => updateUser(user.id, { role: e.target.value })}
                    style={{ background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '0.4rem 0.6rem', borderRadius: '8px', outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </td>
                <td style={{ padding: '1.25rem' }}>
                  <select 
                    value={user.status} 
                    onChange={e => updateUser(user.id, { status: e.target.value })}
                    style={{ background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '0.4rem 0.6rem', borderRadius: '8px', outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="WHITELISTED">WHITELISTED</option>
                    <option value="BLACKLISTED">BLACKLISTED</option>
                  </select>
                </td>
                <td style={{ padding: '1.25rem', color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>{user.customRateLimit || 'Default'}</td>
                <td style={{ padding: '1.25rem', color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>{new Date(user.lastSync).toLocaleString()}</td>
                <td style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button 
                      style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.4rem 0.8rem', borderRadius: '8px', fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s' }}
                      onClick={() => { if(confirm('Are you sure you want to force logout this user?')) updateUser(user.id, { forceLogout: true }) }}
                      title="Force Logout"
                      onMouseOver={e => { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.2)' }}
                      onMouseOut={e => { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)' }}
                    >
                      Logout
                    </button>
                    <button 
                      style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.4rem 0.8rem', borderRadius: '8px', fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s' }}
                      onClick={() => updateUser(user.id, { status: 'BLACKLISTED' })}
                      title="Force Logout / Blacklist"
                      onMouseOver={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)' }}
                      onMouseOut={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)' }}
                    >
                      Ban
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mobile-only responsive-grid" style={{ marginTop: '1rem' }}>
        {users.map((user) => (
          <div key={user.id} className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <span style={{ color: 'white', fontWeight: '600', fontSize: '1rem' }}>{user.registerNum}</span>
               <div style={{ display: 'flex', gap: '0.5rem' }}>
                   <button 
                      style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.3rem 0.6rem', borderRadius: '6px', fontWeight: '600', fontSize: '0.75rem' }}
                      onClick={() => { if(confirm('Force logout?')) updateUser(user.id, { forceLogout: true }) }}
                   >
                      Logout
                   </button>
                   <button 
                      style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.3rem 0.6rem', borderRadius: '6px', fontWeight: '600', fontSize: '0.75rem' }}
                      onClick={() => updateUser(user.id, { status: 'BLACKLISTED' })}
                   >
                      Ban
                   </button>
               </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '0.25rem', display: 'block' }}>Role</label>
                    <select 
                      value={user.role} 
                      onChange={e => updateUser(user.id, { role: e.target.value })}
                      style={{ background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '0.4rem', borderRadius: '8px', width: '100%' }}
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                </div>
                <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '0.25rem', display: 'block' }}>Status</label>
                    <select 
                      value={user.status} 
                      onChange={e => updateUser(user.id, { status: e.target.value })}
                      style={{ background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '0.4rem', borderRadius: '8px', width: '100%' }}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="WHITELISTED">WHITELISTED</option>
                      <option value="BLACKLISTED">BLACKLISTED</option>
                    </select>
                </div>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.5rem' }}>
                Last Sync: {new Date(user.lastSync).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
