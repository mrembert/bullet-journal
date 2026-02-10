import React from 'react';
import { addDays, addMonths, startOfMonth, format } from 'date-fns';
import { ArrowRight, X } from 'lucide-react';

interface MigrationPickerProps {
    onSelectDate: (date: string) => void;
    onCancel: () => void;
}

export function MigrationPicker({ onSelectDate, onCancel }: MigrationPickerProps) {
    const today = new Date();
    const nextWeek = addDays(today, 7);
    const nextMonth = startOfMonth(addMonths(today, 1));
    const monthAfterNext = addMonths(nextMonth, 1);
    const [isCustom, setIsCustom] = React.useState(false);

    const options = [
        { label: 'Tomorrow', date: format(addDays(today, 1), 'yyyy-MM-dd') },
        { label: 'Next Week', date: format(nextWeek, 'yyyy-MM-dd') },
        { label: 'Next Month (' + format(nextMonth, 'MMM') + ')', date: format(nextMonth, 'yyyy-MM-dd') },
        { label: format(monthAfterNext, 'MMMM'), date: format(monthAfterNext, 'yyyy-MM-dd') },
        { label: format(addMonths(nextMonth, 2), 'MMMM'), date: format(addMonths(nextMonth, 2), 'yyyy-MM-dd') },
    ];

    if (isCustom) {
        return (
            <div style={{
                position: 'absolute',
                zIndex: 10,
                background: 'hsl(var(--color-bg-secondary))',
                border: '1px solid hsl(var(--color-text-secondary) / 0.2)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-md)',
                padding: '0.5rem',
                minWidth: '200px',
                right: 0,
                top: '100%'
            }}>
                <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>PICK DATE</span>
                    <button onClick={() => setIsCustom(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={14} /></button>
                </div>
                <input
                    type="date"
                    className="input"
                    style={{ background: 'hsl(var(--color-bg-primary))', borderRadius: 'var(--radius-sm)' }}
                    onChange={(e) => {
                        if (e.target.value) onSelectDate(e.target.value);
                    }}
                    autoFocus
                />
            </div>
        );
    }

    return (
        <>
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9,
            }} onClick={onCancel} />
            <div style={{
                position: 'absolute',
                zIndex: 10,
                background: 'hsl(var(--color-bg-secondary))',
                border: '1px solid hsl(var(--color-text-secondary) / 0.2)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-md)',
                padding: '0.5rem',
                minWidth: '220px',
                right: 0,
                top: '100%'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem',
                    padding: '0 0.5rem'
                }}>
                    <div style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'hsl(var(--color-text-secondary))',
                    }}>
                        MIGRATE TO...
                    </div>
                    <button onClick={onCancel} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}>
                        <X size={14} />
                    </button>
                </div>
                {options.map(opt => (
                    <button
                        key={opt.date}
                        onClick={() => onSelectDate(opt.date)}
                        className="btn btn-ghost"
                        style={{ width: '100%', justifyContent: 'flex-start', fontSize: '0.9rem' }}
                    >
                        <ArrowRight size={14} /> {opt.label}
                    </button>
                ))}
                <button
                    onClick={() => setIsCustom(true)}
                    className="btn btn-ghost"
                    style={{ width: '100%', justifyContent: 'flex-start', fontSize: '0.9rem', borderTop: '1px solid hsl(var(--color-text-secondary) / 0.1)', marginTop: '0.25rem' }}
                >
                    <ArrowRight size={14} /> Custom Date...
                </button>
            </div>
        </>
    );
}
