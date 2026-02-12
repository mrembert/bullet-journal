import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { List, Archive, ArchiveRestore, Trash2 } from 'lucide-react';
import type { Collection } from '../types';

interface SortableProjectItemProps {
    collection: Collection;
    isActive: boolean;
    onSelect: () => void;
    onToggleArchive: (e: React.MouseEvent) => void;
    onDelete: (e: React.MouseEvent) => void;
}

export function SortableProjectItem({ collection, isActive, onSelect, onToggleArchive, onDelete }: SortableProjectItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: collection.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        touchAction: 'none' // Prevent scrolling while dragging
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="project-item">
            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <button
                    onClick={onSelect}
                    className={`btn ${isActive ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ justifyContent: 'flex-start', flex: 1, fontSize: '0.9rem', cursor: 'grab', minWidth: 0, textAlign: 'left' }}
                    title={collection.title}
                >
                    <List size={16} style={{ flexShrink: 0 }} />
                    <span style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        flex: 1,
                        minWidth: 0
                    }}>
                        {collection.title}
                    </span>
                </button>
                <div className="project-actions" style={{ display: 'flex' }}>
                    <button
                        onClick={onToggleArchive}
                        className="btn btn-ghost"
                        style={{ padding: '0.25rem', color: 'hsl(var(--color-text-secondary))' }}
                        title={collection.archived ? "Unarchive" : "Archive"}
                        onPointerDown={e => e.stopPropagation()} // Prevent drag start on action buttons
                    >
                        {collection.archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                    </button>
                    {!collection.archived && (
                        <button
                            onClick={onDelete}
                            className="btn btn-ghost"
                            style={{ padding: '0.25rem', color: 'hsl(var(--color-text-secondary))' }}
                            title="Delete"
                            onPointerDown={e => e.stopPropagation()}
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
