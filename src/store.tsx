import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { AppState, Bullet, Collection, BulletType, ViewMode, BulletState } from './types';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { useAuth } from './contexts/AuthContext';
import { performActionInFirestore, subscribeToUserData } from './lib/database';

// --- Actions ---
// NOTE: We now require IDs for creation actions because the Dispatch wrapper generates them
// to ensure consistency between Local Optimistic UI and Firestore Write.
type Action =
    | { type: 'ADD_BULLET'; payload: { id: string; content: string; type: BulletType; date: string; collectionId?: string } }
    | { type: 'UPDATE_BULLET'; payload: { id: string; content?: string; state?: BulletState; longFormContent?: string } }
    | { type: 'DELETE_BULLET'; payload: { id: string } }
    | { type: 'SET_VIEW'; payload: { mode: ViewMode; date?: string; collectionId?: string } }
    | { type: 'ADD_COLLECTION'; payload: { id: string; title: string; type: Collection['type'] } }
    | { type: 'MIGRATE_BULLET'; payload: { id: string; targetDate: string; newId?: string } }
    | { type: 'REORDER_BULLETS'; payload: { items: { id: string, order: number }[] } }
    | { type: 'TOGGLE_PREFERENCE'; payload: { key: keyof AppState['preferences'] } }
    | { type: 'LOAD_DATA'; payload: Partial<AppState> }; // Partial loading for sync

// --- Initial State ---
const initialState: AppState = {
    bullets: {},
    collections: {},
    view: {
        mode: 'daily',
        date: format(new Date(), 'yyyy-MM-dd'),
    },
    preferences: {
        groupByProject: false,
        showCompleted: true,
        showMigrated: false,
    },
};

// --- Reducer ---
function reducer(state: AppState, action: Action): AppState {
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
        case 'DELETE_BULLET': {
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
            const newId = action.payload.newId || uuidv4();
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
                    },
                },
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

// --- Context ---
const StoreContext = createContext<{
    state: AppState;
    dispatch: React.Dispatch<any>; // Using any to accept Actions without explicit IDs from Components if using wrapper
}>({ state: initialState, dispatch: () => null });

export function useStore() {
    return useContext(StoreContext);
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
    // 1. Initialize with basic state (no localStorage)
    const [state, rawDispatch] = useReducer(reducer, initialState);
    const { user } = useAuth();

    // 2. Subscribe to Firestore
    useEffect(() => {
        if (!user) return; // Wait for auth

        console.log("Store: Subscribing to user data for", user.uid);
        const unsubscribe = subscribeToUserData(user.uid, (data) => {
            rawDispatch({ type: 'LOAD_DATA', payload: data });
        });

        return () => unsubscribe();
    }, [user]);

    // 3. Dispatch Wrapper
    // This intercepts actions, generates IDs if needed, updates local state, AND calls Firestore
    const dispatch = async (action: any) => {
        // Enforce ID generation for creations
        let enhancedAction = { ...action };

        if (action.type === 'ADD_BULLET' && !action.payload.id) {
            enhancedAction.payload.id = uuidv4();
        }
        if (action.type === 'ADD_COLLECTION' && !action.payload.id) {
            enhancedAction.payload.id = uuidv4();
        }
        if (action.type === 'MIGRATE_BULLET' && !action.payload.newId) {
            // Only if not collection-based. But safely we can just generate one.
            enhancedAction.payload.newId = uuidv4();
        }

        // 1. Optimistic Update (Local)
        rawDispatch(enhancedAction);

        // 2. Side Effect (Firestore)
        if (user) {
            // We verify it's a data-modifying action, not UI (SET_VIEW)
            if (action.type !== 'SET_VIEW' && action.type !== 'LOAD_DATA') {
                performActionInFirestore(user.uid, enhancedAction, state);
            }
        }
    };

    return (
        <StoreContext.Provider value={{ state, dispatch }}>
            {children}
        </StoreContext.Provider>
    );
}
