import { type Bullet } from '../types';
import { SortableBulletItem } from './SortableBulletItem';
import { useStore } from '../store';
import { BulletItem } from './BulletItem';
import { calculateDepth } from '../lib/bulletUtils';
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
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useKeyboardFocus } from '../contexts/KeyboardFocusContext';
import { useEffect, useMemo } from 'react';

interface TaskGroupListProps {
    bullets: Bullet[];
    enableDragAndDrop?: boolean;
    onDragEnd?: (event: DragEndEvent) => void;
}

export function TaskGroupList({ bullets, enableDragAndDrop, onDragEnd }: TaskGroupListProps) {
    const { state } = useStore();
    const { focusedId, setVisibleIds } = useKeyboardFocus();
    const { groupByProject, showCompleted, showMigrated } = state.preferences;

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // 1. Filter based on preferences and calculate visible set
    const { filteredBullets, visibleIdsSet } = useMemo(() => {
        const filtered = bullets.filter(b => {
            if (!showCompleted && b.state === 'completed') {
                return false;
            }
            if (!showMigrated && b.state === 'migrated') {
                return false;
            }
            if (b.state === 'cancelled' && !showCompleted) { // Cancelled also hidden if completed hidden?
                return false;
            }
            return true;
        });

        return {
            filteredBullets: filtered,
            visibleIdsSet: new Set(filtered.map(b => b.id))
        };
    }, [bullets, showCompleted, showMigrated]);

    // Register visible IDs for keyboard navigation
    useEffect(() => {
        setVisibleIds(filteredBullets.map(b => b.id));
        return () => setVisibleIds([]);
    }, [filteredBullets, setVisibleIds]);

    // 2. Group if enabled
    const { grouped, unassigned, projectIds } = useMemo(() => {
        if (!groupByProject) {
            return { grouped: {}, unassigned: [], projectIds: [] };
        }

        const grouped: Record<string, Bullet[]> = {};
        const unassigned: Bullet[] = [];

        filteredBullets.forEach(b => {
            if (b.collectionId && state.collections[b.collectionId]) {
                if (!grouped[b.collectionId]) grouped[b.collectionId] = [];
                grouped[b.collectionId].push(b);
            } else {
                unassigned.push(b);
            }
        });

        // Get sorted project IDs (maybe by creation date or alpha? Let's use creation date like sidebar)
        const projectIds = Object.keys(grouped).sort((a, b) => {
            return state.collections[b].createdAt - state.collections[a].createdAt;
        });

        return { grouped, unassigned, projectIds };
    }, [filteredBullets, groupByProject, state.collections]);

    if (groupByProject) {
        return (
            <div className="task-group-list">
                {unassigned.length > 0 && (
                    <div className="group-section" style={{ marginBottom: '2rem' }}>
                        <h3 style={{
                            fontSize: '0.85rem',
                            textTransform: 'uppercase',
                            color: 'hsl(var(--color-text-secondary))',
                            marginBottom: '0.5rem',
                            letterSpacing: '0.05em',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            Inbox / Unassigned
                        </h3>
                        {/* DnD within unassigned? Maybe too complex for now, just render items */}
                        {unassigned.map(b => (
                            <BulletItem
                                key={b.id}
                                bullet={b}
                                isFocused={b.id === focusedId}
                                depth={calculateDepth(b, state.bullets, visibleIdsSet)}
                            />
                        ))}
                    </div>
                )}

                {projectIds.map(pid => (
                    <div key={pid} className="group-section" style={{ marginBottom: '2rem' }}>
                        <h3 style={{
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            marginBottom: '0.5rem',
                            paddingBottom: '0.25rem',
                            borderBottom: '1px solid hsl(var(--color-text-secondary) / 0.1)',
                            color: 'hsl(var(--color-accent))'
                        }}>
                            {state.collections[pid].title}
                        </h3>
                        {grouped[pid].map(b => (
                            <BulletItem
                                key={b.id}
                                bullet={b}
                                isFocused={b.id === focusedId}
                                depth={calculateDepth(b, state.bullets, visibleIdsSet)}
                            />
                        ))}
                    </div>
                ))}

                {filteredBullets.length === 0 && (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--color-text-secondary))', opacity: 0.5 }}>
                        No visible tasks.
                    </div>
                )}
            </div>
        );
    }

    /* 
       Note: We only enable DnD if NOT grouped. Grouped DnD is tricky because order 
       is global or per-collection? Currently order is global. 
       If we want to reorder within a group, we'd need to filter the payload.
       For now, disable DnD when grouped.
    */



    if (enableDragAndDrop && onDragEnd) {
        return (
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={onDragEnd}
            >
                <SortableContext
                    items={filteredBullets.map(b => b.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="task-list">
                        {filteredBullets.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--color-text-secondary))', opacity: 0.5 }}>
                                No entries found.
                            </div>
                        ) : (
                            filteredBullets.map(b => (
                                <SortableBulletItem
                                    key={b.id}
                                    bullet={b}
                                    isFocused={b.id === focusedId}
                                    depth={calculateDepth(b, state.bullets, visibleIdsSet)}
                                />
                            ))
                        )}
                    </div>
                </SortableContext>
            </DndContext>
        );
    }

    // Fallback simple list
    return (
        <div className="task-list">
            {filteredBullets.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--color-text-secondary))', opacity: 0.5 }}>
                    No entries found.
                </div>
            ) : (
                filteredBullets.map(b => (
                    <BulletItem
                        key={b.id}
                        bullet={b}
                        isFocused={b.id === focusedId}
                        depth={calculateDepth(b, state.bullets, visibleIdsSet)}
                    />
                ))
            )}
        </div>
    );
}
