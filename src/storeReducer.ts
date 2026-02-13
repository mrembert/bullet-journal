import type { AppState, Bullet, Action, BulletState } from './types';
import { generateUUID, getTodayDate } from './lib/utils.ts';


// --- Initial State ---
export const initialState: AppState = {
    bullets: {},
    collections: {},
    view: {
        mode: 'daily',
        date: getTodayDate(),
    },
    preferences: {
        groupByProject: false,
        showCompleted: true,
        showMigrated: false,
        sortByType: false,
    },
};

// --- Reducer ---
export function reducer(state: AppState, action: Action): AppState {
    switch (action.type) {
        case 'ADD_BULLET': {
            const { id, ...data } = action.payload;
            const now = Date.now();
            const newBullet: Bullet = {
                id,
                ...data, // content, type, date, collectionId
                state: 'open',
                order: now,
                createdAt: now,
                updatedAt: now,
                completedAt: undefined // Ensure completedAt is handled
            };
            return {
                ...state,
                bullets: { ...state.bullets, [id]: newBullet },
            };
        }
        case 'UPDATE_BULLET': {
            const bullet = state.bullets[action.payload.id];
            if (!bullet) return state;

            const updates: Partial<Bullet> = {
                ...action.payload,
                updatedAt: Date.now(),
            };

            // Handle completion timestamp
            if (action.payload.state === 'completed' && bullet.state !== 'completed') {
                updates.completedAt = Date.now();
            } else if (action.payload.state === 'open' && bullet.state === 'completed') {
                updates.completedAt = undefined;
            }

            return {
                ...state,
                bullets: {
                    ...state.bullets,
                    [action.payload.id]: {
                        ...bullet,
                        ...updates,
                    },
                },
            };
        }
        case 'REORDER_BULLETS': {
            const newBullets = { ...state.bullets };
            // Ensure we handle potential undefined bullets gracefully
            action.payload.items.forEach(({ id, order }) => {
                if (newBullets[id]) {
                    newBullets[id] = { ...newBullets[id], order };
                }
            });
            return { ...state, bullets: newBullets };
        }
        case 'REORDER_COLLECTIONS': {
            const newCollections = { ...state.collections };
            action.payload.items.forEach(({ id, order }) => {
                if (newCollections[id]) {
                    newCollections[id] = { ...newCollections[id], order };
                }
            });
            return { ...state, collections: newCollections };
        }
        case 'DELETE_BULLET': {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [action.payload.id]: deleted, ...remainingBullets } = state.bullets;
            return { ...state, bullets: remainingBullets };
        }
        case 'MIGRATE_BULLET': {
            const oldBullet = state.bullets[action.payload.id];
            if (!oldBullet) return state;

            // If it belongs to a collection, we just schedule it (update date), we don't clone it.
            if (oldBullet.collectionId) {
                return {
                    ...state,
                    bullets: {
                        ...state.bullets,
                        [oldBullet.id]: {
                            ...oldBullet,
                            date: action.payload.targetDate,
                            updatedAt: Date.now(),
                        }
                    }
                };
            }

            // Normal migration (Task -> Next Day)
            const newId = action.payload.newId || generateUUID();
            const now = Date.now();

            const nextBullets = {
                ...state.bullets,
                [oldBullet.id]: { ...oldBullet, state: 'migrated' as BulletState, updatedAt: now },
                [newId]: {
                    ...oldBullet,
                    id: newId,
                    date: action.payload.targetDate,
                    state: 'open' as BulletState,
                    order: now,
                    createdAt: now,
                    updatedAt: now,
                },
            };

            // If it came from a note, update the note's content to point to the new ID
            if (oldBullet.parentNoteId && state.bullets[oldBullet.parentNoteId]) {
                const parentNote = state.bullets[oldBullet.parentNoteId];
                if (parentNote.longFormContent) {
                    const oldStr = `"bulletId":"${oldBullet.id}"`;
                    const newStr = `"bulletId":"${newId}"`;
                    // Use a regex with global flag to replace all occurrences (in case of duplicates)
                    const updatedContent = parentNote.longFormContent.split(oldStr).join(newStr);
                    nextBullets[parentNote.id] = {
                        ...parentNote,
                        longFormContent: updatedContent,
                        updatedAt: now
                    };
                }
            }

            return {
                ...state,
                bullets: nextBullets
            };
        }
        case 'SET_VIEW': {
            return {
                ...state,
                view: {
                    mode: action.payload.mode,
                    date: action.payload.date || state.view.date,
                    collectionId: action.payload.collectionId,
                },
            };
        }
        case 'ADD_COLLECTION': {
            const { id, ...data } = action.payload;
            const now = Date.now();
            return {
                ...state,
                collections: {
                    ...state.collections,
                    [id]: {
                        id,
                        title: data.title,
                        type: data.type,
                        createdAt: now,
                        order: now, // Initialize order
                    },
                },
            };
        }
        case 'UPDATE_COLLECTION': {
            const collection = state.collections[action.payload.id];
            if (!collection) return state;

            return {
                ...state,
                collections: {
                    ...state.collections,
                    [action.payload.id]: {
                        ...collection,
                        ...action.payload,
                    }
                }
            };
        }
        case 'DELETE_COLLECTION': {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [action.payload.id]: deleted, ...remainingCollections } = state.collections;
            return {
                ...state,
                collections: remainingCollections
            };
        }
        case 'TOGGLE_PREFERENCE': {
            return {
                ...state,
                preferences: {
                    ...state.preferences,
                    [action.payload.key]: !state.preferences[action.payload.key]
                }
            };
        }
        case 'LOAD_DATA': {
            const newState = {
                ...state,
                bullets: { ...state.bullets, ...(action.payload.bullets || {}) },
                collections: { ...state.collections, ...(action.payload.collections || {}) },
            };
            // Preserve local preferences if not in payload, or maybe we want to sync them?
            // For now, let's assume preferences are local-only or we can sync them if we add them to Firestore.
            // But since payload is Partial<AppState>, if preferences are there, we take them.
            if (action.payload.preferences) {
                newState.preferences = { ...state.preferences, ...action.payload.preferences };
            }
            return newState;
        }
        default:
            return state;
    }
}
