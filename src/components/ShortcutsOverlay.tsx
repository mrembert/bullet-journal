
import { X, Keyboard } from 'lucide-react';

interface ShortcutsOverlayProps {
    onClose: () => void;
}

export function ShortcutsOverlay({ onClose }: ShortcutsOverlayProps) {
    const shortcuts = [
        { key: 'j / ↓', desc: 'Focus next item' },
        { key: 'k / ↑', desc: 'Focus previous item' },
        { key: 'x', desc: 'Toggle done on focused item' },
        { key: 'n', desc: 'Open note for focused item' },
        { key: 'm', desc: 'Migrate focused item' },
        { key: 'd', desc: 'Delete focused item' },
        { key: 'Escape', desc: 'Clear focus / Close menu' },
        { key: 'Enter', desc: 'Add item from input field' },
        { key: 'Ctrl + .', desc: 'Insert task while writing note' },
        { key: 'Ctrl + Enter', desc: 'Save and close note editor' },
    ];

    return (
        <div className="picker-overlay" onClick={onClose} style={{ zIndex: 10001 }}>
            <div
                className="picker-panel"
                onClick={e => e.stopPropagation()}
                style={{
                    width: '400px',
                    maxWidth: '90vw',
                    maxHeight: '80vh',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem',
                    padding: '0.5rem'
                }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Keyboard size={24} /> Keyboard Shortcuts
                    </h2>
                    <button onClick={onClose} className="btn btn-ghost" style={{ padding: '0.25rem' }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ overflowY: 'auto', flex: 1, padding: '0 0.5rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                            {shortcuts.map((s, i) => (
                                <tr key={i} style={{ borderBottom: i === shortcuts.length - 1 ? 'none' : '1px solid hsl(var(--color-text-secondary) / 0.1)' }}>
                                    <td style={{ padding: '0.75rem 0', verticalAlign: 'middle' }}>
                                        <code style={{
                                            background: 'hsl(var(--color-bg-primary))',
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: '4px',
                                            fontSize: '0.85rem',
                                            color: 'hsl(var(--color-accent))',
                                            fontWeight: 600
                                        }}>
                                            {s.key}
                                        </code>
                                    </td>
                                    <td style={{ padding: '0.75rem 0.5rem', color: 'hsl(var(--color-text-primary))', fontSize: '0.9rem' }}>
                                        {s.desc}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', color: 'hsl(var(--color-text-secondary))', fontSize: '0.8rem', opacity: 0.7 }}>
                    Press any shortcut to execute. Press Esc to close this overview.
                </div>
            </div>
        </div>
    );
}
