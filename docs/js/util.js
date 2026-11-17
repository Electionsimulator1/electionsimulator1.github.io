/* Utilitários gerais: RNG, formatação, DOM, ícones, tweens */
(function () {
  const U = (window.U = {});
  U.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.sum = (arr, f) => arr.reduce((s, x, i) => s + (f ? f(x, i) : x), 0);
  U.avg = (arr, f) => (arr.length ? U.sum(arr, f) / arr.length : 0);
  U.hash = (str) => {
    let h = 2166136261;
    str = String(str);
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };
  U.rng = (seed) => {
    let s = (seed >>> 0) || 1;
    return () => {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  U.R = Math.random;
  U.rand = (a, b, r = U.R) => a + (b - a) * r();
  U.randi = (a, b, r = U.R) => Math.floor(a + (b - a + 1) * r());
  U.chance = (p, r = U.R) => r() < p;
  U.pick = (arr, r = U.R) => arr[Math.floor(r() * arr.length)];
  U.wpick = (arr, wf, r = U.R) => {
    const ws = arr.map(wf); const tot = U.sum(ws); let x = r() * tot;
    for (let i = 0; i < arr.length; i++) { x -= ws[i]; if (x <= 0) return arr[i]; }
    return arr[arr.length - 1];
  };
  U.shuffle = (arr, r = U.R) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  U.gauss = (r = U.R) => {
    let u = 0, v = 0; while (u === 0) u = r(); while (v === 0) v = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  U.uid = (p = 'id') => p + '_' + Math.random().toString(36).slice(2, 9);
  U.norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  U.esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------- formatação ----------
  const nf = new Intl.NumberFormat('pt-BR');
  U.fmtInt = (n) => nf.format(Math.round(n));
  U.fmtPct = (x, d = 1) => (x * 100).toFixed(d).replace('.', ',') + '%';
  U.fmtNum1 = (x, d = 1) => x.toFixed(d).replace('.', ',');
  U.fmtCompact = (n) => {
    const a = Math.abs(n);
    if (a >= 1e9) return U.fmtNum1(n / 1e9) + ' bi';
    if (a >= 1e6) return U.fmtNum1(n / 1e6) + ' mi';
    if (a >= 1e3) return U.fmtNum1(n / 1e3, a >= 1e5 ? 0 : 1) + ' mil';
    return U.fmtInt(n);
  };
  U.fmtMoney = (n, sym = 'R$') => (n < 0 ? '-' : '') + sym + ' ' + U.fmtCompact(Math.abs(n));
  U.plural = (n, s, p) => (n === 1 ? s : p);

  // ---------- DOM ----------
  U.$ = (sel, root = document) => root.querySelector(sel);
  U.$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  U.sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  U.ease = {
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    outBack: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  };
  U.tween = (dur, apply, ease = U.ease.outCubic) =>
    new Promise((res) => {
      const t0 = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - t0) / dur);
        apply(ease(t));
        if (t < 1) requestAnimationFrame(step); else res();
      };
      requestAnimationFrame(step);
    });
  U.countUp = (el, from, to, dur = 500, fmt = U.fmtInt) => {
    if (!el) return;
    U.tween(dur, (t) => { el.textContent = fmt(from + (to - from) * t); });
  };

  // ---------- ícones (lucide, embutido localmente) ----------
  const iconCache = {};
  U.ic = (name, cls = '') => {
    const key = name + '|' + cls;
    if (iconCache[key]) return iconCache[key];
    const node = window.lucide && window.lucide.icons && window.lucide.icons[name];
    if (!node) return '<span class="ic ' + cls + '"></span>';
    const kids = node[2] || [];
    const inner = kids
      .map(([t, a]) => '<' + t + ' ' + Object.entries(a).map(([k, v]) => k + '="' + v + '"').join(' ') + '/>')
      .join('');
    const svg = '<svg class="ic ' + cls + '" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>';
    iconCache[key] = svg;
    return svg;
  };

  // cor
  U.hexToRgb = (h) => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  U.rgbToHex = (r, g, b) => '#' + [r, g, b].map((x) => Math.round(U.clamp(x, 0, 255)).toString(16).padStart(2, '0')).join('');
  U.mix = (a, b, t) => { const A = U.hexToRgb(a), B = U.hexToRgb(b); return U.rgbToHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); };
  U.alpha = (hex, a) => { const [r, g, b] = U.hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; };

  // armazenamento seguro
  U.store = {
    get(k, def = null) { try { const v = localStorage.getItem(k); return v == null ? def : JSON.parse(v); } catch (e) { return def; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} },
  };
})();
