
import { useStore } from '../store';
import { createPortal } from 'react-dom';
import { Folder, X } from 'lucide-react';

interface ProjectPickerProps {
    onSelectProject: (collectionId: string | null) => void;
    onCancel: () => void;
    currentCollectionId?: string;
}

export function ProjectPicker({ onSelectProject, onCancel, currentCollectionId }: ProjectPickerProps) {
    const { state } = useStore();

    // Get all projects
    const projects = Object.values(state.collections)
        .filter(c => c.type === 'project')
        .sort((a, b) => b.createdAt - a.createdAt);

    return createPortal(
        <div className="picker-overlay" onClick={onCancel}>
            <div onClick={e => e.stopPropagation()}>
                <div className="picker-panel">
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
                            MOVE TO...
                        </div>
                        <button onClick={onCancel} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: 'hsl(var(--color-text-primary))' }}>
                            <X size={14} />
                        </button>
                    </div>

                    <button
                        onClick={() => onSelectProject(null)}
                        className="btn btn-ghost"
                        style={{
                            width: '100%',
                            justifyContent: 'flex-start',
                            fontSize: '0.9rem',
                            opacity: !currentCollectionId ? 0.5 : 1,
                            cursor: !currentCollectionId ? 'default' : 'pointer'
                        }}
                        disabled={!currentCollectionId}
                    >
                        <Folder size={14} /> No Project (Inbox)
                    </button>

                    {projects.map(p => (
                        <button
                            key={p.id}
                            onClick={() => onSelectProject(p.id)}
                            className="btn btn-ghost"
                            style={{
                                width: '100%',
                                justifyContent: 'flex-start',
                                fontSize: '0.9rem',
                                opacity: currentCollectionId === p.id ? 0.5 : 1,
                                cursor: currentCollectionId === p.id ? 'default' : 'pointer'
                            }}
                            disabled={currentCollectionId === p.id}
                        >
                            <Folder size={14} /> {p.title}
                        </button>
                    ))}
                </div>
            </div>
        </div>,
        document.body
    );
}
