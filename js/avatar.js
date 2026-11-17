/* Gerador de avatares 2D em SVG */
(function () {
  const AV = (window.Avatar = {});
  AV.SKINS = ['#f6d7c3', '#e8b796', '#d39a73', '#b07650', '#8a5a3b', '#5e3c28'];
  AV.HAIRS_M = ['short', 'side', 'buzz', 'bald', 'wavy', 'curly', 'afro'];
  AV.HAIRS_F = ['long', 'bob', 'bun', 'curly', 'wavy', 'afro', 'short'];
  AV.HAIR_COLORS = ['#1f1a17', '#3b2a20', '#6b4a2f', '#8d6a45', '#d8b26a', '#a5482a', '#6b7280', '#9ca3af', '#e5e7eb'];
  AV.OUTFITS = ['suit', 'suit_open', 'blazer', 'shirt', 'tee'];
  AV.SUIT_COLORS = ['#0f172a', '#1e293b', '#1e3a8a', '#334155', '#3f3f46', '#14532d', '#4c0519', '#78350f', '#f8fafc'];
  AV.ACCENTS = ['#b91c1c', '#1d4ed8', '#16a34a', '#f59e0b', '#a21caf', '#0ea5e9', '#f97316', '#e11d48', '#14b8a6', '#facc15'];
  AV.BEARDS = ['none', 'stubble', 'full', 'goatee', 'mustache'];

  const shade = (hex, amt) => {
    const n = parseInt(hex.slice(1), 16); let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = Math.max(0, Math.min(255, r + amt)); g = Math.max(0, Math.min(255, g + amt)); b = Math.max(0, Math.min(255, b + amt));
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  };

  function hairBack(hs, hc) {
    switch (hs) {
      case 'long': return `<path d="M36 58 C 32 32, 50 24, 61 24 C 74 24, 90 32, 85 60 C 88 80, 86 96, 82 102 L 38 102 C 34 96, 32 80, 36 58 Z" fill="${hc}"/>`;
      case 'bob': return `<path d="M36 58 C 33 33, 50 25, 61 25 C 74 25, 89 33, 85 60 C 86 72, 84 80, 81 84 L 39 84 C 36 80, 34 72, 36 58 Z" fill="${hc}"/>`;
      case 'afro': return `<circle cx="60" cy="48" r="31" fill="${hc}"/>`;
      case 'curly': return `<g fill="${hc}"><circle cx="40" cy="50" r="9"/><circle cx="80" cy="50" r="9"/><circle cx="42" cy="64" r="7"/><circle cx="78" cy="64" r="7"/></g>`;
      default: return '';
    }
  }
  function hairFront(hs, hc) {
    const d = shade(hc, -18);
    switch (hs) {
      case 'short': return `<path d="M38 56 C 36 36, 48 29, 61 29 C 75 29, 85 37, 82 56 C 80 47, 74 41, 61 41 C 48 41, 41 47, 38 56 Z" fill="${hc}"/>`;
      case 'side': return `<path d="M38 57 C 35 35, 49 28, 62 28 C 77 29, 86 38, 82 57 C 81 48, 77 43, 70 41 C 60 44, 48 43, 41 47 C 39 50, 38 53, 38 57 Z" fill="${hc}"/><path d="M52 31 C 58 35, 64 38, 70 41" stroke="${d}" stroke-width="1.2" fill="none" opacity=".6"/>`;
      case 'buzz': return `<path d="M39 52 C 38 36, 49 31, 61 31 C 73 31, 83 37, 81 52 C 78 44, 71 40, 60 40 C 49 40, 42 44, 39 52 Z" fill="${hc}" opacity=".8"/>`;
      case 'bald': return `<path d="M38 60 C 37 52, 38 48, 40 46 L 42 58 Z M82 60 C 83 52, 82 48, 80 46 L 78 58 Z" fill="${hc}"/>`;
      case 'wavy': return `<path d="M37 58 C 33 34, 50 26, 62 27 C 78 28, 88 38, 83 58 C 81 50, 78 46, 74 44 C 70 48, 64 42, 58 45 C 52 48, 47 43, 43 48 C 40 51, 38 54, 37 58 Z" fill="${hc}"/>`;
      case 'curly': return `<g fill="${hc}"><circle cx="46" cy="38" r="9"/><circle cx="58" cy="32" r="10"/><circle cx="71" cy="35" r="9"/><circle cx="80" cy="44" r="7"/><circle cx="40" cy="46" r="7"/></g>`;
      case 'afro': return `<path d="M39 52 C 40 42, 50 38, 60 38 C 70 38, 80 42, 81 52 C 78 46, 70 44, 60 44 C 50 44, 42 46, 39 52 Z" fill="${d}" opacity=".5"/>`;
      case 'long': return `<path d="M38 56 C 37 36, 49 28, 61 28 C 75 28, 85 36, 83 56 C 78 44, 70 38, 62 37 C 56 44, 46 46, 38 56 Z" fill="${hc}"/>`;
      case 'bob': return `<path d="M38 57 C 37 36, 49 28, 61 28 C 75 28, 85 36, 83 57 C 80 46, 72 39, 61 38 C 52 38, 42 44, 38 57 Z" fill="${hc}"/>`;
      case 'bun': return `<circle cx="61" cy="22" r="9" fill="${hc}"/><path d="M38 56 C 37 36, 49 29, 61 29 C 75 29, 85 36, 83 56 C 80 45, 72 39, 61 39 C 50 39, 42 45, 38 56 Z" fill="${hc}"/>`;
      default: return '';
    }
  }
  function beard(bd, bc) {
    switch (bd) {
      case 'full': return `<path d="M40 62 C 40 80, 50 88, 60 88 C 70 88, 80 80, 80 62 C 77 72, 70 76, 60 76 C 50 76, 43 72, 40 62 Z" fill="${bc}"/><path d="M53 71 C 57 69, 63 69, 67 71 C 64 73, 56 73, 53 71 Z" fill="${bc}"/>`;
      case 'stubble': return `<path d="M40 62 C 40 80, 50 87, 60 87 C 70 87, 80 80, 80 62 C 77 72, 70 76, 60 76 C 50 76, 43 72, 40 62 Z" fill="${bc}" opacity=".28"/>`;
      case 'goatee': return `<path d="M54 76 C 55 84, 65 84, 66 76 C 63 78, 57 78, 54 76 Z" fill="${bc}"/><path d="M53 71 C 57 69, 63 69, 67 71 C 64 73, 56 73, 53 71 Z" fill="${bc}"/>`;
      case 'mustache': return `<path d="M52 72 C 56 68, 64 68, 68 72 C 64 71, 56 71, 52 72 Z" fill="${bc}" stroke="${bc}" stroke-width="1.5"/>`;
      default: return '';
    }
  }
  function outfit(ot, oc, tc, skin) {
    const body = `<path d="M10 122 C 13 100, 32 91, 60 91 C 88 91, 107 100, 110 122 Z" fill="${oc}"/>`;
    const lapelC = shade(oc, -22);
    if (ot === 'tee') return body + `<path d="M50 91 C 52 98, 68 98, 70 91" stroke="${shade(oc, -30)}" stroke-width="2" fill="none"/>`;
    if (ot === 'shirt') return body + `<path d="M50 91 L 60 102 L 70 91" stroke="${shade(oc, 40)}" stroke-width="2.5" fill="none"/><path d="M60 102 L 60 122" stroke="${shade(oc, -25)}" stroke-width="1.2"/>`;
    const shirt = `<path d="M47 91 L 60 116 L 73 91 Z" fill="${ot === 'blazer' ? tc : '#f1f5f9'}"/>`;
    const tie = ot === 'suit' ? `<path d="M57.5 95 L 62.5 95 L 64 110 L 60 117 L 56 110 Z" fill="${tc}"/><path d="M57 92 L 63 92 L 62.5 96 L 57.5 96 Z" fill="${shade(tc, -30)}"/>` : '';
    const lapels = `<path d="M47 91 L 55 104 L 52 107 L 60 118 L 44 96 Z" fill="${lapelC}"/><path d="M73 91 L 65 104 L 68 107 L 60 118 L 76 96 Z" fill="${lapelC}"/>`;
    const pin = `<circle cx="80" cy="104" r="2.6" fill="${tc}" stroke="#fff" stroke-width=".8"/>`;
    return body + shirt + tie + lapels + (ot !== 'blazer' ? pin : '');
  }

  // a: spec do avatar; opts: {bg, mood, size}
  AV.svg = (a, opts = {}) => {
    a = a || {};
    const skin = AV.SKINS[a.sk ?? 1] || AV.SKINS[1];
    const sD = shade(skin, -28), hc = a.hc || '#3b2a20', bc = a.bc || hc;
    const bg = opts.bg || '#334155';
    const id = 'av' + Math.random().toString(36).slice(2, 8);
    const mood = opts.mood || 'smile';
    const mouth = mood === 'sad' ? `<path d="M53 75 C 57 72, 63 72, 67 75" stroke="#7a3b2e" stroke-width="2" fill="none" stroke-linecap="round"/>`
      : mood === 'happy' ? `<path d="M51 70 C 55 79, 65 79, 69 70 Z" fill="#7a2e2e"/><path d="M53 71 L 67 71 L 66 73 L 54 73 Z" fill="#fff"/>`
        : `<path d="M52 71 C 56 76, 64 76, 68 71" stroke="#7a3b2e" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    const lips = a.g === 'f' && mood !== 'happy' ? `<path d="M53 71.5 C 57 75.5, 63 75.5, 67 71.5 C 63 73, 57 73, 53 71.5 Z" fill="#b4535a" opacity=".8"/>` : '';
    const lashes = a.g === 'f' ? `<path d="M47 55 l-2 -2 M73 55 l2 -2" stroke="#1f1a17" stroke-width="1.2"/>` : '';
    const glasses = a.gl ? `<g fill="none" stroke="#111827" stroke-width="1.8"><circle cx="52" cy="58" r="6.5"/><circle cx="68" cy="58" r="6.5"/><path d="M58.5 58 L 61.5 58 M45.5 57 L 40 55 M74.5 57 L 80 55"/></g>` : '';
    return `<svg class="avatar" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
<defs><radialGradient id="${id}g" cx="50%" cy="35%" r="75%"><stop offset="0" stop-color="${shade(bg, 40)}"/><stop offset="1" stop-color="${shade(bg, -35)}"/></radialGradient>
<clipPath id="${id}c"><circle cx="60" cy="60" r="60"/></clipPath></defs>
<circle cx="60" cy="60" r="60" fill="url(#${id}g)"/>
<g clip-path="url(#${id}c)">
${hairBack(a.hs, hc)}
<rect x="52" y="78" width="16" height="16" rx="5" fill="${sD}"/>
${outfit(a.ot || 'suit', a.oc || '#1e293b', a.tc || '#b91c1c', skin)}
<ellipse cx="39.5" cy="61" rx="4" ry="6" fill="${sD}"/><ellipse cx="80.5" cy="61" rx="4" ry="6" fill="${sD}"/>
<ellipse cx="60" cy="58" rx="21" ry="25" fill="${skin}"/>
<ellipse cx="60" cy="66" rx="17" ry="12" fill="${sD}" opacity=".12"/>
${beard(a.bd, bc)}
<g fill="#1f1a17"><ellipse cx="52" cy="58" rx="2.4" ry="2.8"/><ellipse cx="68" cy="58" rx="2.4" ry="2.8"/></g>
<g fill="#fff"><circle cx="52.8" cy="57" r=".8"/><circle cx="68.8" cy="57" r=".8"/></g>
${lashes}
<path d="M47 51.5 C 49.5 49.5, 54 49.5, 56.5 51" stroke="${shade(hc, -10)}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
<path d="M63.5 51 C 66 49.5, 70.5 49.5, 73 51.5" stroke="${shade(hc, -10)}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
<path d="M60 59 C 59 63, 58 65, 60.5 66" stroke="${sD}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
${mouth}${lips}
${hairFront(a.hs, hc)}
${glasses}
</g></svg>`;
  };

  AV.random = (rnd = Math.random, opts = {}) => {
    const g = opts.g || (rnd() < 0.5 ? 'm' : 'f');
    const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
    const old = opts.age ? opts.age > 55 : rnd() < 0.35;
    const hs = g === 'm' ? pick(old ? ['short', 'side', 'bald', 'buzz'] : AV.HAIRS_M) : pick(AV.HAIRS_F);
    const hc = old ? pick(['#6b7280', '#9ca3af', '#e5e7eb', '#3b2a20']) : pick(AV.HAIR_COLORS.slice(0, 6));
    return {
      g, sk: Math.floor(rnd() * 6), hs, hc, bc: hc,
      bd: g === 'm' && rnd() < 0.4 ? pick(['stubble', 'full', 'goatee', 'mustache']) : 'none',
      gl: rnd() < 0.25, oc: pick(AV.SUIT_COLORS.slice(0, 8)), tc: opts.tc || pick(AV.ACCENTS),
      ot: g === 'm' ? pick(['suit', 'suit', 'suit_open', 'shirt']) : pick(['blazer', 'blazer', 'suit_open', 'shirt']),
    };
  };
})();
