/* Renderização SVG: mapas das arenas, gráficos de pesquisa, hemiciclo e medidores */
(function () {
  const M = (window.MapR = {});
  const cache = new WeakMap();
  let uid = 0;

  M.build = (arena) => {
    if (cache.has(arena)) return cache.get(arena);
    const map = arena.map; const out = { zonePaths: {}, bg: '', labels: [], dots: arena.dots || [], deco: null, outline: '' };
    const zset = new Set(arena.zones.map((z) => z.id));
    if (map.kind === 'vor') {
      out.vb = [0, 0, map.w, map.h];
      arena.zones.forEach((z) => (out.zonePaths[z.id] = MapGen.ringsPath(z.rings)));
      out.outline = MapGen.ringsPath(map.outline);
      out.deco = map.deco;
    } else if (map.kind === 'geo') {
      const G = window.GEO[map.key];
      const units = G.u;
      if (map.key === 'BR_RI') {
        out.vb = map.vb;
        units.forEach((u) => { const d = MapGen.ringsPath(u.r); if (u.z === map.filter) out.zonePaths[u.id] = (out.zonePaths[u.id] || '') + d; else out.bg += d; });
      } else {
        out.vb = [-10, -10, G.w + 20, G.h + 20];
        units.forEach((u) => { const d = MapGen.ringsPath(u.r); if (zset.has(u.z)) out.zonePaths[u.z] = (out.zonePaths[u.z] || '') + d; else out.bg += d; });
      }
    } else if (map.kind === 'vorgeo') {
      const G = window.GEO[map.key];
      out.vb = map.vb;
      G.u.forEach((u) => { const d = MapGen.ringsPath(u.r); if (u.z === map.filter) out.outline += d; else out.bg += d; });
      arena.zones.forEach((z) => (out.zonePaths[z.id] = MapGen.ringsPath(z.rings)));
    } else if (map.kind === 'party') {
      out.vb = [0, 0, 600, 420];
      const cx = 300, cy = 330, R1 = 120, R2 = 290; let a0 = Math.PI;
      const tot = U.sum(arena.zones, (z) => z.share);
      arena.zones.forEach((z) => {
        const a1 = a0 + Math.PI * (z.share / tot);
        const p = (r, a) => `${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`;
        out.zonePaths[z.id] = `M${p(R1, a0 + 0.02)}L${p(R2, a0 + 0.02)}A${R2} ${R2} 0 0 1 ${p(R2, a1 - 0.02)}L${p(R1, a1 - 0.02)}A${R1} ${R1} 0 0 0 ${p(R1, a0 + 0.02)}Z`;
        const am = (a0 + a1) / 2; z.lx = cx + 205 * Math.cos(am); z.ly = cy + 205 * Math.sin(am);
        a0 = a1;
      });
    }
    const vbW = out.vb[2];
    const n = arena.zones.length;
    out.fs = map.kind === 'vor' ? vbW / 48 : map.kind === 'party' ? 18 : n > 30 ? vbW / 85 : vbW / 60;
    arena.zones.forEach((z) => {
      let text = null;
      if (n <= 18) text = z.n.length > 22 ? z.n.slice(0, 20) + '…' : z.n;
      else if (z.id.length <= 3) text = z.id;
      if (text) out.labels.push({ zid: z.id, x: z.lx, y: z.ly, t: text });
    });
    cache.set(arena, out);
    return out;
  };

  // colors: {zid: fill}; opts: {sel, interactive, labels, mini}
  M.svg = (arena, colors = {}, opts = {}) => {
    const b = M.build(arena); const id = 'm' + uid++;
    const vb = b.vb.map((x) => x.toFixed(1)).join(' ');
    const sw = b.vb[2] / 500;
    let s = `<svg class="map" viewBox="${vb}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
<defs>
<filter id="${id}sh" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="${sw * 4}" stdDeviation="${sw * 8}" flood-color="#000" flood-opacity=".6"/></filter>
<filter id="${id}gl"><feGaussianBlur stdDeviation="${sw * 3}"/></filter>
${b.outline ? `<clipPath id="${id}cl"><path d="${b.outline}"/></clipPath>` : ''}
<pattern id="${id}hatch" width="${sw * 10}" height="${sw * 10}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="${sw * 10}" height="${sw * 10}" fill="#1e293b"/><line x1="0" y1="0" x2="0" y2="${sw * 10}" stroke="#334155" stroke-width="${sw * 3}"/></pattern>
</defs>`;
    if (b.bg) s += `<path d="${b.bg}" fill="rgba(255,255,255,.035)" stroke="rgba(255,255,255,.08)" stroke-width="${sw * 0.8}"/>`;
    if (b.outline) {
      s += `<path d="${b.outline}" fill="#0f172a" filter="url(#${id}sh)"/>`;
      if (arena.map.kind === 'vorgeo') s += `<path d="${b.outline}" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="${sw * 5}"/><path d="${b.outline}" fill="#0f172a"/>`;
    }
    for (const zid in b.zonePaths) {
      const f = colors[zid] || '#334155';
      s += `<path class="zone${opts.sel === zid ? ' sel' : ''}" data-zone="${zid}" d="${b.zonePaths[zid]}" fill="${f}" stroke="rgba(255,255,255,${arena.map.kind === 'geo' && arena.map.key !== 'BR_RI' && arena.zones.length > 15 ? '.35' : '.55'})" stroke-width="${sw * (arena.map.kind === 'vor' ? 1.6 : 1)}" stroke-linejoin="round"/>`;
    }
    const d = b.deco;
    if (d && !opts.mini) {
      s += `<g clip-path="url(#${id}cl)" pointer-events="none">`;
      if (d.river) s += `<path d="${d.river}" fill="none" stroke="#38bdf8" stroke-opacity=".55" stroke-width="${sw * 9}" stroke-linecap="round"/><path d="${d.river}" fill="none" stroke="#7dd3fc" stroke-opacity=".5" stroke-width="${sw * 3}"/>`;
      d.parks.forEach(([x, y, r]) => (s += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(0)}" fill="#22c55e" fill-opacity=".28"/>`));
      d.roads.forEach((r) => (s += `<path d="${r}" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="${sw * 3}" stroke-dasharray="${sw * 2} ${sw * 1}"/>`));
      if (d.ring) s += `<circle cx="${d.ring.cx.toFixed(0)}" cy="${d.ring.cy.toFixed(0)}" r="${d.ring.r.toFixed(0)}" fill="none" stroke="#fff" stroke-opacity=".12" stroke-width="${sw * 3}"/>`;
      s += `</g>`;
      if (d.center) s += `<g pointer-events="none" transform="translate(${d.center[0].toFixed(0)} ${d.center[1].toFixed(0)})"><circle r="${sw * 9}" fill="var(--acc2)" fill-opacity=".25"/><circle r="${sw * 4}" fill="var(--acc2)"/></g>`;
    }
    if (b.outline && arena.map.kind === 'vor') s += `<path d="${b.outline}" fill="none" stroke="rgba(255,255,255,.75)" stroke-width="${sw * 2.4}" pointer-events="none"/>`;
    if (!opts.mini) {
      b.dots.forEach((p) => (s += `<g pointer-events="none"><circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${(p.cap ? 5 : 3) * sw}" fill="${p.cap ? '#facc15' : '#fff'}" stroke="#000" stroke-width="${sw}"/>${p.cap || b.dots.indexOf(p) < 4 ? `<text class="zlabel" x="${p.x.toFixed(1)}" y="${(p.y - 10 * sw).toFixed(1)}" font-size="${b.fs * 0.75}" stroke-width="${b.fs * 0.2}">${U.esc(p.n)}</text>` : ''}</g>`));
      if (opts.labels !== false) b.labels.forEach((l) => (s += `<text class="zlabel" data-lbl="${l.zid}" x="${l.x.toFixed(1)}" y="${l.y.toFixed(1)}" font-size="${b.fs.toFixed(1)}" stroke-width="${(b.fs * 0.22).toFixed(1)}">${U.esc(l.t)}</text>`));
    }
    s += `</svg>`;
    return s;
  };
  M.recolor = (root, colors) => { if (!root) return; root.querySelectorAll('path.zone').forEach((p) => { const c = colors[p.dataset.zone]; if (c) p.setAttribute('fill', c); }); };
  M.select = (root, zid) => { if (!root) return; root.querySelectorAll('path.zone').forEach((p) => p.classList.toggle('sel', p.dataset.zone === zid)); };

  // escalas de cor
  M.ramp = (stops, t) => {
    t = U.clamp(t, 0, 1); const n = stops.length - 1; const i = Math.min(n - 1, Math.floor(t * n)); const f = t * n - i;
    return U.mix(stops[i], stops[i + 1], f);
  };
  M.SUPPORT = ['#141c33', '#1e3a5f', '#0e7490', '#16a34a', '#84cc16', '#facc15'];
  M.AWARE = ['#141c33', '#312e81', '#6d28d9', '#c026d3', '#f0abfc'];

  // ---------- gráfico de linhas das pesquisas ----------
  M.lineChart = (polls, cands, opts = {}) => {
    const W = opts.w || 330, H = opts.h || 170, pl = 30, pr = 44, pt = 10, pb = 20;
    const ps = polls.filter((p) => !p.sep && p.stage === opts.stage);
    if (ps.length < 1) return `<div class="muted small" style="padding:20px;text-align:center">Primeira pesquisa sai ao fim da semana 1.</div>`;
    const ids = cands.map((c) => c.id);
    const val = (p, id) => (p.res[id] || 0) / Math.max(0.01, 1 - p.und - (p.pool || 0));
    let maxV = 0.1; ps.forEach((p) => ids.forEach((id) => (maxV = Math.max(maxV, val(p, id)))));
    maxV = Math.min(1, Math.ceil((maxV + 0.05) * 10) / 10);
    const x = (i) => pl + (ps.length === 1 ? (W - pl - pr) / 2 : (i * (W - pl - pr)) / (ps.length - 1));
    const y = (v) => pt + (1 - v / maxV) * (H - pt - pb);
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" width="100%">`;
    for (let g = 0; g <= 4; g++) { const v = (maxV * g) / 4; s += `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" stroke="rgba(255,255,255,.06)"/><text x="${pl - 6}" y="${y(v) + 3}" text-anchor="end">${Math.round(v * 100)}%</text>`; }
    ps.forEach((p, i) => (s += `<text x="${x(i)}" y="${H - 5}" text-anchor="middle">S${p.w}</text>`));
    const endLabels = [];
    cands.forEach((c) => {
      const pts = ps.map((p, i) => [x(i), y(val(p, c.id))]);
      const d = pts.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('');
      const w = c.isP ? 3.2 : 2;
      s += `<path d="${d}" fill="none" stroke="${c.color}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round" ${c.isP ? 'filter="drop-shadow(0 0 4px ' + c.color + ')"' : 'opacity=".85"'}/>`;
      pts.forEach((q, i) => (s += `<circle cx="${q[0]}" cy="${q[1]}" r="${i === pts.length - 1 ? 3.6 : 2.2}" fill="${c.color}"/>`));
      const last = pts[pts.length - 1]; endLabels.push({ y: last[1], t: Math.round(val(ps[ps.length - 1], c.id) * 100) + '%', c: c.color });
    });
    endLabels.sort((a, b) => a.y - b.y); for (let i = 1; i < endLabels.length; i++) if (endLabels[i].y - endLabels[i - 1].y < 11) endLabels[i].y = endLabels[i - 1].y + 11;
    endLabels.forEach((l) => (s += `<text x="${W - pr + 6}" y="${l.y + 3}" fill="${l.c}" style="fill:${l.c};font-weight:700">${l.t}</text>`));
    return s + '</svg>';
  };
  M.votesChart = (polls, opts = {}) => {
    const ps = polls.filter((p) => p.list && !p.sep);
    if (!ps.length) return '';
    const W = opts.w || 330, H = 150, pl = 44, pr = 12, pt = 10, pb = 20;
    let maxV = 10; ps.forEach((p) => (maxV = Math.max(maxV, p.list.votes, p.list.votes + p.list.needed)));
    maxV *= 1.15;
    const x = (i) => pl + (ps.length === 1 ? (W - pl - pr) / 2 : (i * (W - pl - pr)) / (ps.length - 1));
    const y = (v) => pt + (1 - v / maxV) * (H - pt - pb);
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" width="100%">`;
    for (let g = 0; g <= 3; g++) { const v = (maxV * g) / 3; s += `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" stroke="rgba(255,255,255,.06)"/><text x="${pl - 6}" y="${y(v) + 3}" text-anchor="end">${U.fmtCompact(v)}</text>`; }
    const need = ps.map((p, i) => [x(i), y(Math.max(0, p.list.votes + p.list.needed))]);
    const mine = ps.map((p, i) => [x(i), y(p.list.votes)]);
    const path = (pts) => pts.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('');
    s += `<path d="${path(need)}" fill="none" stroke="#f59e0b" stroke-width="2" stroke-dasharray="5 4"/><path d="${path(mine)}" fill="none" stroke="var(--acc)" stroke-width="3"/>`;
    mine.forEach((q) => (s += `<circle cx="${q[0]}" cy="${q[1]}" r="3" fill="var(--acc)"/>`));
    ps.forEach((p, i) => (s += `<text x="${x(i)}" y="${H - 5}" text-anchor="middle">S${p.w}</text>`));
    return s + '</svg>';
  };

  // ---------- hemiciclo ----------
  M.hemicycle = (parts, total, opts = {}) => {
    const rows = Math.max(3, Math.min(12, Math.round(Math.sqrt(total / 3))));
    const W = 420, H = 230, cx = W / 2, cy = H - 10, R0 = 70, R1 = 200;
    const rads = Array.from({ length: rows }, (_, i) => R0 + ((R1 - R0) * i) / (rows - 1));
    const lens = rads.map((r) => Math.PI * r); const tl = U.sum(lens);
    let counts = rads.map((r, i) => Math.round((total * lens[i]) / tl)); let diff = total - U.sum(counts); counts[counts.length - 1] += diff;
    const seats = [];
    rads.forEach((r, i) => { const n = counts[i]; for (let k = 0; k < n; k++) { const a = Math.PI - (Math.PI * (k + 0.5)) / n; seats.push({ x: cx + r * Math.cos(a), y: cy - r * Math.sin(a), a }); } });
    seats.sort((p, q) => q.a - p.a);
    const colors = []; parts.forEach((p) => { for (let i = 0; i < p.n; i++) colors.push(p); });
    const dot = Math.max(2.2, Math.min(9, (R1 - R0) / rows / 2.4));
    let s = `<svg class="hemi" viewBox="0 0 ${W} ${H}">`;
    seats.forEach((st, i) => { const p = colors[i]; s += `<circle cx="${st.x.toFixed(1)}" cy="${st.y.toFixed(1)}" r="${dot}" fill="${p ? p.color : '#334155'}" ${p && p.hl ? 'stroke="#fff" stroke-width="1.5"' : ''} style="animation:fadeUp .4s ${(i * 6) % 900}ms backwards"/>`; });
    if (opts.majority) s += `<text x="${cx}" y="${cy - 12}" text-anchor="middle" fill="#fff" style="font-family:var(--fh);font-weight:800;font-size:26px">${opts.center || ''}</text><text x="${cx}" y="${cy + 4}" text-anchor="middle" fill="#98a2c3" style="font-size:11px">maioria: ${opts.majority}</text>`;
    return s + '</svg>';
  };

  M.gauge = (v, label = '') => {
    const a = Math.PI * (1 - U.clamp(v, 0, 100) / 100); const r = 80, cx = 100, cy = 100;
    const ex = cx + r * Math.cos(a), ey = cy - r * Math.sin(a);
    const col = v >= 60 ? '#22c55e' : v >= 40 ? '#facc15' : '#ef4444';
    return `<svg class="gauge" viewBox="0 0 200 112"><path d="M20 100 A80 80 0 0 1 180 100" stroke="rgba(255,255,255,.08)" stroke-width="16" fill="none" stroke-linecap="round"/>
<path d="M20 100 A80 80 0 0 1 ${ex.toFixed(1)} ${ey.toFixed(1)}" stroke="${col}" stroke-width="16" fill="none" stroke-linecap="round" style="filter:drop-shadow(0 0 8px ${col})"/>
<text x="100" y="92" text-anchor="middle" fill="#fff" style="font-family:var(--fh);font-weight:900;font-size:34px">${Math.round(v)}%</text><text x="100" y="110" text-anchor="middle" fill="#98a2c3" style="font-size:10px;letter-spacing:.1em">${label}</text></svg>`;
  };

  // skyline decorativo
  M.skyline = () => {
    let s = '<svg class="skyline" viewBox="0 0 1600 240" preserveAspectRatio="xMidYMax slice"><defs><linearGradient id="skg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(var(--accRGB),.22)"/><stop offset="1" stop-color="#060a16"/></linearGradient></defs>';
    const r = U.rng(42); let x = 0;
    while (x < 1600) { const w = 30 + r() * 70, h = 50 + r() * 160; s += `<rect x="${x.toFixed(0)}" y="${(240 - h).toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="url(#skg)" stroke="rgba(255,255,255,.05)"/>`; for (let k = 0; k < 6; k++) if (r() < 0.5) s += `<rect x="${(x + 6 + r() * (w - 14)).toFixed(0)}" y="${(240 - h + 10 + r() * (h - 20)).toFixed(0)}" width="4" height="6" fill="rgba(250,204,21,${(0.2 + r() * 0.5).toFixed(2)})"/>`; x += w + 4; }
    // congresso estilizado
    s += `<g transform="translate(720 70)" fill="rgba(var(--accRGB),.28)" stroke="rgba(255,255,255,.15)"><rect x="20" y="0" width="22" height="170"/><rect x="58" y="0" width="22" height="170"/><path d="M-80 170 L180 170 L180 150 L-80 150Z"/><path d="M-60 150 A40 22 0 0 1 20 150Z"/><path d="M80 150 A40 22 0 0 0 160 150Z"/></g>`;
    return s + '</svg>';
  };
})();
