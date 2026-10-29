# Store listing & re-submission guide

Operational playbook for publishing and **re-publishing** Library Vendor Search
to the Chrome Web Store, Microsoft Edge Add-ons, and Firefox Add-ons (AMO).
Read this before every upload — the gotchas here are the ones that actually
bite.

---

## TL;DR build & upload

```bash
npm run package:extension   # → dist/library-vendor-search-<version>-firefox.zip
                            # → dist/library-vendor-search-<version>-chromium.zip
```

| Zip | Upload to | Background key |
|-----|-----------|----------------|
| `…-chromium.zip` | **Chrome Web Store** AND **Microsoft Edge Add-ons** | `background.scripts` **removed** |
| `…-firefox.zip`  | **Firefox Add-ons (AMO)** | keeps **both** `service_worker` + `background.scripts` |

One source of truth lives in `library_vendor_search/`. The only per-store
difference is the `background` key, applied by `build-zips.mjs` to a *copy* of
the manifest — never the source.

---

## Why two zips? (the MV3 `background` trap)

The three stores disagree on the MV3 `background` key, and no single manifest
satisfies all of them:

- **Firefox (AMO)** *requires* `background.scripts` for MV3 (it runs the
  background as a non-persistent page via `scripts` and ignores
  `service_worker`). Missing it → rejection.
- **Edge** *rejects* `background.scripts` at validation with the exact error:
  `The background.scripts field cannot be used with manifest version 3`.
- **Chrome** uses `service_worker` and accepts either form.

So the source manifest declares **both** keys, and the build emits:
- firefox zip → both keys kept.
- chromium zip → `background.scripts` deleted (serves Chrome *and* Edge).

### One background.js, two runtimes
`background.js` loads the polyfill differently per engine, guarded so the same
file works in both:

```js
if (typeof importScripts === 'function') {
  importScripts('vendor/browser-polyfill.min.js'); // Chromium service worker
}
// Firefox loads the polyfill as the first entry of manifest background.scripts
```

**Do not remove that guard.** Without it Firefox throws
`ReferenceError: importScripts is not defined` on startup. Content scripts and
the options page load the polyfill via the manifest (`content_scripts[].js` and
a `<script>` tag in `options.html`), so they need no guard.

---

## Versioning + release-notes discipline

- **Every re-upload needs a NEW `version` in `library_vendor_search/manifest.json`.**
  All three stores reject a re-upload of an already-used version, even if the
  bytes differ.
- **Pair every bump with a release-notes entry below.** Each store asks
  "what's new in this version" at upload — paste the matching block.
- Convention: **patch** (`x.y.Z`) for bug fixes, validator workarounds, copy
  tweaks, and single-string changes (e.g. adding a host permission); **minor**
  (`x.Y.0`) for new behavior, a runtime/packaging change, or anything that
  changes compatibility (e.g. raising `strict_min_version`).
- `package.json` also carries a `version`, but it is cosmetic — the build reads
  the shipped version straight from `manifest.json`, which is authoritative.

### Release notes

#### 7.11.1
- Refreshed the extension icons (16, 48 and 128 px). Same open book and magnifier on the same blue, redrawn so it is sharp at every size; the small toolbar icon is simplified so it still reads at 16 px. Nothing about how the extension works has changed.

#### 7.11.0
- "Search all vendors" now covers the book vendors only by default. WorldCat and your library catalog keep their own menu items, so a sweep of where to order from doesn't also open the two lookups.
- A new popup option, "Include supplementary sources", opts them back in. The menu item is then named "Search all sources" so its title matches what it opens. Either way the item is hidden unless it would open more than one tab.
- The catalog address field no longer suggests a specific library by name.

#### 7.10.0
- New **Library catalog** source (off by default): enter your library's BiblioCommons address in the popup and the right-click menu can search your own catalog alongside the vendors.
- The address field accepts whatever you paste: the short name on its own, `yourlibrary.bibliocommons.com`, or a full URL. It resolves to the one instance it will search, shown beneath the field.
- The catalog menu item stays hidden until a valid address is entered, so it never appears as an item that opens a broken URL.
- Like WorldCat, this needs **no new permissions and no new host match**: the extension only opens a search URL and runs no script on the catalog.
#### 7.9.0
- New **WorldCat** source (off by default; enable it in the popup). Searching it opens `search.worldcat.org` with your term, which is useful for checking holdings, editions, and who else owns a title.
- WorldCat is grouped separately from the vendors in both the popup and the right-click menu: it's a lookup source, not somewhere you place an order. It is not part of "Search all vendors", which stays a sweep of the vendors you order from.
- WorldCat needs **no new permissions and no new host match**. Its search is a public results URL, so unlike the vendor sites it uses no content script.

