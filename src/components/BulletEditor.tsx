import React, { useState } from 'react';
import { useStore } from '../store';
import type { BulletType } from '../types';
import { generateUUID } from '../lib/utils';
import { ProjectPicker } from './ProjectPicker';
import { Folder } from 'lucide-react';

export function BulletEditor({ defaultDate, autoFocus = false }: { defaultDate?: string, autoFocus?: boolean }) {
    const [content, setContent] = useState('');
    const { state, dispatch } = useStore();

    const [showProjectPicker, setShowProjectPicker] = useState(false);
    const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');

    // Reset selection when collectionId view changes, or keep it sticky?
    // For now, let's strictly follow the current view's collectionId if present, 
    // otherwise allow selection.

    const effectiveCollectionId = state.view.collectionId || selectedCollectionId;
    const selectedProject = effectiveCollectionId ? state.collections[effectiveCollectionId] : null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (content.trim()) {
            let type: BulletType = 'task';
            let cleanContent = content;
            const targetDate = defaultDate || state.view.date;

            // Simple parsing
            if (content.startsWith('- ')) {
                type = 'note';
                cleanContent = content.substring(2);
            } else if (content.startsWith('o ') || content.startsWith('O ') || content.startsWith('○ ')) {
                type = 'event';
                cleanContent = content.substring(2);
            } else if (content.startsWith('. ') || content.startsWith('• ')) {
                type = 'task';
                cleanContent = content.substring(2);
            }

            dispatch({
                type: 'ADD_BULLET',
                payload: {
                    id: generateUUID(),
                    content: cleanContent,
                    type,
                    date: targetDate,
                    collectionId: effectiveCollectionId || undefined
                }
            });
            setContent('');
            setSelectedCollectionId('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.altKey && e.key.toLowerCase() === 'p') {
            e.preventDefault();
            if (!state.view.collectionId) {
                setShowProjectPicker(prev => !prev);
            }
        }
    };

    return (
        <form
            className="bullet-editor-row"
            onSubmit={handleSubmit}
            style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', position: 'relative' }}
        >
            <input
                id="main-bullet-editor-input"
                type="text"
                className="input"
                placeholder="Add a task (•), event (o), or note (-)..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus={autoFocus}
                enterKeyHint="enter"
                style={{ flex: 1 }}
            />

            {!state.view.collectionId && (
                <>
                    <button
                        type="button"
                        onClick={() => setShowProjectPicker(!showProjectPicker)}
                        className="btn btn-ghost"
                        style={{
                            padding: '0.5rem',
                            border: '1px solid hsl(var(--color-text-secondary) / 0.2)',
                            backgroundColor: 'hsl(var(--color-bg-primary))',
                            color: selectedProject ? 'hsl(var(--color-accent))' : 'hsl(var(--color-text-secondary))',
                            fontSize: '0.85rem',
                            maxWidth: '140px',
                            justifyContent: 'space-between',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}
                        title="Select Project (Alt+P)"
                    >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {selectedProject ? selectedProject.title : 'No Project'}
                        </span>
                        <Folder size={14} style={{ marginLeft: '0.25rem', flexShrink: 0 }} />
                    </button>

                    {showProjectPicker && (
                        <ProjectPicker
                            currentCollectionId={selectedCollectionId}
                            onSelectProject={(id) => {
                                setSelectedCollectionId(id || '');
                                setShowProjectPicker(false);
                            }}
                            onCancel={() => setShowProjectPicker(false)}
                        />
                    )}
                </>
            )}
            {/* Optional: Add a hidden submit button for some older browsers if needed, 
                but enterKeyHint + form should handle it. */}
            <button type="submit" style={{ display: 'none' }} aria-hidden="true" />
        </form>
    );
}
