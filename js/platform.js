/* Camada de plataforma: no site mostra o selo "Baixe o jogo"; no app desktop libera tela cheia e saída */
(function () {
  const P = (window.Platform = {});
  const ic = U.ic, esc = U.esc;
  P.desktop = !!window.rapDesktop;
  P.dl = window.RAP_DOWNLOADS || { version: '1.0.0', setup: { file: 'downloads/RumoAoPoder-Setup.exe', size: 0 }, portable: { file: 'downloads/RumoAoPoder-Portable.exe', size: 0 } };
  document.documentElement.classList.add(P.desktop ? 'is-desktop' : 'is-web');

  // marca a tela atual no <body> (o selo fica compacto durante a partida)
  const go = UI.go;
  UI.go = (name, params) => { document.body.dataset.screen = name; go(name, params); };

  const mb = (n) => (n ? U.fmtNum1(n / 1048576, 0) + ' MB' : '');

  if (P.desktop) {
    // ---------------- APP DESKTOP ----------------
    const D = window.rapDesktop;
    Sound.init();
    document.addEventListener('keydown', (e) => { if (e.key === 'F11') { e.preventDefault(); D.toggleFullscreen(); } });
    const title = UI.screens.title;
    UI.screens.title = (p) => {
      const r = title(p);
      return {
        html: r.html
          .replace('<button class="btn big" data-act="credits">', `<button class="btn big" data-act="fullscreen">${ic('Maximize')} Tela cheia <span class="cont">F11</span></button><button class="btn big" data-act="credits">`)
          .replace('Créditos e fontes</button>', `Créditos e fontes</button><button class="btn big" data-act="quitGame">${ic('Power')} Sair do jogo</button>`),
        mount: r.mount,
      };
    };
    UI.acts.fullscreen = () => D.toggleFullscreen();
    UI.acts.quitGame = async () => { if (await UI.confirm('Sair do jogo', 'Seu progresso já está salvo. Fechar o Rumo ao Poder?', 'Sair')) { Engine.save(); D.quit(); } };
    return;
  }

  // ---------------- SITE ----------------
  const ORB = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/></svg>`;
  const badge = document.createElement('div');
  badge.id = 'dlbadge';
  badge.className = 'dlbadge' + (U.store.get('rap_dl_min', false) ? ' min' : '');
  badge.innerHTML = `<button class="dl-main" data-act="openDownload" aria-label="Baixe o jogo para uma melhor experiência">
      <span class="dl-orb"><span class="dl-ring"></span>${ORB}</span>
      <span class="dl-txt"><b>Baixe o jogo</b><small>para uma melhor experiência</small></span>
    </button>
    <button class="dl-x" data-act="dlToggle" title="Minimizar">${ic('ChevronLeft')}</button>`;
  document.body.appendChild(badge);
  UI.acts.dlToggle = () => { badge.classList.toggle('min'); U.store.set('rap_dl_min', badge.classList.contains('min')); };

  const ua = navigator.userAgent;
  const isWin = /Windows/i.test(ua), isMobile = /Android|iPhone|iPad|Mobile/i.test(ua);

  UI.acts.openDownload = () => {
    const d = P.dl;
    const feats = [
      ['Maximize', 'Tela cheia de verdade', 'Janela própria, sem barra do navegador nem abas. F11 alterna.'],
      ['WifiOff', '100% offline', 'Mapas dos 5.569 municípios, fontes e sons embutidos. Jogue sem internet.'],
      ['Zap', 'Mais fluido', 'Animações e apuração rodam sem o navegador economizar energia em segundo plano.'],
      ['Save', 'Saves protegidos', 'O progresso fica guardado no app e não some ao limpar o navegador.'],
      ['Volume2', 'Som desde a abertura', 'Música e efeitos tocam direto, sem precisar clicar antes.'],
      ['MonitorSmartphone', 'Atalho na área de trabalho', 'Abra o jogo com dois cliques, como qualquer programa.'],
    ];
    UI.modal(`<div class="dlmodal">
      <div class="dl-hero">
        <div class="dl-appicon"><img src="assets/icon.svg" alt=""></div>
        <div class="grow"><div class="label">Versão para computador · v${esc(d.version)}</div><h2 style="font-size:30px">Rumo ao Poder para Windows</h2>
        <div class="muted">O mesmo jogo do site, numa janela própria, mais rápido e sem precisar de internet.</div></div>
      </div>
      <div class="dl-feats">${feats.map(([i, t, s]) => `<div class="dl-feat">${ic(i) || ic('Check')}<div><b>${t}</b><span>${s}</span></div></div>`).join('')}</div>
      ${isMobile ? `<div class="card small" style="margin-top:14px">${ic('Info')} A versão para baixar é para computadores com Windows. No celular, continue jogando por aqui mesmo.</div>` : ''}
      <div class="dl-actions">
        <a class="btn primary huge" href="${esc(d.setup.file)}" download data-dl="setup">${ic('Download')} Baixar instalador ${d.setup.size ? `<span class="dl-size">${mb(d.setup.size)}</span>` : ''}</a>
        <a class="btn big" href="${esc(d.portable.file)}" download data-dl="portable">${ic('Package')} Versão portátil (sem instalar) ${d.portable.size ? `<span class="dl-size">${mb(d.portable.size)}</span>` : ''}</a>
      </div>
      <div class="dl-req">
        <span>${ic('Monitor')} Windows 10 ou 11 (64 bits)</span><span>${ic('HardDrive')} ~300 MB livres</span><span>${ic('ShieldCheck')} Sem anúncios, sem cadastro</span>
      </div>
      <div class="tiny muted" style="margin-top:12px;line-height:1.55">${ic('Info')} Como o app ainda não tem assinatura digital, o Windows pode exibir o aviso “O Windows protegeu o computador”. Clique em <b>Mais informações</b> → <b>Executar assim mesmo</b>. ${isWin ? '' : 'Você está em outro sistema: baixe e instale em um PC com Windows.'}</div>
    </div>`, { cls: 'wide' });
    U.$$('[data-dl]').forEach((a) => a.addEventListener('click', () => { Sound.levelUp(); UI.toast('Download iniciado! Abra o arquivo quando terminar.', 'g', 'Download'); }));
  };
})();