#### 7.8.0
- New **"Search all vendors"** option in the popup (off by default). Turn it on and the right-click menu gains a "Search all vendors for '<term>'" entry that opens each enabled vendor in its own tab, in menu order, immediately to the right of the current tab.
- With "focus new tab" selected, only the first of those tabs takes focus, so the remaining vendors load in the background instead of stealing focus one after another.
- The entry only appears when two or more vendors are enabled. With a single vendor it would duplicate that vendor's own menu item.

#### 7.7.1
- Fixed Libraria search: the extension now opens Libraria's results page directly with the search term (Libraria is a Magento store, so search is a `/catalogsearch/result/?q=` URL). Previously it relied on filling the search box, which silently did nothing. The content script remains as a fallback for the just-logged-in case.
- If "clean up search text" empties the selection (e.g. only "by" or punctuation was selected), the original selection is now used instead of running a blank search (applies to all vendors).
- The Libraria content script now disconnects its DOM observer once a search is committed, instead of observing for the page's lifetime.
- "Clean up search text" now defaults to **on** for new installs (existing users keep whatever they chose). It can still be toggled off in the popup.

#### 7.7.0
- Cross-store publishing infrastructure: two-zip build (`npm run package:extension`) producing Firefox and Chromium/Edge packages from one source.
- Migrated the codebase from callback-style `chrome.*` to promise-based `browser.*` via Mozilla's `webextension-polyfill` (bundled in `vendor/`).
- Fixed the Firefox `strict_min_version` to `140.0` so it matches the declared `data_collection_permissions` feature (AMO would otherwise reject the mismatch). Note: this drops support for Firefox 109–139.

---

## Store description & summary (canonical copy)

**This is the one copy.** Every store's description comes from here. Paste it
and don't rewrite per store, or the three listings drift.

**Do not re-wrap the fenced blocks.** Everything inside them is meant to be
copied straight into a store form field, so each paragraph and each bullet is
one long line on purpose. Hard-wrapping them puts the line breaks into the
field. The same goes for the release-notes bullets above and for the paste
blocks in `EDGE_SUBMISSION.md`. Plain punctuation only in that text, no em
dashes. Update this section in
the same commit that adds or removes a source, exactly like the release notes.

Where each piece goes:

| Store | Field | Limit | Paste |
|-------|-------|-------|-------|
| Chrome | Short description | 132 chars | manifest `description` (below) |
| Chrome | Detailed description | 16,000 chars | **Long description** |
| Edge | Short description | 132 chars | manifest `description` (below) |
| Edge | Description | 250–10,000 chars | **Long description** |
| AMO | Summary | 250 chars | **Summary** |
| AMO | Description | none | **Long description** |

Chrome and Edge take the short description straight from `manifest.json`
`description`, so changing it there changes both listings on the next upload.
AMO's Summary is a separate field with no manifest equivalent.

### Short description (mirrors `manifest.json` `description`, 98 chars, limit 132)
```
Select text, right-click, and search Ingram, Brodart, Libraria, WorldCat, or your library catalog.
```

### Summary (AMO only, 192 chars, limit 250)
```
Highlight a title, author, or ISBN on any page, right-click, and search it on Ingram, Brodart, Libraria, WorldCat, or your library's own BiblioCommons catalog, with the term already filled in.
```

### Long description (1,838 chars counting line breaks; Edge needs at least 250, Chrome allows up to 16,000)
```
Library Vendor Search is a right-click tool for librarians and acquisitions staff. Highlight any text on a web page (a title, an author, an ISBN), right-click it, and pick where to search. The extension opens that site in a new tab with your selected term already entered, saving you the copy-paste round trip.

Book vendors: Ingram (ipage), Brodart (Bibz), and Libraria. These are the purchasing portals you order from, reached through your library's existing login.

Lookup sources: WorldCat, for checking holdings and editions with no account needed, and your own library's catalog. Enter your library's BiblioCommons address in the popup once and your catalog joins the right-click menu alongside the vendors. Paste the address in any form (the short name, the address, or a whole search link) and the popup shows the one catalog it will search. Both lookups are off until you switch them on, and they sit below a divider in the menu, apart from the vendors.

Everything is set from the toolbar popup. Turn individual sources on or off. Add a single "Search all vendors" item (off by default) that opens every enabled vendor at once, each in its own tab beside the page you're on, and choose whether WorldCat and your catalog join it, in which case it becomes "Search all sources". Choose whether new tabs open in the foreground or the background. The selected text is also cleaned up before searching, which removes stray colons, commas, and the word "by" so that a copied "Dune: A Novel, by Frank Herbert" behaves in a vendor search box. That is on by default, and you can switch it off to search exactly what you selected.

Your data stays on your device. The extension stores only your own preferences and the term you are currently searching, in the browser's own storage. Nothing is collected, and nothing is sent to any server.
```

