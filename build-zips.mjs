#!/usr/bin/env node
//
// build-zips.mjs — produce store-ready ZIPs for the Library Vendor Search extension.
//
// The three stores disagree on the MV3 `background` key, so one source manifest
// cannot satisfy all of them. This script keeps a SINGLE source of truth
// (library_vendor_search/) and emits two variants whose ONLY difference is the
// `background` key:
//
//   * <slug>-<version>-firefox.zip   — manifest keeps BOTH `service_worker` and
//                                       `background.scripts`. AMO REQUIRES the
//                                       `scripts` form for MV3.
//   * <slug>-<version>-chromium.zip  — manifest has `background.scripts` DELETED.
//                                       Edge rejects `background.scripts` in MV3
//                                       ("The background.scripts field cannot be
//                                       used with manifest version 3"); Chrome
//                                       accepts its absence. This one zip goes to
//                                       BOTH Chrome and Edge.
//
// The source manifest is never mutated — each variant transforms a COPY.
//
// Usage: npm run package:extension   (or: node build-zips.mjs)

import { rm, mkdir, cp, readFile, readdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, 'library_vendor_search');
const DIST = join(ROOT, 'dist');
const STAGE = join(ROOT, '.build-stage');

// Per-variant manifest transform + the store(s) the resulting zip targets.
const VARIANTS = {
  firefox: {
    stores: ['Firefox Add-ons (AMO)'],
    // Keep both background keys — AMO requires `background.scripts` for MV3.
    transform: () => {}
  },
  chromium: {
    stores: ['Chrome Web Store', 'Microsoft Edge Add-ons'],
    // Strip `background.scripts` — Edge rejects it in MV3; Chrome is fine without it.
    transform: (manifest) => {
      if (manifest.background) delete manifest.background.scripts;
    }
  }
};

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Exclude the build script's own outputs and docs from packaged content.
// (The build script and top-level docs live outside SRC and are never copied;
// this also drops any *.md that might live inside the extension dir.)
function includeInPackage(srcPath) {
  return !srcPath.endsWith('.md');
}

async function main() {
  const sourceManifest = JSON.parse(await readFile(join(SRC, 'manifest.json'), 'utf8'));
  const { name, version } = sourceManifest;
  const slug = slugify(name);

  // Clear old zips only: dist/ also holds the store images from
  // `npm run build:store`, which a zip build has no reason to delete.
  await mkdir(DIST, { recursive: true });
  for (const f of await readdir(DIST)) {
    if (f.endsWith('.zip')) await rm(join(DIST, f), { force: true });
  }
  await rm(STAGE, { recursive: true, force: true });

  const results = [];

  for (const [variant, cfg] of Object.entries(VARIANTS)) {
    const stageDir = join(STAGE, variant);

    // Copy the extension source (minus docs) into a per-variant staging dir.
    await cp(SRC, stageDir, { recursive: true, filter: includeInPackage });

    // Transform a fresh COPY of the manifest — never the source on disk.
    const manifest = JSON.parse(await readFile(join(SRC, 'manifest.json'), 'utf8'));
    cfg.transform(manifest);
    await writeFile(join(stageDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

    // Zip the CONTENTS of the staging dir so manifest.json sits at the zip root.
    const zipName = `${slug}-${version}-${variant}.zip`;
    const zipPath = join(DIST, zipName);
    execFileSync('zip', ['-r', '-q', '-X', zipPath, '.'], { cwd: stageDir });

    results.push({ zipName, stores: cfg.stores });
  }

  await rm(STAGE, { recursive: true, force: true });

  console.log(`\nBuilt ${slug} v${version} → dist/\n`);
  for (const r of results) {
    console.log(`  ${r.zipName}`);
    console.log(`      → ${r.stores.join(', ')}`);
  }
  console.log('\nReminder: bump manifest.json "version" before every re-upload and');
  console.log('add a matching entry to STORE_LISTING.md "Release notes".\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
