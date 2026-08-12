'use strict';

/**
 * Detectarea starii locale a tool-urilor. Modul separat, FARA dependinte de
 * Electron, ca sa poata fi rulat si verificat direct cu Node:
 *
 *     node desktop/detect.js
 *
 * main.js il foloseste pentru `hub:detect`.
 */

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const HUB_TOOLS = process.env.HUB_TOOLS || 'E:\\hub-tools';

/** Expandeaza %VAR% din caile declarate in JSON. */
function expand(value) {
  if (typeof value !== 'string') return value;
  return value.replace(/%([^%]+)%/g, (match, name) =>
    name === 'HUB_TOOLS' ? HUB_TOOLS : (process.env[name] ?? match),
  );
}

/** Prima cale existenta dintr-o lista, sau null. */
function firstExisting(paths) {
  for (const candidate of paths ?? []) {
    const resolved = expand(candidate);
    try {
      if (fs.existsSync(resolved)) return resolved;
    } catch {
      /* cale invalida */
    }
  }
  return null;
}

/** Cauta o comanda in PATH (echivalentul lui `where`). */
function findOnPath(command) {
  if (!command) return null;
  const exts = (process.env.PATHEXT || '.EXE;.CMD;.BAT').split(';');
  for (const dir of (process.env.PATH || '').split(path.delimiter)) {
    if (!dir) continue;
    for (const ext of ['', ...exts]) {
      try {
        const candidate = path.join(dir, command + ext.toLowerCase());
        if (fs.existsSync(candidate)) return candidate;
      } catch {
        /* ignoram */
      }
    }
  }
  return null;
}

// ── Pachete MSIX ────────────────────────────────────────────────────────────
//
// `Get-AppxPackage` costa ~1.1s. Detectarea ruleaza la fiecare focus pe fereastra,
// deci fara cache am porni un proces PowerShell la fiecare alt-tab. Citim lista
// intreaga o singura data si o tinem 60s — pachetele nu apar/dispar mai des.

const APPX_TTL_MS = 60_000;
let appxCache = { at: 0, families: null };

function appxFamilies() {
  if (appxCache.families && Date.now() - appxCache.at < APPX_TTL_MS) return appxCache.families;

  // PowerShell 5.1 nu are -PackageFamilyName pe Get-AppxPackage, deci luam tot.
  const result = spawnSync(
    'powershell',
    ['-NoProfile', '-Command', 'Get-AppxPackage | Select-Object -ExpandProperty PackageFamilyName'],
    { encoding: 'utf8', windowsHide: true },
  );
  const families = new Set(
    String(result.stdout ?? '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean),
  );
  appxCache = { at: Date.now(), families };
  return families;
}

function appxInstalled(appId) {
  const family = String(appId ?? '').split('!')[0];
  if (!family) return false;
  return appxFamilies().has(family);
}

/** Forteaza recitirea listei de pachete MSIX (dupa o instalare noua). */
function clearCaches() {
  appxCache = { at: 0, families: null };
}

/** Serviciul raspunde deja pe URL-ul lui? */
function probe(url, timeoutMs = 900) {
  return new Promise((resolve) => {
    let settled = false;
    const done = (value) => {
      if (!settled) {
        settled = true;
        resolve(value);
      }
    };
    try {
      const request = http.get(url, () => done(true));
      request.on('error', () => done(false));
      request.setTimeout(timeoutMs, () => {
        request.destroy();
        done(false);
      });
    } catch {
      done(false);
    }
  });
}

// ── Starea unui singur tool ─────────────────────────────────────────────────

async function detectOne(target) {
  const entry = { kind: target.kind, ready: false };
  if (target.warn) entry.warn = target.warn;

  if (target.kind === 'unsupported') {
    entry.reason = target.reason;
    return entry;
  }

  if (target.kind === 'app') {
    const exe = firstExisting(target.exe) || findOnPath(target.cli);
    entry.ready = Boolean(exe);
    if (exe) entry.path = exe;
    else entry.hint = target.winget ? `winget install ${target.winget}` : target.release;
    return entry;
  }

  if (target.kind === 'appx') {
    entry.ready = appxInstalled(target.appId);
    entry.path = target.appId;
    if (!entry.ready && target.winget) entry.hint = `winget install ${target.winget}`;
    return entry;
  }

  if (target.kind === 'repo') {
    const dir = expand(target.dir);
    entry.ready = fs.existsSync(dir);
    entry.path = dir;
    if (!entry.ready) entry.hint = `git clone ${target.clone}`;
    return entry;
  }

  if (target.kind === 'service') {
    const dir = target.dir ? expand(target.dir) : null;
    entry.url = target.url;
    if (dir) entry.path = dir;
    entry.running = await probe(target.url);

    // Un serviciu e "gata" daca ruleaza deja, daca avem sursele clonate, SAU
    // daca a fost instalat ca pachet — fie pe o cale explicita (pip pune
    // executabilele in Scripts/, care nu e in PATH), fie gasit in PATH.
    const binary = firstExisting(target.exe) || (target.cli ? findOnPath(target.cli) : null);
    if (binary && !entry.path) entry.path = binary;
    entry.ready = entry.running || Boolean(binary) || (dir ? fs.existsSync(dir) : false);

    if (!entry.ready) entry.hint = target.clone ? `git clone ${target.clone}` : target.setup;
    return entry;
  }

  return entry;
}

/** Starea tuturor tool-urilor. Sondele de retea ruleaza in paralel. */
async function detectAll(targets) {
  const pairs = await Promise.all(
    Object.entries(targets)
      .filter(([name]) => !name.startsWith('_'))
      .map(async ([name, target]) => [name, await detectOne(target)]),
  );
  return Object.fromEntries(pairs);
}

module.exports = {
  detectAll,
  detectOne,
  clearCaches,
  expand,
  firstExisting,
  findOnPath,
  appxInstalled,
  probe,
  HUB_TOOLS,
};

// Rulat direct: tipareste tabelul de stare.
if (require.main === module) {
  const file = path.join(__dirname, '..', 'data', 'local-targets.json');
  const targets = JSON.parse(fs.readFileSync(file, 'utf8'));
  delete targets._readme;

  const started = Date.now();
  detectAll(targets).then((statuses) => {
    let ready = 0;
    for (const [name, status] of Object.entries(statuses)) {
      const mark = status.ready ? '+' : status.kind === 'unsupported' ? 'x' : '-';
      if (status.ready) ready += 1;
      console.log(
        `${mark} ${name.padEnd(30)} ${String(status.kind).padEnd(12)} ${status.path ?? status.reason ?? ''}`,
      );
    }
    console.log(`\n${ready} / ${Object.keys(statuses).length} gata de lansat local`);
    console.log(`detectare in ${Date.now() - started} ms`);
  });
}
