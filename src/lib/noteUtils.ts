import type { Bullet } from '../types.ts';

/**
 * Cleans the note content by removing orphaned embeddedTask nodes.
 * An embeddedTask node is considered orphaned if its associated bulletId
 * does not exist in the current state.
 *
 * This function recursively traverses the content tree to find and remove
 * orphaned nodes at any level.
 *
 * @param raw - The JSON string representation of the note content.
 * @param bullets - A record of existing bullets.
 * @returns The cleaned JSON string.
 */
export function cleanNoteContent(raw: string, bullets: Record<string, Bullet>): string {
    if (!raw) return '';
    try {
        const parsed = JSON.parse(raw);

        const cleanNodes = (nodes: any[]): any[] => {
            return nodes.filter((node: any) => {
                if (node.type === 'embeddedTask' && node.attrs?.bulletId) {
                    return !!bullets[node.attrs.bulletId];
                }
                if (node.content && Array.isArray(node.content)) {
                    node.content = cleanNodes(node.content);
                }
                return true;
            });
        };

        if (parsed && Array.isArray(parsed.content)) {
            parsed.content = cleanNodes(parsed.content);
        }
        return JSON.stringify(parsed);
    } catch {
        return raw;
    }
}
