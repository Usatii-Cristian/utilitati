/**
 * Instaleaza local tool-urile din data/local-targets.json.
 *
 *   node scripts/install-local.mjs            # tot
 *   node scripts/install-local.mjs repos      # doar clone-uri git
 *   node scripts/install-local.mjs apps       # doar winget
 *   node scripts/install-local.mjs releases   # doar binare de pe GitHub Releases
 *
 * Nu se opreste la prima eroare: incearca tot si tipareste un raport la final.
 */

import { execFile, spawnSync } from 'node:child_process';
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const execFileAsync = promisify(execFile);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const HUB_TOOLS = process.env.HUB_TOOLS || 'E:\\hub-tools';
const mode = process.argv[2] ?? 'all';

const targets = JSON.parse(readFileSync(join(ROOT, 'data', 'local-targets.json'), 'utf8'));
delete targets._readme;

const report = [];
const log = (icon, name, message) => {
  console.log(`${icon} ${name.padEnd(30)} ${message}`);
  report.push({ icon, name, message });
};

const expand = (value) =>
  value.replace(/%([^%]+)%/g, (m, n) => (n === 'HUB_TOOLS' ? HUB_TOOLS : process.env[n] ?? m));

mkdirSync(HUB_TOOLS, { recursive: true });

// ── 1. Clone-uri git (surse: repo + service) ────────────────────────────────

async function cloneAll() {
  for (const [name, target] of Object.entries(targets)) {
    if (!target.clone || !target.dir) continue;
    const dir = expand(target.dir);

    if (existsSync(dir)) {
      log('=', name, 'deja clonat');
      continue;
    }
    try {
      // --depth 1: fara istoric, ocupa mult mai putin
      await execFileAsync('git', ['clone', '--depth', '1', target.clone, dir], {
        maxBuffer: 1024 * 1024 * 32,
      });
      log('+', name, `clonat in ${dir}`);
    } catch (error) {
      log('!', name, `clone esuat: ${String(error.message).split('\n')[0]}`);
    }
  }
}

// ── 2. Aplicatii prin winget ────────────────────────────────────────────────

const WINGET = {
  'Brave Browser': 'Brave.Brave',
  'Kodi (XBMC)': 'XBMCFoundation.Kodi',
  'Seelen UI': 'Seelen.SeelenUI',
  Helium: 'ImputNet.Helium',
};

function installWinget() {
  for (const [name, id] of Object.entries(WINGET)) {
    const result = spawnSync(
      'winget',
      [
        'install',
        '--id',
        id,
        '--exact',
        '--silent',
        '--accept-package-agreements',
        '--accept-source-agreements',
        '--disable-interactivity',
      ],
      { encoding: 'utf8', windowsHide: true },
    );
    const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
    if (result.status === 0) log('+', name, `instalat (${id})`);
    else if (/already installed|Se afl|deja instalat/i.test(output)) log('=', name, 'deja instalat');
    else log('!', name, `winget cod ${result.status}`);
  }
}

// ── 3. Binare de pe GitHub Releases ─────────────────────────────────────────

/** name -> cum alegem asset-ul de Windows si ce facem cu el */
const RELEASES = {
  OfficeCLI: {
    repo: 'iOfficeAI/OfficeCLI',
    match: (n) => n === 'officecli-win-x64.exe',
    kind: 'binary',
    dest: join(HUB_TOOLS, 'officecli', 'officecli.exe'),
  },
  llmfit: {
    repo: 'AlexsJones/llmfit',
    match: (n) => n.includes('x86_64-pc-windows-msvc') && n.endsWith('.zip'),
    kind: 'zip',
    dest: join(HUB_TOOLS, 'llmfit'),
  },
  Meetily: {
    repo: 'Zackriya-Solutions/meetily',
    match: (n) => n.endsWith('_x64_en-US.msi'),
    kind: 'msi',
  },
  AutoSubs: {
    repo: 'tmoroney/auto-subs',
    match: (n) => n === 'AutoSubs-windows-x86_64.exe',
    kind: 'nsis',
  },
  FileExplorer: {
    repo: 'conaticus/FileExplorer',
    // Ultimul release nu are niciun fisier atasat; ultimul CU binar de Windows
    // e mai vechi, de-aia cautam in tot istoricul, nu doar in /releases/latest.
    match: (n) => n.startsWith('file-explorer_') && n.endsWith('_x64_en-US.msi'),
    kind: 'msi',
  },
};

