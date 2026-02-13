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
    const [selectedIndex, setSelectedIndex] = React.useState(0);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Initial focus to capture keyboard events
    React.useEffect(() => {
        if (!isCustom) {
            containerRef.current?.focus();
        }
    }, [isCustom]);

    const options = [
        { label: 'Tomorrow', date: format(addDays(today, 1), 'yyyy-MM-dd') },
        { label: 'Next Week', date: format(nextWeek, 'yyyy-MM-dd') },
        { label: 'Next Month (' + format(nextMonth, 'MMM') + ')', date: format(nextMonth, 'yyyy-MM-dd') },
        { label: format(monthAfterNext, 'MMMM'), date: format(monthAfterNext, 'yyyy-MM-dd') },
        { label: format(addMonths(nextMonth, 2), 'MMMM'), date: format(addMonths(nextMonth, 2), 'yyyy-MM-dd') },
        { label: 'Custom Date...', isCustom: true }
    ];

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                if (isCustom) setIsCustom(false);
                else onCancel();
                return;
            }

            if (isCustom) return; // Let input handle its own keys

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(curr => (curr + 1) % options.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(curr => (curr - 1 + options.length) % options.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const selected = options[selectedIndex];
                if (selected.isCustom) {
                    setIsCustom(true);
                } else if (selected.date) {
                    onSelectDate(selected.date);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isCustom, onCancel, onSelectDate, selectedIndex, options.length]);

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
            <div
                ref={containerRef}
                tabIndex={0}
                style={{
                    position: 'absolute',
                    zIndex: 10,
                    outline: 'none', // Hide focus ring on the container
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
                {options.map((opt, index) => {
                    const isSelected = selectedIndex === index;
                    return (
                        <button
                            key={opt.isCustom ? 'custom' : opt.date}
                            onClick={() => opt.isCustom ? setIsCustom(true) : onSelectDate(opt.date!)}
                            className={`btn ${isSelected ? 'btn-primary' : 'btn-ghost'}`}
                            style={{
                                width: '100%',
                                justifyContent: 'flex-start',
                                fontSize: '0.9rem',
                                borderTop: opt.isCustom ? '1px solid hsl(var(--color-text-secondary) / 0.1)' : 'none',
                                marginTop: opt.isCustom ? '0.25rem' : '0',
                                backgroundColor: isSelected ? 'hsl(var(--color-accent))' : 'transparent',
                                color: isSelected ? 'white' : 'inherit'
                            }}
                        >
                            <ArrowRight size={14} /> {opt.label}
                        </button>
                    );
                })}
            </div>
        </>
    );
}
