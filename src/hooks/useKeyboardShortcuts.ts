import { useEffect, useRef } from 'react';
import { useStore } from '../store';
import { useKeyboardFocus } from '../contexts/KeyboardFocusContext';
import { useNoteEditor } from '../contexts/NoteEditorContext';
import { useConfirmation } from '../contexts/ConfirmationContext';
import { handleKeyboardShortcut } from '../lib/keyboardShortcuts';

export function useKeyboardShortcuts(onMigratePrompt: (bulletId: string) => void) {
    const { state, dispatch } = useStore();
    const { focusedId, moveUp, moveDown, clearFocus } = useKeyboardFocus();
    const { openNote } = useNoteEditor();
    const { requestConfirmation } = useConfirmation();

    // Use Refs to ensure the listener always has the latest state without re-binding constantly
    const stateRef = useRef(state);
    const focusedIdRef = useRef(focusedId);
    const openNoteRef = useRef(openNote);
    const requestConfirmationRef = useRef(requestConfirmation);
    const onMigratePromptRef = useRef(onMigratePrompt);

    useEffect(() => { stateRef.current = state; }, [state]);
    useEffect(() => { focusedIdRef.current = focusedId; }, [focusedId]);
    useEffect(() => { openNoteRef.current = openNote; }, [openNote]);
    useEffect(() => { requestConfirmationRef.current = requestConfirmation; }, [requestConfirmation]);
    useEffect(() => { onMigratePromptRef.current = onMigratePrompt; }, [onMigratePrompt]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const activeTag = document.activeElement?.tagName.toLowerCase();
            const isInput = activeTag === 'input' || activeTag === 'textarea' || (document.activeElement as HTMLElement)?.isContentEditable || false;

            handleKeyboardShortcut(e, {
                state: stateRef.current,
                focusedId: focusedIdRef.current,
                isInput,
                actions: {
                    moveUp,
                    moveDown,
                    clearFocus,
                    dispatch,
                    openNote: (id) => openNoteRef.current(id),
                    onMigratePrompt: (id) => onMigratePromptRef.current(id),
                    requestConfirmation: (opts) => requestConfirmationRef.current(opts),
                }
            });
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [moveUp, moveDown, clearFocus, dispatch]); // Minimal dependencies
}
