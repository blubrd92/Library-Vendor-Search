#!/usr/bin/env node
/**
 * Build the Library Vendor Search store images (promo tiles, screenshots,
 * logo) into dist/store-images/.
 *
 * Run with: npm run build:store
 *
 * NOTHING IN THE EXTENSION NEEDS THIS. The images are uploaded by hand to
 * the Chrome Web Store, Edge Add-ons and Firefox Add-ons listings; this
 * rebuilds them when the popup or the menu changes enough that the listing
 * misrepresents it. Output goes to dist/ (gitignored), the same place the
 * extension zips land.
 *
 * Sizes, and who asks for them:
 *   - 440x280 small promo tile: Chrome (required), Edge (optional)
 *   - 1400x560 marquee promo tile: Chrome (optional), Edge large tile
 *   - 1280x800 screenshots: Chrome, Edge and Firefox
 *   - 300x300 logo: Edge
 *
 * It is NOT dependency-free: it drives a real browser and fetches fonts
 * over the network. That is a deliberate choice, kept out of package.json
 * so the extension's own install stays empty:
 *
 *   npm install --no-save playwright-core
 *   npx playwright install chromium     # or set PLAYWRIGHT_CHROMIUM
 *
 * Fonts come from Google Fonts at build time and are inlined as data URLs.
 *
 * What is real and what is not:
 *   - The popup is the shipped library_vendor_search/options.html and
 *     options.js, unmodified. Only the webextension polyfill is swapped for
 *     a stub that answers its browser.* calls with sample settings. Inter
 *     stands in for the system UI font it asks for, which Linux doesn't have.
 *   - The menu strings come from running the real background.js
 *     createMenus() (and sanitizeTerm, fanOutTargets, the catalog
 *     validator) in node:vm against a browser stub. The menu's LOOK is an
 *     HTML replica, though: headless Chromium can't capture the browser's
 *     own context menu.
 *   - The page content and titles are invented.
 *
 * Each image is rendered at 2x and downscaled, then written as a 24-bit
 * RGB PNG (no alpha channel): browser canvases always encode RGBA, so
 * the PNG is assembled here with node:zlib.
 */

import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';
import { deflateSync } from 'node:zlib';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FONT_FAMILIES, POPUP_SCENES, MENU_SETTINGS, storeImages } from './templates.mjs';

const TOOL_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(TOOL_DIR, '..', '..');
const EXT_DIR = join(REPO_ROOT, 'library_vendor_search');
const OUT_DIR = join(REPO_ROOT, 'dist', 'store-images');
const PORT = 8741;
const SCALE = 2;

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.gif': 'image/gif',
};

function curl(url, binary) {
  // curl rather than fetch: it honours HTTPS_PROXY without extra wiring.
  return execFileSync('curl', [
    '-sS', '--fail', '--max-time', '45',
    '-A', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
    url,
  ], { encoding: binary ? 'buffer' : 'utf8', maxBuffer: 32 * 1024 * 1024 });
}

/** Google Fonts CSS -> latin @font-face blocks with the woff2 inlined. */
function inlineFonts(families) {
  const css = curl(`https://fonts.googleapis.com/css2?family=${families}&display=swap`, false);
  const out = [];
  for (const [, subset, block] of css.matchAll(/\/\*\s*([a-z-]+)\s*\*\/\s*(@font-face\s*\{[\s\S]*?\})/g)) {
    if (subset !== 'latin') continue;
    const url = block.match(/url\((https:\/\/[^)]+)\)/)[1];
    out.push(block
      .replace(/url\(https:\/\/[^)]+\)/, `url(data:font/woff2;base64,${curl(url, true).toString('base64')})`)
      .replace(/\s*unicode-range:[^;]+;/, ''));
  }
  if (!out.length) throw new Error(`no latin font faces resolved for ${families}`);
  return out.join('\n');
}

