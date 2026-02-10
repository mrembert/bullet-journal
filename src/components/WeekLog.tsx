import { useStore } from '../store';
import { BulletEditor } from './BulletEditor';
import { format, startOfWeek, addDays, isSameDay, parseISO, endOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, Grid, Layers, CheckSquare } from 'lucide-react';
import { TaskGroupList } from './TaskGroupList';

export function WeekLog() {
    const { state, dispatch } = useStore();
    const { groupByProject, showCompleted } = state.preferences;

    // Use state.view.date as the anchor for the week
    const currentDate = parseISO(state.view.date);
    const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
    const daysOfWeek = Array.from({ length: 7 }, (_, i) => addDays(startOfCurrentWeek, i));

    const changeWeek = (weeks: number) => {
        const newDate = addDays(currentDate, weeks * 7);
        dispatch({
            type: 'SET_VIEW',
            payload: {
                date: format(newDate, 'yyyy-MM-dd')
            }
        });
    };

    const toggleGrouping = () => dispatch({ type: 'TOGGLE_PREFERENCE', payload: { key: 'groupByProject' } });
    const toggleCompleted = () => dispatch({ type: 'TOGGLE_PREFERENCE', payload: { key: 'showCompleted' } });

    // Filter bullets for the entire week
    const weekStartStr = format(startOfCurrentWeek, 'yyyy-MM-dd');

    // Get all dates in range
    const datesInRange = daysOfWeek.map(d => format(d, 'yyyy-MM-dd'));

    const weekBullets = Object.values(state.bullets).filter(b =>
        (b.collectionId ? true : true) && typeof b.date === 'string' && datesInRange.includes(b.date)
    ).sort((a, b) => {
        // Sort by date then order
        if (a.date !== b.date) return String(a.date || '').localeCompare(String(b.date || ''));
        return (a.order || 0) - (b.order || 0);
    });

    const defaultEditorDate = isSameDay(currentDate, new Date()) || datesInRange.includes(format(new Date(), 'yyyy-MM-dd'))
        ? format(new Date(), 'yyyy-MM-dd')
        : weekStartStr;

    return (
        <div className="week-log">
            <header className="page-header" style={{ marginBottom: '2rem' }}>
                <div>
                    <h2 className="page-subtitle">Week of</h2>
                    <h1 className="section-title">
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

            <div className="view-controls" style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '1rem',
                justifyContent: 'flex-end'
            }}>
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
                    onClick={toggleCompleted}
                    className={`btn ${showCompleted ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                    title={showCompleted ? "Hide Completed" : "Show Completed"}
                >
                    <CheckSquare size={16} />
                    {showCompleted ? " Show Done" : " Hide Done"}
                </button>
            </div>

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
                    <TaskGroupList bullets={weekBullets} />
                </div>

                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid hsl(var(--color-text-secondary) / 0.1)' }}>
                    <BulletEditor defaultDate={defaultEditorDate} />
                </div>
            </div>
        </div>
    );
}
