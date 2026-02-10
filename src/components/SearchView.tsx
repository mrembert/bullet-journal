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

    const results = useMemo(() => {
        if (!query.trim()) return [];
        const lowerQuery = query.toLowerCase();
        return Object.values(state.bullets)
            .filter(b =>
                b.content.toLowerCase().includes(lowerQuery) ||
                (b.longFormContent && b.longFormContent.toLowerCase().includes(lowerQuery))
            )
            .sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt)); // Sort by updated or created, newest first
    }, [state.bullets, query]);

    // Register visible IDs for keyboard navigation
    useEffect(() => {
        setVisibleIds(results.map(b => b.id));
        return () => setVisibleIds([]);
    }, [results, setVisibleIds]);

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
                {query && results.length === 0 && (
                    <p style={{ fontStyle: 'italic', color: 'hsl(var(--color-text-secondary))', textAlign: 'center' }}>
                        No results found for "{query}"
                    </p>
                )}

                {results.map(bullet => (
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
                            {bullet.date ? format(parseISO(bullet.date), 'MMMM d, yyyy') : 'Undated'}
                        </div>
                        <BulletItem bullet={bullet} isFocused={bullet.id === focusedId} />
                    </div>
                ))}
            </div>
        </div>
    );
}
