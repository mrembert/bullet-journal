
import { BookOpen, Star, Columns, Calendar, List, Edit3, ArrowRight, X } from 'lucide-react';

export function HelpPage() {
    return (
        <div className="help-page" style={{ maxWidth: '800px', margin: '0 auto', color: 'hsl(var(--color-text-primary))' }}>
            <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
                <h1 className="section-title" style={{ marginBottom: '1rem' }}>Methodology</h1>
                <p style={{ fontSize: '1.2rem', color: 'hsl(var(--color-text-secondary))', maxWidth: '600px', margin: '0 auto' }}>
                    Welcome to <strong>Last Task</strong>. This app is designed around the Bullet Journal® method—a mindfulness practice disguised as a productivity system.
                </p>
            </header>

            <section style={{ marginBottom: '4rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Edit3 size={28} /> The Basics
                </h2>
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div className="card" style={{ padding: '1.5rem', border: '1px solid hsl(var(--color-text-secondary) / 0.2)', borderRadius: 'var(--radius-md)' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Rapid Logging</h3>
                        <p style={{ marginBottom: '1rem', lineHeight: 1.6 }}>
                            The core of the system is rapid logging. Instead of long sentences, use short bullets to capture thoughts.
                        </p>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.5rem' }}>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>•</span>
                                <span><strong>Tasks:</strong> Actionable items (e.g., "Call Mom", "Ship feature").</span>
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>◦</span>
                                <span><strong>Events:</strong> Experience-related items (e.g., "Meeting", "Lunch with Jim").</span>
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>-</span>
                                <span><strong>Notes:</strong> Facts, ideas, and thoughts (e.g., "Podcast idea").</span>
                            </li>
                        </ul>
                    </div>

                    <div className="card" style={{ padding: '1.5rem', border: '1px solid hsl(var(--color-text-secondary) / 0.2)', borderRadius: 'var(--radius-md)' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>States & Signifiers</h3>
                        <p style={{ marginBottom: '1rem', lineHeight: 1.6 }}>
                            Tasks change state as you work on them.
                        </p>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.5rem' }}>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <X size={18} />
                                <span><strong>Completed:</strong> You finished the task. Great job!</span>
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <ArrowRight size={18} />
                                <span><strong>Migrated:</strong> You moved the task to a future date or collection.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            <section style={{ marginBottom: '4rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BookOpen size={28} /> App Views
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                    <div style={{ padding: '1rem' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                            <Star size={20} /> Today (Daily Log)
                        </h3>
                        <p style={{ fontSize: '0.95rem', color: 'hsl(var(--color-text-secondary))' }}>
                            Your main workspace. Capture everything here as it happens. Don't worry about organizing yet, just get it out of your head.
                        </p>
                    </div>
                    <div style={{ padding: '1rem' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                            <Columns size={20} /> Week Log
                        </h3>
                        <p style={{ fontSize: '0.95rem', color: 'hsl(var(--color-text-secondary))' }}>
                            Zoom out to see your week. Ideal for planning the week ahead or reviewing what you accomplished.
                        </p>
                    </div>
                    <div style={{ padding: '1rem' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                            <Calendar size={20} /> Future Log
                        </h3>
                        <p style={{ fontSize: '0.95rem', color: 'hsl(var(--color-text-secondary))' }}>
                            Place items for future months here. At the start of a new month, migrate these items to your Daily/Weekly logs.
                        </p>
                    </div>
                    <div style={{ padding: '1rem' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                            <List size={20} /> Projects
                        </h3>
                        <p style={{ fontSize: '0.95rem', color: 'hsl(var(--color-text-secondary))' }}>
                            Collections of related tasks. You can move tasks from your inbox (Daily Log) into these projects.
                        </p>
                    </div>
                </div>
            </section>

            <section>
                <h2 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '1.5rem' }}>Tips</h2>
                <ul style={{ lineHeight: 1.8, paddingLeft: '1.5rem' }}>
                    <li><strong>Migration is Key:</strong> If you didn't do a task today, decide: is it still worth doing? If yes, move it to tomorrow (Migrate &gt;). If no, delete it. This friction is intentional.</li>
                    <li><strong>Morning Reflection:</strong> Review your Future Log and Monthly Log to plan your day.</li>
                    <li><strong>Evening Reflection:</strong> Review what you did, migrate unfinished tasks, and clear your mind.</li>
                </ul>
            </section>
        </div>
    );
}
