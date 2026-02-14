import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateDepth } from './bulletUtils.ts';
import type { Bullet } from '../types';

const mockBullet = (id: string, parentNoteId?: string): Bullet => ({
    id,
    content: `Bullet ${id}`,
    type: 'task',
    state: 'open',
    order: 0,
    createdAt: 0,
    updatedAt: 0,
    parentNoteId,
});

describe('calculateDepth', () => {
    it('returns 0 for bullet with no parent', () => {
        const bullet = mockBullet('1');
        const allBullets = { '1': bullet };
        const visibleIds = new Set(['1']);
        assert.strictEqual(calculateDepth(bullet, allBullets, visibleIds), 0);
    });

    it('returns 1 for bullet with one visible parent', () => {
        const p = mockBullet('p');
        const c = mockBullet('c', 'p');
        const allBullets = { 'p': p, 'c': c };
        const visibleIds = new Set(['p', 'c']);
        assert.strictEqual(calculateDepth(c, allBullets, visibleIds), 1);
    });

    it('returns 0 for bullet with parent not in visible set', () => {
        const p = mockBullet('p');
        const c = mockBullet('c', 'p');
        const allBullets = { 'p': p, 'c': c };
        const visibleIds = new Set(['c']); // p is hidden
        assert.strictEqual(calculateDepth(c, allBullets, visibleIds), 0);
    });

    it('returns 2 for nested chain', () => {
        const a = mockBullet('a');
        const b = mockBullet('b', 'a');
        const c = mockBullet('c', 'b');
        const allBullets = { 'a': a, 'b': b, 'c': c };
        const visibleIds = new Set(['a', 'b', 'c']);
        assert.strictEqual(calculateDepth(c, allBullets, visibleIds), 2);
    });

    it('handles circular references without infinite loop', () => {
        const a = mockBullet('a', 'b');
        const b = mockBullet('b', 'a');
        const allBullets = { 'a': a, 'b': b };
        const visibleIds = new Set(['a', 'b']);
        // It should stop when it hits a previously visited parent
        // Chain: a -> b (depth 1) -> a (depth 2) -> [stop because b is visited]
        assert.strictEqual(calculateDepth(a, allBullets, visibleIds), 2);
    });

    it('stops counting if a link in the chain is missing from visible set', () => {
        const a = mockBullet('a');
        const b = mockBullet('b', 'a');
        const c = mockBullet('c', 'b');
        const allBullets = { 'a': a, 'b': b, 'c': c };
        const visibleIds = new Set(['a', 'c']); // b is missing
        assert.strictEqual(calculateDepth(c, allBullets, visibleIds), 0);
    });
});
