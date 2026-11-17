/* Áudio: efeitos (Kenney, CC0) + síntese WebAudio (urna, suspense, fanfarra, música procedural) */
(function () {
  const S = (window.Sound = {});
  const vol = Object.assign({ master: 0.8, music: 0.45, sfx: 0.8, muted: false }, U.store.get('rap_vol', {}));
  let ctx = null, master, musicBus, sfxBus, comp, noiseBuf;

  const FILES = {
    click: 'click_002', hover: 'tick_002', open: 'maximize_006', close: 'minimize_006', confirm: 'confirmation_002', confirm2: 'confirmation_004',
    error: 'error_004', error2: 'error_006', toggle: 'toggle_002', select: 'select_002', pop: 'pluck_001', pop2: 'pluck_002', drop: 'drop_002',
    glass: 'glass_002', glass2: 'glass_006', bong: 'bong_001', switch: 'switch_002', question: 'question_001', back: 'back_002', scratch: 'scratch_002',
    open2: 'open_002', close2: 'close_002', select2: 'select_006', click2: 'click_004',
  };
  const pools = {};
  const SFX_VOL = { hover: 0.25, click: 0.6, tick: 0.3 };

  S.init = () => {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
      master = ctx.createGain(); musicBus = ctx.createGain(); sfxBus = ctx.createGain();
      musicBus.connect(master); sfxBus.connect(master); master.connect(comp); comp.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      S.applyVol();
      if (mood) { const m = mood; mood = null; S.music(m); }
    } catch (e) { ctx = null; }
  };
  S.applyVol = () => {
    U.store.set('rap_vol', vol);
    if (!ctx) return;
    master.gain.value = vol.muted ? 0 : vol.master;
    musicBus.gain.value = vol.music * 0.55;
    sfxBus.gain.value = vol.sfx;
  };
  S.vol = vol;
  S.set = (k, v) => { vol[k] = v; S.applyVol(); };

  S.sfx = (name, v = 1) => {
    if (vol.muted) return;
    const f = FILES[name]; if (!f) return;
    let p = pools[name];
    if (!p) { p = pools[name] = { i: 0, a: [0, 1, 2].map(() => { const a = new Audio('assets/sfx/' + f + '.ogg'); a.preload = 'auto'; return a; }) }; }
    const a = p.a[p.i++ % p.a.length];
    try { a.currentTime = 0; a.volume = U.clamp(vol.master * vol.sfx * v * (SFX_VOL[name] || 0.7), 0, 1); a.play().catch(() => {}); } catch (e) {}
  };

  // ---------- síntese ----------
  const now = () => ctx.currentTime;
  function tone(freq, t0, dur, { type = 'sine', gain = 0.2, attack = 0.005, release = 0.08, bus = sfxBus, filter = null, detune = 0, glide = null } = {}) {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0); o.detune.value = detune;
    if (glide) o.frequency.exponentialRampToValueAtTime(glide, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(gain, t0 + attack);
    g.gain.setValueAtTime(gain, t0 + Math.max(attack, dur - release)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.02);
    let node = o;
    if (filter) { const f = ctx.createBiquadFilter(); f.type = filter.type || 'lowpass'; f.frequency.value = filter.f; f.Q.value = filter.q || 0.7; o.connect(f); node = f; }
    node.connect(g); g.connect(bus); o.start(t0); o.stop(t0 + dur + 0.05);
    return o;
  }
  function noise(t0, dur, { gain = 0.2, type = 'bandpass', f = 1000, q = 1, attack = 0.002, bus = sfxBus, decay = true } = {}) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(gain, t0 + attack);
    if (decay) g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); else { g.gain.setValueAtTime(gain, t0 + dur - 0.05); g.gain.linearRampToValueAtTime(0.0001, t0 + dur); }
    s.connect(fl); fl.connect(g); g.connect(bus); s.start(t0, Math.random()); s.stop(t0 + dur + 0.05);
    return { s, g, fl };
  }
  const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);

  // Urna eletrônica: tecla e "fim"
  S.urnaKey = () => { if (!ctx || vol.muted) return; tone(1250, now(), 0.075, { type: 'square', gain: 0.07, filter: { f: 3500 } }); };
  S.urnaWrong = () => { if (!ctx || vol.muted) return; tone(420, now(), 0.22, { type: 'square', gain: 0.07, filter: { f: 2000 } }); };
  S.urnaConfirm = () => {
    if (!ctx || vol.muted) return;
    const t = now(); const seq = [1175, 1397, 1175, 1397, 1175, 1397, 1175];
    seq.forEach((f, i) => tone(f, t + i * 0.085, 0.07, { type: 'square', gain: 0.075, filter: { f: 4200 }, release: 0.02 }));
    tone(1397, t + seq.length * 0.085, 0.42, { type: 'square', gain: 0.075, filter: { f: 4200 }, release: 0.2 });
  };

  S.cash = () => { if (!ctx || vol.muted) return; const t = now(); tone(2093, t, 0.12, { gain: 0.12 }); tone(2637, t + 0.08, 0.35, { gain: 0.12 }); noise(t, 0.08, { f: 6000, gain: 0.06, type: 'highpass' }); };
  S.chime = () => { if (!ctx || vol.muted) return; const t = now(); tone(1318, t, 0.5, { gain: 0.09, release: 0.4 }); tone(1046, t + 0.14, 0.7, { gain: 0.09, release: 0.6 }); };
  S.whoosh = () => { if (!ctx || vol.muted) return; const n = noise(now(), 0.45, { f: 400, q: 0.8, gain: 0.12, attack: 0.15 }); n.fl.frequency.exponentialRampToValueAtTime(3000, now() + 0.4); };
  S.levelUp = () => { if (!ctx || vol.muted) return; const t = now(); [72, 76, 79, 84].forEach((m, i) => tone(midi(m), t + i * 0.08, 0.28, { type: 'triangle', gain: 0.14 })); };
  S.bad = () => { if (!ctx || vol.muted) return; const t = now(); tone(midi(55), t, 0.25, { type: 'sawtooth', gain: 0.07, filter: { f: 900 } }); tone(midi(50), t + 0.18, 0.4, { type: 'sawtooth', gain: 0.07, filter: { f: 800 } }); };
  S.good = () => { if (!ctx || vol.muted) return; const t = now(); tone(midi(76), t, 0.14, { type: 'triangle', gain: 0.12 }); tone(midi(83), t + 0.09, 0.3, { type: 'triangle', gain: 0.12 }); };

  // Batimento cardíaco
  let hbTimer = null, hbRate = 1;
  S.heartbeat = (on, rate = 1) => {
    hbRate = rate;
    if (!ctx) return;
    if (!on) { clearTimeout(hbTimer); hbTimer = null; return; }
    if (hbTimer) return;
    const beat = () => {
      if (!vol.muted) {
        const t = now();
        tone(58, t, 0.16, { gain: 0.45, glide: 38, attack: 0.004, release: 0.12 });
        tone(52, t + 0.24, 0.14, { gain: 0.3, glide: 36, attack: 0.004, release: 0.1 });
      }
      hbTimer = setTimeout(beat, 900 / hbRate);
    };
    beat();
  };

  // Drone de tensão
  let tens = null;
  S.tension = (level) => {
    if (!ctx) return;
    if (level <= 0) {
      if (tens) { const t = now(); tens.g.gain.cancelScheduledValues(t); tens.g.gain.setTargetAtTime(0.0001, t, 0.4); const tt = tens; setTimeout(() => tt.oscs.forEach((o) => o.stop()), 2000); tens = null; }
      return;
    }
    if (!tens) {
      const g = ctx.createGain(); g.gain.value = 0.0001; const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 300; f.Q.value = 4;
      const oscs = [55, 55.4, 82.4, 110.3].map((fr, i) => { const o = ctx.createOscillator(); o.type = i < 2 ? 'sawtooth' : 'triangle'; o.frequency.value = fr; o.connect(f); o.start(); return o; });
      f.connect(g); g.connect(musicBus); tens = { g, f, oscs };
    }
    const t = now();
    tens.g.gain.setTargetAtTime(0.06 + level * 0.12, t, 0.5);
    tens.f.frequency.setTargetAtTime(250 + level * 1600, t, 0.6);
    tens.oscs.forEach((o, i) => o.frequency.setTargetAtTime([55, 55.4, 82.4, 110.3][i] * (1 + level * 0.06), t, 1));
  };

  S.drumroll = (dur = 2.4) => {
    if (!ctx || vol.muted) return;
    const t0 = now(); let t = t0; let gap = 0.07;
    while (t < t0 + dur) { noise(t, 0.06, { f: 1800, q: 0.9, gain: 0.08 + 0.18 * ((t - t0) / dur), type: 'bandpass' }); t += gap; gap = Math.max(0.028, gap * 0.985); }
  };
  S.crash = () => {
    if (!ctx || vol.muted) return;
    const t = now();
    noise(t, 2.2, { f: 4500, type: 'highpass', gain: 0.25 });
    tone(55, t, 0.6, { gain: 0.5, glide: 30 });
  };
  S.fanfare = () => {
    if (!ctx || vol.muted) return;
    const t = now();
    const brass = (m, at, d, g = 0.09) => { [0, 7, -5].forEach((dt, k) => tone(midi(m), t + at, d, { type: 'sawtooth', gain: g * (k ? 0.5 : 1), detune: dt, filter: { f: 2400, q: 1 }, attack: 0.02, release: 0.2 })); };
    brass(67, 0, 0.16); brass(67, 0.17, 0.16); brass(67, 0.34, 0.16); brass(72, 0.52, 0.5);
    brass(71, 1.0, 0.18); brass(72, 1.18, 0.18); brass(76, 1.36, 1.6, 0.11);
    [60, 64, 67, 72].forEach((m) => tone(midi(m), t + 1.36, 1.8, { type: 'triangle', gain: 0.06, attack: 0.05, release: 0.8 }));
    tone(midi(36), t + 1.36, 1.8, { gain: 0.25 });
  };
  S.defeat = () => {
    if (!ctx || vol.muted) return;
    const t = now();
    [64, 62, 60, 59].forEach((m, i) => tone(midi(m), t + i * 0.45, 0.6, { type: 'triangle', gain: 0.12, release: 0.4 }));
    [45, 52, 57].forEach((m) => tone(midi(m), t + 1.35, 2.2, { type: 'sine', gain: 0.07, attack: 0.3, release: 1.2 }));
  };
  S.crowd = (dur = 3, intensity = 1) => {
    if (!ctx || vol.muted) return;
    const t = now();
    const a = noise(t, dur, { f: 900, q: 0.6, gain: 0.16 * intensity, attack: 0.3, decay: false });
    const b = noise(t, dur, { f: 2400, q: 1.2, gain: 0.06 * intensity, attack: 0.4, decay: false });
    for (let k = 0; k < 4 * intensity; k++) { const st = t + Math.random() * dur * 0.7; tone(1800 + Math.random() * 900, st, 0.35, { gain: 0.03, glide: 2600 + Math.random() * 800 }); }
    return [a, b];
  };

  // ---------- música procedural ----------
  const MOODS = {
    menu: { bpm: 84, chords: [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 67]], drums: false, arp: 'slow' },
    campaign: { bpm: 112, chords: [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]], drums: true, arp: 'fast' },
    mandate: { bpm: 92, chords: [[62, 65, 69], [58, 62, 65], [60, 64, 67], [57, 60, 64]], drums: true, arp: 'slow' },
    victory: { bpm: 120, chords: [[60, 64, 67, 72], [65, 69, 72], [67, 71, 74], [60, 64, 67, 72]], drums: true, arp: 'fast' },
  };
  let mood = null, mTimer = null, nextT = 0, step = 0;
  S.music = (m) => {
    if (m === mood) return;
    mood = m; step = 0;
    if (!ctx) return;
    clearInterval(mTimer); mTimer = null;
    if (!m) return;
    nextT = now() + 0.1;
    mTimer = setInterval(sched, 60);
  };
  S.currentMood = () => mood;
  function sched() {
    if (!ctx || !mood) return;
    const M = MOODS[mood]; const sd = 60 / M.bpm / 4;
    while (nextT < now() + 0.25) {
      if (!vol.muted && vol.music > 0) playStep(M, step, nextT, sd);
      nextT += sd; step++;
    }
  }
  function playStep(M, st, t, sd) {
    const bar = Math.floor(st / 16) % M.chords.length; const ch = M.chords[bar]; const s16 = st % 16;
    if (s16 === 0) {
      ch.forEach((m) => tone(midi(m - 12), t, sd * 16, { type: 'sawtooth', gain: 0.018, attack: 0.4, release: 0.6, bus: musicBus, filter: { f: 900 }, detune: (Math.random() - 0.5) * 12 }));
      tone(midi(ch[0] - 24), t, sd * 7, { type: 'sine', gain: 0.12, bus: musicBus, release: 0.3 });
    }
    if (s16 === 8) tone(midi(ch[0] - 24), t, sd * 7, { type: 'sine', gain: 0.1, bus: musicBus, release: 0.3 });
    const arpEvery = M.arp === 'fast' ? 2 : 4;
    if (s16 % arpEvery === 0) {
      const idx = (s16 / arpEvery) % (ch.length + 1);
      const m = idx < ch.length ? ch[idx] + 12 : ch[0] + 24;
      tone(midi(m), t, sd * arpEvery * 0.9, { type: 'triangle', gain: 0.035, bus: musicBus, release: sd * 2 });
    }
    if (M.drums) {
      if (s16 === 0 || s16 === 8) tone(110, t, 0.18, { gain: 0.22, glide: 45, bus: musicBus, release: 0.12 });
      if (s16 === 4 || s16 === 12) noise(t, 0.12, { f: 1800, q: 0.7, gain: 0.05, bus: musicBus });
      if (s16 % 2 === 0) noise(t, 0.04, { f: 8000, type: 'highpass', gain: 0.018, bus: musicBus });
    }
  }
})();
