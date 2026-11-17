/* Núcleo da interface: navegação, modais, toasts, efeitos, confete */
(function () {
  const UI = (window.UI = {});
  const ic = U.ic, esc = U.esc;
  UI.screens = {}; UI.acts = {}; UI.cur = null; UI.params = null; UI.state = {};

  UI.go = (name, params = {}) => {
    const app = U.$('#app');
    const prev = app.firstElementChild;
    const render = () => {
      UI.cur = name; UI.params = params;
      const r = UI.screens[name](params);
      app.innerHTML = typeof r === 'string' ? r : r.html;
      if (r && r.mount) r.mount(app.firstElementChild);
      app.scrollTop = 0;
    };
    if (prev) { prev.classList.add('out'); setTimeout(render, 180); } else render();
    Sound.sfx('whoosh');
  };
  UI.refresh = () => {
    const app = U.$('#app'); const sc = app.firstElementChild; const scrollers = sc ? U.$$('.page, .content, .results', sc).map((e) => e.scrollTop) : [];
    const r = UI.screens[UI.cur](UI.params); app.innerHTML = typeof r === 'string' ? r : r.html;
    const ns = app.firstElementChild; if (ns) ns.classList.add('noanim');
    U.$$('.page, .content, .results', ns).forEach((e, i) => { if (scrollers[i]) e.scrollTop = scrollers[i]; });
    if (r && r.mount) r.mount(ns);
  };

  // ---------- modais ----------
  const stack = [];
  UI.modal = (html, opts = {}) => new Promise((resolve) => {
    const back = document.createElement('div'); back.className = 'mback';
    back.innerHTML = `<div class="modal panel ${opts.cls || ''}">${opts.close !== false ? `<button class="btn ghost iconbtn x" data-mclose>${ic('X')}</button>` : ''}${html}</div>`;
    U.$('#modals').appendChild(back);
    const m = { back, resolve, opts };
    stack.push(m);
    back.addEventListener('click', (e) => {
      if (e.target === back && opts.close !== false && opts.backdrop !== false) UI.closeModal(null);
      if (e.target.closest('[data-mclose]')) UI.closeModal(null);
    });
    Sound.sfx('open', 0.6);
    if (opts.mount) opts.mount(back.querySelector('.modal'), m);
  });
  UI.closeModal = (val) => {
    const m = stack.pop(); if (!m) return;
    m.back.style.animation = 'fadeIn .18s reverse forwards';
    setTimeout(() => m.back.remove(), 170);
    Sound.sfx('close', 0.5);
    m.resolve(val);
  };
  UI.topModal = () => (stack.length ? stack[stack.length - 1].back.querySelector('.modal') : null);
  UI.setModal = (html) => { const m = UI.topModal(); if (!m) return; const x = m.querySelector('.x'); m.innerHTML = (x ? x.outerHTML : '') + html; };
  UI.confirm = (title, text, ok = 'Confirmar', cancel = 'Cancelar') => UI.modal(`
    <h2>${title}</h2><p class="muted" style="line-height:1.55">${text}</p>
    <div class="row" style="justify-content:flex-end;margin-top:18px"><button class="btn" data-mclose>${cancel}</button><button class="btn primary" id="okbtn">${ok}</button></div>`, { cls: 'narrow', mount: (el) => el.querySelector('#okbtn').onclick = () => UI.closeModal(true) });

  // ---------- toasts e textos flutuantes ----------
  UI.toast = (t, kind = '', icon) => {
    const el = document.createElement('div'); el.className = 'toast ' + kind;
    el.innerHTML = (icon || kind ? ic(icon || (kind === 'g' ? 'TrendingUp' : kind === 'b' ? 'TrendingDown' : 'Info')) : '') + `<span>${t}</span>`;
    U.$('#toasts').appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, kind === 'big' ? 4200 : 3000);
  };
  UI.float = (t, x, y, color = '#fff') => {
    const el = document.createElement('div'); el.className = 'floattxt'; el.textContent = t; el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.color = color;
    document.body.appendChild(el); setTimeout(() => el.remove(), 1400);
  };
  // mostra lista de efeitos de uma ação (toasts + textos flutuantes)
  UI.fx = (res, anchor) => {
    if (!res) return;
    if (!res.ok && res.msg) { UI.toast(res.msg, 'b', 'Ban'); Sound.sfx('error'); return; }
    const fx = res.fx || [];
    let r = anchor && anchor.getBoundingClientRect ? anchor.getBoundingClientRect() : null;
    fx.slice(0, 4).forEach((f, i) => {
      setTimeout(() => {
        if (r && i < 2) UI.float(f.t.length > 34 ? f.t.slice(0, 32) + '…' : f.t, r.left + r.width / 2, r.top + 10 - i * 24, f.good === false ? '#fca5a5' : f.money ? '#fde047' : '#86efac');
        UI.toast(f.t, f.big ? 'big' : f.good === false ? 'b' : f.good ? 'g' : '');
      }, i * 140);
    });
    if (fx.some((f) => f.money)) Sound.cash(); else if (fx.some((f) => f.big && f.good)) Sound.levelUp(); else if (fx.some((f) => f.good === false)) Sound.sfx('error2', 0.6); else Sound.sfx('confirm', 0.6);
  };
  UI.fxList = (list) => `<div class="fxlist">${(list || []).map((f, i) => `<div class="fxi ${f.good === false ? 'b' : f.good ? 'g' : 'n'}" style="animation-delay:${i * 90}ms">${ic(f.good === false ? 'TrendingDown' : f.good ? 'TrendingUp' : 'Minus')}${esc(f.t)}</div>`).join('')}</div>`;
  UI.flash = (color = 'rgba(var(--accRGB),.6)') => { const el = document.createElement('div'); el.className = 'flash'; el.style.background = color; document.body.appendChild(el); setTimeout(() => el.remove(), 520); };
  UI.banner = (big, small = '') => { const el = document.createElement('div'); el.className = 'weekbanner'; el.innerHTML = `<div>${small ? `<small>${small}</small>` : ''}${big}</div>`; document.body.appendChild(el); setTimeout(() => el.remove(), 1500); };
  UI.loading = (on, text = 'Carregando…') => { const l = U.$('#loading'); l.classList.toggle('hidden', !on); l.querySelector('.ltxt').textContent = text; };

  // ---------- tooltip ----------
  const tip = () => U.$('#tip');
  UI.tipShow = (html, e) => { const t = tip(); t.innerHTML = html; t.classList.add('on'); UI.tipMove(e); };
  UI.tipMove = (e) => { const t = tip(); const w = t.offsetWidth, h = t.offsetHeight; let x = e.clientX + 16, y = e.clientY + 16; if (x + w > innerWidth - 8) x = e.clientX - w - 16; if (y + h > innerHeight - 8) y = e.clientY - h - 16; t.style.left = x + 'px'; t.style.top = y + 'px'; };
  UI.tipHide = () => tip().classList.remove('on');

  // ---------- confete ----------
  let parts = [], raf = null;
  UI.confetti = (n = 160, colors) => {
    const cv = U.$('#fx'); cv.width = innerWidth; cv.height = innerHeight; const g = cv.getContext('2d');
    const cs = colors || [getComputedStyle(document.documentElement).getPropertyValue('--acc').trim() || '#22c55e', '#facc15', '#ffffff', '#38bdf8', '#f472b6'];
    for (let i = 0; i < n; i++) parts.push({ x: innerWidth / 2 + (Math.random() - 0.5) * 300, y: innerHeight * 0.45, vx: (Math.random() - 0.5) * 16, vy: -6 - Math.random() * 14, s: 5 + Math.random() * 7, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, c: cs[i % cs.length], life: 0 });
    if (raf) return;
    const step = () => {
      g.clearRect(0, 0, cv.width, cv.height);
      parts.forEach((p) => { p.vy += 0.32; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life++; g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.globalAlpha = Math.max(0, 1 - p.life / 200); g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); g.restore(); });
      parts = parts.filter((p) => p.y < cv.height + 40 && p.life < 220);
      if (parts.length) raf = requestAnimationFrame(step); else { raf = null; g.clearRect(0, 0, cv.width, cv.height); }
    };
    raf = requestAnimationFrame(step);
  };

  // ---------- helpers de componentes ----------
  UI.av = (spec, size = 48, opts = {}) => `<div class="av s${size}" ${opts.style ? `style="${opts.style}"` : ''}>${Avatar.svg(spec, opts)}</div>`;
  UI.partyChip = (pid) => { const p = Engine.S && Engine.party(pid); if (!p) return pid ? `<span class="chip">${esc(pid)}</span>` : `<span class="chip">Sem partido</span>`; return `<span class="chip"><span class="pdot" style="background:${p.color}"></span>${esc(p.id)}${p.num ? ' ' + p.num : ''}</span>`; };
  UI.specChip = (e, s) => { const sp = CONTENT.spectrum(e, s); return `<span class="chip" style="border-color:${sp.c}55;color:${sp.c}">${sp.n}</span>`; };
  UI.bar = (v, color, cls = '') => `<div class="bar ${cls}"><i style="width:${U.clamp(v * 100, 0, 100).toFixed(1)}%;background:${color || 'var(--acc)'}"></i></div>`;
  UI.stars = (n, max = 5) => `<span class="lvl">${Array.from({ length: max }, (_, i) => ic('Star', i < n ? '' : 'off')).join('')}</span>`;
  UI.diffBadge = (pop) => { const d = Engine.difficulty(pop); return `<span class="diff" style="background:${d.c}22;color:${d.c}">${ic('Gauge') || ''}${d.n}</span>`; };
  UI.setAccent = (cid) => {
    const c = window.COUNTRIES[cid]; if (!c) return;
    const r = document.documentElement.style; r.setProperty('--acc', c.accent); r.setProperty('--acc2', c.accent2); r.setProperty('--accRGB', U.hexToRgb(c.accent).join(','));
  };

  // ---------- delegação de eventos ----------
  document.addEventListener('click', (e) => {
    Sound.init();
    const el = e.target.closest('[data-act]');
    if (!el || el.classList.contains('off') || el.disabled) return;
    const fn = UI.acts[el.dataset.act];
    if (fn) { Sound.sfx('click'); fn(el, el.dataset, e); }
  });
  let lastHover = 0;
  document.addEventListener('mouseover', (e) => {
    const el = e.target.closest('.btn, .card.click, .act, .opt, .res');
    if (el && el !== UI._hov && performance.now() - lastHover > 60) { UI._hov = el; lastHover = performance.now(); Sound.sfx('hover'); }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && stack.length && stack[stack.length - 1].opts.close !== false) UI.closeModal(null); });

  // ---------- configurações ----------
  UI.settings = () => {
    const v = Sound.vol;
    const sl = (k, n) => `<div class="attr" style="grid-template-columns:110px 1fr 50px"><span>${n}</span><input type="range" min="0" max="100" value="${Math.round(v[k] * 100)}" data-vol="${k}"><b class="num" id="vv_${k}">${Math.round(v[k] * 100)}</b></div>`;
    UI.modal(`<h2>${ic('Settings')} Configurações</h2><div class="sep"></div>
      ${sl('master', 'Volume geral')}${sl('music', 'Música')}${sl('sfx', 'Efeitos')}
      <label class="row" style="margin-top:10px;cursor:pointer"><input type="checkbox" id="mute" ${v.muted ? 'checked' : ''}> Silenciar tudo</label>
      <div class="sep"></div>
      <div class="row between"><span class="muted small">O jogo salva automaticamente toda semana e semestre.</span><button class="btn sm" data-mclose>Fechar</button></div>`, {
      cls: 'narrow',
      mount: (el) => {
        el.querySelectorAll('[data-vol]').forEach((r) => (r.oninput = () => { Sound.set(r.dataset.vol, r.value / 100); el.querySelector('#vv_' + r.dataset.vol).textContent = r.value; }));
        el.querySelector('#mute').onchange = (e) => { Sound.set('muted', e.target.checked); };
      },
    });
  };
})();
