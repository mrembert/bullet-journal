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

/**
 * Resolves the effective collection ID for a bullet by traversing up the parent chain.
 * If the bullet has its own collectionId, that is returned.
 * Otherwise, it looks for the nearest ancestor with a collectionId.
 */
export function getEffectiveCollectionId(
    bullet: Bullet,
    allBullets: Record<string, Bullet>
): string | undefined | null {
    if (bullet.collectionId) return bullet.collectionId;

    let current = bullet;
    const visited = new Set<string>([bullet.id]);

    while (current.parentNoteId && allBullets[current.parentNoteId]) {
        if (visited.has(current.parentNoteId)) break; // Cycle detection
        visited.add(current.parentNoteId);

        const parent = allBullets[current.parentNoteId];
        if (parent.collectionId) return parent.collectionId;

        current = parent;
        if (visited.size > 50) break; // Max depth safety
    }

    return undefined;
}
