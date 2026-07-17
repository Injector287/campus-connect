'use client'

import { useState, useEffect } from 'react'

export default function LeaveApplicationPage() {
  const [leaveType, setLeaveType] = useState('1') // 1=CL, 2=ML, 3=OD
  
  // Initialize to today
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  
  const [reason, setReason] = useState('')
  const [assignment, setAssignment] = useState('')
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
      const today = new Date().toISOString().split('T')[0]
      setFromDate(today)
      setToDate(today)
  }, [])

  const calculateDays = () => {
      if (!fromDate || !toDate) return 0;
      const d1 = new Date(fromDate);
      const d2 = new Date(toDate);
      if (d2 < d1) return 0; // invalid range
      return ((d2 - d1) / 86400000) + 1;
  }

  const noOfDays = calculateDays()

  // Format date to DD-MM-YYYY
  const formatDate = (dateStr) => {
      if (!dateStr) return '';
      const [y, m, d] = dateStr.split('-');
      return `${d}-${m}-${y}`;
  }

  const getLeaveTypeText = (val) => {
      if (val === '1') return 'CL';
      if (val === '2') return 'ML';
      if (val === '3') return 'OD';
      return 'CL';
  }

  const handleSubmit = async (e) => {
      e.preventDefault();
      
      if (noOfDays <= 0) {
          setError("Invalid date range");
          return;
      }
      
      setIsSubmitting(true);
      setError(null);

      try {
          const payload = {
              optLeaveType: leaveType,
              hdnLeaveType: getLeaveTypeText(leaveType),
              txtFromDate: formatDate(fromDate),
              hdnFromDate: fromDate,
              txtToDate: formatDate(toDate),
              hdnToDate: toDate,
              txtnoofDays: noOfDays.toString(),
              txtReason: reason,
              txtAssigment: assignment
          };

          const res = await fetch('/api/leaves', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });

          if (!res.ok) {
              throw new Error('Failed to generate application');
          }

          // It returns a PDF/HTML blob
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          
          // Open in new tab for printing
          const newWindow = window.open(url, '_blank');
          if (newWindow) {
              newWindow.focus();
          } else {
              // If popup blocked, force download
              const a = document.createElement('a');
              a.href = url;
              a.download = `Leave_Application_${getLeaveTypeText(leaveType)}.pdf`;
              a.click();
          }
          
      } catch (err) {
          console.error(err);
          setError(err.message || 'Something went wrong');
      } finally {
          setIsSubmitting(false);
      }
  }

  return (
    <main className="main-container animate-slide-up" style={{ paddingBottom: '6rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
                <h1 className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }}>Leave Application</h1>
            </div>
        </div>

        <div className="responsive-split">
            {/* Left Column: Form Info / Status */}
            <div className="desktop-only" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="glass-panel" style={{ padding: '2rem', borderRadius: '24px', background: 'rgba(74, 180, 196, 0.05)', border: '1px solid rgba(74, 180, 196, 0.2)' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'white', marginBottom: '1rem' }}>Guidelines</h3>
                    <ul style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', lineHeight: '1.6', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <li>Ensure you select the correct leave type.</li>
                        <li>For Medical Leave (ML) exceeding 3 days, a medical certificate must be submitted to the HOD.</li>
                        <li>On Duty (OD) requires prior approval from the respective faculty-in-charge.</li>
                        <li>Provide accurate assessment details if you are missing any lab or continuous assessments.</li>
                    </ul>
                </div>
            </div>

            {/* Right Column: Form */}
            <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: '24px', background: 'rgba(20, 20, 30, 0.4)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
            {error && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1rem 1.25rem', borderRadius: '12px', color: '#fca5a5', marginBottom: '2rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                
                {/* Leave Type */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Leave Type</label>
                    <div style={{ position: 'relative' }}>
                        <select 
                            value={leaveType}
                            onChange={(e) => setLeaveType(e.target.value)}
                            style={{ 
                                appearance: 'none',
                                background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', 
                                padding: '1rem 1.25rem', color: 'white', fontSize: '1.05rem', width: '100%', outline: 'none',
                                transition: 'all 0.2s ease', cursor: 'pointer'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                        >
                            <option value="1" style={{ background: '#1e1e2d' }}>Casual Leave (CL)</option>
                            <option value="2" style={{ background: '#1e1e2d' }}>Medical Leave (ML)</option>
                            <option value="3" style={{ background: '#1e1e2d' }}>On Duty (OD)</option>
                        </select>
                        <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'rgba(255,255,255,0.5)' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </div>
                    </div>
                </div>

                {/* Dates Row */}
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>From Date</label>
                        <input 
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            required
                            style={{ 
                                background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', 
                                padding: '1rem', color: 'white', fontSize: '1.05rem', outline: 'none', width: '100%',
                                transition: 'all 0.2s ease', colorScheme: 'dark'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                        />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>To Date</label>
                        <input 
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            required
                            style={{ 
                                background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', 
                                padding: '1rem', color: 'white', fontSize: '1.05rem', outline: 'none', width: '100%',
                                transition: 'all 0.2s ease', colorScheme: 'dark'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                        />
                    </div>
                </div>

                {/* No of Days preview */}
                <div style={{ 
                    padding: '1.25rem 1.5rem', 
                    background: noOfDays > 0 ? 'linear-gradient(135deg, rgba(74, 180, 196, 0.1) 0%, rgba(74, 180, 196, 0.05) 100%)' : 'rgba(239, 68, 68, 0.05)', 
                    border: noOfDays > 0 ? '1px solid rgba(74, 180, 196, 0.3)' : '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '12px', 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={noOfDays > 0 ? 'var(--primary)' : '#ef4444'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        <span style={{ fontSize: '1rem', color: 'white', fontWeight: '500' }}>Duration</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '1.75rem', fontWeight: '800', color: noOfDays > 0 ? 'var(--primary)' : '#ef4444', lineHeight: 1 }}>
                            {noOfDays > 0 ? noOfDays : '0'}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginLeft: '0.25rem' }}>Days</span>
                    </div>
                </div>

                {/* Reason */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reason</label>
                    <textarea 
                        value={reason}
                        onChange={(e) => {
                            setReason(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                        required
                        placeholder="Please elaborate on your reason for leave..."
                        rows="3"
                        style={{ 
                            background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', 
                            padding: '1rem 1.25rem', color: 'white', fontSize: '1.05rem', outline: 'none', resize: 'none',
                            transition: 'border-color 0.2s ease', minHeight: '100px', overflow: 'hidden'
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                </div>

                {/* Assignment */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assessment Details</label>
                    <textarea 
                        value={assignment}
                        onChange={(e) => {
                            setAssignment(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                        placeholder="What assessments or assignments will take place during your absence? (Optional)"
                        rows="2"
                        style={{ 
                            background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', 
                            padding: '1rem 1.25rem', color: 'white', fontSize: '1.05rem', outline: 'none', resize: 'none',
                            transition: 'border-color 0.2s ease', overflow: 'hidden'
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                </div>

                {/* Submit Button */}
                <button 
                    type="submit" 
                    disabled={isSubmitting || noOfDays <= 0}
                    style={{ 
                        marginTop: '1.5rem',
                        background: (isSubmitting || noOfDays <= 0) ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, var(--primary), #3a94a4)',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '1.1rem',
                        color: (isSubmitting || noOfDays <= 0) ? 'rgba(255,255,255,0.4)' : 'white',
                        fontSize: '1.15rem',
                        fontWeight: '700',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '0.75rem',
                        cursor: (isSubmitting || noOfDays <= 0) ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: (isSubmitting || noOfDays <= 0) ? 'none' : '0 10px 20px rgba(74, 180, 196, 0.3)'
                    }}
                    onMouseOver={(e) => {
                        if (!isSubmitting && noOfDays > 0) e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseOut={(e) => {
                        if (!isSubmitting && noOfDays > 0) e.currentTarget.style.transform = 'none'
                    }}
                >
                    {isSubmitting ? (
                        <>
                            <div className="spinner" style={{ width: '22px', height: '22px', borderWidth: '3px', borderTopColor: 'rgba(255,255,255,0.5)' }}></div>
                            Processing...
                        </>
                    ) : (
                        <>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                            Print
                        </>
                    )}
                </button>
            </form>
            </div>
        </div>
    </main>
  )
}
