/* Inicialização */
(function () {
  window.addEventListener('error', (e) => { console.error(e.error || e.message); });
  const boot = () => {
    const meta = Engine.saveMeta('auto');
    if (meta) UI.setAccent(meta.country);
    UI.go('title');
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  // inicia o áudio no primeiro gesto
  const unlock = () => { Sound.init(); window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); };
  window.addEventListener('pointerdown', unlock); window.addEventListener('keydown', unlock);
})();
