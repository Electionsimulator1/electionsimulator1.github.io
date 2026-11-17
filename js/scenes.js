/* Cenas: entrevista/podcast, debate, comício, urna eletrônica, apuração e resultado */
(function () {
  const Sc = (window.Scenes = {});
  const E = window.Engine, K = window.CONTENT;
  const ic = U.ic, esc = U.esc;
  const camp = () => E.S.camp;
  const me = () => camp().cands.find((c) => c.isP);

  // ================= ENTREVISTA / PODCAST =================
  const CHAT_POS = ['mandou bem!', 'finalmente alguém sensato', 'ganhou meu voto', '👏👏👏', 'resposta firme', 'gostei da proposta', 'isso aí!', 'muito bom'];
  const CHAT_NEG = ['fugiu da pergunta…', 'hmm, não convenceu', 'que vergonha', 'mudou de opinião de novo?', 'zzz', 'quero ver cumprir', 'resposta decorada', 'nada a ver'];
  const NICKS = ['ana_sp', 'joao.oficial', 'eleitor_indeciso', 'marcos77', 'bia.reis', 'ze_do_bairro', 'luiza.m', 'carlos_rj', 'paty', 'rodrigo.b', 'nina', 'pedrinho'];
  Sc.interview = (outlet) => new Promise((resolve) => {
    const qs = E.questionsFor(outlet, 3); const results = []; let qi = 0;
    const host = Avatar.random(Math.random);
    const p = E.S.player;
    const frame = (inner) => `<div class="studio"><div class="row between"><div class="row">${ic(outlet.ic)}<b style="font-family:var(--fh);font-size:18px">${esc(outlet.n)}</b></div><span class="onair">AO VIVO</span></div>
      <div class="row" style="margin-top:14px;align-items:flex-start;gap:18px"><div style="text-align:center">${UI.av(host, 64)}<div class="tiny muted">Apresentação</div></div><div class="grow">${inner}</div><div style="text-align:center">${UI.av(p.av, 64, { bg: me().color })}<div class="tiny muted">Você</div></div></div></div>`;
    const ask = () => {
      const q = qs[qi];
      const opts = U.shuffle(q.a.map((a, i) => ({ a, i })));
      UI.setModal(frame(`<div class="label">Pergunta ${qi + 1} de ${qs.length} · ${K.TOPICS[q.topic].n}</div><div class="qtext" id="qt"></div>
        <div class="answers">${opts.map(({ a, i }) => `<button class="btn" data-ans="${i}"><span>${esc(a.t)}</span><span class="chip">${K.TONES[a.tone]}</span></button>`).join('')}</div>
        <div class="sep"></div><div class="row between"><span class="label">Reação do público</span><span class="tiny muted">${results.length ? 'média ' + Math.round(U.avg(results, (r) => r.score) * 100) : ''}</span></div><div class="meter" style="margin:10px 0"><i id="mt" style="left:${results.length ? U.avg(results, (r) => r.score) * 100 : 50}%"></i></div><div class="chat" id="chat"></div>`));
      // efeito de digitação
      const qt = U.$('#qt'); let k = 0; const txt = q.q; const tt = setInterval(() => { qt.textContent = txt.slice(0, ++k); if (k >= txt.length) clearInterval(tt); }, 14);
      U.$$('[data-ans]').forEach((b) => (b.onclick = () => {
        clearInterval(tt); qt.textContent = txt;
        U.$$('[data-ans]').forEach((x) => (x.disabled = true));
        const ans = q.a[+b.dataset.ans]; const r = E.scoreAnswer(ans, outlet.lean, outlet.diff); results.push(r);
        b.style.borderColor = r.score > 0.55 ? 'var(--good)' : r.score < 0.42 ? 'var(--bad)' : 'var(--warn)';
        U.$('#mt').style.left = r.score * 100 + '%';
        const chat = U.$('#chat'); let n = 0;
        const pool = r.score >= 0.5 ? CHAT_POS : CHAT_NEG;
        const iv = setInterval(() => {
          const pos = Math.random() < (r.score >= 0.5 ? 0.8 : 0.25);
          chat.insertAdjacentHTML('beforeend', `<div><b>@${U.pick(NICKS)}</b> ${esc(U.pick(pos ? CHAT_POS : CHAT_NEG))}</div>`);
          Sound.sfx('pop', 0.35);
          if (++n > 6) { clearInterval(iv); }
        }, 160);
        if (r.gaffe) { UI.toast('Gafe! O trecho já circula nas redes.', 'b', 'Flame'); Sound.bad(); }
        else if (r.viral) { UI.toast('Frase de efeito viralizou!', 'g', 'Flame'); Sound.good(); }
        else if (r.score > 0.55) Sound.good();
        setTimeout(() => { qi++; if (qi < qs.length) ask(); else finish(); }, 1700);
      }));
    };
    const finish = () => {
      const res = E.applyInterview(outlet, results);
      UI.setModal(frame(`<h2>Fim da entrevista</h2><div style="font-family:var(--fh);font-size:56px;font-weight:900;color:${res.avg >= 0.55 ? 'var(--good)' : res.avg >= 0.45 ? 'var(--warn)' : 'var(--bad)'}">${Math.round(res.avg * 100)}<span style="font-size:20px">/100</span></div>${UI.fxList(res.fx)}<div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn primary" id="iok">Voltar à campanha</button></div>`));
      if (res.avg >= 0.6) { UI.confetti(50); Sound.levelUp(); }
      U.$('#iok').onclick = () => { UI.closeModal(); UI.CP.update(); E.save(); resolve(); };
    };
    UI.modal('', { cls: 'wide', close: false }); ask();
  });

  // ================= DEBATE =================
  Sc.debate = () => new Promise((resolve) => {
    const c = camp(); const p = E.S.player;
    const lp = c.polls.filter((x) => !x.sep).slice(-1)[0];
    const opps = E.activeCands().filter((x) => !x.isP).sort((a, b) => ((lp && lp.res[b.id]) || 0) - ((lp && lp.res[a.id]) || 0)).slice(0, 3);
    const parts = [me()].concat(opps);
    const score = {}; parts.forEach((x) => (score[x.id] = 50));
    const topics = U.shuffle(E.questionsFor({ lean: [0, 0] }, 3));
    let round = 0; const prep = (c.flags.prep || 0) * 4 + (c.staff.includes('imprensa') ? 6 : 0);
    const mod = Avatar.random(Math.random);
    const stage = (speaking, inner) => `<div class="studio"><div class="row between"><b style="font-family:var(--fh);font-size:18px">${ic('Tv')} Debate — ${E.officeDef(c.oid).name}</b><span class="onair">AO VIVO</span></div>
      <div class="podiums">${parts.map((x) => `<div class="podium ${speaking === x.id ? 'speaking' : ''}">${UI.av(x.av, 64, { bg: x.color, style: 'margin:0 auto' })}<div class="stand" style="background:linear-gradient(180deg,${x.color},${U.mix(x.color, '#000000', 0.5)})">${esc(x.isP ? 'VOCÊ' : x.ballot.split(' ')[0].toUpperCase())}</div><div class="sc num" id="sc_${x.id}">${Math.round(score[x.id])}</div></div>`).join('')}</div>${inner}</div>`;
    const bump = (id, v) => { score[id] = U.clamp(score[id] + v, 0, 100); const el = U.$('#sc_' + id); if (el) { el.textContent = Math.round(score[id]); el.animate([{ transform: 'scale(1.5)', color: v >= 0 ? '#86efac' : '#fca5a5' }, { transform: 'scale(1)' }], { duration: 500 }); } };
    const aiTurn = () => opps.forEach((o) => bump(o.id, (o.attrs.ora - 55) / 6 + U.rand(-6, 9) + (o.str - 0.5) * 10));
    const doRound = () => {
      const q = topics[round];
      const target = opps[round % opps.length];
      const opts = [
        { k: 'proposta', t: 'Apresentar proposta concreta', d: 'Inteligência + promessas no tema', st: 'int' },
        { k: 'ataque', t: `Atacar ${target ? target.ballot : 'adversário'}`, d: 'Oratória; arriscado', st: 'ora' },
        { k: 'emocao', t: 'Apelo emocional', d: 'Carisma', st: 'car' },
        { k: 'historico', t: 'Defender sua trajetória', d: 'Experiência e reputação', st: 'intg' },
        { k: 'evasiva', t: 'Fugir da pergunta', d: 'Seguro, mas fraco', st: null },
      ];
      UI.setModal(stage(null, `<div class="label">Bloco ${round + 1} de 3 · ${K.TOPICS[q.topic].n}</div><div class="qtext">${esc(q.q)}</div><div class="answers">${opts.map((o) => `<button class="btn" data-dk="${o.k}"><span><b>${o.t}</b><br><span class="tiny muted">${o.d}</span></span>${o.st ? `<span class="chip">${o.st === 'int' ? 'INT' : o.st === 'ora' ? 'ORA' : o.st === 'car' ? 'CAR' : 'REP'} ${o.st === 'intg' ? Math.round(p.rep) : p.attrs[o.st]}</span>` : ''}</button>`).join('')}</div>`));
      let lockD = false;
      U.$$('[data-dk]').forEach((b) => (b.onclick = () => {
        if (lockD) return; lockD = true; U.$$('[data-dk]').forEach((x) => (x.disabled = true));
        const k = b.dataset.dk; let gain = 0, msg = '';
        const hasProm = c.promises.some((pid) => (E.promiseDef(pid) || {}).topic === q.topic);
        const roll = U.rand(-10, 10);
        if (k === 'proposta') { gain = (p.attrs.int - 50) / 3 + (hasProm ? 9 : 0) + prep + roll; msg = hasProm ? 'Você detalhou sua promessa com números.' : 'Proposta bem colocada.'; }
        if (k === 'ataque') { if (Math.random() < 0.25 - p.attrs.ora / 600) { gain = -12; msg = 'O ataque soou agressivo demais.'; } else { gain = (p.attrs.ora - 50) / 2.5 + 6 + roll; if (target) bump(target.id, -10 - p.attrs.ora / 15); msg = `${target ? target.ballot : 'O adversário'} ficou sem resposta!`; } }
        if (k === 'emocao') { gain = (p.attrs.car - 50) / 2.6 + 4 + roll; msg = 'A plateia se emocionou.'; }
        if (k === 'historico') { const exp = E.heldIds().size; gain = (p.rep - 50) / 3 + exp * 3 + roll - (exp ? 0 : 8); msg = exp ? 'Sua experiência pesou a favor.' : 'Faltou histórico para mostrar.'; }
        if (k === 'evasiva') { gain = -3 + roll / 3; msg = 'Resposta morna.'; }
        bump('P', gain); aiTurn();
        Sound[gain > 6 ? 'good' : gain < 0 ? 'bad' : 'sfx'](gain > 6 || gain < 0 ? undefined : 'select');
        UI.toast(msg, gain >= 0 ? 'g' : 'b', 'Tv');
        // réplica de um adversário
        setTimeout(() => {
          const att = U.pick(opps);
          if (!att) return next();
          UI.setModal(stage(att.id, `<div class="label">Direito de resposta</div><div class="qtext">${esc(att.ballot)}: “${esc(U.pick(['Você não tem experiência para o cargo!', 'Suas promessas não cabem no orçamento!', 'Seu partido é o responsável pela crise!', 'Você muda de opinião conforme o vento!']))}”</div>
            <div class="answers"><button class="btn" data-rp="dados"><span><b>Rebater com dados</b></span><span class="chip">INT ${p.attrs.int}</span></button><button class="btn" data-rp="calma"><span><b>Manter a calma e sorrir</b></span><span class="chip">CAR ${p.attrs.car}</span></button><button class="btn" data-rp="contra"><span><b>Contra-atacar</b></span><span class="chip">ORA ${p.attrs.ora}</span></button></div>`));
          let lockR = false;
          U.$$('[data-rp]').forEach((bb) => (bb.onclick = () => {
            if (lockR) return; lockR = true; U.$$('[data-rp]').forEach((x) => (x.disabled = true));
            const st = { dados: 'int', calma: 'car', contra: 'ora' }[bb.dataset.rp];
            const ok = Math.random() < U.clamp(0.45 + (p.attrs[st] - 55) / 70 + prep / 60, 0.1, 0.92);
            const g = ok ? (bb.dataset.rp === 'contra' ? 9 : 6) : bb.dataset.rp === 'contra' ? -9 : -4;
            bump('P', g); bump(att.id, ok ? -5 : 4);
            UI.toast(ok ? 'Boa resposta!' : 'Você se enrolou na resposta…', ok ? 'g' : 'b', 'MessageCircle'); Sound[ok ? 'good' : 'bad']();
            setTimeout(next, 800);
          }));
        }, 1100);
      }));
    };
    const next = () => { round++; if (round < 3) doRound(); else finish(); };
    let finished = false;
    const finish = () => {
      if (finished) return; finished = true;
      const norm = {}; for (const k in score) norm[k] = U.clamp(score[k] / 100, 0, 1);
      const per = {}; opps.forEach((o) => (per[o.id] = norm[o.id]));
      const res = E.applyDebate(norm.P, per);
      const win = res.winner === 'P';
      UI.setModal(stage(res.winner, `<h2 style="text-align:center">${win ? '🏆 Você venceu o debate!' : 'Fim do debate'}</h2>${UI.fxList(res.fx)}<div class="row center" style="margin-top:14px"><button class="btn primary big" id="dok">Voltar à campanha</button></div>`));
      if (win) { UI.confetti(120); Sound.fanfare(); } else Sound.sfx('confirm2');
      U.$('#dok').onclick = () => { UI.closeModal(); UI.CP.update(); E.save(); resolve(); };
    };
    UI.modal('', { cls: 'wide', close: false }); doRound();
  });

  // ================= COMÍCIO (discurso) =================
  Sc.speech = (zid) => new Promise((resolve) => {
    const z = camp().arena.zones.find((x) => x.id === zid);
    const lines = E.speechLines(zid); const chosen = [];
    const crowd = Array.from({ length: 46 }, (_, i) => `<i style="left:${(i * 2.2) % 100}%;bottom:${(i % 3) * 14}px;background:hsl(${(i * 47) % 360},25%,${30 + (i % 4) * 6}%);animation-delay:${(i % 7) * 60}ms"></i>`).join('');
    const render = () => `<h2>${ic('Megaphone')} Comício em ${esc(z.n)}</h2><div class="muted small" style="margin:4px 0 10px">Monte seu discurso com 3 frases. A multidão reage ao que importa para ela.</div>
      <div class="crowd" id="crowd">${crowd}</div>
      <div class="row between" style="margin:10px 0 4px"><span class="label">Animação da plateia</span><b class="num" id="hype">${Math.round(hype() * 100)}%</b></div><div class="meter"><i style="left:${hype() * 100}%"></i></div>
      <div class="answers" style="margin-top:14px">${lines.map((l, i) => `<button class="btn ${chosen.includes(i) ? 'off' : ''}" data-ln="${i}"><span>“${esc(l.t)}”</span><span class="chip">${ic(K.TOPICS[l.topic].ic)}${K.TOPICS[l.topic].n}</span></button>`).join('')}</div>
      <div class="row between" style="margin-top:12px"><button class="btn" id="spcancel">Cancelar</button><span class="muted small">${chosen.length}/3 frases</span></div>`;
    const hype = () => (chosen.length ? U.avg(chosen, (i) => lines[i].react) : 0.5);
    const bind = () => {
      U.$('#spcancel').onclick = () => { UI.closeModal(); resolve(null); };
      U.$$('[data-ln]').forEach((b) => (b.onclick = () => {
        const i = +b.dataset.ln; if (chosen.includes(i) || chosen.length >= 3) return; chosen.push(i); const r = lines[i].react;
        UI.setModal(render()); bind();
        const cr = U.$('#crowd'); if (r > 0.55) { cr.classList.add('cheer'); Sound.crowd(1.2, r); } else Sound.sfx('scratch', 0.4);
        if (chosen.length >= 3) {
          setTimeout(() => { const q = U.clamp(0.4 + hype() * 0.9 + (E.S.player.attrs.ora - 50) / 200, 0.4, 1.4); UI.closeModal(); resolve(q); }, 1100);
        }
      }));
    };
    UI.modal(render(), { cls: 'wide', close: false }); bind();
  });

  // ================= DIA DA ELEIÇÃO =================
  Sc.electionDay = async () => {
    const c = camp();
    Sound.music(null);
    UI.flash('rgba(255,255,255,.5)');
    UI.banner('Dia da eleição', c.stage === 'runoff' ? '2º turno' : c.stage === 'primary' ? 'Primárias' : E.S.year);
    await U.sleep(1500);
    const R = E.runElection();
    if (E.country().voting === 'urna') await Sc.urna(R); else await Sc.ballot(R);
    UI.state.lastR = R;
    UI.go('night');
  };

  // urna eletrônica interativa
  Sc.urna = (R) => new Promise((resolve) => {
    const c = camp(); const o = E.officeDef(c.oid); const mc = me(); const digits = String(mc.num).length;
    let typed = '', done = false;
    const cargo = o.name.replace(/\(.*\)/, '').replace('(a)', '').toUpperCase();
    const find = (num) => c.cands.find((x) => String(x.num) === num && !x.out);
    const screen = () => {
      if (done) return `<div class="fim">FIM</div><div style="text-align:center;font-size:13px">VOTOU</div>`;
      const cand = typed.length === digits ? find(typed) : null;
      const ds = Array.from({ length: digits }, (_, i) => `<span class="${i === typed.length ? 'cur' : ''}">${typed[i] || ''}</span>`).join('');
      return `<div class="t1">SEU VOTO PARA</div><div class="t2">${cargo}</div>
        <div class="row" style="gap:10px"><span style="font-size:14px">Número:</span><div class="digits">${ds}</div></div>
        ${typed.length === digits ? (cand ? `<div class="cinfo">Nome: <b>${esc(cand.ballot.toUpperCase())}</b><br>Partido: <b>${esc(cand.party || '')}</b>${c.vice && cand.isP ? `<br>Vice: ${esc(c.vice.name)}` : ''}</div><div class="photo">${Avatar.svg(cand.av, { bg: '#cbd5e1' })}</div>` : `<div class="cinfo"><b>NÚMERO ERRADO</b><br><span style="font-size:22px;font-weight:bold">VOTO NULO</span></div>`) : ''}
        ${typed.length === digits ? `<div class="hintU">Aperte a tecla:<br><b>CONFIRMA</b> para CONFIRMAR este voto<br><b>CORRIGE</b> para REINICIAR este voto</div>` : ''}`;
    };
    const html = `<div style="text-align:center;margin-bottom:16px"><h2>${ic('Vote')} Sua vez de votar</h2><div class="muted small">Digite o seu número: <b class="num" style="color:var(--acc2);font-size:16px">${mc.num}</b> e aperte CONFIRMA.</div></div>
      <div class="urna"><div class="screenU" id="us">${screen()}</div>
        <div class="pad"><div class="logoU">JUSTIÇA ELEITORAL</div><div class="keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button class="key" data-k="${n}">${n}</button>`).join('')}<span></span><button class="key" data-k="0">0</button><span></span></div>
        <div class="fkeys"><button class="fk branco" data-f="branco">BRANCO</button><button class="fk corrige" data-f="corrige">CORRIGE</button><button class="fk confirma" data-f="confirma">CONFIRMA</button></div></div></div>`;
    const keyHandler = (e) => { if (/^[0-9]$/.test(e.key)) press(e.key); else if (e.key === 'Enter') fn('confirma'); else if (e.key === 'Backspace') fn('corrige'); };
    const press = (k) => { if (done || typed.length >= digits) return; typed += k; Sound.urnaKey(); U.$('#us').innerHTML = screen(); const b = U.$(`[data-k="${k}"]`); if (b) { b.classList.add('press'); setTimeout(() => b.classList.remove('press'), 120); } };
    const fn = (f) => {
      if (done) return;
      if (f === 'corrige') { typed = ''; Sound.urnaKey(); U.$('#us').innerHTML = screen(); return; }
      if (f === 'branco') { typed = ''; Sound.urnaKey(); UI.toast('Voto em branco? Que tal votar em você mesmo(a)!', '', 'Smile'); return; }
      if (f === 'confirma') {
        if (typed.length < digits) { Sound.urnaWrong(); return; }
        done = true; Sound.urnaConfirm(); U.$('#us').innerHTML = screen();
        if (typed !== String(mc.num)) UI.toast('Você anulou o próprio voto! 😅', 'b', 'Ban');
        document.removeEventListener('keydown', keyHandler);
        setTimeout(() => { UI.closeModal(); resolve(); }, 2100);
      }
    };
    UI.modal(html, { cls: 'xwide', close: false, mount: (el) => {
      el.querySelectorAll('[data-k]').forEach((b) => (b.onclick = () => press(b.dataset.k)));
      el.querySelectorAll('[data-f]').forEach((b) => (b.onclick = () => fn(b.dataset.f)));
    } });
    document.addEventListener('keydown', keyHandler);
  });

  // cédula de papel (outros países)
  Sc.ballot = (R) => new Promise((resolve) => {
    const c = camp(); const mc = me();
    const list = E.activeCands().slice(0, 8);
    UI.modal(`<div style="text-align:center"><h2>${ic('Vote')} Sua vez de votar</h2><div class="muted small">Marque o seu nome na cédula.</div></div>
      <div style="max-width:440px;margin:16px auto;background:#f8f5ec;color:#111;border-radius:6px;padding:18px;box-shadow:0 20px 50px rgba(0,0,0,.5);font-family:Georgia,serif">
        <div style="text-align:center;font-weight:bold;letter-spacing:.1em;border-bottom:2px solid #111;padding-bottom:8px;margin-bottom:10px">CÉDULA OFICIAL · ${esc(E.officeDef(c.oid).name.toUpperCase())}</div>
        ${list.map((x) => `<label style="display:flex;align-items:center;gap:12px;padding:8px 4px;border-bottom:1px dashed #999;cursor:pointer"><span data-bx="${x.id}" style="width:22px;height:22px;border:2px solid #111;display:grid;place-items:center;font-weight:bold"></span><span style="flex:1">${esc(x.isP ? E.S.player.ballot : x.ballot)}</span><span style="font-size:12px;color:#555">${esc(x.party || '')}</span></label>`).join('')}
      </div><div class="row center"><button class="btn primary big" id="bdrop" disabled>${ic('ArrowDown') || ''} Depositar na urna</button></div>`, {
      cls: 'wide', close: false, mount: (el) => {
        let pick = null;
        el.querySelectorAll('[data-bx]').forEach((b) => (b.parentElement.onclick = () => { el.querySelectorAll('[data-bx]').forEach((x) => (x.textContent = '')); b.textContent = '✕'; pick = b.dataset.bx; Sound.sfx('scratch'); el.querySelector('#bdrop').disabled = false; }));
        el.querySelector('#bdrop').onclick = () => { Sound.sfx('drop'); Sound.chime(); if (pick !== 'P') UI.toast('Você não votou em si mesmo(a)?!', 'b', 'Smile'); setTimeout(() => { UI.closeModal(); resolve(); }, 700); };
      },
    });
  });

  // ================= APURAÇÃO =================
  UI.screens.night = () => {
    const R = UI.state.lastR; const c = camp(); const o = E.officeDef(c.oid);
    const sysLabel = { list_open: 'Votação nominal (lista aberta)', list_closed: 'Votos por partido', majority: 'Votos válidos', plurality: 'Votos válidos', college: 'Voto popular', parliament: 'Votos por partido', internal: 'Votos da militância' }[R.sys];
    return {
      html: `<div class="screen"><div class="suspense" id="susp"></div><div class="night">
        <div class="col" style="min-height:0">
          <div class="panel hdr"><div class="grow"><div class="label">${E.country().voting === 'urna' ? 'Totalização · Justiça Eleitoral' : 'Noite eleitoral'} · ${E.S.year}</div><h2 style="font-size:24px">${o.name} — ${esc(c.arena.fullName)}</h2></div><div style="text-align:right"><div class="label">${E.country().voting === 'urna' ? 'Seções totalizadas' : 'Urnas apuradas'}</div><b class="num" style="font-size:30px" id="pct">0,00%</b></div></div>
          <div class="panel" style="padding:12px"><div class="prog"><i id="pbar" style="width:0%"></i></div></div>
          <div class="panel mapwrap grow" style="min-height:300px"><div id="nmap" style="position:absolute;inset:8px">${MapR.svg(c.arena, {}, { labels: c.arena.zones.length <= 18 })}</div><div class="legend" id="ncall"></div></div>
        </div>
        <div class="panel col" style="padding:14px;min-height:0;overflow:auto"><div class="row between"><div class="label">${sysLabel}</div><span class="chip" id="callchip">${ic('Hourglass') || ''} apurando…</span></div><div id="bars" style="margin-top:10px"></div><div id="extra"></div></div>
      </div></div>`,
      mount: () => Sc.count(R),
    };
  };

  Sc.count = async (R) => {
    const c = camp(); const mc = R.cands.find((x) => x.isP);
    const zones = c.arena.zones; const zmap = {}; zones.forEach((z) => (zmap[z.id] = z));
    // ordem de chegada: regiões reportam em blocos com progresso individual
    const prog = {}; zones.forEach((z) => (prog[z.id] = 0));
    const order = R.order;
    const startAt = {}; order.forEach((zid, i) => (startAt[zid] = (i / order.length) * 0.6 + Math.random() * 0.15));
    const top = R.cands.slice(0, R.sys === 'list_open' ? 6 : 7);
    if (R.sys === 'list_open' && !top.includes(mc)) top.push(mc);
    const close = R.sys === 'list_open' ? Math.abs((R.extra.list.needed || 0)) < mc.votes * 0.25 : (R.cands.length > 1 && Math.abs(R.cands[0].pct - R.cands[1].pct) < 0.06) || (R.sys === 'majority' && Math.abs(R.cands[0].pct - 0.5) < 0.04);
    const dur = close ? 19000 : 13000;
    Sound.tension(0.2); Sound.heartbeat(true, 1);
    const bars = U.$('#bars');
    bars.innerHTML = top.map((x) => `<div class="cand-bar ${x.isP ? 'me' : ''}" id="cb_${x.id}">${UI.av(x.av, 48, { bg: x.color })}<div><div class="row between"><b>${esc(x.isP ? E.S.player.ballot : x.name)}</b><span class="pc" id="cp_${x.id}">0,0%</span></div>${UI.bar(0, x.color)}<div class="row between tiny muted" style="margin-top:4px"><span>${esc(x.party || '')} ${x.num ? '· ' + x.num : ''}</span><span id="cv_${x.id}">0 votos</span></div></div></div>`).join('');
    const t0 = performance.now();
    let lastSort = 0, suspOn = false;
    const called = {};
    await new Promise((res) => {
      const step = () => {
        let t = (performance.now() - t0) / dur;
        // desaceleração dramática no fim quando é apertado
        let T = close ? (t < 0.75 ? t * 1.1 : 0.825 + (t - 0.75) * 0.7) : t;
        T = Math.min(1, T);
        zones.forEach((z) => { const s = startAt[z.id]; prog[z.id] = U.clamp((T - s) / 0.35, 0, 1); });
        if (t >= 1) zones.forEach((z) => (prog[z.id] = 1));
        // parciais
        const part = {}; let tv = 0, totPop = 0, rep = 0;
        R.cands.forEach((x) => (part[x.id] = 0));
        zones.forEach((z) => { const zv = R.zones[z.id]; R.cands.forEach((x) => (part[x.id] += (zv[x.id] || 0) * prog[z.id])); tv += zv._valid * prog[z.id]; rep += z.share * prog[z.id]; });
        const denom = R.sys === 'list_open' ? tv : U.sum(Object.values(part));
        const pctTxt = U.fmtNum1(rep * 100, 2) + '%';
        U.$('#pct').textContent = pctTxt; U.$('#pbar').style.width = rep * 100 + '%';
        top.forEach((x) => {
          const v = part[x.id], pc = denom ? v / denom : 0;
          const el = U.$('#cp_' + x.id); if (el) el.textContent = U.fmtPct(pc, R.sys === 'list_open' ? 2 : 1);
          const vv = U.$('#cv_' + x.id); if (vv) vv.textContent = U.fmtInt(v) + ' votos';
          const bi = U.$(`#cb_${x.id} .bar i`); if (bi) bi.style.width = Math.min(100, pc * (R.sys === 'list_open' ? 1500 : 100)) + '%';
        });
        // reordena
        if (performance.now() - lastSort > 600) {
          lastSort = performance.now();
          const sorted = top.slice().sort((a, b) => part[b.id] - part[a.id]);
          sorted.forEach((x, i) => { const el = U.$('#cb_' + x.id); if (el) { el.style.order = i; el.classList.toggle('lead', i === 0 && rep > 0.05); } });
          bars.style.display = 'flex'; bars.style.flexDirection = 'column';
        }
        // mapa
        const cols = {};
        zones.forEach((z) => {
          if (prog[z.id] <= 0) { cols[z.id] = '#1e293b'; return; }
          const zv = R.zones[z.id]; let best = null, bv = -1; R.cands.forEach((x) => { if ((zv[x.id] || 0) > bv) { bv = zv[x.id]; best = x; } });
          cols[z.id] = U.mix('#1e293b', best.color, 0.25 + 0.75 * prog[z.id]);
          if (R.sys === 'college' && prog[z.id] > 0.6 && !called[z.id]) { called[z.id] = best.id; if (z.ev >= 10) UI.toast(`PROJEÇÃO: ${esc(best.isP ? 'você' : best.name)} vence em ${esc(z.n)} (${z.ev})`, best.isP ? 'g' : 'b', 'Flag'); }
        });
        MapR.recolor(U.$('#nmap'), cols);
        if (R.sys === 'college') { const ev = {}; Object.values(called).forEach((cid, i) => { const zid = Object.keys(called)[i]; ev[cid] = (ev[cid] || 0) + zmap[zid].ev; }); U.$('#ncall').innerHTML = `Delegados: <b style="color:var(--acc)">você ${ev.P || 0}</b> · ${R.cands.filter((x) => !x.isP).slice(0, 2).map((x) => `${esc(x.name.split(' ')[0])} ${ev[x.id] || 0}`).join(' · ')} · meta 270`; }
        // suspense
        const tl = Math.min(1, rep * 1.1);
        Sound.tension(0.2 + tl * 0.8); Sound.heartbeat(true, 1 + tl * 1.2 + (close ? 0.4 : 0));
        if (close && rep > 0.7 && !suspOn) { suspOn = true; U.$('#susp').classList.add('on'); UI.toast('Disputa apertada! Voto a voto…', 'big', 'Siren'); }
        if (t < 1) requestAnimationFrame(step); else res();
      };
      requestAnimationFrame(step);
    });
    U.$('#pct').textContent = '100,00%';
    // revelação
    await U.sleep(400);
    Sound.heartbeat(false); Sound.drumroll(2.6);
    U.$('#callchip').innerHTML = 'resultado…';
    await U.sleep(2700);
    Sound.tension(0); U.$('#susp').classList.remove('on');
    Sound.crash();
    const out = R.outcome;
    const won = out === 'won' || out === 'primary_won';
    const mid = out === 'runoff';
    const big = won ? (out === 'primary_won' ? 'VENCEU AS<br>PRIMÁRIAS!' : (E.S.player.g === 'f' ? 'ELEITA!' : 'ELEITO!')) : mid ? '2º TURNO!' : 'NÃO FOI<br>DESTA VEZ';
    const sub = won ? `${E.officeDef(camp().oid).name} · ${esc(camp().arena.fullName)}` : mid ? `Você e ${esc(R.cands.find((x) => R.runoff.includes(x.id) && !x.isP).name)} disputam o 2º turno` : `Você terminou em ${R.myPos}º lugar`;
    UI.flash(won ? 'rgba(250,204,21,.7)' : mid ? 'rgba(56,189,248,.5)' : 'rgba(239,68,68,.45)');
    if (won) { Sound.fanfare(); setTimeout(() => Sound.crowd(4, 1.4), 900); UI.confetti(260); setTimeout(() => UI.confetti(160), 900); } else if (mid) { Sound.levelUp(); Sound.crowd(2.5, 0.8); } else Sound.defeat();
    U.$('#callchip').innerHTML = won ? `${ic('Trophy')} vitória` : mid ? `${ic('Repeat')} 2º turno` : 'derrota';
    U.$('#extra').innerHTML = Sc.extraHtml(R);
    const v = document.createElement('div'); v.className = 'verdict';
    v.innerHTML = `<div class="box">${UI.av(E.S.player.av, 180, { bg: mc ? mc.color : '#334155', mood: won ? 'happy' : mid ? 'smile' : 'sad', style: 'margin:0 auto 18px' })}<div class="vbig ${won ? "win" : mid ? "mid" : "lose"}">${big}</div><div class="muted" style="font-size:18px;margin-top:12px">${sub}</div>
      <div class="row center gap16" style="margin-top:14px"><span class="chip" style="font-size:14px">${U.fmtInt(mc ? mc.votes : 0)} votos</span><span class="chip" style="font-size:14px">${U.fmtPct(mc ? mc.pct : 0, R.sys === 'list_open' ? 2 : 1)}</span></div>
      <div class="row center gap16" style="margin-top:22px"><button class="btn" id="vdet">${ic('ChartColumn')} Ver detalhes</button><button class="btn primary big" id="vgo">Continuar ${ic('ArrowRight')}</button></div></div>`;
    document.body.appendChild(v);
    v.querySelector('#vdet').onclick = () => { v.remove(); U.$('#callchip').insertAdjacentHTML('afterend', `<button class="btn primary sm" id="vgo2" style="margin-left:8px">Continuar ${ic('ArrowRight')}</button>`); U.$('#vgo2').onclick = () => Sc.afterResult(R); };
    v.querySelector('#vgo').onclick = () => { v.remove(); Sc.afterResult(R); };
  };

  Sc.extraHtml = (R) => {
    let h = '<div class="sep"></div>';
    if (R.extra.list) {
      const L = R.extra.list;
      h += `<div class="label">Seu partido (${esc(E.S.player.party)})</div><div class="statgrid"><div class="sb"><small>Quociente</small><b>${U.fmtInt(L.qe)}</b></div><div class="sb"><small>Cadeiras do partido</small><b>${L.seatsP[E.S.player.party] || 0}</b></div></div>
        <div class="col gap4" style="margin-top:10px">${L.myList.map((x, i) => `<div class="row small" style="padding:5px 8px;border-radius:8px;${x.isP ? 'background:rgba(var(--accRGB),.15)' : ''}"><span class="num muted" style="width:20px">${i + 1}º</span><span class="grow">${esc(x.isP ? 'Você' : x.name)}</span><span class="num">${U.fmtInt(x.votes)}</span>${x.elected ? `<span class="chip good">eleito</span>` : ''}</div>`).join('')}</div>`;
      const parts = Object.entries(L.seatsP).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).map(([pid, n]) => ({ n, color: (E.party(pid) || { color: '#64748b' }).color, hl: pid === E.S.player.party, pid }));
      h += `<div class="sep"></div><div class="label">Composição da ${esc(E.officeDef(camp().oid).house || 'Casa')}</div>${MapR.hemicycle(parts, L.seats, {})}<div class="row wrap gap4">${parts.map((p) => `<span class="chip"><span class="pdot" style="background:${p.color}"></span>${p.pid} ${p.n}</span>`).join('')}</div>`;
    }
    if (R.extra.seats || R.extra.parl) {
      const X = R.extra.seats || R.extra.parl; const seats = X.seats; const total = X.total;
      const parts = Object.entries(seats).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).map(([pid, n]) => ({ n, color: (E.party(pid) || { color: '#64748b' }).color, hl: pid === E.S.player.party, pid }));
      h += `<div class="label">Cadeiras</div>${MapR.hemicycle(parts, total, { majority: X.majority, center: seats[E.S.player.party] || 0 })}<div class="row wrap gap4">${parts.map((p) => `<span class="chip"><span class="pdot" style="background:${p.color}"></span>${p.pid} ${p.n}</span>`).join('')}</div>`;
      if (R.extra.parl && R.extra.parl.coalition.length > 1) h += `<div class="small" style="margin-top:8px">${ic('Handshake')} Coalizão: ${R.extra.parl.coalition.join(' + ')} = <b>${R.extra.parl.coalSeats}</b> cadeiras</div>`;
      if (R.extra.seats) h += `<div class="small muted" style="margin-top:8px">Você era o ${R.extra.seats.pos}º da lista.</div>`;
    }
    if (R.extra.college) { const ev = R.extra.college.ev; h += `<div class="label">Colégio Eleitoral</div>${R.cands.slice(0, 3).map((x) => `<div class="row between" style="margin:6px 0"><span>${esc(x.isP ? 'Você' : x.name)}</span><b class="num" style="color:${x.color}">${ev[x.id] || 0}</b></div>`).join('')}${UI.bar((ev.P || 0) / 538, 'var(--acc)', 'tall')}<div class="tiny muted">270 para vencer</div>`; }
    h += `<div class="tiny muted" style="margin-top:10px">Votos válidos: ${U.fmtInt(R.valid)}${E.S.country === 'BR' ? ` · brancos e nulos: ${U.fmtInt(R.bn)}` : ''} · abstenção: ${U.fmtInt(R.abst)}</div>`;
    return h;
  };

  Sc.afterResult = (R) => {
    const r = E.applyResult(R); E.save();
    if (r.next === 'runoff' || r.next === 'general') { UI.banner(r.next === 'runoff' ? '2º turno' : 'Eleição geral', 'Nova fase'); UI.go('campaign'); return; }
    UI.state.postResult = { R, r };
    UI.go('career');
    setTimeout(() => {
      if (r.won) UI.modal(`<div style="text-align:center">${ic('Trophy', 'good')}<h2 style="margin:10px 0">Bem-vindo(a) ao cargo!</h2><p class="muted">Você assume como <b>${esc(R.officeName)}</b>. Fama +${Math.round(r.fameGain)}.<br>Agora é governar: cumpra promessas, administre crises e prepare a próxima eleição.</p><button class="btn primary big" data-mclose>Vamos lá</button></div>`, { cls: 'narrow' });
      else UI.modal(`<div style="text-align:center">${ic('RotateCcw')}<h2 style="margin:10px 0">A carreira continua</h2><p class="muted">Derrotas também constroem nome: fama +${Math.round(r.fameGain)}. Use os próximos semestres para crescer e tente de novo.</p><button class="btn primary big" data-mclose>Continuar</button></div>`, { cls: 'narrow' });
    }, 700);
  };
})();
