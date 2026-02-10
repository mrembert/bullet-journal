import { BookOpen, Calendar, Star, List, ChevronLeft, ChevronRight, Plus, Columns, Search, Download, Upload, Moon, Sun, Archive, HelpCircle, MessageSquare, Trash2, ArchiveRestore, Eye, EyeOff, Menu } from 'lucide-react';
import { DailyLog } from './components/DailyLog';
import { FutureLog } from './components/FutureLog';
import { CollectionView } from './components/CollectionView';
import { WeekLog } from './components/WeekLog';
import { SearchView } from './components/SearchView';
import { BacklogView } from './components/BacklogView';
import { HelpPage } from './components/HelpPage';
import { useStore } from './store';
import { format, parseISO, addDays } from 'date-fns';
import { useState, type FormEvent, useRef, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useNoteEditor } from './contexts/NoteEditorContext';
import { Login, Unauthorized } from './components/Login';
import { NoteEditor } from './components/NoteEditor';
import { useConfirmation } from './contexts/ConfirmationContext';
import { KeyboardFocusProvider } from './contexts/KeyboardFocusContext';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { MigrationPicker } from './components/MigrationPicker';
import { ShortcutsOverlay } from './components/ShortcutsOverlay';
import { Keyboard } from 'lucide-react';
import './App.css';

