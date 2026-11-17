/* Carreira: semestres entre eleições, mandato (executivo/legislativo), pré-campanha, histórico e fim de jogo */
(function () {
  const S = UI.screens, A = UI.acts, E = window.Engine, K = window.CONTENT;
  const ic = U.ic, esc = U.esc;

  const semKey = () => E.S.year * 10 + E.S.sem;
  const slots = () => (E.S.office ? (E.S.office.kind === 'exec' ? 2 : 3) : 3);
  const used = () => { const s = E.S; if (s.semKey !== semKey()) { s.semKey = semKey(); s.semActs = []; } return s.semActs; };

  S.career = () => {
    const s = E.S; if (!s) return S.title();
    if (s.camp) return S.campaign();
    if (s.over) return S.gameover();
    const p = s.player, off = s.office, c = E.country();
    const elec = E.isElectionTime();
    const up = E.upcoming(4);
    const u = used();
    const leg = off && off.kind === 'leg';
    return {
      html: `<div class="screen"><div class="career">
      <div class="panel col" style="padding:18px;overflow:auto">
        <div class="pcard" style="padding:0">${UI.av(p.av, 120, { bg: (E.playerParty() || { color: '#334155' }).color, style: 'margin:0 auto 10px' })}
          <h3 style="font-size:22px">${esc(p.ballot)}</h3><div class="muted small">${esc(p.name)} · ${E.age()} anos</div>
          <div class="row center gap6 wrap" style="margin-top:8px">${UI.partyChip(p.party)}${UI.specChip(p.econ, p.soc)}${s.leaderOf && s.leaderOf === p.party ? '<span class="chip" style="color:var(--acc2)">' + ic('Crown') + ' líder</span>' : ''}</div></div>
        <div class="statgrid"><div class="sb"><small>Fama</small><b>${Math.round(p.fame)}</b>${UI.bar(p.fame / 100, 'var(--acc2)', 'thin')}</div><div class="sb"><small>Reputação</small><b>${Math.round(p.rep)}</b>${UI.bar(p.rep / 100, '#38bdf8', 'thin')}</div>
          <div class="sb"><small>Patrimônio</small><b style="font-size:16px">${E.fmtMoney(p.money)}</b></div><div class="sb"><small>Apoio no partido</small><b>${Math.round(s.partySupport)}%</b></div></div>
        <div class="sep"></div>
        ${[['car', 'Carisma'], ['ora', 'Oratória'], ['int', 'Inteligência'], ['intg', 'Integridade'], ['art', 'Articulação']].map(([k, n]) => `<div class="row small" style="margin:5px 0"><span style="width:92px" class="muted">${n}</span><div class="grow">${UI.bar(p.attrs[k] / 100, 'var(--acc)', 'thin')}</div><b class="num">${p.attrs[k]}</b></div>`).join('')}
        <div class="sep"></div>
        <div class="col gap6"><button class="btn" data-act="changeParty">${ic('Repeat')} Trocar de partido</button><button class="btn" data-act="newPartyC">${ic('Flag')} Fundar partido</button><button class="btn" data-act="legacy">${ic('Award')} Legado</button><button class="btn ghost" data-act="toMenu">${ic('LogOut')} Menu principal</button></div>
      </div>
      <div class="panel col" style="padding:20px;overflow:auto">
        <div class="row between"><div><div class="label">${c.name} · ${s.sem}º semestre</div><h2 style="font-size:34px">${s.year}</h2></div><div class="row gap6"><button class="btn iconbtn" data-act="settings">${ic('Settings')}</button></div></div>
        ${elec ? `<div class="cta" style="margin:14px 0"><div class="row between wrap gap16"><div><div class="label" style="color:var(--acc2)">Período eleitoral</div><h3 style="font-size:24px">Eleições ${s.year}: hora de decidir!</h3><div class="small muted">Em disputa: ${E.officesInYear(s.year).map((o) => o.name.replace(/\s*\(.*\)/, '')).join(', ')}</div></div><button class="btn primary huge" data-act="toElection">${ic('Vote')} Escolher candidatura</button></div></div>` : ''}
        ${off ? mandateHtml(off) : `<div class="card" style="margin:12px 0"><div class="row">${ic('Briefcase')}<div><b>Sem mandato</b><div class="small muted">Use os semestres para ganhar fama, dinheiro e experiência antes da próxima eleição.</div></div></div></div>`}
        <div class="row between" style="margin-top:12px"><div class="label">Agenda do semestre</div><span class="chip">${u.length}/${slots()} ações</span></div>
        <div class="grid3" style="margin-top:8px;grid-template-columns:repeat(${slots()},1fr)">${Array.from({ length: slots() }, (_, i) => u[i] ? `<div class="slot filled">${ic(u[i].ic)}${esc(u[i].n)}</div>` : `<div class="slot">${ic('Plus')} livre</div>`).join('')}</div>
        ${u.length < slots() ? `${leg ? `<div class="label" style="margin-top:14px">Atuação parlamentar</div><div class="grid2" style="margin-top:8px">${K.LEG_ACTIONS.map((a) => `<div class="act" data-act="legAct" data-id="${a.id}"><div class="ico">${ic(a.ic)}</div><div><h5>${a.n}</h5><p>${a.d}</p></div><div class="cost"></div></div>`).join('')}</div>` : ''}
          <div class="label" style="margin-top:14px">${off ? 'Agenda pessoal' : 'Pré-campanha'}</div><div class="grid2" style="margin-top:8px">${K.PRE_ACTIONS.map((a) => `<div class="act" data-act="preAct" data-id="${a.id}"><div class="ico">${ic(a.ic) || ic('Star')}</div><div><h5>${a.n}</h5><p>${a.d}</p></div><div class="cost"></div></div>`).join('')}</div>` : ''}
        <div class="row" style="justify-content:flex-end;margin-top:18px"><button class="btn primary big" data-act="endSem">${elec ? 'Não concorrer e avançar' : 'Avançar semestre'} ${ic('ArrowRight')}</button></div>
      </div>
      <div class="panel col" style="padding:18px;overflow:auto">
        <div class="label">Próximas eleições</div>
        ${up.map((e) => `<div class="card" style="margin-top:8px;padding:10px 12px"><div class="row between"><b class="num" style="font-size:18px">${e.year}</b>${e.year === s.year ? '<span class="chip" style="color:var(--acc2)">este ano</span>' : ''}</div>${e.offices.map((o) => { const ok = E.canRun(o.id, e.year).ok; return `<div class="row small" style="margin-top:4px;color:${ok ? 'var(--text)' : 'var(--dim)'}">${ic(ok ? 'Check' : 'Lock')} ${o.name}</div>`; }).join('')}</div>`).join('')}
        <div class="sep"></div><div class="label">Trajetória</div>
        <div class="tl" style="margin-top:10px">${s.history.map((h) => `<div class="it ${h.won ? 'won' : 'lost'}"><b>${h.year} · ${esc(h.officeName)}</b><div class="muted tiny">${esc(h.place)} · ${h.won ? 'eleito(a)' : h.pos + 'º lugar'} · ${U.fmtInt(h.votes)} votos (${U.fmtPct(h.pct, 1)})</div></div>`).join('') || '<div class="tiny muted">Ainda sem eleições disputadas.</div>'}
        ${p.held.length ? `<div class="it won"><b>Antes de ${E.startYear(s.country)}</b><div class="muted tiny">${p.held.map((x) => (E.officeDef(x) || { name: x }).name).join(', ')}</div></div>` : ''}</div>
        ${s.log.length ? `<div class="sep"></div><div class="label">Registro</div>${s.log.slice(0, 6).map((l) => `<div class="tiny muted" style="margin-top:6px">${l.y}: ${esc(l.t)}</div>`).join('')}` : ''}
      </div></div></div>`,
      mount: () => {
        Sound.music(off ? 'mandate' : 'menu');
        if (s.flags.reachedTop && !s.flags.topShown) { s.flags.topShown = true; E.save(); setTimeout(() => topModal(), 1400); }
      },
    };
  };

  function mandateHtml(off) {
    const o = E.officeDef(off.id); const kept = off.kept.length, tot = off.promises.length;
    let h = `<div class="card" style="margin:12px 0;border-color:rgba(var(--accRGB),.4)"><div class="row between wrap"><div><div class="label">Mandato ${off.start}–${off.end}${off.consec > 1 ? ` · ${off.consec}º mandato` : ''}</div><h3 style="font-size:22px">${o.name}</h3><div class="small muted">${esc(off.place)}</div></div><div>${MapR.gauge(off.appr, 'APROVAÇÃO')}</div></div>
      <div class="row between small" style="margin-top:6px"><span class="muted">Promessas cumpridas</span><b>${kept}/${tot}</b></div>${UI.bar(tot ? kept / tot : 0, 'var(--good)')}
      ${tot ? `<div class="row wrap gap4" style="margin-top:8px">${off.promises.map((pid) => { const pr = E.promiseDef(pid); return `<span class="chip" style="${off.kept.includes(pid) ? 'color:var(--good);border-color:rgba(34,197,94,.4)' : ''}">${off.kept.includes(pid) ? ic('Check') : ic(K.TOPICS[pr.topic].ic)} ${esc(pr.t)}</span>`; }).join('')}</div>` : ''}</div>`;
    if (off.kind === 'exec') {
      const list = E.projectList();
      const active = off.projects.filter((x) => !x.done);
      h += `<div class="row between"><div class="label">Programas de governo</div><span class="chip">${ic('Coins')} Orçamento do semestre: <b class="num">${Math.round(off.budget)}</b></span></div>
        ${active.length ? `<div class="col gap6" style="margin-top:8px">${active.map((x) => { const pj = list.find((y) => y.id === x.id); return `<div class="row small"><span class="grow">${ic(K.TOPICS[pj.topic].ic)} ${esc(pj.n)}</span><span class="muted">${x.left} sem. restante(s)</span><div style="width:90px">${UI.bar(1 - x.left / pj.dur, 'var(--acc2)', 'thin')}</div></div>`; }).join('')}</div>` : ''}
        <div class="grid2" style="margin-top:8px">${list.map((pj) => { const run = off.projects.some((x) => x.id === pj.id && !x.done); const done = off.projects.some((x) => x.id === pj.id && x.done); const can = !run && off.budget >= pj.cost; return `<div class="act ${can ? '' : 'dis'}" data-act="launch" data-id="${pj.id}" style="${done ? 'border-color:rgba(34,197,94,.4)' : ''}"><div class="ico">${ic(K.TOPICS[pj.topic].ic)}</div><div><h5>${esc(pj.n)}</h5><p>${K.TOPICS[pj.topic].n} · ${pj.dur} semestre(s)${done ? ' · <span class="good">concluído</span>' : run ? ' · em andamento' : ''}</p></div><div class="cost"><b>${pj.cost}</b> orç.<br>+${pj.appr} apr.</div></div>`; }).join('')}</div>`;
    }
    return h;
  }

  A.launch = (el, d) => { const r = E.launchProject(d.id); UI.fx(r, el); E.save(); UI.refresh(); };
  A.preAct = (el, d) => {
    const u = used(); if (u.length >= slots()) return UI.toast('Agenda do semestre cheia.', 'b', 'Calendar');
    const a = K.PRE_ACTIONS.find((x) => x.id === d.id); const r = E.doPreAction(d.id); u.push({ n: a.n, ic: a.ic }); UI.fx(r, el); E.save(); UI.refresh();
  };
  A.legAct = async (el, d) => {
    const u = used(); if (u.length >= slots()) return UI.toast('Agenda do semestre cheia.', 'b', 'Calendar');
    const a = K.LEG_ACTIONS.find((x) => x.id === d.id);
    let topic = null;
    if (a.topic) {
      topic = await UI.modal(`<h2>${ic('ScrollText')} Tema do projeto de lei</h2><div class="muted small" style="margin:4px 0 12px">Projetos alinhados com suas promessas contam como promessa cumprida.</div><div class="grid3">${K.TOPIC_IDS.map((t) => { const prom = E.S.office.promises.some((pid) => (E.promiseDef(pid) || {}).topic === t && !E.S.office.kept.includes(pid)); return `<div class="card click" data-tp="${t}" style="${prom ? 'border-color:var(--acc)' : ''}">${ic(K.TOPICS[t].ic)} <b>${K.TOPICS[t].n}</b>${prom ? '<div class="tiny good">promessa pendente</div>' : ''}</div>`; }).join('')}</div>`, {
        cls: 'wide', mount: (m) => m.querySelectorAll('[data-tp]').forEach((x) => (x.onclick = () => UI.closeModal(x.dataset.tp))),
      });
      if (!topic) return;
    }
    const r = E.doLegAction(d.id, topic); u.push({ n: a.n, ic: a.ic }); UI.fx(r, el); E.save(); UI.refresh();
  };
  let semBusy = false;
  A.endSem = async () => {
    if (semBusy) return; semBusy = true;
    try { await endSemInner(); } finally { semBusy = false; }
  };
  const endSemInner = async () => {
    const s = E.S;
    if (E.isElectionTime() && !(await UI.confirm('Pular a eleição?', `Há eleições em ${s.year}. Se avançar, você não concorre a nada este ano.`, 'Pular eleição'))) return;
    if (used().length < slots() && !(await UI.confirm('Agenda livre', 'Você ainda tem ações disponíveis neste semestre. Avançar mesmo assim?', 'Avançar'))) return;
    // evento de mandato
    const ev = E.mandateEvent(); if (ev) await UI.eventModal(ev);
    const wasElection = E.isElectionTime();
    const rep = E.endSemester();
    if (wasElection) { /* pulou a eleição: o ano já avançou */ }
    E.save();
    UI.banner(`${s.year}`, `${s.sem}º semestre`); Sound.sfx('select2');
    UI.refresh();
    if (rep.lines.length || rep.ended) {
      await U.sleep(500);
      await UI.modal(`<h2>${ic('ClipboardList') || ic('FileText')} Balanço do semestre</h2>${UI.fxList(rep.lines)}${rep.ended ? `<div class="card" style="margin-top:12px"><b>Fim do mandato de ${esc(rep.ended.name)}</b><div class="small muted">Promessas cumpridas: ${rep.ended.kept} · descumpridas: ${rep.ended.broke} · aprovação final ${Math.round(rep.ended.appr)}%</div></div>` : ''}<div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn primary" data-mclose>Continuar</button></div>`, { cls: 'narrow' });
    }
    if (s.over) return UI.go('gameover');
    UI.refresh();
    if (E.isElectionTime()) { Sound.levelUp(); UI.toast(`Eleições ${s.year}! Escolha sua candidatura.`, 'big', 'Vote'); }
  };
  A.toElection = () => { UI.state.firstFlow = false; UI.go('office', { first: false }); };
  A.changeParty = () => UI.go('party', { first: false });
  A.newPartyC = () => { UI.params = { first: false }; UI.acts.newParty(); };
  A.toMenu = () => { E.save(); UI.go('title'); };
  A.legacy = () => legacyModal();

  function legacyModal(title = 'Seu legado') {
    const s = E.S; const wins = s.history.filter((h) => h.won);
    return UI.modal(`<div style="text-align:center">${UI.av(s.player.av, 120, { bg: (E.playerParty() || { color: '#334155' }).color, mood: 'happy', style: 'margin:0 auto 10px' })}<h2>${title}</h2><div class="muted">${esc(s.player.name)}</div>
      <div style="font-family:var(--fh);font-size:64px;font-weight:900;color:var(--acc2)">${U.fmtInt(E.legacyScore())}</div><div class="label">pontos de legado</div></div>
      <div class="statgrid" style="grid-template-columns:repeat(4,1fr)"><div class="sb"><small>Eleições vencidas</small><b>${wins.length}</b></div><div class="sb"><small>Disputadas</small><b>${s.history.length}</b></div><div class="sb"><small>Votos totais</small><b>${U.fmtCompact(s.totalVotes)}</b></div><div class="sb"><small>Fama</small><b>${Math.round(s.player.fame)}</b></div></div>
      <div class="tl" style="margin-top:16px">${s.history.map((h) => `<div class="it ${h.won ? 'won' : 'lost'}"><b>${h.year} · ${esc(h.officeName)}</b> <span class="muted tiny">${esc(h.place)} — ${h.won ? 'eleito(a)' : h.pos + 'º'}</span></div>`).join('')}</div>`, { cls: 'wide' });
  }
  function topModal() {
    const o = E.S.history.find((h) => h.won && E.officeDef(h.office).top);
    UI.confetti(300); Sound.fanfare(); setTimeout(() => Sound.crowd(4, 1.5), 800);
    legacyModal(`Você chegou ao topo: ${o ? esc(o.officeName) : 'chefe de governo'}!`);
  }

  S.gameover = () => {
    const s = E.S; const r = s.over ? s.over.reason : 'end';
    const t = { age: ['Aposentadoria', 'Depois de uma longa trajetória, é hora de pendurar as chuteiras.'], rep: ['Carreira encerrada', 'Sua reputação chegou a zero. Nenhum partido quer seu nome na urna.'] }[r] || ['Fim de jogo', ''];
    return {
      html: `<div class="screen title"><div class="logo" style="max-width:640px">${UI.av(s.player.av, 180, { mood: r === 'rep' ? 'sad' : 'smile', style: 'margin:0 auto 14px' })}<h1 style="font-size:64px">${t[0]}</h1><div class="muted" style="font-size:17px;margin-top:10px">${t[1]}</div>
        <div style="font-family:var(--fh);font-size:72px;font-weight:900;color:var(--acc2);margin-top:16px">${U.fmtInt(E.legacyScore())}</div><div class="label">pontos de legado</div>
        <div class="row center gap16" style="margin-top:24px"><button class="btn big" data-act="legacy">${ic('Award')} Ver trajetória</button><button class="btn primary big" data-act="newGame">${ic('Play')} Nova carreira</button></div></div>${MapR.skyline()}</div>`,
      mount: () => { Sound.music('menu'); E.delSave('auto'); },
    };
  };
})();
