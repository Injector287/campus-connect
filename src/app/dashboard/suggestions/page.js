"use client";

import { useEffect, useState } from 'react';

export default function UserSuggestionsPage() {
  const [suggestions, setSuggestions] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchSuggestions = () => {
    fetch('/api/suggestions')
      .then(res => res.json())
      .then(data => {
        setSuggestions(data.error ? [] : data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const submitSuggestion = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    await fetch('/api/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    setContent('');
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
    <main className="main-container animate-slide-up" style={{ paddingBottom: '6rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }}>Suggestions</h1>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', borderRadius: '24px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'white', marginBottom: '0.5rem' }}>We'd love to hear your thoughts!</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>Have an idea to improve the app? Found a bug? Let us know.</p>
        
        <form onSubmit={submitSuggestion}>
          <textarea 
            style={{ 
              width: '100%', 
              background: 'rgba(0,0,0,0.2)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '12px', 
              padding: '1rem', 
              color: 'white', 
              fontSize: '1rem', 
              minHeight: '120px', 
              outline: 'none', 
              resize: 'vertical',
              marginBottom: '1rem'
            }}
            placeholder="Type your suggestion here..."
            value={content}
            onChange={e => setContent(e.target.value)}
            required
            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
          <button className="btn-primary" type="submit" style={{ padding: '0.75rem 1.5rem', borderRadius: '8px' }}>Submit Suggestion</button>
        </form>
      </div>

      <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'white', marginBottom: '1.5rem' }}>Your Past Suggestions</h2>
      
      {suggestions.length === 0 ? (
        <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)', background: 'rgba(0,0,0,0.2)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>You haven't submitted any suggestions yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {suggestions.map(sug => (
            <div key={sug.id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px' }}>
              <p style={{ margin: '0 0 1rem 0', color: 'white', fontSize: '0.95rem', lineHeight: '1.5' }}>{sug.content}</p>
              
              {sug.adminReply ? (
                <div style={{ background: 'rgba(var(--primary-rgb, 59, 130, 246), 0.1)', padding: '1rem', borderRadius: '12px', borderLeft: '3px solid var(--primary)' }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: '700', marginBottom: '0.25rem' }}>Admin Reply</div>
                  <p style={{ margin: '0', color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem' }}>{sug.adminReply}</p>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div className="spinner" style={{ width: '12px', height: '12px', borderWidth: '2px', borderTopColor: 'rgba(255,255,255,0.3)', borderRightColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: 'transparent' }}></div>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: '500' }}>Pending review...</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
