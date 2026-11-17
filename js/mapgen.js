/* Geometria de mapas: projeções, Voronoi recortado, contornos de cidades (IBGE) e geração procedural */
(function () {
  const M = (window.MapGen = {});

  // anéis: arrays planos [x0,y0,x1,y1,...]
  M.ringPath = (r) => {
    let s = 'M' + r[0].toFixed(1) + ' ' + r[1].toFixed(1);
    for (let i = 2; i < r.length; i += 2) s += 'L' + r[i].toFixed(1) + ' ' + r[i + 1].toFixed(1);
    return s + 'Z';
  };
  M.ringsPath = (rings) => rings.map(M.ringPath).join('');
  M.bbox = (rings) => {
    let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity;
    for (const r of rings) for (let i = 0; i < r.length; i += 2) {
      if (r[i] < a) a = r[i]; if (r[i] > c) c = r[i]; if (r[i + 1] < b) b = r[i + 1]; if (r[i + 1] > d) d = r[i + 1];
    }
    return [a, b, c, d];
  };
  M.area = (r) => { let s = 0; for (let i = 0, n = r.length; i < n; i += 2) { const j = (i + 2) % n; s += r[i] * r[j + 1] - r[j] * r[i + 1]; } return s / 2; };
  M.centroid = (rings) => {
    let A = 0, cx = 0, cy = 0;
    for (const r of rings) {
      for (let i = 0, n = r.length; i < n; i += 2) {
        const j = (i + 2) % n; const f = r[i] * r[j + 1] - r[j] * r[i + 1];
        A += f; cx += (r[i] + r[j]) * f; cy += (r[i + 1] + r[j + 1]) * f;
      }
    }
    if (Math.abs(A) < 1e-6) { const b = M.bbox(rings); return [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]; }
    return [cx / (3 * A), cy / (3 * A)];
  };
  // centroide do maior anel (melhor para rótulos)
  M.labelPoint = (rings) => {
    let best = rings[0], ba = 0;
    for (const r of rings) { const a = Math.abs(M.area(r)); if (a > ba) { ba = a; best = r; } }
    const c = M.centroid([best]);
    if (M.pip(c[0], c[1], [best])) return c;
    // fallback: ponto médio entre vértices
    let sx = 0, sy = 0; const n = best.length / 2;
    for (let i = 0; i < best.length; i += 2) { sx += best[i]; sy += best[i + 1]; }
    return [sx / n, sy / n];
  };
  M.totalArea = (rings) => rings.reduce((s, r) => s + Math.abs(M.area(r)), 0);
  M.pip = (x, y, rings) => {
    let inside = false;
    for (const r of rings) {
      for (let i = 0, n = r.length, j = n - 2; i < n; j = i, i += 2) {
        const xi = r[i], yi = r[i + 1], xj = r[j], yj = r[j + 1];
        if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
      }
    }
    return inside;
  };

  // Recorta polígono (anel plano) pelo semiplano mais próximo de p do que de q
  function clipHalf(poly, px, py, qx, qy) {
    const mx = (px + qx) / 2, my = (py + qy) / 2, dx = qx - px, dy = qy - py;
    const f = (x, y) => (x - mx) * dx + (y - my) * dy; // <=0 dentro
    const out = [];
    const n = poly.length;
    for (let i = 0; i < n; i += 2) {
      const ax = poly[i], ay = poly[i + 1];
      const j = (i + 2) % n; const bx = poly[j], by = poly[j + 1];
      const fa = f(ax, ay), fb = f(bx, by);
      if (fa <= 0) out.push(ax, ay);
      if ((fa <= 0) !== (fb <= 0)) { const t = fa / (fa - fb); out.push(ax + (bx - ax) * t, ay + (by - ay) * t); }
    }
    return out;
  }
  // Sutherland–Hodgman: recorta anel sujeito por polígono convexo (anel plano, orientação qualquer)
  function clipConvex(subject, clip) {
    let out = subject;
    const n = clip.length;
    const orient = M.area(clip) > 0 ? 1 : -1;
    for (let i = 0; i < n && out.length >= 6; i += 2) {
      const ax = clip[i], ay = clip[i + 1], j = (i + 2) % n, bx = clip[j], by = clip[j + 1];
      const side = (x, y) => orient * ((bx - ax) * (y - ay) - (by - ay) * (x - ax)); // >=0 dentro
      const inp = out; out = [];
      for (let k = 0, m = inp.length; k < m; k += 2) {
        const cx = inp[k], cy = inp[k + 1], l = (k + 2) % m, dx = inp[l], dy = inp[l + 1];
        const sc = side(cx, cy), sd = side(dx, dy);
        if (sc >= 0) out.push(cx, cy);
        if ((sc >= 0) !== (sd >= 0)) { const t = sc / (sc - sd); out.push(cx + (dx - cx) * t, cy + (dy - cy) * t); }
      }
    }
    return out;
  }
  M.voronoiCells = (seeds, box) => {
    const [x0, y0, x1, y1] = box;
    return seeds.map(([px, py], i) => {
      let cell = [x0, y0, x1, y0, x1, y1, x0, y1];
      for (let j = 0; j < seeds.length; j++) if (j !== i) { cell = clipHalf(cell, px, py, seeds[j][0], seeds[j][1]); if (cell.length < 6) break; }
      return cell;
    });
  };
  // Voronoi recortado pelo contorno (várias peças por célula)
  M.voronoiClip = (seeds, rings) => {
    const b = M.bbox(rings); const pad = 10;
    const cells = M.voronoiCells(seeds, [b[0] - pad, b[1] - pad, b[2] + pad, b[3] + pad]);
    return cells.map((cell) => {
      const pieces = [];
      for (const r of rings) { const c = clipConvex(r, cell); if (c.length >= 6 && Math.abs(M.area(c)) > 0.5) pieces.push(c); }
      return { cell, pieces };
    });
  };
  M.randomPointIn = (rings, rnd) => {
    const b = M.bbox(rings);
    for (let k = 0; k < 400; k++) { const x = b[0] + (b[2] - b[0]) * rnd(), y = b[1] + (b[3] - b[1]) * rnd(); if (M.pip(x, y, rings)) return [x, y]; }
    return M.labelPoint(rings);
  };
  M.seeds = (rings, n, rnd, iters = 2) => {
    let s = []; for (let i = 0; i < n; i++) s.push(M.randomPointIn(rings, rnd));
    for (let it = 0; it < iters; it++) {
      const v = M.voronoiClip(s, rings);
      s = v.map((c, i) => (c.pieces.length ? (() => { const p = M.centroid(c.pieces); return M.pip(p[0], p[1], rings) ? p : s[i]; })() : s[i]));
    }
    return s;
  };

  // Douglas-Peucker em lista de pontos [[x,y]]
  M.simplify = (pts, tol) => {
    if (pts.length < 5) return pts;
    const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
    const st = [[0, pts.length - 1]];
    while (st.length) {
      const [a, b] = st.pop(); const [ax, ay] = pts[a], [bx, by] = pts[b];
      const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy);
      let md = -1, mi = -1;
      for (let k = a + 1; k < b; k++) {
        const d = L > 1e-9 ? Math.abs(dy * pts[k][0] - dx * pts[k][1] + bx * ay - by * ax) / L : Math.hypot(pts[k][0] - ax, pts[k][1] - ay);
        if (d > md) { md = d; mi = k; }
      }
      if (md > tol) { keep[mi] = 1; st.push([a, mi], [mi, b]); }
    }
    return pts.filter((_, i) => keep[i]);
  };

  // Converte geometria GeoJSON lon/lat em anéis normalizados (largura W)
  M.fromGeoJSON = (gj, W = 1000) => {
    const polys = [];
    const feats = gj.type === 'FeatureCollection' ? gj.features : [gj];
    for (const f of feats) {
      const g = f.geometry || f;
      if (g.type === 'Polygon') polys.push(g.coordinates[0]);
      if (g.type === 'MultiPolygon') g.coordinates.forEach((p) => polys.push(p[0]));
    }
    if (!polys.length) return null;
    let lat0 = 0, n = 0; polys.forEach((p) => p.forEach((c) => { lat0 += c[1]; n++; })); lat0 /= n;
    const k = Math.cos((lat0 * Math.PI) / 180);
    let pr = polys.map((p) => p.map(([lo, la]) => [lo * k, -la]));
    let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity;
    pr.forEach((p) => p.forEach(([x, y]) => { a = Math.min(a, x); c = Math.max(c, x); b = Math.min(b, y); d = Math.max(d, y); }));
    const sc = W / Math.max(c - a, (d - b) * 1.25);
    const rings = [];
    pr.forEach((p) => {
      let q = p.map(([x, y]) => [(x - a) * sc + 20, (y - b) * sc + 20]);
      q = M.simplify(q, 1.2);
      const flat = []; q.forEach(([x, y]) => flat.push(x, y));
      if (flat.length >= 8 && Math.abs(M.area(flat)) > 60) rings.push(flat);
    });
    if (!rings.length) return null;
    const bb = M.bbox(rings);
    return { rings, w: bb[2] + 20, h: bb[3] + 20 };
  };

  // Contornos embutidos (js/data/outlines/UF.js), carregados sob demanda por estado
  const loadedUF = {};
  const loadScript = (src) => new Promise((res) => { const s = document.createElement('script'); s.src = src; s.onload = () => res(true); s.onerror = () => res(false); document.head.appendChild(s); });
  M.localOutline = async (ibgeId, uf) => {
    if (!uf) return null;
    if (!loadedUF[uf]) loadedUF[uf] = loadScript('js/data/outlines/' + uf + '.js');
    await loadedUF[uf];
    const enc = window.BR_OUTLINES && window.BR_OUTLINES[String(ibgeId)];
    if (!enc) return null;
    const rings = enc.split('|').map((r) => r.split(',').map(Number));
    const bb = M.bbox(rings);
    return { rings, w: bb[2] + 20, h: bb[3] + 20 };
  };
  M.cityOutline = async (ibgeId, uf) => (await M.localOutline(ibgeId, uf)) || (await M.fetchCityOutline(ibgeId));

  M.fetchCityOutline = async (ibgeId) => {
    const url = 'https://servicodados.ibge.gov.br/api/v3/malhas/municipios/' + ibgeId + '?formato=application/vnd.geo%2Bjson&qualidade=intermediaria';
    try {
      const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 6000);
      const r = await fetch(url, { signal: ctl.signal }); clearTimeout(t);
      if (!r.ok) return null;
      return M.fromGeoJSON(await r.json(), 900);
    } catch (e) { return null; }
  };

  // Contorno procedural orgânico
  M.blob = (rnd, W = 900, H = 700, pts = 64) => {
    const cx = W / 2 + 20, cy = H / 2 + 20, rx = W / 2 - 10, ry = H / 2 - 10;
    const harm = [1, 2, 3, 5, 7].map((k) => ({ k, a: (0.18 / k) * (0.5 + rnd()), p: rnd() * Math.PI * 2 }));
    const out = [];
    for (let i = 0; i < pts; i++) {
      const t = (i / pts) * Math.PI * 2;
      let r = 1; harm.forEach((h) => (r += h.a * Math.sin(h.k * t + h.p)));
      r = Math.max(0.55, Math.min(1.1, r * 0.88));
      out.push(cx + Math.cos(t) * rx * r, cy + Math.sin(t) * ry * r);
    }
    return { rings: [out], w: W + 40, h: H + 40 };
  };

  // Projeção de lat/lon nos quadros pré-projetados do Brasil
  M.brXY = (lat, lon, key = 'BR') => {
    const g = window.GEO[key].geo; // [minx, miny, sc, c]
    return [(lon * g[3] - g[0]) * g[2], (-lat - g[1]) * g[2]];
  };

  // Unidades GEO de um país/estado
  M.units = (key, filter) => (window.GEO[key] ? window.GEO[key].u.filter(filter || (() => true)) : []);

  // Decoração urbana: rio, avenidas, parques
  M.cityDeco = (rings, rnd) => {
    const b = M.bbox(rings); const c = M.labelPoint(rings);
    const w = b[2] - b[0], h = b[3] - b[1];
    const deco = { roads: [], river: null, parks: [], center: c };
    const nRoads = 3 + Math.floor(rnd() * 3);
    for (let i = 0; i < nRoads; i++) {
      const ang = (i / nRoads) * Math.PI * 2 + rnd() * 0.6;
      const L = Math.max(w, h);
      const mx = c[0] + Math.cos(ang + 0.4) * L * 0.25 * (rnd() - 0.5);
      const my = c[1] + Math.sin(ang + 0.4) * L * 0.25 * (rnd() - 0.5);
      deco.roads.push(`M${c[0].toFixed(0)} ${c[1].toFixed(0)}Q${mx.toFixed(0)} ${my.toFixed(0)} ${(c[0] + Math.cos(ang) * L).toFixed(0)} ${(c[1] + Math.sin(ang) * L).toFixed(0)}`);
    }
    deco.ring = { cx: c[0], cy: c[1], r: Math.min(w, h) * (0.18 + rnd() * 0.1) };
    if (rnd() < 0.65) {
      const y0 = b[1] + h * (0.2 + rnd() * 0.6), y1 = b[1] + h * (0.2 + rnd() * 0.6);
      deco.river = `M${b[0] - 20} ${y0.toFixed(0)}C${(b[0] + w * 0.33).toFixed(0)} ${(y0 + (rnd() - 0.5) * h * 0.6).toFixed(0)} ${(b[0] + w * 0.66).toFixed(0)} ${(y1 + (rnd() - 0.5) * h * 0.6).toFixed(0)} ${(b[2] + 20).toFixed(0)} ${y1.toFixed(0)}`;
    }
    const np = 2 + Math.floor(rnd() * 3);
    for (let i = 0; i < np; i++) { const p = M.randomPointIn(rings, rnd); deco.parks.push([p[0], p[1], Math.min(w, h) * (0.02 + rnd() * 0.03)]); }
    return deco;
  };
})();
