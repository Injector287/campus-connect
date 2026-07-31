"use client";

import { useState, useRef, useEffect } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/utils/fetcher';
import SkeletonPage from '@/components/SkeletonPage';

export default function UserSuggestionsPage() {
  const { data: suggestionsData, error, isLoading: loading, mutate: fetchSuggestions } = useSWR('/api/suggestions', fetcher);
  const suggestions = suggestionsData?.error ? [] : (suggestionsData || []);
  
  const [content, setContent] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  const submitSuggestion = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    await fetch('/api/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    setContent('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '120px';
    }
    fetchSuggestions();
  };

  if (loading) {
    return <SkeletonPage />;
  }

  return (
    <main className="main-container animate-slide-up" style={{ paddingBottom: '6rem' }}>
      <style>{`
        .suggestions-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
          width: 100%;
        }
        .suggestion-box-panel {
          padding: 1.25rem;
          border-radius: 20px;
          position: relative;
        }
        @media (min-width: 1024px) {
          .suggestions-layout {
            grid-template-columns: 1fr 1.5fr;
            gap: 3rem;
            align-items: flex-start;
          }
          .suggestion-box-panel {
            padding: 2rem;
            border-radius: 24px;
            position: sticky;
            top: 100px;
          }
        }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }}>Suggestions</h1>
      </div>

      <div className="suggestions-layout">
        {/* Left Column: Form */}
        <div>
          <div className="glass-panel suggestion-box-panel">
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'white', marginBottom: '0.5rem' }}>We&apos;d love to hear your thoughts!</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>Have an idea to improve the app? Found a bug? Let us know.</p>
            
            <form onSubmit={submitSuggestion}>
              <textarea 
                ref={textareaRef}
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
                  resize: 'none',
                  marginBottom: '1rem',
                  overflow: 'hidden'
                }}
                placeholder="Type your suggestion here..."
                value={content}
                onChange={e => setContent(e.target.value)}
                required
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
              <button className="btn-primary" type="submit" style={{ padding: '0.85rem 1.5rem', borderRadius: '12px', width: '100%', fontWeight: '600' }}>Submit Suggestion</button>
            </form>
          </div>
        </div>

        {/* Right Column: History */}
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'white', marginBottom: '1.5rem', paddingLeft: '0.5rem' }}>Your Past Suggestions</h2>
          
          {suggestions.length === 0 ? (
            <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)', background: 'rgba(0,0,0,0.2)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>You haven&apos;t submitted any suggestions yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {suggestions.map(sug => (
                <div key={sug.id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px' }}>
                  <p style={{ margin: '0 0 1rem 0', color: 'white', fontSize: '0.95rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{sug.content}</p>
                  
                  {sug.adminReply ? (
                    <div style={{ background: 'rgba(var(--primary-rgb, 59, 130, 246), 0.1)', padding: '1rem', borderRadius: '12px', borderLeft: '3px solid var(--primary)' }}>
                      <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: '700', marginBottom: '0.25rem' }}>Admin Reply</div>
                      <p style={{ margin: '0', color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{sug.adminReply}</p>
                    </div>
                  ) : (
                    <div style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '0.5rem', 
                      background: 'rgba(234, 179, 8, 0.15)',
                      padding: '0.4rem 0.8rem', 
                      borderRadius: '999px',
                      border: '1px solid rgba(234, 179, 8, 0.3)'
                    }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#eab308', boxShadow: '0 0 8px rgba(234,179,8,0.6)' }}></div>
                      <span style={{ color: '#eab308', fontSize: '0.8rem', fontWeight: '600' }}>Pending review</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
