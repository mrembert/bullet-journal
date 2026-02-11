import { db } from './firebase';
import {
    collection,
    doc,
    onSnapshot,
    setDoc,
    deleteDoc,
    updateDoc
} from 'firebase/firestore';
import type { AppState, Action } from '../types';
import { subscribeToUserDataLogic, performActionInFirestoreLogic, type DatabaseDeps } from './database.logic';

const deps: DatabaseDeps = {
    collection,
    doc,
    onSnapshot,
    setDoc,
    deleteDoc,
    updateDoc
};

export function subscribeToUserData(uid: string, onDataChange: (data: Partial<AppState>) => void) {
    return subscribeToUserDataLogic(deps, db, uid, onDataChange);
}

export async function performActionInFirestore(uid: string, action: Action, currentState: AppState) {
    return performActionInFirestoreLogic(deps, db, uid, action, currentState);
}
