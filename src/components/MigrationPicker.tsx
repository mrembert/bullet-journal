import React from 'react';
import { createPortal } from 'react-dom';
import { addDays, addMonths, startOfMonth, format } from 'date-fns';
import { ArrowRight, X, Calendar as CalendarIcon, Keyboard } from 'lucide-react';
import { usePopupNavigation } from '../hooks/usePopupNavigation';
import { Calendar } from './Calendar';

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
    const [isManual, setIsManual] = React.useState(false);

    const options = [
        { label: 'Tomorrow', date: format(addDays(today, 1), 'yyyy-MM-dd') },
        { label: 'Next Week', date: format(nextWeek, 'yyyy-MM-dd') },
        { label: 'Next Month (' + format(nextMonth, 'MMM') + ')', date: format(nextMonth, 'yyyy-MM-dd') },
        { label: format(monthAfterNext, 'MMMM'), date: format(monthAfterNext, 'yyyy-MM-dd') },
        { label: format(addMonths(nextMonth, 2), 'MMMM'), date: format(addMonths(nextMonth, 2), 'yyyy-MM-dd') },
        { label: 'Custom Date...', isCustom: true }
    ];

    // Focus management
    const { containerRef, handleKeyDown } = usePopupNavigation({
        selector: 'button.migrate-option',
        onClose: onCancel
    });

    const customDateRef = React.useRef<HTMLInputElement>(null);

    const panelContent = isCustom ? (
        <div className="picker-panel">
            <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--color-text-secondary))' }}>
                    {isManual ? 'MANUAL ENTRY' : 'SELECT DATE'}
                </span>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button
                        type="button"
                        onClick={() => setIsManual(!isManual)}
                        className="btn btn-ghost"
                        style={{ padding: '0.25rem', height: 'auto', minWidth: 'auto', color: 'hsl(var(--color-text-secondary))' }}
                        title={isManual ? "Switch to Calendar" : "Switch to Manual Entry"}
                    >
                        {isManual ? <CalendarIcon size={14} /> : <Keyboard size={14} />}
                    </button>
                    <button
                        type="button"
                        onClick={() => { setIsCustom(false); setIsManual(false); }}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'hsl(var(--color-text-primary))', padding: '0.25rem' }}
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

            {!isManual ? (
                <Calendar onSelectDate={onSelectDate} />
            ) : (
                <div style={{ padding: '0.25rem' }}>
                    <input
                        type="date"
                        className="input"
                        ref={customDateRef}
                        style={{
                            background: 'hsl(var(--color-bg-primary))',
                            borderRadius: 'var(--radius-sm)',
                            marginBottom: '0.5rem',
                            paddingLeft: '0.75rem',
                            border: '1px solid hsl(var(--color-text-secondary) / 0.2)'
                        }}
                        onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === 'Enter') {
                                const val = customDateRef.current?.value;
                                if (val) onSelectDate(val);
                            }
                            if (e.key === 'Escape') {
                                setIsManual(false);
                            }
                        }}
                        autoFocus
                    />
                    <button
                        type="button"
                        className="btn btn-primary"
                        style={{ width: '100%', fontSize: '0.85rem' }}
                        onClick={(e) => {
                            e.stopPropagation();
                            const val = customDateRef.current?.value;
                            if (val) onSelectDate(val);
                        }}
                    >
                        Apply Date
                    </button>
                </div>
            )}
        </div>
    ) : (
        <div
            className="picker-panel"
            ref={containerRef}
            onKeyDown={handleKeyDown}
        >
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
                <button type="button" onClick={onCancel} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: 'hsl(var(--color-text-primary))' }}>
                    <X size={14} />
                </button>
            </div>
            {options.map((opt) => (
                <button
                    type="button"
                    key={opt.isCustom ? 'custom' : opt.date}
                    onClick={() => opt.isCustom ? setIsCustom(true) : onSelectDate(opt.date!)}
                    className="btn btn-ghost migrate-option"
                    style={{
                        width: '100%',
                        justifyContent: 'flex-start',
                        fontSize: '0.9rem',
                        borderTop: opt.isCustom ? '1px solid hsl(var(--color-text-secondary) / 0.1)' : 'none',
                        marginTop: opt.isCustom ? '0.25rem' : '0',
                    }}
                >
                    <ArrowRight size={14} /> {opt.label}
                </button>
            ))}
        </div>
    );

    return createPortal(
        <div className="picker-overlay" onClick={onCancel}>
            <div onClick={e => e.stopPropagation()}>
                {panelContent}
            </div>
        </div>,
        document.body
    );
}
