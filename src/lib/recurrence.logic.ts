export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurrenceConfig {
    frequency: RecurrenceFrequency;
    interval: number; // e.g. every 1 week
    weekDays?: number[]; // 0-6 (Sun-Sat)
    monthDay?: number; // 1-31 (for same date every month)
    monthWeek?: number; // 1 (1st), 2 (2nd), 3 (3rd), 4 (4th), -1 (last) (for relative day)
    monthWeekDay?: number; // 0-6 (Sun-Sat) (for relative day)
    endDate?: string; // ISO date string
}

export interface DateOps {
    addDays: (date: Date, amount: number) => Date;
    addWeeks: (date: Date, amount: number) => Date;
    addMonths: (date: Date, amount: number) => Date;
    addYears: (date: Date, amount: number) => Date;
    startOfMonth: (date: Date) => Date;
    endOfMonth: (date: Date) => Date;
    setDate: (date: Date, dayOfMonth: number) => Date;
    isAfter: (date: Date, dateToCompare: Date) => boolean;
    getDay: (date: Date) => number;
    format: (date: Date, formatStr: string) => string;
    parseISO: (argument: string) => Date;
    nextDay: (date: Date, day: 0 | 1 | 2 | 3 | 4 | 5 | 6) => Date;
    isSameDay: (dateLeft: Date, dateRight: Date) => boolean;
}

export function generateRecurringDatesLogic(
    deps: DateOps,
    startDateStr: string,
    config: RecurrenceConfig,
    limit: number = 52
): string[] {
    const dates: string[] = [];
    const startDate = deps.parseISO(startDateStr);
    let currentDate = startDate;
    // Set explicit end date: User endDate or 1 year from start
    const hardLimitDate = deps.addYears(startDate, 1);
    const userEndDate = config.endDate ? deps.parseISO(config.endDate) : hardLimitDate;
    const endDate = deps.isAfter(userEndDate, hardLimitDate) ? hardLimitDate : userEndDate;

    let count = 0;
    const MAX_COUNT = 366; // Safety

    const toISO = (d: Date) => deps.format(d, 'yyyy-MM-dd');

    while (count < limit && count < MAX_COUNT) {
        if (deps.isAfter(currentDate, endDate)) break;

        dates.push(toISO(currentDate));
        count++;

        let nextDate: Date;

        switch (config.frequency) {
            case 'daily':
                nextDate = deps.addDays(currentDate, config.interval);
                break;
            case 'weekly':
                // Simple weekly (interval weeks)
                nextDate = deps.addWeeks(currentDate, config.interval);
                break;
            case 'monthly':
                if (config.monthWeek !== undefined && config.monthWeekDay !== undefined) {
                    // Relative (e.g. 1st Monday)
                    // Move to next month(s)
                    const nextMonthBase = deps.addMonths(currentDate, config.interval);
                    const monthStart = deps.startOfMonth(nextMonthBase);

                    // Find first instance of that day in the month
                    // nextDay returns the next occurrence. If monthStart is the day, nextDay returns next week.
                    let firstDayOfTargetWeekday = monthStart;
                    if (deps.getDay(monthStart) !== config.monthWeekDay) {
                        firstDayOfTargetWeekday = deps.nextDay(monthStart, config.monthWeekDay as 0|1|2|3|4|5|6);
                    }

                    if (config.monthWeek === -1) {
                         // Last occurrence
                         const monthEnd = deps.endOfMonth(nextMonthBase);
                         // Find last occurrence
                         let candidate = firstDayOfTargetWeekday;
                         let valid = candidate;
                         // Check if candidate is even in the month (it should be)
                         // Iterate forward until we exit month
                         while (true) {
                             const next = deps.addWeeks(candidate, 1);
                             if (deps.isAfter(next, monthEnd)) break;
                             candidate = next;
                             valid = next;
                         }
                         nextDate = valid;
                    } else {
                        // Nth occurrence (1-based)
                        // 1st is firstDayOfTargetWeekday
                        nextDate = deps.addWeeks(firstDayOfTargetWeekday, (config.monthWeek - 1));
                    }
                } else if (config.monthDay) {
                    // Same date (e.g. 15th)
                    // Handle drift: Always snap to requested day
                    const tentative = deps.addMonths(currentDate, config.interval);
                    const daysInMonth = deps.endOfMonth(tentative).getDate();
                    const desiredDay = Math.min(config.monthDay, daysInMonth);
                    nextDate = deps.setDate(tentative, desiredDay);
                } else {
                    nextDate = deps.addMonths(currentDate, config.interval);
                }
                break;
            case 'yearly':
                nextDate = deps.addYears(currentDate, config.interval);
                break;
            default:
                nextDate = deps.addDays(currentDate, 1);
        }

        currentDate = nextDate;
    }

    return dates;
}
