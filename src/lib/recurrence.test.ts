import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateRecurringDatesLogic, type RecurrenceConfig, type DateOps } from './recurrence.logic.ts';

// Simple fake date implementation for testing logic flow
const deps: DateOps = {
    addDays: (d, n) => new Date(d.getTime() + n * 86400000),
    addWeeks: (d, n) => new Date(d.getTime() + n * 7 * 86400000),
    addMonths: (d, n) => {
        const newDate = new Date(d);
        newDate.setMonth(d.getMonth() + n);
        return newDate;
    },
    addYears: (d, n) => {
        const newDate = new Date(d);
        newDate.setFullYear(d.getFullYear() + n);
        return newDate;
    },
    startOfMonth: (d) => {
        const newDate = new Date(d);
        newDate.setDate(1);
        return newDate;
    },
    endOfMonth: (d) => {
        const newDate = new Date(d);
        newDate.setMonth(d.getMonth() + 1);
        newDate.setDate(0);
        return newDate;
    },
    setDate: (d, n) => {
        const newDate = new Date(d);
        newDate.setDate(n);
        return newDate;
    },
    isAfter: (d1, d2) => d1.getTime() > d2.getTime(),
    getDay: (d) => d.getDay(),
    format: (d) => d.toISOString().split('T')[0],
    parseISO: (s) => new Date(s),
    nextDay: (d, day) => {
        const currentDay = d.getDay();
        const diff = (day - currentDay + 7) % 7;
        const add = diff === 0 ? 7 : diff;
        return new Date(d.getTime() + add * 86400000);
    },
    isSameDay: (d1, d2) => d1.toISOString().split('T')[0] === d2.toISOString().split('T')[0]
};

describe('generateRecurringDatesLogic', () => {
    const startDate = '2025-01-01'; // Wednesday

    it('generates daily dates', () => {
        const config: RecurrenceConfig = { frequency: 'daily', interval: 1 };
        const dates = generateRecurringDatesLogic(deps, startDate, config, 3);
        assert.strictEqual(dates.length, 3);
        assert.strictEqual(dates[0], '2025-01-01');
        assert.strictEqual(dates[1], '2025-01-02');
        assert.strictEqual(dates[2], '2025-01-03');
    });

    it('generates weekly dates', () => {
        const config: RecurrenceConfig = { frequency: 'weekly', interval: 1 };
        const dates = generateRecurringDatesLogic(deps, startDate, config, 3);
        assert.strictEqual(dates.length, 3);
        assert.strictEqual(dates[0], '2025-01-01');
        assert.strictEqual(dates[1], '2025-01-08');
        assert.strictEqual(dates[2], '2025-01-15');
    });

    it('generates monthly dates (same date)', () => {
        const config: RecurrenceConfig = { frequency: 'monthly', interval: 1, monthDay: 1 };
        const dates = generateRecurringDatesLogic(deps, startDate, config, 3);
        assert.strictEqual(dates.length, 3);
        assert.strictEqual(dates[0], '2025-01-01');
        assert.strictEqual(dates[1], '2025-02-01');
        assert.strictEqual(dates[2], '2025-03-01');
    });

    it('generates yearly dates', () => {
        const config: RecurrenceConfig = { frequency: 'yearly', interval: 1 };
        const dates = generateRecurringDatesLogic(deps, startDate, config, 3);
        // Should only generate 2 because of hard 1-year limit logic in recurrence.logic.ts
        assert.strictEqual(dates.length, 2);
        assert.strictEqual(dates[0], '2025-01-01');
        assert.strictEqual(dates[1], '2026-01-01');
    });

    it('respects count limit', () => {
        const config: RecurrenceConfig = { frequency: 'daily', interval: 1 };
        const dates = generateRecurringDatesLogic(deps, startDate, config, 2);
        assert.strictEqual(dates.length, 2);
    });
});
