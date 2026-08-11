'use strict';

/**
 * Puntea dintre pagina si procesul principal.
 *
 * Expune STRICT patru functii. Renderer-ul nu primeste acces la `require`,
 * la fs sau la child_process — trimite doar numele unui tool, iar procesul
 * principal decide ce inseamna asta.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('hub', {
  /** Marcaj de mediu: UI-ul stie ca ruleaza in aplicatia desktop. */
  isDesktop: true,

  /** Starea locala a fiecarui tool: instalat / clonat / pornit. */
  detect: () => ipcRenderer.invoke('hub:detect'),

  /** Lanseaza tool-ul (exe, folder de repo sau serviciu local). */
  launch: (name) => ipcRenderer.invoke('hub:launch', name),

  /** Deschide un URL in browserul implicit. */
  openExternal: (url) => ipcRenderer.invoke('hub:open-external', url),

  /** Deschide in Explorer folderul local al tool-ului. */
  reveal: (name) => ipcRenderer.invoke('hub:reveal', name),
});
