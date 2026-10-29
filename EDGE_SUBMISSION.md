# First-time Microsoft Edge Add-ons submission

A start-to-finish guide for publishing **Library Vendor Search** to Microsoft
Edge Add-ons for the **first time**. For ongoing re-uploads and the cross-store
overview, see `STORE_LISTING.md`. The reusable copy you'll paste (single-purpose
statement, permission justifications, certification notes, description) lives at
the bottom of this file.

> Which file to upload: **`dist/library-vendor-search-<version>-chromium.zip`**
> (the variant with `background.scripts` removed). Build it with
> `npm run package:extension`.

---

## 0. One-time account setup
- Edge extensions are **free** — there is **no registration fee** (Chrome's $5
  fee does not apply here).
- Create a developer account at **Partner Center**:
  https://partner.microsoft.com/dashboard/microsoftedge/public/login
- The account needs a **Microsoft account (MSA)** as the **Primary Owner**.
- This is a separate dashboard from the Chrome Web Store and AMO; the same zip
  (chromium) you give Chrome is what you upload here.

## 1. Create the extension entry
1. In the Partner Center dashboard, click the **+** icon to create a new
   extension.
2. The **Upload package (.zip file)** page opens — drop in the **chromium** zip.
3. Partner Center validates the package and shows an **Extension overview**.
   - If it complains `The background.scripts field cannot be used with manifest
     version 3`, you uploaded the **firefox** zip by mistake. Upload the
     **chromium** one.
4. Click **Continue** → **Availability**.

## 2. Availability
- **Visibility:** `Public` (discoverable) unless you have a reason to pick
  `Hidden` (URL-only).
- **Markets:** default is **all markets** — leave as-is unless you need to
  restrict regions.
- **Save & Continue.**

## 3. Properties
- **Category (required):** `Productivity` is the best fit for a librarian search
  tool. (No "library" category exists; `Productivity` or `Search Tools` are the
  usual picks.)
- **Website (optional):** your library/department site, if any.
- **Support contact (optional):** a support email or URL.
- **Mature content:** leave unchecked.
- **Save & Continue.**

## 4. Privacy page  ← the 2026 addition, where first-timers get stuck
This dedicated page replaced the old "privacy" box. Fill every section:

- **Single purpose** — paste the statement from §A below.
- **Permission justifications** — one line per declared permission; paste from
  §B below. List `contextMenus`, `storage`, and the three host matches.
- **Remote code:** **No.** This is an MV3 extension; it ships no remote code and
  loads no external scripts. (All JS, including the polyfill, is bundled.)
- **Data usage certification:** the extension collects/transmits **no** user
  data — the selected term and the on/off toggles never leave the browser
  (`storage.local` / `storage.sync` only). Check the boxes that assert **no data
  collection**.
- **Privacy policy URL (required):** paste the published policy link:
  https://docs.google.com/document/d/e/2PACX-1vR2FNp7vnlQ37xpuu-FwKskRNwU9VLTDLO4JUV6gc9_tjwXv6yT23E3OJyV72MkeMlPoKczucsqCdR2/pub
  (it must be viewable to anyone with the link). The version-controlled copy of
  that text lives in **`PRIVACY.md`** — keep the two in sync. Without a reachable
  URL the Privacy page won't let you continue.
- **Save & Continue.**

## 5. Store listing (per language — at minimum English)
Click **Edit details** on the language row. Required:
- **Description**, 250 to 10,000 characters. See §C below: the text lives in
  `STORE_LISTING.md` (Store description & summary), already over the 250
  minimum. Edit it there, not here, so all three stores stay in step.
- **Extension logo**: 300×300 px recommended (128×128 minimum). Upload
  `dist/store-images/logo-edge-300x300.png` from `npm run build:store`; the
  shipped `images/icon-128.png` only meets the minimum.
