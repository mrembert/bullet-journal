import test, { describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { reducer, initialState } from './storeReducer.ts';
import type { Action } from './storeReducer.ts';
import type { AppState, Bullet } from './types.ts';

const FIXED_TIME = 1625097600000; // 2021-07-01T00:00:00.000Z

describe('storeReducer', () => {
    let originalDateNow: () => number;

    beforeEach(() => {
        originalDateNow = Date.now;
        Date.now = () => FIXED_TIME;
    });

    afterEach(() => {
        Date.now = originalDateNow;
    });

    test('ADD_BULLET adds a new bullet', () => {
        const action: Action = {
            type: 'ADD_BULLET',
            payload: {
                id: 'b1',
                content: 'New Task',
                type: 'task',
                date: '2021-07-01'
            }
        };
        const state = reducer(initialState, action);
        assert.ok(state.bullets['b1']);
        assert.strictEqual(state.bullets['b1'].content, 'New Task');
        assert.strictEqual(state.bullets['b1'].state, 'open');
        assert.strictEqual(state.bullets['b1'].createdAt, FIXED_TIME);
        assert.strictEqual(state.bullets['b1'].updatedAt, FIXED_TIME);
    });

    test('UPDATE_BULLET updates content', () => {
        const startState: AppState = {
            ...initialState,
            bullets: {
                'b1': {
                    id: 'b1',
                    content: 'Old Content',
                    type: 'task',
                    state: 'open',
                    order: 100,
                    createdAt: 100,
                    updatedAt: 100
                }
            }
        };

        const action: Action = {
            type: 'UPDATE_BULLET',
            payload: { id: 'b1', content: 'New Content' }
        };

        const state = reducer(startState, action);
        assert.strictEqual(state.bullets['b1'].content, 'New Content');
        assert.strictEqual(state.bullets['b1'].updatedAt, FIXED_TIME);
    });

    test('UPDATE_BULLET handles completion state', () => {
        const startState: AppState = {
            ...initialState,
            bullets: {
                'b1': {
                    id: 'b1',
                    content: 'Task',
                    type: 'task',
                    state: 'open',
                    order: 100,
                    createdAt: 100,
                    updatedAt: 100
                }
            }
        };

        const action: Action = {
            type: 'UPDATE_BULLET',
            payload: { id: 'b1', state: 'completed' }
        };

        const state = reducer(startState, action);
        assert.strictEqual(state.bullets['b1'].state, 'completed');
        assert.strictEqual(state.bullets['b1'].completedAt, FIXED_TIME);

        // Toggle back to open
        const action2: Action = {
            type: 'UPDATE_BULLET',
            payload: { id: 'b1', state: 'open' }
        };

        // Advance time for second update
        Date.now = () => FIXED_TIME + 1000;
        const state2 = reducer(state, action2);
        assert.strictEqual(state2.bullets['b1'].state, 'open');
        assert.strictEqual(state2.bullets['b1'].completedAt, undefined);
        assert.strictEqual(state2.bullets['b1'].updatedAt, FIXED_TIME + 1000);
    });

    test('DELETE_BULLET removes a bullet', () => {
        const startState: AppState = {
            ...initialState,
            bullets: {
                'b1': { id: 'b1', content: 'Task', type: 'task', state: 'open', order: 1, createdAt: 1, updatedAt: 1 }
            }
        };

        const action: Action = { type: 'DELETE_BULLET', payload: { id: 'b1' } };
        const state = reducer(startState, action);
        assert.strictEqual(state.bullets['b1'], undefined);
    });

    test('SET_VIEW updates view state', () => {
        const action: Action = {
            type: 'SET_VIEW',
            payload: { mode: 'week', date: '2021-07-05' }
        };
        const state = reducer(initialState, action);
        assert.strictEqual(state.view.mode, 'week');
        assert.strictEqual(state.view.date, '2021-07-05');
    });

    test('ADD_COLLECTION adds a collection', () => {
        const action: Action = {
            type: 'ADD_COLLECTION',
            payload: { id: 'c1', title: 'Project X', type: 'project' }
        };
        const state = reducer(initialState, action);
        assert.ok(state.collections['c1']);
        assert.strictEqual(state.collections['c1'].title, 'Project X');
        assert.strictEqual(state.collections['c1'].type, 'project');
        assert.strictEqual(state.collections['c1'].createdAt, FIXED_TIME);
    });

    test('UPDATE_COLLECTION updates collection', () => {
        const startState: AppState = {
            ...initialState,
            collections: {
                'c1': { id: 'c1', title: 'Old Title', type: 'project', createdAt: 100 }
            }
        };
        const action: Action = {
            type: 'UPDATE_COLLECTION',
            payload: { id: 'c1', title: 'New Title' }
        };
        const state = reducer(startState, action);
        assert.strictEqual(state.collections['c1'].title, 'New Title');
    });

    test('DELETE_COLLECTION removes collection', () => {
        const startState: AppState = {
            ...initialState,
            collections: {
                'c1': { id: 'c1', title: 'Project', type: 'project', createdAt: 100 }
            }
        };
        const action: Action = { type: 'DELETE_COLLECTION', payload: { id: 'c1' } };
        const state = reducer(startState, action);
        assert.strictEqual(state.collections['c1'], undefined);
    });

    test('REORDER_BULLETS updates order', () => {
        const startState: AppState = {
            ...initialState,
            bullets: {
                'b1': { id: 'b1', order: 1, content: 'A', type: 'task', state: 'open', createdAt: 1, updatedAt: 1 },
                'b2': { id: 'b2', order: 2, content: 'B', type: 'task', state: 'open', createdAt: 1, updatedAt: 1 }
            }
        };

        const action: Action = {
            type: 'REORDER_BULLETS',
            payload: { items: [{ id: 'b1', order: 2 }, { id: 'b2', order: 1 }] }
        };

        const state = reducer(startState, action);
        assert.strictEqual(state.bullets['b1'].order, 2);
        assert.strictEqual(state.bullets['b2'].order, 1);
    });

    test('TOGGLE_PREFERENCE toggles boolean value', () => {
        const action: Action = {
            type: 'TOGGLE_PREFERENCE',
            payload: { key: 'showCompleted' }
        };
        // Initial showCompleted is true
        const state = reducer(initialState, action);
        assert.strictEqual(state.preferences.showCompleted, false);

        const state2 = reducer(state, action);
        assert.strictEqual(state2.preferences.showCompleted, true);
    });

    test('LOAD_DATA merges data', () => {
        const action: Action = {
            type: 'LOAD_DATA',
            payload: {
                bullets: {
                    'loaded': { id: 'loaded', content: 'Loaded', type: 'task', state: 'open', order: 1, createdAt: 1, updatedAt: 1 }
                },
                preferences: {
                    groupByProject: true
                }
            }
        };

        const state = reducer(initialState, action);
        assert.ok(state.bullets['loaded']);
        assert.strictEqual(state.preferences.groupByProject, true);
    });

    test('RESTORE_BULLET restores a bullet state', () => {
        const startState: AppState = {
            ...initialState,
            bullets: {
                'b1': {
                    id: 'b1',
                    content: 'Modified',
                    type: 'task',
                    state: 'open',
                    order: 1,
                    createdAt: 100,
                    updatedAt: 200,
                    completedAt: undefined
                }
            }
        };

        const originalBullet: Bullet = {
            id: 'b1',
            content: 'Original',
            type: 'task',
            state: 'open',
            order: 1,
            createdAt: 100,
            updatedAt: 100,
            completedAt: undefined
        };

        const action: Action = {
            type: 'RESTORE_BULLET',
            payload: originalBullet
        };

        const state = reducer(startState, action);
        assert.deepStrictEqual(state.bullets['b1'], originalBullet);
    });

    test('UNDO returns state as is', () => {
        const state = reducer(initialState, { type: 'UNDO' });
        assert.strictEqual(state, initialState);
    });

    test('ADD_BULLETS adds multiple bullets', () => {
        const bullets: Bullet[] = [
            { id: 'b1', content: '1', type: 'task', state: 'open', order: 1, createdAt: 1, updatedAt: 1 },
            { id: 'b2', content: '2', type: 'task', state: 'open', order: 2, createdAt: 1, updatedAt: 1 }
        ];
        const action: Action = { type: 'ADD_BULLETS', payload: { bullets } };
        const state = reducer(initialState, action);
        assert.ok(state.bullets['b1']);
        assert.ok(state.bullets['b2']);
        assert.strictEqual(state.bullets['b1'].content, '1');
    });

    test('UPDATE_BULLETS updates multiple bullets', () => {
        const startState: AppState = {
            ...initialState,
            bullets: {
                'b1': { id: 'b1', content: '1', type: 'task', state: 'open', order: 1, createdAt: 1, updatedAt: 1 },
                'b2': { id: 'b2', content: '2', type: 'task', state: 'open', order: 2, createdAt: 1, updatedAt: 1 }
            }
        };
        const action: Action = {
            type: 'UPDATE_BULLETS',
            payload: { ids: ['b1', 'b2'], updates: { content: 'Updated' } }
        };
        const state = reducer(startState, action);
        assert.strictEqual(state.bullets['b1'].content, 'Updated');
        assert.strictEqual(state.bullets['b2'].content, 'Updated');
        assert.strictEqual(state.bullets['b1'].updatedAt, FIXED_TIME);
    });

    test('DELETE_BULLETS removes multiple bullets', () => {
        const startState: AppState = {
            ...initialState,
            bullets: {
                'b1': { id: 'b1', content: '1', type: 'task', state: 'open', order: 1, createdAt: 1, updatedAt: 1 },
                'b2': { id: 'b2', content: '2', type: 'task', state: 'open', order: 2, createdAt: 1, updatedAt: 1 },
                'b3': { id: 'b3', content: '3', type: 'task', state: 'open', order: 3, createdAt: 1, updatedAt: 1 }
            }
        };
        const action: Action = { type: 'DELETE_BULLETS', payload: { ids: ['b1', 'b2'] } };
        const state = reducer(startState, action);
        assert.strictEqual(state.bullets['b1'], undefined);
        assert.strictEqual(state.bullets['b2'], undefined);
        assert.ok(state.bullets['b3']);
    });
});
