/* SNACK SNATCH: a 10-second tap challenge in the You Bored? style.
   Tap the snacks, never the burnt one. Ends with an S/A/B/C rank stamp. */
'use strict';
(() => {
  const cv = document.getElementById('snack');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const W = 400, H = 600, DUR = 10;
  const RANKS = [['S', 22, '#F5E63D', 'NO MERCY. RESPECT.'], ['A', 15, '#22E0F0', 'SHARP THUMBS!'], ['B', 9, '#FF2FB9', 'NOT BAD. NOT GREAT.'], ['C', 0, '#A9A6D8', 'YOU BORED? GO AGAIN.']];
  const SNACKS = [0, 1, 2, 3, 4, 5, 6, 47, 69, 77]; // atlas cells: toast, pudding, burger, pizza, nacho, cake, cake tower, popcorn, hot dog, pancakes
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const uiStart = document.getElementById('uiStart'), uiEnd = document.getElementById('uiEnd');
  const wrap = document.getElementById('snackWrap'), cab = cv.closest('.cab');
  const bestEl = document.getElementById('bestScore');
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  let best = +store.get('yb.snack.best') || 0;
  if (best) bestEl.textContent = best;

  /* ------------------------------------------------ canvas sizing (crisp on any DPR) */
  let D = 1;
  function size() {
    const r = cv.getBoundingClientRect();
    D = Math.min(3, Math.max(1, (r.width * (devicePixelRatio || 1)) / W));
    cv.width = Math.round(W * D); cv.height = Math.round(H * D);
  }
  size(); addEventListener('resize', () => { size(); if (typeof draw === 'function') try { draw(); } catch (e) {} });

  /* ------------------------------------------------ sprites (from the game's own atlas) */
  const atlas = new Image(); let atlasOK = false;
  const burnt = {};
  function loadAtlas() { if (atlas.src) return; atlas.onload = () => { atlasOK = true; }; atlas.src = 'assets/img/games.webp'; }
  function cell(i) { return [(i % 10) * 128, Math.floor(i / 10) * 128]; }
  function burntOf(i) {
    if (burnt[i]) return burnt[i];
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
    const [sx, sy] = cell(i); x.drawImage(atlas, sx, sy, 128, 128, 0, 0, 128, 128);
    x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(38,20,12,.82)'; x.fillRect(0, 0, 128, 128);
    x.fillStyle = 'rgba(255,90,40,.25)'; for (let k = 0; k < 7; k++) x.fillRect(20 + k * 13 % 80, 30 + k * 29 % 70, 8, 4);
    return burnt[i] = c;
  }
  new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { loadAtlas(); o.disconnect(); } }), { rootMargin: '600px' }).observe(cv);

  /* ------------------------------------------------ sound: tiny square-wave blips */
  let ac = null, soundOn = store.get('yb.snack.sound') !== '0';
  const sBtn = document.getElementById('btnSound'), sLbl = document.getElementById('sndLbl'), sWav = document.getElementById('sndWaves');
  function sndUI() { sBtn.setAttribute('aria-pressed', soundOn); sLbl.textContent = soundOn ? 'Sound on' : 'Sound off'; sWav.style.opacity = soundOn ? 1 : .15; }
  sndUI();
  sBtn.addEventListener('click', () => { soundOn = !soundOn; store.set('yb.snack.sound', soundOn ? '1' : '0'); sndUI(); if (soundOn) beep(660, .06); });
  function beep(f, d = .08, type = 'square', vol = .06, slide = 0) {
    if (!soundOn) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
      const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
      o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
      o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + d + .02);
    } catch (e) {}
  }

  /* ------------------------------------------------ layout: 3x3 plates */
  const PL = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) PL.push({ x: 72 + c * 128, y: 206 + r * 140 });

  /* ------------------------------------------------ state */
  let state = 'idle', t = 0, st = 0, score = 0, streak = 0, hits = 0, misses = 0, burnsHit = 0;
  let lastN = 9, items = [], floats = [], bits = [], spawnT = 0, shake = 0, flash = 0, rank = null, newBest = false, lastTap = -1;

  function reset() { t = 0; score = 0; streak = 0; hits = 0; misses = 0; burnsHit = 0; items = []; floats = []; bits = []; spawnT = .35; rank = null; newBest = false; }
  function start() {
    loadAtlas(); reset(); state = 'count'; st = 0;
    uiStart.hidden = true; uiEnd.hidden = true; cv.classList.add('live'); lastN = 9;
  }
  function end() {
    state = 'timeup'; st = 0; cv.classList.remove('live');
    beep(880, .12, 'square', .06, 220);
  }
  function showResult() {
    state = 'result'; st = 0;
    rank = RANKS.find(r => score >= r[1]);
    newBest = score > best;
    if (newBest) { best = score; store.set('yb.snack.best', best); bestEl.textContent = best; }
  }
  window.YBSnack = { start, debugEnd(s) { loadAtlas(); reset(); score = s; hits = s; state = 'result'; st = 0; uiStart.hidden = true; rank = RANKS.find(r => score >= r[1]); newBest = false; } };

  document.getElementById('btnStart').addEventListener('click', start);
  document.getElementById('btnAgain').addEventListener('click', start);

  function spawn() {
    const free = PL.map((p, i) => i).filter(i => !items.some(it => it.p === i));
    if (!free.length) return;
    const p = free[Math.floor(Math.random() * free.length)];
    const k = t / DUR;
    const bad = t > 1.2 && Math.random() < .24;
    items.push({ p, bad, ic: SNACKS[Math.floor(Math.random() * SNACKS.length)], age: 0, life: 1.15 - .45 * k + (bad ? .4 : 0), hit: 0, dead: false });
  }

  function tapAt(x, y) {
    if (state !== 'play') return;
    let target = null, bd = 1e9;
    for (const it of items) {
      if (it.dead || it.hit) continue;
      const p = PL[it.p], d = Math.hypot(x - p.x, y - (p.y - 4));
      if (d < 62 && d < bd) { bd = d; target = it; }
    }
    if (!target) { streak = 0; beep(140, .05, 'triangle', .05); return; }
    const p = PL[target.p];
    target.hit = .001;
    if (target.bad) {
      score = Math.max(0, score - 3); streak = 0; burnsHit++;
      shake = 12; flash = 1;
      floats.push({ x: p.x, y: p.y - 60, s: '-3', c: '#FF5A6E', a: 0 });
      boom(p.x, p.y - 4, ['#5A3020', '#2A1810', '#FF5A6E'], 16);
      beep(110, .22, 'sawtooth', .07, 55);
      if (navigator.vibrate) try { navigator.vibrate(60); } catch (e) {}
    } else {
      streak++; hits++;
      const pts = streak >= 5 ? 2 : 1; score += pts;
      floats.push({ x: p.x, y: p.y - 60, s: pts > 1 ? '+2' : '+1', c: pts > 1 ? '#F5E63D' : '#FFF4FB', a: 0 });
      if (streak === 5) floats.push({ x: W / 2, y: 150, s: 'x2 COMBO!', c: '#FF2FB9', a: 0, big: 1 });
      boom(p.x, p.y - 4, ['#22E0F0', '#FF2FB9', '#F5E63D', '#FFF4FB'], 12);
      beep(520 + Math.min(streak, 12) * 60, .07, 'square', .05);
      shake = Math.max(shake, 3);
    }
  }
  function boom(x, y, cols, n) {
    if (RM) n = 4;
    for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, v = 80 + Math.random() * 220; bits.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, c: cols[i % cols.length], life: .5 + Math.random() * .3, a: 0, s: 4 + (Math.random() * 5 | 0) }); }
  }

  function toLogical(e) { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; }
  cv.addEventListener('pointerdown', e => {
    if (state === 'play') { e.preventDefault(); const [x, y] = toLogical(e); tapAt(x, y); }
    else if (state === 'idle') start();
  });
  addEventListener('keydown', e => {
    const r = cv.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
    if (e.target.closest && e.target.closest('input,textarea')) return;
    if (/^[1-9]$/.test(e.key) && state === 'play') { const p = PL[+e.key - 1]; tapAt(p.x, p.y - 4); e.preventDefault(); }
    else if ((e.key === ' ' || e.key === 'Enter') && (state === 'idle' || state === 'result') && document.activeElement === cv) { e.preventDefault(); start(); }
  });
  cv.tabIndex = 0;

  /* ------------------------------------------------ drawing helpers */
  const PX = '"Press Start 2P", monospace', SS = '"Silkscreen", monospace';
  function txt(s, x, y, size, col, align = 'center', font = PX, sh = '#05051A') {
    ctx.font = size + 'px ' + font; ctx.textAlign = align; ctx.textBaseline = 'middle';
    if (sh) { ctx.fillStyle = sh; ctx.fillText(s, x + Math.max(2, size / 8), y + Math.max(2, size / 8)); }
    ctx.fillStyle = col; ctx.fillText(s, x, y);
  }
  function rect(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }
  function frame(x, y, w, h, c, t = 3) { rect(x, y, w, t, c); rect(x, y + h - t, w, t, c); rect(x, y, t, h, c); rect(x + w - t, y, t, h, c); }
  function spr(ic, x, y, s, bad) {
    if (!atlasOK) { ctx.fillStyle = bad ? '#3A2418' : '#F5E63D'; ctx.beginPath(); ctx.arc(x, y, s * .32, 0, 6.283); ctx.fill(); return; }
    ctx.imageSmoothingEnabled = false;
    if (bad) ctx.drawImage(burntOf(ic), x - s / 2, y - s / 2, s, s);
    else { const [sx, sy] = cell(ic); ctx.drawImage(atlas, sx, sy, 128, 128, x - s / 2, y - s / 2, s, s); }
  }
  const bgStars = Array.from({ length: 40 }, (_, i) => [(i * 97) % W, (i * 151) % H, i % 3]);
  function background(time) {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#16125A'); g.addColorStop(1, '#070720');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (const [x, y, z] of bgStars) { ctx.globalAlpha = .3 + .3 * Math.sin(time * 2 + x); rect(x, (y + time * (6 + z * 6)) % H, 2, 2, '#FFF4FB'); }
    ctx.globalAlpha = 1;
    // checker counter
    for (let yy = 110; yy < H; yy += 20) for (let xx = 0; xx < W; xx += 20) if (((xx + yy) / 20) % 2) rect(xx, yy, 20, 20, 'rgba(255,255,255,.025)');
  }
  function plate(p, glow) {
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(p.x + 4, p.y + 30, 52, 16, 0, 0, 6.283); ctx.fill();
    ctx.fillStyle = glow ? '#3A3AA0' : '#26266E'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 26, 52, 16, 0, 0, 6.283); ctx.fill();
    ctx.fillStyle = glow ? '#5252C8' : '#34348C'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 23, 40, 11, 0, 0, 6.283); ctx.fill();
  }
  function hud() {
    rect(0, 0, W, 88, '#05051A'); rect(0, 88, W, 3, '#34348C');
    txt('TAP THE SNACKS', 14, 22, 12, '#22E0F0', 'left');
    txt('S AT 22', W - 14, 22, 10, '#F5E63D', 'right');
    const left = Math.max(0, DUR - t), k = left / DUR;
    rect(14, 40, W - 28, 12, '#1C1C5C');
    rect(14, 40, (W - 28) * k, 12, k < .3 ? (Math.floor(t * 8) % 2 ? '#FF5A6E' : '#FF2FB9') : '#22E0F0');
    txt('SCORE ' + score, 14, 72, 11, '#FFF4FB', 'left', PX, null);
    txt(left.toFixed(1) + 'S', W - 14, 72, 11, k < .3 ? '#FF5A6E' : '#FFF4FB', 'right', PX, null);
    if (streak >= 5) txt('x2', W / 2, 72, 11, Math.floor(t * 6) % 2 ? '#FF2FB9' : '#F5E63D', 'center', PX, null);
  }
  const ease = x => 1 - Math.pow(1 - x, 3);
  const back = x => { const c = 2.2; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };

  /* ------------------------------------------------ loop */
  let last = performance.now(), clock = 0;
  function frameLoop(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now; clock += dt; st += dt;
    const visible = cv.getBoundingClientRect().bottom > 0 && cv.getBoundingClientRect().top < innerHeight;
    if (!visible && state !== 'play' && state !== 'count') { requestAnimationFrame(frameLoop); return; }

    if (state === 'count' && st > 2.6) { state = 'play'; st = 0; beep(990, .15); }
    if (state === 'play') {
      t += dt; spawnT -= dt;
      if (spawnT <= 0) { spawn(); if (t > 4 && Math.random() < .35) spawn(); spawnT = .62 - .28 * (t / DUR); }
      for (const it of items) {
        it.age += dt;
        if (it.hit) it.hit += dt;
        if (!it.hit && it.age > it.life && !it.dead) { it.dead = true; it.deadT = 0; if (!it.bad) { streak = 0; misses++; } }
        if (it.dead) it.deadT += dt;
      }
      items = items.filter(it => !(it.hit > .25) && !(it.dead && it.deadT > .18));
      if (t >= DUR) end();
    }
    if (state === 'timeup' && st > 1.1) showResult();
    if (state === 'result' && st > 1.05 && uiEnd.hidden) {
      uiEnd.hidden = false;
      if (rank && (rank[0] === 'S' || rank[0] === 'A') && window.YB) { const r = cv.getBoundingClientRect(); window.YB.burst(r.left + r.width / 2, r.top + r.height * .42, rank[0] === 'S' ? 90 : 50, 1.3); }
    }
    for (const f of floats) f.a += dt;
    floats = floats.filter(f => f.a < (f.big ? 1 : .7));
    for (const b of bits) { b.a += dt; b.vy += 700 * dt; b.x += b.vx * dt; b.y += b.vy * dt; }
    bits = bits.filter(b => b.a < b.life);
    shake *= Math.pow(.02, dt); flash = Math.max(0, flash - dt * 3);

    draw();
    requestAnimationFrame(frameLoop);
  }

  function draw() {
    ctx.setTransform(D, 0, 0, D, 0, 0);
    ctx.save();
    if (shake > .5 && !RM) ctx.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake);
    background(clock);
    for (let i = 0; i < 9; i++) plate(PL[i], false);

    if (state === 'idle') {
      // attract mode
      for (let i = 0; i < 9; i++) {
        if (i % 2) continue;
        const p = PL[i], b = Math.sin(clock * 3 + i) * 5;
        spr(SNACKS[i % SNACKS.length], p.x, p.y - 6 + b, 84, i === 4);
      }
      rect(0, 0, W, 88, '#05051A'); rect(0, 88, W, 3, '#34348C');
      txt('10 SECONDS.', W / 2, 30, 16, '#F5E63D');
      txt('TAP THE SNACKS.', W / 2, 60, 12, '#FFF4FB', 'center', PX, null);
      txt('NEVER THE BURNT ONE.', W / 2, 128, 11, '#FF5A6E');
    } else {
      for (const it of items) {
        const p = PL[it.p];
        let s = 92, y = p.y - 6, a = 1;
        if (it.hit) { const k = it.hit / .25; s *= 1 + k * .5; a = 1 - k; y -= k * 20; }
        else if (it.dead) { const k = it.deadT / .18; s *= 1 - k; }
        else { const k = Math.min(1, it.age / .16); s *= RM ? 1 : back(k); y += (1 - ease(k)) * 30; }
        if (!it.hit && !it.dead && !it.bad) { // warning ring as time runs out
          const left = 1 - it.age / it.life;
          ctx.strokeStyle = left < .35 ? '#FF5A6E' : 'rgba(34,224,240,.55)'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(p.x, p.y - 4, 50, -Math.PI / 2, -Math.PI / 2 + 6.283 * left); ctx.stroke();
        }
        ctx.globalAlpha = Math.max(0, a);
        spr(it.ic, p.x, y, s, it.bad);
        if (it.bad && !it.hit) { // smoke
          ctx.globalAlpha = .45; for (let k = 0; k < 3; k++) { const sy = (clock * 40 + k * 16) % 44; rect(p.x - 10 + k * 9 + Math.sin(clock * 5 + k) * 3, y - 40 - sy, 8, 8, '#7A7A8A'); }
        }
        ctx.globalAlpha = 1;
      }
      for (const b of bits) { ctx.globalAlpha = 1 - b.a / b.life; rect(b.x, b.y, b.s, b.s, b.c); }
      ctx.globalAlpha = 1;
      for (const f of floats) {
        const k = f.a / (f.big ? 1 : .7);
        ctx.globalAlpha = 1 - k * k;
        txt(f.s, f.x, f.y - k * 40, f.big ? 18 : 16, f.c);
      }
      ctx.globalAlpha = 1;
      hud();
    }

    if (flash > 0) { ctx.globalAlpha = flash * .35; rect(0, 0, W, H, '#FF2F4F'); ctx.globalAlpha = 1; }

    if (state === 'count') {
      const n = 3 - Math.floor(st / .65), k = (st % .65) / .65;
      ctx.fillStyle = 'rgba(5,5,26,.55)'; ctx.fillRect(0, 91, W, H);
      const label = n > 0 ? String(n) : 'GO!';
      const s = RM ? 1 : 1 + (1 - ease(Math.min(1, k * 2.5))) * 1.6;
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(s, s);
      txt(label, 0, 0, n > 0 ? 72 : 56, n > 0 ? '#FFF4FB' : '#F5E63D', 'center', PX, '#FF2FB9'); ctx.restore();
      txt(n > 0 ? 'READY?' : 'TAP!', W / 2, H / 2 + 90, 14, '#22E0F0');
      if (n !== lastN) { lastN = n; if (n > 0) beep(440, .08); }
    }
    if (state === 'timeup') {
      ctx.fillStyle = 'rgba(5,5,26,.6)'; ctx.fillRect(0, 0, W, H);
      const s = RM ? 1 : back(Math.min(1, st / .35));
      ctx.save(); ctx.translate(W / 2, H / 2 - 20); ctx.scale(s, s);
      rect(-150, -44, 300, 88, '#05051A'); frame(-150, -44, 300, 88, '#4BE88A', 4);
      txt('TIME!', 0, 2, 40, '#4BE88A'); ctx.restore();
    }
    if (state === 'result') drawResult();
    ctx.restore();
  }

  function drawResult() {
    ctx.fillStyle = 'rgba(5,5,26,.9)'; ctx.fillRect(0, 0, W, H);
    const col = rank ? rank[2] : '#fff', fail = rank && rank[0] === 'C';
    const hcol = fail ? '#FF5A6E' : '#4BE88A';
    const hk = RM ? 1 : back(Math.min(1, st / .3));
    ctx.save(); ctx.translate(W / 2, 52); ctx.scale(hk, hk);
    rect(-170, -30, 340, 60, '#05051A'); frame(-170, -30, 340, 60, hcol, 4);
    txt(fail ? 'TOO SLOW!' : 'CLEARED', 0, 2, fail ? 24 : 28, hcol); ctx.restore();
    txt('SNACK SNATCH', W / 2, 104, 11, '#22E0F0', 'center', PX, null);
    rect(28, 124, W - 56, 170, '#13134A'); frame(28, 124, W - 56, 170, '#34348C', 3);
    txt('SCORE', 54, 152, 11, '#A9A6D8', 'left', PX, null);
    const shown = Math.min(score, Math.floor(score * Math.min(1, st / .5)));
    txt(String(shown), 54, 200, 44, '#FFF4FB', 'left');
    txt(hits + ' SNACKS · ' + burnsHit + ' BURNT', 54, 248, 12, '#A9A6D8', 'left', SS, null);
    const nxt = RANKS.slice().reverse().find(r => r[1] > score);
    txt(nxt ? nxt[0] + ' NEEDS ' + nxt[1] : 'TOP RANK!', 54, 272, 12, '#F5E63D', 'left', SS, null);
    const d = .55, k = Math.max(0, Math.min(1, (st - d) / .32));
    if (st > d) {
      const cx = W - 104, cy = 210;
      const s = RM ? 1 : (k < 1 ? 3.4 - 2.4 * ease(k) : 1), rot = RM ? 0 : (1 - ease(k)) * -0.6;
      if (k >= 1 && !drawResult.slammed) { drawResult.slammed = true; shake = 16; beep(160, .25, 'square', .08, 60); setTimeout(() => beep(1040, .18, 'square', .05), 120); if (cab && window.YB) window.YB.shake(cab); }
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha = Math.min(1, k * 3);
      if (k >= 1) for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283 + clock; const rr = 66 + Math.sin(clock * 6 + i) * 4; rect(Math.cos(a) * rr - 3, Math.sin(a) * rr - 3, 6, 6, i % 2 ? '#FFF4FB' : col); }
      ctx.fillStyle = '#05051A'; ctx.beginPath(); ctx.arc(0, 0, 52, 0, 6.283); ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(0, 0, 47, 0, 6.283); ctx.stroke();
      ctx.font = '46px ' + PX; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FF2FB9'; ctx.fillText(rank[0], 5, 7); ctx.fillStyle = col; ctx.fillText(rank[0], 2, 4);
      ctx.restore(); ctx.globalAlpha = 1;
    } else drawResult.slammed = false;
    if (st > d + .35) {
      const q = Math.min(1, (st - d - .35) / .25);
      ctx.globalAlpha = q;
      rect(40, 310, W - 80, 36, col); txt(rank[3], W / 2, 329, 11, '#0B0B2E', 'center', PX, null);
      if (newBest) txt('NEW PERSONAL BEST!', W / 2, 372, 11, Math.floor(clock * 5) % 2 ? '#F5E63D' : '#FF2FB9', 'center', PX, null);
      ctx.globalAlpha = 1;
    }
  }

  // wait for the pixel fonts before the first frame so canvas text never falls back
  const go = () => requestAnimationFrame(t0 => { last = t0; frameLoop(t0); });
  if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('16px "Press Start 2P"'), document.fonts.load('700 16px "Silkscreen"')]).then(go, go);
  else go();
})();
