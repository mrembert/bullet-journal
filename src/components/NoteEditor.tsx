import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { X, Save } from 'lucide-react';

interface NoteEditorProps {
    bulletId: string;
    onClose: () => void;
}

export function NoteEditor({ bulletId, onClose }: NoteEditorProps) {
    const { state, dispatch } = useStore();
    const bullet = state.bullets[bulletId];
    const [content, setContent] = useState(bullet?.longFormContent || '');

    useEffect(() => {
        if (bullet) {
            setContent(bullet.longFormContent || '');
        }
    }, [bullet]);

    if (!bullet) return null;

    const handleSave = () => {
        dispatch({
            type: 'UPDATE_BULLET',
            payload: { id: bulletId, longFormContent: content }
        });
        onClose();
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
        }}>
            <div style={{
                backgroundColor: 'hsl(var(--color-bg-primary))',
                width: '80%',
                maxWidth: '800px',
                height: '80%',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                <header style={{
                    padding: '1rem',
                    borderBottom: '1px solid hsl(var(--color-text-secondary) / 0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Note for: {bullet.content}</h3>
                        <div style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-secondary))' }}>
                            {bullet.date}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={handleSave} className="btn btn-primary">
                            <Save size={18} /> Save
                        </button>
                        <button onClick={onClose} className="btn btn-ghost">
                            <X size={18} />
                        </button>
                    </div>
                </header>
                <div style={{ flex: 1, padding: '1.5rem', overflow: 'auto' }}>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                        placeholder="Type your notes here..."
                        style={{
                            width: '100%',
                            height: '100%',
                            border: 'none',
                            outline: 'none',
                            resize: 'none',
                            fontSize: '1rem',
                            lineHeight: 1.6,
                            fontFamily: 'inherit',
                            backgroundColor: 'transparent',
                            color: 'inherit'
                        }}
                        autoFocus
                    />
                </div>
            </div>
        </div>
    );
}
