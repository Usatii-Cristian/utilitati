'use client';

import { useEffect } from 'react';

/**
 * Inregistreaza service worker-ul PWA — dar DOAR in browser.
 *
 * In aplicatia desktop, continutul e servit de pe 127.0.0.1 cu un port ales liber
 * la fiecare pornire. Un service worker inregistrat acolo ar fi inutil (originea
 * se schimba la fiecare rulare), ar acumula inregistrari moarte si ar putea servi
 * din cache o versiune veche dupa un update al aplicatiei. Deci in Electron nu-l
 * inregistram, ba chiar curatam ce a ramas de la versiunile anterioare.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const isDesktop = Boolean(window.hub);

    if (isDesktop) {
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) void registration.unregister();
      });
      return;
    }

    if (process.env.NODE_ENV !== 'production') return;

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
