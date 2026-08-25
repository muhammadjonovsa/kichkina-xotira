/* ═══════════════════════════════════════════════════════════════
   ROMANTIK INTERAKTIV SEVGI SAYTI — APP
   Flow: start → camera → countdown → 11 questions → cinematic
         → gift → heart photo reveal → share → LOCK → expired
   Privacy: photo stays client-side (IndexedDB w/ localStorage fallback)
   ═══════════════════════════════════════════════════════════════ */

(() => {
  'use strict';

  /* ── Helpers ─────────────────────────────────────────────────── */
  const $ = (id) => document.getElementById(id);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const rr = (min, max) => min + Math.random() * (max - min);
  const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pad2 = (n) => String(n).padStart(2, '0');

  /* ── Constants ───────────────────────────────────────────────── */
  const LS_FLAGS = 'fw_flags_v1';
  const LS_PHOTO = 'fw_photo_v1';
  const SS_PROGRESS = 'fw_progress_v1';
  const SHARE_TEXT = 'Men uchun tayyorlangan kichkina xotira ❤️';

  /* ── State ───────────────────────────────────────────────────── */
  const state = {
    qIndex: 0,
    negClicks: {},
    cameraGranted: false,
    photoData: null,
    musicEnabled: true,
    completed: false,
    finished: false,
    giftOpened: false,
    busy: false
  };

  /* ── Storage ─────────────────────────────────────────────────── */
  function loadFlags() {
    try { return JSON.parse(localStorage.getItem(LS_FLAGS) || '{}') || {}; } catch (e) { return {}; }
  }
  function saveFlags(f) {
    try { localStorage.setItem(LS_FLAGS, JSON.stringify(f)); } catch (e) {}
  }
  function isLocked() {
    if (loadFlags().completed) return true;
    try { return document.cookie.indexOf('fw_done=1') > -1; } catch (e) { return false; }
  }
  function markCompleted() {
    state.completed = true;
    saveFlags(Object.assign(loadFlags(), { completed: true, at: new Date().toISOString() }));
    try { document.cookie = 'fw_done=1; max-age=31536000; path=/; SameSite=Lax'; } catch (e) {}
    try { sessionStorage.removeItem(SS_PROGRESS); } catch (e) {}
  }
  function saveProgress(i) {
    try { sessionStorage.setItem(SS_PROGRESS, String(i)); } catch (e) {}
  }
  function loadProgress() {
    try { return parseInt(sessionStorage.getItem(SS_PROGRESS) || '0', 10) || 0; } catch (e) { return 0; }
  }

  const Photo = {
    db() {
      return new Promise((res, rej) => {
        let rq;
        try { rq = indexedDB.open('fw_db', 1); } catch (e) { rej(e); return; }
        rq.onupgradeneeded = () => { rq.result.createObjectStore('kv'); };
        rq.onsuccess = () => res(rq.result);
        rq.onerror = () => rej(rq.error);
      });
    },
    async save(dataUrl) {
      try {
        const db = await this.db();
        await new Promise((res, rej) => {
          const tx = db.transaction('kv', 'readwrite');
          tx.objectStore('kv').put(dataUrl, 'photo');
          tx.oncomplete = res; tx.onerror = () => rej(tx.error);
        });
        return true;
      } catch (e) {}
      try { localStorage.setItem(LS_PHOTO, dataUrl); return true; } catch (e) {}
      return false;
    },
    async clear() {
      try {
        const db = await this.db();
        await new Promise((res, rej) => {
          const tx = db.transaction('kv', 'readwrite');
          tx.objectStore('kv').delete('photo');
          tx.oncomplete = res; tx.onerror = () => rej(tx.error);
        });
      } catch (e) {}
      try { localStorage.removeItem(LS_PHOTO); } catch (e) {}
    },
    async load() {
      try {
        const db = await this.db();
        return await new Promise((res, rej) => {
          const g = db.transaction('kv', 'readonly').objectStore('kv').get('photo');
          g.onsuccess = () => res(g.result || null);
          g.onerror = () => rej(g.error);
        });
      } catch (e) {}
      try { return localStorage.getItem(LS_PHOTO); } catch (e) { return null; }
    }
  };

  /* ── Screens / toast / feedback ──────────────────────────────── */
  function showScreen(id) {
    document.querySelectorAll('.screen.active').forEach((s) => s.classList.remove('active'));
    const el = $(id);
    if (el) el.classList.add('active');
  }

  let toastTimer = null;
  function toast(msg, ms) {
    let t = $('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), ms || 2200);
  }

  let fbTimer = null;
  function showFeedback(text, positive) {
    const p = $('feedback-pill');
    if (!p) return;
    p.textContent = text;
    p.classList.toggle('neg', !positive);
    p.classList.add('show');
    clearTimeout(fbTimer);
    fbTimer = setTimeout(() => p.classList.remove('show'), positive ? 1900 : 1500);
  }

  /* ═══ MUSIC ════════════════════════════════════════════════════ */
  const Music = (() => {
    let el = null, actx = null, master = null, schedTimer = null;
    let synthOn = false, started = false, chordIdx = 0, nextChordAt = 0, fadeTimer = null;

    const VOL_EL = 0.18, VOL_SYNTH = 0.13;
    const CHORDS = [
      [174.61, 220.00, 261.63, 329.63],
      [164.81, 220.00, 261.63, 392.00],
      [146.83, 174.61, 220.00, 261.63],
      [233.08, 293.66, 349.23, 440.00]
    ];

    function playing() { return synthOn ? !!master : !!(el && !el.paused && el.volume > 0); }

    function start() {
      if (started) { resume(); return; }
      started = true;
      el = $('bg-music');
      try {
        el.volume = 0;
        const pr = el.play();
        if (pr && pr.then) pr.then(() => fadeInEl()).catch(() => initSynth());
        else fadeInEl();
      } catch (e) { initSynth(); }
      el.querySelectorAll('source').forEach((s) =>
        s.addEventListener('error', () => { if (!synthOn && (el.paused || el.networkState === 3)) initSynth(); }, { once: true })
      );
    }

    function fadeInEl() {
      clearInterval(fadeTimer);
      let v = 0;
      fadeTimer = setInterval(() => {
        v += VOL_EL / 30;
        if (v >= VOL_EL) { v = VOL_EL; clearInterval(fadeTimer); }
        try { el.volume = v; } catch (e) {}
      }, 100);
    }

    async function initSynth() {
      if (synthOn) return;
      synthOn = true;
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        actx = new AC();
        master = actx.createGain();
        master.gain.value = 0;
        master.connect(actx.destination);
        master.gain.linearRampToValueAtTime(state.musicEnabled ? VOL_SYNTH : 0, actx.currentTime + 2.5);
        nextChordAt = actx.currentTime + 0.15;
        schedule();
        schedTimer = setInterval(schedule, 250);
      } catch (e) {}
    }

    function schedule() {
      if (!actx || !state.musicEnabled) return;
      while (nextChordAt < actx.currentTime + 0.7) {
        playChord(CHORDS[chordIdx % CHORDS.length], nextChordAt);
        chordIdx++;
        nextChordAt += 4.6;
      }
    }

    function playChord(freqs, at) {
      freqs.forEach((f, i) => pad(f, at, i));
      setTimeout(() => { if (actx) pluck(pick(freqs) * 2, actx.currentTime); }, 900);
    }

    function pad(f, at, i) {
      const o1 = actx.createOscillator(), o2 = actx.createOscillator();
      const g = actx.createGain(), fl = actx.createBiquadFilter();
      o1.type = 'triangle'; o2.type = 'sine';
      o1.frequency.value = f; o2.frequency.value = f * 1.004;
      fl.type = 'lowpass'; fl.frequency.value = 820;
      const peak = 0.055 / (1 + i * 0.45);
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(peak, at + 1.7);
      g.gain.linearRampToValueAtTime(0.0001, at + 4.9);
      o1.connect(fl); o2.connect(fl); fl.connect(g); g.connect(master);
      o1.start(at); o2.start(at);
      o1.stop(at + 5.1); o2.stop(at + 5.1);
    }

    function pluck(f, at) {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(0.035, at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 1.6);
      o.connect(g); g.connect(master);
      o.start(at); o.stop(at + 1.7);
    }

    function setBtn() {
      const b = $('music-btn');
      b.textContent = state.musicEnabled ? '🔊' : '🔇';
      b.setAttribute('aria-label', state.musicEnabled ? 'Musiqani o‘chirish' : 'Musiqani yoqish');
    }

    async function toggle() {
      state.musicEnabled = !state.musicEnabled;
      setBtn();
      if (synthOn) {
        if (!actx) { if (state.musicEnabled) initSynth(); return; }
        if (state.musicEnabled) {
          await actx.resume().catch(() => {});
          master.gain.cancelScheduledValues(actx.currentTime);
          master.gain.linearRampToValueAtTime(VOL_SYNTH, actx.currentTime + 0.8);
          if (!schedTimer) schedTimer = setInterval(schedule, 250);
          nextChordAt = actx.currentTime + 0.1;
        } else {
          master.gain.cancelScheduledValues(actx.currentTime);
          master.gain.linearRampToValueAtTime(0, actx.currentTime + 0.5);
          clearInterval(schedTimer); schedTimer = null;
        }
      } else if (el) {
        if (state.musicEnabled) {
          try { await el.play(); } catch (e) { initSynth(); return; }
          fadeInEl();
        } else {
          clearInterval(fadeTimer);
          let v = el.volume;
          fadeTimer = setInterval(() => {
            v -= VOL_EL / 15;
            if (v <= 0) { v = 0; clearInterval(fadeTimer); el.pause(); }
            try { el.volume = v; } catch (e) {}
          }, 100);
        }
      }
    }

    function resume() {
      if (synthOn && actx && state.musicEnabled) actx.resume().catch(() => {});
      else if (el && state.musicEnabled) el.play().catch(() => {});
    }

    document.addEventListener('visibilitychange', () => {
      if (!actx) return;
      if (document.hidden) actx.suspend().catch(() => {});
      else if (state.musicEnabled) actx.resume().catch(() => {});
    });

    return { start, toggle };
  })();

  /* ═══ CAMERA ═══════════════════════════════════════════════════ */
  let camStream = null;

  function camSection(which) {
    ['cam-prompt', 'cam-preview', 'cam-captured'].forEach((id) => { $(id).hidden = id !== which; });
    $('cam-error-note').hidden = true;
  }

  function stopCam() {
    if (camStream) { camStream.getTracks().forEach((t) => t.stop()); camStream = null; }
    const v = $('cam-video');
    if (v) v.srcObject = null;
  }

  function openCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { camFail(); return; }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((stream) => {
        camStream = stream;
        state.cameraGranted = true;
        const v = $('cam-video');
        v.srcObject = stream;
        camSection('cam-preview');
        v.play().catch(() => {});
      })
      .catch(() => camFail());
  }

  function capturePhoto() {
    const v = $('cam-video');
    if (!v || !v.videoWidth) { camFail(); return; }
    try {
      const side = Math.min(v.videoWidth, v.videoHeight);
      const S = Math.min(side, 720);
      const c = document.createElement('canvas');
      c.width = S; c.height = S;
      const cx = c.getContext('2d');
      cx.translate(S, 0); cx.scale(-1, 1);
      cx.drawImage(v, (v.videoWidth - side) / 2, (v.videoHeight - side) / 2, side, side, 0, 0, S, S);
      state.photoData = c.toDataURL('image/jpeg', 0.86);
      Photo.save(state.photoData);
      stopCam();
      $('cam-captured-img').src = state.photoData;
      camSection('cam-captured');
    } catch (e) { camFail(); }
  }

  function camFail() {
    stopCam();
    const yes = $('btn-camera-yes');
    yes.disabled = true;
    $('cam-error-note').hidden = false;
    setTimeout(proceedToCountdown, RM ? 800 : 1800);
  }

  function proceedToCountdown() { runCountdown(); }

  /* ═══ COUNTDOWN ════════════════════════════════════════════════ */
  const CD_CLASSES = ['cd-scale', 'cd-fade', 'cd-glow', 'cd-blur', 'cd-flashnum'];

  async function runCountdown() {
    showScreen('screen-countdown');
    const n = $('cd-number'), fl = $('cd-flash');
    await wait(RM ? 300 : 550);
    for (let i = 0; i < 5; i++) {
      const num = 5 - i;
      n.textContent = num;
      n.className = CD_CLASSES[i];
      if (num === 1 && !RM) { fl.classList.remove('go'); void fl.offsetWidth; fl.classList.add('go'); }
      await wait(RM ? 450 : 950);
    }
    await wait(RM ? 200 : 380);
    showScreen('screen-questions');
    renderQuestion(loadProgressCached());
  }

  function loadProgressCached() {
    const p = loadProgress();
    return (p > 0 && p < QUESTIONS.length) ? p : 0;
  }

  /* ═══ QUESTION ENGINE ══════════════════════════════════════════ */
  let posRects = [];
  let negEls = [];

  function renderQuestion(i) {
    const q = QUESTIONS[i];
    state.qIndex = i;
    state.negClicks = {};
    state.busy = false;
    posRects = []; negEls = [];

    document.body.style.setProperty('--accent-hue', String((340 + i * 7) % 360));
    $('q-progress-text').textContent = pad2(i + 1) + ' / ' + pad2(QUESTIONS.length);
    $('q-progress-bar').style.width = (i / QUESTIONS.length) * 100 + '%';
    $('q-badge').textContent = 'Savol ' + pad2(i + 1);
    $('q-text').textContent = q.question;

    const box = $('q-answers');
    box.innerHTML = '';

    q.answers.forEach((ans) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'answer-btn';
      btn.dataset.key = ans.key;
      btn.dataset.type = ans.type;

      const label = document.createElement('span');
      label.className = 'answer-label';
      label.textContent = ans.key;
      const text = document.createElement('span');
      text.className = 'answer-text';
      text.textContent = ans.text;
      btn.append(label, text);

      if (ans.type === 'positive') {
        btn.addEventListener('click', () => onPositive(q, ans, btn));
      } else {
        btn.addEventListener('click', () => onNegative(q, ans, btn));
        negEls.push(btn);
      }
      box.appendChild(btn);
    });

    posRects = Array.from(box.children).filter((b) => b.dataset.type === 'positive');

    const card = $('question-card');
    card.classList.remove('enter', 'leave');
    void card.offsetWidth;
    requestAnimationFrame(() => requestAnimationFrame(() => card.classList.add('enter')));
  }

  function ensureRects() {
    negEls.forEach((b) => { if (!b.__r0) b.__r0 = b.getBoundingClientRect(); });
    posRects.forEach((b) => { if (!b.__r0) b.__r0 = b.getBoundingClientRect(); });
  }

  async function onPositive(q, ans, btn) {
    if (state.busy) return;
    state.busy = true;

    document.querySelectorAll('#q-answers .answer-btn').forEach((b) => {
      if (b !== btn) b.classList.add('dimmed');
    });
    btn.classList.add('selected');

    const msgs = (q.positiveMessages && q.positiveMessages.length) ? q.positiveMessages : POSITIVE_MESSAGES_FALLBACK;
    showFeedback(pick(msgs), true);

    const r = btn.getBoundingClientRect();
    Particles.burst(r.left + r.width / 2, r.top + r.height / 2, RM ? 10 : 24);

    await wait(RM ? 750 : 1450);
    const card = $('question-card');
    card.classList.add('leave');
    await wait(RM ? 260 : 520);

    const next = state.qIndex + 1;
    saveProgress(next);
    if (next >= QUESTIONS.length) finale();
    else renderQuestion(next);
  }

  /* ── Runaway negative answers ────────────────────────────────── */
  function aabb(r0, tf, inflate) {
    const w = r0.width * tf.s * inflate;
    const h = r0.height * tf.s * inflate;
    const cx = r0.left + r0.width / 2 + tf.x;
    const cy = r0.top + r0.height / 2 + tf.y;
    return { l: cx - w / 2, t: cy - h / 2, r: cx + w / 2, b: cy + h / 2, w, h };
  }
  function hit(a, b, pad) {
    return !(a.r < b.l - pad || a.l > b.r + pad || a.b < b.t - pad || a.t > b.b + pad);
  }

  function onNegative(q, ans, btn) {
    const k = q.id + '-' + ans.key;
    const clicks = (state.negClicks[k] = (state.negClicks[k] || 0) + 1);

    const msgs = (q.negativeMessages && q.negativeMessages.length) ? q.negativeMessages : NEGATIVE_MESSAGES_FALLBACK;
    showFeedback(pick(msgs), false);

    ensureRects();
    runaway(btn, clicks);
  }

  function runaway(btn, clicks) {
    const r0 = btn.__r0;
    if (!btn.__tf) btn.__tf = { x: 0, y: 0, r: 0, s: 1 };
    const cur = btn.__tf;

    const vw = window.innerWidth, vh = window.innerHeight;
    const HEADER = 64, EDGE = 10, MINVIS = 76;
    const partial = clicks >= 6;

    let mag = clicks === 1 ? 60 : clicks === 2 ? 145 : rr(175, 265);
    let rot = cur.r, scale = cur.s;
    if (clicks >= 4) rot = rr(-26, 26);
    if (clicks === 5) scale = 0.85;
    if (clicks >= 8) scale = Math.max(0.62, cur.s - 0.05);
    else if (clicks >= 6) scale = Math.min(scale, 0.78);

    const clampX = (x) => {
      if (partial) {
        const minL = MINVIS - r0.right;
        const maxL = vw - MINVIS - r0.left;
        return Math.max(minL, Math.min(maxL, x));
      }
      return Math.max(EDGE - r0.left, Math.min(vw - EDGE - r0.right, x));
    };
    const clampY = (y) => {
      const minY = HEADER - r0.top;
      if (partial) return Math.max(minY, Math.min(vh - MINVIS - r0.top, y));
      return Math.max(minY, Math.min(vh - EDGE - r0.bottom, y));
    };

    let best = null, bestScore = Infinity;
    for (let attempt = 0; attempt < 42; attempt++) {
      const ang = Math.random() * Math.PI * 2;
      const dx = Math.cos(ang) * mag * rr(0.55, 1.25);
      const dy = Math.sin(ang) * mag * rr(0.35, 0.95);
      const cand = { x: clampX(cur.x + dx), y: clampY(cur.y + dy), r: rot, s: scale };
      const box = aabb(r0, cand, 1.12);

      let score = 0;
      for (const p of posRects) if (hit(box, p.__r0, 28)) score += 100;
      for (const n of negEls) {
        if (n === btn || !n.__tf || !n.__r0) continue;
        if (hit(box, aabb(n.__r0, n.__tf, 1.12), 16)) score += 12;
      }
      score += Math.abs(Math.hypot(cand.x - cur.x, cand.y - cur.y) - mag) * 0.05;

      if (score === 0) { best = cand; break; }
      if (score < bestScore) { bestScore = score; best = cand; }
    }

    if (!best) best = { x: clampX(cur.x), y: clampY(cur.y), r: rot, s: scale };

    btn.__tf = best;
    btn.style.zIndex = '30';
    btn.classList.add('runaway');
    btn.style.transform =
      'translate(' + best.x.toFixed(1) + 'px,' + best.y.toFixed(1) + 'px) rotate(' +
      best.r.toFixed(1) + 'deg) scale(' + best.s.toFixed(2) + ')';

    btn.classList.remove('jolt');
    void btn.offsetWidth;
    btn.classList.add('jolt');
  }

  /* reset runaway positions when viewport changes */
  window.addEventListener('resize', () => {
    document.querySelectorAll('.answer-btn.runaway').forEach((b) => {
      b.__r0 = null; b.__tf = null;
      b.style.transform = '';
    });
  });

  /* ═══ CINEMATIC FINALE ═════════════════════════════════════════ */
  async function finale() {
    saveProgress(QUESTIONS.length);
    document.body.classList.add('dim');
    Particles.setCalm(true);
    showScreen('screen-cinematic');

    const stage = $('cin-stage');
    stage.innerHTML = '';
    const lines = [
      { t: '✨ Savollar tugadi...', big: false },
      { t: 'Rahmat, hayotimda borliging uchun ❤️', big: true },
      { t: 'Lekin senga hali bitta sovg‘am bor...', big: false }
    ];
    for (const ln of lines) {
      const d = document.createElement('p');
      d.className = 'cin-line' + (ln.big ? ' big' : '');
      d.textContent = ln.t;
      stage.appendChild(d);
      await wait(RM ? 1200 : 2450);
      d.classList.add('gone');
      await wait(RM ? 260 : 720);
      d.remove();
    }
    showScreen('screen-gift');
  }

  /* ═══ GIFT BOX ═════════════════════════════════════════════════ */
  function initGift() {
    const box = $('gift-box');
    const act = () => {
      if (state.giftOpened) return;
      state.giftOpened = true;
      openGift(box);
    };
    box.addEventListener('click', act);
    box.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); }
    });
  }

  async function openGift(box) {
    const r = box.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;

    if (!RM) {
      box.classList.add('shake-1'); await wait(520); box.classList.remove('shake-1');
      box.classList.add('shake-2'); await wait(570); box.classList.remove('shake-2');
    }
    box.classList.add('charging');
    await wait(RM ? 220 : 650);
    Particles.explode(cx, cy);
    box.classList.add('opening');
    await wait(RM ? 420 : 1250);
    box.classList.add('vanish');
    await wait(RM ? 350 : 650);
    revealPhoto();
  }

  /* ═══ PHOTO REVEAL ═════════════════════════════════════════════ */
  async function revealPhoto() {
    showScreen('screen-reveal');
    const svg = $('heart-svg');
    const img = $('heart-photo-image');

    if (state.photoData) {
      img.setAttribute('href', state.photoData);
      try { img.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', state.photoData); } catch (e) {}
      img.addEventListener('load', () => img.classList.add('loaded'), { once: true });
      setTimeout(() => img.classList.add('loaded'), 400);
    } else {
      img.remove();
    }

    svg.classList.add('appear', 'pulse');
    await wait(RM ? 350 : 950);

    const lines = document.querySelectorAll('#reveal-lines .rv-line');
    for (const l of lines) {
      l.classList.add('show');
      await wait(RM ? 550 : 1350);
    }
    $('btn-share').classList.add('show');
  }

  /* ═══ SHARE ════════════════════════════════════════════════════ */
  function dataURLtoFile(dataUrl, name) {
    try {
      const parts2 = dataUrl.split(',');
      const meta = parts2[0];
      const b64 = parts2[1];
      const mime = /:(.*?);/.exec(meta)[1];
      const bin = atob(b64);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      return new File([arr], name, { type: mime });
    } catch (e) { return null; }
  }

  async function handleShare() {
    markCompleted();

    const btn = $('btn-share');
    btn.disabled = true;
    const file = state.photoData ? dataURLtoFile(state.photoData, 'kichkina-xotira.jpg') : null;

    try {
      if (navigator.share) {
        const opts = { title: 'Kichkina xotira ❤️', text: SHARE_TEXT };
        if (file && navigator.canShare && navigator.canShare({ files: [file] })) opts.files = [file];
        await navigator.share(opts);
        btn.disabled = false;
        toast('Rahmat, hayotim! ❤️', 2400);
        finishExperience();
        return;
      }
    } catch (err) {
      btn.disabled = false;
      if (err && err.name === 'AbortError') { toast('Xohlaganda yana bosing ❤️'); return; }
    }

    btn.disabled = false;
    offerFallback(file);
  }

  function offerFallback(file) {
    const alt = $('share-alt');
    alt.hidden = false;
    const dl = $('btn-download');
    if (file) dl.href = state.photoData;
    else dl.hidden = true;
    toast('Ulashish paneli topilmadi — quyidagi variantlardan foydalan ❤️', 3200);
  }

  function fallbackCopy() {
    const ta = document.createElement('textarea');
    ta.value = SHARE_TEXT + ' ' + location.href;
    ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    ta.remove();
  }

  function finishExperience() {
    if (state.finished) return;
    state.finished = true;
    setTimeout(() => {
      document.body.classList.remove('dim');
      Particles.setCalm(true);
      showScreen('screen-expired');
    }, RM ? 700 : 1500);
  }

  /* ═══ EXPIRED ══════════════════════════════════════════════════ */
  function showExpired() {
    document.body.classList.add('started');
    document.body.classList.remove('dim');
    Particles.setCalm(true);
    showScreen('screen-expired');
  }

  /* ═══ INIT / ROUTER ════════════════════════════════════════════ */
  function bindUI() {
    $('music-btn').addEventListener('click', () => Music.toggle());

    $('btn-start').addEventListener('click', () => {
      document.body.classList.add('started');
      Music.start();
      showScreen('screen-camera');
      camSection('cam-prompt');
    });

    $('btn-camera-yes').addEventListener('click', openCamera);
    $('btn-camera-skip').addEventListener('click', () => { stopCam(); proceedToCountdown(); });
    $('btn-camera-capture').addEventListener('click', capturePhoto);
    $('btn-camera-cancel').addEventListener('click', () => { stopCam(); camSection('cam-prompt'); });
    $('btn-camera-continue').addEventListener('click', () => proceedToCountdown());

    $('btn-share').addEventListener('click', handleShare);
    $('btn-copy-msg').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(SHARE_TEXT + ' ' + location.href); }
      catch (e) { fallbackCopy(); }
      toast('Nusxalandi ❤️');
      finishExperience();
    });
    $('btn-download').addEventListener('click', () => {
      toast('Surat saqlandi ❤️');
      setTimeout(finishExperience, 900);
    });

    initGift();
  }

  function init() {
    try { Particles.init($('bg-canvas')); } catch (e) {}

    if (location.search.indexOf('reset') > -1 || location.hash === '#reset') {
      try {
        localStorage.removeItem(LS_FLAGS);
        localStorage.removeItem(LS_PHOTO);
        sessionStorage.clear();
        document.cookie = 'fw_done=; max-age=0; path=/';
      } catch (e) {}
      Photo.clear();
      return;
    }

    if (isLocked()) { showExpired(); return; }

    Photo.load().then((d) => { state.photoData = d; }).catch(() => {});

    const prog = loadProgress();
    if (prog > 0 && prog < QUESTIONS.length) {
      document.body.classList.add('started');
      showScreen('screen-questions');
      renderQuestion(prog);
      return;
    }
  }

  window.__fwReset = function () {
    try {
      localStorage.removeItem(LS_FLAGS);
      localStorage.removeItem(LS_PHOTO);
      sessionStorage.clear();
      document.cookie = 'fw_done=; max-age=0; path=/';
    } catch (e) {}
    location.reload();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { try { init(); bindUI(); } catch (e) { console.error(e); } });
  } else {
    try { init(); bindUI(); } catch (e) { console.error(e); }
  }
})();
