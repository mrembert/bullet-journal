import React from 'react';
import { AnimatePresence } from 'framer-motion';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useStore } from '../store';
import { SortableBulletItem } from './SortableBulletItem';
import { BulletEditor } from './BulletEditor';

export function DailyLog() {
    const { state, dispatch } = useStore();
    const { date } = state.view;

    // Filter bullets for the current date
    const dailyBullets = Object.values(state.bullets)
        .filter((b) => b.date === date)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = dailyBullets.findIndex((b) => b.id === active.id);
            const newIndex = dailyBullets.findIndex((b) => b.id === over?.id);

            const newOrder = arrayMove(dailyBullets, oldIndex, newIndex);

            // Update order for all items
            const updates = newOrder.map((b, index) => ({
                id: b.id,
                order: index * 1000 // Spaced out orders
            }));

            dispatch({ type: 'REORDER_BULLETS', payload: { items: updates } });
        }
    };

    return (
        <div className="daily-log">
            {dailyBullets.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--color-text-secondary))', opacity: 0.5 }}>
                    No entries for today. Start typing below.
                </div>
            )}

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >

                <SortableContext
                    items={dailyBullets.map(b => b.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <AnimatePresence initial={false}>
                        {dailyBullets.map((bullet) => (
                            <SortableBulletItem key={bullet.id} bullet={bullet} />
                        ))}
                    </AnimatePresence>
                </SortableContext>
            </DndContext>

            <BulletEditor />
        </div>
    );
}
