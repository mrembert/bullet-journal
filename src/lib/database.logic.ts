
import type {
    Firestore,
    collection,
    doc,
    onSnapshot,
    setDoc,
    deleteDoc,
    updateDoc,
    writeBatch
} from 'firebase/firestore';
import type { AppState, Bullet, Collection, Action } from '../types';

export interface DatabaseDeps {
    collection: typeof collection;
    doc: typeof doc;
    onSnapshot: typeof onSnapshot;
    setDoc: typeof setDoc;
    updateDoc: typeof updateDoc;
    deleteDoc: typeof deleteDoc;
    writeBatch: typeof writeBatch;
}

export function subscribeToUserDataLogic(
    deps: DatabaseDeps,
    db: Firestore,
    uid: string,
    onDataChange: (data: Partial<AppState>) => void
) {
    const bulletsRef = deps.collection(db, 'users', uid, 'bullets');
    const collectionsRef = deps.collection(db, 'users', uid, 'collections');

    // Subscribe to Bullets
    const unsubscribeBullets = deps.onSnapshot(bulletsRef, (snapshot) => {
        const bullets: Record<string, Bullet> = {};
        snapshot.forEach(doc => {
            bullets[doc.id] = doc.data() as Bullet;
        });
        onDataChange({ bullets });
    }, (error) => {
        console.error("Error fetching bullets:", error);
    });

    // Subscribe to Collections
    const unsubscribeCollections = deps.onSnapshot(collectionsRef, (snapshot) => {
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

export async function performActionInFirestoreLogic(
    deps: DatabaseDeps,
    db: Firestore,
    uid: string,
    action: Action,
    currentState: AppState
) {
    const usersRef = deps.doc(db, 'users', uid);

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
                    Object.entries(data).filter(([, v]) => v !== undefined)
                );

                const bulletRef = deps.doc(usersRef, 'bullets', id);
                await deps.setDoc(bulletRef, {
                    ...cleanData,
                    id,
                    state: 'open',
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    order: Date.now()
                });
                break;
            }
            case 'ADD_BULLETS': {
                const batch = deps.writeBatch(db);
                action.payload.bullets.forEach(bullet => {
                    const bulletRef = deps.doc(usersRef, 'bullets', bullet.id);
                    const cleanData = Object.fromEntries(
                        Object.entries(bullet).filter(([, v]) => v !== undefined)
                    );
                    batch.set(bulletRef, cleanData);
                });
                await batch.commit();
                break;
            }
            case 'UPDATE_BULLET': {
                const ref = deps.doc(usersRef, 'bullets', action.payload.id);
                const updates = Object.fromEntries(
                    Object.entries(action.payload).filter(([, v]) => v !== undefined)
                );
                await deps.updateDoc(ref, { ...updates, updatedAt: Date.now() });
                break;
            }
            case 'UPDATE_BULLETS': {
                const batch = deps.writeBatch(db);
                const now = Date.now();
                action.payload.ids.forEach(id => {
                    const ref = deps.doc(usersRef, 'bullets', id);
                    const updates = { ...action.payload.updates, updatedAt: now };
                    const cleanUpdates = Object.fromEntries(
                        Object.entries(updates).filter(([, v]) => v !== undefined)
                    );
                    batch.update(ref, cleanUpdates);
                });
                await batch.commit();
                break;
            }
            case 'DELETE_BULLET': {
                await deps.deleteDoc(deps.doc(usersRef, 'bullets', action.payload.id));
                break;
            }
            case 'DELETE_BULLETS': {
                const batch = deps.writeBatch(db);
                action.payload.ids.forEach(id => {
                    const ref = deps.doc(usersRef, 'bullets', id);
                    batch.delete(ref);
                });
                await batch.commit();
                break;
            }
            case 'RESTORE_BULLET': {
                const { id, ...data } = action.payload;
                const cleanData = Object.fromEntries(
                    Object.entries(data).filter(([, v]) => v !== undefined)
                );
                await deps.setDoc(deps.doc(usersRef, 'bullets', id), {
                    ...cleanData,
                    id,
                    updatedAt: Date.now()
                });
                break;
            }
            case 'ADD_COLLECTION': {
                const { id, ...data } = action.payload;
                if (!id) return;
                await deps.setDoc(deps.doc(usersRef, 'collections', id), {
                    ...data,
                    id,
                    createdAt: Date.now()
                });
                break;
            }
            case 'UPDATE_COLLECTION': {
                const ref = deps.doc(usersRef, 'collections', action.payload.id);
                const updates = Object.fromEntries(
                    Object.entries(action.payload).filter(([, v]) => v !== undefined)
                );
                await deps.updateDoc(ref, updates);
                break;
            }
            case 'DELETE_COLLECTION': {
                await deps.deleteDoc(deps.doc(usersRef, 'collections', action.payload.id));
                break;
            }
            case 'REORDER_BULLETS': {
                const batchPromises = action.payload.items.map(item =>
                    deps.updateDoc(deps.doc(usersRef, 'bullets', item.id), { order: item.order })
                );
                await Promise.all(batchPromises);
                break;
            }
        }
    } catch (e) {
        console.error("Firestore Write Error:", e);
    }
}
