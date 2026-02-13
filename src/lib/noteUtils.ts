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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cleanNodes = (nodes: any[]): any[] => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

/**
 * Validates a URL to ensure it uses a safe protocol.
 * Allowed protocols: http, https, mailto, tel.
 * Relative URLs are NOT allowed.
 *
 * @param url - The URL string to validate.
 * @returns True if the URL is valid and safe, false otherwise.
 */
export function isValidUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;

    // Trim whitespace
    const trimmedUrl = url.trim();

    // Check for allowed protocols using a case-insensitive regex
    // We strictly require the protocol to be at the start of the string
    const allowedProtocols = /^(https?:\/\/|mailto:|tel:)/i;

    return allowedProtocols.test(trimmedUrl);
}
