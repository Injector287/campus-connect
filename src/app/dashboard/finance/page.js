'use client'
import { useEffect } from 'react'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import { fetcher } from '@/utils/fetcher'
import { useTabState } from '@/hooks/useTabState'

export default function FinancePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useTabState('tab', 'due') // 'due', 'history', 'transactions'
  const [isMobile, setIsMobile] = useState(false)
  const [downloadingReceipt, setDownloadingReceipt] = useState(null)
  
  const handleDownloadReceipt = async (e, ackUrl, receiptNo) => {
    e.preventDefault();
    setDownloadingReceipt(receiptNo);
    
    try {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = `/api/finance/receipt?url=${encodeURIComponent(ackUrl)}`;
        document.body.appendChild(iframe);
        
        // Wait a bit for the iframe to load and trigger its own onload print event
        setTimeout(() => {
            setDownloadingReceipt(null);
            // We leave the iframe in the DOM so the print dialog stays functional,
            // or remove it after a longer delay (e.g., 10 minutes).
            setTimeout(() => {
                if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                }
            }, 600000); 
        }, 3000);
    } catch (err) {
        console.error(err);
        alert(`Error opening receipt: ${err.message}`);
        setDownloadingReceipt(null);
    }
  }

  useEffect(() => {
      const handleResize = () => setIsMobile(window.innerWidth <= 768)
      handleResize()
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
  }, [])

  const { data: json, error, isLoading } = useSWR('/api/finance', fetcher)

  useEffect(() => {
    if (error && error.status === 401) {
      router.push('/')
    }
  }, [error, router])

  if (error) {
    if (error.status === 401) {
      return null
    }
    return (
      <main className="main-container">
        <div className="glass-panel" style={{ textAlign: 'center' }}>
           <h2 className="text-gradient">Oops!</h2>
           <p style={{ marginTop: '1rem' }}>{error.message || 'A network error occurred.'}</p>
           <button onClick={() => window.location.reload()} className="btn-secondary" style={{ marginTop: '2rem' }}>Retry</button>
        </div>
      </main>
    )
  }

  if (isLoading && !json) {
    return (
      <main className="main-container" style={{ alignItems: 'center' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }}></div>
        <p style={{ marginTop: '1rem', color: 'rgba(255,255,255,0.7)' }}>Loading Finance Data...</p>
      </main>
    )
  }

  if (!json) return null

  const { due = {}, history = [], transactions = [] } = json || {}

  const renderDue = () => {
    if (due.status === 'no_dues' || !due.data || due.data.length === 0) {
      return (
        <div className="glass-panel animate-slide-up" style={{ padding: '3rem 1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(74, 222, 128, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white', marginBottom: '0.5rem' }}>All Clear!</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem', maxWidth: '300px' }}>You have no pending fees to pay. Great job staying on top of your finances!</p>
        </div>
      )
    }

    return (
      <div className="responsive-grid animate-slide-up">
        {due.data.map((item, idx) => (
          <div key={idx} className="glass-panel" style={{ padding: '1.25rem' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                 <div>
                     <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'white', marginBottom: '0.25rem' }}>{item.category}</h3>
                     <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '600' }}>{item.academicYear}</span>
                 </div>
                 <div style={{ textAlign: 'right' }}>
                     <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#ef4444' }}>₹{item.dueAmount}</div>
                 </div>
             </div>
             
             <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px' }}>
                 <div style={{ textAlign: 'center' }}>
                     <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem' }}>Due Date</div>
                     <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'white' }}>{item.dueDate}</div>
                 </div>
                 <div style={{ textAlign: 'center' }}>
                     <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem' }}>Balance</div>
                     <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#facc15' }}>₹{item.balance}</div>
                 </div>
             </div>
             <button className="btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.75rem', borderRadius: '8px' }}>Pay Now</button>
          </div>
        ))}
      </div>
    )
  }

  const renderHistory = () => {
    if (!history || history.length === 0) {
       return <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>No payment history found.</div>
    }

    const sortedHistory = [...history].sort((a, b) => {
        const parseDate = (dStr) => {
            if (!dStr) return 0;
            const parts = dStr.split(/[-./]/);
            if (parts.length === 3 && parts[2].length === 4) {
               return new Date(parts[2], parts[1]-1, parts[0]).getTime();
            }
            return new Date(dStr).getTime() || 0;
        };
        return parseDate(b.receiptDate) - parseDate(a.receiptDate);
    });

    return (
      <>
      <style>{`
        .mobile-view { display: none; }
        .desktop-view { display: block; }
        @media (max-width: 768px) {
            .mobile-view { display: block; }
            .desktop-view { display: none; }
        }
      `}</style>

      {/* Desktop View */}
      <div className="desktop-view glass-panel animate-slide-up" style={{ padding: '0', overflow: 'hidden', marginBottom: '2rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <th style={{ width: '35%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</th>
                      <th style={{ width: '15%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Academic Year</th>
                      <th style={{ width: '20%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Receipt No</th>
                      <th style={{ width: '15%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Date</th>
                      <th style={{ width: '15%', padding: '1.25rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Amount</th>
                  </tr>
              </thead>
              <tbody>
                  {sortedHistory.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: idx === sortedHistory.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}
                          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                          <td style={{ padding: '1.25rem' }}>
                              <span style={{ fontWeight: '700', color: 'white', fontSize: '0.95rem' }}>{item.category}</span>
                              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>{item.paymentMode}</div>
                          </td>
                          <td style={{ padding: '1.25rem', textAlign: 'center', fontWeight: '500', color: 'rgba(255,255,255,0.8)' }}>
                              {item.academicYear}
                          </td>
                          <td style={{ padding: '1.25rem', textAlign: 'center', fontWeight: '500', color: 'rgba(255,255,255,0.8)' }}>
                              {item.receiptNo}
                          </td>
                          <td style={{ padding: '1.25rem', textAlign: 'center', fontWeight: '500', color: 'rgba(255,255,255,0.8)' }}>
                              {item.receiptDate}
                          </td>
                          <td style={{ padding: '1.25rem', textAlign: 'right', fontWeight: '800', color: '#4ade80' }}>
                              ₹{item.receiptAmount}
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>

      {/* Mobile View */}
      <div className="responsive-grid animate-slide-up mobile-view">
        {sortedHistory.map((item, idx) => (
          <div key={idx} className="glass-panel" style={{ padding: '1.25rem' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                 <div style={{ flex: 1, paddingRight: '1rem' }}>
                     <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'white', lineHeight: '1.4', marginBottom: '0.25rem' }}>{item.category}</h3>
                     <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{item.academicYear} • {item.paymentMode}</span>
                 </div>
                 <div style={{ textAlign: 'right' }}>
                     <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#4ade80' }}>
                         ₹{item.receiptAmount}
                     </div>
                 </div>
             </div>
             
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px' }}>
                 <div>
                     <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem' }}>Receipt No</div>
                     <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'white' }}>{item.receiptNo}</div>
                 </div>
                 <div style={{ textAlign: 'right' }}>
                     <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem' }}>Date</div>
                     <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'white' }}>{item.receiptDate}</div>
                 </div>
             </div>
          </div>
        ))}
      </div>
      </>
    )
  }

  const renderTransactions = () => {
    if (!transactions || transactions.length === 0) {
       return <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>No online transactions found.</div>
    }

    return (
      <div className="glass-panel animate-slide-up" style={{ padding: '0', overflow: 'hidden' }}>
        {transactions.map((tx, idx) => {
          const isApproved = tx.status && tx.status.toLowerCase().includes('approved');
          const statusColor = isApproved ? '#4ade80' : '#ef4444';
          const bgLight = isApproved ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)';

          return (
            <div key={idx} style={{ 
              display: 'flex', flexDirection: 'column', 
              padding: '1.25rem', 
              borderBottom: idx === transactions.length - 1 ? 'none' : '1px solid var(--glass-border)' 
            }}>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '1rem' : '0' }}>
                <div style={{ flex: 1, paddingRight: isMobile ? '0' : '1rem', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'white', margin: 0 }}>{tx.feeType}</h3>
                        <span style={{ 
                            fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', 
                            color: statusColor, background: bgLight, padding: '0.15rem 0.4rem', borderRadius: '4px' 
                        }}>
                            {tx.status}
                        </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                        {tx.receiptDate} • {tx.paymentMode} • Ref: {tx.receiptNo}
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'space-between' : 'flex-end', width: isMobile ? '100%' : 'auto', gap: '1rem' }}>
                    {tx.ackUrl && (
                      <a 
                        href="#"
                        onClick={(e) => handleDownloadReceipt(e, tx.ackUrl, tx.receiptNo)}
                        style={{ width: 'fit-content', fontSize: '0.75rem', padding: '0.4rem 0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--glass-border)', borderRadius: '6px', textDecoration: 'none', transition: 'background 0.2s', cursor: downloadingReceipt === tx.receiptNo ? 'wait' : 'pointer' }}
                        onMouseEnter={(e) => { if (downloadingReceipt !== tx.receiptNo) e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
                        onMouseLeave={(e) => { if (downloadingReceipt !== tx.receiptNo) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                      >
                        {downloadingReceipt === tx.receiptNo ? (
                            <div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px', borderTopColor: 'rgba(255,255,255,0.5)' }}></div>
                        ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                              <line x1="16" y1="13" x2="8" y2="13"></line>
                              <line x1="16" y1="17" x2="8" y2="17"></line>
                              <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                        )}
                        {downloadingReceipt === tx.receiptNo ? 'Generating...' : 'Receipt'}
                      </a>
                    )}
                    <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'white', textAlign: 'right', width: isMobile ? 'auto' : '110px', flexShrink: 0 }}>
                        ₹{tx.amount}
                    </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <main className="main-container animate-slide-up" style={{ justifyContent: 'flex-start' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '2rem', margin: 0 }}>Finance</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '0.25rem', marginBottom: '1.5rem' }}>
          <button 
              onClick={() => setActiveTab('due')}
              style={{ flex: 1, padding: '0.75rem 0', borderRadius: '8px', border: 'none', background: activeTab === 'due' ? 'var(--primary)' : 'transparent', color: activeTab === 'due' ? '#fff' : 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: '0.875rem', transition: 'all 0.3s ease', cursor: 'pointer' }}
          >
              Due
          </button>
          <button 
              onClick={() => setActiveTab('history')}
              style={{ flex: 1, padding: '0.75rem 0', borderRadius: '8px', border: 'none', background: activeTab === 'history' ? 'var(--primary)' : 'transparent', color: activeTab === 'history' ? '#fff' : 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: '0.875rem', transition: 'all 0.3s ease', cursor: 'pointer' }}
          >
              Paid
          </button>
          <button 
              onClick={() => setActiveTab('transactions')}
              style={{ flex: 1, padding: '0.75rem 0', borderRadius: '8px', border: 'none', background: activeTab === 'transactions' ? 'var(--primary)' : 'transparent', color: activeTab === 'transactions' ? '#fff' : 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: '0.875rem', transition: 'all 0.3s ease', cursor: 'pointer' }}
          >
              Transactions
          </button>
      </div>

      <div>
          {activeTab === 'due' && renderDue()}
          {activeTab === 'history' && renderHistory()}
          {activeTab === 'transactions' && renderTransactions()}
      </div>
      
    </main>
  )
}
