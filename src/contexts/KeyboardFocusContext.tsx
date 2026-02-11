
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface KeyboardFocusContextType {
    focusedId: string | null;
    setFocusedId: (id: string | null) => void;
    editingId: string | null;
    setEditingId: (id: string | null) => void;
    visibleIds: string[];
    setVisibleIds: (ids: string[]) => void;
    moveUp: () => void;
    moveDown: () => void;
    clearFocus: () => void;
}

const KeyboardFocusContext = createContext<KeyboardFocusContextType>({
    focusedId: null,
    setFocusedId: () => { },
    editingId: null,
    setEditingId: () => { },
    visibleIds: [],
    setVisibleIds: () => { },
    moveUp: () => { },
    moveDown: () => { },
    clearFocus: () => { },
});

export function KeyboardFocusProvider({ children }: { children: React.ReactNode }) {
    const [focusedId, setFocusedId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [visibleIds, setVisibleIds] = useState<string[]>([]);

    const moveUp = useCallback(() => {
        setFocusedId(curr => {
            if (!curr) return visibleIds[0] || null;
            const idx = visibleIds.indexOf(curr);
            if (idx <= 0) return visibleIds[0] || null;
            return visibleIds[idx - 1];
        });
    }, [visibleIds]);

    const moveDown = useCallback(() => {
        setFocusedId(curr => {
            if (!curr) return visibleIds[0] || null;
            const idx = visibleIds.indexOf(curr);
            if (idx === -1 || idx >= visibleIds.length - 1) return visibleIds[visibleIds.length - 1] || null;
            return visibleIds[idx + 1];
        });
    }, [visibleIds]);

    const clearFocus = useCallback(() => {
        setFocusedId(null);
    }, []);

    // If focused item disappears (filtered out), clear focus or move to neighbor
    useEffect(() => {
        if (focusedId && visibleIds.length > 0 && !visibleIds.includes(focusedId)) {
            // Find nearest neighbor? For simplicity, just clear or snap to top
            setFocusedId(null);
        }
    }, [visibleIds, focusedId]);

    return (
        <KeyboardFocusContext.Provider value={{
            focusedId,
            setFocusedId,
            editingId,
            setEditingId,
            visibleIds,
            setVisibleIds,
            moveUp,
            moveDown,
            clearFocus
        }}>
            {children}
        </KeyboardFocusContext.Provider>
    );
}

export function useKeyboardFocus() {
    return useContext(KeyboardFocusContext);
}
