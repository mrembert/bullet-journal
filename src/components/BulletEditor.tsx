import React, { useState } from 'react';
import { useStore } from '../store';
import type { BulletType } from '../types';
import { generateUUID } from '../lib/utils';

export function BulletEditor({ defaultDate, autoFocus = true }: { defaultDate?: string, autoFocus?: boolean }) {
    const [content, setContent] = useState('');
    const { state, dispatch } = useStore();

    const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');

    // Reset selection when collectionId view changes, or keep it sticky?
    // For now, let's strictly follow the current view's collectionId if present, 
    // otherwise allow selection.

    const effectiveCollectionId = state.view.collectionId || selectedCollectionId;

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
            } else if (content.startsWith('o ') || content.startsWith('○ ')) {
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
            // Keep the selected collection sticky? Or reset?
            // Let's keep it sticky for rapid entry.
        }
    };

    const projects = Object.values(state.collections).filter(c => c.type === 'project');

    return (
        <form
            className="bullet-editor-row"
            onSubmit={handleSubmit}
            style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}
        >
            <input
                type="text"
                className="input"
                placeholder="Add a task (•), event (o), or note (-)..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                autoFocus={autoFocus}
                enterKeyHint="enter"
                style={{ flex: 1 }}
            />

            {!state.view.collectionId && (
                <select
                    value={selectedCollectionId}
                    onChange={(e) => setSelectedCollectionId(e.target.value)}
                    style={{
                        padding: '0.5rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid hsl(var(--color-text-secondary) / 0.2)',
                        backgroundColor: 'hsl(var(--color-bg-primary))',
                        color: 'hsl(var(--color-text-secondary))',
                        fontSize: '0.85rem',
                        maxWidth: '120px'
                    }}
                >
                    <option value="">No Project</option>
                    {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                </select>
            )}
            {/* Optional: Add a hidden submit button for some older browsers if needed, 
                but enterKeyHint + form should handle it. */}
            <button type="submit" style={{ display: 'none' }} aria-hidden="true" />
        </form>
    );
}
