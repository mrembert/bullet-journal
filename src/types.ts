export type BulletType = 'task' | 'note' | 'event';
export type BulletState = 'open' | 'completed' | 'migrated' | 'scheduled' | 'cancelled';

export interface Bullet {
    id: string;
    content: string;
    type: BulletType;
    state: BulletState;
    date?: string | null; // ISO date string (YYYY-MM-DD), optional for undated tasks
    collectionId?: string | null; // If 'daily', this is undefined or null, otherwise points to a collection
    order: number;
    createdAt: number;
    updatedAt: number;
    completedAt?: number;
    longFormContent?: string; // For meeting notes or detailed descriptions
    parentNoteId?: string; // ID of the note where this task was created
}

export interface Collection {
    id: string;
    title: string;
    type: 'project' | 'list' | 'future_log';
    createdAt: number;
    archived?: boolean;
}

export type ViewMode = 'daily' | 'week' | 'future' | 'collection' | 'search' | 'backlog' | 'help';

export interface AppState {
    bullets: Record<string, Bullet>; // ID -> Bullet
    collections: Record<string, Collection>; // ID -> Collection
    view: {
        mode: ViewMode;
        date: string; // Current date being viewed (for daily log)
        collectionId?: string; // If viewing a collection
    };
    preferences: {
        groupByProject: boolean;
        showCompleted: boolean;
        showMigrated: boolean; // Optional: might want to toggle moved items too
    };
}

export type Action =
    | { type: 'ADD_BULLET'; payload: { id: string; content: string; type: BulletType; date?: string; collectionId?: string } }
    | { type: 'UPDATE_BULLET'; payload: { id: string; content?: string; state?: BulletState; longFormContent?: string; date?: string | null; collectionId?: string | null } }
    | { type: 'DELETE_BULLET'; payload: { id: string } }
    | { type: 'SET_VIEW'; payload: { mode: ViewMode; date?: string; collectionId?: string } }
    | { type: 'ADD_COLLECTION'; payload: { id: string; title: string; type: Collection['type'] } }
    | { type: 'UPDATE_COLLECTION'; payload: { id: string; title?: string; archived?: boolean } }
    | { type: 'DELETE_COLLECTION'; payload: { id: string } }
    | { type: 'MIGRATE_BULLET'; payload: { id: string; targetDate: string; newId?: string } }
    | { type: 'REORDER_BULLETS'; payload: { items: { id: string, order: number }[] } }
    | { type: 'TOGGLE_PREFERENCE'; payload: { key: keyof AppState['preferences'] } }
    | { type: 'LOAD_DATA'; payload: Partial<AppState> }; // Partial loading for sync
