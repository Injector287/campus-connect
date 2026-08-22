'use client';
import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/utils/fetcher';

function parseDateStr(dateStr) {
  if (!dateStr || dateStr.trim() === '-' || dateStr.trim() === '') return null;
  
  const cleanStr = dateStr.trim().replace(/[\/\s]+/g, '-');
  const parts = cleanStr.split('-');
  if (parts.length < 3) return null;
  
  let dd = parseInt(parts[0], 10);
  let mm = parts[1];
  let yyyy = parseInt(parts[2].length === 2 ? `20${parts[2]}` : parts[2], 10); 
  
  if (isNaN(parseInt(mm, 10))) {
    const months = { jan:0, feb:1, mar:2, apr:3, may:4, jun:5, jul:6, aug:7, sep:8, oct:9, nov:10, dec:11 };
    mm = months[mm.substring(0,3).toLowerCase()];
  } else {
    mm = parseInt(mm, 10) - 1;
  }
  
  if (isNaN(dd) || mm === undefined || isNaN(yyyy)) return null;
  
  return new Date(yyyy, mm, dd);
}

export function useReminders() {
    const { data: financeData } = useSWR('/api/finance', fetcher, { revalidateOnFocus: false });
    const { data: libraryData } = useSWR('/api/library', fetcher, { revalidateOnFocus: false });
    
    return useMemo(() => {
        const newReminders = [];
        if (!financeData && !libraryData) return newReminders;

        const today = new Date();
        today.setHours(0, 0, 0, 0); 
        
        // 1. Finance Dues
        if (financeData && financeData.due && financeData.due.status === 'has_dues' && Array.isArray(financeData.due.data)) {
            financeData.due.data.forEach((dueItem, idx) => {
                const dueDate = parseDateStr(dueItem.dueDate);
                let isUrgent = false;
                
                if (dueDate) {
                    const diffTime = dueDate.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays <= 3) isUrgent = true; 
                }
                
                newReminders.push({
                    id: `finance-${idx}`,
                    type: 'finance',
                    title: `Fee Due: ${dueItem.category}`,
                    subtitle: `Amount: ₹${dueItem.balance}`,
                    dateText: dueItem.dueDate ? `Due by ${dueItem.dueDate}` : 'Pending Due',
                    isUrgent: isUrgent || !dueDate,
                    icon: (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                            <line x1="2" y1="10" x2="22" y2="10"></line>
                        </svg>
                    )
                });
            });
        }
        
        // 2. Library Books
        if (libraryData && Array.isArray(libraryData.booksInHand)) {
            libraryData.booksInHand.forEach((book, idx) => {
                const dueDate = parseDateStr(book.dueDate);
                if (dueDate) {
                    const diffTime = dueDate.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    if (diffDays <= 2) {
                        const isOverdue = diffDays < 0;
                        newReminders.push({
                            id: `library-${idx}`,
                            type: 'library',
                            title: `Return Book: ${book.title}`,
                            subtitle: '', // Removed accession number as requested
                            dateText: isOverdue ? `Overdue by ${Math.abs(diffDays)} days` : (diffDays === 0 ? 'Due Today' : `Due in ${diffDays} days`),
                            isUrgent: isOverdue || diffDays === 0,
                            icon: (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
                                </svg>
                            )
                        });
                    }
                }
            });
        }
        
        return newReminders;
    }, [financeData, libraryData]);
}

export default function DashboardReminders({ style }) {
    const reminders = useReminders();
    const [isExpanded, setIsExpanded] = useState(false);
    
    if (reminders.length === 0) return null;

    const urgentCount = reminders.filter(r => r.isUrgent).length;
    const hasFinance = reminders.some(r => r.type === 'finance');
    const hasLibrary = reminders.some(r => r.type === 'library');
    
    return (
        <div style={style || { marginBottom: '1.5rem' }}>
            <div 
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    background: 'linear-gradient(to right, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.8))',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: isExpanded ? '16px 16px 0 0' : '16px',
                    padding: '1rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'border-radius 0.2s',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '-8px' }}>
                        {hasFinance && (
                            <div style={{ width: '40px', height: '40px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0f172a', zIndex: 2 }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                                    <line x1="2" y1="10" x2="22" y2="10"></line>
                                </svg>
                            </div>
                        )}
                        {hasLibrary && (
                            <div style={{ width: '40px', height: '40px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0f172a', marginLeft: hasFinance ? '-12px' : '0', zIndex: 1 }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
                                </svg>
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', color: 'white' }}>
                            {reminders.length} Pending Reminder{reminders.length !== 1 ? 's' : ''}
                        </h3>
                        {urgentCount > 0 && (
                            <div style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                                <span style={{ width: '6px', height: '6px', background: '#ef4444', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                                {urgentCount} Urgent
                            </div>
                        )}
                    </div>
                </div>
                
                <div style={{ color: 'rgba(255,255,255,0.5)', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>

                {urgentCount > 0 && (
                    <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '3px', background: '#ef4444', boxShadow: '0 0 12px rgba(239, 68, 68, 0.8)' }} />
                )}
            </div>

            {/* Expanded List */}
            <div style={{ 
                maxHeight: isExpanded ? '1000px' : '0', 
                opacity: isExpanded ? 1 : 0,
                overflow: 'hidden', 
                transition: 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out',
                background: 'rgba(15, 23, 42, 0.5)',
                borderWidth: isExpanded ? '0 1px 1px 1px' : '0',
                borderStyle: 'solid',
                borderColor: 'rgba(255,255,255,0.05)',
                borderRadius: '0 0 16px 16px',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {reminders.map((r, i) => (
                    <div key={r.id} style={{
                        padding: '1rem 1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        borderBottom: i < reminders.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                        background: r.isUrgent ? 'rgba(239, 68, 68, 0.05)' : 'transparent'
                    }}>
                        <div style={{ 
                            width: '40px', height: '40px', flexShrink: 0, 
                            background: r.type === 'finance' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: r.type === 'finance' ? '#f59e0b' : '#ef4444',
                            borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            {r.icon}
                        </div>
                        
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '600', color: 'rgba(255,255,255,0.9)' }}>{r.title}</h4>
                                {r.isUrgent && (
                                    <span style={{ 
                                        background: '#ef4444', color: 'white', fontSize: '0.6rem', 
                                        padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold', textTransform: 'uppercase'
                                    }}>
                                        Urgent
                                    </span>
                                )}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', fontSize: '0.8rem' }}>
                                {r.subtitle && <span style={{ color: 'rgba(255,255,255,0.5)' }}>{r.subtitle}</span>}
                                <span style={{ color: r.type === 'finance' ? '#fbbf24' : '#fca5a5', fontWeight: '600' }}>{r.dateText}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            <style jsx>{`
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.3; }
                    100% { opacity: 1; }
                }
            `}</style>
        </div>
    );
}
