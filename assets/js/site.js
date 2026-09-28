/* You Bored? promo site. HeyBot Gaming. No build step, no trackers. */
'use strict';

/* =====================================================================
   CONFIG: edit this block when the store pages go live.
   Leave a link empty ('') to keep that badge in its "coming soon" state.
   ===================================================================== */
const CONFIG = {
  appStoreUrl:   '',   // e.g. 'https://apps.apple.com/app/id0000000000'
  googlePlayUrl: '',   // e.g. 'https://play.google.com/store/apps/details?id=com.heybot.youbored'
  youtubeUrl:    'https://www.youtube.com/@HeyBotcha',
  supportEmail:  'heybotgaming@gmail.com',
};

(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const COLORS = ['#22E0F0', '#FF2FB9', '#F5E63D', '#FFF4FB', '#4BE88A', '#A77BFF'];
  const YB = window.YB = { RM };

  /* ---------------------------------------------------------- links from config */
  $$('[data-yt]').forEach(a => a.href = CONFIG.youtubeUrl);
  $$('[data-mail]').forEach(a => { a.href = 'mailto:' + CONFIG.supportEmail; a.textContent = CONFIG.supportEmail; });

  /* ---------------------------------------------------------- store badges */
  const APPLE = '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="#FFF4FB" d="M4 1h8v1h1v12h-1v1H4v-1H3V2h1zm0 2v9h8V3zm3 10v1h2v-1z"/><path fill="#22E0F0" d="M5 4h6v7H5z"/><path fill="#0B0B2E" d="M7 6h2v1h1v2H9v1H7V9H6V7h1z"/></svg>';
  const PLAY = '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="#4BE88A" d="M3 1h2v1h1v1h1v1h1v1h1v1h1v1h1v1H9v1H8v1H7v1H6v1H5v1H3z"/><path fill="#22E0F0" d="M3 1h2v1h1v1h1v1h1v1h1v1H9v1H3z" opacity=".8"/><path fill="#F5E63D" d="M11 7h1v1h1v1h-1v1h-1z"/><path fill="#FF2FB9" d="M3 9h6v1H8v1H7v1H6v1H5v1H3z" opacity=".9"/></svg>';
  function badgeHTML(kind) {
    const live = kind === 'ios' ? CONFIG.appStoreUrl : CONFIG.googlePlayUrl;
    const icon = kind === 'ios' ? APPLE : PLAY;
    const top = live ? (kind === 'ios' ? 'Download on the' : 'Get it on') : 'Coming to';
    const name = kind === 'ios' ? 'App Store' : 'Google Play';
    const inner = icon + '<span><small>' + top + '</small><strong>' + name + '</strong></span><span class="soon" aria-hidden="true">SOON</span>';
    return live
      ? '<a class="badge" data-live="1" href="' + live + '" target="_blank" rel="noopener">' + inner + '</a>'
      : '<button class="badge" type="button" data-live="0" data-kind="' + name + '" aria-label="' + name + ': coming soon">' + inner + '</button>';
  }
  $$('[data-badges]').forEach(el => el.innerHTML = badgeHTML('ios') + badgeHTML('android'));
  document.addEventListener('click', e => {
    const b = e.target.closest('.badge[data-live="0"]');
    if (!b) return;
    shakeEl(b); const r = b.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, 26);
    toast('Not out yet! ' + b.dataset.kind + ' launch is coming soon. Follow @HeyBotcha to hear first.');
  });

  /* ---------------------------------------------------------- toast */
  let toastT = 0;
  function toast(msg) {
    const t = $('#toast'); if (!t) return;
    t.textContent = msg; t.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 3200);
  }
  YB.toast = toast;

  /* ---------------------------------------------------------- shake */
  function shakeEl(el) {
    if (RM || !el) return;
    el.classList.remove('shake-all'); void el.offsetWidth; el.classList.add('shake-all');
    setTimeout(() => el.classList.remove('shake-all'), 480);
  }
  YB.shake = shakeEl;

  /* ---------------------------------------------------------- FX canvas: confetti + sparks */
  const fx = $('#fx'), fctx = fx.getContext('2d');
  let parts = [], fxOn = false, FW = 0, FH = 0, FD = 1;
  function fxSize() { FD = Math.min(devicePixelRatio || 1, 2); FW = innerWidth; FH = innerHeight; fx.width = FW * FD; fx.height = FH * FD; }
  fxSize(); addEventListener('resize', fxSize);
  function addPart(p) { parts.push(p); if (!fxOn) { fxOn = true; requestAnimationFrame(fxLoop); } }
  function burst(x, y, n = 30, power = 1) {
    if (RM) n = Math.min(n, 8);
    for (let i = 0; i < n; i++) {
      const a = rnd(0, Math.PI * 2), v = rnd(2, 7) * power;
      addPart({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - rnd(1, 4) * power, g: 0.22, s: rnd(4, 9), c: COLORS[i % COLORS.length], r: rnd(0, 6), vr: rnd(-.3, .3), life: rnd(50, 90), t: 0, conf: Math.random() < .6 });
    }
  }
  function spark(x, y) {
    const n = RM ? 0 : 9;
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2, v = rnd(2.5, 4);
      addPart({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 0, s: 4, c: COLORS[(i + (x | 0)) % 3], r: 0, vr: 0, life: 18, t: 0, conf: false, drag: .86 });
    }
  }
  function rain(n = 160) {
    if (RM) n = 20;
    for (let i = 0; i < n; i++) addPart({ x: rnd(0, FW), y: rnd(-FH * .6, -10), vx: rnd(-1, 1), vy: rnd(1, 4), g: .06, s: rnd(5, 10), c: COLORS[i % COLORS.length], r: rnd(0, 6), vr: rnd(-.2, .2), life: 260, t: 0, conf: true });
  }
  YB.burst = burst; YB.rain = rain;
  function fxLoop() {
    fctx.setTransform(FD, 0, 0, FD, 0, 0); fctx.clearRect(0, 0, FW, FH);
    parts = parts.filter(p => p.t < p.life && p.y < FH + 40);
    for (const p of parts) {
      p.t++; p.vy += p.g; if (p.drag) { p.vx *= p.drag; p.vy *= p.drag; } else { p.vx *= .985; }
      p.x += p.vx; p.y += p.vy; p.r += p.vr;
      const a = Math.min(1, (p.life - p.t) / 20);
      fctx.globalAlpha = a; fctx.fillStyle = p.c;
      if (p.conf) {
        fctx.save(); fctx.translate(p.x, p.y); fctx.rotate(p.r);
        fctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2 * Math.abs(Math.cos(p.t * .15)) + 1); fctx.restore();
      } else fctx.fillRect(Math.round(p.x - p.s / 2), Math.round(p.y - p.s / 2), p.s, p.s);
    }
    fctx.globalAlpha = 1;
    if (parts.length) requestAnimationFrame(fxLoop); else { fxOn = false; fctx.clearRect(0, 0, FW, FH); }
  }
  // small pixel spark on every tap/click (not inside the mini-game)
  addEventListener('pointerdown', e => { if (!e.target.closest('#snack,.badge')) spark(e.clientX, e.clientY); }, { passive: true });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-burst]'); if (!b) return;
    const r = b.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, 34);
  });

  /* ---------------------------------------------------------- starfield (parallax) */
  const sc = $('#stars'), sx = sc.getContext('2d');
  let SW = 0, SH = 0, SD = 1, stars = [], scrollY0 = 0, ptrX = 0, ptrY = 0, curX = 0, curY = 0, starsOn = true;
  function starSize() {
    SD = Math.min(devicePixelRatio || 1, 1.5); SW = innerWidth; SH = innerHeight;
    sc.width = Math.round(SW * SD); sc.height = Math.round(SH * SD);
    const n = Math.round(Math.min(260, SW * SH / 5200));
    stars = [];
    for (let i = 0; i < n; i++) {
      const z = Math.random() < .12 ? 3 : Math.random() < .35 ? 2 : 1;
      stars.push({ x: Math.random() * SW, y: Math.random() * SH, z, c: Math.random() < .12 ? COLORS[i % 3] : '#FFF4FB', tw: rnd(0, 6.28), sp: rnd(1, 3) });
    }
    if (RM) drawStars(0);
  }
  function drawStars(t) {
    sx.setTransform(SD, 0, 0, SD, 0, 0); sx.clearRect(0, 0, SW, SH);
    curX += (ptrX - curX) * .05; curY += (ptrY - curY) * .05;
    for (const s of stars) {
      const par = s.z * s.z * .09;
      let y = (s.y - scrollY0 * par * .6 + curY * s.z * 6) % SH; if (y < 0) y += SH;
      let x = (s.x + curX * s.z * 8 + t * .004 * s.z) % SW; if (x < 0) x += SW;
      const tw = .55 + .45 * Math.sin(t * .002 * s.sp + s.tw);
      sx.globalAlpha = (s.z === 1 ? .45 : s.z === 2 ? .7 : .95) * tw;
      sx.fillStyle = s.c;
      const size = s.z === 3 ? 3 : s.z === 2 ? 2 : 1.5;
      sx.fillRect(Math.round(x), Math.round(y), size, size);
      if (s.z === 3 && tw > .9) { sx.globalAlpha = .5; sx.fillRect(Math.round(x) - 2, Math.round(y) + 1, 7, 1); sx.fillRect(Math.round(x) + 1, Math.round(y) - 2, 1, 7); }
    }
    sx.globalAlpha = 1;
  }
  function starLoop(t) { if (starsOn) drawStars(t); requestAnimationFrame(starLoop); }
  starSize(); addEventListener('resize', starSize);
  addEventListener('scroll', () => { scrollY0 = scrollY; if (RM) drawStars(0); }, { passive: true });
  if (!RM) {
    requestAnimationFrame(starLoop);
    addEventListener('pointermove', e => { ptrX = e.clientX / SW - .5; ptrY = e.clientY / SH - .5; }, { passive: true });
    document.addEventListener('visibilitychange', () => starsOn = !document.hidden);
  }

  /* ---------------------------------------------------------- nav */
  const nav = $('#nav');
  const navUpd = () => nav.classList.toggle('solid', scrollY > 30);
  navUpd(); addEventListener('scroll', navUpd, { passive: true });

  /* ---------------------------------------------------------- hero intro: logo slam + tagline typing */
  const hero = $('.hero'), logo = $('#logo');
  function intro() {
    document.body.classList.add('is-ready');
    if (RM) return;
    setTimeout(() => {
      shakeEl(hero);
      const r = logo.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, 70, 1.3);
    }, 560);
  }
  (logo.complete ? Promise.resolve() : new Promise(r => { logo.onload = r; logo.onerror = r; })).then(() => setTimeout(intro, 120));
  $('#logoBtn').addEventListener('click', () => {
    const r = logo.getBoundingClientRect();
    shakeEl(hero); burst(r.left + r.width / 2, r.top + r.height / 2, 60, 1.2);
    logo.style.animation = 'none'; void logo.offsetWidth; logo.style.animation = '';
  });
  const tag = $('#tagline');
  if (!RM && tag) {
    const parts = tag.dataset.text.split('|');
    const full = parts.join('');
    tag.setAttribute('aria-label', full.replace(/~/g, ' '));
    let i = 0;
    const render = () => {
      const a = full.slice(0, i), cut = parts[0].length;
      const html = (a.length <= cut ? a : a.slice(0, cut) + '<span class="m">' + a.slice(cut) + '</span>').replace(/~/g, '<br>');
      tag.innerHTML = '<span aria-hidden="true">' + html + '<span class="cur"></span></span>';
    };
    render();
    setTimeout(function type() {
      i++; render();
      if (i < full.length) setTimeout(type, full[i - 1] === '.' ? 260 : 38);
      else if (full[i - 1] === '.') tag.animate && !RM && tag.animate([{ transform: 'scale(1.08)' }, { transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.3,1.6,.5,1)' });
      else setTimeout(() => { const c = $('.cur', tag); if (c) c.remove(); }, 2400);
    }, 900);
  }

  /* ---------------------------------------------------------- hero phones */
  const CLIPS = [['road', 'Road Hog'], ['boxer', 'The Boxer'], ['invaders', 'Snack Invaders'], ['sumo', 'Sumo Match'], ['breaker', 'Burp Breaker'], ['stack', 'Burger Stack']];
  const SHOTS_A = ['claw', 'elevator', 'hoops', 'snip', 'knot', 'weigh', 'gum'];
  const SHOTS_B = ['helix', 'upup', 'swarm', 'mazesnake', 'jet', 'void', 'cup'];
  const vid = $('#heroVid'), np = $('#nowPlaying');
  let ci = 0;
  function glitch(el) { if (RM) return; el.classList.remove('glitch'); void el.offsetWidth; el.classList.add('glitch'); setTimeout(() => el.classList.remove('glitch'), 450); }
  function setClip(k) {
    const [f, n] = CLIPS[k];
    vid.poster = 'assets/clips/' + f + '.webp';
    vid.src = 'assets/clips/' + f + '.mp4';
    np.textContent = n;
    const p = vid.play(); if (p && p.catch) p.catch(() => {});
    glitch(vid.closest('.screen'));
  }
  if (!RM) {
    vid.loop = false;
    vid.addEventListener('ended', () => { ci = (ci + 1) % CLIPS.length; setClip(ci); });
    addEventListener('load', () => setClip(0));
    // pause when off screen
    new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { const p = vid.play(); if (p && p.catch) p.catch(() => {}); } else vid.pause(); })).observe(vid);
    let si = 0;
    setInterval(() => {
      if (document.hidden || scrollY > innerHeight * 1.2) return;
      si++;
      const a = $('[data-cycle="a"]'), b = $('[data-cycle="b"]');
      const tgt = si % 2 ? a : b, list = si % 2 ? SHOTS_A : SHOTS_B;
      tgt.src = 'assets/img/screens/' + list[Math.floor(si / 2 + 1) % list.length] + '.webp';
      glitch(tgt.closest('.screen'));
    }, 2600);
    const phones = $('#phones');
    if (FINE) addEventListener('pointermove', e => {
      phones.style.setProperty('--mx', (e.clientX / innerWidth - .5).toFixed(3));
      phones.style.setProperty('--my', (e.clientY / innerHeight - .5).toFixed(3));
    }, { passive: true });
  } else {
    vid.controls = true; vid.src = 'assets/clips/road.mp4'; vid.preload = 'metadata';
  }

  /* ---------------------------------------------------------- reveal on scroll */
  const rio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  $$('.rv').forEach(el => rio.observe(el));

  // sprite atlas: only start loading it when a section that uses it gets close
  const lio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('lit'); lio.unobserve(e.target); } }), { rootMargin: '700px 0px' });
  ['#wall', '#modes', '#unlock', '#get'].forEach(s => { const el = $(s); if (el) lio.observe(el); });

  // big 79 count-up
  const bc = $('.bigcount');
  if (bc && !RM) {
    new IntersectionObserver((es, o) => es.forEach(e => {
      if (!e.isIntersecting) return; o.disconnect();
      const t0 = performance.now();
      (function f(t) { const k = Math.min(1, (t - t0) / 1100); bc.textContent = Math.round(79 * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); })(t0);
    }), { threshold: .6 }).observe(bc);
  }

  /* ---------------------------------------------------------- game wall */
  const wall = $('#wall'), cards = $$('.card', wall), note = $('#wallNote');
  function flip(fn) {
    if (RM) { fn(); return; }
    const first = new Map(cards.map(c => [c, c.hidden ? null : c.getBoundingClientRect()]));
    fn();
    cards.forEach((c, i) => {
      if (c.hidden) return;
      const a = first.get(c), b = c.getBoundingClientRect();
      if (!a) { c.animate([{ transform: 'scale(.3) rotate(-8deg)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 420, delay: Math.min(i, 30) * 12, easing: 'cubic-bezier(.3,1.4,.5,1)', fill: 'backwards' }); return; }
      const dx = a.left - b.left, dy = a.top - b.top;
      if (dx || dy) c.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }], { duration: 520, easing: 'cubic-bezier(.25,1.15,.4,1)' });
    });
  }
  const chips = $$('.fchip');
  chips.forEach(ch => ch.addEventListener('click', () => {
    const f = +ch.dataset.f;
    chips.forEach(c => c.setAttribute('aria-pressed', c === ch ? 'true' : 'false'));
    flip(() => cards.forEach(c => { c.hidden = f && +c.dataset.p !== f; c.classList.remove('flip', 'spot'); }));
    const n = cards.filter(c => !c.hidden).length;
    note.textContent = f ? 'Page ' + f + ': ' + n + ' games' + (f === 7 ? ' (add-on)' : '') : 'Showing all 79';
  }));
  wall.addEventListener('click', e => {
    const c = e.target.closest('.card'); if (!c) return;
    if (FINE && !e.detail) { c.classList.toggle('flip'); return; } // keyboard
    c.classList.toggle('flip');
  });
  $('#btnShuffle').addEventListener('click', () => {
    flip(() => { const arr = cards.slice().sort(() => Math.random() - .5); arr.forEach(c => wall.appendChild(c)); cards.splice(0, cards.length, ...arr); });
  });
  $('#btnSurprise').addEventListener('click', () => {
    const vis = cards.filter(c => !c.hidden);
    cards.forEach(c => c.classList.remove('spot', 'flip'));
    const c = vis[Math.floor(Math.random() * vis.length)];
    c.scrollIntoView({ block: 'center', behavior: RM ? 'auto' : 'smooth' });
    setTimeout(() => {
      c.classList.add('spot', 'flip');
      const r = c.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, 40);
      toast('Tonight you play: ' + c.querySelector('.nm').textContent);
    }, RM ? 0 : 450);
  });

  /* ---------------------------------------------------------- modes: tiny animated demos */
  const ICON_IDS = cards.map(c => +c.dataset.i);
  function pos(i) { return (i % 10) / 9 * 100 + '% ' + Math.floor(i / 10) / 7 * 100 + '%'; }
  const modesEl = $('#modes');
  let modesOn = false;
  new IntersectionObserver(es => es.forEach(e => modesOn = e.isIntersecting)).observe(modesEl);
  // timed
  const mClock = $('#mClock'), mCoin = $('#mCoin'), mRanks = $$('#mRanks span');
  const RK = [['S', '#F5E63D'], ['A', '#22E0F0'], ['B', '#FF2FB9'], ['C', '#A9A6D8']];
  let rkI = 0, clk = 7.42;
  // gauntlet
  const deck = $('#gDeck'), dspr = $('.spr', deck), gCmd = $('#gCmd'), gSpeed = $('#gSpeed'), hearts = $$('.heart', modesEl);
  const CMDS = ['TAP!', 'DODGE!', 'STACK!', 'FLAP!', 'CATCH!', 'SWIPE!', 'HOLD!', 'CHOP!', 'SNIP!', 'FLUSH!'];
  let gs = 1, lives = 3, gt = 0;
  // endless
  const col = $('#eCol'), eRound = $('#eRound');
  for (let i = 0; i < 18; i++) { const s = document.createElement('i'); s.className = 'spr'; s.style.backgroundPosition = pos(ICON_IDS[(i * 7) % 79]); col.appendChild(s); }
  let ey = 0, round = 1;
  let last = performance.now(), acc1 = 0;
  function modesTick(t) {
    const dt = Math.min(.05, (t - last) / 1000); last = t;
    if (modesOn && !document.hidden) {
      clk += dt; mClock.textContent = '00:' + String(Math.floor(clk % 60)).padStart(2, '0') + '.' + String(Math.floor(clk * 100 % 100)).padStart(2, '0');
      acc1 += dt;
      if (acc1 > 1.7) {
        acc1 = 0; rkI = (rkI + 1) % 4;
        mCoin.textContent = RK[rkI][0]; mCoin.style.borderColor = mCoin.style.color = RK[rkI][1];
        mRanks.forEach((s, i) => s.classList.toggle('on', i === rkI));
        mCoin.classList.remove('stamp'); void mCoin.offsetWidth; mCoin.classList.add('stamp');
        if (rkI === 0) clk = 7.42 + Math.random();
      }
      gt += dt * gs;
      if (gt > .9) {
        gt = 0;
        dspr.style.backgroundPosition = pos(ICON_IDS[Math.floor(Math.random() * 79)]);
        gCmd.textContent = CMDS[Math.floor(Math.random() * CMDS.length)];
        deck.classList.remove('flash'); void deck.offsetWidth; deck.classList.add('flash');
        gs = Math.min(3, gs + .12);
        if (Math.random() < .12) { lives--; if (lives < 1) { lives = 3; gs = 1; } }
        hearts.forEach((h, i) => h.classList.toggle('off', i >= lives));
        gSpeed.textContent = 'SPEED x' + gs.toFixed(1);
      }
      ey += dt * (38 + round * 6);
      const H = 82;
      if (ey > H) { ey -= H; for (let k = 0; k < 3; k++) col.appendChild(col.firstElementChild); round++; if (round > 40) round = 1; eRound.innerHTML = 'ROUND ' + round + '<br>BEST 24'; }
      col.style.transform = 'translateY(' + (-ey) + 'px)';
    }
    requestAnimationFrame(modesTick);
  }
  mRanks[0].classList.add('on');
  dspr.style.backgroundPosition = pos(24);
  if (!RM) requestAnimationFrame(modesTick);

  /* ---------------------------------------------------------- unlock track */
  const nodes = $$('.pnode'), fill = $('#trackFill'), track = $('#track');
  const wide = () => matchMedia('(min-width:980px)').matches;
  let unlockTimers = [];
  function setFill(k) {
    const n = nodes.length - 1, pct = k <= 0 ? 0 : (k / n) * 100;
    if (wide()) { fill.style.height = ''; fill.style.width = 'calc((100% - 20px) * ' + (pct / 100) + ')'; }
    else { fill.style.width = ''; fill.style.height = 'calc((100% - 20px) * ' + (pct / 100) + ')'; }
  }
  function runUnlock() {
    unlockTimers.forEach(clearTimeout); unlockTimers = [];
    nodes.forEach((n, i) => n.classList.toggle('open', i === 0)); setFill(0);
    if (RM) { nodes.forEach(n => n.classList.add('open')); setFill(nodes.length - 1); return; }
    nodes.forEach((n, i) => {
      if (!i) return;
      unlockTimers.push(setTimeout(() => {
        n.classList.add('open', 'shake'); setTimeout(() => n.classList.remove('shake'), 420);
        setFill(i);
        const r = n.getBoundingClientRect();
        if (r.top < innerHeight && r.bottom > 0) burst(r.left + r.width / 2, r.top + r.height / 2, i === nodes.length - 1 ? 50 : 18);
      }, 500 + i * 650));
    });
  }
  new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { o.disconnect(); runUnlock(); } }), { threshold: .35 }).observe(track);
  $('#btnReplay').addEventListener('click', runUnlock);
  addEventListener('resize', () => setFill(nodes.filter(n => n.classList.contains('open')).length - 1));

  /* ---------------------------------------------------------- pricing tilt */
  if (FINE && !RM) $$('.tier').forEach(t => {
    t.addEventListener('pointermove', e => {
      const r = t.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      t.style.transform = 'perspective(800px) rotateY(' + (x * 8) + 'deg) rotateX(' + (-y * 8) + 'deg) translateY(-4px)';
    });
    t.addEventListener('pointerleave', () => t.style.transform = '');
  });

  /* ---------------------------------------------------------- mascot + easter egg */
  const mascot = $('#mascot');
  if (mascot) mascot.addEventListener('click', () => { const r = mascot.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + 20, 30); toast('HeyBot says: go get an S rank.'); });
  let typed = '';
  addEventListener('keydown', e => {
    if (e.key.length !== 1 || e.target.closest('input,textarea')) return;
    typed = (typed + e.key.toLowerCase()).slice(-5);
    if (typed === 'bored') { rain(); shakeEl($('#main')); toast('Not anymore you aren’t.'); }
  });
})();
