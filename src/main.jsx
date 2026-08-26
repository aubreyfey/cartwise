import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { StickerDefs } from './stickers.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Gradient definitions, mounted once. Every sticker on the page points
        at these by id rather than carrying its own copy. */}
    <StickerDefs />
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

// Registered only for built output. In dev the service worker would serve
// stale modules back and make hot reload lie to you.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Registered relative to BASE_URL so the worker's scope matches wherever
    // the app is served from: the root on most hosts, /cartwise/ on GitHub
    // Pages. A hard-coded '/sw.js' would 404 on a subpath.
    const base = import.meta.env.BASE_URL
    navigator.serviceWorker.register(`${base}sw.js`, { scope: base }).catch(() => {
      // Offline support is a bonus; the app works fine without it.
    })
  })
}
