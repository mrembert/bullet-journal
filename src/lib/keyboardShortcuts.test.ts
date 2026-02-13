import test from 'node:test';
import assert from 'node:assert';
import { handleKeyboardShortcut, type KeyboardShortcutContext } from './keyboardShortcuts.ts';
import type { AppState, Bullet } from '../types.ts';

// Helper to create a mock state
const createMockState = (bullets: Record<string, Bullet> = {}): AppState => ({
    bullets,
    collections: {},
    view: { mode: 'daily', date: '2023-01-01' },
    preferences: { groupByProject: false, showCompleted: true, showMigrated: false }
});

// Helper to create a mock bullet
const createMockBullet = (id: string, overrides: Partial<Bullet> = {}): Bullet => ({
    id,
    content: 'Task',
    type: 'task',
    state: 'open',
    order: 1,
    createdAt: 123,
    updatedAt: 123,
    ...overrides
});

// Helper to create mock actions
const createMockActions = () => ({
    moveUp: test.mock.fn(),
    moveDown: test.mock.fn(),
    clearFocus: test.mock.fn(),
    setEditingId: test.mock.fn(),
    dispatch: test.mock.fn(),
    openNote: test.mock.fn(),
    onMigratePrompt: test.mock.fn(),
    requestConfirmation: test.mock.fn()
});

test('Navigation - moveDown with j', (t) => {
    const actions = createMockActions();
    const context: KeyboardShortcutContext = {
        state: createMockState(),
        focusedId: null,
        isInput: false,
        actions
    };
    const event = { key: 'j', preventDefault: t.mock.fn() };

    handleKeyboardShortcut(event, context);

    assert.strictEqual(event.preventDefault.mock.callCount(), 1);
    assert.strictEqual(actions.moveDown.mock.callCount(), 1);
});

test('Navigation - moveDown with ArrowDown', (t) => {
    const actions = createMockActions();
    const context: KeyboardShortcutContext = {
        state: createMockState(),
        focusedId: null,
        isInput: false,
        actions
    };
    const event = { key: 'ArrowDown', preventDefault: t.mock.fn() };

    handleKeyboardShortcut(event, context);

    assert.strictEqual(event.preventDefault.mock.callCount(), 1);
    assert.strictEqual(actions.moveDown.mock.callCount(), 1);
});

test('Navigation - moveUp with k', (t) => {
    const actions = createMockActions();
    const context: KeyboardShortcutContext = {
        state: createMockState(),
        focusedId: null,
        isInput: false,
        actions
    };
    const event = { key: 'k', preventDefault: t.mock.fn() };

    handleKeyboardShortcut(event, context);

    assert.strictEqual(event.preventDefault.mock.callCount(), 1);
    assert.strictEqual(actions.moveUp.mock.callCount(), 1);
});

test('Navigation - moveUp with ArrowUp', (t) => {
    const actions = createMockActions();
    const context: KeyboardShortcutContext = {
        state: createMockState(),
        focusedId: null,
        isInput: false,
        actions
    };
    const event = { key: 'ArrowUp', preventDefault: t.mock.fn() };

    handleKeyboardShortcut(event, context);

    assert.strictEqual(event.preventDefault.mock.callCount(), 1);
    assert.strictEqual(actions.moveUp.mock.callCount(), 1);
});

test('Escape clears focus', (t) => {
    const actions = createMockActions();
    const context: KeyboardShortcutContext = {
        state: createMockState(),
        focusedId: 'some-id',
        isInput: true, // Escape works even in input
        actions
    };
    const event = { key: 'Escape', preventDefault: t.mock.fn() };

    handleKeyboardShortcut(event, context);

    assert.strictEqual(event.preventDefault.mock.callCount(), 1);
    assert.strictEqual(actions.clearFocus.mock.callCount(), 1);
});

