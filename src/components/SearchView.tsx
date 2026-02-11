import { useState, useMemo } from 'react';
import { useStore } from '../store';
import { BulletItem } from './BulletItem';
import { useKeyboardFocus } from '../contexts/KeyboardFocusContext';
import { useEffect } from 'react';
import { Search } from 'lucide-react';
import { parseISO, format } from 'date-fns';

export function SearchView() {
    const { state } = useStore();
    const [query, setQuery] = useState('');
    const { focusedId, setVisibleIds } = useKeyboardFocus();

    const extractTextFromContent = (content: string): string => {
        if (!content) return '';
        try {
            const json = JSON.parse(content);
            if (typeof json !== 'object' || !json) return content;

            let text = '';
            const traverse = (node: any) => {
                if (node.text) {
                    text += node.text + ' ';
                }
                if (node.content && Array.isArray(node.content)) {
                    node.content.forEach(traverse);
                }
            };

            traverse(json);
            return text.trim();
        } catch (e) {
            // Not JSON, return as is
            return content;
        }
    };

    const results = useMemo(() => {
        if (!query.trim()) return { task: [], note: [], event: [] };

        const lowerQuery = query.toLowerCase();

        const allResults = Object.values(state.bullets).filter(b => {
            const contentMatch = b.content.toLowerCase().includes(lowerQuery);
            if (contentMatch) return true;

            if (b.longFormContent) {
                const extracted = extractTextFromContent(b.longFormContent);
                return extracted.toLowerCase().includes(lowerQuery);
            }

            return false;
        });

        const grouped = {
            task: [] as typeof allResults,
            note: [] as typeof allResults,
            event: [] as typeof allResults
        };

        allResults.forEach(bullet => {
            if (grouped[bullet.type]) {
                grouped[bullet.type].push(bullet);
            }
        });

        // Sort each group
        Object.keys(grouped).forEach(key => {
            grouped[key as keyof typeof grouped].sort((a, b) =>
                (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt)
            );
        });

        return grouped;
    }, [state.bullets, query]);

    // Register visible IDs for keyboard navigation
    useEffect(() => {
        const allIds = [
            ...results.task.map(b => b.id),
            ...results.note.map(b => b.id),
            ...results.event.map(b => b.id)
        ];
        setVisibleIds(allIds);
        return () => setVisibleIds([]);
    }, [results, setVisibleIds]);

    const getSnippet = (content: string, query: string) => {
        if (!content || !query) return null;

        const plainText = extractTextFromContent(content);
        const lowerContent = plainText.toLowerCase();
        const lowerQuery = query.toLowerCase();
        const index = lowerContent.indexOf(lowerQuery);

        if (index === -1) return null;

        const start = Math.max(0, index - 40);
        const end = Math.min(plainText.length, index + query.length + 40);

        const prefix = start > 0 ? '...' : '';
        const suffix = end < plainText.length ? '...' : '';

        const snippetText = plainText.substring(start, end);

        // Split specifically for highlighting
        // We find the index of the query within our potentially truncated snippet
        const matchIndexInSnippet = snippetText.toLowerCase().indexOf(lowerQuery);

        if (matchIndexInSnippet === -1) return null; // Should not happen based on logic above

        const before = snippetText.substring(0, matchIndexInSnippet);
        const match = snippetText.substring(matchIndexInSnippet, matchIndexInSnippet + query.length);
        const after = snippetText.substring(matchIndexInSnippet + query.length);

        return (
            <span style={{ color: 'hsl(var(--color-text-secondary))', fontSize: '0.9rem', fontStyle: 'italic' }}>
                {prefix}{before}
                <mark style={{ backgroundColor: 'hsl(var(--color-accent) / 0.3)', color: 'inherit', padding: '0 2px', borderRadius: '2px' }}>
                    {match}
                </mark>
                {after}{suffix}
            </span>
        );
    };

    const renderGroup = (title: string, bullets: typeof results.task) => {
        if (bullets.length === 0) return null;
        return (
            <div key={title} style={{ marginBottom: '2rem' }}>
                <h3 style={{
                    fontSize: '1.2rem',
                    fontWeight: 500,
                    color: 'hsl(var(--color-text-primary))',
                    marginBottom: '1rem',
                    borderBottom: '1px solid hsl(var(--color-text-secondary) / 0.2)',
                    paddingBottom: '0.5rem'
                }}>
                    {title}s <span style={{ fontSize: '0.9rem', color: 'hsl(var(--color-text-secondary))', fontWeight: 'normal' }}>({bullets.length})</span>
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {bullets.map(bullet => {
                        const snippet = bullet.longFormContent ? getSnippet(bullet.longFormContent, query) : null;

                        return (
                            <div key={bullet.id} style={{
                                border: '1px solid hsl(var(--color-text-secondary) / 0.1)',
                                borderRadius: 'var(--radius-md)',
                                padding: '1rem',
                                backgroundColor: 'hsl(var(--color-bg-primary))'
                            }}>
                                <div style={{
                                    fontSize: '0.75rem',
                                    color: 'hsl(var(--color-text-secondary))',
                                    marginBottom: '0.5rem',
                                    fontWeight: 600
                                }}>
                                    {bullet.date ? format(parseISO(bullet.date as string), 'MMMM d, yyyy') : 'Undated'}
                                </div>
                                <BulletItem bullet={bullet} isFocused={bullet.id === focusedId} />

                                {snippet && (
                                    <div style={{
                                        marginTop: '0.75rem',
                                        padding: '0.5rem',
                                        backgroundColor: 'hsl(var(--color-bg-secondary))',
                                        borderRadius: 'var(--radius-sm)',
                                        borderLeft: '3px solid hsl(var(--color-text-secondary) / 0.3)'
                                    }}>
                                        {snippet}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const hasResults = results.task.length > 0 || results.note.length > 0 || results.event.length > 0;

    return (
        <div className="search-view">
            <header style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 300, color: 'hsl(var(--color-text-secondary))' }}>Search</h2>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    border: '2px solid hsl(var(--color-text-secondary) / 0.2)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.5rem 1rem',
                    marginTop: '1rem',
                    backgroundColor: 'hsl(var(--color-bg-secondary))'
                }}>
                    <Search size={20} color="hsl(var(--color-text-secondary))" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search tasks, notes, and events..."
                        style={{
                            border: 'none',
                            background: 'transparent',
                            fontSize: '1.2rem',
                            flex: 1,
                            outline: 'none',
                            color: 'inherit'
                        }}
                        autoFocus
                    />
                </div>
            </header>

            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                {query && !hasResults && (
                    <p style={{ fontStyle: 'italic', color: 'hsl(var(--color-text-secondary))', textAlign: 'center' }}>
                        No results found for "{query}"
                    </p>
                )}

                {renderGroup('Task', results.task)}
                {renderGroup('Event', results.event)}
                {renderGroup('Note', results.note)}
            </div>
        </div>
    );
}