---

## Store images

`npm run build:store` rebuilds every listing image into `dist/store-images/`
(see `tools/store-images/` and the "Store images" section of `CLAUDE.md`).
Where each one goes:

| File | Chrome | Edge | AMO |
|------|--------|------|-----|
| `promo-small-440x280.png` | Small promo tile (required) | Small promotional tile | (no slot) |
| `marquee-1400x560.png` | Marquee promo tile | Large promotional tile | (no slot) |
| `screenshot-0-overview` ... `screenshot-4-clean-text` (1280x800) | Screenshots, all five (max 5) | Screenshots (max 6) | Screenshots |
| `logo-edge-300x300.png` | (uses the manifest icon) | Extension logo | (uses the manifest icon) |

Upload the screenshots in number order. Rebuild and re-upload after any
visible change to the popup or the menu.

---

## Per-store metadata to (re)confirm

Stores sometimes re-ask for these on resubmission — keep answers handy:

- **Privacy policy URL** — required by Chrome/Edge if any permission could touch
  user data. This extension stores only a transient search term and user
  toggles locally; no remote collection. Published policy:
  https://docs.google.com/document/d/e/2PACX-1vR2FNp7vnlQ37xpuu-FwKskRNwU9VLTDLO4JUV6gc9_tjwXv6yT23E3OJyV72MkeMlPoKczucsqCdR2/pub
  (mirrored in `PRIVACY.md`).
- **Single-purpose statement** — "Lets a librarian search a selected term on a
  library book vendor's site (Ingram, Brodart, Libraria), in WorldCat, or in
  their own library's BiblioCommons catalog, via the right-click menu."
- **Permission justifications:**
  - `contextMenus` — adds the right-click "Search <Vendor>" entries.
  - `storage` — temporarily passes the selected term to the vendor tab
    (`storage.local`, cleared after the search) and saves user preferences —
    enabled vendors, foreground/background tab, clean-up-text option,
    search-all-vendors option (`storage.sync`). Nothing is collected or
    transmitted.
  - host matches (`ipage.ingramcontent.com`, `bibz2.com`, `libraria.com`) —
    the content scripts that fill each vendor's search box run only on those
    sites. WorldCat and the BiblioCommons catalog add no host match: their
    searches are plain results URLs, so the extension only opens a tab and runs
    no script there. The catalog's address comes from a `storage.sync`
    preference the user types, and is validated to a single
    `*.bibliocommons.com` host before use.
- **Data collection (AMO):** manifest declares
  `data_collection_permissions: { required: ["none"] }`.

---

## Per-store gotchas (carry these forward)

### Chrome Web Store
- One-time **$5 developer registration fee** (first publish only).
- Upload the **chromium** zip.
- Review typically **1–3 days**.

### Firefox Add-ons (AMO)
- Free. Review usually **< 24h**, but the **strictest validator**.
- Upload the **firefox** zip (must contain `background.scripts`).
- Common rejections to avoid:
  - Dynamic `innerHTML` in popups/pages (we don't use it — keep it that way;
    set values via `.value`/`.textContent`, not by injecting HTML strings).
  - Missing `background.scripts`.
  - `strict_min_version` not matching a declared feature (the reason it is
    pinned to `140.0` for `data_collection_permissions`).
- Requires `browser_specific_settings.gecko` with a stable `id` (already set:
  `library-vendor-search@your-library.org`).

### Microsoft Edge Add-ons
- Free. Review typically **24–72h** (Microsoft states up to 7 business days).
- Upload the **chromium** zip.
- Rejects `background.scripts` in MV3 — exact error:
  `The background.scripts field cannot be used with manifest version 3`.
