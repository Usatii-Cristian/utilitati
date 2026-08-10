/**
 * Genereaza toate icoanele PWA din cod, fara dependinte externe (fara sharp).
 * Rulare:  npm run icons
 *
 * Marca: "//" acid pe fundal aproape negru — acelasi semn ca in wordmark.
 */

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');

const BG_TOP = [13, 16, 20];
const BG_BOTTOM = [7, 8, 10];
const ACID = [201, 242, 78];
const GLOW = [201, 242, 78];

// ── PNG encoder minimal (RGBA, 8 biti) ──────────────────────────────────────

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let c = -1;
  for (let i = 0; i < buffer.length; i += 1) c = CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

function encodePNG(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (width * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Geometrie ───────────────────────────────────────────────────────────────

/** Distanta de la punct la segment — folosita pentru bare cu capete rotunjite. */
function distanceToSegment(px, py, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - x0) * dx + (py - y0) * dy) / lengthSq));
  const cx = x0 + t * dx;
  const cy = y0 + t * dy;
  return Math.hypot(px - cx, py - cy);
}

/** Distanta cu semn fata de un dreptunghi rotunjit (negativ = interior). */
function roundedRectSDF(px, py, cx, cy, halfW, halfH, radius) {
  const qx = Math.abs(px - cx) - (halfW - radius);
  const qy = Math.abs(py - cy) - (halfH - radius);
  return (
    Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius
  );
}

function mix(a, b, t) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

/**
 * Deseneaza icoana la dimensiunea data.
 * @param {number} size
 * @param {{ rounded?: boolean, markScale?: number }} options
 */
function renderIcon(size, { rounded = true, markScale = 1 } = {}) {
  const rgba = Buffer.alloc(size * size * 4);
  const SS = 3; // supersampling pentru anti-aliasing
  const center = size / 2;
  const cornerRadius = size * 0.225;

  // Bara "/" — segment inclinat, capete rotunjite.
  const markHeight = size * 0.5 * markScale;
  const barRadius = size * 0.058 * markScale;
  const gap = size * 0.115 * markScale;
  const slant = 0.42;
  const bars = [-gap / 2 - barRadius, gap / 2 + barRadius].map((offset) => ({
    x0: center + offset + (slant * markHeight) / 2,
    y0: center - markHeight / 2,
    x1: center + offset - (slant * markHeight) / 2,
    y1: center + markHeight / 2,
  }));

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let rSum = 0;
      let gSum = 0;
      let bSum = 0;
      let aSum = 0;

      for (let sy = 0; sy < SS; sy += 1) {
        for (let sx = 0; sx < SS; sx += 1) {
          const px = x + (sx + 0.5) / SS;
          const py = y + (sy + 0.5) / SS;

          // Fundal: gradient vertical + halo verde in partea de sus.
          const gradient = mix(BG_TOP, BG_BOTTOM, Math.min(1, py / size));
          const glowDistance = Math.hypot(px - center, py - size * 0.12) / (size * 0.62);
          const glowStrength = Math.max(0, 1 - glowDistance) ** 2 * 0.16;
          let color = mix(gradient, GLOW, glowStrength);
          let alpha = 1;

          if (rounded) {
            const sdf = roundedRectSDF(px, py, center, center, center, center, cornerRadius);
            alpha = Math.max(0, Math.min(1, 0.5 - sdf));
          }

          // Marca "//"
          let markCoverage = 0;
          for (const bar of bars) {
            const distance = distanceToSegment(px, py, bar.x0, bar.y0, bar.x1, bar.y1);
            markCoverage = Math.max(
              markCoverage,
              Math.max(0, Math.min(1, barRadius - distance + 0.5)),
            );
          }
          if (markCoverage > 0) color = mix(color, ACID, markCoverage);

          rSum += color[0] * alpha;
          gSum += color[1] * alpha;
          bSum += color[2] * alpha;
          aSum += alpha;
        }
      }

      const samples = SS * SS;
      const index = (y * size + x) * 4;
      const alpha = aSum / samples;
      rgba[index] = Math.round(alpha === 0 ? 0 : rSum / aSum);
      rgba[index + 1] = Math.round(alpha === 0 ? 0 : gSum / aSum);
      rgba[index + 2] = Math.round(alpha === 0 ? 0 : bSum / aSum);
      rgba[index + 3] = Math.round(alpha * 255);
    }
  }

  return encodePNG(size, size, rgba);
}

/** ICO care incapsuleaza un PNG (suportat de toate browserele moderne). */
function pngToIco(png, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // tip: icon
  header.writeUInt16LE(1, 4); // numar de imagini

  const entry = Buffer.alloc(16);
  entry[0] = size >= 256 ? 0 : size;
  entry[1] = size >= 256 ? 0 : size;
  entry[2] = 0;
  entry[3] = 0;
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(header.length + entry.length, 12);

  return Buffer.concat([header, entry, png]);
}

// ── Output ──────────────────────────────────────────────────────────────────

mkdirSync(join(PUBLIC, 'icons'), { recursive: true });

const outputs = [
  ['icons/icon-32.png', renderIcon(32, { rounded: true })],
  ['icons/icon-192.png', renderIcon(192, { rounded: true })],
  ['icons/icon-512.png', renderIcon(512, { rounded: true })],
  // maskable: bleed complet + marca mai mica, ca sa supravietuiasca decuparii
  ['icons/icon-maskable-512.png', renderIcon(512, { rounded: false, markScale: 0.62 })],
  // iOS taie singur colturile => patrat opac
  ['apple-touch-icon.png', renderIcon(180, { rounded: false, markScale: 0.82 })],
];

for (const [name, buffer] of outputs) {
  writeFileSync(join(PUBLIC, name), buffer);
  console.log(`✓ public/${name}  (${(buffer.length / 1024).toFixed(1)} kB)`);
}

const favicon = pngToIco(renderIcon(32, { rounded: true }), 32);
writeFileSync(join(PUBLIC, 'favicon.ico'), favicon);
console.log(`✓ public/favicon.ico  (${(favicon.length / 1024).toFixed(1)} kB)`);
