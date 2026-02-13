import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { StoreProvider } from './store.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { NoteEditorProvider } from './contexts/NoteEditorContext.tsx'
import { ConfirmationProvider } from './contexts/ConfirmationContext.tsx'
import { ToastProvider } from './contexts/ToastContext.tsx'

console.log("Main: Initializing bundle...");

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <StoreProvider>
          <NoteEditorProvider>
            <ConfirmationProvider>
              <ToastProvider>
                <App />
              </ToastProvider>
            </ConfirmationProvider>
          </NoteEditorProvider>
        </StoreProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
