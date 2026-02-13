import { db } from './firebase';
import {
    collection,
    doc,
    onSnapshot,
    setDoc,
    deleteDoc,
    updateDoc,
    writeBatch
} from 'firebase/firestore';
import type { AppState, Action } from '../types';
import { subscribeToUserDataLogic, performActionInFirestoreLogic, type DatabaseDeps } from './database.logic';

const deps: DatabaseDeps = {
    collection,
    doc,
    onSnapshot,
    setDoc,
    deleteDoc,
    updateDoc,
    writeBatch
};

export function subscribeToUserData(uid: string, onDataChange: (data: Partial<AppState>) => void) {
    if (!db) {
        console.error("Firebase Firestore not initialized");
        return () => { };
    }
    return subscribeToUserDataLogic(deps, db, uid, onDataChange);
}

export async function performActionInFirestore(uid: string, action: Action, currentState: AppState) {
    if (!db) {
        console.error("Firebase Firestore not initialized");
        return;
    }
    return performActionInFirestoreLogic(deps, db, uid, action, currentState);
}
