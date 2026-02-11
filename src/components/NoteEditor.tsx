import { useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store';
import { X, Save, Trash } from 'lucide-react';
import { RichTextEditor } from './RichTextEditor';
import { cleanNoteContent } from '../lib/noteUtils.ts';
import { v4 as uuidv4 } from 'uuid';

interface NoteEditorProps {
    bulletId: string;
    onClose: () => void;
}

export function NoteEditor({ bulletId, onClose }: NoteEditorProps) {
    const { state, dispatch } = useStore();
    const bullet = state.bullets[bulletId];

    // Use a REF for content — avoids stale closure issues entirely.
    // The editor calls onChange on every keystroke, updating this ref.
    // When we save, we always read the latest value from the ref.
    const contentRef = useRef(cleanNoteContent(bullet?.longFormContent || '', state.bullets));

    if (!bullet) return null;

    const handleContentChange = (json: string) => {
        contentRef.current = json;
    };

    const handleClose = () => {
        // Always save the latest content from the ref
        dispatch({
            type: 'UPDATE_BULLET',
            payload: { id: bulletId, longFormContent: contentRef.current }
        });
        onClose();
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this note?')) {
            dispatch({
                type: 'UPDATE_BULLET',
                payload: { id: bulletId, longFormContent: '' }
            });
            onClose();
        }
    };

    const handleCreateTask = useCallback((initialContent?: string) => {
        const newId = uuidv4();
        dispatch({
            type: 'ADD_BULLET',
            payload: {
                id: newId,
                content: initialContent || '',
                type: 'task',
                date: bullet.date,
                collectionId: bullet.collectionId,
                parentNoteId: bulletId,
            }
        });
        return newId;
    }, [dispatch, bullet.date, bullet.collectionId, bulletId]);

    return createPortal(
        <div className="note-editor-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
        }} onClick={handleClose}>
            <div className="note-editor-content" onClick={e => e.stopPropagation()}>
                <header style={{
                    padding: '1rem',
                    borderBottom: '1px solid hsl(var(--color-text-secondary) / 0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.5rem',
                    flexWrap: 'wrap'
                }}>
                    <div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Note for: {bullet.content}</h3>
                        <div style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-secondary))' }}>
                            {bullet.date}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={handleDelete} className="btn btn-ghost" style={{ color: 'hsl(var(--color-danger))' }} title="Delete Note">
                            <Trash size={18} />
                        </button>
                        <button onClick={handleClose} className="btn btn-primary">
                            <Save size={18} /> Save & Close
                        </button>
                        <button onClick={handleClose} className="btn btn-ghost">
                            <X size={18} />
                        </button>
                    </div>
                </header>
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <RichTextEditor
                        key={bulletId}
                        content={contentRef.current}
                        onChange={handleContentChange}
                        onCreateTask={handleCreateTask}
                        onSaveAndClose={handleClose}
                    />
                </div>
            </div>
        </div>,
        document.body
    );
}
