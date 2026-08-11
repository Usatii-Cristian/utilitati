/**
 * Lanseaza aplicatia desktop.
 *
 * De ce nu chemam direct `electron .`:
 * VS Code (si alte medii care ruleaza pe Electron) exporta ELECTRON_RUN_AS_NODE=1
 * in terminalele lor. Variabila se mosteneste, iar atunci binarul Electron porneste
 * ca un Node obisnuit — `require('electron')` intoarce calea catre executabil in loc
 * de API, si aplicatia crapa cu "Cannot read properties of undefined (reading 'app')".
 * Aici stergem variabila inainte de spawn, deci `npm run desktop` merge la fel din
 * orice terminal.
 */

import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const electronBinary = require('electron');

if (typeof electronBinary !== 'string') {
  console.error('Nu am gasit binarul Electron. Ruleaza: npm install');
  process.exit(1);
}

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(electronBinary, ['.', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env,
  windowsHide: false,
});

child.on('close', (code) => process.exit(code ?? 0));
