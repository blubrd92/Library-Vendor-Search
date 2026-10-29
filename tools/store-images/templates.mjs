/**
 * Data and page designs for tools/store-images/build.mjs.
 *
 * Edit this file to change the images: the sample selection, the popup
 * settings each capture uses, the captions, and the layout of each image.
 * build.mjs only captures the real UI, runs the real menu logic, and
 * renders what is defined here.
 *
 * Ground rules (see CLAUDE.md, "Store images"):
 *   - The mark is the toolbar icon's book and magnifier, redrawn as SVG in
 *     MARK below, on the icon's own steel blue. The popup's "LV" badge is
 *     not used in the store art.
 *   - The page where text gets selected, and every title and author on it,
 *     is invented. No real books, no jacket art.
 *   - Vendor and catalog sites are never drawn: they appear as plain tab
 *     labels only. No logos, no look-alike pages.
 *   - Every menu string comes from logic.menu (the real createMenus()
 *     output); every "after" string from logic.sanitizeTerm and
 *     logic.normalizeCatalog. Don't type them in here.
 *   - Plain punctuation in captions: no em dashes.
 */

export const FONT_FAMILIES =
  'Inter:wght@400;500;600;700&family=Source+Serif+4:ital,wght@0,400;0,600;1,400';

/* The selection the screenshots right-click. Short, so no browser would
   elide it in the menu. */
export const SELECTION = 'Saltmarsh Hours';
/* The messier selection the "clean search text" screenshot cleans. */
export const MESSY_SELECTION = 'Saltmarsh Hours: A Novel, by Teodora Okafor';
/* What the catalog screenshot "pastes" into the popup. */
export const CATALOG_PASTE = 'https://yourlibrary.bibliocommons.com/v2/search?query=saltmarsh';

/* One configuration, used by both the menu replica and the popup capture,
   so the two screenshots agree: every source on, the catalog configured,
   "search all" on, supplementary sources left out of it (the default). */
const SHOWN_SETTINGS = {
  enableIngram: true,
  enableBrodart: true,
  enableLibraria: true,
  enableWorldcat: true,
  enableCatalog: true,
  sanitizeSearch: true,
  enableSearchAll: true,
  searchAllIncludesSupplementary: false,
  tabFocus: 'focus',
};

export const MENU_SETTINGS = { ...SHOWN_SETTINGS, catalogInstance: 'yourlibrary' };

/* The popup starts with an empty catalog field and the paste is typed in,
   so the hint under it is options.js's own output. clips are close-ups of
   the same render. */
export const POPUP_SCENES = {
  popup: {
    settings: { ...SHOWN_SETTINGS, catalogInstance: '' },
    type: CATALOG_PASTE,
    press: ['Home'],          // show the start of the pasted address, not its tail
    clips: { supplementary: '.card:nth-of-type(2)', search: '.card:nth-of-type(3)' },
  },
};

/* Icon colors, sampled from images/icon-128.png. */
const BRAND = '#38689a';
const BRAND_DEEP = '#2c5580';
const INK = '#17212c';
const MUTED = '#566272';
const PAPER = '#f2f5f9';
const TINT = '#dde8f4';

/* The toolbar icon's mark, redrawn: an open book with stacked page edges
   and a magnifier holding a down arrow. `bg` is the color behind it, used
   for the knock-out gaps. */
