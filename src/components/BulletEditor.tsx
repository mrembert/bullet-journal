import React, { useState, useId } from 'react';
import { useStore } from '../store';
import type { BulletType } from '../types';
import { generateUUID } from '../lib/utils';
import { ProjectPicker } from './ProjectPicker';
import { Folder, CornerDownLeft } from 'lucide-react';

interface BulletEditorProps {
    defaultDate?: string | null;
    autoFocus?: boolean;
    collectionId?: string | null;
    placeholder?: string;
    isCompact?: boolean;
}

export function BulletEditor({
    defaultDate,
    autoFocus = false,
    collectionId: forcedCollectionId,
    placeholder,
    isCompact = false
}: BulletEditorProps) {
    const [content, setContent] = useState('');
    const { state, dispatch } = useStore();
    const inputId = useId();

    const [showProjectPicker, setShowProjectPicker] = useState(false);
    const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');

    // If collectionId is passed as a prop, it's forced (inline mode).
    // Otherwise, it might be in state.view.collectionId (collection view).
    // Otherwise, it's whatever the user selected in the picker.
    const isForced = forcedCollectionId !== undefined;
    const effectiveCollectionId = isForced ? forcedCollectionId : (state.view.collectionId || selectedCollectionId);
    const selectedProject = effectiveCollectionId ? state.collections[effectiveCollectionId] : null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (content.trim()) {
            let type: BulletType = 'task';
            let cleanContent = content;

            // defaultDate might be null (backlog), undefined (not passed), or a string (daily/week)
            // if it is undefined, we fallback to state.view.date
            const targetDate = defaultDate !== undefined ? defaultDate : state.view.date;

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

            // Single Bullet
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
            setSelectedCollectionId(''); // Reset project selection (optional, but safer)
            setShowProjectPicker(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.altKey && e.key.toLowerCase() === 'p') {
            e.preventDefault();
            if (!state.view.collectionId && !isForced) {
                setShowProjectPicker(prev => !prev);
            }
        }
    };

    return (
        <form
            className="bullet-editor-row"
            onSubmit={handleSubmit}
            style={{
                marginTop: isCompact ? '0.5rem' : '1rem',
                display: 'flex',
                gap: '0.5rem',
                position: 'relative',
                alignItems: 'center',
                padding: isCompact ? '0 0.5rem' : '0'
            }}
        >
            <input
                id={isCompact ? undefined : (isForced ? `inline-editor-${inputId}` : "main-bullet-editor-input")}
                type="text"
                className="input"
                placeholder={placeholder || "Add a task (•), event (o), or note (-)..."}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus={autoFocus}
                enterKeyHint="enter"
                style={{
                    flex: 1,
                    fontSize: isCompact ? '0.9rem' : '1rem',
                    padding: isCompact ? '0.5rem' : '0.75rem',
                    paddingLeft: isCompact ? '1.5rem' : '2.5rem'
                }}
            />

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'flex-end' }}>
                {!state.view.collectionId && !isForced && (
                    <div style={{ position: 'relative' }}>
                        <button
                            type="button"
                            onClick={() => {
                                setShowProjectPicker(!showProjectPicker);
                            }}
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
                                textOverflow: 'ellipsis',
                                display: 'flex',
                                alignItems: 'center'
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
                    </div>
                )}

                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!content.trim()}
                    style={{
                        padding: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: content.trim() ? 1 : 0.5,
                        cursor: content.trim() ? 'pointer' : 'default',
                        flexShrink: 0,
                        minHeight: isCompact ? '32px' : '44px',
                        minWidth: isCompact ? '32px' : '44px'
                    }}
                    title="Add Task"
                >
                    <CornerDownLeft size={16} />
                </button>
            </div>
        </form>
    );
}
