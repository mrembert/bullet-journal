
import { BookOpen, Star, Columns, Calendar, List, Edit3, ArrowRight, X, Search, Archive, FileText, FolderInput, Keyboard, Moon, Download, CheckSquare, MoreVertical, MessageSquare } from 'lucide-react';

export function HelpPage() {
    const sectionStyle = { marginBottom: '4rem' };
    const h2Style = { fontSize: '2rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex' as const, alignItems: 'center' as const, gap: '0.5rem' };
    const cardStyle = { padding: '1.5rem', border: '1px solid hsl(var(--color-text-secondary) / 0.2)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' };
    const h3Style = { fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' };
    const pStyle = { marginBottom: '1rem', lineHeight: 1.7, color: 'hsl(var(--color-text-secondary))' };
    const iconListItemStyle = { display: 'flex' as const, alignItems: 'center' as const, gap: '0.75rem', marginBottom: '0.5rem' };
    const tipStyle = {
        padding: '1rem 1.25rem',
        borderLeft: '3px solid hsl(var(--color-accent))',
        backgroundColor: 'hsl(var(--color-bg-secondary))',
        borderRadius: '0 var(--radius-md) var(--radius-md) 0',
        marginBottom: '1rem',
        fontSize: '0.95rem',
        lineHeight: 1.6,
        color: 'hsl(var(--color-text-secondary))'
    };

    return (
        <div className="help-page" style={{ maxWidth: '800px', margin: '0 auto', color: 'hsl(var(--color-text-primary))' }}>
            {/* Header */}
            <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
                <h1 className="section-title" style={{ marginBottom: '1rem' }}>Welcome to Last Task</h1>
                <p style={{ fontSize: '1.15rem', color: 'hsl(var(--color-text-secondary))', maxWidth: '650px', margin: '0 auto', lineHeight: 1.7 }}>
                    A digital bullet journal built around the <strong>Bullet Journal® method</strong> — a mindfulness practice disguised as a productivity system. If you've never used a bullet journal before, this guide will get you started.
                </p>
            </header>

            {/* What is the Bullet Journal Method? */}
            <section style={sectionStyle}>
                <h2 style={h2Style}>
                    <BookOpen size={28} /> What is the Bullet Journal Method?
                </h2>
                <div style={pStyle}>
                    The Bullet Journal (BuJo) method was invented by Ryder Carroll as a way to organize the present, reflect on the past, and plan for the future. At its core, it's about <strong>intentionality</strong>: instead of trying to capture everything, you focus on what matters.
                </div>
                <div style={pStyle}>
                    In a traditional paper bullet journal, you write in a single notebook — one page at a time, one day at a time. You don't organize up front; instead, you <strong>capture first, organize later</strong>. This removes the friction of deciding "where does this go?" and replaces it with a simple rule: write it down now, sort it out later.
                </div>
                <div style={tipStyle}>
                    <strong>The key insight:</strong> The act of manually reviewing and migrating tasks forces you to confront what's truly important. If a task isn't worth rewriting, it's probably not worth doing.
                </div>
            </section>

            {/* Rapid Logging: The Core */}
            <section style={sectionStyle}>
                <h2 style={h2Style}>
                    <Edit3 size={28} /> Rapid Logging
                </h2>
                <div style={pStyle}>
                    Rapid Logging is the language of the bullet journal. Instead of writing long sentences, you use short, objective bullets combined with a small set of symbols to categorize each entry. Everything you capture falls into one of three types:
                </div>
                <div className="card" style={cardStyle}>
                    <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.75rem' }}>
                        <li style={iconListItemStyle}>
                            <span style={{ fontSize: '1.5rem', lineHeight: 1, color: 'hsl(var(--color-accent))', width: '24px', textAlign: 'center' }}>•</span>
                            <div>
                                <strong>Tasks</strong> — Things you need to do. These are your actionable items (e.g., "Call dentist", "Ship v2 feature", "Buy groceries"). Tasks are the backbone of bullet journaling.
                            </div>
                        </li>
                        <li style={iconListItemStyle}>
                            <span style={{ fontSize: '1.5rem', lineHeight: 1, width: '24px', textAlign: 'center' }}>◦</span>
                            <div>
                                <strong>Events</strong> — Things that happened or are scheduled. These are date-related entries (e.g., "Team standup 10am", "Birthday party").
                            </div>
                        </li>
                        <li style={iconListItemStyle}>
                            <span style={{ fontSize: '1.5rem', lineHeight: 1, width: '24px', textAlign: 'center' }}>-</span>
                            <div>
                                <strong>Notes</strong> — Facts, ideas, and observations. Things you want to remember but aren't actionable (e.g., "New podcast idea", "Meeting takeaway").
                            </div>
                        </li>
                    </ul>
                </div>
                <div style={tipStyle}>
                    <strong>Shortcut:</strong> When adding items, you can type a prefix to set the type automatically: <code>•</code> or <code>.</code> for tasks, <code>o</code> or <code>○</code> for events, and <code>-</code> for notes. Without a prefix, items default to tasks.
                </div>
            </section>

            {/* Task States & Migration */}
            <section style={sectionStyle}>
                <h2 style={h2Style}>
                    <ArrowRight size={28} /> Task States & Migration
                </h2>
                <div style={pStyle}>
                    Tasks aren't static — they change state as you work through them. This is the beating heart of the method.
                </div>
                <div className="card" style={cardStyle}>
                    <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.75rem' }}>
                        <li style={iconListItemStyle}>
                            <span style={{ fontSize: '1.5rem', lineHeight: 1, color: 'hsl(var(--color-accent))', width: '24px', textAlign: 'center' }}>•</span>
                            <span><strong>Open:</strong> A task waiting to be done.</span>
                        </li>
                        <li style={iconListItemStyle}>
                            <X size={18} style={{ width: '24px' }} />
                            <span><strong>Completed:</strong> Done! Click the bullet icon to mark a task complete.</span>
                        </li>
                        <li style={iconListItemStyle}>
                            <ArrowRight size={18} style={{ width: '24px' }} />
                            <span><strong>Migrated:</strong> Moved to a future date or the Future Log. This is how you intentionally reschedule.</span>
                        </li>
                    </ul>
                </div>
                <div style={pStyle}>
                    <strong>Migration</strong> is the most important part of the system. When a task isn't done at the end of the day, you have a choice: Is it still worth doing? If yes, migrate it forward — pick a new date from the quick options (Tomorrow, Next Week, Next Month) or choose a custom date. If it's not worth doing, delete it. This intentional friction helps you shed tasks that don't actually matter.
                </div>
            </section>

            {/* App Views */}
            <section style={sectionStyle}>
                <h2 style={h2Style}>
                    <Star size={28} /> App Views
                </h2>
                <div style={pStyle}>
                    The app gives you four main "lenses" to view your journal, alongside a few utility views. Use the sidebar to navigate.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                    <div className="card" style={cardStyle}>
                        <h3 style={{ ...h3Style, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Star size={20} color="hsl(var(--color-accent))" /> Today (Daily Log)
                        </h3>
                        <p style={{ ...pStyle, marginBottom: 0 }}>
                            Your main workspace. Capture everything here as it happens — tasks, events, notes. Don't worry about organizing; just get it out of your head. You can toggle between a flat list or group items by project, and show or hide completed tasks.
                        </p>
                    </div>
                    <div className="card" style={cardStyle}>
                        <h3 style={{ ...h3Style, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Columns size={20} /> Week View
                        </h3>
                        <p style={{ ...pStyle, marginBottom: 0 }}>
                            Zoom out to see your whole week at a glance. Great for planning ahead or reviewing what you've accomplished over the past few days.
                        </p>
                    </div>
                    <div className="card" style={cardStyle}>
                        <h3 style={{ ...h3Style, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar size={20} /> Future Log
                        </h3>
                        <p style={{ ...pStyle, marginBottom: 0 }}>
                            A 12-month overview for planning further ahead. Place items in future months when they don't need attention today. At the start of a new month, migrate relevant items to your daily log.
                        </p>
                    </div>
                    <div className="card" style={cardStyle}>
                        <h3 style={{ ...h3Style, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <List size={20} /> Projects
                        </h3>
                        <p style={{ ...pStyle, marginBottom: 0 }}>
                            Collections of related tasks. Create a project for anything — a work initiative, a personal goal, a reading list. You can move any task into a project from its action menu, and project tasks still show up in your daily view.
                        </p>
                    </div>
                    <div className="card" style={cardStyle}>
                        <h3 style={{ ...h3Style, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Archive size={20} /> Open Tasks
                        </h3>
                        <p style={{ ...pStyle, marginBottom: 0 }}>
                            A catch-all view of every open task from past days and any undated items. Think of it as your "needs attention" inbox — review it regularly to decide what to migrate, complete, or delete.
                        </p>
                    </div>
                    <div className="card" style={cardStyle}>
                        <h3 style={{ ...h3Style, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Search size={20} /> Search
                        </h3>
                        <p style={{ ...pStyle, marginBottom: 0 }}>
                            Find any task, event, or note by keyword. Search looks through both your bullet titles and the content of your notes.
                        </p>
                    </div>
                </div>
            </section>

            {/* Key Feature: Notes */}
            <section style={sectionStyle}>
                <h2 style={h2Style}>
                    <FileText size={28} /> Notes: Write Without Losing Your Place
                </h2>
                <div style={pStyle}>
                    One of the most powerful features of this app is <strong>inline notes</strong>. In a paper bullet journal, when you need to jot down more detail about a task — meeting notes, brainstorming, a phone call summary — you write it on the next available page and reference it. That works, but you lose your place in your daily log.
                </div>
                <div style={pStyle}>
                    In Last Task, you can <strong>open a rich-text note from any item</strong>. Click the <MoreVertical size={14} style={{ verticalAlign: 'text-bottom' }} /> menu on any bullet and choose <strong>"Add Note."</strong> A full rich-text editor opens as an overlay — you can write freely, format text, add lists, and even insert links, all without leaving your current view.
                </div>
                <div className="card" style={cardStyle}>
                    <h3 style={h3Style}>Embedded Tasks in Notes</h3>
                    <p style={pStyle}>
                        While writing a note, you can <strong>create tasks inline</strong> by pressing <kbd style={{ padding: '2px 6px', borderRadius: '4px', border: '1px solid hsl(var(--color-text-secondary) / 0.3)', fontSize: '0.85em', backgroundColor: 'hsl(var(--color-bg-secondary))' }}>Ctrl</kbd> + <kbd style={{ padding: '2px 6px', borderRadius: '4px', border: '1px solid hsl(var(--color-text-secondary) / 0.3)', fontSize: '0.85em', backgroundColor: 'hsl(var(--color-bg-secondary))' }}>.</kbd> or clicking the <CheckSquare size={14} style={{ verticalAlign: 'text-bottom' }} /> button in the toolbar. The new task appears right in your note <em>and</em> gets added to your daily log. This captures the idea of <strong>taking notes without losing flow</strong> — you never have to stop writing to go add a task elsewhere.
                    </p>
                </div>
                <div style={tipStyle}>
                    Items with notes show a <FileText size={14} style={{ verticalAlign: 'text-bottom' }} /> icon. Tasks created from within a note show a "From Note" link that takes you back to the parent note.
                </div>
            </section>

            {/* Actions & Organization */}
            <section style={sectionStyle}>
                <h2 style={h2Style}>
                    <FolderInput size={28} /> Organizing Your Bullets
                </h2>
                <div style={pStyle}>
                    Every bullet has an action menu (<MoreVertical size={14} style={{ verticalAlign: 'text-bottom' }} />) with several options:
                </div>
                <div className="card" style={cardStyle}>
                    <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.75rem' }}>
                        <li style={iconListItemStyle}>
                            <FileText size={18} style={{ width: '24px', flexShrink: 0 }} />
                            <span><strong>Add / View Note</strong> — Open the rich-text note editor for this item.</span>
                        </li>
                        <li style={iconListItemStyle}>
                            <FolderInput size={18} style={{ width: '24px', flexShrink: 0 }} />
                            <span><strong>Move to Project</strong> — Assign the item to a project collection, or move it back to "No Project."</span>
                        </li>
                        <li style={iconListItemStyle}>
                            <Calendar size={18} style={{ width: '24px', flexShrink: 0 }} />
                            <span><strong>Assign Date</strong> — Schedule or reschedule an item to a specific date.</span>
                        </li>
                    </ul>
                </div>
                <div style={pStyle}>
                    You can also <strong>drag and drop</strong> items in the Daily Log to reorder them — just grab the drag handle on the left side of any item.
                </div>
            </section>

            {/* Keyboard Shortcuts */}
            <section style={sectionStyle}>
                <h2 style={h2Style}>
                    <Keyboard size={28} /> Keyboard Shortcuts
                </h2>
                <div className="card" style={cardStyle}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                            {[
                                ['j / ↓', 'Focus next item'],
                                ['k / ↑', 'Focus previous item'],
                                ['x', 'Toggle done on focused item'],
                                ['n', 'Open note for focused item'],
                                ['m', 'Migrate focused item'],
                                ['d', 'Delete focused item'],
                                ['Escape', 'Clear focus / Close menu'],
                                ['Enter', 'Add item from input field'],
                                ['Ctrl + .', 'Insert task while writing note'],
                                ['Ctrl + Enter', 'Save and close note editor'],
                                ['Ctrl + B', 'Bold text (in note editor)'],
                                ['Ctrl + I', 'Italic text (in note editor)'],
                                ['Ctrl + U', 'Underline text (in note editor)'],
                            ].map(([key, desc], i, arr) => (
                                <tr key={key} style={{ borderBottom: i < arr.length - 1 ? '1px solid hsl(var(--color-text-secondary) / 0.1)' : 'none' }}>
                                    <td style={{ padding: '0.6rem 0.75rem', whiteSpace: 'nowrap' }}>
                                        {key!.split(' + ').map((k, j) => (
                                            <span key={j}>
                                                {j > 0 && ' + '}
                                                <kbd style={{
                                                    padding: '2px 8px',
                                                    borderRadius: '4px',
                                                    border: '1px solid hsl(var(--color-text-secondary) / 0.3)',
                                                    fontSize: '0.85em',
                                                    backgroundColor: 'hsl(var(--color-bg-secondary))',
                                                    fontFamily: 'inherit'
                                                }}>{k}</kbd>
                                            </span>
                                        ))}
                                    </td>
                                    <td style={{ padding: '0.6rem 0.75rem', color: 'hsl(var(--color-text-secondary))' }}>{desc}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Other Features */}
            <section style={sectionStyle}>
                <h2 style={h2Style}>
                    <Moon size={28} /> Other Features
                </h2>
                <div className="card" style={cardStyle}>
                    <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.75rem' }}>
                        <li style={iconListItemStyle}>
                            <Moon size={18} style={{ width: '24px', flexShrink: 0 }} />
                            <span><strong>Dark / Light Mode</strong> — Toggle between themes from the sidebar.</span>
                        </li>
                        <li style={iconListItemStyle}>
                            <Download size={18} style={{ width: '24px', flexShrink: 0 }} />
                            <span><strong>Export / Import</strong> — Back up your entire journal as a JSON file, or restore from a previous export.</span>
                        </li>
                        <li style={iconListItemStyle}>
                            <MessageSquare size={18} style={{ width: '24px', flexShrink: 0 }} />
                            <span><strong>Show / Hide Completed</strong> — Quickly toggle completed tasks on or off in your daily view to keep things tidy.</span>
                        </li>
                    </ul>
                </div>
            </section>

            {/* Getting Started / Tips */}
            <section>
                <h2 style={h2Style}>
                    <Star size={28} /> Getting Started
                </h2>
                <div style={pStyle}>
                    The best way to learn the bullet journal method is to start using it. Here's a simple daily routine:
                </div>
                <div className="card" style={cardStyle}>
                    <ol style={{ lineHeight: 1.9, paddingLeft: '1.5rem', margin: 0 }}>
                        <li style={{ marginBottom: '0.5rem' }}>
                            <strong>Morning:</strong> Open the Daily Log. Review your Open Tasks view for anything left over from yesterday. Migrate what's still important; delete what isn't.
                        </li>
                        <li style={{ marginBottom: '0.5rem' }}>
                            <strong>Throughout the day:</strong> Rapidly log everything — tasks, events, stray thoughts. Don't overthink it. If you need more space for an item, open a note from it.
                        </li>
                        <li style={{ marginBottom: '0.5rem' }}>
                            <strong>Evening:</strong> Review what you did today. Mark tasks complete. Anything unfinished? Decide: migrate it to tomorrow, schedule it for later, or let it go.
                        </li>
                        <li>
                            <strong>Weekly:</strong> Use the Week View to reflect on your week. Move important longer-term items to the Future Log or into a Project.
                        </li>
                    </ol>
                </div>
                <div style={tipStyle}>
                    <strong>Remember:</strong> The magic of bullet journaling isn't in the system — it's in the reflection. Every time you migrate a task, you're asking yourself: "Does this still matter?" That question is the whole point.
                </div>
            </section>
        </div>
    );
}
