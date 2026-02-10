import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { AppState, Bullet, Collection, BulletType, ViewMode, BulletState } from './types';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

// --- Actions ---
type Action =
    | { type: 'ADD_BULLET'; payload: { content: string; type: BulletType; date: string; collectionId?: string } }
    | { type: 'UPDATE_BULLET'; payload: { id: string; content?: string; state?: BulletState; longFormContent?: string } }
    | { type: 'DELETE_BULLET'; payload: { id: string } }
    | { type: 'SET_VIEW'; payload: { mode: ViewMode; date?: string; collectionId?: string } }
    | { type: 'ADD_COLLECTION'; payload: { title: string; type: Collection['type'] } }
    | { type: 'MIGRATE_BULLET'; payload: { id: string; targetDate: string } }
    | { type: 'REORDER_BULLETS'; payload: { items: { id: string, order: number }[] } }
    | { type: 'LOAD_DATA'; payload: AppState };

// --- Initial State ---
const initialState: AppState = {
    bullets: {},
    collections: {},
    view: {
        mode: 'daily',
        date: format(new Date(), 'yyyy-MM-dd'),
    },
};

// --- Reducer ---
function reducer(state: AppState, action: Action): AppState {
    switch (action.type) {
        case 'ADD_BULLET': {
            const id = uuidv4();
            const now = Date.now();
            // Find max order for current view? Or just use timestamp.
            // Timestamp is good enough for appending.
            const newBullet: Bullet = {
                id,
                content: action.payload.content,
                type: action.payload.type,
                state: 'open',
                date: action.payload.date,
                collectionId: action.payload.collectionId,
                order: now,
                createdAt: now,
                updatedAt: now,
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
            action.payload.items.forEach(({ id, order }) => {
                if (newBullets[id]) {
                    newBullets[id] = { ...newBullets[id], order };
                }
            });
            return { ...state, bullets: newBullets };
        }
        case 'DELETE_BULLET': {
            const { [action.payload.id]: deleted, ...remainingBullets } = state.bullets;
            return { ...state, bullets: remainingBullets };
        }
        case 'MIGRATE_BULLET': {
            const oldBullet = state.bullets[action.payload.id];
            if (!oldBullet) return state;

            // If it belongs to a collection, we just schedule it (update date), we don't clone it.
            // This keeps it as a single entity shared between Project and Daily Log.
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
            // Mark old one as 'migrated' and create a new one.
            const newId = uuidv4();
            const now = Date.now();

            return {
                ...state,
                bullets: {
                    ...state.bullets,
                    [oldBullet.id]: { ...oldBullet, state: 'migrated', updatedAt: now },
                    [newId]: {
                        ...oldBullet,
                        id: newId,
                        date: action.payload.targetDate,
                        state: 'open',
                        order: now,
                        createdAt: now,
                        updatedAt: now,
                    },
                },
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
            const id = uuidv4();
            const now = Date.now();
            return {
                ...state,
                collections: {
                    ...state.collections,
                    [id]: {
                        id,
                        title: action.payload.title,
                        type: action.payload.type,
                        createdAt: now,
                    },
                },
            };
        }
        case 'DELETE_BULLET': {
            const { id } = action.payload;
            const { [id]: deleted, ...remainingBullets } = state.bullets;
            return {
                ...state,
                bullets: remainingBullets,
            };
        }
        case 'LOAD_DATA': {
            return action.payload;
        }
        default:
            return state;
    }
}

// --- Context ---
const StoreContext = createContext<{
    state: AppState;
    dispatch: React.Dispatch<Action>;
}>({ state: initialState, dispatch: () => null });

export function useStore() {
    return useContext(StoreContext);
}

const STORAGE_KEY = 'bujo-app-data';

export function StoreProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initialState, (defaultState) => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : defaultState;
        } catch (e) {
            console.error("Failed to load state", e);
            return defaultState;
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [state]);

    return (
        <StoreContext.Provider value={{ state, dispatch }}>
            {children}
        </StoreContext.Provider>
    );
}
