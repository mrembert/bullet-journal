
import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { subscribeToUserDataLogic, performActionInFirestoreLogic, type DatabaseDeps, type Action } from './database.logic.ts';
import type { Firestore, CollectionReference, DocumentReference, Unsubscribe } from 'firebase/firestore';
import type { AppState, Bullet } from '../types.ts';

// Helper to create a mock Firestore object
const mockDb = {} as Firestore;

// Mock implementations for DatabaseDeps
const createMockDeps = (): DatabaseDeps => {
    return {
        collection: mock.fn((_db, _path, ..._segments) => ({ path: [_path, ..._segments].join('/') } as unknown as CollectionReference)),
        doc: mock.fn((_db, _path, ..._segments) => {
            // Check if first arg is db or parent ref
            let path;
            if (typeof _db === 'object' && 'path' in _db && typeof (_db as any).path === 'string') {
                // Parent ref
                 path = [(_db as any).path, _path, ..._segments].join('/');
            } else {
                path = [_path, ..._segments].join('/');
            }
            return { path } as unknown as DocumentReference;
        }),
        onSnapshot: mock.fn(() => mock.fn() as Unsubscribe),
        setDoc: mock.fn(async () => {}),
        updateDoc: mock.fn(async () => {}),
        deleteDoc: mock.fn(async () => {}),
    };
};

describe('subscribeToUserDataLogic', () => {
    it('should subscribe to bullets and collections', () => {
        const deps = createMockDeps();
        const uid = 'test-uid';
        const onDataChange = mock.fn();

        const unsubscribe = subscribeToUserDataLogic(deps, mockDb, uid, onDataChange);

        // Verify collection calls
        assert.strictEqual((deps.collection as any).mock.callCount(), 2);

        // Verify onSnapshot calls
        assert.strictEqual((deps.onSnapshot as any).mock.callCount(), 2);

        unsubscribe();
    });

    it('should handle bullet updates', () => {
        const deps = createMockDeps();
        const uid = 'test-uid';
        const onDataChange = mock.fn();

        // Capture the callbacks passed to onSnapshot
        let bulletCallback: (snapshot: any) => void;
        deps.onSnapshot = mock.fn((ref, callback) => {
            if ((ref as any).path.includes('bullets')) {
                bulletCallback = callback;
            }
            return mock.fn();
        });

        subscribeToUserDataLogic(deps, mockDb, uid, onDataChange);

        // Simulate snapshot update
        const mockSnapshot = {
            forEach: (fn: (doc: any) => void) => {
                fn({ id: 'b1', data: () => ({ id: 'b1', content: 'Task 1' }) });
                fn({ id: 'b2', data: () => ({ id: 'b2', content: 'Task 2' }) });
            }
        };

        if (bulletCallback!) {
            bulletCallback(mockSnapshot);
        }

        assert.strictEqual(onDataChange.mock.callCount(), 1);
        const callArgs = onDataChange.mock.calls[0].arguments[0];
        assert.deepStrictEqual(callArgs.bullets, {
            'b1': { id: 'b1', content: 'Task 1' },
            'b2': { id: 'b2', content: 'Task 2' }
        });
    });
});

