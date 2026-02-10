import React from 'react';
import { useStore } from '../store';
import { BulletItem } from './BulletItem';
import { Archive, AlertCircle } from 'lucide-react';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';

export function BacklogView() {
    const { state } = useStore();
    const today = startOfDay(new Date());

    const openTasks = Object.values(state.bullets)
        .filter(b => {
            // Must be a task
            if (b.type !== 'task') return false;
            // Must be open
            if (b.state !== 'open') return false;
            // Must be from a daily log (no collectionId)
            if (b.collectionId) return false;

            // Must be before today
            const bulletDate = parseISO(b.date);
            return isBefore(bulletDate, today);
        })
        .sort((a, b) => b.date.localeCompare(a.date)); // Sort by date descending (newest first)

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Archive size={32} color="hsl(var(--color-accent))" />
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1.2 }}>Open Tasks</h1>
                    <p style={{ color: 'hsl(var(--color-text-secondary))' }}>
                        Tasks from past days that need your attention.
                    </p>
                </div>
            </header>

            {openTasks.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '4rem 2rem',
                    color: 'hsl(var(--color-text-secondary))',
                    border: '2px dashed hsl(var(--color-text-secondary) / 0.2)',
                    borderRadius: 'var(--radius-lg)'
                }}>
                    <div style={{ marginBottom: '1rem', display: 'inline-flex', padding: '1rem', background: 'hsl(var(--color-bg-secondary))', borderRadius: '50%' }}>
                        <Archive size={32} />
                    </div>
                    <p style={{ fontSize: '1.2rem' }}>You're all caught up!</p>
                    <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>No open tasks from the past.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Group by date? or just flat list? Grouping is nicer. */}
                    {Array.from(new Set(openTasks.map(b => b.date))).map(date => {
                        const tasksForDate = openTasks.filter(b => b.date === date);
                        return (
                            <div key={date}>
                                <h3 style={{
                                    fontSize: '0.9rem',
                                    fontWeight: 600,
                                    color: 'hsl(var(--color-text-secondary))',
                                    borderBottom: '1px solid hsl(var(--color-text-secondary) / 0.2)',
                                    paddingBottom: '0.5rem',
                                    marginBottom: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    <AlertCircle size={14} />
                                    {format(parseISO(date), 'EEEE, MMMM do')}
                                </h3>
                                <div>
                                    {tasksForDate.map(bullet => (
                                        <BulletItem key={bullet.id} bullet={bullet} />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
