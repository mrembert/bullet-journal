import { useStore } from '../store';
import { BulletEditor } from './BulletEditor';
import { addMonths, format, isSameMonth, parseISO } from 'date-fns';
import { Grid, Layers, CheckSquare } from 'lucide-react';
import { TaskGroupList } from './TaskGroupList';

export function FutureLog() {
    const { state, dispatch } = useStore();
    const today = new Date();

    // Generate next 12 months
    const months = Array.from({ length: 12 }, (_, i) => addMonths(today, i));

    // Helper to get bullets for a specific month
    const getBulletsForMonth = (monthDate: Date) => {
        return Object.values(state.bullets).filter(b => {
            // if (b.collectionId) return false; // Don't show collection items - CHANGED: Show them if they have a date!
            if (b.state === 'migrated' || b.state === 'cancelled') return false; // Hide migrated/cancelled
            if (!b.date) return false; // Undated items don't belong in Future Log
            const bDate = parseISO(b.date);
            return isSameMonth(bDate, monthDate);
        });
    };



    return (
        <div className="future-log">
            <header className="page-header" style={{ marginBottom: '2rem', alignItems: 'flex-end' }}>
                <div>
                    <h2 className="page-subtitle">Future Log</h2>
                    <h1 className="section-title">Overview</h1>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <button
                        onClick={() => dispatch({ type: 'TOGGLE_PREFERENCE', payload: { key: 'groupByProject' } })}
                        className={`btn ${state.preferences.groupByProject ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                        title={state.preferences.groupByProject ? "Ungroup" : "Group by Project"}
                    >
                        {state.preferences.groupByProject ? <Grid size={16} /> : <Layers size={16} />}
                        {state.preferences.groupByProject ? " Nested" : " Flat"}
                    </button>
                    <button
                        onClick={() => dispatch({ type: 'TOGGLE_PREFERENCE', payload: { key: 'showCompleted' } })}
                        className={`btn ${state.preferences.showCompleted ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                        title={state.preferences.showCompleted ? "Hide Completed" : "Show Completed"}
                    >
                        <CheckSquare size={16} />
                        {state.preferences.showCompleted ? " Show Done" : " Hide Done"}
                    </button>
                </div>
            </header>

            <div className="future-log-grid" style={{
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
                                <TaskGroupList bullets={monthBullets} />


                                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid hsl(var(--color-text-secondary) / 0.1)' }}>
                                    <BulletEditor defaultDate={format(month, 'yyyy-MM-01')} autoFocus={false} />
                                </div>
                            </div>


                        </div>
                    );
                })}
            </div>
        </div>
    );
}
