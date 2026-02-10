import React, { useState } from 'react';
import { Circle, X, Minus, ChevronRight, ArrowRight, Trash, FileText } from 'lucide-react';
import type { Bullet } from '../types';
import { useStore } from '../store';
import { MigrationPicker } from './MigrationPicker';
import { NoteEditor } from './NoteEditor';

interface BulletItemProps {
    bullet: Bullet;
}

export function BulletItem({ bullet }: BulletItemProps) {
    const { dispatch } = useStore();
    const [showMigration, setShowMigration] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [showNoteEditor, setShowNoteEditor] = useState(false);

    const toggleState = () => {
        if (bullet.state === 'open') {
            dispatch({ type: 'UPDATE_BULLET', payload: { id: bullet.id, state: 'completed' } });
        } else if (bullet.state === 'completed') {
            dispatch({ type: 'UPDATE_BULLET', payload: { id: bullet.id, state: 'open' } });
        }
    };

    const handleMigrate = (targetDate: string) => {
        dispatch({ type: 'MIGRATE_BULLET', payload: { id: bullet.id, targetDate } });
        setShowMigration(false);
    };

    const getIcon = () => {
        switch (bullet.type) {
            case 'task':
                if (bullet.state === 'completed') return <X size={18} />;
                if (bullet.state === 'migrated') return <ChevronRight size={18} />;
                return <span style={{ fontSize: '24px', lineHeight: '18px' }}>•</span>;
            case 'event':
                return <Circle size={16} fill={bullet.state === 'completed' ? 'currentColor' : 'none'} />;
            case 'note':
                return <Minus size={18} />;
            default:
                return <span style={{ fontSize: '24px', lineHeight: '18px' }}>•</span>;
        }
    };

    const isCompleted = bullet.state === 'completed';
    const isMigrated = bullet.state === 'migrated';
    const hasNote = !!bullet.longFormContent;

    return (
        <>
            <div
                className={`task-item ${isCompleted ? 'completed' : ''}`}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.5rem 0',
                    opacity: isMigrated ? 0.5 : 1,
                    textDecoration: isCompleted ? 'line-through' : 'none',
                    color: isCompleted || isMigrated ? 'hsl(var(--color-text-secondary))' : 'inherit',
                    position: 'relative'
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => { setIsHovered(false); if (!showMigration) setShowMigration(false); }}
            >
                <button
                    onClick={toggleState}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: bullet.type === 'task' ? 'hsl(var(--color-accent))' : 'inherit',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        padding: 0
                    }}
                >
                    {getIcon()}
                </button>

                <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {bullet.content}
                    {hasNote && (
                        <button
                            onClick={() => setShowNoteEditor(true)}
                            className="btn btn-ghost"
                            style={{
                                padding: '0.1rem',
                                height: 'auto',
                                color: 'hsl(var(--color-accent))',
                                opacity: 0.8
                            }}
                            title="View/Edit Note"
                        >
                            <FileText size={14} />
                        </button>
                    )}
                </span>

                {/* Actions that appear on hover */}
                {isHovered && !hasNote && (
                    <button
                        onClick={() => setShowNoteEditor(true)}
                        className="btn btn-ghost"
                        style={{
                            padding: '0.25rem',
                            height: 'auto',
                            color: 'hsl(var(--color-text-secondary))',
                            opacity: 0.5
                        }}
                        title="Add Note"
                    >
                        <FileText size={14} />
                    </button>
                )}

                {/* Migration Action - Only for open tasks */}
                {bullet.type === 'task' && !isCompleted && !isMigrated && (isHovered || showMigration) && (
                    <div style={{ position: 'relative', display: 'flex', gap: '0.25rem' }}>
                        <button
                            onClick={() => setShowMigration(!showMigration)}
                            className="btn btn-ghost"
                            style={{ padding: '0.25rem', height: 'auto', color: 'hsl(var(--color-text-secondary))' }}
                            title="Migrate"
                        >
                            <ArrowRight size={16} />
                        </button>
                        {showMigration && (
                            <MigrationPicker
                                onSelectDate={handleMigrate}
                                onCancel={() => setShowMigration(false)}
                            />
                        )}
                        <button
                            onClick={() => {
                                if (window.confirm('Delete this item?')) {
                                    dispatch({ type: 'DELETE_BULLET', payload: { id: bullet.id } });
                                }
                            }}
                            className="btn btn-ghost"
                            style={{ padding: '0.25rem', height: 'auto', color: 'hsl(var(--color-danger))' }}
                            title="Delete"
                        >
                            <Trash size={16} />
                        </button>
                    </div>
                )}
                {/* Delete Action for non-migratable items (notes, events, completed) */}
                {((bullet.type !== 'task' || isCompleted || isMigrated) && isHovered) && (
                    <button
                        onClick={() => {
                            if (window.confirm('Delete this item?')) {
                                dispatch({ type: 'DELETE_BULLET', payload: { id: bullet.id } });
                            }
                        }}
                        className="btn btn-ghost"
                        style={{ padding: '0.25rem', height: 'auto', color: 'hsl(var(--color-danger))' }}
                        title="Delete"
                    >
                        <Trash size={16} />
                    </button>
                )}
            </div>

            {showNoteEditor && (
                <NoteEditor bulletId={bullet.id} onClose={() => setShowNoteEditor(false)} />
            )}
        </>
    );
}