- **First time publishing to Edge?** See **`EDGE_SUBMISSION.md`** for the full
  Partner Center walkthrough (account setup, the 2026 Privacy page, and
  paste-ready listing copy + reviewer notes). Privacy policy URL:
  [Google Doc](https://docs.google.com/document/d/e/2PACX-1vR2FNp7vnlQ37xpuu-FwKskRNwU9VLTDLO4JUV6gc9_tjwXv6yT23E3OJyV72MkeMlPoKczucsqCdR2/pub)
  (text mirrored in **`PRIVACY.md`**).

---

## Firefox (AMO) submission fields

What to put in the two fields on AMO's "Submit a New Version" page. As above,
the fenced blocks are unwrapped on purpose: paste them as-is.

**Release Notes** (public — shown on the listing's detail page, so write for
*users*, covering what's new since the version they currently have):

```
New in this version:
• You can now search your own library's BiblioCommons catalog. Enter your catalog address in the toolbar popup and it joins the right-click menu.
• WorldCat is now supported as a lookup source, alongside the book vendors. Turn it on in the toolbar popup, then right-click a selection to check holdings and editions on search.worldcat.org. Unlike the vendor sites it needs no login.
• Libraria is now supported as a third book vendor. Highlight a title, right-click, and search Ingram, Brodart, or Libraria.
• Settings now live in the toolbar popup: turn each vendor on or off, choose whether result tabs open in the foreground or background, and clean up selected text (removing stray colons, commas, and the word "by") before searching. It is on by default and can be turned off in the popup.

Note: this version requires Firefox 140 or newer.
```

**Notes to Reviewer** (private — addresses AMO's source-code/build policy and the
fact that the vendor sites are login-gated):

```
SOURCE CODE & BUILD PROCESS
This add-on uses no build step, bundler, transpiler, or minifier of our own. The files in this package are the complete, human-readable source and run exactly as submitted. The only pre-minified file is vendor/browser-polyfill.min.js, an unmodified copy of Mozilla's webextension-polyfill v0.12.0, obtained from npm (npm pack webextension-polyfill@0.12.0) and also available at https://github.com/mozilla/webextension-polyfill . Its license is included at vendor/browser-polyfill-LICENSE.txt .

HOW TO TEST
1. Select/highlight some text on any web page (e.g., a book title).
2. Right-click and choose "Search Library Vendors" → "Search Ingram / Brodart / Libraria for '<your text>'" (a single "Search <Vendor>" item appears if only one vendor is enabled in the toolbar popup).
3. A new tab opens to the vendor's site and your selected text is entered into that site's search box and submitted.

NO ACCOUNT? TEST WITH WORLDCAT:
Open the toolbar popup and enable "WorldCat" under Supplementary, then repeat the steps above and choose "Search WorldCat for '<your text>'". WorldCat (search.worldcat.org) is a public catalogue that needs no login, so this path demonstrates the extension's full behaviour end to end without a library account. The extension opens the results URL directly and runs no script on that site.

PLEASE NOTE: gated vendor portals.

The three vendor sites (ipage.ingramcontent.com, www.bibz2.com, www.libraria.com) are professional library purchasing portals that require an institutional login to reach a search box. Without an account, the new tab will land on the vendor's login page. This is expected. The add-on keeps the pending term and fills the search box automatically once you are logged in and a search box is present. The context-menu items, tab opening, and the toolbar popup are all fully testable without an account.

PRIVACY/DATA:
The add-on collects and transmits no data. The selected term (storage.local) and the user's preferences (storage.sync) stay in the browser. No remote code is loaded.
```

---

## Refreshing the bundled polyfill

The shipped polyfill is `library_vendor_search/vendor/browser-polyfill.min.js`
(pinned to `webextension-polyfill@0.12.0` in `package.json`). To update it:

```bash
npm pack webextension-polyfill@<version>
tar -xzf webextension-polyfill-<version>.tgz
cp package/dist/browser-polyfill.min.js library_vendor_search/vendor/
cp package/LICENSE library_vendor_search/vendor/browser-polyfill-LICENSE.txt
rm -rf package webextension-polyfill-*.tgz
```

Then bump the pin in `package.json` and add a release-notes entry.

---

## Cross-file couplings (don't break these)

- `manifest.json version` ↔ this doc's **Release notes** — bump and document
  together.
- `VENDORS` in `background.js` ↔ this doc's **Store description & summary** ↔
  `manifest.json description` ↔ `PRIVACY.md`. Adding or removing a source
  changes what all three listings and the privacy policy claim the extension
  does. Update them in the same commit.
- `manifest.json background` ↔ `build-zips.mjs` strip logic — the build assumes
  the source keeps **both** background keys and deletes `scripts` only for the
  chromium variant. If you change the background shape, update the build.
- `manifest.json background.scripts[0]` / `content_scripts[].js[0]` /
  `options.html` `<script>` ↔ `vendor/browser-polyfill.min.js` — every runtime
  loads the polyfill first; the service worker loads it via `importScripts`.
