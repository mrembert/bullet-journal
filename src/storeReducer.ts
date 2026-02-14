import type { AppState, Bullet, Action } from './types';
import { getTodayDate } from './lib/utils.ts';


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
        case 'ADD_BULLETS': {
            const newBullets = { ...state.bullets };
            action.payload.bullets.forEach(bullet => {
                newBullets[bullet.id] = bullet;
            });
            return {
                ...state,
                bullets: newBullets
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
        case 'UPDATE_BULLETS': {
            const newBullets = { ...state.bullets };
            const now = Date.now();
            action.payload.ids.forEach(id => {
                const bullet = newBullets[id];
                if (bullet) {
                    const updates: Partial<Bullet> = {
                        ...action.payload.updates,
                        updatedAt: now,
                    };

                    // Handle completion timestamp
                    if (action.payload.updates.state === 'completed' && bullet.state !== 'completed') {
                        updates.completedAt = now;
                    } else if (action.payload.updates.state === 'open' && bullet.state === 'completed') {
                        updates.completedAt = undefined;
                    }

                    newBullets[id] = { ...bullet, ...updates };
                }
            });
            return {
                ...state,
                bullets: newBullets,
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
        case 'DELETE_BULLETS': {
            const newBullets = { ...state.bullets };
            action.payload.ids.forEach(id => {
                delete newBullets[id];
            });
            return { ...state, bullets: newBullets };
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
        case 'RESTORE_BULLET': {
            return {
                ...state,
                bullets: {
                    ...state.bullets,
                    [action.payload.id]: action.payload,
                },
            };
        }
        case 'UNDO':
            return state;
        default:
            return state;
    }
}
