
import { useStore } from '../store';
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
            <div style={{
                position: 'absolute',
                zIndex: 10,
                background: 'hsl(var(--color-bg-secondary))',
                border: '1px solid hsl(var(--color-text-secondary) / 0.2)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-md)',
                padding: '0.5rem',
                minWidth: '220px',
                right: 0,
                top: '100%',
                maxHeight: '300px',
                overflowY: 'auto'
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
                        MOVE TO...
                    </div>
                    <button onClick={onCancel} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}>
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
        </>
    );
}