/** Primul release (de la cel mai nou catre vechi) care are un asset potrivit. */
async function findAsset(repo, match) {
  const res = await fetch(`https://api.github.com/repos/${repo}/releases?per_page=30`, {
    headers: { 'User-Agent': 'link-hub-installer' },
  });
  const releases = await res.json();
  if (!Array.isArray(releases)) return null;
  for (const release of releases) {
    const asset = (release.assets ?? []).find((a) => match(a.name));
    if (asset) return { asset, tag: release.tag_name };
  }
  return null;
}

async function download(url, dest) {
  mkdirSync(dirname(dest), { recursive: true });
  const response = await fetch(url, {
    headers: { 'User-Agent': 'link-hub-installer', Accept: 'application/octet-stream' },
    redirect: 'follow',
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const tmp = `${dest}.part`;
  await pipeline(Readable.fromWeb(response.body), createWriteStream(tmp));
  renameSync(tmp, dest);
}

/**
 * Multe arhive contin un singur folder cu numele si VERSIUNEA inauntru
 * (ex. llmfit-v1.1.9-x86_64-pc-windows-msvc/llmfit.exe). Daca am lasa asa,
 * calea din local-targets.json s-ar strica la fiecare versiune noua. Urcam
 * continutul cu un nivel, ca sa avem mereu <dest>/llmfit.exe.
 */
function flatten(dest) {
  const entries = readdirSync(dest, { withFileTypes: true });
  if (entries.length !== 1 || !entries[0].isDirectory()) return;

  const inner = join(dest, entries[0].name);
  for (const file of readdirSync(inner)) {
    renameSync(join(inner, file), join(dest, file));
  }
  rmSync(inner, { recursive: true, force: true });
}

async function installReleases() {
  const cache = join(HUB_TOOLS, '_installers');
  mkdirSync(cache, { recursive: true });

  for (const [name, spec] of Object.entries(RELEASES)) {
    try {
      const found = await findAsset(spec.repo, spec.match);
      if (!found) {
        log('!', name, 'niciun asset de Windows in ultimele 30 de release-uri');
        continue;
      }
      const { asset, tag } = found;

      if (spec.kind === 'binary') {
        if (existsSync(spec.dest)) {
          log('=', name, 'deja descarcat');
          continue;
        }
        await download(asset.browser_download_url, spec.dest);
        log('+', name, `binar in ${spec.dest}`);
        continue;
      }

      const local = join(cache, asset.name);
      if (!existsSync(local)) await download(asset.browser_download_url, local);

      if (spec.kind === 'zip') {
        mkdirSync(spec.dest, { recursive: true });
        spawnSync('powershell', [
          '-NoProfile',
          '-Command',
          `Expand-Archive -LiteralPath '${local}' -DestinationPath '${spec.dest}' -Force`,
        ]);
        flatten(spec.dest);
        log('+', name, `dezarhivat in ${spec.dest}`);
      } else if (spec.kind === 'msi') {
        const r = spawnSync('msiexec', ['/i', local, '/qn', '/norestart'], { windowsHide: true });
        log(r.status === 0 ? '+' : '!', name, r.status === 0 ? `instalat (msi ${tag})` : `msi cod ${r.status}`);
      } else if (spec.kind === 'nsis') {
        const r = spawnSync(local, ['/S'], { windowsHide: true });
        log(r.status === 0 ? '+' : '!', name, r.status === 0 ? `instalat (nsis ${tag})` : `nsis cod ${r.status}`);
      }
    } catch (error) {
      log('!', name, `esuat: ${error.message}`);
    }
  }
}

// ── Rulare ──────────────────────────────────────────────────────────────────

console.log(`Instalez in ${HUB_TOOLS}\n`);

if (mode === 'all' || mode === 'repos') await cloneAll();
if (mode === 'all' || mode === 'apps') installWinget();
if (mode === 'all' || mode === 'releases') await installReleases();

console.log('\n──────── raport ────────');
console.log(`${report.filter((r) => r.icon === '+').length} instalate acum`);
console.log(`${report.filter((r) => r.icon === '=').length} erau deja`);
const failed = report.filter((r) => r.icon === '!');
console.log(`${failed.length} esuate`);
for (const f of failed) console.log(`   ! ${f.name}: ${f.message}`);
