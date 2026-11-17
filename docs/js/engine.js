/* Motor do jogo: estado, eleitorado, campanha, IA, sistemas eleitorais, mandato e carreira.
   Não toca no DOM — a interface conversa com ele por funções. */
(function () {
  const E = (window.Engine = {});
  const K = window.CONTENT, C = window.COUNTRIES;
  const { clamp, rand, randi, pick, wpick, gauss, shuffle, sum } = U;
  const TAU = 0.55;

  // ================== Cidades ==================
  let brCities = null, brById = null, brUF = null, brRI = null;
  E.brCities = () => {
    if (brCities) return brCities;
    brCities = []; brById = {}; brUF = {}; brRI = {};
    for (const line of window.BR_CITIES_RAW.split('\n')) {
      const [id, n, uf, pop, lat, lon, ri, cap] = line.split(';');
      const c = { id: +id, n, region: uf, pop: +pop, lat: +lat, lon: +lon, ri: +ri, cap: cap === '1', nn: U.norm(n) };
      brCities.push(c); brById[c.id] = c;
      brUF[uf] = (brUF[uf] || 0) + c.pop; brRI[c.ri] = (brRI[c.ri] || 0) + c.pop;
    }
    brCities.sort((a, b) => b.pop - a.pop);
    return brCities;
  };
  E.brUFPop = (uf) => (E.brCities(), brUF[uf]);
  E.brRIPop = (ri) => (E.brCities(), brRI[ri] || 1000);
  E.cityList = (cid = E.S && E.S.country) => {
    if (cid === 'BR') return E.brCities();
    const co = C[cid];
    return co.cities.map(([n, region, pop]) => ({ id: n, n, region, pop, nn: U.norm(n) }));
  };
  E.findCity = (id, cid = E.S && E.S.country) => {
    if (cid === 'BR') { E.brCities(); return brById[id]; }
    return E.cityList(cid).find((c) => c.id === id);
  };
  E.difficulty = (pop) => {
    const lv = pop < 15000 ? 0 : pop < 60000 ? 1 : pop < 250000 ? 2 : pop < 1000000 ? 3 : pop < 4000000 ? 4 : 5;
    return { lv, n: ['Muito fácil', 'Fácil', 'Médio', 'Difícil', 'Muito difícil', 'Extremo'][lv], c: ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444', '#a21caf'][lv] };
  };

  // ================== Estado ==================
  E.S = null;
  const co = () => C[E.S.country];
  E.country = co;
  E.officeDef = (id, cid) => (cid ? C[cid] : co()).offices.find((o) => o.id === id);
  E.party = (id) => E.S.parties.find((p) => p.id === id);
  E.playerParty = () => E.party(E.S.player.party);
  E.age = () => E.S.year - E.S.player.birth;
  E.fmtMoney = (v) => U.fmtMoney(v, co().cur);

  E.newGame = (cid, spec) => {
    const country = C[cid];
    const real = spec.realId ? country.real.find((r) => r.id === spec.realId) : null;
    const prof = K.PROFESSIONS.find((p) => p.id === spec.prof);
    const S = {
      v: 1, country: cid, year: 0, sem: 1, seed: (Math.random() * 1e9) | 0,
      parties: JSON.parse(JSON.stringify(country.parties)),
      player: null, partySupport: 55, office: null, camp: null, history: [], log: [], flags: {}, over: null, totalVotes: 0, wins: 0,
    };
    let p;
    if (real) {
      const party = S.parties.find((x) => x.id === real.party);
      p = {
        id: 'P', name: real.name, ballot: real.name, g: real.av.g, birth: real.birth, av: real.av, prof: null, realId: real.id,
        attrs: { ...real.attrs }, econ: party.e, soc: party.s, ideology: null, party: real.party, fame: real.fame, rep: 60,
        money: 30 * 10000 * country.costMult, home: real.home, held: real.held.slice(), segBonus: {}, issBonus: {},
      };
      S.partySupport = 70;
    } else {
      p = {
        id: 'P', name: spec.name, ballot: spec.ballot || spec.name, g: spec.g, birth: spec.birth, av: spec.av, prof: spec.prof, realId: null,
        attrs: spec.attrs, econ: spec.econ, soc: spec.soc, ideology: spec.ideology, party: spec.party, fame: prof ? prof.fame : 8, rep: 55,
        money: (prof ? prof.money : 4) * 10000 * country.costMult, home: null, held: [], segBonus: prof ? prof.seg : {}, issBonus: prof ? prof.issue : {},
      };
    }
    S.player = p;
    E.S = S;
    return S;
  };
  E.setParty = (pid) => { E.S.player.party = pid; };

  // ---------- Criação de partido ----------
  E.createParty = ({ id, name, color, num }) => {
    const S = E.S, p = S.player;
    const party = { id, name, color, e: p.econ, s: p.soc, size: 0.04, num: num || 0, own: true };
    S.parties.push(party); p.party = id; S.partySupport = 100;
    S.log.unshift({ y: S.year, t: `Você fundou o partido ${name} (${id}).` });
    return party;
  };
  E.changeParty = (pid) => {
    const S = E.S;
    if (S.player.party && S.player.party !== pid && S.year) { S.player.rep = clamp(S.player.rep - 3, 0, 100); }
    S.player.party = pid; S.partySupport = 45;
  };
  E.partyFit = (party, p = E.S.player) => 1 - Math.min(1, Math.hypot(party.e - p.econ, party.s - p.soc) / 1.6);

  // ================== Calendário e carreira ==================
  E.officesInYear = (year, cid = E.S.country) => C[cid].offices.filter((o) => year >= o.offset && (year - o.offset) % o.every === 0);
  E.nextYearFor = (oid, from) => {
    const o = E.officeDef(oid); let y = Math.max(from, o.offset);
    while ((y - o.offset) % o.every !== 0) y++;
    return y;
  };
  E.startYear = (cid) => Math.min(...C[cid].offices.filter((o) => o.level === 1).map((o) => o.offset));
  E.heldIds = () => { const S = E.S; const ids = new Set(S.player.held); S.history.filter((h) => h.won).forEach((h) => ids.add(h.office)); if (S.office) ids.add(S.office.id); if (S.leaderOf && S.leaderOf === S.player.party) ids.add(S.leaderOffice); return ids; };
  E.canRun = (oid, year = E.S.year) => {
    const S = E.S, p = S.player, o = E.officeDef(oid); const checks = [];
    const age = year - p.birth;
    checks.push({ t: `Idade mínima ${o.minAge} anos (você terá ${age})`, ok: age >= o.minAge });
    const held = E.heldIds();
    if (o.req) {
      if (o.req.cur) {
        const ok = !!(S.office && o.req.cur.includes(S.office.id)) || (S.leaderOf === p.party && o.req.cur.includes(S.leaderOffice));
        checks.push({ t: `Ser ${o.req.cur.map((x) => E.officeDef(x).name).join(' ou ')} atualmente`, ok });
        checks.push({ t: `Fama ≥ ${o.req.fame}`, ok: p.fame >= o.req.fame });
      } else {
        const hasExp = o.req.any.some((x) => held.has(x));
        const okMain = hasExp && p.fame >= o.req.fame;
        const okAlt = o.req.alt && p.fame >= o.req.alt;
        checks.push({ t: `Experiência: ${o.req.any.map((x) => E.officeDef(x).name.replace(/\s*\(.*\)/, '')).join(', ')}`, ok: hasExp || okAlt, alt: true });
        checks.push({ t: `Fama ≥ ${o.req.fame}` + (o.req.alt ? ` (ou ≥ ${o.req.alt} sem experiência)` : ''), ok: okMain || okAlt });
      }
    }
    if (o.maxConsec && S.office && S.office.id === oid && (S.office.consec || 1) >= o.maxConsec) checks.push({ t: `Limite de ${o.maxConsec} mandatos consecutivos`, ok: false });
    if (o.maxTotal) { const n = S.history.filter((h) => h.won && h.office === oid).length + (p.held.includes(oid) ? 1 : 0); if (n >= o.maxTotal) checks.push({ t: `Limite de ${o.maxTotal} mandato(s) no cargo`, ok: false }); }
    if (S.office && S.office.id === oid && S.office.end > year) checks.push({ t: 'Você já ocupa este cargo', ok: false });
    if (!o.nonpartisan && !p.party) checks.push({ t: 'Filiação partidária', ok: false });
    if (S.ineligibleUntil && year <= S.ineligibleUntil) checks.push({ t: `Inelegível até ${S.ineligibleUntil}`, ok: false });
    return { ok: checks.every((c) => c.ok), checks };
  };
  E.upcoming = (n = 4) => {
    const out = []; let y = E.S.year;
    while (out.length < n && y < E.S.year + 14) { const offs = E.officesInYear(y); if (offs.length) out.push({ year: y, offices: offs }); y++; }
    return out;
  };

  // ================== Arenas (eleitorado) ==================
  function makeSal(z, rnd) {
    const urb = z.urban;
    const s = {
      saude: 1.0, educacao: 0.75 + z.young * 0.4, seguranca: 0.85 + urb * 0.25, economia: 0.9 + (1 - z.inc) * 0.3,
      impostos: 0.25 + z.inc * 0.8, ambiente: 0.15 + z.inc * z.young * 0.9, transporte: 0.3 + (1 - z.inc) * urb * 0.6,
      moradia: 0.15 + (1 - z.inc) * 0.7, corrupcao: 0.45 + z.inc * 0.3, valores: 0.15 + z.rel * 0.6,
    };
    let tot = 0; for (const k in s) { s[k] *= 0.8 + rnd() * 0.4; tot += s[k]; }
    for (const k in s) s[k] /= tot;
    return s;
  }
  function finishZone(z, lean, rnd) {
    z.econ = clamp(lean[0] + (z.inc - 0.5) * 0.9 + gauss(rnd) * 0.1, -1, 1);
    z.soc = clamp(lean[1] + (z.rel - 0.5) * 0.85 - (z.young - 0.3) * 0.5 + gauss(rnd) * 0.1, -1, 1);
    z.sal = makeSal(z, rnd); z.aw = {}; z.mo = {};
    return z;
  }
  function cityLean(region, pop, cid) {
    const r = C[cid].regions[region];
    const big = Math.log10(Math.max(pop, 3000) / 1e5);
    return [r ? r.lean[0] - big * 0.05 : 0, (r ? r.lean[1] : 0) - big * 0.1];
  }
  function cityZones(arena, outline, rnd, names, base) {
    const pop = arena.pop;
    let n = pop < 8000 ? 4 : pop < 20000 ? 5 : pop < 50000 ? 6 : pop < 150000 ? 7 : pop < 400000 ? 9 : pop < 1e6 ? 11 : pop < 3e6 ? 13 : 15;
    if (names && names.length >= 6) n = Math.min(Math.max(n, 8), names.length);
    const seeds = MapGen.seeds(outline.rings, n, rnd, 2);
    const vor = MapGen.voronoiClip(seeds, outline.rings);
    const ctr = MapGen.labelPoint(outline.rings);
    const b = MapGen.bbox(outline.rings); const R = Math.hypot(b[2] - b[0], b[3] - b[1]) / 2;
    const richAng = rnd() * Math.PI * 2;
    // nomes
    let nm;
    if (names && names.length) nm = shuffle(names, rnd).slice(0, n);
    else {
      const G = K.BAIRRO_GEN[base] || K.BAIRRO_GEN.br; const used = new Set();
      nm = [];
      for (let i = 0; i < n; i++) {
        let s, k = 0;
        do { const pre = pick(G.pre, rnd); s = (pre ? pre + ' ' : '') + pick(G.suf, rnd); k++; } while (used.has(s) && k < 30);
        used.add(s); nm.push(s);
      }
    }
    const zones = vor.map((v, i) => {
      const pieces = v.pieces.length ? v.pieces : [v.cell];
      const lp = MapGen.labelPoint(pieces);
      const d = clamp(Math.hypot(lp[0] - ctr[0], lp[1] - ctr[1]) / R, 0, 1);
      let ang = Math.atan2(lp[1] - ctr[1], lp[0] - ctr[0]) - richAng; ang = Math.abs(Math.atan2(Math.sin(ang), Math.cos(ang)));
      const inc = clamp(0.62 - 0.45 * d + (ang < 0.9 ? 0.16 : 0) + gauss(rnd) * 0.09 + (base === 'en' || base === 'gb' || base === 'fr' ? 0.08 : 0), 0.05, 0.95);
      const rel = clamp(0.42 + 0.35 * (1 - inc) + gauss(rnd) * 0.1, 0.05, 0.95);
      const young = clamp(0.3 + gauss(rnd) * 0.06 + d * 0.06, 0.12, 0.55);
      const area = MapGen.totalArea(pieces);
      return { id: 'z' + i, n: nm[i], rings: pieces, cell: v.cell, lx: lp[0], ly: lp[1], d, inc, rel, young, urban: 0.9, area };
    });
    // Centro e zona rural
    const centerZ = zones.reduce((a, z) => (z.d < a.d ? z : a), zones[0]);
    if (!names) { const fx = (K.BAIRRO_GEN[base] || K.BAIRRO_GEN.br).fixed; if (fx && fx[0]) centerZ.n = fx[0]; }
    centerZ.inc = clamp(centerZ.inc + 0.08, 0, 0.95);
    if (pop < 60000 && zones.length >= 4) {
      const rz = zones.reduce((a, z) => (z.d > a.d ? z : a), zones[0]);
      if (!names) rz.n = (K.BAIRRO_GEN[base] || K.BAIRRO_GEN.br).rural; rz.urban = 0.15; rz.rel = clamp(rz.rel + 0.1, 0, 1); rz.inc = clamp(rz.inc - 0.05, 0.05, 1);
    }
    const lean = arena.lean;
    const ws = zones.map((z) => Math.pow(z.area, 0.55) * (0.6 + rnd() * 0.8) * (z.urban < 0.5 ? 0.5 : 1));
    const tw = sum(ws);
    zones.forEach((z, i) => { z.pop = Math.max(200, Math.round((pop * ws[i]) / tw)); finishZone(z, lean, rnd); delete z.area; delete z.d; });
    return zones;
  }
  function dirName(dx, dy) {
    const a = Math.atan2(-dy, dx) * 180 / Math.PI;
    const dirs = ['Leste', 'Nordeste', 'Norte', 'Noroeste', 'Oeste', 'Sudoeste', 'Sul', 'Sudeste'];
    return dirs[((Math.round(a / 45) % 8) + 8) % 8];
  }

  E.buildArena = (oid, place, outline) => {
    const S = E.S, cid = S.country, country = co(), o = E.officeDef(oid);
    const rnd = U.rng(U.hash(cid + JSON.stringify(place) + oid));
    let a = { type: o.arena, oid, place, zones: [], map: null };
    if (o.arena === 'city' || o.arena === 'district') {
      const city = E.findCity(place.cityId);
      a.region = city.region;
      a.cityId = city.id;
      if (o.arena === 'district') {
        const dp = o.distPop; a.pop = Math.min(dp, Math.max(city.pop * 0.9, dp * 0.6));
        a.name = city.pop > dp * 1.5 ? `${city.n} — Distrito ${1 + (U.hash(city.n) % 9)}` : `Distrito de ${city.n}`;
      } else { a.pop = city.pop; a.name = city.n; }
      a.lean = cityLean(city.region, city.pop, cid);
      const ol = outline || MapGen.blob(rnd);
      const names = o.arena === 'city' ? K.BAIRROS[city.id] : (city.pop > o.distPop * 1.5 ? null : K.BAIRROS[city.id]);
      a.zones = cityZones(a, ol, rnd, names, country.bairroLang);
      a.map = { kind: 'vor', w: ol.w, h: ol.h, outline: ol.rings, deco: MapGen.cityDeco(ol.rings, rnd), real: !!outline };
      a.fullName = a.name + (cid === 'BR' ? ' – ' + city.region : '');
    } else if (o.arena === 'state') {
      const reg = country.regions[place.region];
      a.region = place.region; a.name = reg.n; a.fullName = reg.n;
      if (cid === 'BR') {
        a.pop = E.brUFPop(place.region);
        const units = MapGen.units('BR_RI', (u) => u.z === place.region);
        const capCity = E.brCities().find((c) => c.region === place.region && c.cap);
        a.zones = units.map((u) => {
          const lp = MapGen.labelPoint(u.r);
          const isCap = capCity && capCity.ri === +u.id;
          const z = { id: String(u.id), n: u.n, rings: u.r, lx: lp[0], ly: lp[1], pop: E.brRIPop(+u.id), inc: clamp(reg.inc + (isCap ? 0.12 : -0.05) + gauss(rnd) * 0.06, 0.05, 0.95), rel: clamp(reg.rel + (isCap ? -0.06 : 0.04) + gauss(rnd) * 0.05, 0.05, 0.95), young: 0.3, urban: isCap ? 0.97 : clamp(0.6 + gauss(rnd) * 0.12, 0.3, 0.9) };
          return finishZone(z, [reg.lean[0] + (isCap ? -0.08 : 0.03), reg.lean[1] + (isCap ? -0.1 : 0.04)], rnd);
        });
        const bb = MapGen.bbox(units.flatMap((u) => u.r));
        a.map = { kind: 'geo', key: 'BR_RI', zoneOf: 'id', filter: place.region, vb: [bb[0] - 30, bb[1] - 30, bb[2] - bb[0] + 60, bb[3] - bb[1] + 60] };
        a.dots = E.brCities().filter((c) => c.region === place.region).slice(0, 8).map((c) => { const [x, y] = MapGen.brXY(c.lat, c.lon, 'BR_RI'); return { x, y, n: c.n, cap: c.cap }; });
      } else {
        a.pop = reg.pop;
        const units = MapGen.units(cid, (u) => u.z === place.region);
        const rings = units.flatMap((u) => u.r);
        const nz = clamp(Math.round(4 + Math.log2(Math.max(1, reg.pop / 1e6)) * 1.3), 4, 9);
        const seeds = MapGen.seeds(rings, nz, rnd, 2);
        const vor = MapGen.voronoiClip(seeds, rings);
        const ctr = MapGen.labelPoint(rings);
        const bigCity = (country.cities || []).filter((c) => c[1] === place.region).sort((x, y) => y[2] - x[2])[0];
        let metroIdx = 0, best = -1; vor.forEach((v, i) => { const s = v.pieces.length ? MapGen.totalArea(v.pieces) : 0; if (s > best) { best = s; metroIdx = i; } });
        const used = {};
        a.zones = vor.map((v, i) => {
          const pieces = v.pieces.length ? v.pieces : [v.cell];
          const lp = MapGen.labelPoint(pieces);
          let n;
          if (i === metroIdx && bigCity) n = 'Região de ' + bigCity[0];
          else { const d = dirName(lp[0] - ctr[0], lp[1] - ctr[1]); used[d] = (used[d] || 0) + 1; n = reg.n + ' — ' + d + (used[d] > 1 ? ' ' + used[d] : ''); }
          const metro = i === metroIdx;
          const z = { id: 'r' + i, n, rings: pieces, lx: lp[0], ly: lp[1], inc: clamp(reg.inc + (metro ? 0.12 : -0.04) + gauss(rnd) * 0.06, 0.05, 0.95), rel: clamp(reg.rel + (metro ? -0.08 : 0.04) + gauss(rnd) * 0.05, 0.05, 0.95), young: 0.3, urban: metro ? 0.95 : clamp(0.55 + gauss(rnd) * 0.15, 0.25, 0.9), w: metro ? 2.2 : 0.7 + rnd() * 0.6 };
          return finishZone(z, [reg.lean[0] + (metro ? -0.1 : 0.04), reg.lean[1] + (metro ? -0.12 : 0.05)], rnd);
        });
        const tw = sum(a.zones, (z) => z.w); a.zones.forEach((z) => { z.pop = Math.round((reg.pop * z.w) / tw); delete z.w; });
        const bb = MapGen.bbox(rings);
        a.map = { kind: 'vorgeo', key: cid, filter: place.region, vb: [bb[0] - 20, bb[1] - 20, bb[2] - bb[0] + 40, bb[3] - bb[1] + 40], zonesRings: true };
      }
    } else if (o.arena === 'country') {
      a.name = country.name; a.fullName = country.name;
      const key = cid; const groups = {};
      MapGen.units(key).forEach((u) => { if (country.skipZones && country.skipZones.includes(u.z)) return; (groups[u.z] = groups[u.z] || []).push(u); });
      a.zones = Object.keys(groups).filter((zid) => country.regions[zid]).map((zid) => {
        const reg = country.regions[zid];
        const rings = groups[zid].flatMap((u) => u.r);
        let lp = MapGen.labelPoint(rings);
        const z = { id: zid, n: reg.n, rings: null, lx: lp[0], ly: lp[1], pop: cid === 'BR' ? E.brUFPop(zid) : reg.pop, inc: reg.inc, rel: reg.rel, young: 0.3, urban: 0.75, ev: reg.ev, seats: reg.seats };
        return finishZone(z, reg.lean, rnd);
      });
      a.pop = sum(a.zones, (z) => z.pop);
      a.map = { kind: 'geo', key, zoneOf: 'z', filter: null };
    } else if (o.arena === 'party') {
      const party = E.playerParty();
      a.name = 'Militância do ' + party.id; a.fullName = a.name;
      a.pop = Math.round(30000 + party.size * 300000);
      const f = [['ala_esq', 'Ala progressista', -0.3, -0.3, 0.3], ['ala_cen', 'Ala moderada', 0, 0, 0.4], ['ala_dir', 'Ala conservadora', 0.3, 0.3, 0.3]];
      a.zones = f.map(([id, n, de, ds, sh]) => ({ id, n, pop: Math.round(a.pop * sh), inc: 0.6, rel: 0.5, young: 0.3, urban: 0.9, econ: clamp(party.e + de, -1, 1), soc: clamp(party.s + ds, -1, 1), sal: makeSal({ inc: 0.6, rel: 0.5, young: 0.3, urban: 0.9 }, rnd), aw: {}, mo: {} }));
      a.map = { kind: 'party' };
    }
    a.elec = Math.round(a.pop * (o.arena === 'party' ? 1 : country.elecRatio));
    a.zones.forEach((z) => (z.share = z.pop / a.pop));
    a.D = clamp(Math.log10(Math.max(a.elec, 1000)) - 3.3, 0, 4.2) + (o.level - 1) * 0.25;
    a.cost = Math.round(1000 * country.costMult * Math.pow(Math.max(1, a.elec / 8000), 0.55));
    if (o.sys === 'list_open' || o.sys === 'list_closed') a.seats = o.seats(a);
    if (o.sys === 'plurality') a.seats = o.seatsFn ? o.seatsFn(S.year) : o.seats || 1;
    return a;
  };

  // ================== Candidatos ==================
  function genName(rnd, g, ballotStyle) {
    const N = K.NAMES[co().names] || K.NAMES.br;
    const first = pick(N[g], rnd), last = pick(N.s, rnd);
    let ballot = first + ' ' + last;
    if (co().names === 'br' && ballotStyle) {
      const r = rnd();
      if (r < 0.3) ballot = pick(g === 'm' ? N.tm : N.tf, rnd) + ' ' + first;
      else if (r < 0.45) ballot = first + ' ' + pick(N.nick, rnd);
    }
    return { name: first + ' ' + last + (rnd() < 0.4 ? ' ' + pick(N.s, rnd) : ''), ballot };
  }
  function ballotNumber(party, digits, rnd, used) {
    let n, k = 0;
    do {
      const base = party && party.num && (k < 60 || digits > 2) ? String(party.num) : String(randi(10, 99, rnd));
      n = base + (digits > 2 ? String(randi(0, Math.pow(10, digits - 2) - 1, rnd)).padStart(digits - 2, '0') : '');
      k++;
    } while (used.has(n) && k < 400);
    used.add(n); return n;
  }
  function newAI(o, party, rnd, str, extra = {}) {
    const g = rnd() < 0.62 ? 'm' : 'f';
    const nm = genName(rnd, g, o.sys === 'list_open' || o.level <= 2);
    return Object.assign({
      id: U.uid('c'), name: nm.name, ballot: nm.ballot, g, party: party ? party.id : null, color: party ? party.color : '#94a3b8',
      econ: clamp((party ? party.e : rand(-0.6, 0.6, rnd)) + gauss(rnd) * 0.15, -1, 1), soc: clamp((party ? party.s : rand(-0.6, 0.6, rnd)) + gauss(rnd) * 0.15, -1, 1),
      attrs: { car: randi(40, 80, rnd), ora: randi(40, 80, rnd), int: randi(40, 80, rnd), intg: randi(40, 80, rnd), art: randi(40, 80, rnd) },
      str, isP: false, av: Avatar.random(rnd, { g, tc: party ? party.color : undefined }), mom: 0, iss: shuffle(K.TOPIC_IDS, rnd).slice(0, 3).reduce((o, t) => ((o[t] = rand(0.15, 0.35, rnd)), o), {}), prom: [], scandal: 0, out: false, aggr: rand(0.3, 1, rnd),
      fame: Math.round(str * 60),
    }, extra);
  }
  function pickParties(n, exclude, rnd, opts = {}) {
    let pool = E.S.parties.filter((p) => !exclude.includes(p.id) && !p.own && (!p.regions || (opts.region && p.regions.includes(opts.region))));
    if (opts.majorOnly) pool = pool.filter((p) => p.major);
    const out = [];
    while (out.length < n && pool.length) { const p = wpick(pool, (x) => Math.pow(x.size, 1.3) + 0.03, rnd); out.push(p); pool = pool.filter((x) => x !== p); }
    return out;
  }

  // ================== Início de campanha ==================
  E.startCampaign = (oid, arena) => {
    const S = E.S, o = E.officeDef(oid), p = S.player, country = co();
    const rnd = U.rng(S.seed + S.year * 7 + U.hash(oid));
    const party = E.playerParty();
    // desincompatibilização
    if (S.office && S.office.kind === 'exec' && S.office.id !== oid && country.id === 'BR') {
      S.log.unshift({ y: S.year, t: `Você renunciou ao cargo de ${E.officeDef(S.office.id).name} para concorrer.` });
      S.office = null;
    }
    const used = new Set();
    const pl = {
      id: 'P', name: p.name, ballot: p.ballot, g: p.g, party: p.party, color: party ? party.color : '#22c55e', econ: p.econ, soc: p.soc,
      attrs: p.attrs, isP: true, real: !!p.realId, av: p.av, mom: 0, iss: Object.assign({}, p.issBonus || {}), prom: [], scandal: 0, out: false, fame: p.fame, str: 0.5,
    };
    const camp = {
      oid, sys: o.sys, arena, stage: 'first', week: 1, weeks: 8, energy: 10, maxEnergy: 10, cands: [pl],
      money: 0, promises: [], staff: [], endorse: [], alliances: [], vice: null, polls: [], news: [], debates: [3, 5, 7], debatesDone: [],
      outletUsed: {}, fired: {}, flags: {}, scandal: S.carryScandal || 0, visits: {}, tone: 'propositiva', fatigue: 0, actionsThisWeek: 0, pending: [], partySupport: S.partySupport,
      salBoost: {}, zoneFocus: null, history: [],
    };
    E.S.camp = camp;
    // incumbente?
    const incumbentSelf = S.office && S.office.id === oid;
    if (incumbentSelf) { pl.inc = true; pl.appr = S.office.appr; }
    const D = arena.D;
    const strBase = 0.42 + D * 0.08;
    const exclude = p.party ? [p.party] : [];
    const majorityLike = o.sys === 'majority' || o.sys === 'plurality' || o.sys === 'college';
    // ---- adversários ----
    if (o.primary && party && party.major) {
      camp.stage = 'primary'; camp.weeks = 3; camp.debates = [2];
      const n = clamp(Math.round(1 + D * 0.5 + rnd()), 1, 4);
      for (let i = 0; i < n; i++) camp.cands.push(newAI(o, party, rnd, clamp(strBase + gauss(rnd) * 0.12, 0.2, 1)));
    } else if (o.sys === 'list_closed' || o.sys === 'parliament') {
      const parties = pickParties(o.sys === 'parliament' ? 7 : clamp(Math.round(3 + D), 3, 7), exclude, rnd, { region: arena.region });
      parties.forEach((pt) => camp.cands.push(newAI(o, pt, rnd, clamp(0.3 + pt.size * 0.55 + gauss(rnd) * 0.08, 0.15, 1), { listHead: true })));
    } else if (o.sys === 'internal') {
      const n = randi(2, 3, rnd);
      for (let i = 0; i < n; i++) camp.cands.push(newAI(o, party, rnd, clamp(0.45 + gauss(rnd) * 0.12, 0.2, 0.9)));
      camp.weeks = 5; camp.debates = [3];
    } else if (o.sys === 'list_open') {
      const parties = pickParties(6, [], rnd, { region: arena.region });
      parties.forEach((pt) => camp.cands.push(newAI(o, pt, rnd, clamp(strBase + 0.08 + gauss(rnd) * 0.12, 0.2, 1))));
      camp.debates = [];
    } else {
      let n;
      if (o.arena === 'country') n = country.id === 'US' ? 1 : randi(5, 8, rnd);
      else if (o.arena === 'state') n = randi(3, 6, rnd);
      else n = clamp(Math.round(1.5 + D * 1.2 + rnd() * 1.5), 2, 9);
      let parties;
      if (o.nonpartisan) parties = pickParties(n, [], rnd);
      else if (country.id === 'US') { parties = pickParties(1, exclude, rnd, { majorOnly: true }); if (rnd() < 0.6) parties = parties.concat(pickParties(1, exclude.concat(parties.map((x) => x.id)).concat(['DEM', 'GOP']), rnd)); }
      else parties = pickParties(n, exclude, rnd, { region: arena.region });
      // políticos reais como adversários no cargo máximo
      const reals = o.top ? shuffle(country.real.filter((r) => r.id !== p.realId), rnd) : [];
      // no cargo máximo, garante partidos de políticos reais na disputa
      if (o.top && !o.nonpartisan) reals.forEach((r) => { if (parties.length < n + 2 && r.party !== p.party && !parties.some((x) => x.id === r.party)) { const pt = E.party(r.party); if (pt) parties.push(pt); } });
      parties.forEach((pt, i) => {
        let c;
        const real = reals.find((r) => r.party === pt.id && !camp.cands.some((x) => x.realId === r.id));
        if (real) {
          c = newAI(o, pt, rnd, clamp(0.55 + real.fame / 250, 0.4, 1), { name: real.name, ballot: real.name, av: real.av, g: real.av.g, realId: real.id, real: true, fame: real.fame, attrs: { ...real.attrs } });
        } else c = newAI(o, pt, rnd, clamp(strBase + (pt.size - 0.5) * 0.2 + gauss(rnd) * 0.12, 0.15, 1));
        camp.cands.push(c);
      });
      // incumbente adversário
      if (!incumbentSelf && o.kind === 'exec' && rnd() < 0.4 && camp.cands.length > 1) { const c = camp.cands[1]; c.inc = true; c.appr = randi(32, 68, rnd); c.str = clamp(c.str + 0.1, 0, 1); }
    }
    // IA se posiciona estrategicamente perto do eleitor mediano e faz promessas
    const medE = U.sum(arena.zones, (z) => z.econ * z.share), medS = U.sum(arena.zones, (z) => z.soc * z.share);
    const plist = K.PROMISES[o.scope] || [];
    camp.cands.forEach((c) => {
      if (c.isP) return;
      c.econ = U.lerp(c.econ, medE, 0.3); c.soc = U.lerp(c.soc, medS, 0.3);
      c.prom = plist.slice().sort((x, y) => Math.hypot(x.e - c.econ, x.s - c.soc) - Math.hypot(y.e - c.econ, y.s - c.soc)).slice(0, 2 + (rnd() < 0.5 ? 1 : 0)).map((x) => x.id);
      c.prom.forEach((pid) => { const pr = E.promiseDef(pid); c.iss[pr.topic] = clamp((c.iss[pr.topic] || 0) + 0.2, 0, 1); });
    });
    // números de urna
    camp.cands.forEach((c) => { const pt = E.party(c.party); c.num = ballotNumber(pt, o.digits || 2, rnd, used); if (!c.color) c.color = pt ? pt.color : '#94a3b8'; });
    // cores distintas entre candidatos do mesmo partido
    const seen = {}; camp.cands.forEach((c) => { if (seen[c.color]) c.color = U.mix(c.color, seen[c.color] % 2 ? '#ffffff' : '#000000', 0.35 + 0.1 * seen[c.color]); seen[c.color] = (seen[c.color] || 0) + 1; });
    // ---- conhecimento inicial ----
    const homeCity = p.home ? E.findCity(p.home) : null;
    camp.cands.forEach((c) => {
      arena.zones.forEach((z) => {
        let aw;
        if (c.isP) {
          aw = 0.03 + (p.fame / 100) * 0.75 * (o.arena === 'city' || o.arena === 'district' ? 1 : 0.9);
          if (homeCity && (arena.cityId === homeCity.id || (o.arena !== 'city' && homeCity.region === arena.region))) aw += 0.22 * (1 - D / 5.5);
          if (homeCity && o.arena === 'state' && S.country === 'BR' && String(homeCity.ri) === z.id) aw += 0.15;
          if (p.prof === 'comunitario' && arena.cityId === (homeCity && homeCity.id)) aw += 0.08;
          if (incumbentSelf) aw = Math.max(aw, 0.8);
          if (o.sys === 'internal') aw = 0.5 + p.fame / 250;
        } else if (c.real) aw = 0.15 + (c.fame / 100) * 0.8;
        else {
          aw = 0.06 + 0.55 * c.str * (1.15 - D / 8) + rand(0, 0.08, rnd);
          if (c.inc) aw = Math.max(aw, 0.82);
          if (o.sys === 'internal') aw = 0.35 + c.str * 0.4;
        }
        z.aw[c.id] = clamp(aw * (0.85 + rnd() * 0.3), 0.01, 0.97); z.mo[c.id] = 0;
      });
    });
    // ---- tamanho do "resto" em eleições proporcionais abertas ----
    if (o.sys === 'list_open') {
      const nParties = clamp(Math.round(5 + D * 2.5), 5, 22);
      camp.pool = { N: Math.round(arena.seats * (nParties / 1.3)), w: 0.3 + 0.07 * D };
      camp.nParties = nParties;
    }
    // ---- dinheiro ----
    const unit = arena.cost;
    const priority = majorityLike ? 0.4 + 0.6 * Math.min(1, p.fame / 60) : 0.35 + 0.4 * Math.min(1, p.fame / 50);
    const fund = party ? unit * (6 + 28 * party.size * priority) * (0.6 + S.partySupport / 120) : unit * 2;
    const own = Math.min(p.money * 0.5, unit * 25);
    p.money -= own; camp.money = Math.round(fund + own);
    camp.fundParty = Math.round(fund); camp.fundOwn = Math.round(own);
    // lista fechada: posição
    if (o.sys === 'list_closed') camp.listPos = clamp(Math.round(1 + (75 - (p.fame * 0.6 + p.attrs.art * 0.4 + S.partySupport * 0.2)) / 12), 1, 8);
    E.recalcTV();
    camp.maxEnergy = 10 + (camp.staff.includes('estrategista') ? 2 : 0); camp.energy = camp.maxEnergy;
    // notícias iniciais
    pushNews(`Começa a corrida para ${o.name} em ${arena.fullName}. ${camp.cands.length} candidaturas na disputa.`, 'Flag');
    if (camp.stage === 'primary') pushNews(`Primárias do ${party.name}: só um nome seguirá para a eleição geral.`, 'Vote');
    if (incumbentSelf) pushNews('Você tenta a reeleição: sua aprovação pesa a favor (ou contra).', 'Crown');
    E.poll(true);
    return camp;
  };

  function pushNews(t, ic = 'Newspaper', kind = '') { const c = E.S.camp; if (!c) return; c.news.unshift({ w: c.week, t, ic, kind }); if (c.news.length > 60) c.news.pop(); }
  E.pushNews = pushNews;

  // ================== Modelo de voto ==================
  const SEG = K.SEGMENTS;
  function segW(seg, z) { const f = SEG[seg]; return f ? clamp(f.w(z), 0, 1.5) : 0; }
  function promCost(c) { return sum(c.prom, (pid) => (E.promiseDef(pid) || { cost: 1 }).cost); }
  E.promiseCap = () => { const o = E.officeDef(E.S.camp.oid); return o.kind === 'exec' ? 8 : 6; };
  E.utility = (c, z) => {
    const camp = E.S.camp;
    const d = Math.hypot(c.econ - z.econ, (c.soc - z.soc) * 0.9);
    let u = -1.45 * d;
    for (const t in c.iss) u += 2.2 * (z.sal[t] || 0) * (camp.salBoost[t] || 1) * c.iss[t];
    for (const pid of c.prom) { const pr = E.promiseDef(pid); if (pr) u += 0.07 * (1 - (Math.abs(pr.e - z.econ) * 0.6 + Math.abs(pr.s - z.soc) * 0.4)); }
    if (!c.isP) u += 0.6 * ((c.str || 0.5) - 0.55);
    u += 0.35 * ((c.attrs.car - 55) / 45);
    u += c.mom + (z.mo[c.id] || 0);
    const pt = E.party(c.party);
    if (pt) u += 0.22 * pt.size * (1 - Math.hypot(pt.e - z.econ, pt.s - z.soc) / 1.4);
    if (c.inc) u += ((c.appr - 50) / 50) * 0.65;
    u -= 0.07 * c.scandal;
    if (c.isP) {
      const p = E.S.player;
      u += 0.25 * ((p.rep - 50) / 50);
      for (const s in p.segBonus || {}) u += p.segBonus[s] * segW(s, z);
      const exc = promCost(c) - E.promiseCap(); if (exc > 0) u -= 0.05 * exc;
    }
    return u;
  };
  // participação (sem nulos/indecisos) em uma região
  E.zoneShares = (z, cands = E.S.camp.cands.filter((c) => !c.out), extraW = 0) => {
    const ws = {}; let tot = extraW;
    for (const c of cands) { const w = (z.aw[c.id] || 0.01) * Math.exp(E.utility(c, z) / TAU); ws[c.id] = w; tot += w; }
    for (const k in ws) ws[k] /= tot;
    return ws;
  };
  E.activeCands = () => E.S.camp.cands.filter((c) => !c.out);
  E.poolW = (z) => { const camp = E.S.camp; return camp.pool ? camp.pool.N * camp.pool.w * 0.8 : 0; };
  // totais agregados (participação de cada candidato no eleitorado que decide)
  E.totals = () => {
    const camp = E.S.camp, cs = E.activeCands(); const tot = {}; cs.forEach((c) => (tot[c.id] = 0));
    let pool = 0;
    for (const z of camp.arena.zones) {
      const pw = E.poolW(z);
      const sh = E.zoneShares(z, cs, pw);
      for (const k in sh) tot[k] += sh[k] * z.share;
      if (pw) pool += (1 - U.sum(Object.values(sh))) * z.share;
    }
    return { tot, pool };
  };
  E.undecided = () => {
    const camp = E.S.camp; const avgAw = U.avg(camp.arena.zones, (z) => Math.max(...E.activeCands().map((c) => z.aw[c.id] || 0)));
    return clamp(0.32 * (1 - (camp.week - 1) / camp.weeks) + 0.04 + 0.25 * (1 - avgAw), 0.04, 0.6);
  };
  E.rankOf = (cid) => { const { tot } = E.totals(); const arr = Object.entries(tot).sort((a, b) => b[1] - a[1]); return 1 + arr.findIndex((x) => x[0] === cid); };

  E.poll = (silent) => {
    const camp = E.S.camp; const { tot, pool } = E.totals();
    const und = E.undecided();
    const moe = camp.staff.includes('pesquisador') ? 0.012 : 0.025;
    const res = {}; let s = 0;
    for (const k in tot) { res[k] = Math.max(0.001, tot[k] + gauss() * moe * 0.5 * (camp.sys === 'list_open' ? 0.2 : 1)); s += res[k]; }
    for (const k in res) res[k] = (res[k] / s) * (1 - und) * (1 - pool);
    const p = { w: camp.week, stage: camp.stage, inst: pick(K.POLLSTERS), res, und, moe, pool: pool * (1 - und) };
    if (camp.sys === 'list_open') p.list = E.listProjection();
    if (camp.sys === 'list_closed' || camp.sys === 'parliament') p.seats = E.seatProjection();
    if (camp.sys === 'college') p.ev = E.collegeProjection();
    camp.polls.push(p);
    if (!silent) {
      const lead = Object.entries(res).sort((a, b) => b[1] - a[1])[0]; const lc = camp.cands.find((c) => c.id === lead[0]);
      pushNews(`${p.inst}: ${lc.isP ? 'você lidera' : lc.ballot + ' lidera'} com ${U.fmtPct(lead[1] / (1 - und), 0)} dos votos válidos.`, 'ChartColumn', 'poll');
    }
    return p;
  };

  // ================== Ações de campanha ==================
  const reach = (z) => clamp(Math.pow(12000 / z.pop, 0.42), 0.04, 1.3);
  E.mediaScale = () => clamp(Math.pow(150000 / E.S.camp.arena.elec, 0.25), 0.22, 1.2);
  const P = () => E.S.camp.cands.find((c) => c.isP);
  const staffHas = (id) => E.S.camp.staff.includes(id);
  function addAw(z, cid, amt) { const a = z.aw[cid] || 0; z.aw[cid] = clamp(a + amt * (1 - a), 0, 0.98); return z.aw[cid] - a; }
  function addMo(z, cid, amt) { z.mo[cid] = clamp((z.mo[cid] || 0) + amt, -0.7, 0.7); }
  function allZones(fn) { E.S.camp.arena.zones.forEach(fn); }
  function segBoost(seg, k = 1) { allZones((z) => { for (const s in seg) addMo(z, 'P', seg[s] * segW(s, z) * k); }); }
  E.segBoost = segBoost;
  function visitsFactor(zid) { const v = E.S.camp.visits[zid] || 0; return 1 / (1 + 0.22 * v); }
  const cost = (u) => Math.round(u * E.S.camp.arena.cost);
  E.cost = cost;

  E.ACTIONS = {
    visitar: { n: 'Visitar', cat: 'rua', ic: 'MapPin', en: 2, cu: 0.5, zone: true, d: 'Conversar com moradores e comerciantes.' },
    caminhada: { n: 'Caminhada', cat: 'rua', ic: 'Footprints', en: 3, cu: 1.5, zone: true, d: 'Corpo a corpo com a militância.' },
    comicio: { n: 'Comício', cat: 'rua', ic: 'Megaphone', en: 4, cu: 6, zone: true, d: 'Grande ato com discurso (mini-game).' },
    carreata: { n: 'Carreata', cat: 'rua', ic: 'Car', en: 3, cu: 4, zone: true, d: 'Atinge a região e as vizinhas.' },
    panfletagem: { n: 'Panfletagem', cat: 'rua', ic: 'FileText', en: 1, cu: 2.5, zone: true, d: 'Material impresso e santinhos.' },
    post: { n: 'Post nas redes', cat: 'midia', ic: 'Smartphone', en: 1, cu: 0, d: 'Rápido e barato. Pode viralizar.' },
    video: { n: 'Vídeo curto', cat: 'midia', ic: 'Camera', en: 2, cu: 1, d: 'Maior chance de viralizar.' },
    live: { n: 'Live', cat: 'midia', ic: 'Radio', en: 2, cu: 0, d: 'Fideliza quem já te conhece.' },
    impulsionar: { n: 'Impulsionar conteúdo', cat: 'midia', ic: 'TrendingUp', en: 0, cu: 5, d: 'Anúncios pagos nas redes.' },
    tvad: { n: 'Comercial de TV', cat: 'midia', ic: 'Tv', en: 1, cu: 12, d: 'Anúncio pago em horário nobre.', only: (c) => !co().tvFree },
    entrevista: { n: 'Entrevistas e podcasts', cat: 'midia', ic: 'Podcast', en: 0, cu: 0, outlet: true, d: 'Escolha um veículo (mini-game).' },
    promessa: { n: 'Promessas', cat: 'politica', ic: 'ScrollText', en: 0, cu: 0, panel: 'promises', d: 'Defina compromissos de campanha.' },
    apoio: { n: 'Buscar apoios', cat: 'politica', ic: 'Handshake', en: 2, cu: 0, panel: 'endorse', d: 'Lideranças, sindicatos, igrejas...' },
    alianca: { n: 'Alianças partidárias', cat: 'politica', ic: 'Users', en: 2, cu: 0, panel: 'alliance', d: 'Coligação: tempo de TV e recursos.' },
    vice: { n: 'Escolher vice', cat: 'politica', ic: 'UserPlus', en: 1, cu: 0, panel: 'vice', d: 'Um vice que complemente você.', only: (c) => !!E.officeDef(c.oid).vice && !c.vice },
    atacar: { n: 'Atacar adversário', cat: 'politica', ic: 'Swords', en: 2, cu: 0, panel: 'attack', d: 'Arriscado, mas pode virar o jogo.' },
    articular: { n: 'Articulação interna', cat: 'politica', ic: 'Network', en: 2, cu: 0, d: '+Apoio no partido (+verba).' },
    pesquisa: { n: 'Pesquisa interna', cat: 'politica', ic: 'ChartPie', en: 0, cu: 2, d: 'Raio-x detalhado do eleitorado.' },
    jantar: { n: 'Jantar de arrecadação', cat: 'financas', ic: 'HandCoins', en: 2, cu: 0, d: 'Doações de apoiadores de alta renda.' },
    vaquinha: { n: 'Vaquinha online', cat: 'financas', ic: 'PiggyBank', en: 1, cu: 0, d: 'Pequenas doações de muitos eleitores.' },
    fundo: { n: 'Pedir verba ao partido', cat: 'financas', ic: 'Landmark', en: 1, cu: 0, d: 'Uma vez por campanha.', only: (c) => !c.flags.fundo },
    estudar: { n: 'Estudar temas', cat: 'preparo', ic: 'BookOpen', en: 2, cu: 0, d: '+Inteligência e preparo para debates.' },
    oratoria: { n: 'Treino de oratória', cat: 'preparo', ic: 'MicVocal', en: 2, cu: 0, d: '+Oratória.' },
    descansar: { n: 'Descansar', cat: 'preparo', ic: 'Coffee', en: 0, cu: 0, d: 'Usa a energia restante e evita exaustão.' },
  };
  E.actionAvailable = (id) => {
    const camp = E.S.camp, a = E.ACTIONS[id];
    if (a.only && !a.only(camp)) return false;
    if (id === 'alianca' && (camp.stage === 'primary' || camp.sys === 'internal' || (co().noLegCoalition && (camp.sys === 'list_open')))) return false;
    if (camp.sys === 'internal' && ['carreata', 'panfletagem', 'tvad', 'impulsionar'].includes(id)) return false;
    return true;
  };
  E.canAfford = (id) => { const camp = E.S.camp, a = E.ACTIONS[id]; return camp.energy >= a.en && camp.money >= cost(a.cu); };

  // retorna {ok, fx:[{t, good}], msg}
  E.doAction = (id, args = {}) => {
    const S = E.S, camp = S.camp, a = E.ACTIONS[id], pc = P(), p = S.player;
    if (!E.canAfford(id)) return { ok: false, msg: camp.energy < a.en ? 'Energia insuficiente nesta semana.' : 'Dinheiro insuficiente.' };
    const fx = [];
    const spend = () => { camp.energy -= a.en; camp.money -= cost(a.cu); camp.actionsThisWeek++; };
    const z = args.zone ? camp.arena.zones.find((x) => x.id === args.zone) : null;
    const campo = staffHas('campo') ? 1.35 : 1, mkt = staffHas('marqueteiro') ? 1.35 : 1, soc = (staffHas('social') ? 1.6 : 1) * (p.prof === 'influencer' ? 1.5 : 1);
    const car = p.attrs.car / 100, ora = p.attrs.ora / 100;
    const awDelta = (zz, amt) => addAw(zz, 'P', amt);
    switch (id) {
      case 'visitar': case 'caminhada': case 'panfletagem': {
        spend(); const r = reach(z) * visitsFactor(z.id) * campo;
        const k = { visitar: [0.17, 0.05], caminhada: [0.24, 0.07], panfletagem: [0.13, 0.015] }[id];
        const d = awDelta(z, k[0] * r);
        addMo(z, 'P', k[1] * r * (0.55 + car));
        camp.visits[z.id] = (camp.visits[z.id] || 0) + 1;
        fx.push({ t: `+${(d * 100).toFixed(1)} pts de conhecimento em ${z.n}`, good: true });
        if (k[1] > 0.02) fx.push({ t: `Simpatia em alta em ${z.n}`, good: true });
        if (id === 'caminhada' && U.chance(0.1)) { camp.pending.push({ id: 'moradores', zone: z.id }); }
        break;
      }
      case 'comicio': {
        spend(); const q = args.quality ?? 1; const r = Math.pow(reach(z), 0.75) * visitsFactor(z.id) * campo;
        const sh = E.zoneShares(z)['P'] || 0;
        if (sh < 0.07 && (z.aw.P || 0) < 0.3 && U.chance(0.3)) {
          addMo(z, 'P', -0.04); pc.mom -= 0.02;
          fx.push({ t: 'Comício esvaziado! A imprensa registrou as cadeiras vazias.', good: false }); pushNews(`Comício de ${pc.ballot} em ${z.n} tem baixa adesão.`, 'TrendingDown');
        } else {
          const d = awDelta(z, 0.22 * r * (0.7 + q * 0.3));
          addMo(z, 'P', 0.11 * r * (0.4 + ora) * q); pc.mom += 0.008 * q;
          const crowd = Math.round(z.pop * clamp(0.004 + sh * 0.05, 0.002, 0.08) * q);
          fx.push({ t: `${U.fmtInt(crowd)} pessoas no comício em ${z.n}`, good: true }, { t: `+${(d * 100).toFixed(1)} pts de conhecimento`, good: true });
          pushNews(`${pc.ballot} reúne ${U.fmtInt(crowd)} pessoas em comício em ${z.n}.`, 'Megaphone');
        }
        camp.visits[z.id] = (camp.visits[z.id] || 0) + 1;
        break;
      }
      case 'carreata': {
        spend();
        const near = camp.arena.zones.slice().sort((x, y) => Math.hypot(x.lx - z.lx, x.ly - z.ly) - Math.hypot(y.lx - z.lx, y.ly - z.ly)).slice(0, 3);
        near.forEach((zz) => { awDelta(zz, 0.11 * reach(zz) * campo); addMo(zz, 'P', 0.04 * reach(zz) * campo); });
        fx.push({ t: `Carreata passou por ${near.map((x) => x.n).join(', ')}`, good: true });
        break;
      }
      case 'post': case 'video': case 'live': case 'impulsionar': case 'tvad': {
        spend();
        const base = { post: 0.022, video: 0.035, live: 0.018, impulsionar: 0.05, tvad: 0.085 }[id] * (id === 'tvad' ? mkt : id === 'impulsionar' ? 1 : soc);
        const mo = { post: 0.003, video: 0.005, live: 0.01, impulsionar: 0.006, tvad: 0.02 }[id] * (id === 'tvad' ? mkt : 1);
        let viral = false;
        if ((id === 'post' && U.chance(0.05 + car * 0.05)) || (id === 'video' && U.chance(0.09 + car * 0.1))) viral = true;
        const mult = viral ? 3 : 1; const ms = E.mediaScale();
        let tot = 0;
        allZones((zz) => {
          const yw = id === 'tvad' ? 1 : 0.6 + zz.young * 1.4;
          tot += awDelta(zz, base * yw * mult * ms) * zz.share;
        });
        pc.mom = clamp(pc.mom + mo * mult * (id === 'live' ? 0.5 + U.avg(camp.arena.zones, (zz) => zz.aw.P || 0) : 1), -0.6, 0.6);
        fx.push({ t: `+${(tot * 100).toFixed(1)} pts de conhecimento geral`, good: true });
        if (viral) { fx.unshift({ t: 'VIRALIZOU! Milhões de visualizações.', good: true, big: true }); pushNews(`Vídeo de ${pc.ballot} viraliza nas redes.`, 'Flame'); }
        break;
      }
      case 'articular': {
        spend(); const g = Math.round(6 + p.attrs.art / 12 + rand(0, 4)); camp.partySupport = clamp(camp.partySupport + g, 0, 100); S.partySupport = camp.partySupport;
        fx.push({ t: `+${g} de apoio interno no partido`, good: true });
        if (camp.sys === 'list_closed' && camp.listPos > 1 && U.chance(0.35)) { camp.listPos--; fx.push({ t: `Você subiu para a posição ${camp.listPos} da lista!`, good: true, big: true }); }
        p.attrs.art = clamp(p.attrs.art + 1, 0, 99);
        break;
      }
      case 'pesquisa': { spend(); camp.flags.internal = camp.week; fx.push({ t: 'Pesquisa interna detalhada disponível no painel.', good: true }); break; }
      case 'jantar': {
        spend(); const share = (E.totals().tot.P || 0);
        const g = cost(3 + p.fame / 12 + 8 * share) * (staffHas('captador') ? 1.6 : 1) * (p.prof === 'empresario' ? 1.4 : 1);
        camp.money += Math.round(g); segBoost({ ricos: 0.02, pobres: -0.01 });
        fx.push({ t: `+${E.fmtMoney(g)} arrecadados`, good: true, money: true });
        break;
      }
      case 'vaquinha': {
        spend(); const aw = U.avg(camp.arena.zones, (zz) => zz.aw.P || 0);
        const g = cost(1 + aw * 6) * (staffHas('captador') ? 1.6 : 1) * (p.prof === 'influencer' ? 1.5 : 1);
        camp.money += Math.round(g); fx.push({ t: `+${E.fmtMoney(g)} em pequenas doações`, good: true, money: true });
        break;
      }
      case 'fundo': {
        spend(); camp.flags.fundo = true; const pt = E.playerParty();
        const ok = U.chance(0.35 + camp.partySupport / 160);
        if (ok && pt) { const g = cost(4 + 14 * pt.size * (camp.partySupport / 100)); camp.money += g; fx.push({ t: `O partido liberou ${E.fmtMoney(g)}`, good: true, money: true }); }
        else fx.push({ t: 'O partido negou mais verba. Aumente seu apoio interno.', good: false });
        break;
      }
      case 'estudar': { spend(); p.attrs.int = clamp(p.attrs.int + 2, 0, 99); camp.flags.prep = (camp.flags.prep || 0) + 1; fx.push({ t: '+2 Inteligência · preparo para debate', good: true }); break; }
      case 'oratoria': { spend(); p.attrs.ora = clamp(p.attrs.ora + 2, 0, 99); fx.push({ t: '+2 Oratória', good: true }); break; }
      case 'descansar': { camp.flags.rested = true; camp.energy = 0; camp.fatigue = 0; fx.push({ t: 'Você descansou. Próxima semana com energia extra.', good: true }); break; }
      default: return { ok: false, msg: 'Ação desconhecida' };
    }
    return { ok: true, fx };
  };

  // ---- promessas ----
  E.promiseDef = (pid) => { for (const sc in K.PROMISES) { const f = K.PROMISES[sc].find((x) => x.id === pid); if (f) return f; } return null; };
  E.promiseList = () => K.PROMISES[E.officeDef(E.S.camp.oid).scope];
  E.togglePromise = (pid) => {
    const camp = E.S.camp, pc = P(), pr = E.promiseDef(pid);
    if (camp.promises.includes(pid)) {
      camp.promises = camp.promises.filter((x) => x !== pid); pc.prom = camp.promises.slice();
      pc.iss[pr.topic] = clamp((pc.iss[pr.topic] || 0) - 0.3, 0, 1);
      if (camp.week > 1) { E.S.player.rep = clamp(E.S.player.rep - 2, 0, 100); return { ok: true, fx: [{ t: 'Recuo em promessa: −2 reputação', good: false }] }; }
      return { ok: true, fx: [] };
    }
    if (camp.promises.length >= K.MAX_PROMISES) return { ok: false, msg: `Máximo de ${K.MAX_PROMISES} promessas.` };
    camp.promises.push(pid); pc.prom = camp.promises.slice();
    pc.iss[pr.topic] = clamp((pc.iss[pr.topic] || 0) + 0.3, 0, 1);
    pushNews(`${pc.ballot} promete: “${pr.t}”.`, 'ScrollText');
    const exc = promCost(pc) - E.promiseCap();
    return { ok: true, fx: [{ t: `Compromisso assumido: ${pr.t}`, good: true }].concat(exc > 0 ? [{ t: 'Atenção: promessas acima do orçamento reduzem a credibilidade', good: false }] : []) };
  };
  E.promiseCost = () => promCost(P());

  // ---- apoios ----
  E.endorseChance = (eid) => {
    const camp = E.S.camp, en = K.ENDORSE.find((x) => x.id === eid), p = E.S.player;
    const share = E.totals().tot.P || 0;
    return clamp(0.18 + 0.55 * en.fit(p) + 0.2 * ((p.attrs.art - 50) / 50) + share * 0.6, 0.05, 0.95);
  };
  E.seekEndorse = (eid) => {
    const camp = E.S.camp, en = K.ENDORSE.find((x) => x.id === eid);
    if (camp.energy < 2) return { ok: false, msg: 'Energia insuficiente.' };
    camp.energy -= 2;
    if (!U.chance(E.endorseChance(eid))) { camp.flags['tried_' + eid] = camp.week; return { ok: true, fail: true, fx: [{ t: `${en.n}: “não desta vez”.`, good: false }] }; }
    camp.endorse.push(eid); segBoost(en.seg);
    if (en.money) camp.money += cost(en.money);
    if (en.aw) allZones((z) => addAw(z, 'P', en.aw));
    if (en.issue) for (const t in en.issue) P().iss[t] = clamp((P().iss[t] || 0) + en.issue[t], 0, 1);
    pushNews(`${en.n} declaram apoio a ${P().ballot}.`, en.ic);
    return { ok: true, fx: [{ t: `${en.n} estão com você!`, good: true, big: true }].concat(en.money ? [{ t: `+${E.fmtMoney(cost(en.money))}`, good: true, money: true }] : []) };
  };

  // ---- alianças ----
  E.recalcTV = () => {
    const camp = E.S.camp; const act = E.activeCands();
    const w = {}; let tot = 0;
    act.forEach((c) => { let s = 0.08; const pt = E.party(c.party); if (pt) s += pt.size; if (c.isP) camp.alliances.forEach((pid) => (s += E.party(pid).size * 0.9)); else if (c.str > 0.6) s *= 1.3; w[c.id] = s; tot += s; });
    act.forEach((c) => (c.tv = w[c.id] / tot));
  };
  E.allianceInfo = (pid) => {
    const camp = E.S.camp, pt = E.party(pid), p = E.S.player;
    const dist = Math.hypot(pt.e - p.econ, pt.s - p.soc);
    const myShare = E.totals().tot.P || 0;
    const theirCand = E.activeCands().find((c) => c.party === pid && !c.isP);
    const theirShare = theirCand ? E.totals().tot[theirCand.id] : 0;
    let ch = 0.75 - dist * 0.45 + myShare * 1.2 + (p.attrs.art - 50) / 200;
    if (theirCand) ch = theirShare > myShare * 0.7 ? 0.03 : ch - 0.2 + (myShare - theirShare) * 1.5;
    return { pt, dist, chance: clamp(ch, 0.02, 0.95), theirCand, warn: dist > 0.9 };
  };
  E.proposeAlliance = (pid) => {
    const camp = E.S.camp; if (camp.energy < 2) return { ok: false, msg: 'Energia insuficiente.' };
    camp.energy -= 2;
    const info = E.allianceInfo(pid); const pt = info.pt;
    if (!U.chance(info.chance)) { camp.flags['al_' + pid] = camp.week; return { ok: true, fail: true, fx: [{ t: `O ${pt.id} recusou a aliança.`, good: false }] }; }
    camp.alliances.push(pid);
    const fx = [{ t: `Aliança fechada com o ${pt.id}!`, good: true, big: true }];
    const g = cost(3 + pt.size * 10); camp.money += g; fx.push({ t: `+${E.fmtMoney(g)} e mais tempo de TV`, good: true, money: true });
    allZones((z) => addMo(z, 'P', 0.07 * pt.size * (1 - Math.hypot(pt.e - z.econ, pt.s - z.soc) / 1.5)));
    if (info.warn) { E.S.player.rep = clamp(E.S.player.rep - 3, 0, 100); allZones((z) => { const dz = Math.hypot(E.S.player.econ - z.econ, E.S.player.soc - z.soc); if (dz < 0.5) addMo(z, 'P', -0.04); }); fx.push({ t: 'Parte da sua base criticou a aliança (−3 reputação)', good: false }); }
    if (info.theirCand) {
      const tc = info.theirCand; tc.out = true;
      allZones((z) => { const sh = E.zoneShares(z, E.activeCands().concat([tc]))[tc.id] || 0; addMo(z, 'P', sh * 0.6); addAw(z, 'P', 0.04); });
      pushNews(`${tc.ballot} retira a candidatura e apoia ${P().ballot}.`, 'Handshake', 'big');
      fx.push({ t: `${tc.ballot} desistiu e agora apoia você!`, good: true, big: true });
    } else pushNews(`${pt.id} fecha aliança com ${P().ballot}.`, 'Handshake');
    E.recalcTV();
    return { ok: true, fx };
  };

  // ---- vice ----
  E.viceOptions = () => {
    const camp = E.S.camp; const rnd = U.rng(E.S.seed + camp.week * 13 + 7);
    const pool = [E.S.player.party].concat(camp.alliances);
    const types = [
      { k: 'Empresário(a) do interior', seg: { ricos: 0.06, rurais: 0.06 } }, { k: 'Líder religioso(a)', seg: { religiosos: 0.09 } },
      { k: 'Professor(a) universitário(a)', seg: { jovens: 0.06, progressistas: 0.05 } }, { k: 'Ex-policial', seg: { conservadores: 0.08 } },
      { k: 'Liderança popular', seg: { pobres: 0.08 } }, { k: 'Economista respeitado(a)', seg: { ricos: 0.05, direita: 0.04 } }, { k: 'Ex-sindicalista', seg: { esquerda: 0.07, pobres: 0.03 } },
    ];
    return shuffle(types, rnd).slice(0, 3).map((t) => { const g = rnd() < 0.5 ? 'm' : 'f'; const nm = genName(rnd, g, false); const party = pick(pool, rnd); return { name: nm.name, party, g, av: Avatar.random(rnd, { g }), type: t.k, seg: t.seg }; });
  };
  E.chooseVice = (v) => { const camp = E.S.camp; if (camp.energy < 1) return { ok: false, msg: 'Energia insuficiente.' }; camp.energy -= 1; camp.vice = v; segBoost(v.seg); pushNews(`${P().ballot} anuncia ${v.name} (${v.party}) como vice.`, 'UserPlus'); return { ok: true, fx: [{ t: `${v.name} é seu vice!`, good: true, big: true }] }; };

  // ---- ataques ----
  E.attack = (cid, tone) => {
    const camp = E.S.camp; if (camp.energy < 2) return { ok: false, msg: 'Energia insuficiente.' };
    camp.energy -= 2;
    const t = E.activeCands().find((c) => c.id === cid); const pc = P(); const p = E.S.player;
    const k = { propostas: [0.05, 0, 0], historico: [0.08, 0.012, 1], pessoal: [0.12, 0.04, 4] }[tone];
    const power = 0.7 + p.attrs.ora / 140 + (staffHas('marqueteiro') ? 0.15 : 0);
    const fx = [];
    if (tone === 'pessoal' && U.chance(0.28)) { pc.mom -= 0.07; p.rep = clamp(p.rep - 5, 0, 100); fx.push({ t: 'O ataque pegou mal e virou contra você!', good: false, big: true }); pushNews(`Ataque de ${pc.ballot} a ${t.ballot} repercute mal.`, 'TrendingDown'); return { ok: true, fx }; }
    t.mom -= k[0] * power; pc.mom -= k[1]; p.rep = clamp(p.rep - k[2], 0, 100);
    fx.push({ t: `${t.ballot} perdeu força`, good: true });
    if (k[2]) fx.push({ t: `−${k[2]} reputação`, good: false });
    pushNews(`${pc.ballot} critica ${t.ballot} ${tone === 'propostas' ? 'pelas propostas' : tone === 'historico' ? 'pelo histórico' : 'em tom pessoal'}.`, 'Swords');
    return { ok: true, fx };
  };

  // ---- equipe ----
  E.hire = (sid) => {
    const camp = E.S.camp, s = K.STAFF.find((x) => x.id === sid);
    if (camp.staff.includes(sid)) { camp.staff = camp.staff.filter((x) => x !== sid); if (sid === 'estrategista') camp.maxEnergy -= 2; return { ok: true, fx: [{ t: `${s.n} dispensado(a)`, good: false }] }; }
    if (camp.money < cost(s.cost)) return { ok: false, msg: 'Dinheiro insuficiente.' };
    camp.money -= cost(s.cost); camp.staff.push(sid);
    if (sid === 'estrategista') { camp.maxEnergy += 2; camp.energy += 2; }
    return { ok: true, fx: [{ t: `${s.n} contratado(a)!`, good: true }] };
  };
  E.weeklyCost = () => sum(E.S.camp.staff, (sid) => cost(K.STAFF.find((x) => x.id === sid).cost));

  // ================== Mídia: entrevistas, debates, discursos ==================
  E.outlets = () => {
    const camp = E.S.camp, o = E.officeDef(camp.oid);
    return K.OUTLETS.filter((x) => !(x.minLevel && o.level < x.minLevel && camp.arena.type !== 'country' && camp.arena.type !== 'state') && !(x.nat === false && camp.arena.type === 'country'));
  };
  E.outletCooldown = (oid) => { const w = E.S.camp.outletUsed[oid]; return w && E.S.camp.week - w < 2; };
  E.questionsFor = (outlet, n = 3) => {
    const camp = E.S.camp; const sal = {}; camp.arena.zones.forEach((z) => { for (const t in z.sal) sal[t] = (sal[t] || 0) + z.sal[t] * z.share; });
    const qs = shuffle(K.QUESTIONS).sort((a, b) => (sal[b.topic] || 0) * (0.5 + Math.random()) - (sal[a.topic] || 0) * (0.5 + Math.random()));
    const out = []; const topics = new Set();
    for (const q of qs) { if (out.length >= n) break; if (topics.has(q.topic) && out.length < n - 1) continue; topics.add(q.topic); out.push(q); }
    return out;
  };
  // avalia uma resposta
  E.scoreAnswer = (ans, lean, diff = 0.5) => {
    const p = E.S.player;
    const pos = ans.e == null ? [p.econ * 0.3, p.soc * 0.3] : [ans.e, ans.s];
    const consist = ans.e == null ? 0.45 : 1 - Math.hypot(pos[0] - p.econ, pos[1] - p.soc) / 2.2;
    const fit = ans.e == null ? 0.45 : 1 - Math.hypot(pos[0] - lean[0], pos[1] - lean[1]) / 2.2;
    const perf = (p.attrs.ora * 0.55 + p.attrs.int * 0.45) / 100 + (staffHas('imprensa') ? 0.12 : 0) + (p.prof === 'jornalista' ? 0.15 : 0) - diff * 0.25 + rand(-0.18, 0.18);
    let score = 0.38 * consist + 0.27 * fit + 0.35 * clamp(perf, 0, 1);
    let gaffe = false, viral = false;
    if (ans.tone === 'evasivo') score = Math.min(score, 0.45);
    if (ans.tone === 'polemico') { if (U.chance(0.35 - p.attrs.ora / 400)) { gaffe = true; score -= 0.25; } else { viral = true; score += 0.1; } }
    if (ans.tone === 'firme') score += 0.04;
    return { score: clamp(score, 0, 1), consist, fit, gaffe, viral, pos };
  };
  E.applyInterview = (outlet, results) => {
    const camp = E.S.camp, pc = P();
    camp.energy -= outlet.energy; camp.outletUsed[outlet.id] = camp.week;
    camp.outletCount = camp.outletCount || {}; const dim = 1 / (1 + 0.4 * (camp.outletCount[outlet.id] || 0)); camp.outletCount[outlet.id] = (camp.outletCount[outlet.id] || 0) + 1;
    const avg = U.avg(results, (r) => r.score);
    const polar = results.filter((r) => r.viral || r.gaffe).length;
    const mkt = staffHas('marqueteiro') ? 1.2 : 1;
    const local = camp.arena.type === 'country' ? 1 : outlet.nat ? 0.7 : 1;
    let awT = 0;
    allZones((z) => {
      const yw = 0.4 + z.young * outlet.young * 2;
      awT += addAw(z, 'P', outlet.reach * 0.75 * dim * local * yw * mkt * E.mediaScale()) * z.share;
      const zfit = 1 - Math.hypot(outlet.lean[0] - z.econ, outlet.lean[1] - z.soc) / 2.2;
      addMo(z, 'P', (avg - 0.5) * 0.05 * dim * zfit);
      results.forEach((r) => { if (r.viral || r.gaffe) { const al = 1 - Math.hypot(r.pos[0] - z.econ, r.pos[1] - z.soc) / 1.2; addMo(z, 'P', (r.viral ? 0.03 : -0.03) * al); } });
    });
    pc.mom = clamp(pc.mom + (avg - 0.5) * 0.16 * dim * mkt * Math.min(1.2, outlet.reach * 7), -0.6, 0.6);
    const fx = [{ t: `Desempenho: ${Math.round(avg * 100)}/100`, good: avg >= 0.5, big: true }, { t: `+${(awT * 100).toFixed(1)} pts de conhecimento`, good: true }];
    if (polar) fx.push({ t: 'Respostas polêmicas dividiram o público', good: false });
    pushNews(`${pc.ballot} ${avg >= 0.62 ? 'brilha' : avg >= 0.45 ? 'participa' : 'tropeça'} no ${outlet.n}.`, outlet.ic);
    E.S.player.fame = clamp(E.S.player.fame + outlet.reach * 4 * (avg + 0.3), 0, 100);
    return { ok: true, fx, avg };
  };
  E.applyDebate = (score, perCand) => {
    const camp = E.S.camp, pc = P();
    camp.debatesDone.push(camp.week); camp.energy = Math.max(0, camp.energy - 3);
    const mkt = staffHas('imprensa') ? 1.15 : 1;
    allZones((z) => addAw(z, 'P', 0.06 * (0.6 + 0.4 * E.mediaScale()))); pc.mom = clamp(pc.mom + (score - 0.5) * 0.22 * mkt, -0.6, 0.6);
    for (const cid in perCand) { const c = camp.cands.find((x) => x.id === cid); if (c && !c.isP) c.mom += (perCand[cid] - 0.5) * 0.2; }
    const winner = Object.entries(Object.assign({ P: score }, perCand)).sort((a, b) => b[1] - a[1])[0][0];
    const wc = camp.cands.find((c) => c.id === winner);
    pushNews(`Debate: ${wc.isP ? 'você foi' : wc.ballot + ' foi'} considerado(a) vencedor(a) pelo público.`, 'Tv', 'big');
    E.S.player.fame = clamp(E.S.player.fame + 1 + score * 3, 0, 100);
    return { ok: true, winner, fx: [{ t: winner === 'P' ? 'Você venceu o debate!' : `${wc.ballot} venceu o debate`, good: winner === 'P', big: true }] };
  };
  E.skipDebate = () => {
    const camp = E.S.camp; camp.debatesDone.push(camp.week); P().mom -= 0.08;
    pushNews(`Cadeira vazia: ${P().ballot} falta ao debate e é criticado(a).`, 'Tv');
  };
  E.speechLines = (zid) => {
    const camp = E.S.camp, z = camp.arena.zones.find((x) => x.id === zid);
    const lines = [
      { t: 'Vamos colocar médicos em todos os postos!', topic: 'saude', e: -0.3, s: 0 }, { t: 'Segurança de verdade, com polícia na rua!', topic: 'seguranca', e: 0.3, s: 0.6 },
      { t: 'Escola em tempo integral para nossas crianças!', topic: 'educacao', e: -0.3, s: -0.1 }, { t: 'Menos imposto, mais emprego!', topic: 'impostos', e: 0.7, s: 0.1 },
      { t: 'Ninguém fica sem casa nesta cidade!', topic: 'moradia', e: -0.5, s: 0 }, { t: 'Chega de corrupção e privilégios!', topic: 'corrupcao', e: 0.2, s: 0.1 },
      { t: 'Ônibus de qualidade e mais barato!', topic: 'transporte', e: -0.3, s: 0 }, { t: 'Deus, pátria e família!', topic: 'valores', e: 0.3, s: 0.9 },
      { t: 'Respeito a todas as famílias e diversidade!', topic: 'valores', e: -0.3, s: -0.85 }, { t: 'Natureza preservada, futuro garantido!', topic: 'ambiente', e: -0.3, s: -0.5 },
      { t: 'Emprego e renda para quem precisa!', topic: 'economia', e: -0.4, s: 0 }, { t: 'Liberdade para empreender!', topic: 'economia', e: 0.7, s: 0 },
    ];
    return shuffle(lines).slice(0, 6).map((l) => {
      const fit = 1 - Math.hypot(l.e - z.econ, l.s - z.soc) / 2.2; const sal = z.sal[l.topic] * 10;
      const p = E.S.player; const cons = 1 - Math.hypot(l.e - p.econ, l.s - p.soc) / 2.2;
      return Object.assign(l, { react: clamp(fit * 0.55 + sal * 0.35 + cons * 0.15 + rand(-0.1, 0.1), 0, 1.2) });
    });
  };

  // ================== Fim de semana: IA, eventos, pesquisa ==================
  function aiTurn() {
    const camp = E.S.camp, arena = camp.arena; const act = E.activeCands();
    const { tot } = E.totals(); const ranking = Object.entries(tot).sort((a, b) => b[1] - a[1]);
    const leaderId = ranking[0][0];
    const diff = 0.85 + arena.D * 0.08;
    act.forEach((c) => {
      if (c.isP) return;
      const pw = c.str * (0.7 + Math.random() * 0.6) * diff;
      arena.zones.forEach((z) => { addAw(z, c.id, 0.055 * pw * (0.6 + 0.4 * Math.max(reach(z), 0.3)) * (0.6 + Math.random() * 0.8)); });
      for (let k = 0; k < 3; k++) {
        const z = wpick(arena.zones, (zz) => zz.share * (1.1 - (zz.aw[c.id] || 0)));
        addAw(z, c.id, 0.12 * pw * reach(z)); addMo(z, c.id, 0.06 * pw * reach(z));
      }
      c.mom += 0.045 * pw + gauss() * 0.02;
      const rk = 1 + ranking.findIndex((x) => x[0] === c.id);
      if (rk > 1 && rk <= 3 && tot[leaderId] - tot[c.id] < 0.15 && Math.random() < 0.28 * c.aggr) {
        const L = camp.cands.find((x) => x.id === leaderId);
        L.mom -= 0.045 * pw; c.mom -= 0.008;
        if (L.isP) { pushNews(`${c.ballot} ataca você na propaganda.`, 'Swords'); if (Math.random() < 0.5) camp.pending.push({ id: 'ataque', opp: c.id }); }
        else pushNews(`${c.ballot} ataca ${L.ballot}.`, 'Swords');
      }
      if (camp.sys === 'majority' || camp.sys === 'plurality') {
        // desistência de nanicos na reta final
        if (camp.week >= camp.weeks - 2 && tot[c.id] < 0.025 && act.length > 3 && Math.random() < 0.12) {
          c.out = true;
          const others = act.filter((x) => x !== c && !x.out);
          const best = others.sort((a, b) => Math.hypot(a.econ - c.econ, a.soc - c.soc) - Math.hypot(b.econ - c.econ, b.soc - c.soc))[0];
          if (best) { best.mom += 0.02; pushNews(`${c.ballot} desiste e declara apoio a ${best.isP ? 'você' : best.ballot}.`, 'UserX', 'big'); }
        }
      }
    });
  }
  function tvWeek() {
    const camp = E.S.camp;
    if (!co().tvFree || camp.week < 3 || camp.sys === 'internal') return;
    const mkt = staffHas('marqueteiro') ? 1.35 : 1;
    E.recalcTV();
    E.activeCands().forEach((c) => {
      const k = c.isP ? mkt : 1;
      allZones((z) => addAw(z, c.id, 0.12 * c.tv * k));
      if (c.isP) {
        if (camp.tone === 'propositiva') c.mom += 0.02 * c.tv * 4;
        if (camp.tone === 'biografia') allZones((z) => addAw(z, 'P', 0.03 * c.tv * 4));
        if (camp.tone === 'ataque') { const { tot } = E.totals(); const lead = Object.entries(tot).filter((x) => x[0] !== 'P').sort((a, b) => b[1] - a[1])[0]; if (lead) { const L = camp.cands.find((x) => x.id === lead[0]); L.mom -= 0.05 * c.tv * 4; c.mom -= 0.006; } }
      }
    });
  }
  function decay() {
    const camp = E.S.camp;
    camp.cands.forEach((c) => (c.mom = clamp(c.mom * 0.92, -0.7, 0.7)));
    allZones((z) => { for (const k in z.mo) z.mo[k] *= 0.9; });
    for (const t in camp.salBoost) camp.salBoost[t] = 1 + (camp.salBoost[t] - 1) * 0.8;
  }

  // contexto para condições de eventos
  function evCtx() {
    const camp = E.S.camp; const { tot } = E.totals();
    return { week: camp.week, total: camp.weeks, rank: E.rankOf('P'), share: tot.P || 0, flags: camp.flags, hasVice: !!camp.vice, promiseCost: E.promiseCost(), arena: camp.arena.type };
  }
  function eventEligible(ev) {
    const camp = E.S.camp;
    if (ev.country && !ev.country.includes(E.S.country)) return false;
    if (ev.arena && !ev.arena.includes(camp.arena.type)) return false;
    if (ev.once && camp.fired[ev.id]) return false;
    if (camp.fired[ev.id] && camp.week - camp.fired[ev.id] < 3) return false;
    if (ev.cond && !ev.cond(evCtx())) return false;
    if (ev.opp && E.activeCands().length < 2) return false;
    return true;
  }
  E.instEvent = (id, extra = {}) => {
    const camp = E.S.camp; const ev = K.EVENTS.find((x) => x.id === id); if (!ev) return null;
    const inst = { ev, ctx: {} };
    if (ev.zone) { const z = extra.zone ? camp.arena.zones.find((x) => x.id === extra.zone) : wpick(camp.arena.zones, (x) => x.share); inst.ctx.zone = z.id; inst.ctx.zoneName = z.n; }
    if (ev.opp) { const opps = E.activeCands().filter((c) => !c.isP); const o = extra.opp ? opps.find((c) => c.id === extra.opp) : wpick(opps, (c) => 0.2 + (E.totals().tot[c.id] || 0)); if (!o) return null; inst.ctx.opp = o.id; inst.ctx.oppName = o.ballot; }
    inst.ctx.party = (E.playerParty() || { id: 'seu partido' }).id;
    inst.ctx.categoria = pick(K.GREVE_CAT);
    camp.fired[ev.id] = camp.week;
    if (ev.sal) for (const t in ev.sal) camp.salBoost[t] = ev.sal[t];
    return inst;
  };
  E.fillText = (s, ctx) => String(s).replace('{zone}', ctx.zoneName || '').replace(/\{zone\}/g, ctx.zoneName || '').replace(/\{opp\}/g, ctx.oppName || '').replace(/\{party\}/g, ctx.party || '').replace(/\{categoria\}/g, ctx.categoria || '');

  E.endWeek = () => {
    const S = E.S, camp = S.camp; const out = { events: [], news: [] };
    // custos semanais
    const wc = E.weeklyCost(); camp.money -= wc;
    if (camp.money < 0) { E.S.player.rep = clamp(E.S.player.rep - 2, 0, 100); camp.staff = camp.staff.slice(0, Math.max(0, camp.staff.length - 1)); pushNews('Campanha no vermelho: fornecedores sem pagamento.', 'TriangleAlert'); camp.money = 0; }
    // doações espontâneas
    const share = E.totals().tot.P || 0;
    const don = cost((0.6 + share * 5 + S.player.fame / 45) * (staffHas('captador') ? 1.6 : 1));
    camp.money += don; out.donations = don;
    aiTurn(); tvWeek(); decay();
    // fadiga
    camp.fatigue = camp.energy <= 0 && !camp.flags.rested ? camp.fatigue + 1 : Math.max(0, camp.fatigue - 1);
    // escândalo: exposição
    if (camp.scandal > 0 && Math.random() < camp.scandal * 0.025 * (staffHas('advogado') ? 0.5 : 1)) {
      const dmg = staffHas('advogado') ? 0.5 : 1;
      P().mom -= 0.16 * dmg; S.player.rep = clamp(S.player.rep - 10 * dmg, 0, 100); P().scandal += 2;
      out.events.push({ special: 'scandal', title: 'Escândalo exposto!', text: 'Uma reportagem revelou irregularidades na sua campanha. Sua imagem foi seriamente abalada.', ic: 'Siren' });
      pushNews(`Escândalo atinge a campanha de ${P().ballot}.`, 'Siren', 'big');
      camp.scandal = Math.max(0, camp.scandal - 3);
    }
    // eventos pendentes + aleatórios
    camp.pending.forEach((pe) => { const i = E.instEvent(pe.id, pe); if (i) out.events.push(i); });
    camp.pending = [];
    const nEv = Math.random() < 0.75 ? 1 : 2;
    for (let k = 0; k < nEv && out.events.length < 2; k++) {
      const pool = K.EVENTS.filter((e) => eventEligible(e) && !out.events.some((x) => x.ev && x.ev.id === e.id));
      if (camp.fatigue >= 2 && !out.events.some((x) => x.ev && x.ev.id === 'cansaco') && eventEligible(K.EVENTS.find((e) => e.id === 'cansaco'))) { const i = E.instEvent('cansaco'); if (i) { out.events.push(i); continue; } }
      if (pool.length) { const ev = wpick(pool, (e) => e.w); const i = E.instEvent(ev.id); if (i) out.events.push(i); }
    }
    // avança
    camp.week++;
    camp.energy = camp.maxEnergy + (camp.flags.rested ? 2 : 0); camp.flags.rested = false; camp.actionsThisWeek = 0;
    if (camp.week === 3 && co().tvFree && camp.sys !== 'internal' && camp.stage !== 'runoff') pushNews('Começa o horário eleitoral gratuito no rádio e na TV.', 'Tv', 'big');
    out.poll = E.poll();
    out.electionNow = camp.week > camp.weeks;
    return out;
  };

  // aplica efeitos de escolha de evento
  E.applyFx = (fx, ctx = {}) => {
    const S = E.S, camp = S.camp, pc = P(), p = S.player; const out = [];
    if (!fx) return out;
    if (fx.money) { const v = cost(fx.money); camp.money = Math.max(0, camp.money + v); out.push({ t: (v > 0 ? '+' : '−') + E.fmtMoney(Math.abs(v)), good: v > 0, money: true }); }
    if (fx.rep) { p.rep = clamp(p.rep + fx.rep, 0, 100); out.push({ t: `${fx.rep > 0 ? '+' : ''}${fx.rep} reputação`, good: fx.rep > 0 }); }
    if (fx.fame) { p.fame = clamp(p.fame + fx.fame, 0, 100); out.push({ t: `+${fx.fame} fama`, good: true }); }
    if (fx.mom) { pc.mom += fx.mom; if (fx.mom) out.push({ t: fx.mom > 0 ? 'Campanha ganha força' : 'Campanha perde força', good: fx.mom > 0 }); }
    if (fx.aw) { allZones((z) => addAw(z, 'P', fx.aw * E.mediaScale())); out.push({ t: 'Mais eleitores conhecem você', good: true }); }
    if (fx.zmom && ctx.zone) { const z = camp.arena.zones.find((x) => x.id === ctx.zone); addMo(z, 'P', fx.zmom); out.push({ t: `${fx.zmom > 0 ? 'Ganho' : 'Perda'} de apoio em ${z.n}`, good: fx.zmom > 0 }); }
    if (fx.zaw && ctx.zone) { const z = camp.arena.zones.find((x) => x.id === ctx.zone); addAw(z, 'P', fx.zaw); }
    if (fx.seg) { segBoost(fx.seg); Object.entries(fx.seg).forEach(([s, v]) => out.push({ t: `${v > 0 ? '+' : '−'} ${K.SEGMENTS[s].n}`, good: v > 0 })); }
    if (fx.polar) { allZones((z) => { const al = 1 - Math.hypot(p.econ - z.econ, p.soc - z.soc) / 1.1; addMo(z, 'P', fx.polar * al); }); out.push({ t: 'Eleitorado polarizado', good: null }); }
    if (fx.scandal) { camp.scandal += fx.scandal; }
    if (fx.energy) { camp.energy = Math.max(0, camp.energy + fx.energy); }
    if (fx.oppMom && ctx.opp) { const o = camp.cands.find((c) => c.id === ctx.opp); o.mom += fx.oppMom; out.push({ t: `${o.ballot} ${fx.oppMom < 0 ? 'perde' : 'ganha'} força`, good: fx.oppMom < 0 }); }
    if (fx.leaderMom) { const { tot } = E.totals(); const l = Object.entries(tot).filter((x) => x[0] !== 'P').sort((a, b) => b[1] - a[1])[0]; if (l) camp.cands.find((c) => c.id === l[0]).mom += fx.leaderMom; }
    if (fx.issue) for (const t in fx.issue) pc.iss[t] = clamp((pc.iss[t] || 0) + fx.issue[t], 0, 1);
    if (fx.partySupport) { camp.partySupport = clamp(camp.partySupport + fx.partySupport, 0, 100); S.partySupport = camp.partySupport; }
    if (fx.flag) camp.flags[fx.flag] = true;
    if (fx.attr) for (const a in fx.attr) p.attrs[a] = clamp(p.attrs[a] + fx.attr[a], 0, 99);
    return out;
  };
  E.resolveChoice = (inst, idx) => {
    const ch = inst.ev.ch[idx]; let fx = ch.fx, okTest = null;
    if (ch.test) { const v = E.S.player.attrs[ch.test.attr]; okTest = Math.random() < clamp(0.5 + (v - ch.test.diff) / 60, 0.08, 0.95); fx = okTest ? ch.ok : ch.fail; }
    let res = E.applyFx(fx, inst.ctx);
    if (ch.staffBonus) for (const s in ch.staffBonus) if (staffHas(s)) res = res.concat(E.applyFx(ch.staffBonus[s], inst.ctx));
    if (ch.risk && Math.random() < ch.risk.p) { res = res.concat(E.applyFx(ch.risk.fx, inst.ctx)); return { res, okTest, msg: ch.risk.msg, bad: true }; }
    return { res, okTest, msg: ch.msg };
  };

  // ================== Eleição ==================
  function zoneVotes(z, cands, noiseC, rnd) {
    const camp = E.S.camp; const pw = E.poolW(z);
    const ws = {}; let tot = pw;
    for (const c of cands) { const u = E.utility(c, z) + noiseC[c.id] + gauss(rnd) * 0.07; const w = Math.max(0.02, z.aw[c.id] || 0.01) * Math.exp(u / TAU); ws[c.id] = w; tot += w; }
    const turnout = clamp(co().turnout + gauss(rnd) * 0.03, 0.3, 0.95) * (camp.sys === 'internal' ? 0.75 : 1);
    const voters = z.pop * (camp.sys === 'internal' ? 1 : co().elecRatio) * turnout;
    const bn = camp.sys === 'internal' ? 0.01 : E.S.country === 'BR' ? clamp(0.08 + gauss(rnd) * 0.015, 0.04, 0.14) : 0.015;
    const valid = voters * (1 - bn);
    const out = { _valid: valid, _bn: voters * bn, _abst: z.pop * (camp.sys === 'internal' ? 1 : co().elecRatio) - voters };
    for (const k in ws) out[k] = Math.round((valid * ws[k]) / tot);
    out._pool = Math.round((valid * pw) / tot);
    return out;
  }
  function dhondt(votes, seats, threshold = 0) {
    const tot = sum(Object.values(votes)); const res = {}; Object.keys(votes).forEach((k) => (res[k] = 0));
    const elig = Object.keys(votes).filter((k) => votes[k] >= tot * threshold);
    for (let s = 0; s < seats; s++) { let best = null, bv = -1; for (const k of elig) { const q = votes[k] / (res[k] + 1); if (q > bv) { bv = q; best = k; } } if (best == null) break; res[best]++; }
    return res;
  }
  // distribuição de votos dos partidos (lista aberta) — "resto" do eleitorado
  function partyBaseShares(arena) {
    const ws = {}; let tot = 0;
    E.S.parties.forEach((pt) => {
      if (pt.regions && !pt.regions.includes(arena.region)) return;
      let w = 0; arena.zones.forEach((z) => { w += z.share * Math.exp(-1.6 * Math.hypot(pt.e - z.econ, pt.s - z.soc)); });
      w *= Math.pow(pt.size + 0.02, 0.9); ws[pt.id] = w; tot += w;
    });
    for (const k in ws) ws[k] /= tot;
    return ws;
  }
  function listOpenAllocation(totVotes, valid, seats, arena, playerParty, rnd) {
    // totVotes: votos de candidatos visíveis {cid: v}, pool: votos restantes
    const camp = E.S.camp;
    const visible = camp.cands.filter((c) => !c.out);
    const poolVotes = valid - sum(visible, (c) => totVotes[c.id] || 0);
    const base = partyBaseShares(arena);
    const party = {}; const lists = {};
    Object.keys(base).forEach((pid) => { party[pid] = Math.round(poolVotes * base[pid]); lists[pid] = []; });
    visible.forEach((c) => { const pid = c.party || 'IND'; party[pid] = (party[pid] || 0) + (totVotes[c.id] || 0); (lists[pid] = lists[pid] || []).push({ id: c.id, name: c.ballot, votes: totVotes[c.id] || 0, isP: c.isP, color: c.color }); });
    // colegas: dividem os votos do "resto" do partido (80% nominais, 20% legenda)
    const r2 = rnd || U.rng(7);
    Object.keys(lists).forEach((pid) => {
      const pool = Math.round((party[pid] - sum(lists[pid], (x) => x.votes)) * 0.82);
      const n = Math.max(3, Math.min(seats + 1, 6 + Math.round(seats * 0.6)));
      const w = Array.from({ length: n }, (_, i) => Math.pow(i + 1, -1.15) * (0.8 + r2() * 0.4)); const tw = sum(w);
      const N = K.NAMES[co().names] || K.NAMES.br;
      w.forEach((wi, i) => { const g = r2() < 0.6 ? 'm' : 'f'; lists[pid].push({ id: pid + '_c' + i, name: pick(N[g], r2) + ' ' + pick(N.s, r2), votes: Math.round((pool * wi) / tw), isP: false }); });
      lists[pid].sort((a, b) => b.votes - a.votes);
    });
    const qe = Math.floor(valid / seats);
    const seatsP = {}; Object.keys(party).forEach((k) => (seatsP[k] = Math.floor(party[k] / qe)));
    let used = sum(Object.values(seatsP));
    const elig = Object.keys(party).filter((k) => party[k] >= qe * 0.8);
    while (used < seats && elig.length) { let best = null, bv = -1; for (const k of elig) { const q = party[k] / (seatsP[k] + 1); if (q > bv) { bv = q; best = k; } } seatsP[best]++; used++; }
    // eleitos
    const elected = new Set();
    Object.keys(lists).forEach((pid) => { let s = seatsP[pid] || 0; for (const c of lists[pid]) { if (s <= 0) break; if (c.votes >= qe * 0.1) { elected.add(c.id); s--; } } });
    const pl = lists[playerParty] || [];
    const me = pl.find((x) => x.isP);
    const myRank = pl.indexOf(me) + 1;
    const lastIn = pl.filter((x) => elected.has(x.id)).slice(-1)[0];
    const firstOut = pl.find((x) => !elected.has(x.id) && !x.isP);
    let needed;
    if (elected.has('P')) needed = -(me.votes - (firstOut ? firstOut.votes : 0));
    else if (lastIn) needed = Math.max(lastIn.votes, qe * 0.1) - me.votes + 1;
    else needed = Math.max(qe * 0.8 - party[playerParty], 0) + qe * 0.1;
    return { qe, seats, party, seatsP, lists, elected, me, myRank, needed: Math.round(needed), playerElected: elected.has('P') };
  }
  E.listProjection = () => {
    const camp = E.S.camp, arena = camp.arena; const { tot } = E.totals();
    const valid = arena.elec * co().turnout * 0.92;
    const tv = {}; for (const k in tot) tv[k] = Math.round(tot[k] * valid);
    const a = listOpenAllocation(tv, valid, arena.seats, arena, E.S.player.party || 'IND', U.rng(11));
    return { votes: tv.P, needed: a.needed, elected: a.playerElected, qe: a.qe, partySeats: a.seatsP[E.S.player.party] || 0 };
  };
  E.seatProjection = () => {
    const camp = E.S.camp; const res = {}; const o = E.officeDef(camp.oid);
    if (camp.sys === 'list_closed') {
      const { tot } = E.totals(); const v = {}; E.activeCands().forEach((c) => (v[c.party] = tot[c.id]));
      const s = dhondt(v, camp.arena.seats, 0.03); return { seats: s, total: camp.arena.seats, pos: camp.listPos };
    }
    // parlamento
    const seats = {}; let total = 0;
    camp.arena.zones.forEach((z) => {
      const sh = E.zoneShares(z); const v = {}; E.activeCands().forEach((c) => (v[c.party] = sh[c.id]));
      const zs = z.seats || Math.max(1, Math.round(z.share * 300));
      const alloc = o.method === 'fptp' ? cube(v, zs) : dhondt(v, zs, 0.03);
      for (const k in alloc) seats[k] = (seats[k] || 0) + alloc[k]; total += zs;
    });
    return { seats, total, majority: Math.floor(total / 2) + 1 };
  };
  function cube(v, n) {
    const ks = Object.keys(v); const w = ks.map((k) => Math.pow(v[k], 3)); const tw = sum(w);
    const raw = ks.map((k, i) => (n * w[i]) / tw); const fl = raw.map(Math.floor); let rem = n - sum(fl);
    const ord = raw.map((r, i) => [r - fl[i], i]).sort((a, b) => b[0] - a[0]);
    for (let i = 0; i < rem; i++) fl[ord[i][1]]++;
    const out = {}; ks.forEach((k, i) => (out[k] = fl[i])); return out;
  }
  E.collegeProjection = () => {
    const camp = E.S.camp; const ev = {};
    camp.arena.zones.forEach((z) => { const sh = E.zoneShares(z); const w = Object.entries(sh).sort((a, b) => b[1] - a[1])[0][0]; ev[w] = (ev[w] || 0) + (z.ev || 0); });
    return ev;
  };

  E.runElection = () => {
    const S = E.S, camp = S.camp, arena = camp.arena, o = E.officeDef(camp.oid);
    const rnd = Math.random;
    const cands = E.activeCands();
    const noiseC = {}; cands.forEach((c) => (noiseC[c.id] = gauss() * 0.075));
    const zones = {}; const tot = {}; cands.forEach((c) => (tot[c.id] = 0));
    let valid = 0, bn = 0, abst = 0, pool = 0;
    arena.zones.forEach((z) => {
      const zv = zoneVotes(z, cands, noiseC, rnd); zones[z.id] = zv;
      cands.forEach((c) => (tot[c.id] += zv[c.id])); valid += zv._valid; bn += zv._bn; abst += zv._abst; pool += zv._pool;
    });
    const cvalid = sum(Object.values(tot));
    const R = {
      sys: camp.sys, stage: camp.stage, office: o.id, officeName: o.name, arenaName: arena.fullName, valid: Math.round(valid), bn: Math.round(bn), abst: Math.round(abst),
      cands: cands.map((c) => ({ id: c.id, name: c.ballot, full: c.name, party: c.party, color: c.color, votes: tot[c.id], pct: tot[c.id] / (camp.sys === 'list_open' ? valid : cvalid), isP: c.isP, num: c.num, av: c.av })).sort((a, b) => b.votes - a.votes),
      zones, order: shuffle(arena.zones.map((z) => z.id)), extra: {},
    };
    const me = R.cands.find((c) => c.isP); const myPos = R.cands.indexOf(me) + 1; R.myPos = myPos;
    if (camp.sys === 'majority') {
      const top = R.cands[0];
      let decided;
      const rule = o.runoff;
      const needRunoff = camp.stage === 'first' && rule && (rule !== 'br' || o.arena !== 'city' || arena.elec > 200000);
      if (!needRunoff) decided = true;
      else if (rule === 'ar') decided = top.pct >= 0.45 || (top.pct >= 0.4 && top.pct - R.cands[1].pct >= 0.1);
      else decided = top.pct > 0.5;
      if (decided || R.cands.length < 2) { R.winners = [top.id]; R.outcome = top.isP ? 'won' : 'lost'; }
      else { R.runoff = [R.cands[0].id, R.cands[1].id]; R.outcome = R.runoff.includes('P') ? 'runoff' : 'lost'; }
    } else if (camp.sys === 'plurality' || camp.sys === 'internal') {
      const n = camp.stage === 'primary' || camp.sys === 'internal' ? 1 : arena.seats || 1;
      R.winners = R.cands.slice(0, n).map((c) => c.id);
      R.outcome = R.winners.includes('P') ? (camp.stage === 'primary' ? 'primary_won' : 'won') : camp.stage === 'primary' ? 'primary_lost' : 'lost';
      R.seatsN = n;
    } else if (camp.sys === 'college') {
      if (camp.stage === 'primary') { R.winners = [R.cands[0].id]; R.outcome = R.cands[0].isP ? 'primary_won' : 'primary_lost'; }
      else {
        const ev = {}; const call = {};
        arena.zones.forEach((z) => { const zv = zones[z.id]; const w = cands.map((c) => [c.id, zv[c.id]]).sort((a, b) => b[1] - a[1])[0][0]; ev[w] = (ev[w] || 0) + z.ev; call[z.id] = w; });
        R.extra.college = { ev, call, need: 270 };
        const win = Object.entries(ev).sort((a, b) => b[1] - a[1])[0][0];
        R.winners = [win]; R.outcome = win === 'P' && ev.P >= 270 ? 'won' : 'lost';
      }
    } else if (camp.sys === 'list_open') {
      const a = listOpenAllocation(tot, valid, arena.seats, arena, S.player.party || 'IND', U.rng((Math.random() * 1e9) | 0));
      R.extra.list = { qe: a.qe, seats: arena.seats, party: a.party, seatsP: a.seatsP, myList: (a.lists[S.player.party] || []).slice(0, 14).map((x) => ({ ...x, elected: a.elected.has(x.id) })), myRank: a.myRank, needed: a.needed };
      me.pct = me.votes / valid;
      R.outcome = a.playerElected ? 'won' : 'lost';
      R.winners = a.playerElected ? ['P'] : [];
    } else if (camp.sys === 'list_closed') {
      const v = {}; cands.forEach((c) => (v[c.party] = tot[c.id]));
      const s = dhondt(v, arena.seats, 0.03);
      R.extra.seats = { seats: s, total: arena.seats, pos: camp.listPos, myParty: S.player.party };
      R.outcome = (s[S.player.party] || 0) >= camp.listPos ? 'won' : 'lost';
    } else if (camp.sys === 'parliament') {
      const seats = {}; let total = 0;
      arena.zones.forEach((z) => {
        const zv = zones[z.id]; const v = {}; cands.forEach((c) => (v[c.party] = zv[c.id]));
        const zs = z.seats || Math.max(1, Math.round(z.share * 300));
        const al = o.method === 'fptp' ? cube(v, zs) : dhondt(v, zs, 0.03);
        for (const k in al) seats[k] = (seats[k] || 0) + al[k]; total += zs;
      });
      const maj = Math.floor(total / 2) + 1; const mine = seats[S.player.party] || 0;
      const largest = Object.entries(seats).sort((a, b) => b[1] - a[1])[0][0];
      let coalition = [S.player.party];
      if (mine < maj && largest === S.player.party) {
        const pp = E.playerParty();
        const partners = Object.keys(seats).filter((k) => k !== S.player.party && seats[k] > 0).map((k) => E.party(k)).filter((pt) => pt && Math.hypot(pt.e - pp.e, pt.s - pp.s) < 0.85 || camp.alliances.includes(pt && pt.id))
          .sort((a, b) => Math.hypot(a.e - pp.e, a.s - pp.s) - Math.hypot(b.e - pp.e, b.s - pp.s));
        let sumS = mine; for (const pt of partners) { if (sumS >= maj) break; coalition.push(pt.id); sumS += seats[pt.id]; }
        if (sumS < maj) coalition = [S.player.party];
      }
      const coalSeats = sum(coalition, (k) => seats[k] || 0);
      R.extra.parl = { seats, total, majority: maj, coalition, coalSeats, largest };
      R.outcome = coalSeats >= maj ? 'won' : 'lost';
    }
    camp.lastResult = R;
    return R;
  };

  // aplica consequências do resultado
  E.applyResult = (R) => {
    const S = E.S, camp = S.camp, o = E.officeDef(camp.oid), p = S.player, arena = camp.arena;
    const me = R.cands.find((c) => c.isP);
    S.totalVotes += me ? me.votes : 0;
    if (R.outcome === 'runoff') {
      camp.stage = 'runoff'; camp.week = 1; camp.weeks = 3; camp.debates = [2]; camp.debatesDone = [];
      camp.cands.forEach((c) => { if (!R.runoff.includes(c.id)) c.out = true; c.mom *= 0.5; });
      // eliminados apoiam o mais próximo
      camp.cands.filter((c) => c.out && !c.isP).forEach((c) => { const f = camp.cands.filter((x) => R.runoff.includes(x.id)).sort((a, b) => Math.hypot(a.econ - c.econ, a.soc - c.soc) - Math.hypot(b.econ - c.econ, b.soc - c.soc))[0]; if (f && Math.random() < 0.6) f.mom += 0.015; });
      arena.zones.forEach((z) => R.runoff.forEach((cid) => (z.aw[cid] = clamp((z.aw[cid] || 0) + 0.3, 0, 0.98))));
      camp.energy = camp.maxEnergy; camp.polls.push({ w: 0, stage: 'runoff', res: {}, und: 0, sep: true });
      pushNews('Começa o segundo turno!', 'Repeat', 'big');
      E.poll(true);
      return { next: 'runoff' };
    }
    if (R.outcome === 'primary_won') {
      // eleição geral
      camp.stage = 'general'; camp.week = 1; camp.weeks = 6; camp.debates = [3, 5]; camp.debatesDone = [];
      camp.cands.forEach((c) => { if (!c.isP) c.out = true; });
      const rnd = U.rng(S.seed + 99); const used = new Set(camp.cands.map((c) => c.num));
      const others = S.parties.filter((pt) => pt.id !== p.party && pt.major);
      const country = co();
      others.forEach((pt) => {
        const real = o.top ? country.real.find((r) => r.party === pt.id && r.id !== p.realId) : null;
        const c = real ? newAI(o, pt, rnd, clamp(0.55 + real.fame / 250, 0.4, 1), { name: real.name, ballot: real.name, av: real.av, g: real.av.g, realId: real.id, real: true, fame: real.fame })
          : newAI(o, pt, rnd, clamp(0.5 + arena.D * 0.07 + gauss(rnd) * 0.08, 0.3, 1));
        c.num = ballotNumber(pt, 2, rnd, used); camp.cands.push(c);
        arena.zones.forEach((z) => { z.aw[c.id] = clamp((c.real ? 0.2 + c.fame / 125 : 0.25 + c.str * 0.45) * (0.85 + rnd() * 0.3), 0.05, 0.97); z.mo[c.id] = 0; });
      });
      if (rnd() < 0.6) { const minor = S.parties.filter((pt) => !pt.major && pt.id !== p.party && !pt.own)[0]; if (minor) { const c = newAI(o, minor, rnd, 0.25); camp.cands.push(c); arena.zones.forEach((z) => { z.aw[c.id] = 0.12; z.mo[c.id] = 0; }); } }
      arena.zones.forEach((z) => (z.aw.P = clamp(z.aw.P + 0.12, 0, 0.98)));
      camp.energy = camp.maxEnergy; camp.polls.push({ w: 0, stage: 'general', res: {}, und: 0, sep: true });
      pushNews(`Você venceu as primárias! Agora é a eleição geral.`, 'Trophy', 'big');
      E.recalcTV(); E.poll(true);
      return { next: 'general' };
    }
    // eleição definida
    const won = R.outcome === 'won';
    const sizeF = clamp(Math.log10(Math.max(arena.elec, 1000)) / 7.5, 0.3, 1);
    const pct = me ? me.pct : 0;
    const fameGain = (won ? 4 + o.level * 3.5 : 1) + 14 * pct * sizeF;
    p.fame = clamp(p.fame + fameGain, 0, 100);
    p.money += Math.max(0, camp.money * 0.5);
    S.carryScandal = Math.max(0, camp.scandal - 1);
    const h = { year: S.year, office: o.id, officeName: o.name, place: arena.fullName, won, votes: me ? me.votes : 0, pct, pos: R.myPos, sys: camp.sys };
    S.history.unshift(h);
    // partido próprio cresce
    const pp = E.playerParty(); if (pp && pp.own) pp.size = clamp(pp.size + (won ? 0.03 * o.level : 0.01) + pct * 0.05, 0.03, 0.9);
    let next = 'career';
    if (won) {
      S.wins++;
      const prevSame = S.office && S.office.id === o.id;
      if (o.kind === 'party') { S.leaderOf = p.party; S.leaderOffice = o.id; S.log.unshift({ y: S.year, t: `Você foi eleito(a) ${o.name}.` }); }
      else {
        S.office = {
          id: o.id, kind: o.kind, scope: o.scope, level: o.level, place: arena.fullName, placeRef: arena.place, start: S.year + 1, end: S.year + o.term,
          appr: clamp(50 + (pct - 0.4) * 30, 35, 70), promises: camp.promises.slice(), kept: [], projects: [], bills: [], budget: 10, debt: 0, consec: prevSame ? (S.office.consec || 1) + 1 : 1,
          zones: arena.zones.map((z) => ({ id: z.id, n: z.n, share: z.share, inc: z.inc, rel: z.rel, young: z.young, urban: z.urban, econ: z.econ, soc: z.soc })),
          arenaType: arena.type, arenaMap: arena.map, seats: arena.seats,
        };
      }
      next = 'mandate';
      if (o.top) S.flags.reachedTop = true;
    }
    S.camp = null;
    // a eleição acontece em outubro: o tempo avança para o ano seguinte
    S.year++; S.sem = 1;
    if (S.office && S.year > S.office.end) {
      const of = S.office; const kept = of.kept.length, broke = Math.max(0, of.promises.length - kept);
      p.rep = clamp(p.rep + kept * 3 - broke * 2.5, 0, 100);
      S.log.unshift({ y: S.year, t: `Fim do mandato de ${E.officeDef(of.id).name}. Promessas cumpridas: ${kept}/${of.promises.length}.` });
      S.office = null;
    }
    return { next, won, fameGain };
  };

  // ================== Tempo, mandato e pré-campanha ==================
  E.semesterSlots = () => (E.S.office ? (E.S.office.kind === 'exec' ? 1 : 3) : 3);
  E.isElectionTime = () => E.S.sem === 2 && E.officesInYear(E.S.year).length > 0;

  E.doPreAction = (aid) => {
    const S = E.S, p = S.player; const fx = []; const unit = 2000 * co().costMult;
    const r = () => rand(0.8, 1.2);
    switch (aid) {
      case 'palestras': { const m = Math.round(unit * (3 + p.fame / 10) * r()); p.money += m; p.fame = clamp(p.fame + 1, 0, 100); fx.push({ t: `+${E.fmtMoney(m)}`, good: true }, { t: '+1 fama', good: true }); break; }
      case 'midia': { const g = Math.round((1.5 + p.attrs.car / 40) * r()); p.fame = clamp(p.fame + g, 0, 100); fx.push({ t: `+${g} fama`, good: true }); break; }
      case 'voluntario': p.rep = clamp(p.rep + 4, 0, 100); p.fame = clamp(p.fame + 1, 0, 100); fx.push({ t: '+4 reputação', good: true }, { t: '+1 fama', good: true }); break;
      case 'livro': p.attrs.int = clamp(p.attrs.int + 3, 0, 99); p.fame = clamp(p.fame + 2, 0, 100); fx.push({ t: '+3 inteligência', good: true }, { t: '+2 fama', good: true }); break;
      case 'oratoria': p.attrs.ora = clamp(p.attrs.ora + 3, 0, 99); p.attrs.car = clamp(p.attrs.car + 1, 0, 99); fx.push({ t: '+3 oratória', good: true }, { t: '+1 carisma', good: true }); break;
      case 'estudar': p.attrs.int = clamp(p.attrs.int + 4, 0, 99); fx.push({ t: '+4 inteligência', good: true }); break;
      case 'rede': p.attrs.art = clamp(p.attrs.art + 3, 0, 99); S.partySupport = clamp(S.partySupport + 8, 0, 100); fx.push({ t: '+3 articulação', good: true }, { t: '+8 apoio no partido', good: true }); break;
      case 'arrecadar': { const m = Math.round(unit * (6 + p.fame / 6) * r()); p.money += m; fx.push({ t: `+${E.fmtMoney(m)}`, good: true }); break; }
      case 'viajar': { const g = Math.round(2 * r() + 1); p.fame = clamp(p.fame + g, 0, 100); p.money -= unit; fx.push({ t: `+${g} fama`, good: true }); break; }
      case 'redes': { const g = Math.round((1 + p.attrs.car / 50) * r() * (p.prof === 'influencer' ? 1.6 : 1)); p.fame = clamp(p.fame + g, 0, 100); p.attrs.car = clamp(p.attrs.car + 1, 0, 99); fx.push({ t: `+${g} fama`, good: true }, { t: '+1 carisma', good: true }); break; }
    }
    return { ok: true, fx };
  };
  E.projectList = () => (E.S.office && E.S.office.kind === 'exec' ? K.PROJECTS[E.S.office.scope === 'exec_local' ? 'exec_local' : 'exec_big'] : []);
  E.launchProject = (pid) => {
    const off = E.S.office; const pj = E.projectList().find((x) => x.id === pid);
    if (off.projects.some((x) => x.id === pid && !x.done)) return { ok: false, msg: 'Projeto já em andamento.' };
    if (off.budget < pj.cost) return { ok: false, msg: 'Orçamento insuficiente neste semestre.' };
    off.budget -= pj.cost; off.projects.push({ id: pid, left: pj.dur, done: false });
    return { ok: true, fx: [{ t: `Projeto lançado: ${pj.n}`, good: true }] };
  };
  function segAppr(seg) { const off = E.S.office; let v = 0; for (const s in seg) v += seg[s] * U.sum(off.zones, (z) => z.share * clamp(SEG[s].w(z), 0, 1.5)); return v; }
  E.doLegAction = (aid, topic) => {
    const S = E.S, off = S.office, p = S.player; const fx = [];
    switch (aid) {
      case 'pl': {
        const pt = E.playerParty(); const ch = clamp(0.25 + p.attrs.art / 200 + (pt ? pt.size * 0.3 : 0), 0.1, 0.9);
        if (Math.random() < ch) {
          off.bills.push(topic); off.appr = clamp(off.appr + 2, 0, 100); p.fame = clamp(p.fame + 2, 0, 100);
          const pr = off.promises.find((x) => (E.promiseDef(x) || {}).topic === topic && !off.kept.includes(x)); if (pr) off.kept.push(pr);
          fx.push({ t: `Projeto sobre ${K.TOPICS[topic].n} APROVADO!`, good: true, big: true }); if (pr) fx.push({ t: 'Promessa cumprida!', good: true });
        } else fx.push({ t: 'O projeto foi engavetado na comissão.', good: false });
        break;
      }
      case 'emendas': off.appr = clamp(off.appr + 3, 0, 100); fx.push({ t: '+3 aprovação', good: true }); break;
      case 'tribuna': if (Math.random() < 0.2 + p.attrs.ora / 250) { p.fame = clamp(p.fame + 4, 0, 100); fx.push({ t: 'Discurso viralizou! +4 fama', good: true, big: true }); } else { p.fame = clamp(p.fame + 1, 0, 100); fx.push({ t: '+1 fama', good: true }); } break;
      case 'fiscalizar': p.fame = clamp(p.fame + 2, 0, 100); p.rep = clamp(p.rep + 2, 0, 100); fx.push({ t: '+2 fama, +2 reputação', good: true }); break;
      case 'comissao': p.attrs.int = clamp(p.attrs.int + 2, 0, 99); p.attrs.art = clamp(p.attrs.art + 2, 0, 99); fx.push({ t: '+2 inteligência, +2 articulação', good: true }); break;
      case 'gabinete': off.appr = clamp(off.appr + 2, 0, 100); fx.push({ t: '+2 aprovação', good: true }); break;
      case 'cargos': { const m = 2000 * co().costMult * 8; p.money += m; p.rep = clamp(p.rep - 4, 0, 100); S.partySupport = clamp(S.partySupport + 6, 0, 100); fx.push({ t: `+${E.fmtMoney(m)}`, good: true }, { t: '−4 reputação', good: false }); break; }
    }
    return { ok: true, fx };
  };
  E.mandateEvent = () => {
    const off = E.S.office; if (!off) return null;
    const pool = K.MANDATE_EVENTS.filter((e) => e.kind === 'any' || e.kind === off.kind || (e.kind === 'leg' && off.kind === 'party'));
    if (!pool.length || Math.random() < 0.25) return null;
    return { ev: pick(pool), ctx: {}, mandate: true };
  };
  E.resolveMandateChoice = (inst, idx) => {
    const S = E.S, off = S.office, p = S.player; const ch = inst.ev.ch[idx]; let fx = ch.fx; let okTest = null;
    if (ch.test) { okTest = Math.random() < clamp(0.5 + (p.attrs[ch.test.attr] - ch.test.diff) / 60, 0.08, 0.95); fx = okTest ? ch.ok : ch.fail; }
    const res = [];
    if (fx.appr && off) { off.appr = clamp(off.appr + fx.appr, 0, 100); res.push({ t: `${fx.appr > 0 ? '+' : ''}${fx.appr} aprovação`, good: fx.appr > 0 }); }
    if (fx.budget && off) { off.budget = Math.max(0, off.budget + fx.budget); res.push({ t: `${fx.budget > 0 ? '+' : ''}${fx.budget} orçamento`, good: fx.budget > 0 }); }
    if (fx.rep) { p.rep = clamp(p.rep + fx.rep, 0, 100); res.push({ t: `${fx.rep > 0 ? '+' : ''}${fx.rep} reputação`, good: fx.rep > 0 }); }
    if (fx.fame) { p.fame = clamp(p.fame + fx.fame, 0, 100); res.push({ t: `+${fx.fame} fama`, good: true }); }
    if (fx.money) { const m = fx.money * 2000 * co().costMult; p.money += m; res.push({ t: `+${E.fmtMoney(m)}`, good: true }); }
    if (fx.seg && off) { const v = segAppr(fx.seg); off.appr = clamp(off.appr + v, 0, 100); res.push({ t: `${v >= 0 ? '+' : ''}${v.toFixed(1)} aprovação`, good: v >= 0 }); }
    if (fx.debt && off) off.debt += fx.debt;
    if (fx.scandal) S.carryScandal = (S.carryScandal || 0) + fx.scandal;
    return { res, okTest };
  };
  // encerra o semestre: retorna relatório
  E.endSemester = () => {
    const S = E.S, p = S.player, off = S.office; const rep = { lines: [], ended: null };
    if (off) {
      if (off.kind === 'exec') {
        let gain = 0;
        off.projects.filter((x) => !x.done).forEach((x) => {
          x.left--;
          if (x.left <= 0) {
            x.done = true; const pj = E.projectList().find((y) => y.id === x.id);
            const g = pj.appr + segAppr(pj.seg); gain += g; if (pj.rep) p.rep = clamp(p.rep + pj.rep, 0, 100);
            const pr = off.promises.find((pid) => (E.promiseDef(pid) || {}).topic === pj.topic && !off.kept.includes(pid)); if (pr) off.kept.push(pr);
            rep.lines.push({ t: `Inaugurado: ${pj.n} (${g >= 0 ? '+' : ''}${g.toFixed(1)} aprovação)`, good: g >= 0 });
            if (pr) rep.lines.push({ t: `Promessa cumprida: ${E.promiseDef(pr).t}`, good: true });
          }
        });
        off.appr = clamp(off.appr + gain, 0, 100);
        off.budget = Math.min(16, off.budget + 8 - off.debt * 0.5);
        if (off.debt > 0) off.debt = Math.max(0, off.debt - 0.5);
      }
      const drift = (48 - off.appr) * 0.06 - 1.2 + gauss() * 2.2;
      off.appr = clamp(off.appr + drift, 2, 98);
      const fg = (off.appr - 40) / 18 * (0.6 + off.level * 0.3);
      p.fame = clamp(p.fame + Math.max(-1.5, fg), 0, 100);
      rep.lines.push({ t: `Aprovação: ${Math.round(off.appr)}%`, good: off.appr >= 45 });
      if ((S.carryScandal || 0) > 6 && Math.random() < 0.15) {
        rep.lines.push({ t: 'A Justiça cassou seu mandato por irregularidades de campanha!', good: false, big: true });
        S.ineligibleUntil = S.year + 8; S.office = null; p.rep = clamp(p.rep - 25, 0, 100); rep.cassado = true;
      }
    }
    // avança o tempo
    if (S.sem === 1) S.sem = 2; else { S.sem = 1; S.year++; }
    // fim do mandato
    if (S.office && S.year > S.office.end) {
      const o = S.office; const kept = o.kept.length, broke = Math.max(0, o.promises.length - kept);
      p.rep = clamp(p.rep + kept * 3 - broke * 2.5, 0, 100);
      rep.ended = { name: E.officeDef(o.id).name, kept, broke, appr: o.appr };
      S.log.unshift({ y: S.year, t: `Fim do mandato de ${E.officeDef(o.id).name}. Promessas cumpridas: ${kept}/${o.promises.length}.` });
      S.office = null;
    }
    // fim de jogo
    if (E.age() >= 92) S.over = { reason: 'age' };
    if (p.rep <= 0) S.over = { reason: 'rep' };
    return rep;
  };
  E.skipElection = () => { const S = E.S; S.sem = 1; S.year++; if (S.office && S.year > S.office.end) S.office = null; };
  E.legacyScore = () => {
    const S = E.S; const w = S.history.filter((h) => h.won);
    return Math.round(sum(w, (h) => E.officeDef(h.office).level * 120) + S.player.fame * 5 + S.player.rep * 3 + S.totalVotes / 50000);
  };

  // ================== Salvar / carregar ==================
  const SKEY = 'rap_save_';
  E.save = (slot = 'auto') => {
    const S = E.S; if (!S) return false;
    const meta = { name: S.player.name, country: S.country, year: S.year, office: S.office ? E.officeDef(S.office.id).name : null, camp: S.camp ? E.officeDef(S.camp.oid).name : null, t: Date.now(), av: S.player.av, party: S.player.party };
    return U.store.set(SKEY + slot, { meta, S });
  };
  E.load = (slot = 'auto') => { const d = U.store.get(SKEY + slot); if (!d) return null; E.S = d.S; return E.S; };
  E.saveMeta = (slot = 'auto') => { const d = U.store.get(SKEY + slot); return d ? d.meta : null; };
  E.delSave = (slot) => U.store.del(SKEY + slot);
})();
