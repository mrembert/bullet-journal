
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store';
import { filterStateForExport, type ExportOptions } from '../lib/exportUtils';
import { X, Check, Download, Calendar, Folder } from 'lucide-react';

interface ExportDialogProps {
    onClose: () => void;
}

export function ExportDialog({ onClose }: ExportDialogProps) {
    const { state } = useStore();
    const [dateRange, setDateRange] = useState<ExportOptions['dateRange']>('all');
    // Track excluded projects (initially empty = include all)
    const [excludedProjects, setExcludedProjects] = useState<Set<string>>(new Set());
    const [isExporting, setIsExporting] = useState(false);

    // Get all projects sorted by order or creation
    const projects = Object.values(state.collections)
        .filter(c => c.type === 'project')
        .sort((a, b) => {
            if (a.order !== undefined && b.order !== undefined) {
                return a.order - b.order;
            }
            return b.createdAt - a.createdAt;
        });

    const toggleProject = (id: string) => {
        const newExcluded = new Set(excludedProjects);
        if (newExcluded.has(id)) {
            newExcluded.delete(id);
        } else {
            newExcluded.add(id);
        }
        setExcludedProjects(newExcluded);
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const filteredState = await filterStateForExport(state, {
                dateRange,
                excludedCollectionIds: Array.from(excludedProjects)
            });

            const dataStr = JSON.stringify(filteredState, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `bujo-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            onClose();
        } catch (error) {
            console.error('Export failed', error);
            alert('Export failed. See console for details.');
        } finally {
            setIsExporting(false);
        }
    };

    // Style helpers
    const sectionTitleStyle = {
        fontSize: '0.85rem',
        fontWeight: 600,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
        color: 'hsl(var(--color-text-secondary))',
        marginBottom: '0.75rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
    };

    const radioLabelStyle = (active: boolean) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 0.75rem',
        borderRadius: 'var(--radius-sm)',
        cursor: 'pointer',
        backgroundColor: active ? 'hsl(var(--color-accent) / 0.1)' : 'transparent',
        color: active ? 'hsl(var(--color-accent))' : 'hsl(var(--color-text-primary))',
        border: active ? '1px solid hsl(var(--color-accent) / 0.3)' : '1px solid transparent',
        transition: 'all 0.2s ease',
        fontSize: '0.9rem'
    });

    return createPortal(
        <div className="picker-overlay" onClick={onClose}>
            <div onClick={e => e.stopPropagation()}>
                <div
                    className="picker-panel"
                    style={{ width: '500px', maxWidth: '90vw', padding: '1.5rem' }}
                >
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1.5rem',
                        borderBottom: '1px solid hsl(var(--color-text-secondary) / 0.1)',
                        paddingBottom: '1rem'
                    }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Download size={20} /> Export Backup
                        </h2>
                        <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'hsl(var(--color-text-secondary))' }}>
                            <X size={20} />
                        </button>
                    </div>

                    {/* Date Range Selection */}
                    <div style={{ marginBottom: '2rem' }}>
                        <div style={sectionTitleStyle}>
                            <Calendar size={14} /> Date Range
                        </div>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            <label style={radioLabelStyle(dateRange === 'all')}>
                                <input
                                    type="radio"
                                    name="dateRange"
                                    value="all"
                                    checked={dateRange === 'all'}
                                    onChange={() => setDateRange('all')}
                                    style={{ accentColor: 'hsl(var(--color-accent))' }}
                                />
                                All Time
                            </label>
                            <label style={radioLabelStyle(dateRange === 'this-week')}>
                                <input
                                    type="radio"
                                    name="dateRange"
                                    value="this-week"
                                    checked={dateRange === 'this-week'}
                                    onChange={() => setDateRange('this-week')}
                                    style={{ accentColor: 'hsl(var(--color-accent))' }}
                                />
                                This Week (Mon - Sun)
                            </label>
                            <label style={radioLabelStyle(dateRange === 'past-30-days')}>
                                <input
                                    type="radio"
                                    name="dateRange"
                                    value="past-30-days"
                                    checked={dateRange === 'past-30-days'}
                                    onChange={() => setDateRange('past-30-days')}
                                    style={{ accentColor: 'hsl(var(--color-accent))' }}
                                />
                                Past 30 Days
                            </label>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-secondary))', marginTop: '0.5rem', marginLeft: '0.5rem' }}>
                            * Undated items in Open Tasks/Backlog are always included.
                        </p>
                    </div>

                    {/* Project Selection */}
                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <div style={{ ...sectionTitleStyle, marginBottom: 0 }}>
                                <Folder size={14} /> Projects
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    className="btn-ghost"
                                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', height: 'auto' }}
                                    onClick={() => setExcludedProjects(new Set())}
                                >
                                    Select All
                                </button>
                                <button
                                    className="btn-ghost"
                                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', height: 'auto' }}
                                    onClick={() => setExcludedProjects(new Set(projects.map(p => p.id)))}
                                >
                                    Deselect All
                                </button>
                            </div>
                        </div>

                        <div style={{
                            maxHeight: '200px',
                            overflowY: 'auto',
                            border: '1px solid hsl(var(--color-text-secondary) / 0.2)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.5rem'
                        }}>
                            {projects.length === 0 ? (
                                <div style={{ padding: '1rem', textAlign: 'center', color: 'hsl(var(--color-text-secondary))', fontSize: '0.9rem' }}>
                                    No projects found.
                                </div>
                            ) : (
                                projects.map(project => {
                                    const isIncluded = !excludedProjects.has(project.id);
                                    return (
                                        <label
                                            key={project.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.75rem',
                                                padding: '0.5rem',
                                                cursor: 'pointer',
                                                borderRadius: 'var(--radius-sm)',
                                                transition: 'background-color 0.2s',
                                            }}
                                            className="project-checkbox-item"
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'hsl(var(--color-bg-primary))'}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <div style={{
                                                width: '18px',
                                                height: '18px',
                                                border: isIncluded ? 'none' : '2px solid hsl(var(--color-text-secondary) / 0.5)',
                                                borderRadius: '4px',
                                                backgroundColor: isIncluded ? 'hsl(var(--color-accent))' : 'transparent',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'all 0.2s'
                                            }}>
                                                {isIncluded && <Check size={12} color="white" />}
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={isIncluded}
                                                onChange={() => toggleProject(project.id)}
                                                style={{ display: 'none' }}
                                            />
                                            <span style={{ fontSize: '0.9rem', color: isIncluded ? 'hsl(var(--color-text-primary))' : 'hsl(var(--color-text-secondary))' }}>
                                                {project.title}
                                            </span>
                                        </label>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Footer actions */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                        <button
                            onClick={onClose}
                            className="btn btn-ghost"
                            disabled={isExporting}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleExport}
                            className="btn btn-primary"
                            disabled={isExporting}
                            style={{ minWidth: '100px', justifyContent: 'center' }}
                        >
                            {isExporting ? 'Exporting...' : 'Export'}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
