"use client";

import { useEffect, useState } from 'react';

export default function AdminSuggestionsPage() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState({});

  const fetchSuggestions = () => {
    fetch('/api/admin/suggestions')
      .then(res => res.json())
      .then(data => {
        setSuggestions(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const submitReply = async (id) => {
    if (!replyText[id]) return;
    
    await fetch(`/api/admin/suggestions/${id}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminReply: replyText[id] })
    });
    
    setReplyText({ ...replyText, [id]: '' });
    fetchSuggestions();
  };

  if (loading) {
    return (
      <main className="main-container" style={{ alignItems: 'center' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }}></div>
        <p style={{ marginTop: '1rem', color: 'rgba(255,255,255,0.7)' }}>Loading Suggestions...</p>
      </main>
    );
  }

  return (
    <main className="main-container animate-slide-up" style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '2rem', margin: 0 }}>User Suggestions</h1>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {suggestions.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '3rem 1rem' }}>
              No suggestions found.
          </div>
        ) : (
          suggestions.map(sug => (
            <div key={sug.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ background: 'var(--primary)', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
                        {sug.user?.registerNum ? sug.user.registerNum.substring(0, 2) : '?'}
                    </div>
                    <span style={{ fontWeight: '600', color: 'white' }}>{sug.user?.registerNum || 'Unknown User'}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{new Date(sug.createdAt).toLocaleString()}</span>
              </div>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', lineHeight: '1.6', padding: '0 0.5rem' }}>{sug.content}</p>
              
              {sug.adminReply ? (
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1.25rem', borderRadius: '12px', borderLeft: '4px solid #3b82f6', marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#60a5fa' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                      </svg>
                      <strong style={{ fontSize: '0.85rem' }}>Admin Reply:</strong>
                  </div>
                  <p style={{ margin: 0, color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem', lineHeight: '1.5' }}>{sug.adminReply}</p>
                  <small style={{ color: 'rgba(255,255,255,0.4)', display: 'block', marginTop: '0.75rem', fontSize: '0.7rem' }}>
                    Replied: {new Date(sug.repliedAt).toLocaleString()}
                  </small>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', alignItems: 'stretch' }}>
                  <input 
                    type="text" 
                    placeholder="Write a reply..."
                    style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.85rem 1rem', borderRadius: '12px', outline: 'none', transition: 'border-color 0.2s' }}
                    value={replyText[sug.id] || ''}
                    onChange={e => setReplyText({...replyText, [sug.id]: e.target.value})}
                    onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') submitReply(sug.id);
                    }}
                  />
                  <button onClick={() => submitReply(sug.id)} style={{ 
                      background: 'var(--primary)', color: 'white', border: 'none', 
                      padding: '0 1.5rem', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', 
                      transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem'
                  }}>
                    Reply
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </main>
  );
}
