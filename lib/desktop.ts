'use client';

import { useCallback, useEffect, useState } from 'react';

/** Ce raporteaza procesul Electron despre un tool instalat local. */
export interface LocalStatus {
  kind: 'app' | 'appx' | 'repo' | 'service' | 'unsupported';
  /** Poate fi lansat acum (instalat / clonat / deja pornit). */
  ready: boolean;
  /** Doar pentru servicii: raspunde deja pe URL-ul lui. */
  running?: boolean;
  path?: string;
  url?: string;
  /** Avertisment de hardware (ex. fara GPU dedicat). */
  warn?: string;
  /** Motiv pentru `unsupported`. */
  reason?: string;
  /** Comanda sugerata de instalare, cand nu e gata. */
  hint?: string;
}

export interface LaunchResult {
  ok: boolean;
  action?: string;
  path?: string;
  url?: string;
  error?: string;
  hint?: string;
}

interface HubBridge {
  isDesktop: true;
  detect: () => Promise<Record<string, LocalStatus>>;
  launch: (name: string) => Promise<LaunchResult>;
  openExternal: (url: string) => Promise<boolean>;
  reveal: (name: string) => Promise<boolean>;
}

declare global {
  interface Window {
    hub?: HubBridge;
  }
}

/**
 * Starea locala a tool-urilor.
 *
 * In browser `window.hub` lipseste, deci `isDesktop` e false si UI-ul se comporta
 * exact ca inainte — carduri care deschid linkul. Aceeasi build merge in ambele.
 */
export function useLocalStatus() {
  const [isDesktop, setIsDesktop] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, LocalStatus>>({});
  const [checking, setChecking] = useState(false);

  const refresh = useCallback(async () => {
    if (!window.hub) return;
    setChecking(true);
    try {
      setStatuses(await window.hub.detect());
    } catch {
      /* daca detectarea pica, ramanem pe comportamentul de web */
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    if (!window.hub) return;
    setIsDesktop(true);
    void refresh();

    // re-verificam cand revii la fereastra: poate ai instalat ceva intre timp
    const onFocus = () => void refresh();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refresh]);

  return { isDesktop, statuses, checking, refresh };
}

/** Deschide un URL: in desktop prin browserul implicit, in web prin tab nou. */
export function openUrl(url: string) {
  if (window.hub) {
    void window.hub.openExternal(url);
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

export async function launchTool(name: string): Promise<LaunchResult> {
  if (!window.hub) return { ok: false, error: 'Disponibil doar în aplicația desktop.' };
  return window.hub.launch(name);
}
