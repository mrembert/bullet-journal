import React, { useState } from 'react';
import { useStore } from '../store';
import type { BulletType } from '../types';

export function BulletEditor({ defaultDate }: { defaultDate?: string }) {
    const [content, setContent] = useState('');
    const { state, dispatch } = useStore();

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && content.trim()) {
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
                    content: cleanContent,
                    type,
                    date: targetDate,
                    collectionId: state.view.collectionId
                }
            });
            setContent('');
        }
    };

    return (
        <div style={{ marginTop: '1rem' }}>
            <input
                type="text"
                className="input"
                placeholder="Add a task (•), event (o), or note (-)..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
            />
        </div>
    );
}
