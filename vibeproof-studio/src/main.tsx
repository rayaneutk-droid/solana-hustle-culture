import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

function emitPwa(status: string, label: string) {
  window.dispatchEvent(new CustomEvent('vibeproof:pwa', { detail: { status, label } }))
}

registerSW({
  immediate: true,
  onRegisteredSW() {
    emitPwa('registered', 'Service worker registered. App shell can be cached after first load.')
  },
  onOfflineReady() {
    emitPwa('offline-ready', 'App shell is cached. Model weights still require their own first download/cache.')
  },
  onNeedRefresh() {
    emitPwa('needs-refresh', 'A fresh app shell is available.')
  },
  onRegisterError(error) {
    emitPwa('unsupported', error instanceof Error ? error.message : 'Service worker registration failed.')
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
