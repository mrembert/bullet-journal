import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { useStore } from '../../store';
import { Square, CheckSquare, X } from 'lucide-react';
import React from 'react';

const TaskItemComponent = (props: any) => {
    const { state, dispatch } = useStore();
    const { node, editor, getPos } = props;
    const bulletId = node.attrs.bulletId;
    const bullet = state.bullets[bulletId];
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Use local state for the input to prevent keystroke lag
    const [localContent, setLocalContent] = React.useState(bullet?.content || '');

    // Sync from store → local when store changes externally
    React.useEffect(() => {
        if (bullet && bullet.content !== localContent) {
            setLocalContent(bullet.content);
        }
    }, [bullet?.content]);

    // Auto-focus newly inserted tasks
    React.useEffect(() => {
        if (node.attrs.autoFocus && inputRef.current) {
            const timer = setTimeout(() => inputRef.current?.focus(), 50);
            return () => clearTimeout(timer);
        }
    }, []);

    if (!bullet) {
        return (
            <NodeViewWrapper className="react-component-with-content">
                <span style={{ color: 'red', fontStyle: 'italic', opacity: 0.6 }}>[Task removed]</span>
            </NodeViewWrapper>
        );
    }

    const toggleTask = () => {
        const newState = bullet.state === 'completed' ? 'open' : 'completed';
        dispatch({ type: 'UPDATE_BULLET', payload: { id: bulletId, state: newState } });
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalContent(e.target.value);
        dispatch({ type: 'UPDATE_BULLET', payload: { id: bulletId, content: e.target.value } });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // CRITICAL: Stop Tiptap/ProseMirror from intercepting keyboard events
        // inside this native <input>. Without this, keys like Space get swallowed.
        e.stopPropagation();

        if (e.key === 'Enter') {
            e.preventDefault();
            const pos = getPos();
            const nodeSize = node.nodeSize;
            editor.chain().focus().insertContentAt(pos + nodeSize, { type: 'paragraph' }).run();
        }
    };

    const handleDelete = (e: React.MouseEvent) => {
        // Prevent click from bubbling to overlay (which would close the note)
        e.stopPropagation();
        e.preventDefault();
        // Remove the node from the editor (no focus() to avoid event issues)
        const pos = getPos();
        const nodeSize = node.nodeSize;
        editor.view.dispatch(
            editor.state.tr.delete(pos, pos + nodeSize)
        );
        // Delete the bullet from the store
        dispatch({ type: 'DELETE_BULLET', payload: { id: bulletId } });
    };

    return (
        <NodeViewWrapper className="react-component-with-content" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
            <button
                onClick={toggleTask}
                contentEditable={false}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    color: bullet.state === 'completed' ? 'hsl(var(--color-primary))' : 'hsl(var(--color-text-secondary))'
                }}
            >
                {bullet.state === 'completed' ? <CheckSquare size={18} /> : <Square size={18} />}
            </button>
            <input
                ref={inputRef}
                type="text"
                value={localContent}
                onChange={handleContentChange}
                onKeyDown={handleKeyDown}
                placeholder="Task name..."
                style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    flex: 1,
                    textDecoration: bullet.state === 'completed' ? 'line-through' : 'none',
                    color: bullet.state === 'completed' ? 'hsl(var(--color-text-secondary))' : 'inherit',
                    fontFamily: 'inherit',
                    fontSize: 'inherit'
                }}
            />
            <button
                onClick={handleDelete}
                contentEditable={false}
                title="Remove task"
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    color: 'hsl(var(--color-text-secondary) / 0.4)',
                    transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'hsl(var(--color-danger))')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'hsl(var(--color-text-secondary) / 0.4)')}
            >
                <X size={16} />
            </button>
        </NodeViewWrapper>
    );
};

export interface TaskExtensionOptions {
    onCreateTask: (content?: string) => string;
}

export const TaskExtension = Node.create<TaskExtensionOptions>({
    name: 'embeddedTask',
    group: 'block',
    atom: true,

    addOptions() {
        return {
            onCreateTask: () => 'error-no-id-generator',
        };
    },

    addAttributes() {
        return {
            bulletId: { default: null },
            autoFocus: { default: false },
        };
    },

    parseHTML() {
        return [{ tag: 'div[data-type="embedded-task"]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'embedded-task' })];
    },

    addNodeView() {
        return ReactNodeViewRenderer(TaskItemComponent);
    },

    // Task creation via keyboard shortcut: Ctrl+.
    addKeyboardShortcuts() {
        return {
            'Mod-.': () => {
                const bulletId = this.options.onCreateTask();
                return this.editor.chain()
                    .insertContent({
                        type: this.name,
                        attrs: { bulletId, autoFocus: true },
                    })
                    .run();
            },
        };
    },
});
