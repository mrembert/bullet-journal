import { useStore } from '../store';
import { BulletEditor } from './BulletEditor';
import { format, startOfWeek, addDays, isSameDay, parseISO, endOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, Grid, Layers, CheckSquare, ArrowUpDown, MoveRight, Calendar, ArrowRight } from 'lucide-react';
import { TaskGroupList } from './TaskGroupList';
import { useKeyboardFocus } from '../contexts/KeyboardFocusContext';
import { useEffect, useMemo, useState } from 'react';
import { useToast } from '../contexts/ToastContext';
import { DatePicker } from './DatePicker';

export function WeekLog() {
    const { state, dispatch } = useStore();
    const { groupByProject, showCompleted, sortByType } = state.preferences;
    const [isRearrangeMode, setIsRearrangeMode] = useState(false);
    const [showMoveMenu, setShowMoveMenu] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const { showToast } = useToast();

    // Use state.view.date as the anchor for the week
    const currentDate = parseISO(state.view.date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const startOfCurrentWeek = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [state.view.date]); // Monday start
    const daysOfWeek = useMemo(() =>
        Array.from({ length: 7 }, (_, i) => addDays(startOfCurrentWeek, i)),
    [startOfCurrentWeek]);

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

    const toggleGrouping = () => dispatch({ type: 'TOGGLE_PREFERENCE', payload: { key: 'groupByProject' } });
    const toggleCompleted = () => dispatch({ type: 'TOGGLE_PREFERENCE', payload: { key: 'showCompleted' } });
    const toggleSortType = () => dispatch({ type: 'TOGGLE_PREFERENCE', payload: { key: 'sortByType' } });

    // Filter bullets for the entire week
    const weekStartStr = format(startOfCurrentWeek, 'yyyy-MM-dd');

    // Get all dates in range
    const datesInRange = useMemo(() => daysOfWeek.map(d => format(d, 'yyyy-MM-dd')), [daysOfWeek]);

    const weekBullets = useMemo(() => Object.values(state.bullets).filter(b =>
        (b.collectionId ? true : true) && !!b.date && datesInRange.includes(b.date as string)
    ).filter((b) => {
        if (!showCompleted && (b.state === 'completed' || b.state === 'cancelled')) return false;
        if (b.state === 'migrated') return false; // Always hide migrated items
        return true;
    }).sort((a, b) => {
        // Sort by date then order
        const dateA = a.date || '';
        const dateB = b.date || '';
        if (dateA !== dateB) return dateA.localeCompare(dateB);

        if (sortByType) {
            const typeOrder = { event: 0, task: 1, note: 2 };
            const typeDiff = (typeOrder[a.type] || 0) - (typeOrder[b.type] || 0);
            if (typeDiff !== 0) return typeDiff;
        }

        return (a.order || 0) - (b.order || 0);
    }), [state.bullets, datesInRange, sortByType, showCompleted]);

    const openTasks = useMemo(() => weekBullets.filter(b => b.state === 'open' && b.type === 'task'), [weekBullets]);

    const handleMoveToTomorrow = () => {
        const tomorrow = format(addDays(currentDate, 1), 'yyyy-MM-dd');
        handleMoveToDate(tomorrow);
    };

    const handleMoveToDate = (targetDate: string | null) => {
        if (!targetDate) return;
        const ids = openTasks.map(t => t.id);
        if (ids.length > 0) {
            dispatch({
                type: 'UPDATE_BULLETS',
                payload: {
                    ids,
                    updates: { date: targetDate }
                }
            });
            showToast(`Moved ${ids.length} tasks to ${targetDate}`);
        }
        setShowMoveMenu(false);
        setShowDatePicker(false);
    };

    const defaultEditorDate = isSameDay(currentDate, new Date()) || datesInRange.includes(format(new Date(), 'yyyy-MM-dd'))
        ? format(new Date(), 'yyyy-MM-dd')
        : weekStartStr;

    const { setFocusedId } = useKeyboardFocus();

    useEffect(() => {
        // Focus first item when view changes (week changes)
        if (weekBullets.length > 0) {
            setFocusedId(weekBullets[0].id);
        }
    }, [weekStartStr, weekBullets, setFocusedId]);

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
                    onClick={toggleCompleted}
                    className={`btn ${showCompleted ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                    title={showCompleted ? "Hide Done" : "Show Done"}
                >
                    <CheckSquare size={16} />
                    {showCompleted ? " Hide Done" : " Show Done"}
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

                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setShowMoveMenu(!showMoveMenu)}
                        className={`btn ${showMoveMenu ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                        title="Move unfinished tasks"
                        disabled={openTasks.length === 0}
                    >
                        <MoveRight size={16} />
                        {" Move Open"}
                    </button>
                    {showMoveMenu && (
                        <>
                            <div
                                className="picker-overlay"
                                style={{ background: 'transparent', zIndex: 90 }}
                                onClick={() => setShowMoveMenu(false)}
                            />
                            <div className="picker-panel" style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                zIndex: 91,
                                marginTop: '0.5rem',
                                minWidth: '150px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.25rem'
                            }}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleMoveToTomorrow();
                                    }}
                                    className="btn btn-ghost"
                                    style={{ width: '100%', justifyContent: 'flex-start', fontSize: '0.9rem' }}
                                >
                                    <ArrowRight size={14} /> Next Day
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowDatePicker(true);
                                    }}
                                    className="btn btn-ghost"
                                    style={{ width: '100%', justifyContent: 'flex-start', fontSize: '0.9rem' }}
                                >
                                    <Calendar size={14} /> Choose Date...
                                </button>
                            </div>
                        </>
                    )}
                    {showDatePicker && (
                        <DatePicker
                            onSelectDate={handleMoveToDate}
                            onCancel={() => setShowDatePicker(false)}
                        />
                    )}
                </div>
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
                    <TaskGroupList
                        bullets={weekBullets}
                        enableDragAndDrop={true}
                        isRearrangeMode={isRearrangeMode}
                        showInlineEditors={groupByProject}
                        defaultDate={defaultEditorDate}
                    />
                </div>

                {!isRearrangeMode && (
                    <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid hsl(var(--color-text-secondary) / 0.1)' }}>
                        <BulletEditor defaultDate={defaultEditorDate} />
                    </div>
                )}
            </div>
        </div>
    );
}
