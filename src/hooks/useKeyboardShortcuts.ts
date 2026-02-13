import { useEffect, useRef } from 'react';
import { useStore } from '../store';
import { useKeyboardFocus } from '../contexts/KeyboardFocusContext';
import { useNoteEditor } from '../contexts/NoteEditorContext';
import { useConfirmation } from '../contexts/ConfirmationContext';
import { handleKeyboardShortcut } from '../lib/keyboardShortcuts';

export function useKeyboardShortcuts({
    onMigratePrompt,
    onMoveToProject
}: {
    onMigratePrompt: (bulletId: string) => void;
    onMoveToProject: (bulletId: string) => void;
}) {
    const { state, dispatch } = useStore();
    const { focusedId, moveUp, moveDown, clearFocus, setEditingId } = useKeyboardFocus();
    const { openNote } = useNoteEditor();
    const { requestConfirmation } = useConfirmation();

    // Use Refs to ensure the listener always has the latest state without re-binding constantly
    const stateRef = useRef(state);
    const focusedIdRef = useRef(focusedId);
    const setEditingIdRef = useRef(setEditingId);
    const openNoteRef = useRef(openNote);
    const requestConfirmationRef = useRef(requestConfirmation);
    const onMigratePromptRef = useRef(onMigratePrompt);
    const onMoveToProjectRef = useRef(onMoveToProject);

    useEffect(() => { stateRef.current = state; }, [state]);
    useEffect(() => { focusedIdRef.current = focusedId; }, [focusedId]);
    useEffect(() => { setEditingIdRef.current = setEditingId; }, [setEditingId]);
    useEffect(() => { openNoteRef.current = openNote; }, [openNote]);
    useEffect(() => { requestConfirmationRef.current = requestConfirmation; }, [requestConfirmation]);
    useEffect(() => { onMigratePromptRef.current = onMigratePrompt; }, [onMigratePrompt]);
    useEffect(() => { onMoveToProjectRef.current = onMoveToProject; }, [onMoveToProject]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const activeTag = document.activeElement?.tagName.toLowerCase();
            const isInput = activeTag === 'input' || activeTag === 'textarea' || (document.activeElement as HTMLElement)?.isContentEditable || false;
            
            // Don't trigger shortcuts if any overlay modal is open (migrating or moving) or kebab menu is open
            const isModalOpen = !!document.querySelector('.picker-overlay') ||
                !!document.querySelector('.sidebar-overlay.visible') ||
                !!document.querySelector('.bullet-menu-overlay');
            if (isModalOpen) return;

            handleKeyboardShortcut(e, {
                state: stateRef.current,
                focusedId: focusedIdRef.current,
                isInput,
                actions: {
                    moveUp,
                    moveDown,
                    clearFocus,
                    setEditingId: (id) => setEditingIdRef.current(id),
                    dispatch,
                    openNote: (id) => openNoteRef.current(id),
                    onMigratePrompt: (id) => onMigratePromptRef.current(id),
                    onMoveToProject: (id) => onMoveToProjectRef.current(id),
                    requestConfirmation: (opts) => requestConfirmationRef.current(opts),
                }
            });
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [moveUp, moveDown, clearFocus, dispatch]); // Minimal dependencies
}
