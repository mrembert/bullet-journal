import React, { useState, useEffect } from 'react';
import { RecurrenceConfig, RecurrenceFrequency } from '../lib/recurrence';
import { getDay, getDate, startOfMonth } from 'date-fns';
import { ChevronDown, RefreshCw, X } from 'lucide-react';

interface RecurrencePickerProps {
    startDate: Date;
    initialConfig?: RecurrenceConfig | null;
    onChange: (config: RecurrenceConfig | null) => void;
    onClose: () => void;
}

const FREQUENCIES: { value: RecurrenceFrequency | 'none'; label: string }[] = [
    { value: 'none', label: 'None' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
];

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ORDINALS = [
    { value: 1, label: 'First' },
    { value: 2, label: 'Second' },
    { value: 3, label: 'Third' },
    { value: 4, label: 'Fourth' },
    { value: -1, label: 'Last' },
];

export function RecurrencePicker({ startDate, initialConfig, onChange, onClose }: RecurrencePickerProps) {
    const [frequency, setFrequency] = useState<RecurrenceFrequency | 'none'>(initialConfig?.frequency || 'weekly');
    const [interval, setInterval] = useState(initialConfig?.interval || 1);

    // Defaults derived from startDate
    const defaultWeekDay = getDay(startDate);
    const defaultMonthDay = getDate(startDate);

    // Determine default relative week (e.g. 1st Monday)
    // Simple heuristic: (day - 1) / 7 + 1? No.
    // E.g. 1st -> 1. 7th -> 1. 8th -> 2.
    const defaultMonthWeek = Math.floor((getDate(startDate) - 1) / 7) + 1;
    // If it's the last occurrence, difficult to detect easily without checking end of month.
    // For now default to Nth.

    const [monthlyType, setMonthlyType] = useState<'date' | 'relative'>('date');
    const [monthWeek, setMonthWeek] = useState(initialConfig?.monthWeek || defaultMonthWeek);
    const [monthWeekDay, setMonthWeekDay] = useState(initialConfig?.monthWeekDay ?? defaultWeekDay);
    const [monthDay, setMonthDay] = useState(initialConfig?.monthDay || defaultMonthDay);

    useEffect(() => {
        // Sync internal state if needed when startDate changes
        // But usually startDate is fixed for the picker session
    }, [startDate]);

    // Construct config on change
    useEffect(() => {
        if (frequency === 'none') {
            onChange(null);
            return;
        }

        const config: RecurrenceConfig = {
            frequency: frequency as RecurrenceFrequency,
            interval,
        };

        if (frequency === 'weekly') {
            // Implicitly implies "on the same day of week as start date"
        }

        if (frequency === 'monthly') {
            if (monthlyType === 'date') {
                config.monthDay = monthDay;
            } else {
                config.monthWeek = monthWeek;
                config.monthWeekDay = monthWeekDay;
            }
        }

        onChange(config);
    }, [frequency, interval, monthlyType, monthDay, monthWeek, monthWeekDay, onChange]);

    return (
        <div className="recurrence-picker picker-panel" style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            zIndex: 1000,
            backgroundColor: 'hsl(var(--color-bg-primary))',
            border: '1px solid hsl(var(--color-border))',
            borderRadius: '0.5rem',
            padding: '1rem',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            minWidth: '300px',
            marginTop: '0.5rem'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>Repeat</h3>
                <button type="button" onClick={onClose} className="btn btn-ghost" style={{ padding: '0.25rem' }}>
                    <X size={16} />
                </button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.85rem' }}>Every</label>
                <input
                    type="number"
                    min={1}
                    max={99}
                    value={interval}
                    onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                    className="input"
                    style={{ width: '60px', padding: '0.25rem' }}
                />
                <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as RecurrenceFrequency | 'none')}
                    className="input"
                    style={{ flex: 1 }}
                >
                    {FREQUENCIES.map(f => (
                        <option key={f.value} value={f.value}>{f.label}{f.value !== 'none' && interval > 1 ? 's' : ''}</option>
                    ))}
                </select>
            </div>

            {frequency === 'weekly' && (
                 <div style={{ fontSize: '0.85rem', color: 'hsl(var(--color-text-secondary))' }}>
                     On {WEEKDAYS[getDay(startDate)]}s
                 </div>
            )}

            {frequency === 'monthly' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                        <input
                            type="radio"
                            checked={monthlyType === 'date'}
                            onChange={() => setMonthlyType('date')}
                        />
                        On day {monthDay}
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                        <input
                            type="radio"
                            checked={monthlyType === 'relative'}
                            onChange={() => setMonthlyType('relative')}
                        />
                        On the
                        <select
                            value={monthWeek}
                            onChange={(e) => setMonthWeek(parseInt(e.target.value))}
                            disabled={monthlyType !== 'relative'}
                            className="input"
                            style={{ padding: '0.1rem', fontSize: '0.8rem' }}
                        >
                            {ORDINALS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <select
                            value={monthWeekDay}
                            onChange={(e) => setMonthWeekDay(parseInt(e.target.value))}
                            disabled={monthlyType !== 'relative'}
                            className="input"
                            style={{ padding: '0.1rem', fontSize: '0.8rem' }}
                        >
                            {WEEKDAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                        </select>
                    </label>
                </div>
            )}

            <div style={{ marginTop: '1rem', paddingTop: '0.5rem', borderTop: '1px solid hsl(var(--color-border))', fontSize: '0.8rem', color: 'hsl(var(--color-text-secondary))' }}>
                Ends after 1 year
            </div>
        </div>
    );
}