function App() {
  const { user, loading, isAuthorized } = useAuth();
  const { state, dispatch } = useStore();
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [newCollectionTitle, setNewCollectionTitle] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [migratingBulletId, setMigratingBulletId] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { openNoteId, closeNote } = useNoteEditor();
  const { requestConfirmation } = useConfirmation();

  // Keyboard Shortcuts
  useKeyboardShortcuts(setMigratingBulletId);

  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      // Don't trigger if in input
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isInput = activeTag === 'input' || activeTag === 'textarea' || (document.activeElement as HTMLElement)?.isContentEditable;

      if (e.key === '?' && !isInput) {
        setShowShortcuts(prev => !prev);
      }
      if (e.key === 'Escape' && showShortcuts) {
        setShowShortcuts(false);
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [showShortcuts]);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'hsl(var(--color-bg-secondary))' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid hsl(var(--color-text-secondary))', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (!isAuthorized) {
    return <Unauthorized />;
  }

  // Parse the current view date
  const currentDate = parseISO(state.view.date);

  const setView = (mode: 'daily' | 'future' | 'collection' | 'week' | 'search' | 'backlog' | 'help', date?: string, collectionId?: string) => {
    dispatch({ type: 'SET_VIEW', payload: { mode, date: date || state.view.date, collectionId } });
    closeSidebar();
  };

  const changeDate = (days: number) => {
    const newDate = addDays(currentDate, days);
    setView('daily', format(newDate, 'yyyy-MM-dd'));
  };

  const createCollection = (e: FormEvent) => {
    e.preventDefault();
    if (newCollectionTitle.trim()) {
      dispatch({ type: 'ADD_COLLECTION', payload: { title: newCollectionTitle, type: 'project' } });
      setNewCollectionTitle('');
      setIsCreatingCollection(false);
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bujo-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json && json.bullets) { // Basic validation
          dispatch({ type: 'LOAD_DATA', payload: json });
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        console.error('Failed to parse backup', err);
        alert('Failed to parse backup file.');
      }
    };
    reader.readAsText(file);
    // Reset inputs
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isDaily = state.view.mode === 'daily';
  const isFuture = state.view.mode === 'future';
  const isCollection = state.view.mode === 'collection';
  const isWeek = state.view.mode === 'week';
  const isSearch = state.view.mode === 'search';
  const isBacklog = state.view.mode === 'backlog';

  const collections = Object.values(state.collections).sort((a, b) => b.createdAt - a.createdAt);

  // Check if current view date is Today
  const isToday = format(currentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="layout">
      {/* Sidebar Overlay (mobile) */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={closeSidebar}
      />

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={20} /> Last Task
          </h1>
          <button onClick={toggleTheme} className="btn btn-ghost" title="Toggle Theme" style={{ padding: '0.25rem' }}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <button onClick={() => setView('search')} className={`btn ${isSearch ? 'btn-primary' : 'btn-ghost'}`} style={{ justifyContent: 'flex-start', width: '100%' }}>
            <Search size={18} /> Search
          </button>

          <button onClick={() => setView('backlog')} className={`btn ${isBacklog ? 'btn-primary' : 'btn-ghost'}`} style={{ justifyContent: 'flex-start', width: '100%' }}>
            <Archive size={18} /> Open Tasks
          </button>
          <div style={{ height: '1rem' }} />

          <button
            onClick={() => setView('daily', format(new Date(), 'yyyy-MM-dd'))}
            className={`btn ${isDaily && isToday && !state.view.collectionId ? 'btn-primary' : 'btn-ghost'}`}
            style={{ justifyContent: 'flex-start', width: '100%' }}
          >
            <Star size={18} /> Today
          </button>

          <button
            onClick={() => setView('week', format(new Date(), 'yyyy-MM-dd'))}
            className={`btn ${isWeek ? 'btn-primary' : 'btn-ghost'}`}
            style={{ justifyContent: 'flex-start', width: '100%' }}
          >
            <Columns size={18} /> Week
          </button>

          <button
            onClick={() => setView('future')}
            className={`btn ${isFuture ? 'btn-primary' : 'btn-ghost'}`}
            style={{ justifyContent: 'flex-start', width: '100%' }}
          >
            <Calendar size={18} /> Future Log
          </button>

          <div style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', paddingLeft: '0.5rem', paddingRight: '0.5rem' }}>
              <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'hsl(var(--color-text-secondary))', letterSpacing: '0.05em' }}>Projects</h3>
              <button onClick={() => setIsCreatingCollection(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--color-text-secondary))' }}>
                <Plus size={16} />
              </button>
            </div>

            {isCreatingCollection && (
              <form onSubmit={createCollection} style={{ marginBottom: '0.5rem', padding: '0 0.5rem' }}>
                <input
                  className="input"
                  style={{
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.9rem',
                    background: 'hsl(var(--color-bg-primary))',
                    color: 'hsl(var(--color-text-primary))',
                    borderRadius: '4px',
                    border: '1px solid hsl(var(--color-text-secondary) / 0.2)'
                  }}
                  autoFocus
                  placeholder="Project Name..."
                  value={newCollectionTitle}
                  onChange={e => setNewCollectionTitle(e.target.value)}
                  onBlur={() => !newCollectionTitle && setIsCreatingCollection(false)}
                />
              </form>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {collections
                .filter(c => showArchived ? c.archived : !c.archived)
                .map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center' }} className="project-item">
                    <button
                      onClick={() => setView('collection', undefined, c.id)}
                      className={`btn ${state.view.collectionId === c.id ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ justifyContent: 'flex-start', flex: 1, fontSize: '0.9rem' }}
                    >
                      <List size={16} /> {c.title}
                    </button>
                    <div className="project-actions" style={{ display: 'flex' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (c.archived) {
                            dispatch({ type: 'UPDATE_COLLECTION', payload: { id: c.id, archived: false } });
                          } else {
                            requestConfirmation({
                              title: 'Archive Project',
                              message: `Archive "${c.title}"?`,
                              confirmLabel: 'Archive',
                              onConfirm: () => {
                                dispatch({ type: 'UPDATE_COLLECTION', payload: { id: c.id, archived: true } });
                                if (state.view.collectionId === c.id) {
                                  setView('daily', format(new Date(), 'yyyy-MM-dd'));
                                }
                              }
                            });
                          }
                        }}
                        className="btn btn-ghost"
                        style={{ padding: '0.25rem', color: 'hsl(var(--color-text-secondary))' }}
                        title={c.archived ? "Unarchive" : "Archive"}
                      >
                        {c.archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                      </button>
                      {!c.archived && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            requestConfirmation({
                              title: 'Delete Project',
                              message: `Delete "${c.title}" permanently? Tasks will be unassigned.`,
                              isDanger: true,
                              confirmLabel: 'Delete',
                              onConfirm: () => {
                                dispatch({ type: 'DELETE_COLLECTION', payload: { id: c.id } });
                                if (state.view.collectionId === c.id) {
                                  setView('daily', format(new Date(), 'yyyy-MM-dd'));
                                }
                              }
                            });
                          }}
                          className="btn btn-ghost"
                          style={{ padding: '0.25rem', color: 'hsl(var(--color-text-secondary))' }}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            <div style={{ marginTop: '1rem', borderTop: '1px solid hsl(var(--color-text-secondary) / 0.1)', paddingTop: '0.5rem' }}>
              <button
                onClick={() => setShowArchived(!showArchived)}
                className="btn btn-ghost"
                style={{ justifyContent: 'flex-start', width: '100%', fontSize: '0.8rem', color: 'hsl(var(--color-text-secondary))' }}
              >
                {showArchived ? <EyeOff size={14} /> : <Eye size={14} />}
                {showArchived ? " Go Back to Active Projects" : " Show Archived Projects"}
              </button>
            </div>
          </div>

          <div style={{ marginTop: '2rem', borderTop: '1px solid hsl(var(--color-text-secondary) / 0.1)', paddingTop: '1rem' }}>
            <button
              onClick={() => setShowShortcuts(true)}
              className="btn btn-ghost"
              style={{ justifyContent: 'flex-start', width: '100%', fontSize: '0.9rem' }}
            >
              <Keyboard size={18} /> Shortcuts
              <span style={{ marginLeft: 'auto', fontSize: '0.7rem', opacity: 0.5, backgroundColor: 'hsl(var(--color-bg-primary))', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>?</span>
            </button>
            <button
              onClick={() => setView('help')}
              className={`btn ${state.view.mode === 'help' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ justifyContent: 'flex-start', width: '100%', fontSize: '0.9rem' }}
            >
              <HelpCircle size={18} /> Help & Method
            </button>
            <a
              href="https://github.com/mrembert/bullet-journal/issues"
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost"
              style={{ justifyContent: 'flex-start', width: '100%', fontSize: '0.9rem', textDecoration: 'none', color: 'inherit' }}
            >
              <MessageSquare size={18} /> Feedback / Bug
            </a>
          </div>
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid hsl(var(--color-text-secondary) / 0.1)' }}>
          <input type="file" ref={fileInputRef} onChange={handleImport} style={{ display: 'none' }} accept=".json" />
          <button onClick={handleExport} className="btn btn-ghost" style={{ justifyContent: 'flex-start', width: '100%', fontSize: '0.85rem' }}>
            <Download size={16} /> Export Backup
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="btn btn-ghost" style={{ justifyContent: 'flex-start', width: '100%', fontSize: '0.85rem' }}>
            <Upload size={16} /> Import Backup
          </button>
        </div>
      </aside>

      <main className="main-content">
        {/* Mobile header bar - visible only on small screens */}
        <div className="mobile-header">
          <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <Menu size={24} />
          </button>
          <span style={{ fontWeight: 600, fontSize: '1rem' }}>Last Task</span>
          <div style={{ width: '40px' }} /> {/* spacer for centering */}
        </div>

        {isDaily && (
          <>
            <header className="page-header">
              <div>
                <h2 className="page-subtitle">
                  {format(currentDate, 'EEEE')}
                </h2>
                <h1 className="page-title">
                  {format(currentDate, 'MMMM d')}
                </h1>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => changeDate(-1)} className="btn btn-ghost" title="Previous Day">
                  <ChevronLeft size={24} />
                </button>
                <button onClick={() => changeDate(1)} className="btn btn-ghost" title="Next Day">
                  <ChevronRight size={24} />
                </button>
              </div>
            </header>
            <DailyLog />
          </>
        )}

        {isFuture && <FutureLog />}

        {isWeek && <WeekLog />}

        {isCollection && <CollectionView />}

        {isSearch && <SearchView />}

        {isBacklog && <BacklogView />}

        {state.view.mode === 'help' && <HelpPage />}
      </main>

      {/* Global Note Editor - rendered at App level so it survives list re-renders */}
      {openNoteId && (
        <NoteEditor
          key={openNoteId}
          bulletId={openNoteId}
          onClose={closeNote}
        />
      )}

      {migratingBulletId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
          backgroundColor: 'rgba(0,0,0,0.2)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }} onClick={() => setMigratingBulletId(null)}>
          <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
            <MigrationPicker
              onSelectDate={(date) => {
                dispatch({ type: 'MIGRATE_BULLET', payload: { id: migratingBulletId, targetDate: date } });
                setMigratingBulletId(null);
              }}
              onCancel={() => setMigratingBulletId(null)}
            />
          </div>
        </div>
      )}

      {showShortcuts && (
        <ShortcutsOverlay onClose={() => setShowShortcuts(false)} />
      )}
    </div>
  );
}

export default function AppWrapper() {
  return (
    <KeyboardFocusProvider>
      <App />
    </KeyboardFocusProvider>
  );
}
