import { useAuth } from '../contexts/AuthContext';
import { BookOpen } from 'lucide-react';

export function Login() {
    const { signInWithGoogle } = useAuth();

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'hsl(var(--color-bg-secondary))',
            color: 'hsl(var(--color-text-primary))'
        }}>
            <div style={{
                background: 'hsl(var(--color-bg-primary))',
                padding: '3rem',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                textAlign: 'center',
                maxWidth: '400px',
                width: '100%'
            }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: 'hsl(var(--color-accent))' }}>
                    <BookOpen size={48} />
                </div>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Bullet Journal</h1>
                <p style={{ color: 'hsl(var(--color-text-secondary))', marginBottom: '2rem' }}>
                    Sign in to access your journal.
                </p>

                <button
                    onClick={signInWithGoogle}
                    className="btn btn-primary"
                    style={{
                        width: '100%',
                        justifyContent: 'center',
                        fontSize: '1.1rem',
                        padding: '0.75rem'
                    }}
                >
                    Sign in with Google
                </button>
            </div>
        </div>
    );
}

export function Unauthorized() {
    const { logout, user } = useAuth();
    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'hsl(var(--color-bg-secondary))',
            color: 'hsl(var(--color-text-primary))'
        }}>
            <div style={{
                background: 'hsl(var(--color-bg-primary))',
                padding: '3rem',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                textAlign: 'center',
                maxWidth: '600px',
                width: '100%'
            }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: 'hsl(var(--color-danger))' }}>Access Denied</h1>
                <div style={{ background: 'hsl(var(--color-bg-secondary))', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem', textAlign: 'left', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                    <p><strong>Email:</strong> {user?.email}</p>
                    <p><strong>UID:</strong> {user?.uid}</p>
                </div>
                <p style={{ color: 'hsl(var(--color-text-secondary))', marginBottom: '1rem' }}>
                    To enable access, create a document in the <code>allowed_users</code> collection with the ID exactly matching your email.
                </p>
                <code style={{ display: 'block', background: '#333', color: '#fff', padding: '0.5rem', borderRadius: '4px', marginBottom: '2rem' }}>
                    allowed_users / {user?.email}
                </code>
                <button
                    onClick={logout}
                    className="btn btn-ghost"
                >
                    Sign Out
                </button>
            </div>
        </div>
    )
}
