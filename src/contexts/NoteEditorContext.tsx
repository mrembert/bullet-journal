import React, { createContext, useContext, useState, useCallback } from 'react';

interface NoteEditorContextType {
    openNoteId: string | null;
    openNote: (bulletId: string) => void;
    closeNote: () => void;
}

const NoteEditorContext = createContext<NoteEditorContextType>({
    openNoteId: null,
    openNote: () => { },
    closeNote: () => { },
});

export function NoteEditorProvider({ children }: { children: React.ReactNode }) {
    const [openNoteId, setOpenNoteId] = useState<string | null>(null);

    const openNote = useCallback((bulletId: string) => {
        setOpenNoteId(bulletId);
    }, []);

    const closeNote = useCallback(() => {
        setOpenNoteId(null);
    }, []);

    return (
        <NoteEditorContext.Provider value={{ openNoteId, openNote, closeNote }}>
            {children}
        </NoteEditorContext.Provider>
    );
}

export function useNoteEditor() {
    return useContext(NoteEditorContext);
}
