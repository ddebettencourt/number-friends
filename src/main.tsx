import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useGameStore } from './stores/gameStore.ts'

// Dev-only: expose stores for debugging/visual testing
// (e.g. `nfStore.getState().skipToPosition(50)` or
//  `nfStory.getState().goToChapter('clockwork')` from the console).
if (import.meta.env.DEV) {
  const w = window as unknown as Record<string, unknown>
  w.nfStore = useGameStore
  import('./stores/storyStore.ts').then((m) => {
    w.nfStory = m.useStoryStore
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
