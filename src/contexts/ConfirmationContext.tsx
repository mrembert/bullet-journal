import { createContext, useContext, useState, type ReactNode } from 'react';

interface ConfirmationOptions {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDanger?: boolean;
    onConfirm: () => void;
    onCancel?: () => void;
}

interface ConfirmationContextType {
    requestConfirmation: (options: ConfirmationOptions) => void;
    closeConfirmation: () => void;
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

export function useConfirmation() {
    const context = useContext(ConfirmationContext);
    if (!context) {
        throw new Error('useConfirmation must be used within a ConfirmationProvider');
    }
    return context;
}

export function ConfirmationProvider({ children }: { children: ReactNode }) {
    const [confirmationState, setConfirmationState] = useState<ConfirmationOptions | null>(null);

    const requestConfirmation = (options: ConfirmationOptions) => {
        setConfirmationState(options);
    };

    const closeConfirmation = () => {
        setConfirmationState(null);
    };

    const handleConfirm = () => {
        if (confirmationState?.onConfirm) {
            confirmationState.onConfirm();
        }
        closeConfirmation();
    };

    const handleCancel = () => {
        if (confirmationState?.onCancel) {
            confirmationState.onCancel();
        }
        closeConfirmation();
    };

    return (
        <ConfirmationContext.Provider value={{ requestConfirmation, closeConfirmation }}>
            {children}
            {confirmationState && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'hsl(var(--color-bg-secondary))',
                        padding: '1.5rem',
                        borderRadius: 'var(--radius-lg)',
                        maxWidth: '400px',
                        width: '90%',
                        boxShadow: 'var(--shadow-lg)',
                        border: '1px solid hsl(var(--color-text-secondary) / 0.1)'
                    }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>{confirmationState.title}</h3>
                        <p style={{ color: 'hsl(var(--color-text-secondary))', marginBottom: '1.5rem' }}>{confirmationState.message}</p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button
                                onClick={handleCancel}
                                className="btn btn-ghost"
                            >
                                {confirmationState.cancelLabel || 'Cancel'}
                            </button>
                            <button
                                onClick={handleConfirm}
                                className={`btn ${confirmationState.isDanger ? 'btn-danger' : 'btn-primary'}`}
                                style={confirmationState.isDanger ? { backgroundColor: 'hsl(var(--color-danger))', color: 'white' } : {}}
                            >
                                {confirmationState.confirmLabel || 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmationContext.Provider>
    );
}
