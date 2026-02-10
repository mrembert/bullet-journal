import { useState } from 'react';
import { Circle, X, Minus, ChevronRight, Trash, FileText, FolderInput, Calendar } from 'lucide-react';
import type { Bullet } from '../types';
import { useStore } from '../store';
import { DatePicker } from './DatePicker';
import { ProjectPicker } from './ProjectPicker';
import { useNoteEditor } from '../contexts/NoteEditorContext';
import { useConfirmation } from '../contexts/ConfirmationContext';
import { format, parseISO } from 'date-fns';

interface BulletItemProps {
    bullet: Bullet;
}

export function BulletItem({ bullet }: BulletItemProps) {
    const { state, dispatch } = useStore();
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showProjectPicker, setShowProjectPicker] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const { openNote } = useNoteEditor();
    const { requestConfirmation } = useConfirmation();

    const collection = bullet.collectionId ? state.collections[bullet.collectionId] : null;
    const showCollectionTag = collection && state.view.collectionId !== bullet.collectionId;

    const toggleState = () => {
        if (bullet.state === 'open') {
            dispatch({ type: 'UPDATE_BULLET', payload: { id: bullet.id, state: 'completed' } });
        } else if (bullet.state === 'completed') {
            dispatch({ type: 'UPDATE_BULLET', payload: { id: bullet.id, state: 'open' } });
        }
    };

    const handleDateSelect = (date: string | null) => {
        dispatch({ type: 'UPDATE_BULLET', payload: { id: bullet.id, date: date } });
        setShowDatePicker(false);
    };

    const getIcon = () => {
        switch (bullet.type) {
            case 'task':
                if (bullet.state === 'completed') return <X size={18} />;
                if (bullet.state === 'migrated') return <ChevronRight size={18} />;
                return <span style={{ fontSize: '24px', lineHeight: '18px' }}>•</span>;
            case 'event':
                return <Circle size={16} fill={bullet.state === 'completed' ? 'currentColor' : 'none'} />;
            case 'note':
                return <Minus size={18} />;
            default:
                return <span style={{ fontSize: '24px', lineHeight: '18px' }}>•</span>;
        }
    };

    const isCompleted = bullet.state === 'completed';
    const isMigrated = bullet.state === 'migrated';
    const hasNote = !!bullet.longFormContent;

    return (
        <>
            <div
                className={`task-item ${isCompleted ? 'completed' : ''}`}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.5rem 0',
                    opacity: isMigrated ? 0.5 : 1,
                    textDecoration: isCompleted ? 'line-through' : 'none',
                    color: isCompleted || isMigrated ? 'hsl(var(--color-text-secondary))' : 'inherit',
                    position: 'relative'
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => { setIsHovered(false); if (!showDatePicker) setShowDatePicker(false); }}
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
                    {getIcon()}
                </button>

                <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {bullet.content}
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

                {/* Actions that appear on hover */}
                {isHovered && !hasNote && (
                    <button
                        onClick={() => openNote(bullet.id)}
                        className="btn btn-ghost"
                        style={{
                            padding: '0.25rem',
                            height: 'auto',
                            color: 'hsl(var(--color-text-secondary))',
                            opacity: 0.5
                        }}
                        title="Add Note"
                    >
                        <FileText size={14} />
                    </button>
                )}

                {/* Always available actions on hover */}
                {(isHovered || showProjectPicker || showDatePicker) && (
                    <div style={{ position: 'relative', display: 'flex', gap: '0.25rem' }}>

                        {/* Project Picker */}
                        <button
                            onClick={() => setShowProjectPicker(!showProjectPicker)}
                            className="btn btn-ghost"
                            style={{ padding: '0.25rem', height: 'auto', color: 'hsl(var(--color-text-secondary))' }}
                            title="Move to Project"
                        >
                            <FolderInput size={16} />
                        </button>
                        {showProjectPicker && (
                            <ProjectPicker
                                currentCollectionId={bullet.collectionId || undefined}
                                onSelectProject={(collectionId) => {
                                    dispatch({ type: 'UPDATE_BULLET', payload: { id: bullet.id, collectionId: collectionId || undefined } });
                                    setShowProjectPicker(false);
                                }}
                                onCancel={() => setShowProjectPicker(false)}
                            />
                        )}

                        {/* Date Picker */}
                        <button
                            onClick={() => setShowDatePicker(!showDatePicker)}
                            className="btn btn-ghost"
                            style={{ padding: '0.25rem', height: 'auto', color: 'hsl(var(--color-text-secondary))' }}
                            title="Assign Date"
                        >
                            <Calendar size={16} />
                        </button>
                        {showDatePicker && (
                            <DatePicker
                                currentDate={bullet.date || undefined}
                                onSelectDate={handleDateSelect}
                                onCancel={() => setShowDatePicker(false)}
                            />
                        )}

                        <button
                            onClick={() => {
                                requestConfirmation({
                                    title: 'Delete Item',
                                    message: 'Delete this item?',
                                    isDanger: true,
                                    confirmLabel: 'Delete',
                                    onConfirm: () => dispatch({ type: 'DELETE_BULLET', payload: { id: bullet.id } })
                                });
                            }}
                            className="btn btn-ghost"
                            style={{ padding: '0.25rem', height: 'auto', color: 'hsl(var(--color-danger))' }}
                            title="Delete"
                        >
                            <Trash size={16} />
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
