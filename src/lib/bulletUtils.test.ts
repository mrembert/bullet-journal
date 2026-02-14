import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateDepth, getEffectiveCollectionId } from './bulletUtils.ts';
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

const mockBulletWithProps = (id: string, overrides: Partial<Bullet> = {}): Bullet => ({
    id,
    content: `Bullet ${id}`,
    type: 'task',
    state: 'open',
    order: 0,
    createdAt: 0,
    updatedAt: 0,
    ...overrides
});

describe('getEffectiveCollectionId', () => {
    it('returns own collectionId if present', () => {
        const b = mockBulletWithProps('1', { collectionId: 'proj1' });
        const all = { '1': b };
        assert.strictEqual(getEffectiveCollectionId(b, all), 'proj1');
    });

    it('returns parent collectionId if own is missing', () => {
        const p = mockBulletWithProps('p', { collectionId: 'proj1' });
        const c = mockBulletWithProps('c', { parentNoteId: 'p' });
        const all = { 'p': p, 'c': c };
        assert.strictEqual(getEffectiveCollectionId(c, all), 'proj1');
    });

    it('returns grandparent collectionId if parent is missing', () => {
        const gp = mockBulletWithProps('gp', { collectionId: 'proj1' });
        const p = mockBulletWithProps('p', { parentNoteId: 'gp' });
        const c = mockBulletWithProps('c', { parentNoteId: 'p' });
        const all = { 'gp': gp, 'p': p, 'c': c };
        assert.strictEqual(getEffectiveCollectionId(c, all), 'proj1');
    });

    it('returns undefined if no collectionId in chain', () => {
        const p = mockBulletWithProps('p');
        const c = mockBulletWithProps('c', { parentNoteId: 'p' });
        const all = { 'p': p, 'c': c };
        assert.strictEqual(getEffectiveCollectionId(c, all), undefined);
    });

    it('handles circular references gracefully', () => {
        const a = mockBulletWithProps('a', { parentNoteId: 'b' });
        const b = mockBulletWithProps('b', { parentNoteId: 'a' }); // Cycle
        const all = { 'a': a, 'b': b };
        // Should return undefined and not crash
        assert.strictEqual(getEffectiveCollectionId(a, all), undefined);
    });

    it('stops at own collectionId even if parent has one', () => {
        const p = mockBulletWithProps('p', { collectionId: 'proj1' });
        const c = mockBulletWithProps('c', { parentNoteId: 'p', collectionId: 'proj2' });
        const all = { 'p': p, 'c': c };
        assert.strictEqual(getEffectiveCollectionId(c, all), 'proj2');
    });

    it('stops at nearest collectionId', () => {
        const gp = mockBulletWithProps('gp', { collectionId: 'proj1' });
        const p = mockBulletWithProps('p', { parentNoteId: 'gp', collectionId: 'proj2' });
        const c = mockBulletWithProps('c', { parentNoteId: 'p' });
        const all = { 'gp': gp, 'p': p, 'c': c };
        assert.strictEqual(getEffectiveCollectionId(c, all), 'proj2');
    });
});

describe('Project Inheritance Scenarios', () => {
    it('Scenario: Task in Note inherits Note Project', () => {
        const note = mockBulletWithProps('note1', { type: 'note', collectionId: 'projA' });
        const task = mockBulletWithProps('task1', { parentNoteId: 'note1' }); // collectionId is undefined
        const state = { 'note1': note, 'task1': task };

        assert.strictEqual(getEffectiveCollectionId(task, state), 'projA');
    });

    it('Scenario: Move Note moves Task (Dynamic Inheritance)', () => {
        // Initial State: Note in ProjA
        let note = mockBulletWithProps('note1', { type: 'note', collectionId: 'projA' });
        const task = mockBulletWithProps('task1', { parentNoteId: 'note1' });
        let state = { 'note1': note, 'task1': task };

        assert.strictEqual(getEffectiveCollectionId(task, state), 'projA');

        // Action: Move Note to ProjB
        note = { ...note, collectionId: 'projB' };
        state = { 'note1': note, 'task1': task };

        // Verification: Task now in ProjB
        assert.strictEqual(getEffectiveCollectionId(task, state), 'projB');
    });

    it('Scenario: Task with explicit Project overrides Note Project', () => {
        const note = mockBulletWithProps('note1', { type: 'note', collectionId: 'projA' });
        const task = mockBulletWithProps('task1', { parentNoteId: 'note1', collectionId: 'projB' });
        const state = { 'note1': note, 'task1': task };

        // Verification: Task stays in ProjB despite parent in ProjA
        assert.strictEqual(getEffectiveCollectionId(task, state), 'projB');
    });

    it('Scenario: Nested Note Inheritance', () => {
        const rootNote = mockBulletWithProps('root', { type: 'note', collectionId: 'projA' });
        const subNote = mockBulletWithProps('sub', { type: 'note', parentNoteId: 'root' });
        const task = mockBulletWithProps('task', { parentNoteId: 'sub' });
        const state = { 'root': rootNote, 'sub': subNote, 'task': task };

        assert.strictEqual(getEffectiveCollectionId(task, state), 'projA');
    });

    it('Scenario: Orphaned Task (Parent deleted) returns undefined', () => {
        const task = mockBulletWithProps('task1', { parentNoteId: 'deletedNote' });
        const state = { 'task1': task }; // deletedNote is missing

        assert.strictEqual(getEffectiveCollectionId(task, state), undefined);
    });
});