function serveRepo() {
  const server = createServer((req, res) => {
    let rel = decodeURIComponent(req.url.split('?')[0]);
    if (rel.endsWith('/')) rel += 'index.html';
    const file = join(REPO_ROOT, rel);
    if (!file.startsWith(REPO_ROOT) || !existsSync(file)) {
      res.writeHead(404).end('not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(readFileSync(file));
  });
  return new Promise(ok => server.listen(PORT, '127.0.0.1', () => ok(server)));
}

/* ---- the real background logic, run in node:vm -------------------- */
/**
 * Load catalog.js and background.js into a sandbox whose `browser` is a
 * stub, run the real createMenus() against MENU_SETTINGS, and return what
 * the templates need: the menu items it created, plus the real helper
 * functions. No browser involved.
 */
async function loadLogic() {
  const created = [];
  const noop = { addListener() {} };
  const browser = {
    storage: {
      sync: { get: async (defaults) => ({ ...defaults, ...MENU_SETTINGS }) },
      local: { get: async () => ({}), set: async () => {}, remove: async () => {} },
    },
    contextMenus: {
      removeAll: async () => { created.length = 0; },
      create: (props) => { created.push({ ...props }); },
      onClicked: noop,
    },
    runtime: { onInstalled: noop, onMessage: noop },
    tabs: { onRemoved: noop, create: async () => ({ id: 1 }) },
  };
  // importScripts stays undefined: background.js guards on typeof, and the
  // two files are loaded here by hand, in the same order the manifest uses.
  const ctx = vm.createContext({ browser, console, URLSearchParams });
  for (const name of ['catalog.js', 'background.js']) {
    const file = join(EXT_DIR, name);
    vm.runInContext(readFileSync(file, 'utf8'), ctx, { filename: file });
  }
  const run = (expr) => vm.runInContext(expr, ctx, { filename: 'build.mjs' });

  await run('createMenus()');
  if (!created.length) throw new Error('createMenus() produced no menu items under MENU_SETTINGS');

  const VENDORS = run('VENDORS');
  const { enabled, includeSupplementary } = await run('getMenuSettings()');
  const fanOutFn = run('fanOutTargets');

  const logic = {
    menu: created.map(({ id, parentId, title, type }) => ({ id, parentId, title, type })),
    sanitizeTerm: run('sanitizeTerm'),
    normalizeCatalog: run('normalizeBiblioCommonsInstance'),
    vendors: VENDORS.map(v => ({
      id: v.id, key: v.key, label: v.label,
      supplementary: !!v.supplementary,
      defaultEnabled: v.defaultEnabled !== false,
      contentScript: v.contentScript !== false,
    })),
    fanOut: fanOutFn(enabled, includeSupplementary).map(v => v.label),
  };
  console.log('  menu:    ' + logic.menu.map(m => m.type === 'separator' ? '---' : m.title).join(' | '));
  return logic;
}

/* ---- minimal RGB PNG encoder ------------------------------------- */
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
/** RGBA pixels (opaque) -> 8-bit RGB PNG. */
function encodeRgbPng(rgba, w, h) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    const row = y * (w * 3 + 1);           // filter byte 0 (None) per row
    for (let x = 0; x < w; x++) {
      const s = (y * w + x) * 4, d = row + 1 + x * 3;
      raw[d] = rgba[s]; raw[d + 1] = rgba[s + 1]; raw[d + 2] = rgba[s + 2];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2;                 // 8-bit, truecolour, no alpha
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

async function main() {
  let chromium;
  try {
    ({ chromium } = await import('playwright-core'));
  } catch {
    console.error(
      '\nplaywright-core is not installed. It is intentionally not a\n' +
      'devDependency, so install it just for this run:\n\n' +
      '  npm install --no-save playwright-core\n' +
      '  npx playwright install chromium     # or set PLAYWRIGHT_CHROMIUM\n');
    process.exit(1);
  }
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM
    || (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

  const logic = await loadLogic();
  const fonts = inlineFonts(FONT_FAMILIES);
  console.log('  fonts:   inlined');

  const server = await serveRepo();
  const browser = await chromium.launch({ executablePath });
  const base = `http://127.0.0.1:${PORT}`;
  const asDataUrl = (buf) => 'data:image/png;base64,' + buf.toString('base64');

  try {
    // ---- 1. the real popup, once per scene -------------------------------
    async function capturePopup(scene) {
      const context = await browser.newContext({
        colorScheme: scene.colorScheme || 'light',
        deviceScaleFactor: SCALE,
        viewport: { width: 420, height: 1200 },   // taller than the popup, so nothing scrolls
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(String(e)));
      // options.js only needs these browser.* calls. Settings come from the
      // scene, layered over whatever defaults options.js asks for.
      await page.route('**/vendor/browser-polyfill.min.js', r => r.fulfill({
        contentType: 'text/javascript',
        body: `window.browser = (() => {
          const SETTINGS = ${JSON.stringify(scene.settings)};
          return {
            storage: {
              sync: { get: async (defaults) => ({ ...(defaults || {}), ...SETTINGS }), set: async () => {} },
              local: { get: async () => ({}), set: async () => {} },
              onChanged: { addListener() {} },
            },
            runtime: { sendMessage: async () => ({}) },
          };
        })();`,
      }));
      await page.addInitScript((css) => {
        document.addEventListener('DOMContentLoaded', () => {
          const s = document.createElement('style');
          s.textContent = css + '\nbody { font-family: Inter, sans-serif !important; -webkit-font-smoothing: antialiased; }';
          document.head.appendChild(s);
        });
      }, fonts);
      await page.goto(`${base}/library_vendor_search/options.html`);
      await page.evaluate(() => document.fonts.ready);
      if (typeof scene.type === 'string') {
        // Real keystrokes so options.js's own input handler and catalog hint
        // run. No blur: that would fire `change` and rewrite the field.
        if (!(await page.$('#catalogInstance'))) throw new Error('selector #catalogInstance not found in options.html');
        await page.click('#catalogInstance');
        await page.keyboard.type(scene.type);
        for (const key of scene.press || []) await page.keyboard.press(key);
        // Let the debounced save fire and the transient "Saved" fade out
        // (visible 1200ms after the save) so it isn't caught half-faded.
        await page.waitForTimeout(1800);
      }
      await page.waitForTimeout(500);
      const grab = async (selector) => {
        const el = await page.$(selector);
        if (!el) throw new Error(`selector ${selector} not found in options.html`);
        const box = await el.boundingBox();
        return { url: asDataUrl(await el.screenshot()), size: { w: Math.round(box.width), h: Math.round(box.height) } };
      };
      const out = { body: await grab('body') };
      // Close-ups of parts of the same render, for insets.
      for (const [clip, selector] of Object.entries(scene.clips || {})) out[clip] = await grab(selector);
      await context.close();
      if (errors.length) throw new Error(`popup scene threw: ${errors[0]}`);
      return out;
    }
    const shots = {};
    for (const [name, scene] of Object.entries(POPUP_SCENES)) {
      for (const [part, { url, size }] of Object.entries(await capturePopup(scene))) {
        const key = part === 'body' ? name : `${name}_${part}`;
        shots[key] = url;
        shots[key + 'Size'] = size;
      }
    }
    console.log(`  popup:   ${Object.keys(POPUP_SCENES).join(', ')} captured`);

    // ---- 2. render each image -----------------------------------------
    const images = storeImages({ shots, fonts, logic });
    mkdirSync(OUT_DIR, { recursive: true });
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: SCALE });

    for (const [name, { w, h, html }] of Object.entries(images)) {
      const page = await ctx.newPage();
      await page.setViewportSize({ width: w, height: h });
      await page.setContent(
        `<!doctype html><html><body style="width:${w}px;height:${h}px;position:relative">${html}</body></html>`,
        { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(250);
      const big = await page.screenshot();   // w*SCALE x h*SCALE
      // Downscale in the browser (no image library), hand back raw RGBA.
      const b64 = await page.evaluate(async ({ src, w, h }) => {
        const img = new Image();
        await new Promise((ok, err) => { img.onload = ok; img.onerror = err; img.src = src; });
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const x = c.getContext('2d');
        x.imageSmoothingQuality = 'high';
        x.drawImage(img, 0, 0, w, h);
        const px = x.getImageData(0, 0, w, h).data;
        let s = '';
        for (let i = 0; i < px.length; i += 0x8000) s += String.fromCharCode(...px.subarray(i, i + 0x8000));
        return window.btoa(s);
      }, { src: asDataUrl(big), w, h });
      await page.close();
      const rgba = Buffer.from(b64, 'base64');
      if (rgba.length !== w * h * 4) throw new Error(`${name}: downscaled buffer is ${rgba.length} bytes, expected ${w * h * 4}`);
      const png = encodeRgbPng(rgba, w, h);
      writeFileSync(join(OUT_DIR, name), png);
      console.log(`  wrote    dist/store-images/${name}  ${w}x${h}  ${(png.length / 1024).toFixed(0)} KB`);
    }
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => { console.error('\nbuild failed:', err.message); process.exit(1); });
