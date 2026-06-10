import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useGameStore } from './stores/gameStore.ts'

// Dev-only: expose the game store for debugging/visual testing
// (e.g. `nfStore.getState().skipToPosition(50)` from the console).
if (import.meta.env.DEV) {
  ;(window as unknown as Record<string, unknown>).nfStore = useGameStore
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
