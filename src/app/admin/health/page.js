"use client";

import { useEffect, useState } from 'react';

export default function HealthPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/logs')
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setLogs(data.logs || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <main className="main-container" style={{ alignItems: 'center' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }}></div>
        <p style={{ marginTop: '1rem', color: 'rgba(255,255,255,0.7)' }}>Loading Health Logs...</p>
      </main>
    );
  }
  if (error) {
    return (
      <main className="main-container">
        <div className="glass-panel" style={{ textAlign: 'center' }}>
           <h2 className="text-gradient">Error</h2>
           <p style={{ marginTop: '1rem', color: '#f87171' }}>{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="main-container animate-slide-up" style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '2rem', margin: 0 }}>Scraper Engine Health</h1>
      </div>
      
      <div className="desktop-view glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <th style={{ width: '15%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Timestamp</th>
              <th style={{ width: '15%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User</th>
              <th style={{ width: '25%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Endpoint</th>
              <th style={{ width: '15%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
              <th style={{ width: '30%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, idx) => {
              const isSuccess = log.status === 'SUCCESS';
              const statusColor = isSuccess ? '#4ade80' : '#ef4444';
              const bgLight = isSuccess ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)';

              return (
                <tr key={log.id} style={{ borderBottom: idx === logs.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '1.25rem', color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>{new Date(log.createdAt).toLocaleString()}</td>
                  <td style={{ padding: '1.25rem', color: 'white', fontWeight: '500', fontSize: '0.9rem' }}>{log.user?.registerNum || 'Unknown'}</td>
                  <td style={{ padding: '1.25rem', color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>{log.endpoint}</td>
                  <td style={{ padding: '1.25rem' }}>
                    <span style={{ 
                        fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', 
                        color: statusColor, background: bgLight, padding: '0.2rem 0.5rem', borderRadius: '4px' 
                    }}>
                        {log.status}
                    </span>
                  </td>
                  <td style={{ padding: '1.25rem' }}>
                    {!isSuccess && log.fullLog ? (
                      <details>
                        <summary style={{ cursor: 'pointer', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: '500', outline: 'none', userSelect: 'none' }}>View Log</summary>
                        <pre style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.5)', padding: '1rem', borderRadius: '0.5rem', marginTop: '0.5rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: 'rgba(255,255,255,0.8)' }}>
                          {log.fullLog}
                        </pre>
                      </details>
                    ) : (
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>-</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {logs.length === 0 && (
              <tr>
                <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>No logs found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mobile-only responsive-grid" style={{ marginTop: '1rem' }}>
        {logs.map((log) => {
          const isSuccess = log.status === 'SUCCESS';
          const statusColor = isSuccess ? '#4ade80' : '#ef4444';
          const bgLight = isSuccess ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)';

          return (
            <div key={log.id} className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <span style={{ color: 'white', fontWeight: '600', fontSize: '1rem' }}>{log.user?.registerNum || 'Unknown'}</span>
                 <span style={{ 
                        fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', 
                        color: statusColor, background: bgLight, padding: '0.2rem 0.5rem', borderRadius: '4px' 
                    }}>
                        {log.status}
                  </span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                  {new Date(log.createdAt).toLocaleString()}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'white', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '8px', wordBreak: 'break-all' }}>
                  {log.endpoint}
              </div>
              {!isSuccess && log.fullLog && (
                  <details>
                    <summary style={{ cursor: 'pointer', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: '500', outline: 'none', userSelect: 'none' }}>View Log</summary>
                    <pre style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.5)', padding: '1rem', borderRadius: '0.5rem', marginTop: '0.5rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: 'rgba(255,255,255,0.8)' }}>
                      {log.fullLog}
                    </pre>
                  </details>
              )}
            </div>
          )
        })}
      </div>
    </main>
  );
}