test('Ignores input when isInput is true (and not Escape)', (t) => {
    const actions = createMockActions();
    const context: KeyboardShortcutContext = {
        state: createMockState(),
        focusedId: null,
        isInput: true,
        actions
    };
    const event = { key: 'j', preventDefault: t.mock.fn() };

    handleKeyboardShortcut(event, context);

    assert.strictEqual(event.preventDefault.mock.callCount(), 0);
    assert.strictEqual(actions.moveDown.mock.callCount(), 0);
});

test('Action - x toggles completion', (t) => {
    const bullet = createMockBullet('b1', { state: 'open' });
    const actions = createMockActions();
    const context: KeyboardShortcutContext = {
        state: createMockState({ [bullet.id]: bullet }),
        focusedId: bullet.id,
        isInput: false,
        actions
    };
    const event = { key: 'x', preventDefault: t.mock.fn() };

    handleKeyboardShortcut(event, context);

    assert.strictEqual(event.preventDefault.mock.callCount(), 1);
    assert.strictEqual(actions.dispatch.mock.callCount(), 1);
    const call = actions.dispatch.mock.calls[0];
    assert.deepStrictEqual(call.arguments[0], {
        type: 'UPDATE_BULLET',
        payload: { id: 'b1', state: 'completed' }
    });
});

test('Action - x toggles completion (completed -> open)', (t) => {
    const bullet = createMockBullet('b1', { state: 'completed' });
    const actions = createMockActions();
    const context: KeyboardShortcutContext = {
        state: createMockState({ [bullet.id]: bullet }),
        focusedId: bullet.id,
        isInput: false,
        actions
    };
    const event = { key: 'x', preventDefault: t.mock.fn() };

    handleKeyboardShortcut(event, context);

    assert.strictEqual(actions.dispatch.mock.callCount(), 1);
    const call = actions.dispatch.mock.calls[0];
    assert.deepStrictEqual(call.arguments[0], {
        type: 'UPDATE_BULLET',
        payload: { id: 'b1', state: 'open' }
    });
});

test('Action - n opens note', (t) => {
    const bullet = createMockBullet('b1');
    const actions = createMockActions();
    const context: KeyboardShortcutContext = {
        state: createMockState({ [bullet.id]: bullet }),
        focusedId: bullet.id,
        isInput: false,
        actions
    };
    const event = { key: 'n', preventDefault: t.mock.fn() };

    handleKeyboardShortcut(event, context);

    assert.strictEqual(event.preventDefault.mock.callCount(), 1);
    assert.strictEqual(actions.openNote.mock.callCount(), 1);
    assert.strictEqual(actions.openNote.mock.calls[0].arguments[0], 'b1');
});

test('Action - m prompts migrate', (t) => {
    const bullet = createMockBullet('b1');
    const actions = createMockActions();
    const context: KeyboardShortcutContext = {
        state: createMockState({ [bullet.id]: bullet }),
        focusedId: bullet.id,
        isInput: false,
        actions
    };
    const event = { key: 'm', preventDefault: t.mock.fn() };

    handleKeyboardShortcut(event, context);

    assert.strictEqual(event.preventDefault.mock.callCount(), 1);
    assert.strictEqual(actions.onMigratePrompt.mock.callCount(), 1);
    assert.strictEqual(actions.onMigratePrompt.mock.calls[0].arguments[0], 'b1');
});

test('Action - d requests confirmation', (t) => {
    const bullet = createMockBullet('b1');
    const actions = createMockActions();
    const context: KeyboardShortcutContext = {
        state: createMockState({ [bullet.id]: bullet }),
        focusedId: bullet.id,
        isInput: false,
        actions
    };
    const event = { key: 'd', preventDefault: t.mock.fn() };

    handleKeyboardShortcut(event, context);

    assert.strictEqual(event.preventDefault.mock.callCount(), 1);
    assert.strictEqual(actions.requestConfirmation.mock.callCount(), 1);
    const args = actions.requestConfirmation.mock.calls[0].arguments[0];
    assert.strictEqual(args.title, 'Delete Item');
    assert.strictEqual(args.isDanger, true);
    assert.strictEqual(typeof args.onConfirm, 'function');

    // Test the callback
    args.onConfirm();
    assert.strictEqual(actions.dispatch.mock.callCount(), 1);
    assert.deepStrictEqual(actions.dispatch.mock.calls[0].arguments[0], {
        type: 'DELETE_BULLET',
        payload: { id: 'b1' }
    });
});

