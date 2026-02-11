import { db } from './firebase';
import {
    collection,
    doc,
    onSnapshot,
    setDoc,
    deleteDoc,
    updateDoc
} from 'firebase/firestore';
import type { AppState } from '../types';
import {
    subscribeToUserDataLogic,
    performActionInFirestoreLogic,
    type DatabaseDeps,
    type Action
} from './database.logic';

// Re-export Action type for backward compatibility (if needed by other files)
export type { Action };

// Dependency Injection Setup
const deps: DatabaseDeps = {
    // @ts-expect-error collection type mismatch between loose definitions and strict firebase types
    collection,
    // @ts-expect-error doc type mismatch
    doc,
    // @ts-expect-error onSnapshot type mismatch
    onSnapshot,
    // @ts-expect-error setDoc type mismatch
    setDoc,
    // @ts-expect-error updateDoc type mismatch
    updateDoc,
    // @ts-expect-error deleteDoc type mismatch
    deleteDoc
};

export function subscribeToUserData(uid: string, onDataChange: (data: Partial<AppState>) => void) {
    return subscribeToUserDataLogic(deps, db, uid, onDataChange);
}

export async function performActionInFirestore(uid: string, action: Action, currentState: AppState) {
    return performActionInFirestoreLogic(deps, db, uid, action, currentState);
}
