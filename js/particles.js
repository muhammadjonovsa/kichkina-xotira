/* ═══════════════════════════════════════════════════════════════
   PARTICLE ENGINE — Canvas 2D
   Bokeh + floating hearts + sparks + pointer glow + bursts.
   Optimized: DPR-aware, pre-rendered sprites, capped populations,
   rAF loop, visibility pause, prefers-reduced-motion support.
   ═══════════════════════════════════════════════════════════════ */

const Particles = (() => {
  'use strict';

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let canvas = null, ctx = null;
  let W = 0, H = 0, dpr = 1;
  let parts = [];
  let running = false;
  let calm = false;
  let lastTs = 0;
  let trailLast = 0;
  let resizeTimer = null;

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

  const MAX_PARTS = 340;

  const isMobile = () => Math.min(window.innerWidth, window.innerHeight) < 640;
  const capBokeh  = () => Math.max(6, Math.round((W * H) / 52000) * (isMobile() ? 0.65 : 1));
  const capHearts = () => Math.max(4, Math.round((W * H) / 105000) * (isMobile() ? 0.7 : 1));
  const capSpark  = () => Math.max(4, Math.round((W * H) / 72000) * (isMobile() ? 0.6 : 1));

  /* ── Sprites (pre-rendered glow discs) ───────────────────────── */
  function makeSprite(size, stops) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    stops.forEach(([off, col]) => grad.addColorStop(off, col));
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
    return c;
  }

  let SPRITES = null;
  function buildSprites() {
    SPRITES = {
      pink: makeSprite(128, [[0, 'rgba(255,140,180,0.55)'], [0.45, 'rgba(255,92,138,0.20)'], [1, 'rgba(255,92,138,0)']]),
      purple: makeSprite(128, [[0, 'rgba(196,130,235,0.45)'], [0.45, 'rgba(176,106,212,0.16)'], [1, 'rgba(176,106,212,0)']]),
      spark: makeSprite(48, [[0, 'rgba(255,255,255,0.95)'], [0.35, 'rgba(255,190,210,0.55)'], [1, 'rgba(255,190,210,0)']])
    };
  }

  /* ── Spawners ─────────────────────────────────────────────────── */
  function newBokeh(anywhere) {
    return {
      t: 'b',
      x: Math.random() * W,
      y: anywhere ? Math.random() * H : H + 60,
      s: 26 + Math.random() * 74,
      vx: (Math.random() - 0.5) * 0.06,
      vy: -(0.06 + Math.random() * 0.22),
      a: 0.05 + Math.random() * 0.09,
      sp: Math.random() < 0.62 ? 'pink' : 'purple',
      ph: Math.random() * Math.PI * 2
    };
  }

  function newAmbientHeart(anywhere) {
    return {
      t: 'h',
      amb: true,
      x: 14 + Math.random() * (W - 28),
      y: anywhere ? Math.random() * H : H + 30,
      s: 7 + Math.random() * 13,
      vx: (Math.random() - 0.5) * 0.18,
      vy: -(0.22 + Math.random() * 0.5),
      rot: (Math.random() - 0.5) * 0.6,
      vr: (Math.random() - 0.5) * 0.01,
      a: 0.14 + Math.random() * 0.3,
      hue: 336 + Math.random() * 26
    };
  }

  function newTwinkle() {
    return {
      t: 's',
      amb: true,
      x: Math.random() * W,
      y: Math.random() * H,
      s: 1.4 + Math.random() * 3.4,
      vx: 0, vy: 0,
      a: 0,
      max: 0.35 + Math.random() * 0.4,
      ph: Math.random() * Math.PI * 2,
      tw: 0.9 + Math.random() * 1.6,
      d: 0
    };
  }

  function seed() {
    parts = parts.filter(p => p.t === 'r');
    const nb = capBokeh(), nh = capHearts(), ns = capSpark();
    for (let i = 0; i < nb; i++) parts.push(newBokeh(true));
    for (let i = 0; i < nh; i++) parts.push(newAmbientHeart(true));
    for (let i = 0; i < ns; i++) parts.push(newTwinkle());
  }

  /* ── Public effects ───────────────────────────────────────────── */
  function burst(x, y, count) {
    const n = REDUCED ? 6 : (count || 22);
    for (let i = 0; i < n; i++) {
      const heart = Math.random() < 0.55;
      const ang = (Math.PI * 2 * i) / n + Math.random() * 0.6;
      const spd = 1.8 + Math.random() * 4.6;
      parts.push({
        t: heart ? 'h' : 's',
        amb: false,
        x, y,
        s: heart ? (6 + Math.random() * 11) : (2 + Math.random() * 4),
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 2.2,
        vr: (Math.random() - 0.5) * 0.14,
        rot: Math.random() * 0.6,
        a: 1,
        d: 0.011 + Math.random() * 0.013,
        g: REDUCED ? 0 : 0.1,
        hue: 330 + Math.random() * 34,
        life: 1
      });
    }
    trim();
  }

  function explode(x, y) {
    const waves = REDUCED ? 1 : 3;
    for (let wv = 0; wv < waves; wv++) {
      setTimeout(() => {
        burst(x, y, 30);
        for (let i = 0; i < 16; i++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = 3 + Math.random() * 7;
          parts.push({
            t: 's', amb: false,
            x: x + (Math.random() - 0.5) * 60,
            y: y + (Math.random() - 0.5) * 40,
            s: 2 + Math.random() * 5,
            vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd - 1.5,
            a: 1, d: 0.014, g: 0.06, life: 1
          });
        }
        trim();
      }, wv * 190);
    }
    if (!REDUCED) {
      parts.push({ t: 'r', x, y, r: 12, vr: 7.5, a: 0.85, d: 0.022 });
      parts.push({ t: 'r', x, y, r: 4, vr: 4.5, a: 0.6, d: 0.017 });
    }
    trim();
  }

  function setCalm(v) { calm = !!v; }

  function trim() {
    if (parts.length <= MAX_PARTS) return;
    let removed = 0;
    for (let i = 0; i < parts.length && removed < parts.length - MAX_PARTS; i++) {
      if (parts[i].amb) { parts.splice(i, 1); i--; removed++; }
    }
  }

  /* ── Heart path ───────────────────────────────────────────────── */
  function drawHeart(c, x, y, s, rot, color, alpha) {
    c.save();
    c.translate(x, y);
    c.rotate(rot || 0);
    c.globalAlpha = alpha;
    c.fillStyle = color;
    c.beginPath();
    c.moveTo(0, s * 0.42);
    c.bezierCurveTo(-s * 0.62, -s * 0.02, -s * 0.52, -s * 0.5, 0, -s * 0.16);
    c.bezierCurveTo(s * 0.52, -s * 0.5, s * 0.62, -s * 0.02, 0, s * 0.42);
    c.closePath();
    c.fill();
    c.restore();
  }

  /* ── Update / draw ────────────────────────────────────────────── */
  function tick(ts) {
    if (!running) return;
    const dt = Math.min(48, ts - lastTs || 16);
    lastTs = ts;
    const f = (calm ? 0.3 : 1) * (dt / 16.7);
    const slowAll = REDUCED ? 0 : 1;

    ctx.clearRect(0, 0, W, H);

    pointer.x += (pointer.tx - pointer.x) * 0.07;
    pointer.y += (pointer.ty - pointer.y) * 0.07;

    /* bokeh — normal composite */
    for (const p of parts) {
      if (p.t !== 'b') continue;
      p.x += p.vx * f * slowAll;
      p.y += p.vy * f * slowAll;
      p.ph += 0.008 * f;
      if (p.y < -p.s - 80) Object.assign(p, newBokeh(false));
      if (REDUCED) p.y = p.y;
      const tw = REDUCED ? 1 : (0.75 + Math.sin(p.ph) * 0.25);
      ctx.globalAlpha = p.a * tw;
      const spr = SPRITES[p.sp];
      ctx.drawImage(spr, p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
    }
    ctx.globalAlpha = 1;

    /* hearts */
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      if (p.t !== 'h') continue;
      if (p.amb) {
        p.x += p.vx * f * slowAll;
        p.y += p.vy * f * slowAll;
        p.rot += p.vr * f * slowAll;
        if (p.y < -40) { Object.assign(p, newAmbientHeart(false)); continue; }
        drawHeart(ctx, p.x, p.y, p.s, p.rot, `hsl(${p.hue}, 85%, 72%)`, p.a);
      } else {
        p.x += p.vx * f;
        p.y += p.vy * f;
        p.vy += p.g * f;
        p.rot += p.vr * f;
        p.life -= p.d * f;
        if (p.life <= 0.03) { parts.splice(i, 1); continue; }
        drawHeart(ctx, p.x, p.y, p.s, p.rot, `hsl(${p.hue}, 90%, 70%)`, Math.max(0, p.life));
      }
    }

    /* additive pass: sparks + rings + pointer glow */
    ctx.globalCompositeOperation = 'lighter';

    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      if (p.t === 's') {
        if (p.amb) {
          p.ph += 0.03 * p.tw * f;
          const a = Math.max(0, Math.sin(p.ph)) * p.max;
          if (!REDUCED && a > 0.02) {
            ctx.globalAlpha = a;
            ctx.drawImage(SPRITES.spark, p.x - p.s * 3, p.y - p.s * 3, p.s * 6, p.s * 6);
          }
        } else {
          p.x += p.vx * f; p.y += p.vy * f; p.vy += p.g * f;
          p.life -= p.d * f;
          if (p.life <= 0.03) { parts.splice(i, 1); continue; }
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.drawImage(SPRITES.spark, p.x - p.s * 2.4, p.y - p.s * 2.4, p.s * 4.8, p.s * 4.8);
        }
      } else if (p.t === 'r') {
        p.r += p.vr * f;
        p.a -= p.d * f;
        if (p.a <= 0.02 || p.r > Math.max(W, H)) { parts.splice(i, 1); continue; }
        ctx.globalAlpha = Math.max(0, p.a);
        ctx.strokeStyle = 'rgba(255,160,195,0.9)';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    /* pointer glow */
    if (!REDUCED) {
      ctx.globalAlpha = calm ? 0.04 : 0.06;
      ctx.drawImage(SPRITES.pink, pointer.x - 95, pointer.y - 95, 190, 190);
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    /* maintain ambient population */
    if (!REDUCED) {
      let b = 0, h = 0, s = 0;
      for (const p of parts) { if (p.t === 'b') b++; else if (p.t === 'h' && p.amb) h++; else if (p.t === 's' && p.amb) s++; }
      if (b < capBokeh() && Math.random() < 0.06) parts.push(newBokeh(false));
      if (h < capHearts() && Math.random() < 0.045) parts.push(newAmbientHeart(false));
      if (s < capSpark() && Math.random() < 0.05) parts.push(newTwinkle());
    }

    requestAnimationFrame(tick);
  }

  /* ── Sizing / events ──────────────────────────────────────────── */
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(seed, 260);
  }

  function bindEvents() {
    window.addEventListener('resize', resize, { passive: true });

    window.addEventListener('pointermove', (e) => {
      pointer.tx = e.clientX; pointer.ty = e.clientY;
      const now = performance.now();
      if (!REDUCED && now - trailLast > 60) {
        trailLast = now;
        parts.push({
          t: 's', amb: false, x: e.clientX, y: e.clientY,
          s: 1.6 + Math.random() * 2.2,
          vx: (Math.random() - 0.5) * 0.5, vy: 0.3 + Math.random() * 0.5,
          a: 0.8, d: 0.03, g: 0, life: 0.8
        });
      }
    }, { passive: true });

    window.addEventListener('pointerdown', (e) => {
      pointer.tx = e.clientX; pointer.ty = e.clientY;
    }, { passive: true });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { running = false; }
      else if (canvas && !running) { running = true; lastTs = performance.now(); requestAnimationFrame(tick); }
    });
  }

  function init(el) {
    if (!el) return;
    canvas = el;
    ctx = canvas.getContext('2d');
    buildSprites();
    pointer.x = pointer.tx = W = window.innerWidth;
    pointer.y = pointer.ty = H = window.innerHeight;
    resize();
    clearTimeout(resizeTimer);
    seed();
    bindEvents();
    running = true;
    lastTs = performance.now();
    requestAnimationFrame(tick);
  }

  return { init, burst, explode, setCalm, reduced: REDUCED };
})();

window.Particles = Particles;
