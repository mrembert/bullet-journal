
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { filterStateForExport, type ExportOptions, type DateLib } from './exportUtils.ts';
import type { AppState, Bullet, Collection } from '../types.ts';

// Fixed "Today" for testing: Friday, Oct 27, 2023
const fixedToday = new Date('2023-10-27T00:00:00Z');

const mockDateLib: DateLib = {
    parseISO: (s: string) => new Date(s),
    startOfDay: (d: Date) => {
        // Always return fixed today for consistency in this test context
        return new Date(fixedToday);
    },
    subDays: (d: Date, amount: number) => {
        const n = new Date(d);
        n.setDate(n.getDate() - amount);
        return n;
    },
    startOfWeek: (d: Date, options?: { weekStartsOn: 1 }) => {
        // Assuming d is fixedToday (Friday)
        // Monday was 4 days ago
        const n = new Date(d);
        n.setDate(n.getDate() - 4);
        return n;
    },
    endOfWeek: (d: Date, options?: { weekStartsOn: 1 }) => {
        // Assuming d is fixedToday (Friday)
        // Sunday is 2 days ahead
        const n = new Date(d);
        n.setDate(n.getDate() + 2);
        return n;
    },
    isWithinInterval: (date: Date, interval: { start: Date, end: Date }) => {
        return date.getTime() >= interval.start.getTime() && date.getTime() <= interval.end.getTime();
    }
};

describe('filterStateForExport', () => {
    // Helper to create a minimal AppState
    const createMockState = (bullets: Record<string, Bullet>, collections: Record<string, Collection>): AppState => ({
        bullets,
        collections,
        view: { mode: 'daily', date: '2023-01-01' },
        preferences: { groupByProject: false, showCompleted: true, showMigrated: false, sortByType: false }
    });

    const todayStr = '2023-10-27T00:00:00Z';
    const yesterdayStr = '2023-10-26T00:00:00Z';
    const lastWeekStr = '2023-10-20T00:00:00Z'; // Outside "this week" (Mon 23 - Sun 29)
    const longAgoStr = '2023-08-27T00:00:00Z';

    // Create some mock collections
    const collections: Record<string, Collection> = {
        'proj1': { id: 'proj1', title: 'Project 1', type: 'project', createdAt: 123 },
        'proj2': { id: 'proj2', title: 'Project 2', type: 'project', createdAt: 123 },
    };

    // Create some mock bullets
    const bullets: Record<string, Bullet> = {
        'b1': { id: 'b1', content: 'Task 1', type: 'task', state: 'open', date: todayStr, collectionId: 'proj1', order: 1, createdAt: 1, updatedAt: 1 },
        'b2': { id: 'b2', content: 'Task 2', type: 'task', state: 'open', date: yesterdayStr, collectionId: 'proj2', order: 2, createdAt: 1, updatedAt: 1 },
        'b3': { id: 'b3', content: 'Task 3', type: 'task', state: 'open', date: lastWeekStr, collectionId: null, order: 3, createdAt: 1, updatedAt: 1 },
        'b4': { id: 'b4', content: 'Task 4', type: 'task', state: 'open', date: longAgoStr, collectionId: 'proj1', order: 4, createdAt: 1, updatedAt: 1 },
        'b5': { id: 'b5', content: 'Undated Task', type: 'task', state: 'open', date: null, collectionId: 'proj1', order: 5, createdAt: 1, updatedAt: 1 },
        'b6': { id: 'b6', content: 'Undated Task 2', type: 'task', state: 'open', date: undefined, collectionId: 'proj2', order: 6, createdAt: 1, updatedAt: 1 },
    };

    const state = createMockState(bullets, collections);

    it('should exclude specified projects and their bullets', async () => {
        const options: ExportOptions = {
            dateRange: 'all',
            excludedCollectionIds: ['proj1']
        };

        const result = await filterStateForExport(state, options, mockDateLib);

        // Check Collections
        assert.ok(!result.collections['proj1'], 'proj1 should be removed');
        assert.ok(result.collections['proj2'], 'proj2 should be kept');

        // Check Bullets
        assert.ok(!result.bullets['b1'], 'b1 (proj1) should be removed');
        assert.ok(result.bullets['b2'], 'b2 (proj2) should be kept');
        assert.ok(result.bullets['b3'], 'b3 (no project) should be kept');
        assert.ok(!result.bullets['b4'], 'b4 (proj1) should be removed');
        assert.ok(!result.bullets['b5'], 'b5 (undated, proj1) should be removed because project excluded');
        assert.ok(result.bullets['b6'], 'b6 (undated, proj2) should be kept');
    });

    it('should filter by date: past-30-days', async () => {
        const options: ExportOptions = {
            dateRange: 'past-30-days',
            excludedCollectionIds: []
        };

        const result = await filterStateForExport(state, options, mockDateLib);

        // Logic check:
        // today is 2023-10-27.
        // subDays(today, 29) -> 2023-09-28.
        // Interval: [2023-09-28, 2023-10-27].

        // b1 (today 10-27): keep
        assert.ok(result.bullets['b1'], 'b1 (today) should be kept');
        // b2 (yesterday 10-26): keep
        assert.ok(result.bullets['b2'], 'b2 (yesterday) should be kept');
        // b3 (10-20): keep (within 30 days)
        assert.ok(result.bullets['b3'], 'b3 (last week) should be kept');
        // b4 (08-27): exclude (way before 09-28)
        assert.ok(!result.bullets['b4'], 'b4 (60 days ago) should be removed');
        // b5 (undated): keep
        assert.ok(result.bullets['b5'], 'b5 (undated) should be kept');
    });

    it('should filter by date: this-week', async () => {
        const options: ExportOptions = {
            dateRange: 'this-week',
            excludedCollectionIds: []
        };

        const result = await filterStateForExport(state, options, mockDateLib);

        // Week: Mon Oct 23 - Sun Oct 29

        // b1 (Fri 10-27): keep
        assert.ok(result.bullets['b1'], 'b1 (today/Fri) should be kept');
        // b2 (Thu 10-26): keep
        assert.ok(result.bullets['b2'], 'b2 (Thu) should be kept');
        // b3 (Fri 10-20): exclude (last week)
        assert.ok(!result.bullets['b3'], 'b3 (last week) should be removed');
        // b4 (08-27): exclude
        assert.ok(!result.bullets['b4'], 'b4 (60 days ago) should be removed');
        // b5 (undated): keep
        assert.ok(result.bullets['b5'], 'b5 (undated) should be kept');
    });

    it('should combine project exclusion and date filtering', async () => {
        const options: ExportOptions = {
            dateRange: 'past-30-days',
            excludedCollectionIds: ['proj1']
        };

        const result = await filterStateForExport(state, options, mockDateLib);

        // b1 (today, proj1): exclude (project)
        assert.ok(!result.bullets['b1']);
        // b2 (yesterday, proj2): keep
        assert.ok(result.bullets['b2']);
        // b4 (60 days ago, proj1): exclude (project & date)
        assert.ok(!result.bullets['b4']);
        // b5 (undated, proj1): exclude (project)
        assert.ok(!result.bullets['b5']);
    });
});
