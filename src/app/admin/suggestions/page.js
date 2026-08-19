"use client";

import { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/utils/fetcher';
import SkeletonPage from '@/components/SkeletonPage';

export default function AdminSuggestionsPage() {
  const { data: suggestionsData, error, isLoading: loading, mutate: fetchSuggestions } = useSWR('/api/admin/suggestions', fetcher);
  const suggestions = suggestionsData || [];
  
  const [replyText, setReplyText] = useState({});
  const [editing, setEditing] = useState({});
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'solved'

  const submitReply = async (id) => {
    if (!replyText[id]) return;
    
    await fetch(`/api/admin/suggestions/${id}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminReply: replyText[id] })
    });
    
    setReplyText({ ...replyText, [id]: '' });
    setEditing({ ...editing, [id]: false });
    fetchSuggestions();
  };

  if (loading) {
    return <SkeletonPage />;
  }

  const pendingSuggestions = suggestions.filter(s => !s.adminReply);
  const solvedSuggestions = suggestions.filter(s => s.adminReply);

  const displayedSuggestions = activeTab === 'pending' ? pendingSuggestions : solvedSuggestions;

  return (
    <main className="main-container animate-slide-up" style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '2rem', margin: 0 }}>User Suggestions</h1>
      </div>

      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '0.25rem', marginBottom: '1.5rem', width: 'fit-content' }}>
          <button 
              onClick={() => setActiveTab('pending')}
              style={{ padding: '0.75rem 2rem', borderRadius: '8px', border: 'none', background: activeTab === 'pending' ? 'var(--primary)' : 'transparent', color: activeTab === 'pending' ? '#fff' : 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: '0.875rem', transition: 'transform 0.3s ease, opacity 0.3s ease, background-color 0.3s ease, border-color 0.3s ease', cursor: 'pointer' }}
          >
              Pending ({pendingSuggestions.length})
          </button>
          <button 
              onClick={() => setActiveTab('solved')}
              style={{ padding: '0.75rem 2rem', borderRadius: '8px', border: 'none', background: activeTab === 'solved' ? 'var(--primary)' : 'transparent', color: activeTab === 'solved' ? '#fff' : 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: '0.875rem', transition: 'transform 0.3s ease, opacity 0.3s ease, background-color 0.3s ease, border-color 0.3s ease', cursor: 'pointer' }}
          >
              Solved ({solvedSuggestions.length})
          </button>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {displayedSuggestions.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '3rem 1rem' }}>
              No {activeTab} suggestions found.
          </div>
        ) : (
          displayedSuggestions.map(sug => (
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
              
              {(sug.adminReply && !editing[sug.id]) ? (
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1.25rem', borderRadius: '12px', borderLeft: '4px solid #3b82f6', marginTop: '0.5rem', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#60a5fa' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                        </svg>
                        <strong style={{ fontSize: '0.85rem' }}>Admin Reply:</strong>
                    </div>
                    <button 
                        onClick={() => {
                            setReplyText({ ...replyText, [sug.id]: sug.adminReply });
                            setEditing({ ...editing, [sug.id]: true });
                        }}
                        style={{ 
                            background: 'transparent', border: 'none', color: '#60a5fa', cursor: 'pointer', 
                            padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            borderRadius: '8px', transition: 'background 0.2s', opacity: 0.8
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.background = 'rgba(96, 165, 250, 0.15)';
                            e.currentTarget.style.opacity = '1';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.opacity = '0.8';
                        }}
                        title="Edit Reply"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9"></path>
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                        </svg>
                    </button>
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
                        if (e.key === 'Escape') setEditing({ ...editing, [sug.id]: false });
                    }}
                    autoFocus={editing[sug.id]}
                  />
                  {editing[sug.id] && (
                      <button onClick={() => setEditing({ ...editing, [sug.id]: false })} style={{ 
                          background: 'transparent', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)', 
                          padding: '0 1rem', borderRadius: '12px', cursor: 'pointer', transition: 'transform 0.2s, opacity 0.2s, background-color 0.2s, border-color 0.2s'
                      }}>
                        Cancel
                      </button>
                  )}
                  <button onClick={() => submitReply(sug.id)} style={{ 
                      background: 'var(--primary)', color: 'white', border: 'none', 
                      padding: '0 1.5rem', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', 
                      transition: 'transform 0.2s, opacity 0.2s, background-color 0.2s, border-color 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem'
                  }}>
                    {editing[sug.id] ? 'Update' : 'Reply'}
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
