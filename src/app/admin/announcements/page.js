"use client";

import { useEffect, useState } from 'react';

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetRole, setTargetRole] = useState('ALL');
  const [publishing, setPublishing] = useState(false);

  const fetchAnnouncements = () => {
    fetch('/api/admin/announcements')
      .then(res => res.json())
      .then(data => {
        setAnnouncements(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const createAnnouncement = async (e) => {
    e.preventDefault();
    setPublishing(true);
    await fetch('/api/admin/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, targetRole })
    });
    setTitle('');
    setContent('');
    setPublishing(false);
    fetchAnnouncements();
  };

  const deleteAnnouncement = async (id) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE' });
    fetchAnnouncements();
  };

  if (loading) {
    return (
      <main className="main-container" style={{ alignItems: 'center' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }}></div>
        <p style={{ marginTop: '1rem', color: 'rgba(255,255,255,0.7)' }}>Loading Announcements...</p>
      </main>
    );
  }

  return (
    <main className="main-container animate-slide-up" style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '2rem', margin: 0 }}>Announcements</h1>
      </div>
      
      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', color: 'white', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}>
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Create Announcement
        </h2>
        <form onSubmit={createAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem', fontWeight: '500' }}>Title</label>
            <input 
              type="text" 
              style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.85rem 1rem', borderRadius: '12px', outline: 'none', transition: 'border-color 0.2s' }}
              value={title}
              onChange={e => setTitle(e.target.value)}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              required
              placeholder="e.g. End of Semester Examinations"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem', fontWeight: '500' }}>Content</label>
            <textarea 
              rows="4"
              style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '1rem', borderRadius: '12px', outline: 'none', transition: 'border-color 0.2s', resize: 'vertical' }}
              value={content}
              onChange={e => setContent(e.target.value)}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              required
              placeholder="Write your announcement here..."
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem', fontWeight: '500' }}>Target Audience</label>
            <select 
              style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.85rem 1rem', borderRadius: '12px', outline: 'none', cursor: 'pointer', transition: 'border-color 0.2s' }}
              value={targetRole}
              onChange={e => setTargetRole(e.target.value)}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            >
              <option value="ALL">All Users</option>
              <option value="USER">Only Regular Users (Students)</option>
              <option value="ADMIN">Only Admins</option>
            </select>
          </div>
          <button type="submit" disabled={publishing} style={{ 
              alignSelf: 'flex-start', background: 'var(--primary)', color: 'white', border: 'none', 
              padding: '0.85rem 2rem', borderRadius: '12px', fontWeight: '600', cursor: publishing ? 'not-allowed' : 'pointer', 
              transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: publishing ? 0.7 : 1
          }}>
            {publishing ? 'Publishing...' : (
                <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    Publish Announcement
                </>
            )}
          </button>
        </form>
      </div>

      <div>
        <h2 style={{ fontSize: '1.25rem', color: 'white', marginBottom: '1rem' }}>Past Announcements</h2>
        {announcements.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '3rem 1rem' }}>
                No announcements found.
            </div>
        ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {announcements.map(ann => (
                <div key={ann.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <div>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: 'white', fontSize: '1.1rem' }}>{ann.title}</h3>
                        <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.1)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase' }}>Target: {ann.targetRole}</span>
                    </div>
                    <button onClick={() => deleteAnnouncement(ann.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                    onMouseOver={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)' }}
                    onMouseOut={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)' }}
                    title="Delete Announcement"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                  </div>
                  <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{ann.content}</p>
                  <small style={{ color: 'rgba(255,255,255,0.4)', display: 'block', fontSize: '0.75rem' }}>
                    Published on {new Date(ann.createdAt).toLocaleString()}
                  </small>
                </div>
              ))}
            </div>
        )}
      </div>
    </main>
  );
}
