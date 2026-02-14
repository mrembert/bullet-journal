import type { Bullet } from '../types';

/**
 * Calculates the indentation depth of a bullet based on its parentNoteId chain.
 * Only parents that are present in the visibleIds set are counted towards depth.
 */
export function calculateDepth(
    bullet: Bullet,
    allBullets: Record<string, Bullet>,
    visibleIds: Set<string>
): number {
    let depth = 0;
    let current = bullet;
    const visited = new Set<string>();

    while (current.parentNoteId && allBullets[current.parentNoteId]) {
        if (visited.has(current.parentNoteId)) {
            // Circular reference detected
            break;
        }
        visited.add(current.parentNoteId);

        if (visibleIds.has(current.parentNoteId)) {
            depth++;
            current = allBullets[current.parentNoteId];
        } else {
            // If the parent is not visible, we stop counting depth
            // to avoid "orphaned" indentation.
            break;
        }

        if (depth >= 10) break; // Maximum depth safety
    }

    return depth;
}
