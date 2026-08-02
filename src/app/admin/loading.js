'use client';

export default function AdminLoading() {
    return (
      <div className="layout-wrapper" style={{ position: 'relative', display: 'flex' }}>
        
        {/* Skeleton Desktop Sidebar */}
        <nav className="desktop-only" style={{
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          width: '250px',
          background: 'rgba(15, 23, 42, 0.6)',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          padding: '1.5rem 1rem',
          display: 'flex', flexDirection: 'column', gap: '2rem'
        }}>
          <div style={{ width: '120px', height: '28px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', animation: 'pulse 2s infinite' }} />
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div style={{ width: '100px', height: '14px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginBottom: '0.5rem', animation: 'pulse 2s infinite' }} />
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ width: '100%', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', animation: 'pulse 2s infinite' }} />
            ))}
          </div>
        </nav>
  
        {/* Skeleton Page Content */}
        <div className="layout-content" style={{ padding: '2rem', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ width: '250px', height: '36px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', animation: 'pulse 2s infinite' }} />
                <div style={{ width: '150px', height: '36px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', animation: 'pulse 2s infinite' }} />
            </div>
            
            <div style={{ width: '100%', height: '300px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', animation: 'pulse 2s infinite' }} />
        </div>
  
        {/* Skeleton Mobile Header */}
        <div className="mobile-only" style={{
            position: 'fixed', top: 0, left: 0, right: 0, height: '60px',
            background: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 1.25rem'
        }}>
            <div style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', animation: 'pulse 2s infinite' }} />
            <div style={{ width: '100px', height: '24px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', animation: 'pulse 2s infinite' }} />
            <div style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
        </div>
  
        <style jsx>{`
          @keyframes pulse {
              0% { opacity: 0.6; }
              50% { opacity: 0.3; }
              100% { opacity: 0.6; }
          }
        `}</style>
      </div>
    );
  }