describe('performActionInFirestoreLogic', () => {
    const initialState: AppState = {
        bullets: {},
        collections: {},
        view: { mode: 'daily', date: '2023-01-01' },
        preferences: { groupByProject: false, showCompleted: true, showMigrated: false }
    };

    it('ADD_BULLET should call setDoc with correct data', async () => {
        const deps = createMockDeps();
        const uid = 'test-uid';
        const action: Action = {
            type: 'ADD_BULLET',
            payload: { id: 'b1', content: 'New Task', type: 'task', date: '2023-01-01' }
        };

        await performActionInFirestoreLogic(deps, mockDb, uid, action, initialState);

        assert.strictEqual((deps.setDoc as any).mock.callCount(), 1);
        const [ref, data] = (deps.setDoc as any).mock.calls[0].arguments;

        assert.ok((ref as any).path.includes('users/test-uid/bullets/b1'));
        assert.strictEqual(data.id, 'b1');
        assert.strictEqual(data.content, 'New Task');
        assert.strictEqual(data.state, 'open');
    });

    it('UPDATE_BULLET should call updateDoc', async () => {
        const deps = createMockDeps();
        const uid = 'test-uid';
        const action: Action = {
            type: 'UPDATE_BULLET',
            payload: { id: 'b1', state: 'completed' }
        };

        await performActionInFirestoreLogic(deps, mockDb, uid, action, initialState);

        assert.strictEqual((deps.updateDoc as any).mock.callCount(), 1);
        const [ref, data] = (deps.updateDoc as any).mock.calls[0].arguments;

        assert.ok((ref as any).path.includes('bullets/b1'));
        assert.strictEqual(data.state, 'completed');
        assert.ok(data.updatedAt);
    });

    it('DELETE_BULLET should call deleteDoc', async () => {
        const deps = createMockDeps();
        const uid = 'test-uid';
        const action: Action = {
            type: 'DELETE_BULLET',
            payload: { id: 'b1' }
        };

        await performActionInFirestoreLogic(deps, mockDb, uid, action, initialState);

        assert.strictEqual((deps.deleteDoc as any).mock.callCount(), 1);
        const [ref] = (deps.deleteDoc as any).mock.calls[0].arguments;
        assert.ok((ref as any).path.includes('bullets/b1'));
    });

    it('MIGRATE_BULLET (no collection) should update old and create new', async () => {
        const deps = createMockDeps();
        const uid = 'test-uid';
        const stateWithBullet = {
            ...initialState,
            bullets: {
                'b1': { id: 'b1', content: 'Task', type: 'task', state: 'open', date: '2023-01-01', order: 1, createdAt: 1, updatedAt: 1 } as Bullet
            }
        };
        const action: Action = {
            type: 'MIGRATE_BULLET',
            payload: { id: 'b1', targetDate: '2023-01-02', newId: 'b2' }
        };

        await performActionInFirestoreLogic(deps, mockDb, uid, action, stateWithBullet);

        // Should update old bullet to migrated
        assert.strictEqual((deps.updateDoc as any).mock.callCount(), 1);
        const [updateRef, updateData] = (deps.updateDoc as any).mock.calls[0].arguments;
        assert.ok((updateRef as any).path.includes('bullets/b1'));
        assert.strictEqual(updateData.state, 'migrated');

        // Should create new bullet
        assert.strictEqual((deps.setDoc as any).mock.callCount(), 1);
        const [setRef, setData] = (deps.setDoc as any).mock.calls[0].arguments;
        assert.ok((setRef as any).path.includes('bullets/b2'));
        assert.strictEqual(setData.id, 'b2');
        assert.strictEqual(setData.date, '2023-01-02');
        assert.strictEqual(setData.state, 'open');
    });

     it('MIGRATE_BULLET (collection) should only update date', async () => {
        const deps = createMockDeps();
        const uid = 'test-uid';
        const stateWithBullet = {
            ...initialState,
            bullets: {
                'b1': { id: 'b1', content: 'Task', type: 'task', state: 'open', collectionId: 'col1', order: 1, createdAt: 1, updatedAt: 1 } as Bullet
            }
        };
        const action: Action = {
            type: 'MIGRATE_BULLET',
            payload: { id: 'b1', targetDate: '2023-01-02' }
        };

        await performActionInFirestoreLogic(deps, mockDb, uid, action, stateWithBullet);

        // Should update bullet date
        assert.strictEqual((deps.updateDoc as any).mock.callCount(), 1);
        assert.strictEqual((deps.setDoc as any).mock.callCount(), 0);

        const [updateRef, updateData] = (deps.updateDoc as any).mock.calls[0].arguments;
        assert.ok((updateRef as any).path.includes('bullets/b1'));
        assert.strictEqual(updateData.date, '2023-01-02');
    });
});
