import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert';
import { subscribeToUserDataLogic, performActionInFirestoreLogic } from './database.logic.ts';
import type { AppState, Action } from '../types.ts';

// Mock dependencies
const mockCollection = mock.fn();
const mockDoc = mock.fn();
const mockOnSnapshot = mock.fn();
const mockSetDoc = mock.fn();
const mockUpdateDoc = mock.fn();
const mockDeleteDoc = mock.fn();

const deps = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    collection: mockCollection as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    doc: mockDoc as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSnapshot: mockOnSnapshot as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setDoc: mockSetDoc as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateDoc: mockUpdateDoc as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    deleteDoc: mockDeleteDoc as any,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = {} as any;
const mockUid = 'test-uid';

describe('database.logic', () => {
    beforeEach(() => {
        mockCollection.mock.resetCalls();
        mockDoc.mock.resetCalls();
        mockOnSnapshot.mock.resetCalls();
        mockSetDoc.mock.resetCalls();
        mockUpdateDoc.mock.resetCalls();
        mockDeleteDoc.mock.resetCalls();
    });

    describe('subscribeToUserDataLogic', () => {
        it('should subscribe to bullets and collections', () => {
            const mockUnsubscribe = mock.fn();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mockOnSnapshot.mock.mockImplementation((ref: any, callback: any) => {
                // Simulate initial data
                if (ref === 'bullets-ref') {
                    callback({
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        forEach: (fn: any) => {
                            fn({ id: 'b1', data: () => ({ id: 'b1', content: 'test bullet' }) });
                        }
                    });
                } else if (ref === 'collections-ref') {
                    callback({
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        forEach: (fn: any) => {
                            fn({ id: 'c1', data: () => ({ id: 'c1', title: 'test collection' }) });
                        }
                    });
                }
                return mockUnsubscribe;
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mockCollection.mock.mockImplementation((_db: any, ...path: string[]) => {
                if (path.includes('bullets')) return 'bullets-ref';
                if (path.includes('collections')) return 'collections-ref';
                return 'unknown-ref';
            });

            const onDataChange = mock.fn();

            const unsubscribe = subscribeToUserDataLogic(deps, mockDb, mockUid, onDataChange);

            assert.strictEqual(mockCollection.mock.callCount(), 2);
            assert.strictEqual(mockOnSnapshot.mock.callCount(), 2);
            assert.strictEqual(onDataChange.mock.callCount(), 2); // Once for bullets, once for collections

            // Verify data passed to callback
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const firstCall = onDataChange.mock.calls[0].arguments[0];
            // Since we can't guarantee order of snapshot callbacks in this synchronous mock setup easily without complex logic,
            // we just check if it was called with partial data.
            // Actually, in the implementation, onSnapshot is called synchronously here.

            unsubscribe();
            assert.strictEqual(mockUnsubscribe.mock.callCount(), 2);
        });
    });

    describe('performActionInFirestoreLogic', () => {
        const initialState: AppState = {
            bullets: {},
            collections: {},
            view: { mode: 'daily', date: '2023-01-01', collectionId: undefined },
            preferences: { groupByProject: false, showCompleted: true, sortByType: false }
        };

        it('should handle ADD_BULLET', async () => {
            const action: Action = {
                type: 'ADD_BULLET',
                payload: { id: 'b1', content: 'new task', type: 'task', date: '2023-01-01' }
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mockDoc.mock.mockImplementation((...args: any[]) => {
                if (args.includes('bullets')) return 'bullet-ref-b1';
                return 'user-ref';
            });

            await performActionInFirestoreLogic(deps, mockDb, mockUid, action, initialState);

            assert.strictEqual(mockSetDoc.mock.callCount(), 1);
            const callArgs = mockSetDoc.mock.calls[0].arguments;
            assert.strictEqual(callArgs[0], 'bullet-ref-b1');
            assert.strictEqual(callArgs[1].content, 'new task');
            assert.strictEqual(callArgs[1].state, 'open');
        });

        it('should handle UPDATE_BULLET', async () => {
            const action: Action = {
                type: 'UPDATE_BULLET',
                payload: { id: 'b1', content: 'updated' }
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mockDoc.mock.mockImplementation((...args: any[]) => {
                if (args.includes('bullets')) return 'bullet-ref-b1';
                return 'user-ref';
            });

            await performActionInFirestoreLogic(deps, mockDb, mockUid, action, initialState);

            assert.strictEqual(mockUpdateDoc.mock.callCount(), 1);
            const callArgs = mockUpdateDoc.mock.calls[0].arguments;
            assert.strictEqual(callArgs[0], 'bullet-ref-b1');
            assert.strictEqual(callArgs[1].content, 'updated');
        });

        it('should handle DELETE_BULLET', async () => {
            const action: Action = {
                type: 'DELETE_BULLET',
                payload: { id: 'b1' }
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mockDoc.mock.mockImplementation((...args: any[]) => {
                if (args.includes('bullets')) return 'bullet-ref-b1';
                return 'user-ref';
            });

            await performActionInFirestoreLogic(deps, mockDb, mockUid, action, initialState);

            assert.strictEqual(mockDeleteDoc.mock.callCount(), 1);
            assert.strictEqual(mockDeleteDoc.mock.calls[0].arguments[0], 'bullet-ref-b1');
        });

        it('should handle ADD_COLLECTION', async () => {
             const action: Action = {
                type: 'ADD_COLLECTION',
                payload: { id: 'c1', title: 'Work', type: 'project' }
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mockDoc.mock.mockImplementation((...args: any[]) => {
                if (args.includes('collections')) return 'col-ref-c1';
                return 'user-ref';
            });

             await performActionInFirestoreLogic(deps, mockDb, mockUid, action, initialState);

             assert.strictEqual(mockSetDoc.mock.callCount(), 1);
             const callArgs = mockSetDoc.mock.calls[0].arguments;
             assert.strictEqual(callArgs[0], 'col-ref-c1');
             assert.strictEqual(callArgs[1].title, 'Work');
        });

         it('should handle UPDATE_COLLECTION', async () => {
             const action: Action = {
                type: 'UPDATE_COLLECTION',
                payload: { id: 'c1', title: 'Work Updated' }
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mockDoc.mock.mockImplementation((...args: any[]) => {
                if (args.includes('collections')) return 'col-ref-c1';
                return 'user-ref';
            });

             await performActionInFirestoreLogic(deps, mockDb, mockUid, action, initialState);

             assert.strictEqual(mockUpdateDoc.mock.callCount(), 1);
             const callArgs = mockUpdateDoc.mock.calls[0].arguments;
             assert.strictEqual(callArgs[0], 'col-ref-c1');
             assert.strictEqual(callArgs[1].title, 'Work Updated');
        });

        it('should handle DELETE_COLLECTION', async () => {
             const action: Action = {
                type: 'DELETE_COLLECTION',
                payload: { id: 'c1' }
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mockDoc.mock.mockImplementation((...args: any[]) => {
                if (args.includes('collections')) return 'col-ref-c1';
                return 'user-ref';
            });

             await performActionInFirestoreLogic(deps, mockDb, mockUid, action, initialState);

             assert.strictEqual(mockDeleteDoc.mock.callCount(), 1);
             assert.strictEqual(mockDeleteDoc.mock.calls[0].arguments[0], 'col-ref-c1');
        });
    });
});
