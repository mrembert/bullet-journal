import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface SortableProjectHeaderProps {
    id: string;
    title: string;
    isUnassigned?: boolean;
}

export function SortableProjectHeader({ id, title, isUnassigned }: SortableProjectHeaderProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : 1,
        position: 'relative' as const,
    };

    return (
        <h3
            ref={setNodeRef}
            style={style}
            className="project-group-header"
        >
            <div
                {...attributes}
                {...listeners}
                className="drag-handle"
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.25rem',
                    marginRight: '0.25rem',
                    cursor: 'grab',
                    opacity: 0.5
                }}
            >
                <GripVertical size={14} />
            </div>
            <span style={{
                fontSize: isUnassigned ? '0.85rem' : '0.9rem',
                textTransform: isUnassigned ? 'uppercase' : 'none',
                fontWeight: isUnassigned ? 400 : 600,
                letterSpacing: isUnassigned ? '0.05em' : 'normal',
            }}>
                {title}
            </span>
        </h3>
    );
}
