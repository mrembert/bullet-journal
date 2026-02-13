import {
    addDays,
    addWeeks,
    addMonths,
    addYears,
    startOfMonth,
    endOfMonth,
    setDate,
    isAfter,
    getDay,
    format,
    parseISO,
    nextDay,
    isSameDay
} from 'date-fns';
import { generateRecurringDatesLogic, type RecurrenceConfig, type DateOps } from './recurrence.logic.ts';

// Re-export types for convenience
export type { RecurrenceConfig, RecurrenceFrequency } from './recurrence.logic.ts';

// Actual dependency implementation
const dateOps: DateOps = {
    addDays,
    addWeeks,
    addMonths,
    addYears,
    startOfMonth,
    endOfMonth,
    setDate,
    isAfter,
    getDay,
    format: (date: Date, formatStr: string) => format(date, formatStr),
    parseISO,
    nextDay: (date: Date, day: 0 | 1 | 2 | 3 | 4 | 5 | 6) => nextDay(date, day),
    isSameDay
};

export function generateRecurringDates(startDateStr: string, config: RecurrenceConfig, limit: number = 52): string[] {
    return generateRecurringDatesLogic(dateOps, startDateStr, config, limit);
}
