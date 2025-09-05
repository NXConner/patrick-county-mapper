import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { OfflineQueueService } from './services/OfflineQueueService'

// Let VitePWA handle service worker registration; keep legacy SW for fallback in non-PWA builds
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    if (!('workbox' in self)) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  });
}

// Initialize offline queue auto-processor
try { OfflineQueueService.init(); } catch {}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
