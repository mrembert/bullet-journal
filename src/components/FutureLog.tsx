import React from 'react';
import { useStore } from '../store';
import { BulletItem } from './BulletItem';
import { BulletEditor } from './BulletEditor';
import { addMonths, format, isSameMonth, parseISO } from 'date-fns';
import { ChevronRight } from 'lucide-react';

export function FutureLog() {
    const { state, dispatch } = useStore();
    const today = new Date();

    // Generate next 6 months
    const months = Array.from({ length: 6 }, (_, i) => addMonths(today, i));

    // Helper to get bullets for a specific month
    const getBulletsForMonth = (monthDate: Date) => {
        return Object.values(state.bullets).filter(b => {
            if (b.collectionId) return false; // Don't show collection items
            if (b.state === 'migrated' || b.state === 'cancelled') return false; // Hide migrated/cancelled
            const bDate = parseISO(b.date);
            return isSameMonth(bDate, monthDate);
        });
    };

    const jumpToMonth = (monthDate: Date) => {
        // Set view to daily log of the 1st of that month? 
        // Or maybe we want to keep it in Future Log view?
        // Let's just switch to that date in Daily Log for now as a way to "zoom in".
        dispatch({
            type: 'SET_VIEW',
            payload: {
                mode: 'daily',
                date: format(monthDate, 'yyyy-MM-dd')
            }
        });
    };

    return (
        <div className="future-log">
            <header style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 300, color: 'hsl(var(--color-text-secondary))' }}>Future Log</h2>
                <h1 style={{ fontSize: '3rem', fontWeight: 700 }}>Overview</h1>
            </header>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '2rem'
            }}>
                {months.map(month => {
                    const monthBullets = getBulletsForMonth(month);
                    const monthStr = format(month, 'MMMM yyyy');

                    return (
                        <div key={monthStr} style={{
                            border: '1px solid hsl(var(--color-text-secondary) / 0.2)',
                            borderRadius: 'var(--radius-md)',
                            padding: '1.5rem',
                            backgroundColor: 'hsl(var(--color-bg-primary))',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '1rem',
                                borderBottom: '2px solid hsl(var(--color-text-secondary) / 0.1)',
                                paddingBottom: '0.5rem'
                            }}>
                                <h3 style={{ fontWeight: 600 }}>{format(month, 'MMMM')}</h3>
                                <span style={{ color: 'hsl(var(--color-text-secondary))', fontSize: '0.9rem' }}>{format(month, 'yyyy')}</span>
                            </div>

                            <div style={{ flex: 1, minHeight: '100px' }}>
                                {monthBullets.length === 0 ? (
                                    <p style={{ fontStyle: 'italic', color: 'hsl(var(--color-text-secondary) / 0.5)', fontSize: '0.9rem' }}>No tasks scheduled.</p>
                                ) : (
                                    monthBullets.map(b => (
                                        <div key={b.id} style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                            <BulletItem bullet={b} />
                                        </div>
                                    ))
                                )}

                                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid hsl(var(--color-text-secondary) / 0.1)' }}>
                                    <BulletEditor defaultDate={format(month, 'yyyy-MM-01')} />
                                </div>
                            </div>

                            <button
                                onClick={() => jumpToMonth(month)}
                                className="btn btn-ghost"
                                style={{ marginTop: '1rem', alignSelf: 'flex-start', fontSize: '0.8rem' }}
                            >
                                Go to month <ChevronRight size={14} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
