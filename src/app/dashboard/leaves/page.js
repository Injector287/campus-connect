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
      setTimeout(() => {
          setFromDate(today)
          setToDate(today)
      }, 0)
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
          
          // Force direct download to the device
          const now = new Date();
          const dd = String(now.getDate()).padStart(2, '0');
          const mm = String(now.getMonth() + 1).padStart(2, '0');
          const ddmm = dd + mm;
          
          const a = document.createElement('a');
          a.href = url;
          a.download = `Leave_${getLeaveTypeText(leaveType)}_${ddmm}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          
      } catch (err) {
          console.error(err);
          setError(err.message || 'Something went wrong');
      } finally {
          setIsSubmitting(false);
      }
  }

  return (
    <main className="main-container animate-slide-up">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
                <h1 className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }}>Leave Application</h1>
            </div>
        </div>

        <div className="responsive-split">
            {/* Left Column: Form Info / Status */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: '1' }}>
                <div className="glass-panel" style={{ padding: 'clamp(1rem, 3vw, 2rem)', borderRadius: '24px', background: 'rgba(74, 180, 196, 0.05)', border: '1px solid rgba(74, 180, 196, 0.2)', maxHeight: '800px', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'white', margin: 0 }}>Guidelines</h3>
                    </div>

                    {/* Desktop Accordion */}
                    <div className="desktop-only" style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem', lineHeight: '1.6', flexDirection: 'column', gap: '1rem' }}>
                        {/* Timings */}
                        <details open style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden' }}>
                            <summary style={{ cursor: 'pointer', fontWeight: '600', color: 'var(--primary)', padding: '1rem', outline: 'none', userSelect: 'none' }}>
                                Submission Timings
                            </summary>
                            <div style={{ padding: '0 1rem 1rem 1rem' }}>
                                <ul style={{ paddingLeft: '1.25rem', margin: '0 0 1rem 0', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                    <li><strong>11:30 AM - 01:00 PM:</strong> Medical Leave, Prior Information Letters, and Certificates.</li>
                                    <li><strong>04:15 PM - 04:40 PM:</strong> Casual Leave, Prior Information Letters, and Certificates.</li>
                                    <li><strong>06:30 PM - 07:00 PM:</strong> Medical Leave and On-Duty applications.</li>
                                </ul>
                                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.75rem', borderRadius: '8px', color: '#fca5a5', fontSize: '0.85rem' }}>
                                    <strong>Students must strictly adhere to the designated timings.</strong> Submissions will not be accepted during class hours.
                                </div>
                            </div>
                        </details>

                        {/* General Rules */}
                        <details style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden' }}>
                            <summary style={{ cursor: 'pointer', fontWeight: '600', color: 'var(--primary)', padding: '1rem', outline: 'none', userSelect: 'none' }}>
                                General Rules
                            </summary>
                            <div style={{ padding: '0 1rem 1rem 1rem' }}>
                                <ul style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                    <li>All leave applications must be submitted within <strong>three days</strong> of returning to college. Late submissions will be rejected.</li>
                                    <li>Any student absent continuously for more than 15 days without prior notification will be removed from the college rolls.</li>
                                </ul>
                            </div>
                        </details>

                        {/* Medical Leave */}
                        <details style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden' }}>
                            <summary style={{ cursor: 'pointer', fontWeight: '600', color: 'var(--primary)', padding: '1rem', outline: 'none', userSelect: 'none' }}>
                                Medical Leave (ML)
                            </summary>
                            <div style={{ padding: '0 1rem 1rem 1rem' }}>
                                <ul style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                    <li><strong>Absence exceeding 5 days:</strong> A prior information letter must reach the Vice Principal&apos;s office by the 3rd day of illness. The formal application, along with a medical fitness certificate and relevant reports, must be submitted within 3 days of returning.</li>
                                    <li><strong>Absence under 5 days:</strong> The medical leave application and any supporting medical reports must be submitted within 3 days of returning.</li>
                                </ul>
                            </div>
                        </details>

                        {/* On-Duty */}
                        <details style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden' }}>
                            <summary style={{ cursor: 'pointer', fontWeight: '600', color: 'var(--primary)', padding: '1rem', outline: 'none', userSelect: 'none' }}>
                                On-Duty (OD) Leave
                            </summary>
                            <div style={{ padding: '0 1rem 1rem 1rem' }}>
                                <ul style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                    <li>Prior information must be sent to the Vice Principal&apos;s office at least 1-2 days before the event by the respective authorities.</li>
                                    <li>The formal OD application and supporting participation certificates must be submitted within three working days after the event concludes.</li>
                                    <li>All OD forms must be exclusively forwarded through the Dean of Students.</li>
                                </ul>
                            </div>
                        </details>
                    </div>

                    {/* Mobile Swipable Cards */}
                    <div className="mobile-only" style={{ overflowX: 'auto', gap: '0.5rem', paddingBottom: '0.25rem', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        <div style={{ flex: '0 0 85%', scrollSnapAlign: 'start', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '0.85rem', display: 'flex', flexDirection: 'column' }}>
                            <h4 style={{ color: 'var(--primary)', fontWeight: '600', marginBottom: '0.5rem', marginTop: 0, fontSize: '1rem' }}>Submission Timings</h4>
                            <ul style={{ paddingLeft: '0.75rem', margin: '0 0 0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.4rem', color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem' }}>
                                <li><strong>11:30 AM - 01:00 PM:</strong> Medical Leave, Prior Information Letters, and Certificates.</li>
                                <li><strong>04:15 PM - 04:40 PM:</strong> Casual Leave, Prior Information Letters, and Certificates.</li>
                                <li><strong>06:30 PM - 07:00 PM:</strong> Medical Leave and On-Duty applications.</li>
                            </ul>
                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.5rem', borderRadius: '8px', color: '#fca5a5', fontSize: '0.75rem', marginTop: 'auto' }}>
                                <strong>Students must strictly adhere to the designated timings.</strong> Submissions will not be accepted during class hours.
                            </div>
                        </div>

                        <div style={{ flex: '0 0 85%', scrollSnapAlign: 'start', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '0.85rem', display: 'flex', flexDirection: 'column' }}>
                            <h4 style={{ color: 'var(--primary)', fontWeight: '600', marginBottom: '0.5rem', marginTop: 0, fontSize: '1rem' }}>General Rules</h4>
                            <ul style={{ paddingLeft: '0.75rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem', color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem' }}>
                                <li>All leave applications must be submitted within <strong>three days</strong> of returning to college. Late submissions will be rejected.</li>
                                <li>Any student absent continuously for more than 15 days without prior notification will be removed from the college rolls.</li>
                            </ul>
                        </div>

                        <div style={{ flex: '0 0 85%', scrollSnapAlign: 'start', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '0.85rem', display: 'flex', flexDirection: 'column' }}>
                            <h4 style={{ color: 'var(--primary)', fontWeight: '600', marginBottom: '0.5rem', marginTop: 0, fontSize: '1rem' }}>Medical Leave (ML)</h4>
                            <ul style={{ paddingLeft: '0.75rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem', color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem' }}>
                                <li><strong>Absence exceeding 5 days:</strong> A prior information letter must reach the Vice Principal&apos;s office by the 3rd day of illness. The formal application, along with a medical fitness certificate and relevant reports, must be submitted within 3 days of returning.</li>
                                <li><strong>Absence under 5 days:</strong> The medical leave application and any supporting medical reports must be submitted within 3 days of returning.</li>
                            </ul>
                        </div>

                        <div style={{ flex: '0 0 85%', scrollSnapAlign: 'start', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '0.85rem', display: 'flex', flexDirection: 'column' }}>
                            <h4 style={{ color: 'var(--primary)', fontWeight: '600', marginBottom: '0.5rem', marginTop: 0, fontSize: '1rem' }}>On-Duty (OD) Leave</h4>
                            <ul style={{ paddingLeft: '0.75rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem', color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem' }}>
                                <li>Prior information must be sent to the Vice Principal&apos;s office at least 1-2 days before the event by the respective authorities.</li>
                                <li>The formal OD application and supporting participation certificates must be submitted within three working days after the event concludes.</li>
                                <li>All OD forms must be exclusively forwarded through the Dean of Students.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Form */}
            <div className="glass-panel leave-form-panel" style={{ padding: '2.5rem', borderRadius: '24px', background: 'rgba(20, 20, 30, 0.4)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
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
                <div className="leave-dates-row" style={{ display: 'flex', gap: '1.5rem' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>From Date</label>
                        <div style={{ position: 'relative', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', height: '54.8px', display: 'flex', alignItems: 'center', padding: '0 1.25rem', transition: 'all 0.2s ease' }}>
                            <span style={{ color: 'white', fontSize: '1.05rem', flex: 1, pointerEvents: 'none' }}>
                                {fromDate ? formatDate(fromDate) : 'Select Date'}
                            </span>
                            <div style={{ pointerEvents: 'none', color: 'rgba(255,255,255,0.5)' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                            </div>
                            <input 
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                required
                                style={{ 
                                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                    opacity: 0, cursor: 'pointer', zIndex: 10
                                }}
                                onClick={(e) => { try { e.target.showPicker() } catch(err) {} }}
                                onFocus={(e) => e.target.parentElement.style.borderColor = 'var(--primary)'}
                                onBlur={(e) => e.target.parentElement.style.borderColor = 'rgba(255,255,255,0.1)'}
                            />
                        </div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>To Date</label>
                        <div style={{ position: 'relative', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', height: '54.8px', display: 'flex', alignItems: 'center', padding: '0 1.25rem', transition: 'all 0.2s ease' }}>
                            <span style={{ color: 'white', fontSize: '1.05rem', flex: 1, pointerEvents: 'none' }}>
                                {toDate ? formatDate(toDate) : 'Select Date'}
                            </span>
                            <div style={{ pointerEvents: 'none', color: 'rgba(255,255,255,0.5)' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                            </div>
                            <input 
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                required
                                style={{ 
                                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                    opacity: 0, cursor: 'pointer', zIndex: 10
                                }}
                                onClick={(e) => { try { e.target.showPicker() } catch(err) {} }}
                                onFocus={(e) => e.target.parentElement.style.borderColor = 'var(--primary)'}
                                onBlur={(e) => e.target.parentElement.style.borderColor = 'rgba(255,255,255,0.1)'}
                            />
                        </div>
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
                        rows="3"
                        style={{ 
                            background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', 
                            padding: '1rem 1.25rem', color: 'white', fontSize: '1.05rem', outline: 'none', resize: 'none',
                            transition: 'border-color 0.2s ease', overflow: 'hidden', minHeight: '110px'
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
