import { type Bullet } from '../types';
import { SortableBulletItem } from './SortableBulletItem';
import { useStore } from '../store';
import { BulletItem } from './BulletItem';
import { calculateDepth, getEffectiveCollectionId } from '../lib/bulletUtils';
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
    arrayMove,
} from '@dnd-kit/sortable';
import { useKeyboardFocus } from '../contexts/KeyboardFocusContext';
import { useEffect, useMemo, useCallback } from 'react';
import { SortableProjectHeader } from './SortableProjectHeader';

interface TaskGroupListProps {
    bullets: Bullet[];
    enableDragAndDrop?: boolean;
    onDragEnd?: (event: DragEndEvent) => void;
}

export function TaskGroupList({ bullets, enableDragAndDrop, onDragEnd }: TaskGroupListProps) {
    const { state } = useStore();
    const { focusedId, setVisibleIds } = useKeyboardFocus();
    const { groupByProject, showCompleted } = state.preferences;

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // 1. Filter based on preferences and calculate visible set
    const { filteredBullets, visibleIdsSet } = useMemo(() => {
        const filtered = bullets.filter((b: Bullet) => {
            if (!showCompleted && b.state === 'completed') {
                return false;
            }
            if (b.state === 'migrated') {
                return false;
            }
            if (b.state === 'cancelled' && !showCompleted) { // Cancelled also hidden if completed hidden?
                return false;
            }
            return true;
        });

        return {
            filteredBullets: filtered,
            visibleIdsSet: new Set(filtered.map((b: Bullet) => b.id))
        };
    }, [bullets, showCompleted]);

    // Register visible IDs for keyboard navigation
    useEffect(() => {
        setVisibleIds(filteredBullets.map((b: Bullet) => b.id));
        return () => setVisibleIds([]);
    }, [filteredBullets, setVisibleIds]);

    // 2. Group if enabled
    const { grouped, unassigned, projectIds } = useMemo(() => {
        if (!groupByProject) {
            return { grouped: {}, unassigned: [], projectIds: [] };
        }

        const grouped: Record<string, Bullet[]> = {};
        const unassigned: Bullet[] = [];

        filteredBullets.forEach((b: Bullet) => {
            const collectionId = getEffectiveCollectionId(b, state.bullets);
            if (collectionId && state.collections[collectionId]) {
                if (!grouped[collectionId]) grouped[collectionId] = [];
                grouped[collectionId].push(b);
            } else {
                unassigned.push(b);
            }
        });

        // Get sorted project IDs (maybe by creation date or alpha? Let's use creation date like sidebar)
        const projectIds = Object.keys(grouped).sort((a, b) => {
            return state.collections[b].createdAt - state.collections[a].createdAt;
        });

        return { grouped, unassigned, projectIds };
    }, [filteredBullets, groupByProject, state.collections, state.bullets]);

    const { dispatch } = useStore();

    const handleInternalDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        if (active.id !== over.id) {
            // 1. Handle Project Reordering
            const allGroupIds = ['group-unassigned', ...projectIds];
            const isActiveProject = allGroupIds.includes(active.id as string);
            const isOverProject = allGroupIds.includes(over.id as string);

            if (isActiveProject && isOverProject) {
                const oldIndex = allGroupIds.indexOf(active.id as string);
                const newIndex = allGroupIds.indexOf(over.id as string);
                const newOrder = arrayMove(allGroupIds, oldIndex, newIndex);

                // Update collections order (filter out unassigned)
                const projectOnlyOrder = newOrder.filter(id => id !== 'group-unassigned');
                const updates = projectOnlyOrder.map((pid, index) => ({
                    id: pid,
                    order: index * 1000
                }));
                dispatch({ type: 'REORDER_COLLECTIONS', payload: { items: updates } });
                return;
            }

            // 2. Handle Bullet Reordering
            const oldIndex = filteredBullets.findIndex(b => b.id === active.id);
            let newIndex = filteredBullets.findIndex(b => b.id === over.id);

            if (oldIndex !== -1) {
                // If dropped over a project header, move to that project (at the start)
                if (isOverProject) {
                    const targetCollectionId = over.id === 'group-unassigned' ? null : over.id as string;
                    dispatch({
                        type: 'UPDATE_BULLET',
                        payload: { id: active.id as string, collectionId: targetCollectionId }
                    });

                    // To reorder correctly, we should find the first bullet in that group
                    const targetGroupBullets = over.id === 'group-unassigned' ? unassigned : grouped[over.id as string];
                    if (targetGroupBullets && targetGroupBullets.length > 0) {
                        newIndex = filteredBullets.findIndex(b => b.id === targetGroupBullets[0].id);
                    } else {
                        // Group is empty, just move it to the end or somewhere?
                        // For now, let's just use arrayMove to the end of the filtered list or similar
                        // Actually, finding the right index in a global list is hard if group is empty.
                    }
                } else if (newIndex !== -1) {
                    // Dropped over another bullet. Update collectionId to match target bullet's project.
                    const targetBullet = filteredBullets[newIndex];
                    const targetCollectionId = getEffectiveCollectionId(targetBullet, state.bullets);

                    if (filteredBullets[oldIndex].collectionId !== targetCollectionId) {
                        dispatch({
                            type: 'UPDATE_BULLET',
                            payload: { id: active.id as string, collectionId: targetCollectionId }
                        });
                    }
                }

                if (newIndex !== -1) {
                    const newBulletsOrder = arrayMove(filteredBullets, oldIndex, newIndex);
                    const updates = newBulletsOrder.map((b, index) => ({
                        id: b.id,
                        order: index * 1000
                    }));
                    dispatch({ type: 'REORDER_BULLETS', payload: { items: updates } });
                }
            }
        }
    }, [projectIds, filteredBullets, unassigned, grouped, state.bullets, dispatch]);

    const dndContent = useMemo(() => {
        if (groupByProject) {
            const allGroupIds = ['group-unassigned', ...projectIds];
            return (
                <SortableContext items={allGroupIds} strategy={verticalListSortingStrategy}>
                    <div className="task-group-list">
                        {unassigned.length > 0 || projectIds.length === 0 ? (
                            <div className="group-section" style={{ marginBottom: '2rem' }}>
                                <SortableProjectHeader id="group-unassigned" title="Inbox / Unassigned" isUnassigned />
                                <SortableContext items={unassigned.map(b => b.id)} strategy={verticalListSortingStrategy}>
                                    {unassigned.map((b: Bullet) => (
                                        <SortableBulletItem
                                            key={b.id}
                                            bullet={b}
                                            isFocused={b.id === focusedId}
                                            depth={calculateDepth(b, state.bullets, visibleIdsSet)}
                                        />
                                    ))}
                                </SortableContext>
                            </div>
                        ) : null}

                        {projectIds.map(pid => (
                            <div key={pid} className="group-section" style={{ marginBottom: '2rem' }}>
                                <SortableProjectHeader id={pid} title={state.collections[pid].title} />
                                <SortableContext items={grouped[pid].map(b => b.id)} strategy={verticalListSortingStrategy}>
                                    {grouped[pid].map((b: Bullet) => (
                                        <SortableBulletItem
                                            key={b.id}
                                            bullet={b}
                                            isFocused={b.id === focusedId}
                                            depth={calculateDepth(b, state.bullets, visibleIdsSet)}
                                        />
                                    ))}
                                </SortableContext>
                            </div>
                        ))}

                        {filteredBullets.length === 0 && (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--color-text-secondary))', opacity: 0.5 }}>
                                No visible tasks.
                            </div>
                        )}
                    </div>
                </SortableContext>
            );
        }

        return (
            <SortableContext
                items={filteredBullets.map((b: Bullet) => b.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="task-list">
                    {filteredBullets.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--color-text-secondary))', opacity: 0.5 }}>
                            No entries found.
                        </div>
                    ) : (
                        filteredBullets.map((b: Bullet) => (
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
        );
    }, [groupByProject, unassigned, projectIds, grouped, focusedId, state.bullets, state.collections, visibleIdsSet, filteredBullets]);

    if (enableDragAndDrop) {
        return (
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={onDragEnd || handleInternalDragEnd}
            >
                {dndContent}
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
                filteredBullets.map((b: Bullet) => (
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
