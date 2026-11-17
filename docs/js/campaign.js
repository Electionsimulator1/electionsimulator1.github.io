/* HUD de campanha: mapa, ações, pesquisas, notícias, eventos e painéis */
(function () {
  const S = UI.screens, A = UI.acts, E = window.Engine, K = window.CONTENT;
  const ic = U.ic, esc = U.esc;
  const cp = (UI.state.cp = UI.state.cp || { tab: 'rua', rtab: 'polls', mode: 'apoio', sel: null });
  const CP = (UI.CP = {});
  const TABS = [['rua', 'Rua', 'Footprints'], ['midia', 'Mídia', 'Tv'], ['politica', 'Política', 'Landmark'], ['financas', 'Finanças', 'Wallet'], ['equipe', 'Equipe', 'Users'], ['preparo', 'Preparo', 'Brain']];

  const camp = () => E.S.camp;
  const me = () => camp().cands.find((c) => c.isP);
  const stageName = () => {
    const o = E.officeDef(camp().oid);
    const hasRunoff = o.sys === 'majority' && o.runoff && !(o.runoff === 'br' && o.arena === 'city' && camp().arena.elec <= 200000);
    return ({ first: hasRunoff ? '1º turno' : 'Turno único', runoff: '2º turno', primary: 'Primárias', general: 'Eleição geral' }[camp().stage] || '');
  };
  const validShares = () => { const p = camp().polls.filter((x) => !x.sep).slice(-1)[0]; return p; };

  S.campaign = () => {
    if (!camp()) return S.career();
    if (cp.sel && !camp().arena.zones.some((z) => z.id === cp.sel)) cp.sel = null;
    return {
      html: `<div class="screen hud">
      <div class="panel topbar" id="top">${CP.top()}</div>
      <div class="main3">
        <div class="panel side"><div class="tabs" id="ltabs">${CP.ltabs()}</div><div class="content" id="left">${CP.left()}</div></div>
        <div class="panel mapwrap" id="mapwrap">
          <div class="maptools"><div class="maptitle grow">${esc(camp().arena.fullName)}</div>
            <div class="seg" id="modes">${[['apoio', 'Seu apoio', 'Heart'], ['lider', 'Líder', 'Crown'], ['aw', 'Conhecimento', 'Eye']].map(([k, n, i]) => `<button class="${cp.mode === k ? 'on' : ''}" data-act="mapMode" data-m="${k}">${ic(i)}${n}</button>`).join('')}</div></div>
          <div id="mapsvg" style="position:absolute;inset:56px 8px 8px 8px">${MapR.svg(camp().arena, CP.colors(), { sel: cp.sel })}</div>
          <div class="legend" id="legend">${CP.legend()}</div>
          <div id="zinfo">${CP.zoneInfo()}</div>
        </div>
        <div class="panel side"><div class="tabs" id="rtabs">${CP.rtabs()}</div><div class="content" id="right">${CP.right()}</div></div>
      </div>
      <div class="panel bottombar" id="bottom">${CP.bottom()}</div>
    </div>`,
      mount: (root) => {
        Sound.music('campaign');
        const m = root.querySelector('#mapsvg');
        m.addEventListener('click', (e) => { const z = e.target.closest('[data-zone]'); if (!z) return; cp.sel = z.dataset.zone; Sound.sfx('select'); MapR.select(m, cp.sel); U.$('#zinfo').innerHTML = CP.zoneInfo(); if (cp.tab !== 'rua') { cp.tab = 'rua'; CP.update(); } else U.$('#left').innerHTML = CP.left(); });
        m.addEventListener('mousemove', (e) => { const z = e.target.closest('[data-zone]'); if (z) UI.tipShow(CP.zoneTip(z.dataset.zone), e); else UI.tipHide(); });
        m.addEventListener('mouseleave', UI.tipHide);
      },
    };
  };

  CP.update = () => {
    if (UI.cur !== 'campaign' || !camp()) return;
    U.$('#top').innerHTML = CP.top(); U.$('#ltabs').innerHTML = CP.ltabs(); U.$('#left').innerHTML = CP.left();
    U.$('#rtabs').innerHTML = CP.rtabs(); U.$('#right').innerHTML = CP.right(); U.$('#bottom').innerHTML = CP.bottom();
    MapR.recolor(U.$('#mapsvg'), CP.colors()); U.$('#legend').innerHTML = CP.legend(); U.$('#zinfo').innerHTML = CP.zoneInfo();
  };

  // ---------- topo ----------
  CP.top = () => {
    const s = E.S, c = camp(), p = s.player, o = E.officeDef(c.oid);
    const pips = Array.from({ length: c.maxEnergy + (c.energy > c.maxEnergy ? c.energy - c.maxEnergy : 0) }, (_, i) => `<i class="${i < c.energy ? 'on' : ''}"></i>`).join('');
    return `${UI.av(p.av, 48, { bg: me().color })}
      <div class="who"><h3>${esc(p.ballot)}</h3><div class="row gap6 small muted">${UI.partyChip(p.party)}<span>${o.name}</span></div></div>
      <div class="row gap6" style="margin-left:auto">
        <div class="stat" title="Caixa de campanha">${ic('Wallet', 'good')}<div><small>Caixa</small><b id="money">${E.fmtMoney(c.money)}</b></div></div>
        <div class="stat" title="Energia da semana">${ic('Zap')}<div><small>Energia ${c.energy}/${c.maxEnergy}</small><div class="pips">${pips}</div></div></div>
        <div class="stat">${ic('Calendar')}<div><small>${stageName()} · ${s.year}</small><b>Semana ${Math.min(c.week, c.weeks)}/${c.weeks}</b></div></div>
        <div class="stat" title="Reputação">${ic('ShieldCheck')}<div><small>Reputação</small><b>${Math.round(p.rep)}</b></div></div>
        <div class="stat" title="Fama">${ic('Star')}<div><small>Fama</small><b>${Math.round(p.fame)}</b></div></div>
        <button class="btn iconbtn" data-act="saveGame" title="Salvar">${ic('Save')}</button>
        <button class="btn iconbtn" data-act="settings" title="Configurações">${ic('Settings')}</button>
        <button class="btn iconbtn" data-act="menu" title="Menu">${ic('LogOut')}</button>
      </div>`;
  };
  A.saveGame = () => { E.save(); UI.toast('Jogo salvo.', 'g', 'Save'); };
  A.menu = async () => { if (await UI.confirm('Voltar ao menu', 'Seu progresso foi salvo automaticamente. Voltar ao menu principal?', 'Voltar')) { E.save(); UI.go('title'); } };

  // ---------- lado esquerdo ----------
  CP.ltabs = () => TABS.map(([k, n, i]) => `<button class="${cp.tab === k ? 'on' : ''}" data-act="ltab" data-t="${k}">${ic(i)}${n}</button>`).join('');
  A.ltab = (el, d) => { cp.tab = d.t; U.$('#ltabs').innerHTML = CP.ltabs(); U.$('#left').innerHTML = CP.left(); };
  const actCard = (id, extra = '') => {
    const a = E.ACTIONS[id]; if (!E.actionAvailable(id)) return '';
    const can = E.canAfford(id);
    const costTxt = [a.en ? `<b>${a.en}</b> ${ic('Zap')}` : '', a.cu ? `${E.fmtMoney(E.cost(a.cu))}` : ''].filter(Boolean).join('<br>') || '<span class="good">grátis</span>';
    return `<div class="act ${can ? '' : 'dis'} ${extra}" data-act="doAct" data-id="${id}"><div class="ico">${ic(a.ic)}</div><div><h5>${a.n}</h5><p>${a.d}</p></div><div class="cost">${costTxt}</div></div>`;
  };
  CP.left = () => {
    const c = camp(); const t = cp.tab;
    if (t === 'rua') {
      const z = cp.sel && c.arena.zones.find((x) => x.id === cp.sel);
      return `<div class="card" style="margin-bottom:10px;${z ? 'border-color:rgba(var(--accRGB),.5)' : ''}">${z ? `<div class="label">Região selecionada</div><b style="font-family:var(--fh);font-size:17px">${esc(z.n)}</b><div class="tiny muted">${U.fmtInt(z.pop)} hab. · ${c.visits[z.id] || 0} visita(s)</div>` : `<div class="row">${ic('MousePointerClick') || ic('MapPin')}<span class="small muted">Clique em uma região do mapa para agir nela.</span></div>`}</div>
      ${['visitar', 'caminhada', 'comicio', 'carreata', 'panfletagem'].map((id) => actCard(id)).join('')}
      <div class="tiny dim" style="line-height:1.5;margin-top:6px">Ações de rua rendem muito em regiões pequenas e pouco nas muito populosas. Visitas repetidas no mesmo lugar rendem menos.</div>`;
    }
    if (t === 'midia') {
      const deb = c.debates.includes(c.week) && !c.debatesDone.includes(c.week);
      return `${deb ? `<div class="act hot" data-act="openDebate"><div class="ico" style="background:rgba(250,204,21,.2);color:var(--acc2)">${ic('Tv')}</div><div><h5>Debate na TV — esta semana!</h5><p>Milhões assistindo. Faltar pega mal.</p></div><div class="cost"><b>3</b> ${ic('Zap')}</div></div>` : ''}
      ${actCard('entrevista')}${actCard('post')}${actCard('video')}${actCard('live')}${actCard('impulsionar')}${actCard('tvad')}
      ${E.country().tvFree && c.sys !== 'internal' ? `<div class="card" style="margin-top:6px"><div class="label">Tom do horário eleitoral</div><div class="seg" style="margin-top:8px">${[['propositiva', 'Propostas'], ['biografia', 'Biografia'], ['ataque', 'Ataque']].map(([k, n]) => `<button class="${c.tone === k ? 'on' : ''}" data-act="tone" data-v="${k}">${n}</button>`).join('')}</div><div class="tiny muted" style="margin-top:6px">Seu tempo de TV: ${U.fmtPct(me().tv || 0, 0)} ${c.week < 3 ? '(começa na semana 3)' : ''}</div></div>` : ''}`;
    }
    if (t === 'politica') return ['promessa', 'apoio', 'alianca', 'vice', 'atacar', 'articular', 'pesquisa'].map((id) => actCard(id)).join('') + `<div class="card small" style="margin-top:6px"><div class="row between"><span class="muted">Apoio no partido</span><b>${Math.round(c.partySupport)}%</b></div>${UI.bar(c.partySupport / 100)}${c.sys === 'list_closed' ? `<div class="row between" style="margin-top:8px"><span class="muted">Posição na lista</span><b>${c.listPos}º</b></div>` : ''}</div>`;
    if (t === 'financas') {
      const wc = E.weeklyCost();
      return `${['jantar', 'vaquinha', 'fundo'].map((id) => actCard(id)).join('')}
      <div class="card small"><div class="row between"><span class="muted">Caixa</span><b>${E.fmtMoney(c.money)}</b></div><div class="row between"><span class="muted">Folha semanal da equipe</span><b class="${wc ? 'bad' : ''}">−${E.fmtMoney(wc)}</b></div><div class="row between"><span class="muted">Unidade de custo da praça</span><b>${E.fmtMoney(c.arena.cost)}</b></div><div class="tiny dim" style="margin-top:6px">Doações espontâneas entram toda semana e crescem com a fama e as pesquisas.</div></div>`;
    }
    if (t === 'equipe') return K.STAFF.map((s) => { const on = c.staff.includes(s.id); return `<div class="act ${!on && c.money < E.cost(s.cost) ? 'dis' : ''}" data-act="hire" data-id="${s.id}" style="${on ? 'border-color:rgba(var(--accRGB),.6);background:rgba(var(--accRGB),.08)' : ''}"><div class="ico">${ic(s.ic)}</div><div><h5>${s.n}</h5><p>${s.d}</p></div><div class="cost">${on ? '<span class="good">contratado</span><br>' : ''}${E.fmtMoney(E.cost(s.cost))}<br>/semana</div></div>`; }).join('');
    if (t === 'preparo') return ['estudar', 'oratoria', 'descansar'].map((id) => actCard(id)).join('') + `<div class="card small">${[['car', 'Carisma'], ['ora', 'Oratória'], ['int', 'Inteligência'], ['intg', 'Integridade'], ['art', 'Articulação']].map(([k, n]) => `<div class="row" style="margin:4px 0"><span style="width:90px" class="muted">${n}</span><div class="grow">${UI.bar(E.S.player.attrs[k] / 100, 'var(--acc)', 'thin')}</div><b class="num">${E.S.player.attrs[k]}</b></div>`).join('')}</div>`;
    return '';
  };
  A.tone = (el, d) => { camp().tone = d.v; U.$('#left').innerHTML = CP.left(); };
  A.hire = (el, d) => { const r = E.hire(d.id); UI.fx(r, el); CP.update(); };

  // executa uma ação
  A.doAct = async (el, d) => {
    const id = d.id, a = E.ACTIONS[id];
    if (a.panel) return CP.panel(a.panel);
    if (a.outlet) return CP.outlets();
    if (a.zone) {
      if (!cp.sel) { UI.toast('Selecione uma região no mapa primeiro.', 'b', 'MapPin'); Sound.sfx('error'); const mw = U.$('#mapwrap'); mw.animate([{ boxShadow: '0 0 0 0 rgba(250,204,21,.0)' }, { boxShadow: '0 0 0 6px rgba(250,204,21,.5)' }, { boxShadow: '0 0 0 0 rgba(250,204,21,.0)' }], { duration: 900 }); return; }
      if (!E.canAfford(id)) return UI.fx({ ok: false, msg: camp().energy < a.en ? 'Energia insuficiente nesta semana.' : 'Dinheiro insuficiente.' });
      if (id === 'comicio') { const q = await Scenes.speech(cp.sel); if (q == null) return; const r = E.doAction('comicio', { zone: cp.sel, quality: q }); UI.fx(r, el); Sound.crowd(2.2, q); CP.afterAction(); return; }
      const r = E.doAction(id, { zone: cp.sel }); UI.fx(r, el); CP.pulseZone(cp.sel); CP.afterAction(); return;
    }
    if (id === 'pesquisa') { const r = E.doAction(id); UI.fx(r, el); cp.rtab = 'polls'; CP.afterAction(); return; }
    const r = E.doAction(id); UI.fx(r, el); CP.afterAction();
  };
  CP.afterAction = () => { CP.update(); E.save(); };
  CP.pulseZone = (zid) => {
    const p = U.$(`#mapsvg path[data-zone="${zid}"]`); if (!p) return;
    p.animate([{ filter: 'brightness(2.2) drop-shadow(0 0 10px #fff)' }, { filter: 'brightness(1)' }], { duration: 700, easing: 'ease-out' });
    const r = p.getBoundingClientRect(); UI.float('+', r.left + r.width / 2, r.top + r.height / 2, '#fde047');
  };
  A.openDebate = () => Scenes.debate();

  // ---------- mapa ----------
  CP.colors = () => {
    const c = camp(); const col = {};
    const shares = {}; let maxS = 0.0001;
    c.arena.zones.forEach((z) => { shares[z.id] = E.zoneShares(z, E.activeCands(), E.poolW(z)); maxS = Math.max(maxS, shares[z.id].P || 0); });
    c.arena.zones.forEach((z) => {
      const sh = shares[z.id];
      if (cp.mode === 'apoio') col[z.id] = MapR.ramp(MapR.SUPPORT, c.sys === 'list_open' ? (sh.P || 0) / maxS * 0.9 : (sh.P || 0) * 1.6);
      else if (cp.mode === 'aw') col[z.id] = MapR.ramp(MapR.AWARE, z.aw.P || 0);
      else {
        const arr = Object.entries(sh).sort((a, b) => b[1] - a[1]); const lead = c.cands.find((x) => x.id === arr[0][0]);
        const margin = arr.length > 1 ? arr[0][1] - arr[1][1] : 1;
        col[z.id] = U.mix('#1e293b', lead.color, U.clamp(0.45 + margin * 2.5, 0.45, 1));
      }
    });
    return col;
  };
  CP.legend = () => {
    if (cp.mode === 'apoio') return `Seu apoio <span class="grad" style="background:linear-gradient(90deg,${MapR.SUPPORT.join(',')})"></span>${camp().sys === 'list_open' ? 'relativo' : 'alto'}`;
    if (cp.mode === 'aw') return `Te conhecem <span class="grad" style="background:linear-gradient(90deg,${MapR.AWARE.join(',')})"></span>todos`;
    return E.activeCands().slice(0, 6).map((c) => `<span class="row gap4"><span class="pdot" style="background:${c.color}"></span>${esc(c.isP ? 'Você' : c.ballot.split(' ')[0])}</span>`).join('');
  };
  A.mapMode = (el, d) => { cp.mode = d.m; U.$$('#modes button').forEach((b) => b.classList.toggle('on', b.dataset.m === d.m)); MapR.recolor(U.$('#mapsvg'), CP.colors()); U.$('#legend').innerHTML = CP.legend(); };
  CP.zoneTip = (zid) => {
    const c = camp(); const z = c.arena.zones.find((x) => x.id === zid); if (!z) return '';
    const sh = E.zoneShares(z, E.activeCands(), E.poolW(z)); const arr = Object.entries(sh).sort((a, b) => b[1] - a[1]);
    const lead = c.cands.find((x) => x.id === arr[0][0]);
    return `<b style="font-family:var(--fh);font-size:14px">${esc(z.n)}</b><div class="muted">${U.fmtInt(z.pop)} habitantes</div><div class="sep" style="margin:6px 0"></div>
      <div>Você: <b>${U.fmtPct(sh.P || 0)}</b> · te conhecem <b>${U.fmtPct(z.aw.P || 0, 0)}</b></div><div>Lidera: <b style="color:${lead.color}">${esc(lead.isP ? 'você' : lead.ballot)}</b></div>`;
  };
  CP.zoneInfo = () => {
    const c = camp(); const z = cp.sel && c.arena.zones.find((x) => x.id === cp.sel); if (!z) return '';
    const sh = E.zoneShares(z, E.activeCands(), E.poolW(z));
    const top = Object.entries(z.sal).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const tag = (v, lo, hi) => (v > 0.62 ? hi : v < 0.38 ? lo : 'Médio');
    const lean = K.spectrum(z.econ, z.soc);
    return `<div class="panel zoneinfo"><div class="row between"><div><b style="font-family:var(--fh);font-size:18px">${esc(z.n)}</b><div class="tiny muted">${U.fmtInt(z.pop)} hab. · tende ao <span style="color:${lean.c}">${lean.n}</span></div></div><button class="btn ghost iconbtn" data-act="zclose">${ic('X')}</button></div>
      <div class="zgrid"><div class="zb"><small>Seu voto</small><b>${U.fmtPct(sh.P || 0)}</b></div><div class="zb"><small>Te conhecem</small><b>${U.fmtPct(z.aw.P || 0, 0)}</b></div><div class="zb"><small>Visitas</small><b>${c.visits[z.id] || 0}</b></div>
      <div class="zb"><small>Renda</small><b style="font-size:13px">${tag(z.inc, 'Baixa', 'Alta')}</b></div><div class="zb"><small>Religiosidade</small><b style="font-size:13px">${tag(z.rel, 'Baixa', 'Alta')}</b></div><div class="zb"><small>Urbano</small><b style="font-size:13px">${z.urban > 0.5 ? 'Sim' : 'Rural'}</b></div></div>
      <div class="row gap6 wrap" style="margin-bottom:10px"><span class="tiny muted">Prioridades:</span>${top.map(([t]) => `<span class="chip">${ic(K.TOPICS[t].ic)}${K.TOPICS[t].n}</span>`).join('')}</div>
      <div class="zacts">${[['visitar', 'Visitar'], ['caminhada', 'Caminhada'], ['comicio', 'Comício'], ['carreata', 'Carreata'], ['panfletagem', 'Panfletos']].filter(([id]) => E.actionAvailable(id)).map(([id, n]) => `<button class="btn ${E.canAfford(id) ? '' : 'off'}" data-act="doAct" data-id="${id}" title="${E.ACTIONS[id].en} energia · ${E.fmtMoney(E.cost(E.ACTIONS[id].cu))}">${ic(E.ACTIONS[id].ic)}${n}</button>`).join('')}</div></div>`;
  };
  A.zclose = () => { cp.sel = null; MapR.select(U.$('#mapsvg'), null); U.$('#zinfo').innerHTML = ''; U.$('#left').innerHTML = CP.left(); };

  // ---------- lado direito ----------
  CP.rtabs = () => [['polls', 'Pesquisas', 'ChartLine'], ['news', 'Notícias', 'Newspaper'], ['camp', 'Campanha', 'ClipboardList']].map(([k, n, i]) => `<button class="${cp.rtab === k ? 'on' : ''}" data-act="rtab" data-t="${k}">${ic(i) || ic('List')}${n}</button>`).join('');
  A.rtab = (el, d) => { cp.rtab = d.t; U.$('#rtabs').innerHTML = CP.rtabs(); U.$('#right').innerHTML = CP.right(); };
  CP.right = () => {
    const c = camp(); const t = cp.rtab;
    if (t === 'news') return c.news.map((n) => `<div class="news ${n.kind === 'big' ? 'big' : ''}">${ic(n.ic)}<div>${esc(n.t)}<small>Semana ${n.w}</small></div></div>`).join('') || '<div class="muted">Sem notícias.</div>';
    if (t === 'camp') {
      const p = me();
      return `<div class="label">Promessas (${c.promises.length}/${K.MAX_PROMISES})</div>${c.promises.map((pid) => { const pr = E.promiseDef(pid); return `<div class="row small" style="margin:6px 0">${ic(K.TOPICS[pr.topic].ic)}<span>${esc(pr.t)}</span></div>`; }).join('') || '<div class="tiny muted">Nenhuma ainda.</div>'}
      <div class="sep"></div><div class="label">Apoios</div><div class="row wrap gap6" style="margin-top:6px">${c.endorse.map((id) => { const en = K.ENDORSE.find((x) => x.id === id); return `<span class="chip">${ic(en.ic)}${en.n}</span>`; }).join('') || '<span class="tiny muted">Nenhum.</span>'}</div>
      <div class="sep"></div><div class="label">Coligação</div><div class="row wrap gap6" style="margin-top:6px">${UI.partyChip(E.S.player.party)}${c.alliances.map((pid) => UI.partyChip(pid)).join('')}</div>
      ${c.vice ? `<div class="sep"></div><div class="label">Vice</div><div class="row" style="margin-top:6px">${UI.av(c.vice.av, 32)}<div><b>${esc(c.vice.name)}</b><div class="tiny muted">${c.vice.type} · ${c.vice.party}</div></div></div>` : ''}
      <div class="sep"></div><div class="label">Candidaturas</div>${c.cands.map((x) => `<div class="row" style="margin:8px 0;${x.out ? 'opacity:.4' : ''}">${UI.av(x.av, 32, { bg: x.color })}<div class="grow"><b class="small">${esc(x.isP ? 'Você' : x.ballot)}</b> <span class="dim num small">${x.num}</span><div class="tiny muted">${x.party || 'Independente'} · ${K.spectrum(x.econ, x.soc).n}${x.out ? ' · desistiu' : ''}${x.inc ? ' · no cargo' : ''}</div></div></div>`).join('')}`;
    }
    // pesquisas
    const lp = validShares();
    const act = E.activeCands();
    let h = '';
    if (lp) {
      const denom = Math.max(0.01, 1 - lp.und - (lp.pool || 0));
      const rows = act.map((x) => ({ x, v: (lp.res[x.id] || 0) / denom })).sort((a, b) => b.v - a.v);
      const prev = c.polls.filter((p) => !p.sep && p.stage === c.stage).slice(-2, -1)[0];
      h += `<div class="row between"><div class="label">${esc(lp.inst || 'Pesquisa')} · S${lp.w}</div><span class="tiny muted">±${(lp.moe * 100).toFixed(1)} p.p.</span></div><div class="tiny muted" style="margin-bottom:10px">${c.sys === 'list_open' ? 'Entre os principais nomes' : 'Votos válidos'} · indecisos ${U.fmtPct(lp.und, 0)}</div>`;
      rows.slice(0, 8).forEach(({ x, v }) => {
        let delta = '';
        if (prev && prev.res[x.id] != null) { const pv = prev.res[x.id] / Math.max(0.01, 1 - prev.und - (prev.pool || 0)); const dd = (v - pv) * 100; if (Math.abs(dd) >= 0.5) delta = `<span class="tiny ${dd > 0 ? 'good' : 'bad'}">${dd > 0 ? '▲' : '▼'}${Math.abs(dd).toFixed(1)}</span>`; }
        h += `<div class="rank ${x.isP ? 'me' : ''}">${UI.av(x.av, 32, { bg: x.color })}<div style="min-width:0"><div class="nm">${esc(x.isP ? 'Você' : x.ballot)} ${delta}</div>${UI.bar(Math.min(1, v * (c.sys === 'list_open' ? 4 : 1.6)), x.color, 'thin')}</div><div class="pc">${U.fmtPct(v, c.sys === 'list_open' ? 1 : 0)}</div></div>`;
      });
    }
    if (c.sys === 'list_open' && lp && lp.list) {
      const L = lp.list;
      h += `<div class="sep"></div><div class="label">Sua projeção</div><div class="statgrid" style="margin-top:6px"><div class="sb"><small>Seus votos</small><b>${U.fmtInt(L.votes)}</b></div><div class="sb"><small>${L.elected ? 'Folga' : 'Faltam'}</small><b class="${L.elected ? 'good' : 'bad'}">${U.fmtInt(Math.abs(L.needed))}</b></div><div class="sb"><small>Quociente</small><b>${U.fmtInt(L.qe)}</b></div><div class="sb"><small>Cadeiras do partido</small><b>${L.partySeats}</b></div></div>
      <div class="tiny muted" style="margin:8px 0 4px">Linha verde: seus votos · tracejada: corte estimado</div>${MapR.votesChart(c.polls.filter((p) => p.stage === c.stage))}`;
    } else if (lp) h += `<div class="sep"></div><div class="label" style="margin-bottom:6px">Evolução</div>${MapR.lineChart(c.polls, act.slice(0, 6), { stage: c.stage })}`;
    if (lp && lp.seats) {
      const seats = lp.seats.seats; const parts = Object.entries(seats).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).map(([pid, n]) => ({ n, color: (E.party(pid) || { color: '#64748b' }).color, hl: pid === E.S.player.party, pid }));
      h += `<div class="sep"></div><div class="label">Projeção de cadeiras</div>${MapR.hemicycle(parts, lp.seats.total, { majority: lp.seats.majority, center: seats[E.S.player.party] || 0 })}<div class="row wrap gap6">${parts.map((p) => `<span class="chip"><span class="pdot" style="background:${p.color}"></span>${p.pid} ${p.n}</span>`).join('')}</div>${c.sys === 'list_closed' ? `<div class="tiny muted" style="margin-top:6px">Você é o ${c.listPos}º da lista: precisa que o partido faça ${c.listPos} cadeira(s).</div>` : ''}`;
    }
    if (lp && lp.ev) { const evP = lp.ev.P || 0; h += `<div class="sep"></div><div class="label">Delegados projetados</div><div class="row between"><b class="num" style="font-size:22px;color:var(--acc)">${evP}</b><span class="muted">de 270 necessários</span></div>${UI.bar(evP / 538, 'var(--acc)', 'tall')}`; }
    if (c.flags.internal === c.week - 1 || c.flags.internal === c.week) h += CP.internal();
    return h || '<div class="muted">A primeira pesquisa sai no fim da semana.</div>';
  };
  CP.internal = () => {
    const c = camp(); let h = `<div class="sep"></div><div class="label">${ic('ChartPie')} Pesquisa interna por segmento</div>`;
    const segs = ['pobres', 'ricos', 'religiosos', 'jovens', 'progressistas', 'conservadores'];
    segs.forEach((sg) => {
      let num = 0, den = 0; c.arena.zones.forEach((z) => { const w = K.SEGMENTS[sg].w(z) * z.share; const sh = E.zoneShares(z, E.activeCands(), E.poolW(z)); num += (sh.P || 0) * w; den += w; });
      const v = num / den; h += `<div class="row small" style="margin:6px 0"><span style="width:110px" class="muted">${K.SEGMENTS[sg].n}</span><div class="grow">${UI.bar(Math.min(1, v * (c.sys === 'list_open' ? 8 : 1.6)), 'var(--info)', 'thin')}</div><b class="num">${U.fmtPct(v, 1)}</b></div>`;
    });
    return h;
  };

  // ---------- rodapé ----------
  CP.bottom = () => {
    const c = camp();
    const wk = Array.from({ length: c.weeks }, (_, i) => i + 1).map((w) => `<div class="wk ${w === c.week ? 'now' : w < c.week ? 'past' : ''}"><b>${w}</b>${c.debates.includes(w) ? ic('Tv') + ' debate' : w === c.weeks ? ic('Vote') + ' urnas' : w === 3 && E.country().tvFree && c.stage !== 'runoff' ? ic('Radio') + ' TV' : '&nbsp;'}</div>`).join('');
    const last = c.week >= c.weeks;
    return `<div class="weeks">${wk}</div>
      <button class="btn primary big endweek" data-act="endWeek">${last ? ic('Vote') + ' Ir para a eleição!' : ic('ArrowRight') + ' Encerrar semana'}</button>`;
  };

  A.endWeek = async () => {
    if (CP.busy || !camp()) return;
    CP.busy = true;
    try { await endWeekInner(); } finally { CP.busy = false; }
  };
  const endWeekInner = async () => {
    const c = camp();
    if (c.debates.includes(c.week) && !c.debatesDone.includes(c.week)) {
      const go = await UI.confirm('Debate na TV', 'Há um debate marcado para esta semana. Faltar pega muito mal (cadeira vazia). O que vai fazer?', 'Ir ao debate', 'Faltar');
      if (go) return Scenes.debate();
      E.skipDebate();
    }
    if (c.energy >= 3 && c.week < c.weeks) { if (!(await UI.confirm('Ainda tem energia', `Você ainda tem ${c.energy} pontos de energia nesta semana. Encerrar mesmo assim?`, 'Encerrar'))) return; }
    const before = (validShares() || { res: {} }).res.P || 0;
    const out = E.endWeek(); E.save();
    if (!out.electionNow) { UI.banner(`Semana ${c.week}`, stageName()); Sound.sfx('select2'); }
    if (out.donations) setTimeout(() => UI.toast(`Doações da semana: +${E.fmtMoney(out.donations)}`, 'g', 'HandCoins'), 300);
    CP.update();
    for (const ev of out.events) { await U.sleep(450); await UI.eventModal(ev); CP.update(); }
    const p = out.poll; const denom = Math.max(0.01, 1 - p.und - (p.pool || 0)); const now = (p.res.P || 0) / denom; const prevV = before / Math.max(0.01, 1 - (c.polls[c.polls.length - 2] || p).und - ((c.polls[c.polls.length - 2] || p).pool || 0));
    const d = (now - prevV) * 100;
    if (c.sys !== 'list_open') UI.toast(`Nova pesquisa: você tem ${U.fmtPct(now, 0)} ${Math.abs(d) >= 0.5 ? `(${d > 0 ? '+' : ''}${d.toFixed(1)})` : ''}`, d >= 0 ? 'g' : 'b', 'ChartColumn');
    else if (p.list) UI.toast(`Projeção: ${U.fmtInt(p.list.votes)} votos — ${p.list.elected ? 'dentro!' : 'faltam ' + U.fmtInt(p.list.needed)}`, p.list.elected ? 'g' : 'b', 'ChartColumn');
    E.save();
    if (out.electionNow) { await U.sleep(600); await Scenes.electionDay(); }
  };

  // ---------- eventos ----------
  UI.eventModal = (inst) => new Promise((resolve) => {
    Sound.chime();
    if (inst.special) {
      UI.modal(`<div class="row gap16" style="align-items:flex-start"><div class="evicon bad">${ic(inst.ic)}</div><div><h2>${inst.title}</h2><p class="muted" style="line-height:1.55">${inst.text}</p></div></div><div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn primary" data-mclose>Continuar</button></div>`, { close: false }).then(resolve);
      Sound.bad(); return;
    }
    const ev = inst.ev, ctx = inst.ctx, p = E.S.player;
    const off = !!inst.mandate;
    const choices = ev.ch.map((ch, i) => {
      let tag = '';
      if (ch.test) { const v = p.attrs[ch.test.attr]; const pr = U.clamp(0.5 + (v - ch.test.diff) / 60, 0.08, 0.95); const an = { ora: 'Oratória', int: 'Inteligência', car: 'Carisma', art: 'Articulação', intg: 'Integridade' }[ch.test.attr]; tag = `<span class="chip" style="color:${pr > 0.6 ? 'var(--good)' : pr > 0.4 ? 'var(--warn)' : 'var(--bad)'}">${ic('Dices')} ${an} · ${Math.round(pr * 100)}%</span>`; }
      if (ch.risk) tag += `<span class="chip" style="color:var(--bad)">${ic('TriangleAlert')} arriscado</span>`;
      return `<button class="btn choice" data-ch="${i}"><span>${esc(E.fillText(ch.t, ctx))}</span>${tag}</button>`;
    }).join('');
    UI.modal(`<div class="row gap16" style="align-items:flex-start"><div class="evicon">${ic(ev.ic)}</div><div class="grow"><div class="label">${off ? 'Mandato' : 'Evento de campanha'}</div><h2>${esc(E.fillText(ev.title, ctx))}</h2><p class="muted" style="line-height:1.55;margin-bottom:0">${esc(E.fillText(ev.text, ctx))}</p></div></div><div class="col gap6" style="margin-top:18px">${choices}</div>`, {
      close: false,
      mount: (el) => {
        el.querySelectorAll('[data-ch]').forEach((b) => (b.onclick = () => {
          Sound.sfx('click');
          const r = off ? E.resolveMandateChoice(inst, +b.dataset.ch) : E.resolveChoice(inst, +b.dataset.ch);
          const good = r.okTest !== false && !r.bad;
          UI.setModal(`<div class="row gap16" style="align-items:flex-start"><div class="evicon ${good ? '' : 'bad'}">${ic(good ? 'Check' : 'X')}</div><div class="grow"><h2>${r.okTest === true ? 'Deu certo!' : r.okTest === false ? 'Não deu certo…' : 'Decisão tomada'}</h2>${r.msg ? `<p class="muted">${esc(r.msg)}</p>` : ''}${UI.fxList(r.res)}</div></div><div class="row" style="justify-content:flex-end;margin-top:16px"><button class="btn primary" id="evok">Continuar</button></div>`);
          if (good) Sound.good(); else Sound.bad();
          U.$('#evok').onclick = () => { UI.closeModal(); resolve(); };
        }));
      },
    });
  });

  // ---------- painéis ----------
  CP.panel = (kind) => {
    const c = camp();
    if (kind === 'promises') {
      const render = () => {
        const list = E.promiseList(); const costNow = E.promiseCost(), cap = E.promiseCap();
        return `<h2>${ic('ScrollText')} Promessas de campanha</h2><div class="muted small" style="margin:4px 0 12px">Promessas aumentam sua força nos temas e atraem quem concorda com a direção delas. Prometer demais (acima do orçamento) derruba sua credibilidade — e no mandato você será cobrado(a).</div>
          <div class="row between"><span class="chip">${c.promises.length}/${K.MAX_PROMISES} promessas</span><span class="small ${costNow > cap ? 'bad' : 'muted'}">Custo ${costNow} / orçamento ${cap}</span></div>${UI.bar(costNow / cap, costNow > cap ? 'var(--bad)' : 'var(--acc)')}
          <div class="col gap6" style="margin-top:12px">${list.map((pr) => { const on = c.promises.includes(pr.id); const sp = K.spectrum(pr.e, pr.s); return `<div class="act" data-pid="${pr.id}" style="${on ? 'border-color:var(--acc);background:rgba(var(--accRGB),.1)' : ''}"><div class="ico">${ic(K.TOPICS[pr.topic].ic)}</div><div><h5>${esc(pr.t)}</h5><p>${K.TOPICS[pr.topic].n} · <span style="color:${sp.c}">${sp.n}</span></p></div><div class="cost">${'●'.repeat(pr.cost)}<br>${on ? '<span class="good">✓ assumida</span>' : ''}</div></div>`; }).join('')}</div>`;
      };
      UI.modal(render(), { cls: 'wide', mount: (el) => { const bind = () => el.querySelectorAll('[data-pid]').forEach((r) => (r.onclick = () => { const res = E.togglePromise(r.dataset.pid); UI.fx(res, r); UI.setModal(render()); bind(); CP.update(); })); bind(); } }).then(() => CP.update());
    }
    if (kind === 'endorse') {
      const render = () => `<h2>${ic('Handshake')} Buscar apoios</h2><div class="muted small" style="margin:4px 0 12px">Cada tentativa custa 2 de energia. A chance depende da afinidade ideológica, da sua articulação e de como você está nas pesquisas.</div>
        <div class="grid3">${K.ENDORSE.map((en) => { const got = c.endorse.includes(en.id); const tried = c.flags['tried_' + en.id] === c.week; const ch = E.endorseChance(en.id); return `<div class="card ${got || tried || c.energy < 2 ? '' : 'click'}" data-eid="${got || tried ? '' : en.id}" style="${got ? 'border-color:var(--good)' : ''}"><div class="row">${ic(en.ic)}<b>${en.n}</b></div><div class="tiny muted" style="margin:6px 0">${en.d}</div>${got ? '<span class="chip good">✓ apoiando você</span>' : tried ? '<span class="chip">tente na próxima semana</span>' : `<div class="row between tiny"><span class="muted">Chance</span><b>${Math.round(ch * 100)}%</b></div>${UI.bar(ch, ch > 0.6 ? 'var(--good)' : ch > 0.35 ? 'var(--warn)' : 'var(--bad)', 'thin')}`}</div>`; }).join('')}</div>`;
      UI.modal(render(), { cls: 'wide', mount: (el) => { const bind = () => el.querySelectorAll('[data-eid]').forEach((r) => { if (!r.dataset.eid) return; r.onclick = () => { if (c.energy < 2) return UI.fx({ ok: false, msg: 'Energia insuficiente.' }); const res = E.seekEndorse(r.dataset.eid); UI.fx(res, r); if (!res.fail) UI.confetti(40); UI.setModal(render()); bind(); CP.update(); }; }); bind(); } }).then(() => CP.update());
    }
    if (kind === 'alliance') {
      const render = () => {
        const parties = E.S.parties.filter((pt) => pt.id !== E.S.player.party && !c.alliances.includes(pt.id) && (!pt.regions || pt.regions.includes(c.arena.region)));
        return `<h2>${ic('Users')} Alianças partidárias</h2><div class="muted small" style="margin:4px 0 12px">Coligação traz dinheiro, tempo de TV e eleitores do partido aliado. Partidos com candidato próprio só aceitam se você estiver bem à frente — e aí o candidato deles desiste e te apoia. Alianças distantes irritam sua base.</div>
          ${c.alliances.length ? `<div class="row wrap gap6" style="margin-bottom:10px"><span class="label">Já com você:</span>${c.alliances.map(UI.partyChip).join('')}</div>` : ''}
          <div class="col gap6">${parties.map((pt) => { const inf = E.allianceInfo(pt.id); const tried = c.flags['al_' + pt.id] === c.week; return `<div class="card ${tried || c.energy < 2 ? '' : 'click'} prow" data-pid="${tried ? '' : pt.id}" style="grid-template-columns:6px 1fr 130px 120px"><div class="cbar" style="background:${pt.color}"></div><div><h4>${pt.id} <span class="muted small">${esc(pt.name)}</span></h4><div class="tiny muted">${K.spectrum(pt.e, pt.s).n}${inf.theirCand ? ` · tem candidato: <b>${esc(inf.theirCand.ballot)}</b>` : ''}${inf.warn ? ' · <span class="bad">base vai reclamar</span>' : ''}</div></div><div><div class="tiny muted">Tamanho</div>${UI.bar(pt.size, pt.color, 'thin')}</div><div>${tried ? '<span class="chip">recusou esta semana</span>' : `<div class="tiny muted">Chance ${Math.round(inf.chance * 100)}%</div>${UI.bar(inf.chance, inf.chance > 0.5 ? 'var(--good)' : 'var(--warn)', 'thin')}`}</div></div>`; }).join('')}</div>`;
      };
      UI.modal(render(), { cls: 'wide', mount: (el) => { const bind = () => el.querySelectorAll('[data-pid]').forEach((r) => { if (!r.dataset.pid) return; r.onclick = () => { if (c.energy < 2) return UI.fx({ ok: false, msg: 'Energia insuficiente.' }); const res = E.proposeAlliance(r.dataset.pid); UI.fx(res, r); if (!res.fail) UI.confetti(60); UI.setModal(render()); bind(); CP.update(); }; }); bind(); } }).then(() => CP.update());
    }
    if (kind === 'vice') {
      const opts = E.viceOptions(); const o = E.officeDef(c.oid);
      UI.modal(`<h2>${ic('UserPlus')} Escolher ${o.vice}</h2><div class="muted small" style="margin:4px 0 14px">Um bom vice complementa você e atrai segmentos onde você é fraco(a).</div><div class="grid3">${opts.map((v, i) => `<div class="card click" data-vi="${i}" style="text-align:center">${UI.av(v.av, 88, { style: 'margin:0 auto 10px' })}<b>${esc(v.name)}</b><div class="tiny muted">${v.type} · ${v.party}</div><div class="row wrap gap4 center" style="margin-top:8px">${Object.keys(v.seg).map((s) => `<span class="chip good">+ ${K.SEGMENTS[s].n}</span>`).join('')}</div></div>`).join('')}</div>`, {
        cls: 'wide', mount: (el) => el.querySelectorAll('[data-vi]').forEach((r) => (r.onclick = () => { const res = E.chooseVice(opts[+r.dataset.vi]); UI.closeModal(); UI.fx(res); UI.confetti(50); CP.update(); })),
      });
    }
    if (kind === 'attack') {
      const opps = E.activeCands().filter((x) => !x.isP);
      const lp = validShares();
      UI.modal(`<h2>${ic('Swords')} Atacar adversário</h2><div class="muted small" style="margin:4px 0 14px">Criticar propostas é seguro; atacar o histórico custa reputação; ataques pessoais podem virar contra você.</div>
        <div class="col gap6">${opps.map((x) => `<div class="card"><div class="row">${UI.av(x.av, 40, { bg: x.color })}<div class="grow"><b>${esc(x.ballot)}</b><div class="tiny muted">${x.party || ''} · ${lp ? U.fmtPct((lp.res[x.id] || 0) / Math.max(0.01, 1 - lp.und - (lp.pool || 0)), 0) : '?'} nas pesquisas</div></div>
        <button class="btn sm" data-atk="${x.id}" data-tone="propostas">Propostas</button><button class="btn sm" data-atk="${x.id}" data-tone="historico">Histórico</button><button class="btn sm danger" data-atk="${x.id}" data-tone="pessoal">Pessoal</button></div></div>`).join('')}</div>`, {
        cls: 'wide', mount: (el) => el.querySelectorAll('[data-atk]').forEach((b) => (b.onclick = () => { const res = E.attack(b.dataset.atk, b.dataset.tone); UI.closeModal(); UI.fx(res); CP.update(); })),
      });
    }
  };
  CP.outlets = () => {
    const c = camp();
    UI.modal(`<h2>${ic('Podcast')} Entrevistas e podcasts</h2><div class="muted small" style="margin:4px 0 14px">Responda às perguntas ao vivo. Coerência com suas ideias, afinidade com o público e sua oratória/inteligência definem o desempenho. Cada veículo pode ser repetido a cada 2 semanas, com retorno menor.</div>
      <div class="grid3">${E.outlets().map((o) => { const cd = E.outletCooldown(o.id); const can = !cd && c.energy >= o.energy; const sp = K.spectrum(o.lean[0], o.lean[1]); return `<div class="card ${can ? 'click' : 'locked'}" data-oid="${can ? o.id : ''}"><div class="row">${ic(o.ic)}<b>${o.n}</b></div><div class="tiny muted" style="margin:6px 0;min-height:30px">${o.d}</div><div class="row wrap gap4"><span class="chip">${o.type}</span><span class="chip" style="color:${sp.c}">${sp.n}</span><span class="chip">${ic('Zap')}${o.energy}</span></div><div class="row between tiny" style="margin-top:8px"><span class="muted">Alcance</span>${'▮'.repeat(Math.max(1, Math.round(o.reach * 25)))}</div>${cd ? '<div class="tiny warn" style="margin-top:4px">Volte na próxima semana</div>' : ''}</div>`; }).join('')}</div>`, {
      cls: 'xwide', mount: (el) => el.querySelectorAll('[data-oid]').forEach((r) => { if (!r.dataset.oid) return; r.onclick = () => { const o = K.OUTLETS.find((x) => x.id === r.dataset.oid); UI.closeModal(); setTimeout(() => Scenes.interview(o), 200); }; }),
    });
  };
})();
