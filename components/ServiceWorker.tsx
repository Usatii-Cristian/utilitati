'use client';

import { useEffect } from 'react';

/**
 * Inregistreaza service worker-ul (doar in productie, ca sa nu tina cache peste
 * hot-reload in dev). Fara el nu exista "Add to Home Screen" functional offline.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
        /* fara SW aplicatia merge normal, doar ca nu si offline */
      });
    };

    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });

    return () => window.removeEventListener('load', register);
  }, []);

  return null;
}
