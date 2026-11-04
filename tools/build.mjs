#!/usr/bin/env node
/* ============================================================
   Repodest Extension — zero-dependency build script
   Packs the extension into:
     dist/repodest-extension-<version>.zip         (Chrome/Edge store)
     dist/repodest-extension-firefox-<version>.zip (Firefox / AMO)
   Usage: node tools/build.mjs [outdir]
   The Firefox variant patches the manifest: MV3 event page
   (background.scripts) instead of service_worker, gecko id,
   options_ui instead of options_page.
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.resolve(ROOT, process.argv[2] || 'dist');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
const VERSION = manifest.version;

/* ---------- minimal ZIP writer (deflate, forward slashes) ---------- */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function dosDateTime(d) {
  const t = Math.floor(d.getSeconds() / 2) | (d.getMinutes() << 5) | (d.getHours() << 11);
  const dt = d.getDate() | ((d.getMonth() + 1) << 5) | ((d.getFullYear() - 1980) << 9);
  return { t, dt };
}
function writeZip(files) {
  const local = [];
  const central = [];
  let offset = 0;
  for (const f of files) {
    const name = Buffer.from(f.name, 'utf8');
    const { t, dt } = dosDateTime(f.mtime || new Date());
    const deflated = zlib.deflateRawSync(f.data, { level: 9 });
    const method = deflated.length < f.data.length ? 8 : 0;
    const data = method === 8 ? deflated : f.data;
    const crc = crc32(f.data);
    const h = Buffer.alloc(30);
    h.writeUInt32LE(0x04034b50, 0);
    h.writeUInt16LE(20, 4); h.writeUInt16LE(0, 6);
    h.writeUInt16LE(method, 8); h.writeUInt16LE(t, 10); h.writeUInt16LE(dt, 12);
    h.writeUInt32LE(crc, 14); h.writeUInt32LE(data.length, 18); h.writeUInt32LE(f.data.length, 22);
    h.writeUInt16LE(name.length, 26); h.writeUInt16LE(0, 28);
    local.push(h, name, data);
    const c = Buffer.alloc(46);
    c.writeUInt32LE(0x02014b50, 0);
    c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6);
    c.writeUInt16LE(0, 8); c.writeUInt16LE(method, 10); c.writeUInt16LE(t, 12); c.writeUInt16LE(dt, 14);
    c.writeUInt32LE(crc, 16); c.writeUInt32LE(data.length, 20); c.writeUInt32LE(f.data.length, 24);
    c.writeUInt16LE(name.length, 28); c.writeUInt16LE(0, 30); c.writeUInt16LE(0, 32);
    c.writeUInt16LE(0, 34); c.writeUInt16LE(0, 36); c.writeUInt32LE(0, 38);
    c.writeUInt32LE(offset, 42);
    central.push(c, name);
    offset += 30 + name.length + data.length;
  }
  const cdSize = central.reduce((a, b) => a + b.length, 0);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4); eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8); eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(cdSize, 12); eocd.writeUInt32LE(offset, 16); eocd.writeUInt16LE(0, 20);
  return Buffer.concat([...local, ...central, eocd]);
}

/* ---------- collect files ---------- */
const EXCLUDE = new Set(['tests', '.github', 'store', 'tools', 'dist', '.git']);
function walk(dir, base) {
  let out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDE.has(e.name)) continue;
    const full = path.join(dir, e.name);
    const rel = base ? base + '/' + e.name : e.name;
    if (e.isDirectory()) out = out.concat(walk(full, rel));
    else out.push({ name: rel, data: fs.readFileSync(full), mtime: fs.statSync(full).mtime });
  }
  return out;
}
const files = walk(ROOT, '');

fs.mkdirSync(OUT, { recursive: true });

/* ---------- Chrome / Edge store zip ---------- */
const chromeZip = path.join(OUT, `repodest-extension-${VERSION}.zip`);
fs.writeFileSync(chromeZip, writeZip(files));

/* ---------- Firefox zip (AMO) ---------- */
const ffManifest = JSON.parse(JSON.stringify(manifest));
delete ffManifest.background;
ffManifest.background = { scripts: ['background/service-worker.js'] };
delete ffManifest.options_page;
ffManifest.options_ui = { page: 'options/options.html', open_in_tab: true };
ffManifest.browser_specific_settings = {
  gecko: { id: 'repodest-extension@mohsen-niksirat.github.io', strict_min_version: '115.0' }
};
const ffFiles = files
  .filter((f) => f.name !== 'manifest.json')
  .concat([{ name: 'manifest.json', data: Buffer.from(JSON.stringify(ffManifest, null, 2) + '\n', 'utf8'), mtime: new Date() }]);
const firefoxZip = path.join(OUT, `repodest-extension-firefox-${VERSION}.zip`);
fs.writeFileSync(firefoxZip, writeZip(ffFiles));

console.log('built ' + path.relative(ROOT, chromeZip) + '  (' + files.length + ' files)');
console.log('built ' + path.relative(ROOT, firefoxZip) + '  (gecko ' + ffManifest.browser_specific_settings.gecko.id + ')');
