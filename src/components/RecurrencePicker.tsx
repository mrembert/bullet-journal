// Recurring Events Feature
import { useState, useEffect } from 'react';
import type { RecurrenceConfig, RecurrenceFrequency } from '../lib/recurrence';
import { getDay, getDate } from 'date-fns';
import { X } from 'lucide-react';

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
    const [monthDay] = useState(initialConfig?.monthDay || defaultMonthDay);

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

    // Refactored to act as a modal content instead of inline absolute positioning
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
        }} onClick={onClose}>
            <div className="recurrence-picker picker-panel" style={{
                backgroundColor: 'hsl(var(--color-bg-primary))',
                border: '1px solid hsl(var(--color-border))',
                borderRadius: '0.5rem',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-lg)',
                minWidth: '320px',
                maxWidth: '90%',
            }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Make Recurring</h3>
                    <button type="button" onClick={onClose} className="btn btn-ghost" style={{ padding: '0.25rem' }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>Repeat every</label>
                    <input
                        type="number"
                        min={1}
                        max={99}
                        value={interval}
                        onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                        className="input"
                        style={{ width: '60px', padding: '0.25rem 0.5rem', textAlign: 'center' }}
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
                    <div style={{ fontSize: '0.9rem', color: 'hsl(var(--color-text-secondary))', marginBottom: '1rem', padding: '0.5rem', backgroundColor: 'hsl(var(--color-bg-secondary))', borderRadius: '4px' }}>
                        Occurs every {interval === 1 ? '' : `${interval} weeks on `}{WEEKDAYS[getDay(startDate)]}s
                    </div>
                )}

                {frequency === 'monthly' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                            <input
                                type="radio"
                                checked={monthlyType === 'date'}
                                onChange={() => setMonthlyType('date')}
                            />
                            Monthly on day {monthDay}
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                            <input
                                type="radio"
                                checked={monthlyType === 'relative'}
                                onChange={() => setMonthlyType('relative')}
                            />
                            Monthly on the
                            <select
                                value={monthWeek}
                                onChange={(e) => setMonthWeek(parseInt(e.target.value))}
                                disabled={monthlyType !== 'relative'}
                                className="input"
                                style={{ padding: '0.1rem', fontSize: '0.85rem' }}
                            >
                                {ORDINALS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                            <select
                                value={monthWeekDay}
                                onChange={(e) => setMonthWeekDay(parseInt(e.target.value))}
                                disabled={monthlyType !== 'relative'}
                                className="input"
                                style={{ padding: '0.1rem', fontSize: '0.85rem' }}
                            >
                                {WEEKDAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                            </select>
                        </label>
                    </div>
                )}

                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid hsl(var(--color-border))', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button onClick={onClose} className="btn btn-ghost">Cancel</button>
                    <button
                        onClick={() => {
                            // Trigger the change with the current config to confirm
                            const config: RecurrenceConfig = {
                                frequency: frequency as RecurrenceFrequency,
                                interval,
                            };
                            if (frequency === 'monthly') {
                                if (monthlyType === 'date') {
                                    config.monthDay = monthDay;
                                } else {
                                    config.monthWeek = monthWeek;
                                    config.monthWeekDay = monthWeekDay;
                                }
                            }
                            onChange(config);
                        }}
                        className="btn btn-primary"
                        disabled={frequency === 'none'}
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}
