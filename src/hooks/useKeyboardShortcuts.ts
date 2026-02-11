
import { useEffect, useRef } from 'react';
import { useStore } from '../store';
import { useKeyboardFocus } from '../contexts/KeyboardFocusContext';
import { useNoteEditor } from '../contexts/NoteEditorContext';
import { useConfirmation } from '../contexts/ConfirmationContext';

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
            const isInput = activeTag === 'input' || activeTag === 'textarea' || (document.activeElement as HTMLElement)?.isContentEditable;

            if (e.key === 'Escape') {
                e.preventDefault();
                clearFocus();
                return;
            }

            if (isInput) return;

            const key = e.key.toLowerCase();

            // 1. Navigation
            if (key === 'j' || e.key === 'ArrowDown') {
                e.preventDefault();
                moveDown();
                return;
            } else if (key === 'k' || e.key === 'ArrowUp') {
                e.preventDefault();
                moveUp();
                return;
            }

            // 2. Actions on focused item
            const currentFocusedId = focusedIdRef.current;
            if (!currentFocusedId) return;

            const bullet = stateRef.current.bullets[currentFocusedId];
            if (!bullet) return;

            switch (key) {
                case 'x': {
                    e.preventDefault();
                    const newState = bullet.state === 'completed' ? 'open' : 'completed';
                    dispatch({ type: 'UPDATE_BULLET', payload: { id: bullet.id, state: newState } });
                    break;
                }
                case 'n': {
                    e.preventDefault();
                    openNoteRef.current(bullet.id);
                    break;
                }
                case 'm': {
                    e.preventDefault();
                    onMigratePromptRef.current(bullet.id);
                    break;
                }
                case 'd': {
                    e.preventDefault();
                    requestConfirmationRef.current({
                        title: 'Delete Item',
                        message: 'Delete this item?',
                        isDanger: true,
                        confirmLabel: 'Delete',
                        onConfirm: () => dispatch({ type: 'DELETE_BULLET', payload: { id: bullet.id } })
                    });
                    break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [moveUp, moveDown, clearFocus, dispatch]); // Minimal dependencies
}
