import { forwardRef, useEffect, useRef, useState } from 'react';
import { Trash, FileText, FolderInput, Calendar, MoreVertical, Edit2 } from 'lucide-react';
import type { Bullet } from '../types';
import { useStore } from '../store';
import { BulletIcon } from './BulletIcon';
import { DatePicker } from './DatePicker';
import { ProjectPicker } from './ProjectPicker';
import { useNoteEditor } from '../contexts/NoteEditorContext';
import { useConfirmation } from '../contexts/ConfirmationContext';
import { useKeyboardFocus } from '../contexts/KeyboardFocusContext';
import { format, parseISO } from 'date-fns';

interface BulletItemProps {
    bullet: Bullet;
    isFocused?: boolean;
    onMenuOpenChange?: (open: boolean) => void;
}

export const BulletItem = forwardRef<HTMLDivElement, BulletItemProps>(({ bullet, isFocused, onMenuOpenChange }, ref) => {
    const { state, dispatch } = useStore();
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showProjectPicker, setShowProjectPicker] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    // Notify parent of menu state changes for stacking context management
    useEffect(() => {
        onMenuOpenChange?.(menuOpen);
    }, [menuOpen, onMenuOpenChange]);
    const { openNote } = useNoteEditor();
    const { requestConfirmation } = useConfirmation();
    const { editingId, setEditingId } = useKeyboardFocus();

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

    const isCompleted = bullet.state === 'completed';
    const isMigrated = bullet.state === 'migrated';
    const hasNote = !!bullet.longFormContent;

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
                    margin: '0 -0.75rem', // Offset padding to keep alignment
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
                                onClick={() => { setMenuOpen(false); setShowDatePicker(false); setShowProjectPicker(false); }}
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
                                {/* Add / View Note */}
                                <button
                                    onClick={() => { openNote(bullet.id); setMenuOpen(false); }}
                                    className="btn btn-ghost"
                                    style={{ justifyContent: 'flex-start', width: '100%', fontSize: '0.85rem' }}
                                >
                                    <FileText size={14} /> {hasNote ? 'View Note' : 'Add Note'}
                                </button>

                                {/* Edit Text */}
                                <button
                                    onClick={handleEdit}
                                    className="btn btn-ghost"
                                    style={{ justifyContent: 'flex-start', width: '100%', fontSize: '0.85rem' }}
                                >
                                    <Edit2 size={14} /> Edit Text
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

                                {/* Delete */}
                                <button
                                    onClick={() => {
                                        requestConfirmation({
                                            title: 'Delete Item',
                                            message: 'Delete this item?',
                                            isDanger: true,
                                            confirmLabel: 'Delete',
                                            onConfirm: () => dispatch({ type: 'DELETE_BULLET', payload: { id: bullet.id } })
                                        });
                                        setMenuOpen(false);
                                    }}
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
        </div>
    );
});
