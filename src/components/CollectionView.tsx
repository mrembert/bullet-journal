import React, { useState } from 'react';
import { useStore } from '../store';
import { SortableBulletItem } from './SortableBulletItem';
import { BulletEditor } from './BulletEditor';
import { Eye, EyeOff } from 'lucide-react';
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

export function CollectionView() {
    const { state, dispatch } = useStore();
    const { collectionId } = state.view;
    const [showCompleted, setShowCompleted] = useState(false);

    const collection = collectionId ? state.collections[collectionId] : null;

    if (!collection) return <div>Collection not found</div>;

    // Filter bullets for this collection
    const bullets = Object.values(state.bullets)
        .filter((b) => b.collectionId === collectionId)
        .filter((b) => showCompleted || b.state !== 'completed')
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
            const oldIndex = bullets.findIndex((b) => b.id === active.id);
            const newIndex = bullets.findIndex((b) => b.id === over?.id);

            const newOrder = arrayMove(bullets, oldIndex, newIndex);

            const updates = newOrder.map((b, index) => ({
                id: b.id,
                order: index * 1000
            }));

            dispatch({ type: 'REORDER_BULLETS', payload: { items: updates } });
        }
    };

    return (
        <div className="collection-view">
            <header style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', color: 'hsl(var(--color-text-secondary))', letterSpacing: '0.05em' }}>
                            {collection.type}
                        </h3>
                        <h1 style={{ fontSize: '3rem', fontWeight: 700 }}>
                            {collection.title}
                        </h1>
                    </div>
                    <button
                        onClick={() => setShowCompleted(!showCompleted)}
                        className="btn btn-ghost"
                        style={{ color: 'hsl(var(--color-text-secondary))' }}
                        title={showCompleted ? "Hide Completed" : "Show Completed"}
                    >
                        {showCompleted ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
            </header>

            <div className="collection-list">
                {bullets.length === 0 && (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--color-text-secondary))', opacity: 0.5 }}>
                        Empty collection. Start adding items below.
                    </div>
                )}

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={bullets.map(b => b.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {bullets.map((bullet) => (
                            <SortableBulletItem key={bullet.id} bullet={bullet} />
                        ))}
                    </SortableContext>
                </DndContext>

                <BulletEditor />
            </div>
        </div>
    );
}
