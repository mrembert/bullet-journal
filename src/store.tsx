import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import type { AppState, Action } from './types';
import { useAuth } from './contexts/AuthContext';
import { performActionInFirestore, subscribeToUserData } from './lib/database';
import { reducer, initialState } from './storeReducer';
import { generateUUID } from './lib/utils';

// --- Context ---
const StoreContext = createContext<{
    state: AppState;
    dispatch: React.Dispatch<Action>; // Using Action instead of any
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

        console.log("Store: Subscribing to user data");
        const unsubscribe = subscribeToUserData(user.uid, (data) => {
            rawDispatch({ type: 'LOAD_DATA', payload: data });
        });

        return () => unsubscribe();
    }, [user]);

    // 3. Dispatch Wrapper
    // This intercepts actions, generates IDs if needed, updates local state, AND calls Firestore
    const dispatch = useCallback(async (action: Action) => {
        // Enforce ID generation for creations
        let enhancedAction: any = { ...action };

        if (action.type === 'ADD_BULLET' && !action.payload.id) {
            enhancedAction.payload.id = generateUUID();
        }
        if (action.type === 'ADD_COLLECTION' && !action.payload.id) {
            enhancedAction.payload.id = generateUUID();
        }
        if (action.type === 'MIGRATE_BULLET' && !action.payload.newId) {
            // Only if not collection-based. But safely we can just generate one.
            enhancedAction.payload.newId = generateUUID();
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
    }, [state, user]);

    const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);

    return (
        <StoreContext.Provider value={value}>
            {children}
        </StoreContext.Provider>
    );
}
