import { forwardRef, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Trash, FileText, FolderInput, Calendar, MoreVertical, Repeat, XCircle } from 'lucide-react';
import type { Bullet } from '../types';
import { useStore } from '../store';
import { BulletIcon } from './BulletIcon';
import { DatePicker } from './DatePicker';
import { ProjectPicker } from './ProjectPicker';
import { RecurrencePicker } from './RecurrencePicker';
import { generateRecurringDates, type RecurrenceConfig } from '../lib/recurrence';
import { generateUUID } from '../lib/utils';
import { useNoteEditor } from '../contexts/NoteEditorContext';
import { useConfirmation } from '../contexts/ConfirmationContext';
import { useKeyboardFocus } from '../contexts/KeyboardFocusContext';
import { format, parseISO } from 'date-fns';
import { useToast } from '../contexts/ToastContext';

interface BulletItemProps {
    bullet: Bullet;
    isFocused?: boolean;
    onMenuOpenChange?: (open: boolean) => void;
    depth?: number;
}

export const BulletItem = forwardRef<HTMLDivElement, BulletItemProps>(({ bullet, isFocused, onMenuOpenChange, depth = 0 }, ref) => {
    const { state, dispatch } = useStore();
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showProjectPicker, setShowProjectPicker] = useState(false);
    const [showRecurrencePicker, setShowRecurrencePicker] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [showRecurringDeleteConfirm, setShowRecurringDeleteConfirm] = useState(false);

    // Notify parent of menu state changes for stacking context management
    useEffect(() => {
        onMenuOpenChange?.(menuOpen);
    }, [menuOpen, onMenuOpenChange]);
    const { openNote } = useNoteEditor();
    const { requestConfirmation } = useConfirmation();
    const { editingId, setEditingId } = useKeyboardFocus();
    const { showToast } = useToast();

    const collection = bullet.collectionId ? state.collections[bullet.collectionId] : null;
    const showCollectionTag = collection && state.view.collectionId !== bullet.collectionId;

    const isEditing = editingId === bullet.id;
    const [editContent, setEditContent] = useState(bullet.content);

    // Sync local edit content if bullet content changes while not editing
    if (!isEditing && editContent !== bullet.content) {
        setEditContent(bullet.content);
    }

    const handleEdit = () => {
        setEditContent(bullet.content);
        setEditingId(bullet.id);
        setMenuOpen(false);
    };

    const handleSave = () => {
        if (editContent.trim() !== bullet.content) {
            dispatch({ type: 'UPDATE_BULLET', payload: { id: bullet.id, content: editContent.trim() } });
        }
        setEditingId(null);
    };

    const handleCancel = () => {
        setEditContent(bullet.content);
        setEditingId(null);
    };

    const toggleState = () => {
        if (bullet.state === 'open') {
            dispatch({ type: 'UPDATE_BULLET', payload: { id: bullet.id, state: 'completed' } });
        } else if (bullet.state === 'completed' || bullet.state === 'migrated') {
            dispatch({ type: 'UPDATE_BULLET', payload: { id: bullet.id, state: 'open' } });
        }
    };

    const handleDateSelect = (date: string | null) => {
        dispatch({ type: 'UPDATE_BULLET', payload: { id: bullet.id, date: date } });
        setShowDatePicker(false);
    };

    const handleStopRecurring = () => {
        requestConfirmation({
            title: 'Stop Repeating',
            message: 'Stop repeating this event? This will remove the recurrence rule from this event and delete all future instances.',
            isDanger: true,
            confirmLabel: 'Stop Repeating',
            onConfirm: () => {
                const futureBullets = Object.values(state.bullets).filter(b =>
                    b.recurringId === bullet.recurringId &&
                    b.date && bullet.date && b.date > bullet.date
                );
                const ids = futureBullets.map(b => b.id);

                if (ids.length > 0) {
                    dispatch({ type: 'DELETE_BULLETS', payload: { ids } });
                }

                dispatch({
                    type: 'UPDATE_BULLET',
                    payload: {
                        id: bullet.id,
                        recurringId: null,
                        recurrenceRule: null
                    }
                });

                showToast(`Recurrence stopped. ${ids.length} future events deleted.`);
                setMenuOpen(false);
            }
        });
        setMenuOpen(false);
    };

    const handleRecurrenceSet = (config: RecurrenceConfig | null) => {
        if (!config) {
            setShowRecurrencePicker(false);
            return;
        }

        // Logic to convert current bullet to recurring series
        const startDate = bullet.date || format(new Date(), 'yyyy-MM-dd');
        const dates = generateRecurringDates(startDate, config);
        const recurringId = generateUUID();
        const now = Date.now();
        const recurrenceRuleStr = JSON.stringify(config);

        // 1. Update current bullet to be the "first"
        // 2. Generate subsequent bullets

        // We'll treat the current bullet as the first instance.
        // If the generated dates includes the start date, we skip creating a new one for it and just update the existing one.
        // generateRecurringDates typically includes start date if valid.

        const bulletsToAdd: Bullet[] = [];
        let isFirst = true;

        dates.forEach((dateStr, index) => {
            if (isFirst && dateStr === startDate) {
                // Update existing
                dispatch({
                    type: 'UPDATE_BULLET',
                    payload: {
                        id: bullet.id,
                        recurringId,
                        recurrenceRule: recurrenceRuleStr,
                        date: dateStr // Ensure date is set/normalized
                    }
                });
                isFirst = false;
            } else {
                // Create new
                bulletsToAdd.push({
                    id: generateUUID(),
                    content: bullet.content,
                    type: bullet.type,
                    state: 'open',
                    date: dateStr,
                    collectionId: bullet.collectionId,
                    recurringId,
                    recurrenceRule: recurrenceRuleStr,
                    longFormContent: bullet.longFormContent,
                    parentNoteId: bullet.parentNoteId,
                    createdAt: now,
                    updatedAt: now,
                    order: now + index,
                    completedAt: undefined
                });
            }
        });

        if (bulletsToAdd.length > 0) {
            dispatch({ type: 'ADD_BULLETS', payload: { bullets: bulletsToAdd } });
            showToast(`Created ${bulletsToAdd.length} recurring events.`);
        } else if (!isFirst) {
             showToast(`Updated to recurring event.`);
        }

        setShowRecurrencePicker(false);
        setMenuOpen(false);
    };

    const handleDeleteClick = () => {
        if (bullet.recurringId) {
            setShowRecurringDeleteConfirm(true);
            setMenuOpen(false);
        } else {
            requestConfirmation({
                title: 'Delete Item',
                message: 'Delete this item?',
                isDanger: true,
                confirmLabel: 'Delete',
                onConfirm: () => dispatch({ type: 'DELETE_BULLET', payload: { id: bullet.id } })
            });
            setMenuOpen(false);
        }
    };

    const handleDeleteRecurring = (scope: 'this' | 'future') => {
        if (scope === 'this') {
            dispatch({ type: 'DELETE_BULLET', payload: { id: bullet.id } });
        } else {
            // Future includes THIS one
            const futureBullets = Object.values(state.bullets).filter(b =>
                b.recurringId === bullet.recurringId &&
                b.date && bullet.date && b.date >= bullet.date
            );
            const ids = futureBullets.map(b => b.id);
            dispatch({ type: 'DELETE_BULLETS', payload: { ids } });
            showToast(`Deleted ${ids.length} events.`);
        }
        setShowRecurringDeleteConfirm(false);
    };

    const isCompleted = bullet.state === 'completed';
    const isMigrated = bullet.state === 'migrated';
    const hasNote = !!bullet.longFormContent;
    const isRecurring = !!bullet.recurringId;

    const itemRef = useRef<HTMLDivElement>(null);

    // Scroll into view if focused via keyboard
    useEffect(() => {
        if (isFocused && itemRef.current) {
            itemRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [isFocused]);

    return (
        <div ref={(node) => {
            // Combine refs
            if (itemRef) itemRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
        }}>
            <div
                className={`task-item ${isCompleted ? 'completed' : ''} ${isFocused ? 'keyboard-focused' : ''}`}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.5rem 0.75rem', // Added some horizontal padding for focus ring
                    marginLeft: depth > 0 ? `${depth * 1.5 - 0.75}rem` : '-0.75rem',
                    marginRight: '-0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    opacity: isMigrated ? 0.5 : 1,
                    textDecoration: isCompleted ? 'line-through' : 'none',
                    color: isCompleted || isMigrated ? 'hsl(var(--color-text-secondary))' : 'inherit',
                    position: 'relative',
                    zIndex: menuOpen ? 100 : (isFocused ? 1 : 'auto'),
                    transition: 'background-color 0.15s ease, border-color 0.15s ease',
                    borderLeft: isFocused ? '3px solid hsl(var(--color-accent))' : '3px solid transparent',
                    backgroundColor: isFocused ? 'hsl(var(--color-accent) / 0.05)' : 'transparent',
                }}
            >
                <button
                    onClick={toggleState}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: bullet.type === 'task' ? 'hsl(var(--color-accent))' : 'inherit',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        padding: 0
                    }}
                >
                    <BulletIcon type={bullet.type} state={bullet.state} />
                </button>

                <span
                    style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    onClick={!isEditing ? handleEdit : undefined}
                >
                    {isEditing ? (
                        <input
                            autoFocus
                            className="input"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            onBlur={handleSave}
                            onKeyDown={(e) => {
                                e.stopPropagation(); // Prevent keyboard shortcuts
                                if (e.key === 'Enter') handleSave();
                                if (e.key === 'Escape') handleCancel();
                            }}
                            style={{
                                padding: '2px 4px',
                                fontSize: 'inherit',
                                fontFamily: 'inherit',
                                background: 'hsl(var(--color-bg-primary))',
                                border: '1px solid hsl(var(--color-accent))',
                                borderRadius: '4px',
                                width: '100%',
                                marginLeft: '-4px'
                            }}
                        />
                    ) : (
                        bullet.content
                    )}
                    {isRecurring && (
                        <span title="Recurring Event" style={{ display: 'inline-flex' }}>
                            <Repeat size={12} className="text-secondary" style={{ opacity: 0.5 }} />
                        </span>
                    )}
                    {showCollectionTag && (
                        <span style={{
                            fontSize: '0.7rem',
                            padding: '0.1rem 0.3rem',
                            borderRadius: '4px',
                            backgroundColor: 'hsl(var(--color-bg-secondary))',
                            color: 'hsl(var(--color-text-secondary))',
                            border: '1px solid hsl(var(--color-text-secondary) / 0.2)',
                            whiteSpace: 'nowrap'
                        }}>
                            {collection?.title}
                        </span>
                    )}
                    {bullet.date && state.view.mode !== 'daily' && ( // Show date tag if not in daily view (or always show?)
                        <span style={{
                            fontSize: '0.7rem',
                            padding: '0.1rem 0.3rem',
                            borderRadius: '4px',
                            backgroundColor: 'hsl(var(--color-bg-secondary))',
                            color: 'hsl(var(--color-text-secondary))',
                            border: '1px solid hsl(var(--color-text-secondary) / 0.2)',
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.2rem'
                        }}>
                            <Calendar size={10} />
                            {format(parseISO(bullet.date!), 'MMM d')}
                        </span>
                    )}
                    {bullet.parentNoteId && (
                        <button
                            onClick={() => openNote(bullet.parentNoteId || bullet.id)}
                            className="btn btn-ghost"
                            style={{
                                padding: '0.1rem',
                                height: 'auto',
                                color: 'hsl(var(--color-accent))',
                                opacity: 0.8,
                                fontSize: '0.7rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2px'
                            }}
                            title="View Parent Note"
                        >
                            <FileText size={12} />
                            <span>From Note</span>
                        </button>
                    )}
                    {hasNote && (
                        <button
                            onClick={() => openNote(bullet.id)}
                            className="btn btn-ghost"
                            style={{
                                padding: '0.1rem',
                                height: 'auto',
                                color: 'hsl(var(--color-accent))',
                                opacity: 0.8
                            }}
                            title="View/Edit Note"
                        >
                            <FileText size={14} />
                        </button>
                    )}
                </span>

                {/* Three-dot kebab menu */}
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen(!menuOpen);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="btn btn-ghost bullet-menu-btn"
                        style={{ padding: '0.25rem', height: 'auto', color: 'hsl(var(--color-text-secondary))', opacity: 0.5, zIndex: 2 }}
                        title="Actions"
                    >
                        <MoreVertical size={16} />
                    </button>

                    {menuOpen && (
                        <>
                            <div
                                className="bullet-menu-overlay"
                                style={{ position: 'fixed', inset: 0, zIndex: 9 }}
                                onClick={() => {
                                    setMenuOpen(false);
                                    setShowDatePicker(false);
                                    setShowProjectPicker(false);
                                    setShowRecurrencePicker(false);
                                }}
                            />
                            <div className="bullet-menu" style={{
                                position: 'absolute',
                                zIndex: 10,
                                right: 0,
                                top: '100%',
                                background: 'hsl(var(--color-bg-secondary))',
                                border: '1px solid hsl(var(--color-text-secondary) / 0.2)',
                                borderRadius: 'var(--radius-md)',
                                boxShadow: 'var(--shadow-md)',
                                padding: '0.25rem',
                                minWidth: '180px',
                                display: 'flex',
                                flexDirection: 'column',
                            }}>
                                {/* Date Picker */}
                                <button
                                    onClick={() => setShowDatePicker(!showDatePicker)}
                                    className="btn btn-ghost"
                                    style={{ justifyContent: 'flex-start', width: '100%', fontSize: '0.85rem' }}
                                >
                                    <Calendar size={14} /> Assign Date
                                </button>
                                {showDatePicker && (
                                    <DatePicker
                                        currentDate={(bullet.date || undefined) as string | undefined}
                                        onSelectDate={(date) => {
                                            handleDateSelect(date);
                                            setMenuOpen(false);
                                        }}
                                        onCancel={() => setShowDatePicker(false)}
                                    />
                                )}

                                {/* Add / View Note */}
                                <button
                                    onClick={() => { openNote(bullet.id); setMenuOpen(false); }}
                                    className="btn btn-ghost"
                                    style={{ justifyContent: 'flex-start', width: '100%', fontSize: '0.85rem' }}
                                >
                                    <FileText size={14} /> {hasNote ? 'View Note' : 'Add Note'}
                                </button>

                                {/* Project Picker */}
                                <button
                                    onClick={() => setShowProjectPicker(!showProjectPicker)}
                                    className="btn btn-ghost"
                                    style={{ justifyContent: 'flex-start', width: '100%', fontSize: '0.85rem' }}
                                >
                                    <FolderInput size={14} /> Move to Project
                                </button>
                                {showProjectPicker && (
                                    <ProjectPicker
                                        currentCollectionId={bullet.collectionId || undefined}
                                        onSelectProject={(collectionId) => {
                                            dispatch({ type: 'UPDATE_BULLET', payload: { id: bullet.id, collectionId: collectionId || undefined } });
                                            setShowProjectPicker(false);
                                            setMenuOpen(false);
                                        }}
                                        onCancel={() => setShowProjectPicker(false)}
                                    />
                                )}

                                {/* Recurring Actions */}
                                {isRecurring ? (
                                    <button
                                        onClick={handleStopRecurring}
                                        className="btn btn-ghost"
                                        style={{ justifyContent: 'flex-start', width: '100%', fontSize: '0.85rem' }}
                                    >
                                        <XCircle size={14} /> Stop Repeating
                                    </button>
                                ) : (
                                    <div style={{ position: 'relative' }}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowRecurrencePicker(!showRecurrencePicker);
                                            }}
                                            className="btn btn-ghost"
                                            style={{ justifyContent: 'flex-start', width: '100%', fontSize: '0.85rem' }}
                                        >
                                            <Repeat size={14} /> Make Recurring...
                                        </button>
                                        {showRecurrencePicker && (
                                            <RecurrencePicker
                                                startDate={parseISO(bullet.date || format(new Date(), 'yyyy-MM-dd'))}
                                                onChange={handleRecurrenceSet}
                                                onClose={() => setShowRecurrencePicker(false)}
                                            />
                                        )}
                                    </div>
                                )}

                                {/* Delete */}
                                <button
                                    onClick={handleDeleteClick}
                                    className="btn btn-ghost"
                                    style={{ justifyContent: 'flex-start', width: '100%', fontSize: '0.85rem', color: 'hsl(var(--color-danger))', borderTop: '1px solid hsl(var(--color-text-secondary) / 0.1)', marginTop: '0.25rem' }}
                                >
                                    <Trash size={14} /> Delete
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Recurring Delete Confirmation Modal */}
            {showRecurringDeleteConfirm && createPortal(
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000
                }}>
                    <div style={{
                        backgroundColor: 'hsl(var(--color-bg-secondary))',
                        padding: '1.5rem',
                        borderRadius: 'var(--radius-lg)',
                        maxWidth: '400px',
                        width: '90%',
                        boxShadow: 'var(--shadow-lg)',
                        border: '1px solid hsl(var(--color-text-secondary) / 0.1)'
                    }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Delete Recurring Event</h3>
                        <p style={{ color: 'hsl(var(--color-text-secondary))', marginBottom: '1.5rem' }}>
                            This is a recurring event. Do you want to delete only this instance, or this and all future instances?
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <button
                                onClick={() => handleDeleteRecurring('this')}
                                className="btn btn-ghost"
                                style={{ justifyContent: 'center', border: '1px solid hsl(var(--color-border))' }}
                            >
                                Delete Only This Instance
                            </button>
                            <button
                                onClick={() => handleDeleteRecurring('future')}
                                className="btn btn-danger"
                                style={{ justifyContent: 'center', backgroundColor: 'hsl(var(--color-danger))', color: 'white' }}
                            >
                                Delete This and Future Instances
                            </button>
                            <button
                                onClick={() => setShowRecurringDeleteConfirm(false)}
                                className="btn btn-ghost"
                                style={{ justifyContent: 'center', marginTop: '0.5rem' }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
});
