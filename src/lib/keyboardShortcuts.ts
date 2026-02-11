import type { AppState, Action } from '../types.ts';

export interface KeyboardShortcutContext {
    state: AppState;
    focusedId: string | null;
    isInput: boolean;
    actions: {
        moveUp: () => void;
        moveDown: () => void;
        clearFocus: () => void;
        setEditingId: (id: string | null) => void;
        dispatch: (action: Action) => void;
        openNote: (id: string) => void;
        onMigratePrompt: (id: string) => void;
        onMoveToProject: (id: string) => void;
        requestConfirmation: (options: {
            title: string;
            message: string;
            isDanger: boolean;
            confirmLabel: string;
            onConfirm: () => void;
        }) => void;
    }
}

// Partial KeyboardEvent interface for testing
export interface KeyboardEventLike {
    key: string;
    preventDefault: () => void;
}

export function handleKeyboardShortcut(
    e: KeyboardEventLike,
    context: KeyboardShortcutContext
) {
    const { state, focusedId, isInput, actions } = context;
    const { moveUp, moveDown, clearFocus, setEditingId, dispatch, openNote, onMigratePrompt, onMoveToProject, requestConfirmation } = actions;

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
    if (!focusedId) return;

    const bullet = state.bullets[focusedId];
    if (!bullet) return;

    switch (key) {
        case 'e': {
            e.preventDefault();
            setEditingId(bullet.id);
            break;
        }
        case 'x': {
            e.preventDefault();
            const newState = bullet.state === 'completed' ? 'open' : 'completed';
            dispatch({ type: 'UPDATE_BULLET', payload: { id: bullet.id, state: newState } });
            break;
        }
        case 'n': {
            e.preventDefault();
            openNote(bullet.id);
            break;
        }
        case 'm': {
            e.preventDefault();
            onMigratePrompt(bullet.id);
            break;
        }
        case 'p': {
            e.preventDefault();
            onMoveToProject(bullet.id);
            break;
        }
        case 'd': {
            e.preventDefault();
            requestConfirmation({
                title: 'Delete Item',
                message: 'Delete this item?',
                isDanger: true,
                confirmLabel: 'Delete',
                onConfirm: () => dispatch({ type: 'DELETE_BULLET', payload: { id: bullet.id } })
            });
            break;
        }
        case 'tab': {
            e.preventDefault();
            clearFocus();
            // Create a microtask or small timeout to ensure focus clears before we set native focus? 
            // Usually not needed, but safe.
            requestAnimationFrame(() => {
                document.getElementById('main-bullet-editor-input')?.focus();
            });
            break;
        }
    }
}
