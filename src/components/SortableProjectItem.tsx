import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { List, Archive, ArchiveRestore, Trash2, MoreVertical, Edit2 } from 'lucide-react';
import type { Collection } from '../types';
import { useState, useRef } from 'react';
import { useStore } from '../store';

interface SortableProjectItemProps {
    collection: Collection;
    isActive: boolean;
    onSelect: () => void;
    onToggleArchive: (e: React.MouseEvent) => void;
    onDelete: (e: React.MouseEvent) => void;
}

export function SortableProjectItem({ collection, isActive, onSelect, onToggleArchive, onDelete }: SortableProjectItemProps) {
    const { dispatch } = useStore();
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(collection.title);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: collection.id, disabled: isEditing });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        touchAction: 'none'
    };

    const handleSave = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (editTitle.trim() && editTitle.trim() !== collection.title) {
            dispatch({ type: 'UPDATE_COLLECTION', payload: { id: collection.id, title: editTitle.trim() } });
        }
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditTitle(collection.title);
        setIsEditing(false);
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={`project-item ${isActive ? 'active' : ''}`}>
            <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '0.25rem' }}>
                {isEditing ? (
                    <form onSubmit={handleSave} style={{ flex: 1, display: 'flex', gap: '0.25rem', padding: '0.25rem' }}>
                        <input
                            autoFocus
                            className="input"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={handleSave}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') handleCancel();
                            }}
                            style={{
                                flex: 1,
                                padding: '2px 6px',
                                fontSize: '0.85rem',
                                background: 'hsl(var(--color-bg-primary))',
                                border: '1px solid hsl(var(--color-accent))',
                                borderRadius: '4px'
                            }}
                        />
                    </form>
                ) : (
                    <button
                        onClick={onSelect}
                        className={`btn ${isActive ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ justifyContent: 'flex-start', flex: 1, fontSize: '0.9rem', cursor: isEditing ? 'default' : 'grab', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                        <List size={16} style={{ flexShrink: 0 }} /> {collection.title}
                    </button>
                )}

                <div style={{ position: 'relative' }} ref={menuRef}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen(!menuOpen);
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="btn btn-ghost"
                        style={{ padding: '0.25rem', color: 'hsl(var(--color-text-secondary))', opacity: 0.6 }}
                    >
                        <MoreVertical size={14} />
                    </button>

                    {menuOpen && (
                        <>
                            <div
                                style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}
                            />
                            <div style={{
                                position: 'absolute',
                                right: 0,
                                top: '100%',
                                zIndex: 100,
                                background: 'hsl(var(--color-bg-secondary))',
                                border: '1px solid hsl(var(--color-text-secondary) / 0.2)',
                                borderRadius: 'var(--radius-md)',
                                boxShadow: 'var(--shadow-md)',
                                padding: '0.25rem',
                                minWidth: '140px',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsEditing(true);
                                        setMenuOpen(false);
                                    }}
                                    className="btn btn-ghost"
                                    style={{ justifyContent: 'flex-start', fontSize: '0.8rem', width: '100%', padding: '0.4rem 0.6rem' }}
                                >
                                    <Edit2 size={12} /> Rename
                                </button>
                                <button
                                    onClick={(e) => {
                                        onToggleArchive(e);
                                        setMenuOpen(false);
                                    }}
                                    className="btn btn-ghost"
                                    style={{ justifyContent: 'flex-start', fontSize: '0.8rem', width: '100%', padding: '0.4rem 0.6rem' }}
                                >
                                    {collection.archived ? <ArchiveRestore size={12} /> : <Archive size={12} />}
                                    {collection.archived ? ' Unarchive' : ' Archive'}
                                </button>
                                {!collection.archived && (
                                    <button
                                        onClick={(e) => {
                                            onDelete(e);
                                            setMenuOpen(false);
                                        }}
                                        className="btn btn-ghost"
                                        style={{ justifyContent: 'flex-start', fontSize: '0.8rem', width: '100%', padding: '0.4rem 0.6rem', color: 'hsl(var(--color-danger))' }}
                                    >
                                        <Trash2 size={12} /> Delete
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
