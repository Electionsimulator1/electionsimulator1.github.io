/* Telas de configuração: título, país, candidato, criador, partido, cargo, local, briefing */
(function () {
  const S = UI.screens, A = UI.acts, E = window.Engine, K = window.CONTENT, C = window.COUNTRIES;
  const ic = U.ic, esc = U.esc;
  const st = UI.state;

  // ================= TÍTULO =================
  S.title = () => {
    const meta = E.saveMeta('auto');
    const fl = Array.from({ length: 14 }, (_, i) => `<div class="floater" style="left:${(i * 7.3) % 100}%;animation-duration:${18 + (i % 5) * 6}s;animation-delay:-${i * 3}s;font-size:${18 + (i % 4) * 8}px;color:rgba(var(--accRGB),.5)">${ic(['Vote', 'Star', 'Megaphone', 'Flag', 'Landmark'][i % 5])}</div>`).join('');
    return {
      html: `<div class="screen title">${fl}
      <div class="logo">
        <div class="mark appicon"><img src="assets/icon.svg" alt=""></div>
        <h1>RUMO AO<br>PODER</h1>
        <div class="tag">Simulador eleitoral</div>
        <div class="menu">
          <button class="btn primary big" data-act="newGame">${ic('Play')} Novo jogo</button>
          ${meta ? `<button class="btn big" data-act="continue">${ic('RotateCcw')} Continuar <span class="cont">${esc(meta.name)}<br>${esc(C[meta.country].name)} · ${meta.year}</span></button>` : ''}
          <button class="btn big" data-act="howto">${ic('BookOpen')} Como jogar</button>
          <button class="btn big" data-act="settings">${ic('Settings')} Configurações</button>
          <button class="btn big" data-act="credits">${ic('Info')} Créditos e fontes</button>
        </div>
      </div>
      ${MapR.skyline()}
      <div class="foot">Personagens reais aparecem em uma linha do tempo fictícia. Eventos e resultados do jogo são simulados.</div>
    </div>`,
      mount: () => Sound.music('menu'),
    };
  };
  A.newGame = () => UI.go('country');
  A.settings = () => UI.settings();
  A.continue = () => {
    const s = E.load('auto'); if (!s) return;
    UI.setAccent(s.country);
    if (s.camp) UI.go('campaign'); else UI.go('career');
  };
  A.howto = () => UI.modal(`<h2>${ic('BookOpen')} Como jogar</h2><div class="sep"></div>
    <div class="col" style="gap:12px;line-height:1.55">
      <div class="row" style="align-items:flex-start">${ic('Flag')}<div><b>1. Escolha país e candidato.</b> Jogue com políticos reais ou crie o seu: aparência, profissão, atributos e ideologia.</div></div>
      <div class="row" style="align-items:flex-start">${ic('Landmark')}<div><b>2. Comece por baixo.</b> Vereador ou prefeito. Vitórias, fama e experiência liberam deputado, governador, senador e presidente.</div></div>
      <div class="row" style="align-items:flex-start">${ic('MapPin')}<div><b>3. Faça campanha semana a semana.</b> Cada semana tem energia limitada: visite bairros, faça comícios, vá a podcasts, debates, entrevistas, feche alianças e faça promessas.</div></div>
      <div class="row" style="align-items:flex-start">${ic('ChartLine')}<div><b>4. Leia as pesquisas e o mapa.</b> Cada região tem renda, religiosidade, juventude e temas prioritários. Conhecimento (quantos te conhecem) e simpatia (quantos gostam) são coisas diferentes.</div></div>
      <div class="row" style="align-items:flex-start">${ic('Vote')}<div><b>5. Dia da eleição.</b> No Brasil, vote na urna eletrônica e acompanhe a apuração com suspense. Outros países têm Colégio Eleitoral, parlamentarismo, listas fechadas…</div></div>
      <div class="row" style="align-items:flex-start">${ic('Crown')}<div><b>6. Governe.</b> Cumpra promessas, administre crises e construa a carreira até o topo.</div></div>
    </div>`, { cls: 'wide' });
  A.credits = () => UI.modal(`<h2>${ic('Info')} Créditos e fontes</h2><div class="sep"></div>
    <div class="col small" style="line-height:1.6">
      <div><b>Municípios, população (Censo 2022) e malhas territoriais:</b> IBGE — API de Localidades, SIDRA e API de Malhas (os contornos das cidades são baixados do IBGE durante o jogo, quando há internet).</div>
      <div><b>Coordenadas dos municípios:</b> kelvins/municipios-brasileiros (MIT).</div>
      <div><b>Mapas dos outros países:</b> Natural Earth (domínio público).</div>
      <div><b>Bandeiras:</b> flag-icons (MIT). <b>Ícones:</b> Lucide (ISC). <b>Efeitos sonoros:</b> Kenney — Interface Sounds (CC0).</div>
      <div><b>Som da urna, suspense e música:</b> sintetizados no navegador (Web Audio).</div>
      <div class="muted">Políticos reais aparecem com dados simplificados e iguais atributos-base; partidos iniciais podem estar desatualizados. Institutos de pesquisa, veículos de mídia e eventos são fictícios.</div>
    </div>`, { cls: 'wide' });

  // ================= PAÍS =================
  S.country = () => `<div class="screen"><div class="page">
    <div class="page-h"><button class="btn iconbtn" data-act="goto" data-to="title">${ic('ArrowLeft')}</button><div><h2>Escolha o país</h2><div class="sub">Cada país tem seu próprio sistema eleitoral, partidos e políticos.</div></div><div class="steps"><span class="on"></span><span></span><span></span><span></span><span></span></div></div>
    <div class="grid4">${C.ORDER.map((id) => { const c = C[id]; return `<div class="card click ccard" data-act="pickCountry" data-id="${id}" style="--acc:${c.accent}">
      ${id === 'BR' ? `<span class="chip star" style="background:rgba(250,204,21,.9);color:#000;border:none">${ic('Star')} Completo</span>` : ''}
      <div class="flag" style="background-image:url(assets/flags/${c.flag}.svg)"></div>
      <div class="body"><h3>${c.name}</h3><p>${c.desc}</p><div class="row wrap gap6">${c.tags.slice(0, 3).map((t) => `<span class="chip">${t}</span>`).join('')}</div></div></div>`; }).join('')}</div>
  </div></div>`;
  A.goto = (el, d) => UI.go(d.to);
  A.pickCountry = (el, d) => { st.ng = { country: d.id }; UI.setAccent(d.id); Sound.sfx('confirm'); UI.go('candidate'); };

  // ================= CANDIDATO =================
  S.candidate = () => {
    const c = C[st.ng.country];
    return `<div class="screen"><div class="page">
    <div class="page-h"><button class="btn iconbtn" data-act="goto" data-to="country">${ic('ArrowLeft')}</button><div><h2>Quem vai disputar?</h2><div class="sub">${c.name} · políticos reais ou um candidato criado por você</div></div><div class="steps"><span class="on"></span><span class="on"></span><span></span><span></span><span></span></div></div>
    <div class="grid3">
      <div class="card click newcard" data-act="createCand"><div class="plus">${ic('UserPlus')}</div><h3 style="font-size:20px">Criar meu candidato</h3><div class="muted small" style="max-width:240px">Comece do zero como vereador(a) ou prefeito(a) e construa sua carreira.</div><span class="chip" style="color:var(--acc)">Modo carreira completo</span></div>
      ${c.real.map((r) => { const pt = c.parties.find((p) => p.id === r.party); return `<div class="card click rcard" data-act="pickReal" data-id="${r.id}">
        ${UI.av(r.av, 88, { bg: pt ? pt.color : '#334155' })}
        <div class="grow"><h4>${esc(r.name)}</h4>
          <div class="row wrap gap6" style="margin:6px 0"><span class="chip"><span class="pdot" style="background:${pt ? pt.color : '#999'}"></span>${r.party}</span>${UI.specChip(pt ? pt.e : 0, pt ? pt.s : 0)}</div>
          <div class="muted small" style="line-height:1.4">${esc(r.bio)}</div>
          <div class="row" style="margin-top:8px"><span class="tiny muted" style="width:40px">Fama</span><div class="grow">${UI.bar(r.fame / 100, 'var(--acc2)', 'thin')}</div><b class="num small">${r.fame}</b></div>
          ${r.held.length ? `<div class="tiny dim" style="margin-top:4px">${r.held.length} cargo(s) no currículo</div>` : ''}
        </div></div>`; }).join('')}
    </div>
    <div class="disclaimer">${ic('Info')} Políticos reais começam numa linha do tempo alternativa: todos têm os mesmos atributos-base (o que muda é a fama e a experiência). Partidos podem estar desatualizados e podem ser trocados. Nada no jogo representa fatos ou opiniões sobre essas pessoas.</div>
  </div></div>`;
  };
  A.pickReal = (el, d) => {
    const s = E.newGame(st.ng.country, { realId: d.id });
    s.year = E.startYear(st.ng.country);
    Sound.sfx('confirm'); UI.go('party', { first: true });
  };
  A.createCand = () => {
    const g = Math.random() < 0.5 ? 'm' : 'f';
    st.cr = { step: 0, name: '', ballot: '', g, age: 32, av: Avatar.random(Math.random, { g }), prof: 'professor', pts: { car: 45, ora: 45, int: 45, intg: 45, art: 45 }, ideology: 'centrismo', econ: 0, soc: 0 };
    UI.go('creator');
  };

  // ================= CRIADOR =================
  const POOL = 30;
  const ATTRS = [['car', 'Carisma', 'Smile'], ['ora', 'Oratória', 'MicVocal'], ['int', 'Inteligência', 'Brain'], ['intg', 'Integridade', 'ShieldCheck'], ['art', 'Articulação', 'Network']];
  const used = () => U.sum(Object.values(st.cr.pts)) - 45 * 5;
  S.creator = () => {
    const cr = st.cr; const steps = ['Identidade', 'Visual', 'Perfil', 'Ideologia'];
    const c = C[st.ng.country];
    let body = '';
    if (cr.step === 0) body = `<div class="col gap16">
      <div><div class="label">Nome completo</div><input class="inp" id="nm" maxlength="40" placeholder="Ex.: Maria da Silva Santos" value="${esc(cr.name)}"></div>
      <div><div class="label">Nome na urna</div><input class="inp" id="bl" maxlength="26" placeholder="Ex.: Professora Maria" value="${esc(cr.ballot)}"><div class="tiny muted" style="margin-top:6px">É como os eleitores vão te ver nas pesquisas e na urna.</div></div>
      <div class="row gap24 wrap"><div><div class="label">Gênero</div><div class="seg"><button class="${cr.g === 'm' ? 'on' : ''}" data-act="crG" data-v="m">Masculino</button><button class="${cr.g === 'f' ? 'on' : ''}" data-act="crG" data-v="f">Feminino</button></div></div>
      <div class="grow"><div class="label">Idade: <b id="agev" class="num" style="color:var(--text);font-size:15px">${cr.age}</b> anos</div><input type="range" id="age" min="18" max="75" value="${cr.age}"><div class="tiny muted">Idade mínima importa: ${c.offices.map((o) => `${o.name.replace(/\s*\(.*\)/, '')} ${o.minAge}`).slice(0, 4).join(' · ')}…</div></div></div>
    </div>`;
    if (cr.step === 1) {
      const a = cr.av; const sw = (k, arr, cur) => arr.map((v, i) => `<div class="swatch ${cur === (k === 'sk' ? i : v) ? 'on' : ''}" style="background:${k === 'sk' ? Avatar.SKINS[i] : v}" data-act="crAv" data-k="${k}" data-v="${k === 'sk' ? i : v}"></div>`).join('');
      const opts = (k, arr, labels) => arr.map((v, i) => `<div class="opt ${a[k] === v ? 'on' : ''}" data-act="crAv" data-k="${k}" data-v="${v}">${labels ? labels[i] : v}</div>`).join('');
      body = `<div class="col gap16">
        <div><div class="label">Tom de pele</div><div class="opt-row">${sw('sk', Avatar.SKINS, a.sk)}</div></div>
        <div><div class="label">Cabelo</div><div class="opt-row">${opts('hs', ['short', 'side', 'buzz', 'bald', 'wavy', 'curly', 'afro', 'long', 'bob', 'bun'], ['Curto', 'Social', 'Raspado', 'Calvo', 'Ondulado', 'Cacheado', 'Black power', 'Longo', 'Chanel', 'Coque'])}</div></div>
        <div><div class="label">Cor do cabelo</div><div class="opt-row">${sw('hc', Avatar.HAIR_COLORS, a.hc)}</div></div>
        <div><div class="label">Barba</div><div class="opt-row">${opts('bd', Avatar.BEARDS, ['Nenhuma', 'Por fazer', 'Cheia', 'Cavanhaque', 'Bigode'])}</div></div>
        <div class="row gap24 wrap"><div><div class="label">Óculos</div><div class="seg"><button class="${!a.gl ? 'on' : ''}" data-act="crAv" data-k="gl" data-v="0">Sem</button><button class="${a.gl ? 'on' : ''}" data-act="crAv" data-k="gl" data-v="1">Com</button></div></div>
        <div><div class="label">Roupa</div><div class="opt-row">${opts('ot', ['suit', 'suit_open', 'blazer', 'shirt', 'tee'], ['Terno e gravata', 'Terno aberto', 'Blazer', 'Camisa', 'Camiseta'])}</div></div></div>
        <div><div class="label">Cor da roupa</div><div class="opt-row">${sw('oc', Avatar.SUIT_COLORS, a.oc)}</div></div>
        <div><div class="label">Gravata / detalhe</div><div class="opt-row">${sw('tc', Avatar.ACCENTS, a.tc)}</div></div>
        <div><button class="btn" data-act="crRand">${ic('Shuffle')} Aleatório</button></div>
      </div>`;
    }
    if (cr.step === 2) {
      const left = POOL - used();
      body = `<div class="label">Profissão antes da política</div>
      <div class="grid3" style="grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px">${K.PROFESSIONS.map((p) => `<div class="card click prof ${cr.prof === p.id ? 'sel' : ''}" data-act="crProf" data-id="${p.id}">${ic(p.ic)}<h4>${p.n}</h4><p>${p.d}</p><div class="tiny dim" style="margin-top:6px">Fama ${p.fame} · ${'$'.repeat(Math.max(1, Math.round(p.money / 4)))}</div></div>`).join('')}</div>
      <div class="row between"><div class="label">Atributos</div><span class="chip" style="color:${left ? 'var(--acc2)' : 'var(--muted)'}">${left} pontos livres</span></div>
      ${ATTRS.map(([k, n, icn]) => { const prof = K.PROFESSIONS.find((p) => p.id === cr.prof); const b = (prof.attrs[k] || 0); return `<div class="attr"><span class="row gap6">${ic(icn)} ${n}</span>${UI.bar((cr.pts[k] + b) / 100, k === 'intg' ? '#38bdf8' : 'var(--acc)')}<span class="v">${cr.pts[k] + b}</span><span class="row gap4"><button class="btn sm iconbtn" style="width:30px;height:30px" data-act="crPt" data-k="${k}" data-v="-1">${ic('Minus')}</button><button class="btn sm iconbtn" style="width:30px;height:30px" data-act="crPt" data-k="${k}" data-v="1">${ic('Plus')}</button></span></div>`; }).join('')}
      <div class="tiny muted" style="margin-top:6px">Carisma: simpatia e redes · Oratória: debates e comícios · Inteligência: entrevistas e estudos · Integridade: resiste a escândalos · Articulação: alianças e partido</div>`;
    }
    if (cr.step === 3) {
      const sp = K.spectrum(cr.econ, cr.soc);
      body = `<div class="label">Ideologia</div><div class="opt-row" style="margin-bottom:16px">${K.IDEOLOGIES.map((i) => `<div class="opt ${cr.ideology === i.id ? 'on' : ''}" data-act="crIdeo" data-id="${i.id}">${i.n}</div>`).join('')}</div>
      <div class="row gap24 wrap" style="align-items:flex-start">
        <div class="compass" id="compass">
          <div class="q" style="left:0;top:0;background:linear-gradient(135deg,#7f1d1d,transparent)"></div><div class="q" style="right:0;top:0;background:linear-gradient(225deg,#1e3a8a,transparent)"></div>
          <div class="q" style="left:0;bottom:0;background:linear-gradient(45deg,#14532d,transparent)"></div><div class="q" style="right:0;bottom:0;background:linear-gradient(315deg,#713f12,transparent)"></div>
          <div style="position:absolute;left:50%;top:0;bottom:0;width:1px;background:rgba(255,255,255,.2)"></div><div style="position:absolute;top:50%;left:0;right:0;height:1px;background:rgba(255,255,255,.2)"></div>
          <span class="ax" style="top:8px;left:50%;transform:translateX(-50%)">Conservador</span><span class="ax" style="bottom:8px;left:50%;transform:translateX(-50%)">Progressista</span>
          <span class="ax" style="left:8px;top:50%;transform:translateY(-50%) rotate(-90deg);transform-origin:left;margin-top:40px">Esquerda</span><span class="ax" style="right:8px;top:50%;writing-mode:vertical-rl">Direita</span>
          ${c.parties.map((p) => `<span class="pp" title="${p.id}" style="left:${((p.e + 1) / 2) * 100}%;top:${((1 - p.s) / 2) * 100}%;background:${p.color}"></span>`).join('')}
          <div class="dot" id="cdot" style="left:${((cr.econ + 1) / 2) * 100}%;top:${((1 - cr.soc) / 2) * 100}%"></div>
        </div>
        <div class="grow col">
          <div class="card"><div class="label">Seu posicionamento</div><div style="font-family:var(--fh);font-size:28px;font-weight:800;color:${sp.c}" id="spn">${sp.n}</div>
            <div class="small muted" style="margin-top:6px;line-height:1.5">Arraste o ponto no quadro para ajustar. Economia: <b id="ev">${U.fmtNum1(cr.econ, 2)}</b> · Costumes: <b id="sv">${U.fmtNum1(cr.soc, 2)}</b></div></div>
          <div class="card small muted" style="line-height:1.55">${ic('Info')} Sua posição define com quais regiões você tem mais afinidade, quais partidos te aceitam e como suas respostas em entrevistas e debates soam coerentes. Os pontos coloridos são os partidos de ${c.name}.</div>
        </div>
      </div>`;
    }
    return {
      html: `<div class="screen"><div class="page">
      <div class="page-h"><button class="btn iconbtn" data-act="crBack">${ic('ArrowLeft')}</button><div><h2>Criar candidato</h2><div class="sub">${steps.map((s, i) => `<span style="color:${i === cr.step ? 'var(--acc)' : 'inherit'};font-weight:${i === cr.step ? 700 : 400}">${i + 1}. ${s}</span>`).join(' &nbsp;·&nbsp; ')}</div></div><div class="steps"><span class="on"></span><span class="on"></span><span class="on"></span><span></span><span></span></div></div>
      <div class="creator">
        <div class="panel preview">${UI.av(cr.av, 180, { bg: '#334155' })}<h3 id="pvname" style="font-size:20px">${esc(cr.ballot || cr.name || 'Seu nome')}</h3><div class="muted small">${cr.age} anos · ${K.PROFESSIONS.find((p) => p.id === cr.prof).n}</div><div style="margin-top:8px">${UI.specChip(cr.econ, cr.soc)}</div></div>
        <div class="panel" style="padding:22px">${body}
          <div class="row" style="justify-content:flex-end;margin-top:22px">${cr.step < 3 ? `<button class="btn primary big" data-act="crNext">Próximo ${ic('ArrowRight')}</button>` : `<button class="btn primary big" data-act="crDone">${ic('Check')} Escolher partido</button>`}</div>
        </div>
      </div></div></div>`,
      mount: (root) => {
        const nm = root.querySelector('#nm'), bl = root.querySelector('#bl'), age = root.querySelector('#age');
        if (nm) nm.oninput = () => { cr.name = nm.value; root.querySelector('#pvname').textContent = cr.ballot || cr.name || 'Seu nome'; };
        if (bl) bl.oninput = () => { cr.ballot = bl.value; root.querySelector('#pvname').textContent = cr.ballot || cr.name || 'Seu nome'; };
        if (age) age.oninput = () => { cr.age = +age.value; root.querySelector('#agev').textContent = cr.age; };
        const cp = root.querySelector('#compass');
        if (cp) {
          let drag = false;
          const set = (e) => { const r = cp.getBoundingClientRect(); const x = U.clamp((e.clientX - r.left) / r.width, 0, 1), y = U.clamp((e.clientY - r.top) / r.height, 0, 1); cr.econ = +(x * 2 - 1).toFixed(2); cr.soc = +(1 - y * 2).toFixed(2); const d = root.querySelector('#cdot'); d.style.left = x * 100 + '%'; d.style.top = y * 100 + '%'; const sp = K.spectrum(cr.econ, cr.soc); const spn = root.querySelector('#spn'); spn.textContent = sp.n; spn.style.color = sp.c; root.querySelector('#ev').textContent = U.fmtNum1(cr.econ, 2); root.querySelector('#sv').textContent = U.fmtNum1(cr.soc, 2); };
          cp.onpointerdown = (e) => { drag = true; cp.setPointerCapture(e.pointerId); set(e); Sound.sfx('select', 0.4); };
          cp.onpointermove = (e) => drag && set(e);
          cp.onpointerup = () => { drag = false; };
        }
      },
    };
  };
  A.crG = (el, d) => { st.cr.g = d.v; st.cr.av = Avatar.random(Math.random, { g: d.v }); UI.refresh(); };
  A.crAv = (el, d) => { const a = st.cr.av; let v = d.v; if (d.k === 'sk') v = +v; if (d.k === 'gl') v = v === '1'; a[d.k] = v; if (d.k === 'hc') a.bc = v; Sound.sfx('select', 0.5); UI.refresh(); };
  A.crRand = () => { st.cr.av = Avatar.random(Math.random, { g: st.cr.g }); UI.refresh(); };
  A.crProf = (el, d) => { st.cr.prof = d.id; UI.refresh(); };
  A.crPt = (el, d) => { const cr = st.cr; const v = +d.v; const nv = cr.pts[d.k] + v; if (nv < 30 || nv > 85) return Sound.sfx('error'); if (v > 0 && used() >= POOL) return Sound.sfx('error'); cr.pts[d.k] = nv; UI.refresh(); };
  A.crIdeo = (el, d) => { const i = K.IDEOLOGIES.find((x) => x.id === d.id); st.cr.ideology = d.id; st.cr.econ = i.e; st.cr.soc = i.s; UI.refresh(); };
  A.crBack = () => { if (st.cr.step > 0) { st.cr.step--; UI.refresh(); } else UI.go('candidate'); };
  A.crNext = () => {
    const cr = st.cr;
    if (cr.step === 0 && cr.name.trim().length < 3) { UI.toast('Digite um nome com pelo menos 3 letras.', 'b', 'Ban'); return Sound.sfx('error'); }
    cr.step++; Sound.sfx('select2'); UI.refresh();
  };
  A.crDone = () => {
    const cr = st.cr; const prof = K.PROFESSIONS.find((p) => p.id === cr.prof);
    const attrs = {}; for (const k in cr.pts) attrs[k] = U.clamp(cr.pts[k] + (prof.attrs[k] || 0), 10, 95);
    const year0 = E.startYear(st.ng.country);
    const s = E.newGame(st.ng.country, { name: cr.name.trim(), ballot: (cr.ballot || cr.name).trim(), g: cr.g, birth: year0 - cr.age, av: cr.av, prof: cr.prof, attrs, econ: cr.econ, soc: cr.soc, ideology: cr.ideology, party: null });
    s.year = year0;
    Sound.sfx('confirm'); UI.go('party', { first: true });
  };

  // ================= PARTIDO =================
  S.party = (params) => {
    const s = E.S, p = s.player, c = E.country();
    const list = s.parties.slice().sort((a, b) => E.partyFit(b) - E.partyFit(a));
    return `<div class="screen"><div class="page">
    <div class="page-h"><button class="btn iconbtn" data-act="${params.first ? 'goto' : 'backCareer'}" data-to="candidate">${ic('ArrowLeft')}</button><div><h2>Filiação partidária</h2><div class="sub">Partidos grandes têm mais dinheiro e tempo de TV. Afinidade ideológica conta muito.</div></div>${params.first ? '<div class="steps"><span class="on"></span><span class="on"></span><span class="on"></span><span class="on"></span><span></span></div>' : ''}</div>
    <div class="grid2" style="grid-template-columns:1fr 340px">
      <div class="col gap6">${list.map((pt) => { const fit = E.partyFit(pt); const cur = pt.id === p.party; return `<div class="card click prow ${cur ? 'sel' : ''}" data-act="pickParty" data-id="${pt.id}">
        <div class="cbar" style="background:${pt.color}"></div>
        <div><h4>${esc(pt.id)} ${pt.num ? `<span class="muted num">${pt.num}</span>` : ''} ${pt.own ? '<span class="chip">seu partido</span>' : ''}</h4><div class="muted small">${esc(pt.name)} · ${K.spectrum(pt.e, pt.s).n}${pt.regions ? ' · regional' : ''}</div></div>
        <div><div class="tiny muted">Tamanho</div>${UI.bar(pt.size, pt.color, 'thin')}</div>
        <div><div class="tiny muted">Afinidade ${Math.round(fit * 100)}%</div>${UI.bar(fit, fit > 0.7 ? 'var(--good)' : fit > 0.45 ? 'var(--warn)' : 'var(--bad)', 'thin')}</div></div>`; }).join('')}</div>
      <div class="col">
        <div class="card newcard" style="min-height:0;padding:22px"><div class="plus">${ic('Flag')}</div><h3>Fundar meu partido</h3><div class="muted small">Total liberdade, mas começa nanico: pouca verba e pouco tempo de TV. Cresce conforme você vence.</div><button class="btn" data-act="newParty">${ic('Plus')} Criar partido</button></div>
        ${c.offices.some((o) => o.nonpartisan) ? `<div class="card small muted">${ic('Info')} Em ${c.name}, eleições locais são apartidárias, mas você precisará de partido para cargos maiores.</div>` : ''}
      </div>
    </div></div></div>`;
  };
  A.backCareer = () => UI.go('career');
  A.pickParty = async (el, d) => {
    const s = E.S; const pt = E.party(d.id); const fit = E.partyFit(pt);
    if (fit < 0.35 && !(await UI.confirm('Partido distante', `O ${pt.id} tem pouca afinidade com suas ideias (${Math.round(fit * 100)}%). Sua base pode estranhar e o partido te dará menos apoio. Filiar mesmo assim?`, 'Filiar'))) return;
    if (s.camp) return;
    const first = UI.params.first;
    if (!first) E.changeParty(d.id); else { E.setParty(d.id); s.partySupport = s.player.realId ? 70 : 40 + Math.round(fit * 30); }
    UI.toast(`Filiado(a) ao ${pt.id}!`, 'g', 'Flag'); Sound.levelUp();
    UI.go(first ? 'office' : 'career', { first });
  };
  A.newParty = () => {
    const c = E.country(); const used = new Set(E.S.parties.map((p) => p.num));
    let num = 0; if (c.id === 'BR') { do { num = U.randi(10, 99); } while (used.has(num)); }
    const cols = ['#e11d48', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#0ea5e9', '#6366f1', '#a855f7', '#ec4899', '#f8fafc'];
    UI.modal(`<h2>${ic('Flag')} Fundar partido</h2><div class="sep"></div>
      <div class="col gap16">
        <div><div class="label">Nome</div><input class="inp" id="pn" maxlength="40" placeholder="Partido da Renovação Nacional"></div>
        <div class="row gap16"><div class="grow"><div class="label">Sigla</div><input class="inp" id="ps" maxlength="8" placeholder="PRN"></div>${c.id === 'BR' ? `<div style="width:120px"><div class="label">Número</div><input class="inp" id="pnum" maxlength="2" value="${num}"></div>` : ''}</div>
        <div><div class="label">Cor</div><div class="opt-row">${cols.map((x, i) => `<div class="swatch ${i === 6 ? 'on' : ''}" style="background:${x}" data-col="${x}"></div>`).join('')}</div></div>
        <div class="small muted">${ic('Info')} Ideologia do partido = a sua. ${c.id === 'BR' ? 'No Brasil real, criar um partido exige centenas de milhares de assinaturas — aqui é mais simples, mas ele começa minúsculo.' : ''}</div>
        <button class="btn primary big" id="pcreate">${ic('Check')} Fundar</button>
      </div>`, {
      cls: 'narrow', mount: (el) => {
        let col = cols[6];
        el.querySelectorAll('[data-col]').forEach((sw) => (sw.onclick = () => { el.querySelectorAll('[data-col]').forEach((x) => x.classList.remove('on')); sw.classList.add('on'); col = sw.dataset.col; Sound.sfx('select'); }));
        el.querySelector('#pcreate').onclick = () => {
          const name = el.querySelector('#pn').value.trim(); const sig = el.querySelector('#ps').value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
          const n = el.querySelector('#pnum') ? +el.querySelector('#pnum').value : 0;
          if (name.length < 4 || sig.length < 2) return UI.toast('Preencha nome e sigla.', 'b', 'Ban');
          if (E.S.parties.some((p) => p.id === sig)) return UI.toast('Sigla já existe.', 'b', 'Ban');
          if (c.id === 'BR' && (n < 10 || n > 99 || used.has(n))) return UI.toast('Número inválido ou já usado (10 a 99).', 'b', 'Ban');
          const first = UI.params.first;
          E.createParty({ id: sig, name, color: col, num: n });
          UI.closeModal(); UI.confetti(80); Sound.levelUp(); UI.toast(`${sig} fundado!`, 'big', 'Flag');
          UI.go(first ? 'office' : 'career', { first });
        };
      },
    });
  };

  // ================= CARGO =================
  S.office = (params) => {
    const s = E.S, c = E.country(), p = s.player;
    const first = params.first;
    const year = first ? null : s.year;
    const offs = first ? c.offices : E.officesInYear(s.year);
    return `<div class="screen"><div class="page">
    <div class="page-h"><button class="btn iconbtn" data-act="${first ? 'officeBack' : 'backCareer'}">${ic('ArrowLeft')}</button><div><h2>${first ? 'Sua primeira eleição' : `Eleições de ${s.year}`}</h2><div class="sub">${first ? 'Escolha o cargo. Os mais altos exigem experiência, fama e idade mínima.' : 'Escolha a sua candidatura ou volte para o mandato.'}</div></div>${first ? '<div class="steps"><span class="on"></span><span class="on"></span><span class="on"></span><span class="on"></span><span class="on"></span></div>' : ''}</div>
    <div class="grid3">${offs.map((o) => {
      const y = first ? E.nextYearFor(o.id, E.startYear(c.id)) : s.year;
      const chk = E.canRun(o.id, y);
      return `<div class="card ${chk.ok ? 'click' : 'locked'} ocard" ${chk.ok ? `data-act="pickOffice" data-id="${o.id}" data-y="${y}"` : ''}>
        <div class="row between">${UI.stars(o.level)}<span class="chip">${ic('Calendar')} ${y}</span></div>
        <h4>${chk.ok ? '' : ic('Lock') + ' '}${o.name}</h4>
        <div class="muted small">${sysName(o)} · mandato de ${o.term >= 99 ? 'tempo indeterminado' : o.term + ' anos'}</div>
        <div style="margin-top:8px">${chk.checks.map((k) => `<div class="check ${k.ok ? 'ok' : 'no'}">${ic(k.ok ? 'Check' : 'X')}<span>${k.t}</span></div>`).join('')}</div>
      </div>`;
    }).join('')}</div>
    <div class="row" style="margin-top:18px;gap:16px"><span class="chip">${ic('Star')} Fama ${Math.round(p.fame)}</span><span class="chip">${ic('Cake') || ''}${E.age()} anos</span>${!first ? `<button class="btn" data-act="skipElection">${ic('SkipForward') || ic('ArrowRight')} Não concorrer este ano</button>` : ''}</div>
  </div></div>`;
  };
  function sysName(o) {
    return { list_open: 'Proporcional (lista aberta)', list_closed: 'Proporcional (lista fechada)', majority: o.runoff ? 'Maioria em 2 turnos' : 'Maioria', plurality: o.seats > 1 ? `Os ${o.seats} mais votados` : 'Mais votado vence', college: 'Colégio Eleitoral', parliament: 'Eleição parlamentar', internal: 'Votação interna do partido' }[o.sys] + (o.primary ? ' + primárias' : '');
  }
  UI.sysName = sysName;
  A.officeBack = () => UI.go('party', { first: true });
  A.skipElection = async () => {
    if (!(await UI.confirm('Pular eleição', 'Você não vai disputar nada este ano. O tempo avança para o próximo ano.', 'Pular'))) return;
    E.skipElection(); E.save(); UI.go('career');
  };
  A.pickOffice = (el, d) => {
    const s = E.S; const o = E.officeDef(d.id);
    s.year = +d.y; s.sem = 2;
    st.pick = { oid: d.id, loc: { q: '', region: '', sel: null } };
    if (s.office && s.office.kind === 'exec' && s.office.id !== d.id && s.country === 'BR') UI.toast('Atenção: ao se candidatar você renuncia ao cargo atual (desincompatibilização).', 'b', 'TriangleAlert');
    if (o.arena === 'country' || o.arena === 'party') return UI.startCampaignFlow(d.id, {});
    UI.go('location', {});
  };

  // ================= LOCAL =================
  S.location = () => {
    const s = E.S, c = E.country(), o = E.officeDef(st.pick.oid);
    const L = st.pick.loc;
    if (o.arena === 'state') {
      if (!L.sel && s.player.home) { const hc = E.findCity(s.player.home); if (hc) L.sel = hc.region; }
      const regions = Object.values(c.regions).sort((a, b) => (popOf(b) - popOf(a)));
      const fake = E.buildArenaPreviewCountry();
      return {
        html: `<div class="screen"><div class="page" style="max-width:1400px">
        <div class="page-h"><button class="btn iconbtn" data-act="locBack">${ic('ArrowLeft')}</button><div><h2>Escolha ${c.id === 'BR' ? 'o estado' : 'a região'}</h2><div class="sub">${o.name} · clique no mapa ou na lista</div></div></div>
        <div class="loc"><div class="panel mapbox" id="locmap" style="min-height:520px">${MapR.svg(fake, colorsFor(fake, L.sel), { labels: true })}</div>
          <div class="panel col" style="padding:16px;min-height:0">
            <div class="results" style="margin:0">${regions.map((r) => `<div class="res ${L.sel === r.id ? 'sel' : ''}" data-act="pickRegion" data-id="${r.id}" style="grid-template-columns:1fr 110px"><span class="n">${esc(r.n)} <span class="dim">${c.id === 'BR' || c.id === 'US' ? r.id : ''}</span></span><span class="muted num small" style="text-align:right">${U.fmtCompact(popOf(r))} hab.</span></div>`).join('')}</div>
            ${L.sel ? regionPreview(L.sel, o) : ''}
          </div></div></div></div>`,
        mount: (root) => {
          const m = root.querySelector('#locmap');
          m.addEventListener('click', (e) => { const z = e.target.closest('[data-zone]'); if (z) { L.sel = z.dataset.zone; Sound.sfx('select'); UI.refresh(); } });
          m.addEventListener('mousemove', (e) => { const z = e.target.closest('[data-zone]'); if (z) { const r = c.regions[z.dataset.zone]; if (r) UI.tipShow(`<b>${esc(r.n)}</b><br><span class="muted">${U.fmtCompact(popOf(r))} habitantes</span>`, e); } else UI.tipHide(); });
          m.addEventListener('mouseleave', UI.tipHide);
        },
      };
    }
    // cidade / distrito
    const regs = Object.values(c.regions).sort((a, b) => a.n.localeCompare(b.n));
    return {
      html: `<div class="screen"><div class="page" style="max-width:1400px">
      <div class="page-h"><button class="btn iconbtn" data-act="locBack">${ic('ArrowLeft')}</button><div><h2>Escolha a cidade</h2><div class="sub">${o.name} · ${c.id === 'BR' ? `${U.fmtInt(E.brCities().length)} municípios do Brasil (IBGE)` : 'principais cidades'} · cidades grandes são bem mais difíceis</div></div></div>
      <div class="loc">
        <div class="panel col" style="padding:16px;min-height:0">
          <div class="row gap6"><div class="search grow">${ic('Search')}<input class="inp" id="q" placeholder="Buscar ${c.cityLabel.toLowerCase()}…" value="${esc(L.q)}" autocomplete="off"></div>
          <select class="inp" id="reg" style="width:200px"><option value="">Todos os ${c.regionsLabel.toLowerCase()}</option>${regs.map((r) => `<option value="${r.id}" ${L.region === r.id ? 'selected' : ''}>${esc(r.n)}</option>`).join('')}</select>
          <button class="btn iconbtn" data-act="locRandom" title="Aleatória">${ic('Shuffle')}</button></div>
          <div class="results" id="results"></div>
        </div>
        <div class="panel" style="padding:18px;overflow:auto" id="preview">${cityPreview(L.sel, o)}</div>
      </div></div></div>`,
      mount: (root) => {
        const q = root.querySelector('#q'), reg = root.querySelector('#reg');
        const render = () => { root.querySelector('#results').innerHTML = cityResults(L, o); };
        q.oninput = () => { L.q = q.value; render(); };
        reg.onchange = () => { L.region = reg.value; render(); };
        render(); setTimeout(() => q.focus(), 50);
      },
    };
  };
  function popOf(r) { return E.S.country === 'BR' ? E.brUFPop(r.id) : r.pop; }
  function colorsFor(arena, sel) { const col = {}; arena.zones.forEach((z) => (col[z.id] = z.id === sel ? 'var(--acc)' : U.mix('#1e293b', '#334a6e', Math.min(1, z.share * 6)))); return col; }
  E.buildArenaPreviewCountry = () => {
    if (st._prevArena && st._prevArena.c === E.S.country) return st._prevArena.a;
    const c = E.country(); const zones = []; const groups = {};
    MapGen.units(c.id).forEach((u) => (groups[u.z] = groups[u.z] || []).push(u));
    let tot = 0;
    Object.keys(groups).filter((z) => c.regions[z]).forEach((zid) => { const rings = groups[zid].flatMap((u) => u.r); const lp = MapGen.labelPoint(rings); const pop = popOf(c.regions[zid]); tot += pop; zones.push({ id: zid, n: c.regions[zid].n, lx: lp[0], ly: lp[1], pop }); });
    zones.forEach((z) => (z.share = z.pop / tot));
    const a = { zones, map: { kind: 'geo', key: c.id, zoneOf: 'z' } };
    st._prevArena = { c: c.id, a };
    return a;
  };
  function regionPreview(rid, o) {
    const c = E.country(); const r = c.regions[rid]; const pop = popOf(r);
    const lean = K.spectrum(r.lean[0], r.lean[1]);
    let seats = '';
    if (o.sys === 'list_open' || o.sys === 'list_closed') seats = `<div class="sb"><small>Vagas</small><b>${o.seats({ region: rid, pop })}</b></div>`;
    return `<div class="sep"></div><h3 style="font-size:22px">${esc(r.n)}</h3>
      <div class="statgrid"><div class="sb"><small>População</small><b>${U.fmtCompact(pop)}</b></div><div class="sb"><small>Eleitores</small><b>${U.fmtCompact(pop * c.elecRatio)}</b></div>${seats}<div class="sb"><small>Tendência</small><b style="font-size:15px;color:${lean.c}">${lean.n}</b></div></div>
      <div style="margin-top:10px">${UI.diffBadge(pop / 8)}</div>
      <button class="btn primary big" style="width:100%;margin-top:14px" data-act="confirmRegion">${ic('Check')} Disputar em ${esc(r.n)}</button>`;
  }
  A.pickRegion = (el, d) => { st.pick.loc.sel = d.id; UI.refresh(); };
  A.confirmRegion = () => UI.startCampaignFlow(st.pick.oid, { region: st.pick.loc.sel });
  A.locBack = () => UI.go('office', { first: !E.S.history.length && !E.S.office && UI.state.firstFlow !== false });
  function cityResults(L, o) {
    const q = U.norm(L.q);
    const list = E.cityList();
    const out = [];
    for (const c of list) {
      if (L.region && c.region !== L.region) continue;
      if (q && !c.nn.includes(q)) continue;
      out.push(c); if (out.length >= 80) break;
    }
    if (q) out.sort((a, b) => (b.nn.startsWith(q) - a.nn.startsWith(q)) || b.pop - a.pop);
    if (!out.length) return `<div class="muted" style="padding:30px;text-align:center">Nenhuma cidade encontrada.</div>`;
    return out.map((c) => `<div class="res ${String(L.sel) === String(c.id) ? 'sel' : ''}" data-act="pickCity" data-id="${esc(c.id)}"><span class="n">${esc(c.n)} <span class="dim small">${c.region.length <= 3 ? c.region : E.country().regions[c.region] ? E.country().regions[c.region].n : ''}</span>${c.cap ? ' ' + ic('Star') : ''}</span><span class="muted num small" style="text-align:right">${U.fmtInt(c.pop)} hab.</span><span style="text-align:right">${UI.diffBadge(c.pop)}</span></div>`).join('');
  }
  function cityPreview(id, o) {
    if (id == null || id === '') return `<div class="muted" style="text-align:center;padding:60px 10px">${ic('MapPin')}<br><br>Selecione uma cidade para ver os detalhes.</div>`;
    const c = E.country(); const city = E.findCity(E.S.country === 'BR' ? +id : id);
    const pop = o.arena === 'district' ? Math.min(o.distPop, Math.max(city.pop * 0.9, o.distPop * 0.6)) : city.pop;
    const elec = pop * c.elecRatio;
    let extra = '';
    if (o.sys === 'list_open' || o.sys === 'list_closed') extra += `<div class="sb"><small>Vagas na câmara</small><b>${o.seats({ pop, region: city.region })}</b></div>`;
    if (o.sys === 'majority') extra += `<div class="sb"><small>2º turno</small><b>${o.runoff === 'br' ? (elec > 200000 ? 'Possível' : 'Não há') : 'Possível'}</b></div>`;
    let mapHtml = '';
    if (E.S.country === 'BR') {
      const fake = E.buildArenaPreviewCountry(); const [x, y] = MapGen.brXY(city.lat, city.lon, 'BR');
      mapHtml = `<div class="mapbox" style="height:240px;margin-bottom:14px">${MapR.svg(fake, colorsFor(fake, city.region), { labels: false, mini: true }).replace('</svg>', `<circle cx="${x}" cy="${y}" r="14" fill="var(--acc2)" opacity=".35"><animate attributeName="r" values="8;22;8" dur="1.6s" repeatCount="indefinite"/></circle><circle cx="${x}" cy="${y}" r="6" fill="var(--acc2)" stroke="#000" stroke-width="2"/></svg>`)}</div>`;
    }
    const d = E.difficulty(pop);
    return `${mapHtml}<h3 style="font-size:24px">${esc(city.n)}</h3><div class="muted">${esc(c.regions[city.region] ? c.regions[city.region].n : city.region)}${city.cap ? ' · capital' : ''}</div>
      <div class="statgrid"><div class="sb"><small>População</small><b>${U.fmtCompact(pop)}</b></div><div class="sb"><small>Eleitores</small><b>${U.fmtCompact(elec)}</b></div>${extra}<div class="sb"><small>Dificuldade</small><b style="color:${d.c};font-size:16px">${d.n}</b></div></div>
      <div class="small muted" style="margin-top:12px;line-height:1.5">${d.lv >= 4 ? 'Metrópole: adversários fortes e conhecidos, ações de rua alcançam pouca gente — mídia e alianças são decisivas.' : d.lv >= 2 ? 'Cidade média: equilíbrio entre rua e mídia.' : 'Cidade pequena: o corpo a corpo faz muita diferença e todo mundo se conhece.'}</div>
      ${E.S.country === 'BR' && o.arena === 'city' ? `<div class="tiny dim" style="margin-top:8px">${ic('Map')} Mapa com o contorno real do município (IBGE).</div>` : ''}
      <button class="btn primary big" style="width:100%;margin-top:16px" data-act="confirmCity">${ic('Check')} Disputar em ${esc(city.n)}</button>`;
  }
  A.pickCity = (el, d) => {
    const L = st.pick.loc; L.sel = d.id;
    U.$$('.res').forEach((r) => r.classList.toggle('sel', r.dataset.id === d.id));
    U.$('#preview').innerHTML = cityPreview(d.id, E.officeDef(st.pick.oid)); Sound.sfx('select');
  };
  A.locRandom = () => {
    const L = st.pick.loc; let list = E.cityList(); if (L.region) list = list.filter((c) => c.region === L.region);
    const c = U.pick(list); L.q = c.n; UI.refresh(); setTimeout(() => A.pickCity(null, { id: String(c.id) }), 60);
  };
  A.confirmCity = () => UI.startCampaignFlow(st.pick.oid, { cityId: E.S.country === 'BR' ? +st.pick.loc.sel : st.pick.loc.sel });

  // ================= INÍCIO DA CAMPANHA =================
  UI.startCampaignFlow = async (oid, place) => {
    const s = E.S, o = E.officeDef(oid);
    let outline = null;
    if (s.country === 'BR' && o.arena === 'city') { UI.loading(true, 'Carregando o mapa do município (IBGE)…'); const ct = E.findCity(place.cityId); outline = await MapGen.cityOutline(place.cityId, ct && ct.region); }
    UI.loading(true, 'Montando o eleitorado…');
    await U.sleep(60);
    try {
      if (!s.player.home) s.player.home = place.cityId != null ? place.cityId : (s.country === 'BR' && place.region ? (E.brCities().find((c) => c.region === place.region && c.cap) || {}).id : null);
      const arena = E.buildArena(oid, place, outline);
      E.startCampaign(oid, arena);
      E.save();
    } catch (err) { console.error(err); UI.loading(false); UI.toast('Erro ao montar a eleição: ' + err.message, 'b'); return; }
    UI.loading(false);
    if (s.country === 'BR' && o.arena === 'city' && !outline) UI.toast('Sem internet: usando um mapa estilizado da cidade.', '', 'Wifi');
    UI.go('briefing');
  };

  // ================= BRIEFING =================
  S.briefing = () => {
    const s = E.S, camp = s.camp, o = E.officeDef(camp.oid), arena = camp.arena, c = E.country();
    const sysTxt = explainSystem(o, camp);
    const opps = camp.cands.filter((x) => !x.isP);
    const col = {}; arena.zones.forEach((z) => (col[z.id] = MapR.ramp(MapR.SUPPORT, (z.aw.P || 0) * 1.4)));
    return `<div class="screen"><div class="page" style="max-width:1300px">
      <div class="page-h"><div><div class="label">${c.name} · ${s.year}${camp.stage === 'primary' ? ' · Primárias' : ''}</div><h2>${o.name} — ${esc(arena.fullName)}</h2><div class="sub">${U.fmtInt(arena.elec)} eleitores · ${arena.zones.length} ${arena.type === 'city' || arena.type === 'district' ? 'bairros/regiões' : 'regiões'} · ${camp.weeks} semanas de campanha</div></div></div>
      <div class="grid2" style="grid-template-columns:1.1fr 1fr">
        <div class="panel mapbox" style="height:440px">${MapR.svg(arena, col, {})}<div class="legend">Quanto você é conhecido(a) hoje <span class="grad" style="background:linear-gradient(90deg,${MapR.SUPPORT.join(',')})"></span></div></div>
        <div class="col">
          <div class="card"><div class="label">Como funciona</div><div style="margin-top:6px;line-height:1.55" class="small">${sysTxt}</div></div>
          <div class="card"><div class="label">Seus recursos</div><div class="statgrid" style="margin-top:6px">
            <div class="sb"><small>Caixa de campanha</small><b>${E.fmtMoney(camp.money)}</b><div class="tiny muted">Partido ${E.fmtMoney(camp.fundParty)} · próprio ${E.fmtMoney(camp.fundOwn)}</div></div>
            <div class="sb"><small>Energia semanal</small><b>${camp.maxEnergy}</b><div class="tiny muted">ações por semana</div></div>
            <div class="sb"><small>Fama</small><b>${Math.round(s.player.fame)}</b></div><div class="sb"><small>Apoio no partido</small><b>${Math.round(camp.partySupport)}%</b></div>
          </div></div>
          <div class="card"><div class="label">Adversários ${opps.length > 8 ? `(principais de ${opps.length})` : ''}</div><div class="col gap6" style="margin-top:8px;max-height:200px;overflow:auto">${opps.slice(0, 10).map((x) => `<div class="row">${UI.av(x.av, 32, { bg: x.color })}<div class="grow"><b>${esc(x.ballot)}</b> ${x.inc ? '<span class="chip">no cargo</span>' : ''}${x.real ? '<span class="chip">real</span>' : ''}<div class="tiny muted">${x.party || 'Independente'} · ${K.spectrum(x.econ, x.soc).n}</div></div><span class="num muted small">${x.num}</span></div>`).join('')}</div></div>
          <button class="btn primary huge" data-act="startCamp">${ic('Flag')} Começar a campanha</button>
        </div>
      </div></div></div>`;
  };
  function explainSystem(o, camp) {
    const c = E.country(); const a = camp.arena;
    let t = '';
    if (camp.stage === 'primary') t += `<b>Primárias:</b> primeiro você disputa com colegas do ${E.S.player.party} por ${camp.weeks} semanas; só o vencedor segue para a eleição geral.<br>`;
    if (o.sys === 'list_open') t += `<b>Proporcional com lista aberta.</b> São <b>${a.seats} vagas</b>. O total de votos do seu partido define quantas cadeiras ele ganha (quociente eleitoral = votos válidos ÷ vagas); dentro do partido entram os mais votados. Você precisa de pelo menos 10% do quociente. ${c.noLegCoalition ? 'Coligações proporcionais são proibidas.' : ''}`;
    else if (o.sys === 'list_closed') t += `<b>Lista fechada.</b> O eleitor vota no partido; as <b>${a.seats} vagas</b> são distribuídas pelo método D’Hondt e preenchidas pela ordem da lista. Você está na <b>posição ${camp.listPos}</b> — articule no partido para subir.`;
    else if (o.sys === 'majority') t += o.runoff === 'ar' ? '<b>Regra argentina:</b> vence no 1º turno quem tiver 45% dos votos válidos, ou 40% com 10 pontos de vantagem; senão, há 2º turno.' : `<b>Maioria absoluta:</b> ${o.runoff === 'br' && o.arena === 'city' && a.elec <= 200000 ? 'cidade com até 200 mil eleitores — turno único, vence o mais votado.' : 'se ninguém passar de 50% dos votos válidos, os dois primeiros vão ao 2º turno.'}`;
    else if (o.sys === 'plurality') t += a.seats > 1 ? `<b>${a.seats} vagas:</b> os ${a.seats} mais votados são eleitos.` : '<b>Maioria simples:</b> vence quem tiver mais votos, em turno único.';
    else if (o.sys === 'college') t += '<b>Colégio Eleitoral:</b> quem vence em cada estado leva todos os delegados dele. São necessários <b>270 de 538</b>.';
    else if (o.sys === 'parliament') t += `<b>Eleição parlamentar:</b> você lidera seu partido. As cadeiras são distribuídas ${o.method === 'fptp' ? 'por distrito (o mais votado leva)' : 'pelo método D’Hondt em cada região'}. Com maioria (ou uma coalizão), você vira chefe de governo.`;
    else if (o.sys === 'internal') t += '<b>Eleição interna:</b> conquiste a militância das alas do partido. Debates e articulação valem mais que a rua.';
    if (c.tvFree && o.sys !== 'internal') t += '<br><b>Horário eleitoral gratuito</b> começa na semana 3, proporcional ao tamanho dos partidos da sua coligação.';
    if (c.voting === 'urna') t += '<br><b>Urna eletrônica:</b> no dia da eleição, você mesmo digita seu número.';
    return t;
  }
  UI.explainSystem = explainSystem;
  A.startCamp = () => { UI.flash(); UI.banner('Semana 1', 'Começa a campanha'); Sound.levelUp(); UI.go('campaign'); };
})();
