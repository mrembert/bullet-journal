
import { useStore } from '../store';
import { BulletItem } from './BulletItem';
import { calculateDepth } from '../lib/bulletUtils';
import { Archive, AlertCircle } from 'lucide-react';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';

export function BacklogView() {
    const { state } = useStore();

    const { openTasks, visibleIdsSet } = useMemo(() => {
        const today = startOfDay(new Date());
        const filtered = Object.values(state.bullets)
            .filter(b => {
                // Must be a task
                if (b.type !== 'task') return false;
                // Must be open
                if (b.state !== 'open') return false;

                // Include if Undated OR Before Today
                if (!b.date) return true;

                const bulletDate = parseISO(b.date);
                return isBefore(bulletDate, today);
            })
            .sort((a, b) => {
                // Undated first? Or last? Let's put Undated first.
                if (!a.date && b.date) return -1;
                if (a.date && !b.date) return 1;
                if (!a.date && !b.date) return (a.order || 0) - (b.order || 0);
                return (b.date || '').localeCompare(a.date || ''); // Descending date
            });

        return {
            openTasks: filtered,
            visibleIdsSet: new Set(filtered.map(b => b.id))
        };
    }, [state.bullets]);

    const undatedTasks = openTasks.filter(b => !b.date);
    const datedTasks = openTasks.filter(b => b.date);

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Archive size={32} color="hsl(var(--color-accent))" />
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1.2 }}>Open Tasks</h1>
                    <p style={{ color: 'hsl(var(--color-text-secondary))' }}>
                        Undated tasks and items from past days that need attention.
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
                    <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>No open tasks found.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Undated Section */}
                    {undatedTasks.length > 0 && (
                        <div>
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
                                Inbox / Undated
                            </h3>
                            <div>
                                {undatedTasks.map(bullet => (
                                    <BulletItem
                                        key={bullet.id}
                                        bullet={bullet}
                                        depth={calculateDepth(bullet, state.bullets, visibleIdsSet)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Dated Sections */}
                    {Array.from(new Set(datedTasks.map(b => b.date!))).map(date => {
                        const tasksForDate = datedTasks.filter(b => b.date === date);
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
                                        <BulletItem
                                            key={bullet.id}
                                            bullet={bullet}
                                            depth={calculateDepth(bullet, state.bullets, visibleIdsSet)}
                                        />
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
