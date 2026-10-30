// Where the APK and code live. The APK link goes live once the v1.0 release is published on GitHub.
const LINKS = {
  apk: 'https://github.com/devrahuljourney/rethink/releases/latest/download/rethink.apk',
  github: 'https://github.com/devrahuljourney/rethink',
};

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Links ---------- */
document.querySelectorAll('[data-apk]').forEach((a) => { a.href = LINKS.apk; });
document.querySelectorAll('[data-github]').forEach((a) => { a.href = LINKS.github; a.rel = 'noopener'; });

/* ---------- Header border once the page scrolls ---------- */
const bar = document.querySelector('.bar');
const onScroll = () => bar.classList.toggle('scrolled', window.scrollY > 8);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- Demo video ---------- */
const dialog = document.querySelector('[data-demo]');
const demoVideo = dialog.querySelector('video');
document.querySelectorAll('[data-open-demo]').forEach((b) => b.addEventListener('click', () => {
  dialog.showModal();
  demoVideo.play().catch(() => {});
}));
dialog.addEventListener('close', () => demoVideo.pause());
dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

/* ---------- QR code for the APK ---------- */
window.addEventListener('load', () => {
  const box = document.querySelector('[data-qr]');
  if (!box || typeof qrcode !== 'function') return;
  const qr = qrcode(0, 'M');
  qr.addData(LINKS.apk);
  qr.make();
  box.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
  box.querySelector('svg path')?.setAttribute('fill', '#1B1A1F');
});

/* ---------- Tour: sticky phone follows the step in view ---------- */
const steps = [...document.querySelectorAll('.step')];
const screens = document.querySelector('[data-screens]');
const rail = document.querySelector('[data-rail]');

const media = steps.map((step) => JSON.parse(step.dataset.media).map((m) => {
  let el;
  if (m.v) {
    el = document.createElement('video');
    Object.assign(el, { muted: true, loop: true, playsInline: true, preload: 'metadata' });
    el.src = `assets/clips/${m.v}.mp4`;
    el.poster = `assets/clips/${m.v}-poster.webp`;
  } else {
    el = document.createElement('img');
    el.src = `assets/screens/${m.i}.webp`;
    el.alt = '';
    el.loading = 'lazy';
    el.decoding = 'async';
  }
  screens.appendChild(el);
  return el;
}));
steps.forEach(() => rail.appendChild(document.createElement('li')));

let active = -1;
let cycle;

function show(el) {
  screens.querySelectorAll('.on').forEach((o) => {
    if (o === el) return;
    o.classList.remove('on');
    if (o.tagName === 'VIDEO') o.pause();
  });
  el.classList.add('on');
  if (el.tagName === 'VIDEO') { el.currentTime = 0; el.play().catch(() => {}); }
}

function activate(i) {
  if (i === active) return;
  active = i;
  steps.forEach((s, j) => s.classList.toggle('on', j === i));
  [...rail.children].forEach((r, j) => r.classList.toggle('on', j === i));
  clearInterval(cycle);
  const list = media[i];
  let k = 0;
  show(list[0]);
  // Steps with several screens flip through them while the step is in view.
  if (list.length > 1 && !reduceMotion) {
    cycle = setInterval(() => { k = (k + 1) % list.length; show(list[k]); }, 2600);
  }
}

const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) activate(steps.indexOf(e.target)); });
  // On phones the sticky phone covers the top half, so the step "in view" is the one just below it.
}, { rootMargin: window.matchMedia('(max-width: 760px)').matches ? '-58% 0px -32% 0px' : '-45% 0px -45% 0px' });
steps.forEach((s) => io.observe(s));
activate(0);

/* ---------- Decision engine ---------- */
// Each case lists the checks PolicyEngine runs, in order, until one returns.
const CASES = {
  focus: { checks: [['block', 'yes']], line: 'block', kind: 'Block',
    text: 'Focus hours are on, so Instagram stays closed. The only ways out are Close or Manage in Rethink.' },
  plain: { checks: [['block', 'no'], ['guarded', 'no']], line: 'guarded', kind: 'Allow',
    text: "The pause isn't on for this app, so it opens straight away." },
  first: { checks: [['block', 'no'], ['guarded', 'yes'], ['session', 'no']], line: 'session', kind: 'Gate',
    text: 'No session yet, so the pause opens: breathe, say why, pick how long.' },
  grace: { checks: [['block', 'no'], ['guarded', 'yes'], ['session', 'yes'], ['stale', 'no'], ['exhausted', 'no']], line: 'allow', kind: 'Allow',
    text: 'Back within the grace window, so the pause stays out of the way. A quick look at a notification never re-gates.' },
  stale: { checks: [['block', 'no'], ['guarded', 'yes'], ['session', 'yes'], ['stale', 'yes']], line: 'stale', kind: 'Gate',
    text: 'The old session is stale, so this counts as a new open and the pause runs again.' },
  used: { checks: [['block', 'no'], ['guarded', 'yes'], ['session', 'yes'], ['stale', 'no'], ['exhausted', 'yes']], line: 'exhausted', kind: 'Shield',
    text: 'The time you asked for is used up, so the shield asks whether you still need Instagram.' },
};

const caseButtons = [...document.querySelectorAll('[data-case]')];
const checkItems = [...document.querySelectorAll('[data-check]')];
const codeLines = [...document.querySelectorAll('[data-line]')];
const result = document.querySelector('[data-result]');
const chip = result.querySelector('.chip');
const resultText = result.querySelector('[data-result-text]');
let runId = 0;

function run(name) {
  const c = CASES[name];
  const id = ++runId;
  caseButtons.forEach((b) => b.setAttribute('aria-checked', String(b.dataset.case === name)));
  checkItems.forEach((li) => { li.className = ''; li.removeAttribute('data-a'); });
  codeLines.forEach((l) => l.classList.remove('lit'));
  chip.textContent = 'Checking';
  chip.removeAttribute('data-kind');
  resultText.textContent = '';
  result.classList.remove('pop');

  const delay = reduceMotion ? 0 : 260;
  c.checks.forEach(([check, answer], n) => {
    setTimeout(() => {
      if (id !== runId) return;
      const li = checkItems.find((x) => x.dataset.check === check);
      li.dataset.a = answer;
      li.classList.add(n === c.checks.length - 1 && c.line !== 'allow' ? 'hit' : 'done');
      codeLines.forEach((l) => l.classList.toggle('lit', l.dataset.line === check));
    }, delay * (n + 1));
  });

  setTimeout(() => {
    if (id !== runId) return;
    const decided = checkItems.findIndex((x) => x.classList.contains('hit'));
    checkItems.forEach((li, j) => { if (!li.dataset.a && (decided === -1 || j > decided)) li.classList.add('skip'); });
    codeLines.forEach((l) => l.classList.toggle('lit', l.dataset.line === c.line));
    chip.textContent = c.kind;
    chip.dataset.kind = c.kind;
    resultText.textContent = c.text;
    void result.offsetWidth;
    result.classList.add('pop');
  }, delay * (c.checks.length + 1));
}

caseButtons.forEach((b) => b.addEventListener('click', () => run(b.dataset.case)));
// Radio-group arrow keys.
document.querySelector('[data-cases]').addEventListener('keydown', (e) => {
  const i = caseButtons.indexOf(document.activeElement);
  if (i < 0 || !['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key)) return;
  e.preventDefault();
  const next = caseButtons[(i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : caseButtons.length - 1)) % caseButtons.length];
  next.focus();
  run(next.dataset.case);
});
run('first');
