import { db } from './firebase';
import {
    collection,
    doc,
    onSnapshot,
    setDoc,
    deleteDoc,
    updateDoc
} from 'firebase/firestore';
import type { AppState, Bullet, Collection, BulletType, BulletState } from '../types';

// Action Type Definition (Partial, for what we handle in DB)
type Action =
    | { type: 'ADD_BULLET'; payload: { id: string; content: string; type: BulletType; date: string; collectionId?: string } }
    | { type: 'UPDATE_BULLET'; payload: { id: string; content?: string; state?: BulletState; longFormContent?: string } }
    | { type: 'DELETE_BULLET'; payload: { id: string } }
    | { type: 'ADD_COLLECTION'; payload: { id: string; title: string; type: Collection['type'] } }
    | { type: 'MIGRATE_BULLET'; payload: { id: string; targetDate: string; newId?: string } } // newId optional as logic depends on collection
    | { type: 'REORDER_BULLETS'; payload: { items: { id: string, order: number }[] } };


export function subscribeToUserData(uid: string, onDataChange: (data: Partial<AppState>) => void) {
    const bulletsRef = collection(db, 'users', uid, 'bullets');
    const collectionsRef = collection(db, 'users', uid, 'collections');

    // Subscribe to Bullets
    const unsubscribeBullets = onSnapshot(bulletsRef, (snapshot) => {
        const bullets: Record<string, Bullet> = {};
        snapshot.forEach(doc => {
            bullets[doc.id] = doc.data() as Bullet;
        });
        onDataChange({ bullets });
    }, (error) => {
        console.error("Error fetching bullets:", error);
    });

    // Subscribe to Collections
    const unsubscribeCollections = onSnapshot(collectionsRef, (snapshot) => {
        const collections: Record<string, Collection> = {};
        snapshot.forEach(doc => {
            collections[doc.id] = doc.data() as Collection;
        });
        onDataChange({ collections });
    }, (error) => {
        console.error("Error fetching collections:", error);
    });

    return () => {
        unsubscribeBullets();
        unsubscribeCollections();
    };
}

export async function performActionInFirestore(uid: string, action: Action, currentState: AppState) {
    const usersRef = doc(db, 'users', uid);

    try {
        switch (action.type) {
            case 'ADD_BULLET': {
                const { id, ...data } = action.payload;
                if (!id) {
                    console.error("ADD_BULLET missing ID in payload for Firestore sync");
                    return;
                }
                // Clean data to remove undefined values
                const cleanData = Object.fromEntries(
                    Object.entries(data).filter(([_, v]) => v !== undefined)
                );

                const bulletRef = doc(usersRef, 'bullets', id);
                await setDoc(bulletRef, {
                    ...cleanData,
                    id,
                    state: 'open',
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    order: Date.now()
                });
                break;
            }
            case 'UPDATE_BULLET': {
                const ref = doc(usersRef, 'bullets', action.payload.id);
                const updates = Object.fromEntries(
                    Object.entries(action.payload).filter(([_, v]) => v !== undefined)
                );
                await updateDoc(ref, { ...updates, updatedAt: Date.now() });
                break;
            }
            case 'DELETE_BULLET': {
                await deleteDoc(doc(usersRef, 'bullets', action.payload.id));
                break;
            }
            case 'MIGRATE_BULLET': {
                const bullet = currentState.bullets[action.payload.id];
                if (!bullet) return;

                if (bullet.collectionId) {
                    await updateDoc(doc(usersRef, 'bullets', bullet.id), {
                        date: action.payload.targetDate,
                        updatedAt: Date.now()
                    });
                } else {
                    const now = Date.now();
                    // 1. Update Old
                    await updateDoc(doc(usersRef, 'bullets', bullet.id), {
                        state: 'migrated',
                        updatedAt: now
                    });

                    // 2. Create New
                    const newId = action.payload.newId;
                    if (!newId) return;

                    await setDoc(doc(usersRef, 'bullets', newId), {
                        ...bullet,
                        id: newId,
                        date: action.payload.targetDate,
                        state: 'open',
                        createdAt: now,
                        updatedAt: now,
                        order: now
                    });
                }
                break;
            }
            case 'ADD_COLLECTION': {
                const { id, ...data } = action.payload;
                if (!id) return;
                await setDoc(doc(usersRef, 'collections', id), {
                    ...data,
                    id,
                    createdAt: Date.now()
                });
                break;
            }
            case 'REORDER_BULLETS': {
                const batchPromises = action.payload.items.map(item =>
                    updateDoc(doc(usersRef, 'bullets', item.id), { order: item.order })
                );
                await Promise.all(batchPromises);
                break;
            }
        }
    } catch (e) {
        console.error("Firestore Write Error:", e);
    }
}
