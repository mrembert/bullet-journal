import { useStore } from '../store';
import { BulletEditor } from './BulletEditor';
import { type DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { TaskGroupList } from './TaskGroupList';
import { CheckSquare, Grid, Layers } from 'lucide-react';
import { useKeyboardFocus } from '../contexts/KeyboardFocusContext';
import { useEffect, useMemo } from 'react';

export function DailyLog() {
    const { state, dispatch } = useStore();
    const { date } = state.view;
    const { groupByProject, showCompleted } = state.preferences;

    // Filter bullets for the current date
    const dailyBullets = useMemo(() => Object.values(state.bullets)
        .filter((b) => b.date === date) // Includes project tasks if they have this date
        .sort((a, b) => (a.order || 0) - (b.order || 0)), [state.bullets, date]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            // NOTE: This reordering works on the *filtered* list if user is filtering?
            // Actually, TaskGroupList handles filtering. 
            // If we drag item A to B, we need to know the *global* indices or relative positions.
            // But dailyBullets contains ALL bullets for today. 
            // If showCompleted is false, some might be hidden. 
            // arrayMove relies on indices.
            // If we only sort visible items, hidden items might loose their place?
            // For now, let's assume DnD is safest when ALL items are visible or we handle it carefully.
            // But standard arrayMove on the full 'dailyBullets' list requires us to find indices in THAT list.

            const oldIndex = dailyBullets.findIndex((b) => b.id === active.id);
            const newIndex = dailyBullets.findIndex((b) => b.id === over?.id);

            const newOrder = arrayMove(dailyBullets, oldIndex, newIndex);

            // Update order for all items
            const updates = newOrder.map((b, index: number) => ({
                id: b.id,
                order: index * 1000 // Spaced out orders
            }));

            dispatch({ type: 'REORDER_BULLETS', payload: { items: updates } });
        }
    };

    const toggleGrouping = () => dispatch({ type: 'TOGGLE_PREFERENCE', payload: { key: 'groupByProject' } });
    const toggleCompleted = () => dispatch({ type: 'TOGGLE_PREFERENCE', payload: { key: 'showCompleted' } });

    const { setFocusedId } = useKeyboardFocus();

    useEffect(() => {
        // Focus the first task on mount if available
        if (dailyBullets.length > 0) {
            setFocusedId(dailyBullets[0].id);
        }
    }, [date]); // Re-run when date changes

    return (
        <div className="daily-log">
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

            <TaskGroupList
                bullets={dailyBullets}
                enableDragAndDrop={true}
                onDragEnd={handleDragEnd}
            />

            <BulletEditor />
        </div>
    );
}
