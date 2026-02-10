import React from 'react';
import { useStore } from '../store';
import { BulletItem } from './BulletItem';
import { BulletEditor } from './BulletEditor';
import { format, startOfWeek, addDays, isSameDay, parseISO, endOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function WeekLog() {
    const { state, dispatch } = useStore();
    // Use state.view.date as the anchor for the week
    const currentDate = parseISO(state.view.date);
    const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
    const daysOfWeek = Array.from({ length: 7 }, (_, i) => addDays(startOfCurrentWeek, i));

    const changeWeek = (weeks: number) => {
        const newDate = addDays(currentDate, weeks * 7);
        dispatch({
            type: 'SET_VIEW',
            payload: {
                mode: 'week',
                date: format(newDate, 'yyyy-MM-dd')
            }
        });
    };

    // Filter bullets for the entire week
    const weekStartStr = format(startOfCurrentWeek, 'yyyy-MM-dd');

    // Get all dates in range
    const datesInRange = daysOfWeek.map(d => format(d, 'yyyy-MM-dd'));

    const weekBullets = Object.values(state.bullets).filter(b =>
        !b.collectionId && datesInRange.includes(b.date)
    ).sort((a, b) => {
        // Sort by date then order
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return (a.order || 0) - (b.order || 0);
    });

    const defaultEditorDate = isSameDay(currentDate, new Date()) || datesInRange.includes(format(new Date(), 'yyyy-MM-dd'))
        ? format(new Date(), 'yyyy-MM-dd')
        : weekStartStr;

    return (
        <div className="week-log">
            <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 300, color: 'hsl(var(--color-text-secondary))' }}>Week of</h2>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1 }}>
                        {format(startOfCurrentWeek, 'MMM d')} - {format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d, yyyy')}
                    </h1>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => changeWeek(-1)} className="btn btn-ghost" title="Previous Week">
                        <ChevronLeft size={24} />
                    </button>
                    <button onClick={() => changeWeek(1)} className="btn btn-ghost" title="Next Week">
                        <ChevronRight size={24} />
                    </button>
                </div>
            </header>

            <div style={{
                border: '1px solid hsl(var(--color-text-secondary) / 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                backgroundColor: 'hsl(var(--color-bg-primary))',
                minHeight: '300px',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{ flex: 1 }}>
                    {weekBullets.length === 0 ? (
                        <p style={{ fontStyle: 'italic', color: 'hsl(var(--color-text-secondary) / 0.5)', textAlign: 'center', padding: '2rem' }}>
                            No tasks for this week.
                        </p>
                    ) : (
                        weekBullets.map(bullet => (
                            <div key={bullet.id} style={{ marginBottom: '0.5rem' }}>
                                <BulletItem bullet={bullet} />
                            </div>
                        ))
                    )}
                </div>

                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid hsl(var(--color-text-secondary) / 0.1)' }}>
                    <BulletEditor defaultDate={defaultEditorDate} />
                </div>
            </div>
        </div>
    );
}
