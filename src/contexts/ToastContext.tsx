import { createContext, useContext, useState, useRef, useCallback, useMemo, type ReactNode } from 'react';

interface ToastContextType {
    showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [message, setMessage] = useState<string | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showToast = useCallback((msg: string) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setMessage(msg);
        timeoutRef.current = setTimeout(() => {
            setMessage(null);
            timeoutRef.current = null;
        }, 3000);
    }, []);

    const value = useMemo(() => ({ showToast }), [showToast]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            {message && (
                <div style={{
                    position: 'fixed',
                    bottom: '2rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'hsl(var(--color-bg-secondary))',
                    color: 'hsl(var(--color-text-primary))',
                    padding: '0.75rem 1.5rem',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    border: '1px solid hsl(var(--color-text-secondary) / 0.2)',
                    zIndex: 2000,
                    fontWeight: 500,
                    animation: 'fadeIn 0.2s ease-out',
                    pointerEvents: 'none' // Allow clicking through if needed, though mostly unrelated
                }}>
                    {message}
                </div>
            )}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translate(-50%, 10px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
            `}</style>
        </ToastContext.Provider>
    );
}
