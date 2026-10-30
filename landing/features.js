// The feature tour: one sticky phone that each step drives. Home dial (DayDial.tsx), Week/Month/Apps, limits + focus, coach.
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt = (m) => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ''}` : `${m}m`);
  const hourRange = (h) => {
    const n = (x) => `${x % 12 === 0 ? 12 : x % 12}`;
    const ap = (x) => (x % 24 < 12 ? 'AM' : 'PM');
    return `${n(h)}${ap(h) === ap(h + 1) ? '' : ` ${ap(h)}`}–${n(h + 1)} ${ap(h + 1)}`;
  };

  /* ---------- Dial ---------- */
  // Minutes per hour from one real day (3h 36m, peak 7 PM). Hours after 8 PM hadn't happened yet.
  const DAY = [
    [14, 18, [['Instagram', 8], ['YouTube', 5], ['WhatsApp', 1]]],
    [3, 4, [['Instagram', 2], ['WhatsApp', 1]]],
    [2, 3, [['WhatsApp', 2]]],
    [2, 2, [['Instagram', 2]]],
    [2, 3, [['WhatsApp', 1], ['Chrome', 1]]],
    [3, 5, [['WhatsApp', 2], ['Gmail', 1]]],
    [30, 44, [['YouTube', 12], ['WhatsApp', 8], ['Instagram', 6], ['Chrome', 2], ['Gmail', 2]]],
    [18, 39, [['Instagram', 7], ['X', 5], ['WhatsApp', 4], ['Gmail', 2]]],
    [34, 53, [['Instagram', 12], ['Rethink', 9], ['YouTube', 6], ['X', 4], ['Amazon', 3]]],
    [4, 9, [['WhatsApp', 3], ['Gmail', 1]]],
    [3, 7, [['WhatsApp', 2], ['Chrome', 1]]],
    [5, 10, [['Amazon', 3], ['WhatsApp', 2]]],
    [3, 12, [['Instagram', 2], ['WhatsApp', 1]]],
    [2, 6, [['WhatsApp', 2]]],
    [4, 13, [['X', 2], ['WhatsApp', 2]]],
    [2, 5, [['WhatsApp', 1], ['Gmail', 1]]],
    [3, 14, [['Instagram', 2], ['WhatsApp', 1]]],
    [4, 9, [['Amazon', 3], ['WhatsApp', 1]]],
    [15, 42, [['Instagram', 6], ['X', 4], ['Rethink', 3], ['WhatsApp', 2]]],
    [51, 83, [['Instagram', 26], ['WhatsApp', 15], ['X', 4], ['Chrome', 3], ['Gmail', 1], ['Maps', 1], ['Photos', 1], ['Settings', 0]]],
    [12, 36, [['Rethink', 7], ['YouTube', 3], ['Instagram', 2]]],
    null, null, null,
  ];
    const NOW_HOUR = 20.25;

  const svg = document.querySelector('[data-dial]');
  if (svg) {
    const NS = 'http://www.w3.org/2000/svg';
    const size = 340;
    const c = size / 2;
    const inner = size * 0.28;
    const maxLen = size * 0.13;
    const barW = ((2 * Math.PI * inner) / 24) * 0.3;
    const minutes = DAY.map((d) => (d ? d[0] : null));
    const busiest = Math.max(...minutes.map((m) => m || 0));
    const peak = minutes.indexOf(busiest);
    const total = minutes.reduce((a, m) => a + (m || 0), 0);
    const angle = (h) => (h / 24) * 2 * Math.PI - Math.PI / 2;
    const polar = (a, r) => [c + r * Math.cos(a), c + r * Math.sin(a)];
    const el = (tag, attrs) => {
      const n = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
      svg.appendChild(n);
      return n;
    };

    el('circle', { cx: c, cy: c, r: inner - 12, fill: 'none', stroke: 'rgba(27,26,31,0.16)', 'stroke-width': 1.5 });
    const bars = minutes.map((m, h) => {
      const a = angle(h + 0.5);
      const [x1, y1] = polar(a, inner);
      if (m === null) return el('circle', { cx: x1, cy: y1, r: barW / 2.6, fill: 'rgba(27,26,31,0.16)' });
      const len = Math.max(barW * 0.2, Math.min(1, m / 60) * maxLen);
      const [x2, y2] = polar(a, inner + len);
      const line = el('line', { x1, y1, x2, y2, 'stroke-width': barW, 'stroke-linecap': 'round', class: 'bar' });
      line.style.setProperty('--len', len);
      line.style.strokeDasharray = `${len} ${len + 20}`;
      line.style.setProperty('--d', `${(h / 24) * 0.9 * 1400}ms`);
      return line;
    });
    [0, 6, 12, 18].forEach((h) => {
      const [x, y] = polar(angle(h), inner + maxLen + 16);
      const t = el('text', { x, y: y + 4, 'text-anchor': 'middle', class: 'dial-tick' });
      t.textContent = String(h).padStart(2, '0');
    });
    const [nx, ny] = polar(angle(NOW_HOUR), inner - 12);
    el('circle', { cx: nx, cy: ny, r: 9, fill: '#3D4ED8', opacity: 0.18, class: 'now-pulse' });
    el('circle', { cx: nx, cy: ny, r: 4.5, fill: '#3D4ED8' });
    const hand = el('line', { x1: c, y1: c - (inner - 12), x2: c, y2: c - (inner + maxLen), stroke: '#FF6B4A', 'stroke-width': 2, 'stroke-linecap': 'round', class: 'hand' });

    const label = document.querySelector('[data-dial-label]');
    const totalEl = document.querySelector('[data-dial-total]');
    const cap = document.querySelector('[data-dial-cap]');
    const panel = document.querySelector('[data-panel]');
    const below = document.querySelector('[data-h-below]');
    let selected = null;

    function paint() {
      minutes.forEach((m, h) => {
        if (m === null) return;
        const b = bars[h];
        b.setAttribute('stroke', h === selected ? '#3D4ED8' : h === peak ? '#FF6B4A' : '#1B1A1F');
        b.setAttribute('stroke-opacity', selected !== null ? (h === selected ? 1 : 0.15) : h === peak ? 1 : 0.25 + 0.75 * (m / busiest));
      });
      if (selected === null) {
        label.textContent = 'TODAY';
        label.classList.remove('sel');
        totalEl.textContent = fmt(total);
        cap.textContent = '↓ 29% vs yesterday';
        cap.classList.add('good');
        panel.hidden = true;
        below.hidden = false;
        svg.setAttribute('aria-valuetext', `Whole day, ${fmt(total)}`);
      } else {
        const [m, opens, apps] = DAY[selected];
        label.textContent = hourRange(selected).toUpperCase();
        label.classList.add('sel');
        totalEl.textContent = fmt(m);
        cap.textContent = 'tap middle for whole day';
        cap.classList.remove('good');
        panel.hidden = false;
        below.hidden = true;
        renderPanel(`${hourRange(selected)} today`, apps, opens);
        svg.setAttribute('aria-valuenow', selected);
        svg.setAttribute('aria-valuetext', `${hourRange(selected)}, ${fmt(m)}`);
      }
    }

    function renderPanel(title, apps, opens) {
      const named = apps.filter(([n]) => n);
      const sum = apps.reduce((a, [, m]) => a + m, 0);
      const max = named[0]?.[1] || 1;
      const rows = named.slice(0, 5);
      const more = apps.length - rows.length;
      panel.innerHTML = `
        <div class="panel-head">
          <div><p class="panel-title">${title}</p><p class="panel-meta">${fmt(sum)} on screen · ${opens} opens</p></div>
          <button type="button" class="panel-x" aria-label="Show the whole day" data-panel-x>×</button>
        </div>
        <ul class="panel-rows">${rows.map(([n, m], i) => `
          <li style="--i:${i}"><div class="pr-top"><span>${n}</span><b>${fmt(m)}</b></div><div class="pr-track"><i style="width:${(m / max) * 100}%"></i></div></li>`).join('')}
        </ul>
        ${more > 0 ? `<p class="panel-more">+${more} more apps</p>` : ''}`;
      panel.querySelector('[data-panel-x]')?.addEventListener('click', () => { selected = null; paint(); });
    }

    const select = (h) => { selected = h; paint(); };
    window.rethinkSelectHour = select;

    svg.addEventListener('click', (e) => {
      const r = svg.getBoundingClientRect();
      const k = size / r.width;
      const dx = (e.clientX - r.left) * k - c;
      const dy = (e.clientY - r.top) * k - c;
      if (Math.hypot(dx, dy) < inner - 14) return select(null);
      let a = Math.atan2(dy, dx) + Math.PI / 2;
      if (a < 0) a += 2 * Math.PI;
      const h = Math.floor((a / (2 * Math.PI)) * 24) % 24;
      if (minutes[h] === null) return;
      select(h === selected ? null : h);
    });
    svg.addEventListener('keydown', (e) => {
      const last = minutes.findLastIndex((m) => m !== null);
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') select(selected === null ? 0 : (selected + 1) % (last + 1));
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') select(selected === null ? last : (selected + last) % (last + 1));
      else if (e.key === 'Escape') select(null);
      else return;
      e.preventDefault();
    });

    paint();

    let swept = false;
    window.rethinkSweep = () => {
      if (swept) return;
      swept = true;
      if (reduceMotion) { svg.classList.add('swept'); return; }
      svg.classList.add('sweep');
      hand.addEventListener('animationend', () => svg.classList.add('swept'), { once: true });
    };
  }

  /* ---------- The tour: one pinned phone, a little scroll moves one beat ---------- */
  const tour = document.querySelector('.tour');
  const track = document.querySelector('[data-track]');
  const device = document.querySelector('[data-tour-device]');
  if (!tour || !track || !device) return;

  // Each beat is one tab. Order here is the scroll order.
  const BEATS = [
    { id: 'day-all', chap: 'day', tone: 'mint' },
    { id: 'day-hour', chap: 'day', tone: 'mint' },
    { id: 'week', chap: 'trend', tone: 'paper' },
    { id: 'month', chap: 'trend', tone: 'paper' },
    { id: 'apps', chap: 'trend', tone: 'paper' },
    { id: 'limit', chap: 'rules', tone: 'sun' },
    { id: 'focus', chap: 'rules', tone: 'sun' },
    { id: 'coach', chap: 'coach', tone: 'lilac' },
  ];
  track.style.setProperty('--beats', BEATS.length);

  const show = (name) => device.querySelectorAll(':scope > .scr').forEach((s) => s.classList.toggle('on', s.dataset.scr === name));
  const homeSeg = [...device.querySelectorAll('.h-seg [data-go]')];

  /* Limits and focus */
  const meter = document.querySelector('[data-meter]');
  const meterFill = document.querySelector('[data-meter-fill]');
  const meterText = document.querySelector('[data-meter-text]');
  const focusTry = document.querySelector('[data-focus-try]');
  const reason = device.querySelector('[data-block-reason]');
  const hEl = device.querySelector('[data-lim-h]');
  const mEl = device.querySelector('[data-lim-m]');
  let limit = 60;
  let raf = 0;

  function resetRule(rule) {
    cancelAnimationFrame(raf);
    meter.hidden = true;
    focusTry.hidden = rule !== 'focus';
    show(rule);
  }

  device.querySelectorAll('[data-pick]').forEach((b) => b.addEventListener('click', () => {
    limit = Number(b.dataset.pick);
    device.querySelectorAll('[data-pick]').forEach((x) => x.classList.toggle('on', x === b));
    hEl.textContent = Math.floor(limit / 60);
    mEl.textContent = limit % 60;
  }));

  // A day of Instagram plays out in a few seconds; when the limit is reached the app is blocked.
  device.querySelector('[data-lim-save]').addEventListener('click', () => {
    show('feed');
    meter.hidden = false;
    const runMs = reduceMotion ? 800 : 2400 + limit * 30;
    const start = performance.now();
    const startMin = 8 * 60;
    const step = (now) => {
      const p = Math.min(1, (now - start) / runMs);
      const used = Math.round(limit * p);
      // Spread the minutes over a day, so the clock moves much faster than the usage.
      const clock = startMin + Math.round(p * (limit * 6 + 180));
      const hh = Math.floor(clock / 60) % 24;
      meterText.textContent = `${fmt(used)} of ${fmt(limit)}, ${hh % 12 || 12}:${String(clock % 60).padStart(2, '0')} ${hh < 12 ? 'AM' : 'PM'}`;
      meterFill.style.width = `${p * 100}%`;
      if (p < 1) raf = requestAnimationFrame(step);
      else {
        reason.textContent = "You've reached today's limit for Instagram.";
        show('blocked');
      }
    };
    raf = requestAnimationFrame(step);
  });
  focusTry.addEventListener('click', () => {
    reason.textContent = 'Focus mode is on. Instagram is paused until it ends.';
    show('blocked');
  });
  device.querySelectorAll('[data-block-close]').forEach((b) => b.addEventListener('click', () => resetRule(BEATS[current]?.id === 'focus' ? 'focus' : 'limit')));

  /* Beats */
  const chaps = [...tour.querySelectorAll('[data-chap]')];
  const chapButtons = [...tour.querySelectorAll('[data-chap-go]')];
  let current = -1;

  function setBeat(i) {
    if (i === current) return;
    const prev = BEATS[current];
    current = i;
    const beat = BEATS[i];
    tour.dataset.tone = beat.tone;
    chaps.forEach((c) => c.classList.toggle('on', c.dataset.chap === beat.chap));
    chapButtons.forEach((b) => b.setAttribute('aria-current', String(b.dataset.chapGo === beat.chap)));
    tour.querySelectorAll('[data-beat-go]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.beatGo === beat.id)));
    tour.querySelectorAll('[data-say-for]').forEach((p) => { p.hidden = p.dataset.sayFor !== beat.id; });
    homeSeg.forEach((x) => x.setAttribute('aria-selected', String(x.dataset.go === 'today')));
    cancelAnimationFrame(raf);
    meter.hidden = true;
    focusTry.hidden = true;

    if (beat.chap === 'day') {
      show('home');
      window.rethinkSweep?.();
      // Scrolling onto "One hour" taps the busiest hour for you; scrolling back clears it.
      if (beat.id === 'day-hour') window.rethinkSelectHour?.(19);
      else if (prev?.id === 'day-hour') window.rethinkSelectHour?.(null);
    } else if (beat.chap === 'rules') resetRule(beat.id);
    else show(beat.id);
  }

  // Scroll position inside the track picks the beat.
  const beatTop = (i) => {
    const top = track.getBoundingClientRect().top + window.scrollY;
    const run = track.offsetHeight - window.innerHeight;
    return top + ((i + 0.5) / BEATS.length) * run;
  };
  function onScroll() {
    const r = track.getBoundingClientRect();
    const run = track.offsetHeight - window.innerHeight;
    const p = Math.min(0.9999, Math.max(0, -r.top / run));
    setBeat(Math.floor(p * BEATS.length));
  }
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; onScroll(); });
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  const goBeat = (id) => {
    const i = BEATS.findIndex((b) => b.id === id);
    window.scrollTo({ top: beatTop(i), behavior: reduceMotion ? 'auto' : 'smooth' });
  };
  tour.querySelectorAll('[data-beat-go]').forEach((b) => b.addEventListener('click', () => goBeat(b.dataset.beatGo)));
  chapButtons.forEach((b) => b.addEventListener('click', () => goBeat(BEATS.find((x) => x.chap === b.dataset.chapGo).id)));
  device.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => goBeat(b.dataset.go === 'today' ? 'day-all' : b.dataset.go)));
})();
