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
import { createWriteStream, existsSync, mkdirSync, readFileSync, renameSync } from 'node:fs';
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
};

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

async function installReleases() {
  const cache = join(HUB_TOOLS, '_installers');
  mkdirSync(cache, { recursive: true });

  for (const [name, spec] of Object.entries(RELEASES)) {
    try {
      const res = await fetch(`https://api.github.com/repos/${spec.repo}/releases/latest`, {
        headers: { 'User-Agent': 'link-hub-installer' },
      });
      const release = await res.json();
      const asset = (release.assets ?? []).find((a) => spec.match(a.name));
      if (!asset) {
        log('!', name, 'niciun asset de Windows in ultimul release');
        continue;
      }

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
        log('+', name, `dezarhivat in ${spec.dest}`);
      } else if (spec.kind === 'msi') {
        const r = spawnSync('msiexec', ['/i', local, '/qn', '/norestart'], { windowsHide: true });
        log(r.status === 0 ? '+' : '!', name, r.status === 0 ? 'instalat (msi)' : `msi cod ${r.status}`);
      } else if (spec.kind === 'nsis') {
        const r = spawnSync(local, ['/S'], { windowsHide: true });
        log(r.status === 0 ? '+' : '!', name, r.status === 0 ? 'instalat (nsis)' : `nsis cod ${r.status}`);
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
