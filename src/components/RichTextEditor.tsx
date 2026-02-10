import React, { useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { TaskExtension } from './extensions/TaskExtension';
import { Bold, Italic, List, ListOrdered, CheckSquare, Link as LinkIcon, Underline as UnderlineIcon } from 'lucide-react';

interface RichTextEditorProps {
    content: string; // JSON string or plain text
    onChange: (json: string) => void;
    onCreateTask: (content?: string) => string; // Returns new bullet ID
    onSaveAndClose?: () => void; // Ctrl+Enter shortcut
}

function RichTextEditorInner({ content, onChange, onCreateTask, onSaveAndClose }: RichTextEditorProps) {
    // Parse initial content once on mount
    const initialContent = useMemo(() => {
        try {
            return JSON.parse(content);
        } catch {
            return content || '';
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only parse once on mount

    // Memoize extensions so useEditor doesn't re-initialize
    const extensions = useMemo(() => [
        StarterKit,
        Placeholder.configure({
            placeholder: 'Type your notes here... (Ctrl+. to insert a task)',
        }),
        Link.configure({
            openOnClick: false,
        }),
        Underline,
        TaskExtension.configure({
            onCreateTask,
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ], []); // Stable reference

    const editor = useEditor({
        extensions,
        content: initialContent,
        autofocus: 'end',
        immediatelyRender: false,
        parseOptions: {
            preserveWhitespace: 'full',
        },
        editorProps: {
            handleKeyDown: (view, event) => {
                // Explicitly handle space key — ProseMirror/Tiptap can swallow it
                // in certain configurations with React node views
                if (event.key === ' ' || event.code === 'Space') {
                    if (!event.ctrlKey && !event.metaKey && !event.altKey) {
                        event.preventDefault();
                        view.dispatch(view.state.tr.insertText(' '));
                        return true;
                    }
                }
                // Ctrl+Enter to save and close
                if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                    event.preventDefault();
                    onSaveAndClose?.();
                    return true;
                }
                return false;
            },
        },
        onUpdate: ({ editor }) => {
            const json = JSON.stringify(editor.getJSON());
            onChange(json);
        },
    });

    if (!editor) {
        return null;
    }

    const insertTask = () => {
        const bulletId = onCreateTask();
        editor.chain().focus().insertContent({
            type: 'embeddedTask',
            attrs: { bulletId, autoFocus: true },
        }).run();
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Toolbar */}
            <div style={{
                display: 'flex',
                gap: '4px',
                padding: '8px',
                borderBottom: '1px solid hsl(var(--color-text-secondary) / 0.1)',
                backgroundColor: 'hsl(var(--color-bg-secondary) / 0.5)',
                flexWrap: 'wrap',
            }}>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    active={editor.isActive('bold')}
                    title="Bold (Ctrl+B)"
                >
                    <Bold size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    active={editor.isActive('italic')}
                    title="Italic (Ctrl+I)"
                >
                    <Italic size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    active={editor.isActive('underline')}
                    title="Underline (Ctrl+U)"
                >
                    <UnderlineIcon size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => {
                        const previousUrl = editor.getAttributes('link').href;
                        const url = window.prompt('URL', previousUrl);
                        if (url === null) return;
                        if (url === '') {
                            editor.chain().focus().extendMarkRange('link').unsetLink().run();
                            return;
                        }
                        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
                    }}
                    active={editor.isActive('link')}
                    title="Link"
                >
                    <LinkIcon size={18} />
                </ToolbarButton>

                <ToolbarDivider />

                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    active={editor.isActive('bulletList')}
                    title="Bullet List"
                >
                    <List size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    active={editor.isActive('orderedList')}
                    title="Ordered List"
                >
                    <ListOrdered size={18} />
                </ToolbarButton>

                <ToolbarDivider />

                <ToolbarButton
                    onClick={insertTask}
                    title="Insert Task (Ctrl+.)"
                    accent
                >
                    <CheckSquare size={18} />
                </ToolbarButton>
            </div>

            {/* Editor */}
            <EditorContent editor={editor} style={{ flex: 1, overflow: 'auto', padding: '16px' }} />

            {/* Scoped ProseMirror styles */}
            <style>{`
                .ProseMirror {
                    outline: none;
                    height: 100%;
                    min-height: 200px;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                }
                .ProseMirror p.is-editor-empty:first-child::before {
                    color: hsl(var(--color-text-secondary));
                    content: attr(data-placeholder);
                    float: left;
                    height: 0;
                    pointer-events: none;
                }
                .ProseMirror ul, .ProseMirror ol {
                    padding-left: 1.5rem;
                }
                .ProseMirror a {
                    color: hsl(var(--color-accent));
                    text-decoration: underline;
                    cursor: pointer;
                }
            `}</style>
        </div>
    );
}

// Small helper components for the toolbar
function ToolbarButton({ onClick, active, title, accent, children }: {
    onClick: () => void;
    active?: boolean;
    title: string;
    accent?: boolean;
    children: React.ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            className="btn btn-ghost"
            style={{
                padding: '4px',
                height: 'auto',
                backgroundColor: active ? 'hsl(var(--color-bg-secondary))' : 'transparent',
                color: accent ? 'hsl(var(--color-accent))' : undefined,
            }}
            title={title}
        >
            {children}
        </button>
    );
}

function ToolbarDivider() {
    return (
        <div style={{
            width: '1px',
            backgroundColor: 'hsl(var(--color-text-secondary) / 0.2)',
            margin: '0 4px',
        }} />
    );
}

// Wrap in React.memo to prevent re-renders from parent state changes
export const RichTextEditor = React.memo(RichTextEditorInner);
