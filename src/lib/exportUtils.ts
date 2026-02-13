
import type { AppState, Bullet, Collection } from '../types';

export interface ExportOptions {
    dateRange: 'all' | 'this-week' | 'past-30-days';
    excludedCollectionIds: string[];
}

export interface DateLib {
    parseISO: (dateString: string) => Date;
    isWithinInterval: (date: Date, interval: { start: Date, end: Date }) => boolean;
    startOfWeek: (date: Date, options?: { weekStartsOn: 1 }) => Date;
    endOfWeek: (date: Date, options?: { weekStartsOn: 1 }) => Date;
    subDays: (date: Date, amount: number) => Date;
    startOfDay: (date: Date) => Date;
}

/**
 * Filters the application state for export based on the provided options.
 *
 * Requirements:
 * 1. Project Exclusion:
 *    - Remove excluded projects (Collection) from the collections map.
 *    - Remove all bullets belonging to an excluded project.
 * 2. Date Filtering:
 *    - 'all': Include all remaining bullets.
 *    - 'this-week': Include bullets within the current calendar week (Mon-Sun).
 *    - 'past-30-days': Include bullets within the last 30 days (inclusive of today).
 *    - ALWAYS include undated bullets (where bullet.date is null/undefined).
 *
 * @param state The full AppState.
 * @param options The export options.
 * @param dateLib Optional dependency injection for date library (defaults to date-fns).
 * @returns A new AppState object containing only the filtered data.
 */
export async function filterStateForExport(
    state: AppState,
    options: ExportOptions,
    dateLib?: DateLib
): Promise<AppState> {
    const { dateRange, excludedCollectionIds } = options;

    // Load date-fns dynamically if not provided
    // This allows testing without node_modules by injecting a mock
    const dateFns = dateLib || (await import('date-fns') as unknown as DateLib);
    const { parseISO, isWithinInterval, startOfWeek, endOfWeek, subDays, startOfDay } = dateFns;

    const now = new Date();
    const today = startOfDay(now);

    // Date Range Calculations
    let dateFilterFn: ((dateStr: string) => boolean) | null = null;

    if (dateRange === 'this-week') {
        const start = startOfWeek(today, { weekStartsOn: 1 }); // Monday
        const end = endOfWeek(today, { weekStartsOn: 1 }); // Sunday
        dateFilterFn = (dateStr: string) => {
            const date = parseISO(dateStr);
            return isWithinInterval(date, { start, end });
        };
    } else if (dateRange === 'past-30-days') {
        const start = subDays(today, 29); // 29 days ago + today = 30 days
        const end = today;
        dateFilterFn = (dateStr: string) => {
            const date = parseISO(dateStr);
            // Comparing dates using isWithinInterval is safer for consistency
            return isWithinInterval(date, { start, end });
        };
    }

    // 1. Filter Collections
    // Create a new collections object excluding the selected IDs
    const filteredCollections: Record<string, Collection> = {};
    Object.entries(state.collections).forEach(([id, collection]) => {
        if (!excludedCollectionIds.includes(id)) {
            filteredCollections[id] = collection;
        }
    });

    // 2. Filter Bullets
    const filteredBullets: Record<string, Bullet> = {};
    Object.entries(state.bullets).forEach(([id, bullet]) => {
        // Check Project Exclusion
        // If the bullet belongs to a collection, and that collection is excluded, skip it.
        if (bullet.collectionId && excludedCollectionIds.includes(bullet.collectionId)) {
            return;
        }

        // Check Date Filtering
        // Always include undated bullets
        if (!bullet.date) {
            filteredBullets[id] = bullet;
            return;
        }

        // If dateRange is 'all', include it (unless excluded by project above)
        if (dateRange === 'all') {
            filteredBullets[id] = bullet;
            return;
        }

        // Apply specific date filter
        if (dateFilterFn && dateFilterFn(bullet.date)) {
            filteredBullets[id] = bullet;
        }
    });

    return {
        ...state,
        collections: filteredCollections,
        bullets: filteredBullets,
    };
}
