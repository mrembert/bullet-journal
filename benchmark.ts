import { performance } from 'perf_hooks';
import { filterStateForExport } from './src/lib/exportUtils.ts';
import type { AppState, Bullet, Collection } from './src/types.ts';

const mockDateLib = {
    parseISO: (s: string) => new Date(s),
    startOfDay: (d: Date) => d,
    subDays: (d: Date, amount: number) => d,
    startOfWeek: (d: Date) => d,
    endOfWeek: (d: Date) => d,
    isWithinInterval: (date: Date) => true
};

async function runBenchmark() {
    // Generate large state
    const numCollections = 1000;
    const numBullets = 100000;
    const numExcluded = 500;

    const collections: Record<string, Collection> = {};
    const excludedCollectionIds: string[] = [];

    for (let i = 0; i < numCollections; i++) {
        const id = `col_${i}`;
        collections[id] = { id, title: `Project ${i}`, type: 'project', createdAt: 1 };
        if (i < numExcluded) {
            excludedCollectionIds.push(id);
        }
    }

    const bullets: Record<string, Bullet> = {};
    for (let i = 0; i < numBullets; i++) {
        const id = `bul_${i}`;
        const colId = `col_${i % numCollections}`;
        bullets[id] = { id, content: `Task ${i}`, type: 'task', state: 'open', date: '2023-01-01', collectionId: colId, order: 1, createdAt: 1, updatedAt: 1 };
    }

    const state: AppState = {
        bullets,
        collections,
        view: { mode: 'daily', date: '2023-01-01' },
        preferences: { groupByProject: false, showCompleted: true, showMigrated: false, sortByType: false }
    };

    const options = {
        dateRange: 'all',
        excludedCollectionIds
    };

    console.log('Warming up...');
    for (let i = 0; i < 3; i++) {
        await filterStateForExport(state, options as any, mockDateLib as any);
    }

    console.log('Running benchmark...');
    const iterations = 10;
    let totalTime = 0;

    for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await filterStateForExport(state, options as any, mockDateLib as any);
        const end = performance.now();
        totalTime += (end - start);
    }

    console.log(`Average time over ${iterations} iterations: ${(totalTime / iterations).toFixed(2)} ms`);
}

runBenchmark().catch(console.error);