export const MARK = (size, fg = '#fff', bg = BRAND) => `
<svg width="${size}" height="${size}" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <g fill="none" stroke="${fg}" stroke-linejoin="round">
    <path d="M28 51 V88 H55 Q64 97 73 88 H100 V51" stroke-width="3.2"/>
    <path d="M32.5 47 V83.5 H57 Q64 90 71 83.5 H95.5 V47" stroke-width="2.6"/>
  </g>
  <path fill="${fg}" d="M37 40.5 Q51 37.5 64 46 V83 Q52 76.5 37 79 Z"/>
  <path fill="${fg}" d="M64 46 Q77 37.5 91 40.5 V79 Q76 76.5 64 83 Z"/>
  <path d="M64 46 V83" stroke="${bg}" stroke-width="1.4" opacity=".35"/>
  <circle cx="73" cy="40" r="11" fill="${bg}"/>
  <path d="M79.5 46.5 L86.5 53.5" stroke="${bg}" stroke-width="9" stroke-linecap="round"/>
  <circle cx="73" cy="40" r="7.2" fill="${bg}" stroke="${fg}" stroke-width="2.8"/>
  <path d="M79 46 L86 53" stroke="${fg}" stroke-width="4.4" stroke-linecap="round"/>
  <path d="M73 35.6 V44.2 M69.6 41 L73 44.4 L76.4 41" fill="none" stroke="${fg}" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

/**
 * The store images, keyed by output filename. Each is { w, h, html },
 * rendered at exactly w x h CSS pixels.
 *
 * Sizes (the October 2026 specs; re-check the stores' docs before upload):
 *   440x280    Chrome small promo tile (required); Edge small tile (optional)
 *   1400x560   Chrome marquee (needed to be featured); Edge large tile (PNG)
 *   1280x800   screenshots: Chrome (max 5), Edge (max 6), Firefox
 *   300x300    Edge extension logo (recommended over the 128px icon)
 * Firefox has no promo tile slots, so screenshot-0-overview carries the
 * marquee's pitch there. Five screenshots in all, Chrome's ceiling.
 */
export function storeImages({ shots, fonts, logic }) {
  const listing = (xs) => xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const fill = (title, term) => esc(title.replace('%s', term));

  const menu = logic.menu;
  const parent = menu.find(m => !m.parentId);
  const children = menu.filter(m => m.parentId === parent.id);
  const searchAll = children.find(m => m.id === 'searchAllVendors');
  if (!searchAll) throw new Error('MENU_SETTINGS should produce the "search all" item');
  const sweep = logic.fanOut;                       // labels, in menu order
  const cleaned = logic.sanitizeTerm(MESSY_SELECTION);
  const instance = logic.normalizeCatalog(CATALOG_PASTE);
  if (!instance) throw new Error('CATALOG_PASTE should resolve to an instance');

  const BASE_CSS = `
