import React, { useState } from 'react';
import { useStore } from '../store';
import type { BulletType, Bullet } from '../types';
import { generateUUID } from '../lib/utils';
import { ProjectPicker } from './ProjectPicker';
import { RecurrencePicker } from './RecurrencePicker';
import { generateRecurringDates, type RecurrenceConfig } from '../lib/recurrence';
import { Folder, Repeat } from 'lucide-react';
import { parseISO } from 'date-fns';

export function BulletEditor({ defaultDate, autoFocus = false }: { defaultDate?: string, autoFocus?: boolean }) {
    const [content, setContent] = useState('');
    const { state, dispatch } = useStore();

    const [showProjectPicker, setShowProjectPicker] = useState(false);
    const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');

    const [showRecurrencePicker, setShowRecurrencePicker] = useState(false);
    const [recurrenceConfig, setRecurrenceConfig] = useState<RecurrenceConfig | null>(null);

    const effectiveCollectionId = state.view.collectionId || selectedCollectionId;
    const selectedProject = effectiveCollectionId ? state.collections[effectiveCollectionId] : null;

    // Helper to close pickers on outside click could be added,
    // but for now relying on toggles and inline logic.

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

            // Recurrence Logic
            if (recurrenceConfig) {
                const dates = generateRecurringDates(targetDate, recurrenceConfig);
                const recurringId = generateUUID();
                const now = Date.now();
                const recurrenceRuleStr = JSON.stringify(recurrenceConfig);

                const bullets: Bullet[] = dates.map((dateStr, index) => ({
                    id: generateUUID(),
                    content: cleanContent,
                    type,
                    state: 'open',
                    date: dateStr,
                    collectionId: effectiveCollectionId || undefined,
                    recurringId,
                    recurrenceRule: recurrenceRuleStr,
                    createdAt: now,
                    updatedAt: now,
                    order: now + index, // Slight order diff to keep generation order if same day (unlikely for daily/weekly)
                    completedAt: undefined
                }));

                if (bullets.length > 0) {
                    dispatch({
                        type: 'ADD_BULLETS',
                        payload: { bullets }
                    });
                }
            } else {
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
            }

            setContent('');
            setSelectedCollectionId(''); // Reset project selection (optional, but safer)
            setRecurrenceConfig(null);
            setShowRecurrencePicker(false);
            setShowProjectPicker(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.altKey && e.key.toLowerCase() === 'p') {
            e.preventDefault();
            if (!state.view.collectionId) {
                setShowProjectPicker(prev => !prev);
                setShowRecurrencePicker(false);
            }
        }
        if (e.altKey && e.key.toLowerCase() === 'r') {
            e.preventDefault();
            setShowRecurrencePicker(prev => !prev);
            setShowProjectPicker(false);
        }
    };

    return (
        <form
            className="bullet-editor-row"
            onSubmit={handleSubmit}
            style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', position: 'relative', alignItems: 'center' }}
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

            {/* Recurrence Button */}
            <div style={{ position: 'relative' }}>
                <button
                    type="button"
                    onClick={() => {
                        setShowRecurrencePicker(!showRecurrencePicker);
                        setShowProjectPicker(false);
                    }}
                    className={`btn ${recurrenceConfig ? 'btn-primary' : 'btn-ghost'}`}
                    style={{
                        padding: '0.5rem',
                        border: recurrenceConfig ? '1px solid var(--color-accent)' : '1px solid hsl(var(--color-text-secondary) / 0.2)',
                        backgroundColor: 'hsl(var(--color-bg-primary))',
                        color: recurrenceConfig ? 'hsl(var(--color-accent))' : 'hsl(var(--color-text-secondary))',
                    }}
                    title="Repeat (Alt+R)"
                >
                    <Repeat size={14} />
                    {recurrenceConfig && <span style={{fontSize: '0.7rem', marginLeft: '0.25rem', verticalAlign: 'middle'}}>On</span>}
                </button>
                {showRecurrencePicker && (
                    <RecurrencePicker
                        startDate={parseISO(defaultDate || state.view.date)}
                        initialConfig={recurrenceConfig}
                        onChange={setRecurrenceConfig}
                        onClose={() => setShowRecurrencePicker(false)}
                    />
                )}
            </div>

            {!state.view.collectionId && (
                <div style={{ position: 'relative' }}>
                    <button
                        type="button"
                        onClick={() => {
                            setShowProjectPicker(!showProjectPicker);
                            setShowRecurrencePicker(false);
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

            {/* Optional: Add a hidden submit button for some older browsers if needed */}
            <button type="submit" style={{ display: 'none' }} aria-hidden="true" />
        </form>
    );
}
