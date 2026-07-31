import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export function SortableNavItem({ id, item, onRemove, atMin }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : 1,
        position: 'relative'
    };

    return (
        <div ref={setNodeRef} style={style}>
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.75rem 1rem', borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)',
                boxShadow: isDragging ? '0 5px 15px rgba(0,0,0,0.3)' : 'none'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'white' }}>
                    {/* Drag Handle */}
                    <div 
                        {...attributes} 
                        {...listeners} 
                        style={{ 
                            cursor: 'grab', 
                            padding: '4px',
                            margin: '-4px', // increase hit area
                            color: 'rgba(255,255,255,0.4)',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="4" y1="9" x2="20" y2="9"></line>
                            <line x1="4" y1="15" x2="20" y2="15"></line>
                        </svg>
                    </div>
                    
                    {/* Item Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', pointerEvents: 'none' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            {item.icon}
                        </svg>
                        <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                            {item.label}
                        </span>
                    </div>
                </div>
                
                {/* Remove Button */}
                <button
                    onClick={() => !atMin && onRemove(id)}
                    style={{
                        background: atMin ? 'rgba(255,255,255,0.1)' : 'rgba(239, 68, 68, 0.2)',
                        color: atMin ? 'rgba(255,255,255,0.3)' : '#ef4444',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.5rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: atMin ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        opacity: atMin ? 0.5 : 1
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                </button>
            </div>
        </div>
    );
}