${fonts}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; overflow: hidden; color: ${INK}; }
.blue { position: absolute; inset: 0;
  background: radial-gradient(120% 120% at 85% 15%, #4677aa 0%, ${BRAND} 45%, ${BRAND_DEEP} 100%); }
.paper { position: absolute; inset: 0; background: ${PAPER}; }
.wordmark { color: #fff; font-weight: 700; letter-spacing: -.02em; line-height: 1.05; }

/* Generic browser window: no Chrome / Edge / Firefox branding, since the
   same screenshots go to all three stores. */
.win { position: absolute; background: #fff; border-radius: 12px; overflow: hidden;
  box-shadow: 0 30px 70px -24px rgba(16,32,56,.45), 0 0 0 1px rgba(16,32,56,.08); }
.bar { height: 44px; background: #e9edf2; border-bottom: 1px solid #d6dce4;
  display: flex; align-items: center; gap: 14px; padding: 0 16px; }
.dots { display: flex; gap: 7px; }
.dots i { width: 11px; height: 11px; border-radius: 50%; background: #c9d0d9; display: block; }
.url { flex: 1; height: 28px; border-radius: 14px; background: #fff; border: 1px solid #d9dfe6;
  display: flex; align-items: center; padding: 0 14px; font-size: 13px; color: #5d6876; }

/* The invented review page. */
.article { padding: 34px 44px; font-family: 'Source Serif 4', serif; color: #222b35; }
.article h1 { font-size: 30px; font-weight: 600; letter-spacing: -.01em; line-height: 1.15; margin-bottom: 18px; }
.article p { font-size: 17px; line-height: 1.65; margin-bottom: 14px; }
.sel { background: #b8d2ee; border-radius: 2px; box-shadow: 0 0 0 2px #b8d2ee; }

/* Context menu replica. Neutral on purpose: it doesn't copy any one
   operating system's or browser's menu. The strings are the real ones. */
.menu { position: absolute; background: #fff; border-radius: 9px; padding: 6px;
  box-shadow: 0 16px 40px -8px rgba(16,32,56,.35), 0 0 0 1px rgba(16,32,56,.10);
  font-family: 'Inter', sans-serif; font-size: 14px; color: ${INK}; white-space: nowrap; }
.mi { display: flex; align-items: center; gap: 10px; height: 32px; padding: 0 12px; border-radius: 6px; }
.mi .ic { width: 18px; height: 18px; flex: none; }
.mi .ic.blank { visibility: hidden; }
.mi .chev { margin-left: auto; padding-left: 28px; color: #7a8594; font-size: 15px; }
.mi.on { background: ${BRAND}; color: #fff; }
.mi.on .chev { color: #fff; }
.mi.dim { color: #9aa3ae; }
.sep { height: 1px; background: #e3e7ec; margin: 5px 6px; }
.chip { display: inline-grid; place-items: center; width: 20px; height: 20px; border-radius: 5px; background: ${BRAND};
  box-shadow: 0 0 0 1.5px rgba(255,255,255,.85); }

/* Caption type, shared by every screenshot. */
.cap h2 { font-size: 46px; font-weight: 700; letter-spacing: -.025em; line-height: 1.08; color: ${INK}; }
.cap h2 b { color: ${BRAND}; font-weight: 700; }
.cap p { font-size: 20px; line-height: 1.5; color: ${MUTED}; margin-top: 16px; }
`;


  /* ---- shared scene pieces ---------------------------------------- */

  const browserBar = (url) =>
    `<div class="bar"><div class="dots"><i></i><i></i><i></i></div><div class="url">${esc(url)}</div></div>`;

  const article = `
    <div class="article">
      <h1>Twelve new novels for long evenings</h1>
      <p>Teodora Okafor's <i><span class="sel">${esc(SELECTION)}</span></i> follows three generations
      of oyster farmers through one hard winter on the estuary, and it is the quietest
      book on this list.</p>
      <p>For something stranger, <i>Ninefold Lanterns</i> by Aurelio Castellane sends a
      night-ferry pilot looking for a sister who stopped writing home.</p>
    </div>`;

  /* The browser's own menu around ours: generic items only. */
  const OUTER_W = 256;
  const outerMenu = (x, y) => `
    <div class="menu" style="left:${x}px;top:${y}px;width:${OUTER_W}px">
      <div class="mi"><span class="ic blank"></span>Copy</div>
      <div class="sep"></div>
      <div class="mi on"><span class="chip">${MARK(20)}</span>${esc(parent.title)}<span class="chev">&rsaquo;</span></div>
      <div class="sep"></div>
      <div class="mi dim"><span class="ic blank"></span>Print&hellip;</div>
    </div>`;

  const subMenu = (x, y, term, active) => `
    <div class="menu" style="left:${x}px;top:${y}px">
      ${children.map(m => m.type === 'separator'
        ? '<div class="sep"></div>'
        : `<div class="mi ${m.id === active ? 'on' : ''}">${fill(m.title, term)}</div>`).join('')}
    </div>`;

  /* Page + selection + open menu, in a 780x440 box. */
  const menuScene = (active) => `
    <div class="win" style="left:0;top:0;width:780px;height:440px">
      ${browserBar('reviews.example.org/fall-reading')}
      ${article}
    </div>
    ${outerMenu(232, 164)}
    ${subMenu(232 + OUTER_W - 6, 198, SELECTION, active)}`;

  /* ---- hero: marquee and overview share this ---------------------- */

  const hero = ({ w, h, tx, ty, titleSize, subSize, textW, sx, sy, scale }) => `
    <style>${BASE_CSS}</style>
    <div class="blue"></div>
    <div style="position:absolute;left:${tx}px;top:${ty}px;width:${textW}px">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:${Math.round(titleSize * .45)}px">
        <span style="margin-left:${-Math.round(titleSize * 1.5 * 27 / 128)}px;display:flex">${MARK(Math.round(titleSize * 1.5))}</span>
        <span class="wordmark" style="font-size:${Math.round(titleSize * .5)}px">Library Vendor Search</span>
      </div>
      <div class="wordmark" style="font-size:${titleSize}px">Right-click a title.<br>Search your vendors.</div>
      <div style="color:#dbe7f4;font-size:${subSize}px;line-height:1.45;margin-top:${Math.round(subSize * .9)}px">
        Ingram, Brodart, Libraria, WorldCat and your library's own catalog.
      </div>
    </div>
    <div style="position:absolute;left:${sx}px;top:${sy}px;width:780px;height:440px;transform:scale(${scale});transform-origin:0 0">
      ${menuScene('searchIngram')}
    </div>`;

  /* ---- screenshot frame ------------------------------------------- */

  const shot = (body) => `<style>${BASE_CSS}</style><div class="paper"></div>${body}`;

  /* 1. the menu */
  const shotMenu = shot(`
    <div class="cap" style="position:absolute;left:64px;top:56px;width:1150px">
      <h2>Select a title, right-click, <b>search</b>.</h2>
      <p>Each source you switch on gets its own item. WorldCat and your catalog sit below a divider.</p>
    </div>
    <div style="position:absolute;left:64px;top:214px;width:780px;height:440px;transform:scale(1.25);transform-origin:0 0">
      ${menuScene('searchBrodart')}
    </div>`);

  /* 2. search all */
  const tabs = [
    { t: 'Twelve new novels for long evenings', cur: true },
    ...sweep.map((label, i) => ({ t: label, fresh: true, active: i === 0 })),
  ];
  const tabCss = `
.strip { display: flex; align-items: flex-end; gap: 4px; height: 52px; padding: 0 12px; background: #dfe4ea; }
.tab { height: 40px; width: 210px; border-radius: 10px 10px 0 0; display: flex; align-items: center; gap: 9px;
  padding: 0 14px; font-size: 14px; color: #3c4653; background: #eef1f4; overflow: hidden; white-space: nowrap; }
.tab .fav { width: 16px; height: 16px; border-radius: 50%; background: #c3cad3; flex: none; }
.tab.cur { width: 300px; }
.tab.fresh { background: ${TINT}; color: ${INK}; font-weight: 600; box-shadow: inset 0 3px 0 ${BRAND}; }
.tab.fresh .fav { background: ${BRAND}; opacity: .55; }
.tab.active { background: #fff; }
.brace { position: absolute; height: 14px; border: 2px solid ${BRAND}; border-bottom: 0; border-radius: 8px 8px 0 0; }
.note { position: absolute; font-size: 17px; font-weight: 600; color: ${BRAND}; text-align: center; }
`;
  const firstTabX = 12 + 300 + 4;                     // strip padding + current tab + gap
  const freshW = sweep.length * 214 - 4;
  const shotAll = shot(`<style>${tabCss}</style>
    <div class="cap" style="position:absolute;left:64px;top:56px;width:1150px">
      <h2>Or search <b>every vendor</b> at once.</h2>
      <p>One click opens ${esc(listing(sweep))}, each in its own tab beside the page you're on.</p>
    </div>
    <div class="menu" style="left:${96 + firstTabX + freshW / 2 - 220}px;top:214px;position:absolute;transform:scale(1.15);transform-origin:0 0">
      ${children.map(m => m.type === 'separator'
        ? '<div class="sep"></div>'
        : `<div class="mi ${m.id === searchAll.id ? 'on' : ''}">${fill(m.title, SELECTION)}</div>`).join('')}
    </div>
    <div style="position:absolute;left:64px;top:236px;width:330px;font-size:18px;line-height:1.55;color:${MUTED}">
      <p><b style="color:${INK}">Off by default.</b> Turn it on in the popup, and the item appears whenever
      it would open more than one tab.</p>
      <p style="margin-top:14px">WorldCat and your catalog keep their own items. Add them to the sweep with
      one more switch, and the item becomes &ldquo;Search all sources&rdquo;.</p>
    </div>
    <svg style="position:absolute;left:${96 + firstTabX + freshW / 2 - 30}px;top:488px" width="60" height="70" viewBox="0 0 60 70">
      <path d="M30 4 V58 M16 44 L30 60 L44 44" fill="none" stroke="${BRAND}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <div class="note" style="left:${96 + firstTabX}px;top:584px;width:${freshW}px">${sweep.length} new tabs, in menu order</div>
    <div class="brace" style="left:${96 + firstTabX}px;top:618px;width:${freshW}px"></div>
    <div class="win" style="left:96px;top:640px;width:1088px;height:97px">
      <div class="strip">
        ${tabs.map(t => `<div class="tab ${t.cur ? 'cur' : ''} ${t.fresh ? 'fresh' : ''} ${t.active ? 'active' : ''}"><span class="fav"></span>${esc(t.t)}</div>`).join('')}
      </div>
      <div class="bar" style="background:#fff"><div class="dots"><i></i><i></i><i></i></div><div class="url"></div></div>
    </div>`);

  /* 3. the popup, with the catalog field close up */
  const pop = shots.popupSize;
  const popScale = Math.min(1, 736 / pop.h);
  const field = shots.popup_supplementarySize;
  const fieldScale = 1.45;
  const shotPopup = shot(`
    <div class="cap" style="position:absolute;left:64px;top:56px;width:640px">
      <h2>Set it up once, in the <b>popup</b>.</h2>
      <p>Turn sources on or off, choose whether new tabs open in front or behind, and add your library's catalog.</p>
    </div>
    <div style="position:absolute;left:64px;top:236px;width:640px">
      <div style="font-size:15px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:${BRAND};margin-bottom:12px">Paste your catalog address</div>
      <div style="width:${Math.round(field.w * fieldScale)}px;border-radius:14px;overflow:hidden;
           box-shadow:0 18px 44px -18px rgba(16,32,56,.4),0 0 0 1px rgba(16,32,56,.08)">
        <img src="${shots.popup_supplementary}" style="display:block;width:100%">
      </div>
      <p style="font-size:18px;line-height:1.55;color:${MUTED};margin-top:22px;width:${Math.round(field.w * fieldScale)}px">
        Any form works: the short name, the address, or a whole search link. The popup shows the one
        BiblioCommons catalog it will search, and the menu item stays hidden until it has one.
      </p>
    </div>
    <div style="position:absolute;right:96px;top:${Math.round((800 - pop.h * popScale) / 2)}px;width:${Math.round(pop.w * popScale)}px;border-radius:12px;overflow:hidden;
         box-shadow:0 30px 70px -24px rgba(16,32,56,.5),0 0 0 1px rgba(16,32,56,.1)">
      <img src="${shots.popup}" style="display:block;width:100%">
    </div>`);

  /* 4. clean search text */
  const marked = esc(MESSY_SELECTION).replace(/[:,]|\bby\b/gi, m => `<s>${m}</s>`);
  const search = shots.popup_searchSize;
  const shotClean = shot(`<style>
    .clean { position: absolute; background: #fff; border-radius: 14px; padding: 26px 30px;
      box-shadow: 0 18px 44px -18px rgba(16,32,56,.4), 0 0 0 1px rgba(16,32,56,.08); }
    .clean .lab { font-size: 14px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: ${MUTED}; margin-bottom: 12px; }
    .clean .txt { font-size: 28px; font-weight: 500; letter-spacing: -.01em; }
    .clean s { text-decoration: line-through 2px; color: #b4471f; background: #fbe3d8; border-radius: 4px; padding: 0 3px; }
    .box { border: 1.5px solid #c6ced8; border-radius: 10px; padding: 12px 16px; display: flex; align-items: center; gap: 12px; }
  </style>
    <div class="cap" style="position:absolute;left:64px;top:56px;width:1150px">
      <h2>Clean <b>search text</b>, automatically.</h2>
      <p>Colons, commas and the word &ldquo;by&rdquo; come out before the search runs. On by default.</p>
    </div>
    <div class="clean" style="left:64px;top:282px;width:720px">
      <div class="lab">You select</div>
      <div class="txt">${marked}</div>
    </div>
    <svg style="position:absolute;left:390px;top:408px" width="60" height="64" viewBox="0 0 60 64">
      <path d="M30 4 V52 M16 40 L30 54 L44 40" fill="none" stroke="${BRAND}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <div class="clean" style="left:64px;top:490px;width:720px">
      <div class="lab">The search runs for</div>
      <div class="txt box"><svg width="22" height="22" viewBox="0 0 24 24"><circle cx="10" cy="10" r="6.5" fill="none" stroke="${MUTED}" stroke-width="2.2"/><path d="M15 15 L21 21" stroke="${MUTED}" stroke-width="2.4" stroke-linecap="round"/></svg>${esc(cleaned)}</div>
    </div>
    <div style="position:absolute;left:836px;top:282px;width:${Math.round(search.w * 1.1)}px;border-radius:12px;overflow:hidden;
         box-shadow:0 18px 44px -18px rgba(16,32,56,.4),0 0 0 1px rgba(16,32,56,.08)">
      <img src="${shots.popup_search}" style="display:block;width:100%">
    </div>
    <div style="position:absolute;left:836px;top:${282 + Math.round(search.h * 1.1) + 18}px;width:${Math.round(search.w * 1.1)}px;font-size:16px;line-height:1.5;color:${MUTED}">
      Switch it off in the popup to search exactly what you selected.
    </div>`);

  return {
    'promo-small-440x280.png': {
      w: 440, h: 280,
      html: `<style>${BASE_CSS}</style><div class="blue"></div>
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px">
          ${MARK(156)}
          <div class="wordmark" style="font-size:34px;text-align:center;margin-top:-10px">Library Vendor Search</div>
        </div>`,
    },
    'marquee-1400x560.png': {
      w: 1400, h: 560,
      html: hero({ w: 1400, h: 560, tx: 80, ty: 112, titleSize: 54, subSize: 21, textW: 560, sx: 640, sy: 82, scale: 0.86 }),
    },
    'screenshot-0-overview-1280x800.png': {
      w: 1280, h: 800,
      html: hero({ w: 1280, h: 800, tx: 64, ty: 52, titleSize: 56, subSize: 23, textW: 1100, sx: 273, sy: 372, scale: 0.94 }),
    },
    'screenshot-1-menu-1280x800.png': { w: 1280, h: 800, html: shotMenu },
    'screenshot-2-search-all-1280x800.png': { w: 1280, h: 800, html: shotAll },
    'screenshot-3-popup-1280x800.png': { w: 1280, h: 800, html: shotPopup },
    'screenshot-4-clean-text-1280x800.png': { w: 1280, h: 800, html: shotClean },
    'logo-edge-300x300.png': {
      w: 300, h: 300,
      html: `<style>${BASE_CSS}</style><div class="blue" style="background:${BRAND}"></div>
        <div style="position:absolute;inset:0;display:grid;place-items:center">${MARK(300)}</div>`,
    },
  };
}
