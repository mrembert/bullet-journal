
import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { TaskGroupList } from './TaskGroupList';
import type { Bullet } from '../types';
import { Archive, AlertCircle, Grid, Layers, ArrowUpDown } from 'lucide-react';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { BulletEditor } from './BulletEditor';

export function BacklogView() {
    const { state, dispatch } = useStore();
    const { groupByProject, sortByType } = state.preferences;
    const [isRearrangeMode, setIsRearrangeMode] = useState(false);

    const toggleGrouping = () => dispatch({ type: 'TOGGLE_PREFERENCE', payload: { key: 'groupByProject' } });
    const toggleSortType = () => dispatch({ type: 'TOGGLE_PREFERENCE', payload: { key: 'sortByType' } });

    const { openTasks } = useMemo(() => {
        const today = startOfDay(new Date());
        const filtered = (Object.values(state.bullets) as Bullet[])
            .filter((b: Bullet) => {
                // Must be a task
                if (b.type !== 'task') return false;
                // Must be open
                if (b.state !== 'open') return false;

                // Include if Undated OR Before Today
                if (!b.date) return true;

                const bulletDate = parseISO(b.date);
                return isBefore(bulletDate, today);
            })
            .sort((a: Bullet, b: Bullet) => {
                // Undated first? Or last? Let's put Undated first.
                if (!a.date && b.date) return -1;
                if (a.date && !b.date) return 1;
                if (!a.date && !b.date) return (a.order || 0) - (b.order || 0);
                return (b.date || '').localeCompare(a.date || ''); // Descending date
            });

        return {
            openTasks: filtered
        };
    }, [state.bullets]);

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

            <div className="view-controls" style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '1rem',
                justifyContent: 'flex-end'
            }}>
                <button
                    onClick={() => setIsRearrangeMode(!isRearrangeMode)}
                    className={`btn ${isRearrangeMode ? 'btn-primary' : 'btn-ghost'} mobile-only`}
                    style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                    title={isRearrangeMode ? "Done Rearranging" : "Rearrange Tasks"}
                >
                    <ArrowUpDown size={16} />
                    {isRearrangeMode ? " Done" : " Rearrange"}
                </button>
                <button
                    onClick={toggleGrouping}
                    className={`btn ${groupByProject ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                    title={groupByProject ? "Ungroup" : "Group by Project"}
                >
                    {groupByProject ? <Grid size={16} /> : <Layers size={16} />}
                    {groupByProject ? " Nested" : " Flat"}
                </button>
                <button
                    onClick={toggleSortType}
                    className={`btn ${sortByType ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                    title={sortByType ? "Sorted by Type" : "Sort by Custom Order"}
                >
                    {sortByType ? <Layers size={16} /> : <Grid size={16} />}
                    {sortByType ? " By Type" : " Custom"}
                </button>
            </div>

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

                    <div style={{ marginTop: '2rem', maxWidth: '400px', margin: '2rem auto 0' }}>
                        <BulletEditor defaultDate={null} autoFocus={false} />
                    </div>
                </div>
            ) : groupByProject ? (
                <>
                    <TaskGroupList
                        bullets={openTasks}
                        enableDragAndDrop={true}
                        isRearrangeMode={isRearrangeMode}
                        showInlineEditors={groupByProject}
                        defaultDate={null}
                    />
                    {!isRearrangeMode && (
                        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid hsl(var(--color-text-secondary) / 0.1)' }}>
                            <BulletEditor defaultDate={null} />
                        </div>
                    )}
                </>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Undated Section */}
                    {openTasks.filter((b: Bullet) => !b.date).length > 0 && (
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
                            <TaskGroupList
                                bullets={openTasks.filter((b: Bullet) => !b.date)}
                                enableDragAndDrop={false}
                                isRearrangeMode={isRearrangeMode}
                            />
                        </div>
                    )}

                    {/* Dated Sections */}
                    {Array.from(new Set(openTasks.filter((b: Bullet) => b.date).map((b: Bullet) => b.date as string))).map((date: string) => {
                        const tasksForDate = openTasks.filter((b: Bullet) => b.date === date);
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
                                <TaskGroupList
                                    bullets={tasksForDate}
                                    enableDragAndDrop={false}
                                    isRearrangeMode={isRearrangeMode}
                                />
                            </div>
                        );
                    })}

                    {!isRearrangeMode && (
                        <div style={{ marginTop: '1rem' }}>
                            <BulletEditor defaultDate={null} />
                        </div>
                    )}
                </div>
            )}

        </div>
    );
}
