export type BulletType = 'task' | 'note' | 'event';
export type BulletState = 'open' | 'completed' | 'migrated' | 'scheduled' | 'cancelled';

export interface Bullet {
    id: string;
    content: string;
    type: BulletType;
    state: BulletState;
    date: string; // ISO date string (YYYY-MM-DD)
    collectionId?: string; // If 'daily', this is undefined or null, otherwise points to a collection
    order: number;
    createdAt: number;
    updatedAt: number;
    completedAt?: number;
    longFormContent?: string; // For meeting notes or detailed descriptions
}

export interface Collection {
    id: string;
    title: string;
    type: 'project' | 'list' | 'future_log';
    createdAt: number;
}

export type ViewMode = 'daily' | 'week' | 'future' | 'collection' | 'search' | 'backlog';

export interface AppState {
    bullets: Record<string, Bullet>; // ID -> Bullet
    collections: Record<string, Collection>; // ID -> Collection
    view: {
        mode: ViewMode;
        date: string; // Current date being viewed (for daily log)
        collectionId?: string; // If viewing a collection
    };
}
