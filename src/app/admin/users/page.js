"use client";

import { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/utils/fetcher';
import SkeletonPage from '@/components/SkeletonPage';

export default function UsersPage() {
  const { data: usersData, error, isLoading: loading, mutate: fetchUsers } = useSWR('/api/admin/users', fetcher);
  const users = usersData?.users || [];
  
  const { data: settingsData, mutate: fetchSettings } = useSWR('/api/admin/settings', fetcher);
  const [accessMode, setAccessMode] = useState('BLACKLIST'); // 'WHITELIST' or 'BLACKLIST'
  
  // Update local accessMode state when settings load
  if (settingsData?.ACCESS_MODE && settingsData.ACCESS_MODE !== accessMode) {
     setAccessMode(settingsData.ACCESS_MODE);
  }

  const [newUserNum, setNewUserNum] = useState('');
  const [addingUser, setAddingUser] = useState(false);

  const toggleAccessMode = async (newMode) => {
    setAccessMode(newMode);
    await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'ACCESS_MODE', value: newMode })
    });
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUserNum) return;
    
    setAddingUser(true);
    try {
      const res = await fetch('/api/admin/users/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registerNum: newUserNum })
      });
      const data = await res.json();
      if (res.ok) {
        setNewUserNum('');
        fetchUsers();
      } else {
        alert(data.error || 'Failed to add user');
      }
    } catch (e) {
      console.error(e);
      alert('Network error');
    }
    setAddingUser(false);
  };

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

  const deleteUser = async (id) => {
    if (!confirm('Are you sure you want to permanently delete this user?')) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        fetchUsers();
      } else {
        alert(data.error || 'Failed to delete user');
      }
    } catch (e) {
      console.error(e);
      alert('Network error');
    }
  };

  if (loading) {
    return <SkeletonPage />;
  }

  return (
    <main className="main-container animate-slide-up" style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '2rem', margin: 0 }}>Users</h1>
        
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '0.25rem', width: 'fit-content' }}>
          <button 
              onClick={() => toggleAccessMode('BLACKLIST')}
              style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', border: 'none', background: accessMode === 'BLACKLIST' ? '#ef4444' : 'transparent', color: accessMode === 'BLACKLIST' ? '#fff' : 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: '0.85rem', transition: 'transform 0.3s ease, opacity 0.3s ease, background-color 0.3s ease, border-color 0.3s ease', cursor: 'pointer' }}
              title="Blacklist Mode: Anyone can enter, EXCEPT banned users."
          >
              Blacklist Mode
          </button>
          <button 
              onClick={() => toggleAccessMode('WHITELIST')}
              style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', border: 'none', background: accessMode === 'WHITELIST' ? '#10b981' : 'transparent', color: accessMode === 'WHITELIST' ? '#fff' : 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: '0.85rem', transition: 'transform 0.3s ease, opacity 0.3s ease, background-color 0.3s ease, border-color 0.3s ease', cursor: 'pointer' }}
              title="Whitelist Mode: Only approved users can enter."
          >
              Whitelist Mode
          </button>
        </div>
      </div>

      {accessMode === 'WHITELIST' && (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: '0 0 0.25rem 0', color: 'white' }}>Pre-Register User</h3>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Add a user&apos;s register number so they can log in during Whitelist mode.</p>
          </div>
          <form onSubmit={handleAddUser} style={{ display: 'flex', gap: '0.75rem' }}>
            <input 
              type="text" 
              placeholder="e.g. 24-UCS-001" 
              value={newUserNum}
              onChange={e => setNewUserNum(e.target.value)}
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.75rem 1rem', borderRadius: '8px', outline: 'none' }}
              required
            />
            <button 
              type="submit" 
              disabled={addingUser}
              style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0 1.5rem', borderRadius: '8px', fontWeight: '600', cursor: addingUser ? 'not-allowed' : 'pointer', opacity: addingUser ? 0.7 : 1 }}
            >
              Add User
            </button>
          </form>
        </div>
      )}
      
      <div className="desktop-view glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <th style={{ width: '15%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Register No.</th>
              <th style={{ width: '15%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</th>
              <th style={{ width: '20%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
              <th style={{ width: '25%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Sync</th>
              <th style={{ width: '25%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
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
                    <option value="APPROVED">APPROVED</option>
                    <option value="BANNED">BANNED</option>
                  </select>
                </td>
                <td style={{ padding: '1.25rem', color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>{user.lastSyncDashboard ? new Date(user.lastSyncDashboard).toLocaleString() : 'Never'}</td>
                <td style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button 
                      style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.4rem 0.8rem', borderRadius: '8px', fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer', transition: 'transform 0.2s, opacity 0.2s, background-color 0.2s, border-color 0.2s' }}
                      onClick={() => { if(confirm('Are you sure you want to force logout this user?')) updateUser(user.id, { forceLogout: true }) }}
                      title="Force Logout"
                      onMouseOver={e => { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.2)' }}
                      onMouseOut={e => { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)' }}
                    >
                      Logout
                    </button>
                    <button 
                      style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.4rem 0.8rem', borderRadius: '8px', fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer', transition: 'transform 0.2s, opacity 0.2s, background-color 0.2s, border-color 0.2s' }}
                      onClick={() => updateUser(user.id, { status: 'BANNED' })}
                      title="Force Logout / Ban"
                      onMouseOver={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)' }}
                      onMouseOut={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)' }}
                    >
                      Ban
                    </button>
                    <button 
                      style={{ background: 'rgba(220, 38, 38, 0.2)', color: '#f87171', border: '1px solid rgba(220, 38, 38, 0.4)', padding: '0.4rem 0.8rem', borderRadius: '8px', fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer', transition: 'transform 0.2s, opacity 0.2s, background-color 0.2s, border-color 0.2s' }}
                      onClick={() => deleteUser(user.id)}
                      title="Permanently Delete User"
                      onMouseOver={e => { e.currentTarget.style.background = 'rgba(220, 38, 38, 0.3)' }}
                      onMouseOut={e => { e.currentTarget.style.background = 'rgba(220, 38, 38, 0.2)' }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>No users found.</td>
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
                      onClick={() => updateUser(user.id, { status: 'BANNED' })}
                   >
                      Ban
                   </button>
                   <button 
                      style={{ background: 'rgba(220, 38, 38, 0.2)', color: '#f87171', border: '1px solid rgba(220, 38, 38, 0.4)', padding: '0.3rem 0.6rem', borderRadius: '6px', fontWeight: '600', fontSize: '0.75rem' }}
                      onClick={() => deleteUser(user.id)}
                   >
                      Delete
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
                      <option value="APPROVED">APPROVED</option>
                      <option value="BANNED">BANNED</option>
                    </select>
                </div>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.5rem' }}>
                Last Sync (Dashboard): {user.lastSyncDashboard ? new Date(user.lastSyncDashboard).toLocaleString() : 'Never'}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
