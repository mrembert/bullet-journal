import React, { useState } from 'react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameDay,
    isToday,
    isSameMonth,
    parseISO
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarProps {
    onSelectDate: (date: string) => void;
    initialDate?: string;
}

export function Calendar({ onSelectDate, initialDate }: CalendarProps) {
    // Safely parse initialDate
    const getInitialViewDate = () => {
        if (initialDate) {
            try {
                return parseISO(initialDate);
            } catch {
                return new Date();
            }
        }
        return new Date();
    };

    const [viewDate, setViewDate] = useState(getInitialViewDate());

    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    const handlePrevMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        setViewDate(subMonths(viewDate, 1));
    };

    const handleNextMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        setViewDate(addMonths(viewDate, 1));
    };

    return (
        <div className="calendar-container" style={{ padding: '0.25rem' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem',
                padding: '0 0.5rem'
            }}>
                <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={handlePrevMonth}
                    style={{ padding: '0.25rem', height: 'auto', minWidth: 'auto' }}
                    title="Previous Month"
                >
                    <ChevronLeft size={16} />
                </button>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    {format(viewDate, 'MMMM yyyy')}
                </span>
                <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={handleNextMonth}
                    style={{ padding: '0.25rem', height: 'auto', minWidth: 'auto' }}
                    title="Next Month"
                >
                    <ChevronRight size={16} />
                </button>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '1px',
                marginBottom: '0.25rem',
                textAlign: 'center'
            }}>
                {weekDays.map(day => (
                    <div key={day} style={{
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        color: 'hsl(var(--color-text-secondary))',
                        padding: '0.25rem 0'
                    }}>
                        {day}
                    </div>
                ))}
                {calendarDays.map((day) => {
                    const isCurrentMonth = isSameMonth(day, monthStart);
                    const isPicked = initialDate && isSameDay(day, parseISO(initialDate));
                    const isTodaysDate = isToday(day);
                    const dateStr = format(day, 'yyyy-MM-dd');

                    return (
                        <button
                            key={day.toString()}
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelectDate(dateStr);
                            }}
                            className={`btn ${isPicked ? 'btn-primary' : 'btn-ghost'}`}
                            style={{
                                padding: '0',
                                height: '28px',
                                width: '100%',
                                minWidth: '0',
                                fontSize: '0.75rem',
                                borderRadius: '4px',
                                background: isPicked ? 'hsl(var(--color-accent))' : 'transparent',
                                color: isPicked ? 'white' : (!isCurrentMonth ? 'hsl(var(--color-text-secondary) / 0.3)' : 'inherit'),
                                border: isTodaysDate && !isPicked ? '1px solid hsl(var(--color-accent) / 0.4)' : 'none',
                                fontWeight: isTodaysDate ? 'bold' : 'normal',
                                justifyContent: 'center'
                            }}
                        >
                            {format(day, 'd')}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
