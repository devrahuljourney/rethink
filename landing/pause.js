// The hero phone: a launcher where tapping Instagram runs Rethink's mindful pause.
// Copy, timings and layout follow the native gate (GateScreen.kt, PauseStep.kt, PauseContent.kt).
(() => {
  const root = document.querySelector('[data-try]');
  if (!root) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const device = root.querySelector('[data-device]');
  const say = root.querySelector('[data-say]');
  const sticker = root.querySelector('[data-sticker]');
  const gate = root.querySelector('[data-scr="gate"]');
  const APP = 'Instagram';

  // Same numbers as the app: an 8 s breath (default breathSeconds) after a 1.6 s intro,
  // 40% inhale, "Open anyway" after 2.5 s.
  const INTRO_MS = 1600;
  const BREATH_MS = 8000;
  const CYCLE_MS = 10000;
  const INHALE_SHARE = 0.4;
  const WORD_MS = 170;
  const OPEN_ANYWAY_MS = 2500;
  const SESSION_DEMO_MS = 8000; // the chosen minutes play out in 8 s here

  const QUOTES_ANY = [
    ['Tell me, what is it you plan to do with your one wild and precious life?', 'Mary Oliver'],
    ['How we spend our days is, of course, how we spend our lives.', 'Annie Dillard'],
    ['Almost everything will work again if you unplug it for a few minutes, including you.', 'Anne Lamott'],
    ['Attention is the rarest and purest form of generosity.', 'Simone Weil'],
    ['This app was built to keep you. You\'re allowed to leave.'],
    ['What were you hoping to feel when you picked up your phone?'],
  ];
  const QUOTES_TIME_UP = [
    ['You made yourself a promise. Keeping it is how self-trust is built.'],
    ['It is not that we have a short time to live, but that we waste a lot of it.', 'Seneca'],
  ];
  const REASONS = [
    ['SPECIFIC', 'Something specific'],
    ['BORED', "I'm bored"],
    ['AVOIDING', 'Putting something off'],
    ['AUTOPILOT', 'No reason, just habit'],
    ['TIRED', 'I need a break'],
    ['LONELY', 'Feeling low or alone'],
  ];
  const REFLECTIONS = {
    BORED: ['Boredom is a doorway, not an emergency.', 'Give it one quiet minute. Your own ideas show up right after the itch to fill it.'],
    AVOIDING: ["The task won't get smaller while you scroll.", `Do the tiniest next step for two minutes. ${APP} will still be here after.`],
    AUTOPILOT: ['Your thumb got here before you did.', "That's the habit, not you. Every time you close it now, the loop gets a little weaker."],
    TIRED: ['Your mind wants rest, not more input.', `Stand up, drink some water, look out a window. Two minutes of that beats twenty of ${APP}.`],
    LONELY: ["A feed can't hug back.", "Message one person you actually miss. That's the connection you came looking for."],
  };

  const SAY = {
    home: 'Tap Instagram. On a phone with Rethink, this is where the pause starts.',
    pause: 'Breathe with the circle: in while it grows, out while it shrinks.',
    intent: 'Say why you came. Only you see the answer.',
    reflect: 'Rethink names the urge and offers something smaller. "Open anyway" shows up after a beat.',
    duration: 'Pick how long you need. Rethink keeps the time for you.',
    unlimited: 'No limit, so Rethink stays out of the way. Tap the bar at the bottom of the phone to go home.',
    shield: "Time's up, so Rethink checks in. Going on means another pause.",
    closed: 'Instagram closed. Tap it again and the pause comes back, now counting the second open.',
    other: (name) => `${name} isn't guarded in this demo, so it would just open. Try Instagram.`,
  };

  let attempts = 0;
  let quoteIndex = -1;
  let timers = [];
  let raf = 0;

  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
  function stopAll() {
    timers.forEach(clearTimeout);
    timers = [];
    cancelAnimationFrame(raf);
  }

  function setSay(text) { say.textContent = text; }

  function showScreen(name) {
    device.querySelectorAll('.scr').forEach((s) => s.classList.toggle('on', s.dataset.scr === name));
    root.classList.toggle('is-home', name === 'home');
    root.dataset.scr = name;
  }

  const ordinal = (n) => {
    const s = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th');
    return n + s;
  };
  const esc = (t) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const IG_ICON = '<span class="pill-ic" aria-hidden="true"></span>';
  const header = (prefix) => `<p class="g-pill">${IG_ICON}${prefix ? prefix + ' ' : ''}${APP}</p>`;

  // Render one gate step with the same 400 ms fade-in the app uses.
  function render(html, onMount) {
    gate.classList.remove('in');
    gate.innerHTML = html;
    void gate.offsetWidth;
    gate.classList.add('in');
    onMount?.();
  }

  /* ---------- Home ---------- */
  function goHome(text = SAY.home) {
    stopAll();
    showScreen('home');
    setSay(text);
  }

  device.querySelectorAll('[data-app]').forEach((btn) => btn.addEventListener('click', () => {
    const name = btn.dataset.app;
    if (name === APP) return openGuarded(btn);
    btn.classList.remove('shake');
    void btn.offsetWidth;
    btn.classList.add('shake');
    setSay(SAY.other(name));
  }));
  device.querySelector('[data-home]').addEventListener('click', () => {
    if (!root.classList.contains('is-home')) goHome(SAY.closed);
  });

  function openGuarded(icon) {
    stopAll();
    attempts += 1;
    root.classList.add('used');
    // The pause grows out of the icon, like an app launch.
    const r = icon.getBoundingClientRect();
    const d = device.getBoundingClientRect();
    const s = d.width / device.offsetWidth;
    gate.style.transformOrigin = `${(r.left + r.width / 2 - d.left) / s}px ${(r.top + r.height / 2 - d.top) / s}px`;
    gate.classList.remove('launch');
    void gate.offsetWidth;
    if (!reduceMotion) gate.classList.add('launch');
    showScreen('gate');
    pause(false);
  }

  /* ---------- Step 1: the breath ---------- */
  function pause(timeUp) {
    const pool = timeUp ? QUOTES_TIME_UP : QUOTES_ANY;
    quoteIndex = (quoteIndex + 1) % pool.length;
    const [quote, author] = pool[quoteIndex % pool.length];
    const opener = timeUp ? `Your time on ${APP} is up.` : `You reached for ${APP}.`;
    const caption = attempts > 1 ? `${ordinal(attempts)} time opening ${APP} in the last 24 hours` : '';
    const words = quote.split(' ');

    render(`
      <div class="g g-pause">
        ${header('Opening')}
        <p class="g-opener">${opener}</p>
        <div class="g-orb">
          <canvas width="560" height="560" aria-hidden="true"></canvas>
          <p class="g-breath" aria-live="off"><b></b><span></span></p>
        </div>
        <p class="g-quote">${words.map((w) => `<span>${esc(w)}</span>`).join(' ')}</p>
        ${author ? `<p class="g-author">— ${esc(author)}</p>` : ''}
        ${caption ? `<p class="g-caption">${caption}</p>` : '<p class="g-caption" aria-hidden="true"></p>'}
        <button type="button" class="g-secondary" data-close>Not now, close ${APP}</button>
      </div>`);
    setSay(SAY.pause);
    gate.querySelector('[data-close]').addEventListener('click', () => goHome(SAY.closed));

    const canvas = gate.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const label = gate.querySelector('.g-breath b');
    const secs = gate.querySelector('.g-breath span');
    const orbBox = gate.querySelector('.g-orb');
    const opEl = gate.querySelector('.g-opener');
    const wordEls = [...gate.querySelectorAll('.g-quote span')];
    const authorEl = gate.querySelector('.g-author');
    const total = INTRO_MS + BREATH_MS;
    const start = performance.now();
    let lastLabel = '';

    const frame = (now) => {
      const elapsed = reduceMotion ? total * 0.3 : now - start;
      const b = breathAt(elapsed - INTRO_MS, BREATH_MS);
      const introIn = clamp(elapsed / 600);
      const orbIn = clamp((elapsed - 400) / 1000);
      opEl.style.opacity = introIn;
      opEl.style.transform = `translateY(${(1 - introIn) * 12}px)`;
      orbBox.style.opacity = orbIn;
      orbBox.style.transform = `scale(${0.9 + 0.1 * orbIn})`;

      const text = elapsed > INTRO_MS ? (b.inhaling ? 'Breathe in' : 'Let it go') : '';
      if (text !== lastLabel) { label.textContent = text; lastLabel = text; }
      secs.textContent = text ? String(b.secondsLeft) : '';

      const shown = clamp((elapsed - INTRO_MS + 300) / (words.length * WORD_MS)) * words.length;
      wordEls.forEach((w, i) => { w.style.opacity = clamp(shown - i); });
      if (authorEl) authorEl.style.opacity = clamp((shown - words.length + 1) / 2);

      drawOrb(ctx, b.fullness, elapsed / 1000, clamp((elapsed - INTRO_MS) / BREATH_MS));

      if (reduceMotion) { wordEls.forEach((w) => { w.style.opacity = 1; }); if (authorEl) authorEl.style.opacity = 1; return; }
      if (elapsed < total) raf = requestAnimationFrame(frame);
      else intent();
    };
    raf = requestAnimationFrame(frame);
    if (reduceMotion) later(intent, 3500);
  }

  /* ---------- Step 2: why ---------- */
  function intent() {
    render(`
      <div class="g g-step">
        ${header()}
        <div class="g-body">
          <h3 class="g-title">What brought you here?</h3>
          <p class="g-cap">Be honest. Only you will see this.</p>
          <ul class="g-reasons">
            ${REASONS.map(([id, text], i) => `<li style="--i:${i}"><button type="button" data-reason="${id}">${text}<span aria-hidden="true">→</span></button></li>`).join('')}
          </ul>
        </div>
        <button type="button" class="g-secondary" data-close>Never mind, close ${APP}</button>
      </div>`);
    setSay(SAY.intent);
    gate.querySelector('[data-close]').addEventListener('click', () => goHome(SAY.closed));
    gate.querySelectorAll('[data-reason]').forEach((b) => b.addEventListener('click', () => {
      const id = b.dataset.reason;
      if (id === 'SPECIFIC') duration(); else reflect(id);
    }));
  }

  /* ---------- Step 3: the mirror ---------- */
  function reflect(id) {
    const [title, body] = REFLECTIONS[id];
    const reason = REASONS.find((r) => r[0] === id)[1];
    render(`
      <div class="g g-step">
        ${header()}
        <div class="g-body">
          <p class="g-kicker">${esc(reason)}</p>
          <h3 class="g-title">${esc(title)}</h3>
          <p class="g-cap">${esc(body)}</p>
        </div>
        <div class="g-foot">
          <button type="button" class="g-primary" data-close>Close ${APP}</button>
          <button type="button" class="g-secondary g-late" data-anyway disabled>Open anyway</button>
        </div>
      </div>`);
    setSay(SAY.reflect);
    gate.querySelector('[data-close]').addEventListener('click', () => goHome(SAY.closed));
    const anyway = gate.querySelector('[data-anyway]');
    anyway.addEventListener('click', duration);
    later(() => { anyway.disabled = false; anyway.classList.add('ready'); }, reduceMotion ? 0 : OPEN_ANYWAY_MS);
  }

  /* ---------- Step 4: how long ---------- */
  function duration() {
    render(`
      <div class="g g-step">
        <div class="g-body">
          <h3 class="g-title">How much time do you need on ${APP}?</h3>
          <p class="g-cap">Be realistic. We'll check in when the time is up.</p>
          <div class="g-chips">
            ${[5, 10, 15, 30].map((m) => `<button type="button" class="g-chip" data-min="${m}">${m} min</button>`).join('')}
          </div>
        </div>
        <button type="button" class="g-secondary" data-min="0">No limit</button>
      </div>`);
    setSay(SAY.duration);
    gate.querySelectorAll('[data-min]').forEach((b) => b.addEventListener('click', () => runSession(Number(b.dataset.min))));
  }

  /* ---------- The app, with a session running ---------- */
  function runSession(minutes) {
    showScreen('app');
    if (!minutes) { setSay(SAY.unlimited); return; }
    // The real session ticks silently in the background, so the countdown lives in the caption, not the phone.
    say.innerHTML = `Time runs fast here: <b class="clock" aria-hidden="true"></b> of ${minutes} minutes left.`;
    const clock = say.querySelector('.clock');
    const totalSec = minutes * 60;
    const start = performance.now();
    const tick = (now) => {
      const p = clamp((now - start) / (reduceMotion ? 1500 : SESSION_DEMO_MS));
      const left = Math.ceil(totalSec * (1 - p));
      clock.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
      if (p < 1) raf = requestAnimationFrame(tick);
      else later(shield, 400);
    };
    raf = requestAnimationFrame(tick);
  }

  /* ---------- Time's up ---------- */
  function shield() {
    showScreen('gate');
    render(`
      <div class="g g-step">
        ${header()}
        <div class="g-body">
          <h3 class="g-title">Time's up. Do you still need ${APP}?</h3>
          <p class="g-cap">You'll need another mindful pause to keep going.</p>
        </div>
        <div class="g-foot">
          <button type="button" class="g-primary" data-close>Close ${APP}</button>
          <button type="button" class="g-secondary" data-again>Take a breath to continue</button>
        </div>
      </div>`);
    setSay(SAY.shield);
    gate.querySelector('[data-close]').addEventListener('click', () => goHome(SAY.closed));
    gate.querySelector('[data-again]').addEventListener('click', () => pause(true));
  }

  /* ---------- Breath + orb, ported from PauseStep.kt ---------- */
  const clamp = (v) => Math.min(1, Math.max(0, v));
  const ease = (f) => 0.5 - 0.5 * Math.cos(Math.PI * f);

  function breathAt(t, totalMs) {
    if (t <= 0) return { fullness: 0, inhaling: true, secondsLeft: 0 };
    if (t >= totalMs) return { fullness: 0, inhaling: false, secondsLeft: 0 };
    const cycles = Math.max(1, Math.round(totalMs / CYCLE_MS));
    const cycle = totalMs / cycles;
    const inhale = cycle * INHALE_SHARE;
    const x = t % cycle;
    return x < inhale
      ? { fullness: ease(x / inhale), inhaling: true, secondsLeft: Math.ceil((inhale - x) / 1000) }
      : { fullness: 1 - ease((x - inhale) / (cycle - inhale)), inhaling: false, secondsLeft: Math.ceil((cycle - x) / 1000) };
  }

  function orbPath(ctx, cx, cy, r, t, amp) {
    ctx.beginPath();
    for (let i = 0; i <= 96; i++) {
      const th = (i * 2 * Math.PI) / 96;
      const wob = Math.sin(3 * th + t * 0.8) + 0.6 * Math.sin(5 * th - t * 1.1) + 0.4 * Math.sin(2 * th + t * 0.5);
      const k = 1 + (amp * wob) / 2;
      const x = cx + r * k * Math.cos(th);
      const y = cy + r * k * Math.sin(th);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
  }

  function drawOrb(ctx, fullness, seconds, progress) {
    const dp = 2; // canvas is 2x the 280 dp box
    const size = ctx.canvas.width;
    const c = size / 2;
    const ringR = c - 6 * dp;
    ctx.clearRect(0, 0, size, size);

    ctx.lineWidth = 1 * dp;
    ctx.strokeStyle = 'rgba(27,26,31,0.12)';
    ctx.beginPath(); ctx.arc(c, c, ringR, 0, Math.PI * 2); ctx.stroke();

    const a0 = -Math.PI / 2;
    const a1 = a0 + Math.PI * 2 * progress;
    ctx.strokeStyle = '#1B1A1F';
    ctx.lineWidth = 2 * dp;
    ctx.lineCap = 'round';
    if (progress > 0) { ctx.beginPath(); ctx.arc(c, c, ringR, a0, a1); ctx.stroke(); }
    ctx.fillStyle = '#1B1A1F';
    ctx.beginPath(); ctx.arc(c + ringR * Math.cos(a1), c + ringR * Math.sin(a1), 4 * dp, 0, Math.PI * 2); ctx.fill();

    const outerR = ringR - 14 * dp;
    const orbR = outerR * 0.82 * (0.55 + 0.45 * fullness);
    ctx.lineWidth = 1 * dp;
    for (let k = 1; k <= 3; k++) {
      ctx.strokeStyle = `rgba(27,26,31,${0.2 - k * 0.05})`;
      orbPath(ctx, c, c, orbR + (k * (outerR - orbR)) / 3.2, seconds + k * 0.7, 0.02);
      ctx.stroke();
    }
    orbPath(ctx, c, c, orbR, seconds, 0.035);
    ctx.fillStyle = '#8EDFC0';
    ctx.fill();
    ctx.lineWidth = 2 * dp;
    ctx.strokeStyle = '#1B1A1F';
    ctx.stroke();
  }

  /* ---------- Fit the 392 dp device into whatever size the phone frame is ---------- */
  const fit = () => {
    const w = device.parentElement.clientWidth;
    device.style.setProperty('--s', w / 392);
    placeSticker();
  };

  function placeSticker() {
    const icon = device.querySelector('.appi-ig .ic');
    const r = icon.getBoundingClientRect();
    const t = root.getBoundingClientRect();
    root.style.setProperty('--ig-y', `${r.top + r.height / 2 - t.top}px`);
    root.style.setProperty('--ig-x', `${r.left - t.left}px`);
  }

  new ResizeObserver(fit).observe(device.parentElement);
  window.addEventListener('load', placeSticker);

  root.querySelector('[data-date]').textContent = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  root.classList.add('is-home');
})();