test('Action - e sets editing id', (t) => {
    const bullet = createMockBullet('b1');
    const actions = createMockActions();
    const context: KeyboardShortcutContext = {
        state: createMockState({ [bullet.id]: bullet }),
        focusedId: bullet.id,
        isInput: false,
        actions
    };
    const event = { key: 'e', preventDefault: t.mock.fn() };

    handleKeyboardShortcut(event, context);

    assert.strictEqual(event.preventDefault.mock.callCount(), 1);
    assert.strictEqual(actions.setEditingId.mock.callCount(), 1);
    assert.strictEqual(actions.setEditingId.mock.calls[0].arguments[0], 'b1');
});

test('No action if not focused', (t) => {
    const actions = createMockActions();
    const context: KeyboardShortcutContext = {
        state: createMockState(),
        focusedId: null,
        isInput: false,
        actions
    };
    const event = { key: 'x', preventDefault: t.mock.fn() };

    handleKeyboardShortcut(event, context);

    assert.strictEqual(event.preventDefault.mock.callCount(), 0);
    assert.strictEqual(actions.dispatch.mock.callCount(), 0);
});

test('Keyboard Shortcuts - Ctrl+Z dispatches UNDO', (t) => {
    const actions = createMockActions();
    const context: KeyboardShortcutContext = {
        state: createMockState(),
        focusedId: null,
        isInput: false,
        actions
    };
    const event = { key: 'z', ctrlKey: true, metaKey: false, preventDefault: t.mock.fn() };

    // @ts-expect-error - Mock event
    handleKeyboardShortcut(event, context);

    assert.strictEqual(event.preventDefault.mock.callCount(), 1);
    assert.strictEqual(actions.dispatch.mock.callCount(), 1);
    assert.deepStrictEqual(actions.dispatch.mock.calls[0].arguments[0], { type: 'UNDO' });
});

test('Keyboard Shortcuts - Meta+Z dispatches UNDO', (t) => {
    const actions = createMockActions();
    const context: KeyboardShortcutContext = {
        state: createMockState(),
        focusedId: null,
        isInput: false,
        actions
    };
    const event = { key: 'z', ctrlKey: false, metaKey: true, preventDefault: t.mock.fn() };

    // @ts-expect-error - Mock event
    handleKeyboardShortcut(event, context);

    assert.strictEqual(event.preventDefault.mock.callCount(), 1);
    assert.strictEqual(actions.dispatch.mock.callCount(), 1);
    assert.deepStrictEqual(actions.dispatch.mock.calls[0].arguments[0], { type: 'UNDO' });
});

test('Keyboard Shortcuts - Ctrl+Z is ignored if isInput is true', (t) => {
    const actions = createMockActions();
    const context: KeyboardShortcutContext = {
        state: createMockState(),
        focusedId: null,
        isInput: true,
        actions
    };
    const event = { key: 'z', ctrlKey: true, metaKey: false, preventDefault: t.mock.fn() };

    // @ts-expect-error - Mock event
    handleKeyboardShortcut(event, context);

    assert.strictEqual(event.preventDefault.mock.callCount(), 0);
    assert.strictEqual(actions.dispatch.mock.callCount(), 0);
});

test('No action if focused bullet does not exist', (t) => {
    const actions = createMockActions();
    const context: KeyboardShortcutContext = {
        state: createMockState(),
        focusedId: 'non-existent',
        isInput: false,
        actions
    };
    const event = { key: 'x', preventDefault: t.mock.fn() };

    handleKeyboardShortcut(event, context);

    assert.strictEqual(event.preventDefault.mock.callCount(), 0);
    assert.strictEqual(actions.dispatch.mock.callCount(), 0);
});
