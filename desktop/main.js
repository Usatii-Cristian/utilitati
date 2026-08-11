'use strict';

/**
 * LINK//HUB — procesul principal Electron.
 *
 * Doua responsabilitati:
 *  1. serveste exportul static din `out/` pe 127.0.0.1 (portul e ales liber)
 *  2. expune, prin IPC, singurele actiuni locale permise: detectare + lansare
 *
 * MODEL DE SECURITATE: renderer-ul trimite DOAR numele unui tool. Comanda reala
 * e cautata aici, in data/local-targets.json. Pagina nu poate cere executarea a
 * ceva ce nu e deja declarat in acel fisier.
 */

const electronApi = require('electron');
const { spawn } = require('node:child_process');

/**
 * Daca mostenim ELECTRON_RUN_AS_NODE=1 (VS Code si alte aplicatii Electron o
 * exporta in terminalele lor), binarul porneste ca Node simplu: `require('electron')`
 * intoarce calea catre executabil, nu API-ul, si totul crapa criptic. Repornim o
 * singura data cu variabila stearsa. Flagul HUB_RESPAWNED opreste orice bucla.
 */
if (typeof electronApi === 'string' || !electronApi.app) {
  if (process.env.HUB_RESPAWNED === '1') {
    console.error('Electron nu porneste ca aplicatie. Sterge ELECTRON_RUN_AS_NODE si reincearca.');
    process.exit(1);
  }
  const env = { ...process.env, HUB_RESPAWNED: '1' };
  delete env.ELECTRON_RUN_AS_NODE;
  spawn(process.execPath, process.argv.slice(1), { env, detached: true, stdio: 'ignore' }).unref();
  process.exit(0);
}

const { app, BrowserWindow, ipcMain, shell, nativeTheme } = electronApi;
const { createServer } = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const STATIC_DIR = app.isPackaged ? path.join(process.resourcesPath, 'out') : path.join(ROOT, 'out');
const TARGETS_FILE = app.isPackaged
  ? path.join(process.resourcesPath, 'local-targets.json')
  : path.join(ROOT, 'data', 'local-targets.json');

let targets = {};
try {
  targets = JSON.parse(fs.readFileSync(TARGETS_FILE, 'utf8'));
  delete targets._readme;
} catch (error) {
  console.error('Nu am putut citi local-targets.json:', error.message);
}

// Aceleasi functii pe care le verific cu `node desktop/detect.js` — fara duplicat.
const { detectAll, expand, firstExisting, findOnPath, appxInstalled, probe } = require('./detect.js');

// ── Lansare ─────────────────────────────────────────────────────────────────

async function launch(name) {
  const target = targets[name];
  if (!target) return { ok: false, error: 'Tool necunoscut — nu are configurare locala.' };

  if (target.kind === 'unsupported') {
    return { ok: false, error: target.reason || 'Nu e suportat pe Windows.' };
  }

  if (target.kind === 'app') {
    const exe = firstExisting(target.exe) || findOnPath(target.cli);
    if (!exe) return { ok: false, error: 'Nu e instalat inca.', hint: target.winget };
    spawn(exe, target.args ?? [], { detached: true, stdio: 'ignore' }).unref();
    return { ok: true, action: 'launched', path: exe };
  }

  if (target.kind === 'appx') {
    if (!appxInstalled(target.appId)) return { ok: false, error: 'Nu e instalat inca.' };
    // singura cale suportata de a porni un pachet MSIX din afara
    spawn('explorer.exe', [`shell:AppsFolder\\${target.appId}`], {
      detached: true,
      stdio: 'ignore',
    }).unref();
    return { ok: true, action: 'launched-appx', path: target.appId };
  }

  if (target.kind === 'repo') {
    const dir = expand(target.dir);
    if (!fs.existsSync(dir)) return { ok: false, error: 'Repo-ul nu e clonat inca.' };
    await shell.openPath(dir);
    return { ok: true, action: 'opened-folder', path: dir };
  }

  if (target.kind === 'service') {
    if (await probe(target.url)) {
      await shell.openExternal(target.url);
      return { ok: true, action: 'opened-running-service', url: target.url };
    }

    const dir = target.dir ? expand(target.dir) : null;
    if (!dir || !fs.existsSync(dir)) {
      return { ok: false, error: 'Serviciul nu e instalat inca.' };
    }

    const command = findOnPath(target.command) || target.command;
    const child = spawn(command, target.args ?? [], {
      cwd: dir,
      detached: true,
      stdio: 'ignore',
      shell: process.platform === 'win32',
    });
    child.unref();

    // dam serviciului cateva secunde sa se ridice, apoi deschidem URL-ul
    for (let i = 0; i < 20; i += 1) {
      await new Promise((r) => setTimeout(r, 750));
      if (await probe(target.url)) {
        await shell.openExternal(target.url);
        return { ok: true, action: 'started-service', url: target.url };
      }
    }
    return { ok: false, error: 'Serviciul a pornit dar nu raspunde inca. Incearca peste un minut.' };
  }

  return { ok: false, error: 'Tip de tinta necunoscut.' };
}

// ── Server static local ─────────────────────────────────────────────────────

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
};

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      try {
        const url = new URL(req.url, 'http://127.0.0.1');
        let filePath = path.join(STATIC_DIR, decodeURIComponent(url.pathname));

        // blocheaza iesirea din STATIC_DIR
        if (!path.resolve(filePath).startsWith(path.resolve(STATIC_DIR))) {
          res.writeHead(403).end('Forbidden');
          return;
        }

        if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
          filePath = path.join(filePath, 'index.html');
        }
        if (!fs.existsSync(filePath)) {
          filePath = path.join(STATIC_DIR, 'index.html');
        }

        res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
      } catch (error) {
        res.writeHead(500).end(String(error));
      }
    });

    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });
}

// ── Fereastra ───────────────────────────────────────────────────────────────

let mainWindow = null;

async function createWindow() {
  const port = await startStaticServer();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 420,
    minHeight: 560,
    backgroundColor: '#07080a',
    title: 'LINK//HUB',
    autoHideMenuBar: true,
    show: false,
    icon: path.join(ROOT, 'public', 'icons', 'icon-512.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());
  await mainWindow.loadURL(`http://127.0.0.1:${port}/`);

  // linkurile catre exterior se deschid in browserul implicit, nu in aplicatie
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(`http://127.0.0.1:${port}`)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
}

// ── IPC ─────────────────────────────────────────────────────────────────────

ipcMain.handle('hub:detect', () => detectAll(targets));
ipcMain.handle('hub:launch', (_event, name) => launch(String(name)));
ipcMain.handle('hub:open-external', (_event, url) => {
  if (typeof url === 'string' && /^https?:\/\//.test(url)) shell.openExternal(url);
  return true;
});
ipcMain.handle('hub:reveal', (_event, name) => {
  const target = targets[String(name)];
  if (!target?.dir) return false;
  const dir = expand(target.dir);
  if (!fs.existsSync(dir)) return false;
  shell.openPath(dir);
  return true;
});

// ── Ciclu de viata ──────────────────────────────────────────────────────────

nativeTheme.themeSource = 'dark';

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