- **Name** and **short description** are pulled from the manifest
  (`Library Vendor Search` / "Select text, right-click, and search Ingram,
  Brodart, Libraria, WorldCat, or your library catalog.").

Strongly recommended (improves listing quality / approval odds):
- **Screenshots** — up to 6, at **1280×800** or 640×480. At least **one** is
  expected. Upload the five `screenshot-*` files from `npm run build:store`
  (in `dist/store-images/`), in number order.
- **Small promotional tile**: 440×280 (optional): `promo-small-440x280.png`.
  The large tile (1400×560, PNG) is `marquee-1400x560.png`.
- **Search terms** — up to 7 phrases / 21 words, e.g. `library`, `cataloging`,
  `book vendor`, `Ingram`, `Brodart`, `Libraria`/`WorldCat`, `acquisitions`
  (7 phrases max, so pair or drop one as needed).

**Save draft**, then make sure the language row shows **Complete**.

## 6. Submit for certification
- Click **Publish** → the **Submit your extension** page opens.
- **Notes for certification (critical for this extension):** paste §D below.
  These three vendor sites require library/institutional logins, so a reviewer
  without an account can't watch the search box auto-fill. The note explains the
  flow and what *is* observable without an account — this is the single biggest
  thing that prevents a "the extension doesn't appear to do anything" rejection.
- Click **Publish** to submit.
- **Certification:** up to **7 business days** (often faster, ~24–72h). Status
  moves through the pipeline and ends at **In the Store**.

---

## Paste-ready content

### §A — Single-purpose statement
```
Library Vendor Search lets a librarian highlight a term on any web page, right-click it, and open that term as a search on a library book vendor's website (Ingram, Brodart, or Libraria), in WorldCat, or in their own library's BiblioCommons catalog. That is its only function.
```

### §B — Permission justifications
```
contextMenus: Adds the right-click "Search <Vendor>" menu items that the user clicks to launch a search. This is the extension's entire user interface for starting a search.

storage: Used for two things. First, it temporarily passes the selected book title from the right-click menu (in the background script) to the new vendor tab where the content script runs, using chrome.storage.local; the term is cleared once the search runs. Second, it saves the user's preferences with chrome.storage.sync: which vendors are enabled, whether tabs open in the foreground or background, and the optional clean-up-text setting. No data is collected or transmitted; everything stays in the browser.

Host access to ipage.ingramcontent.com, www.bibz2.com, and www.libraria.com: A content script runs only on these three vendor sites to type the user's selected term into that site's own search box and submit it. The extension does not run on any other site.
```

### §C — Store description

**Not duplicated here.** The description is maintained once, in
`STORE_LISTING.md` → **Store description & summary (canonical copy)**, because
Chrome, Edge and AMO all paste the same text and three copies would drift.

Open that section and paste:
- its **Short description** into Edge's short-description field (or leave it
  alone, since Edge pulls it from `manifest.json` `description`, which is the
  same string);
- its **Long description** into Edge's Description field. Edge requires at least
  250 characters; the canonical copy is comfortably over.

### §D — Notes for certification (reviewer instructions)
```
HOW TO TEST

1. Open any web page and select/highlight some text (for example, a book title).
2. Right-click the selection. You will see "Search Library Vendors" with sub-items "Search Ingram / Brodart / Libraria for '<your text>'" (or a single "Search <Vendor>" item if only one vendor is enabled in the popup).
3. Click one of them. A new tab opens to that vendor's website. The extension then types your selected text into that site's search box and submits it.

NO ACCOUNT? TEST WITH WORLDCAT:
Open the toolbar popup, enable "WorldCat" under Supplementary, then repeat the steps above and choose "Search WorldCat for '<your text>'". WorldCat (search.worldcat.org) is a public catalogue requiring no login, so this path shows the full behaviour end to end without a library account. For WorldCat the extension opens the search results URL directly and runs no script on the site.

The same popup section has a "Library catalog" option with a text field for a BiblioCommons address (the short name of any BiblioCommons library, entered on its own). It behaves the same way: the extension opens <address>.bibliocommons.com with the selected term and runs no script there. The field is validated to a single bibliocommons.com host, and the menu item is hidden until a valid address is entered.

IMPORTANT: these are gated library-vendor portals.

The three supported sites (ipage.ingramcontent.com, www.bibz2.com, www.libraria.com) are professional library purchasing portals that require an institutional/library account to reach their search page. If you do not have an account, the new tab will land on the vendor's login screen instead of a search results page. This is expected. In that case the extension simply waits: it keeps the pending term and fills the search box automatically once you are logged in and the search box is present.

What is observable WITHOUT a vendor account:
- The right-click context-menu items appear on any selected text.
- Clicking an item opens the correct vendor URL in a new tab.
- The toolbar popup lets you enable/disable each vendor and set options.

DATA: The extension transmits no data. The selected term and the vendor toggles are stored only in the browser (storage.local / storage.sync). It loads no remote code; all scripts, including the bundled webextension-polyfill, ship inside the package.
```
