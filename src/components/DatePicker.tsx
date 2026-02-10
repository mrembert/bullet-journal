import { useState } from 'react';
import { addDays, addMonths, startOfMonth, format } from 'date-fns';
import { ArrowRight, X, Calendar, Trash2 } from 'lucide-react';

interface DatePickerProps {
    currentDate?: string | null;
    onSelectDate: (date: string | null) => void;
    onCancel: () => void;
}

export function DatePicker({ currentDate, onSelectDate, onCancel }: DatePickerProps) {
    const today = new Date();
    const nextWeek = addDays(today, 7);
    const nextMonth = startOfMonth(addMonths(today, 1));
    const [isCustom, setIsCustom] = useState(false);

    const options = [
        { label: 'Today', date: format(today, 'yyyy-MM-dd') },
        { label: 'Tomorrow', date: format(addDays(today, 1), 'yyyy-MM-dd') },
        { label: 'Next Week', date: format(nextWeek, 'yyyy-MM-dd') },
        { label: 'Next Month', date: format(nextMonth, 'yyyy-MM-dd') },
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
                    defaultValue={currentDate || ''}
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
                        ASSIGN DATE...
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
                        <Calendar size={14} /> {opt.label}
                    </button>
                ))}

                <button
                    onClick={() => setIsCustom(true)}
                    className="btn btn-ghost"
                    style={{ width: '100%', justifyContent: 'flex-start', fontSize: '0.9rem' }}
                >
                    <ArrowRight size={14} /> Custom Date...
                </button>

                {currentDate && (
                    <button
                        onClick={() => onSelectDate(null)}
                        className="btn btn-ghost"
                        style={{
                            width: '100%',
                            justifyContent: 'flex-start',
                            fontSize: '0.9rem',
                            color: 'hsl(var(--color-danger))',
                            borderTop: '1px solid hsl(var(--color-text-secondary) / 0.1)',
                            marginTop: '0.25rem',
                            paddingTop: '0.5rem'
                        }}
                    >
                        <Trash2 size={14} /> Remove Date
                    </button>
                )}
            </div>
        </>
    );
}
