/* Title colour fix and a clearer sprint chart in the blueprint */
const fs = require('fs');
const [src, out] = process.argv.slice(2);
const j = JSON.parse(fs.readFileSync(src, 'utf8'));
let t = (j.data && j.data.text) || j.text;
if (!t) throw new Error('no text');
const R = (a, b) => { if (!t.includes(a)) throw new Error('missing: ' + a.slice(0, 90)); t = t.split(a).join(b); };

/* ---- title: solid cream with a soft drop shadow instead of gradient-clipped text ---- */
R('</style>', `
.tm-title { color: #fff7e8 !important; background: none !important; -webkit-background-clip: initial !important; background-clip: initial !important; -webkit-text-fill-color: #fff7e8; text-shadow: none !important; filter: drop-shadow(0 0.25cqw 0.6cqw rgba(0, 0, 0, 0.45)); }
.tm.inv .tm-title { color: #0f4f45 !important; -webkit-text-fill-color: #0f4f45; filter: drop-shadow(0 0.15cqw 0.4cqw rgba(255, 255, 255, 0.6)); }
.tm-hours-n, .tm-sec-n, .tm-person-n { text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25); }
/* ---- sprint chart ---- */
.bp-timeline svg { height: 230px; }
.bp-node rect.bar { transition: filter 0.2s; }
.bp-node:hover rect.bar { filter: brightness(1.18); }
.bp-node text { pointer-events: none; }
.bp-timeline { padding-top: 4px; }
</style>`);

/* ---- replace the timeline drawing ---- */
const a = t.indexOf("dash.draw('timeline', (box) => {");
const b = t.indexOf("/* People chips: click to highlight one person's work on the board */");
if (a < 0 || b < 0 || b < a) throw new Error('timeline block not found');
t = t.slice(0, a) + `dash.draw('timeline', (box) => {
  const h = dash.data('history'), c = dash.data('current');
  box.replaceChildren();
  if (h.status !== 'ok' || !Array.isArray(h.data) || !h.data.length) { const p = document.createElement('div'); p.className = 'bp-empty'; p.textContent = h.status === 'error' ? 'Failed to load' : 'Loading sprints…'; box.appendChild(p); return; }
  const cur = c.status === 'ok' && c.data && c.data[0] ? c.data[0] : null;
  const curId = cur ? cur.sprint_id : null;
  const perPerson = !!dash.params().person;
  const capOf = (name) => (({ 'PS-CREAT Sprint 1': 54 })[name] || 60) * (perPerson ? 1 : 4);
  const inv = !!document.querySelector('#studio.inv');
  const ink = inv ? '#0f4f45' : '#f6eedd', inkSoft = inv ? 'rgba(15,79,69,0.6)' : 'rgba(246,238,221,0.6)', grid = inv ? 'rgba(15,79,69,0.18)' : 'rgba(246,238,221,0.14)';
  const n = h.data.length, slot = 150, L = 46, Rm = 24, W = Math.max(box.clientWidth || 600, n * slot + L + Rm), H = 230, base = 168, top = 40;
  const max = Math.max(1, ...h.data.map((r) => Math.max(r.logged, capOf(r.sprint))));
  const y = (v) => base - (v / max) * (base - top);
  const svg = document.createElementNS(TM.ns, 'svg');
  svg.setAttribute('width', W); svg.setAttribute('viewBox', \`0 0 \${W} \${H}\`); svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Hours logged per sprint against capacity: ' + h.data.map((r) => \`\${r.sprint} \${TM.fmt(r.logged)} of \${capOf(r.sprint)} hours, \${r.done} of \${r.items} done\`).join('; '));
  const mk = (tag, at, p) => { const e = document.createElementNS(TM.ns, tag); for (const k in at) e.setAttribute(k, at[k]); (p || svg).appendChild(e); return e; };
  const defs = mk('defs', {});
  const grad = (id, c1, c2) => { const g = mk('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 }, defs); mk('stop', { offset: '0%', 'stop-color': c1 }, g); mk('stop', { offset: '100%', 'stop-color': c2 }, g); };
  grad('bp-g-cur', '#ff9a7e', '#e0603f');
  grad('bp-g-old', inv ? 'rgba(15,79,69,0.55)' : 'rgba(246,238,221,0.55)', inv ? 'rgba(15,79,69,0.3)' : 'rgba(246,238,221,0.25)');
  grad('bp-g-done', '#a9e4c8', '#6fc19c');
  /* horizontal guides with hour labels */
  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const v = Math.round((max / steps) * i), gy = y(v);
    mk('line', { x1: L, y1: gy, x2: W - Rm, y2: gy, stroke: i === 0 ? inkSoft : grid, 'stroke-width': 1, 'stroke-dasharray': i === 0 ? '' : '3 4' });
    const tl = mk('text', { x: L - 8, y: gy + 4, 'text-anchor': 'end', fill: inkSoft }); tl.style.font = '10.5px var(--mono)'; tl.textContent = v + 'h';
  }
  const x0 = L + slot / 2, step = n > 1 ? Math.min(slot, (W - L - Rm - slot) / (n - 1)) : 0;
  const bw = 52;
  const pts = h.data.map((r, i) => [x0 + i * step, y(r.logged)]);
  if (n > 1) mk('polyline', { points: pts.map((p) => p.join(',')).join(' '), fill: 'none', stroke: inkSoft, 'stroke-width': 1.2, 'stroke-dasharray': '4 5', 'stroke-linejoin': 'round' });
  h.data.forEach((r, i) => {
    const on = r.sprint_id === curId, [x, yy] = pts[i], cap = capOf(r.sprint), cy = y(cap);
    const g = mk('g', { class: 'bp-node', tabindex: '0', role: 'button', 'aria-label': \`Open \${r.sprint}: \${TM.fmt(r.logged)} of \${cap} hours, \${r.done} of \${r.items} done\` });
    mk('rect', { class: 'hit', x: x - slot / 2 + 10, y: 8, width: slot - 20, height: H - 16, rx: 10, fill: on ? (inv ? 'rgba(15,79,69,0.06)' : 'rgba(246,238,221,0.06)') : 'transparent', stroke: on ? (inv ? 'rgba(15,79,69,0.35)' : 'rgba(246,238,221,0.35)') : 'transparent', 'stroke-dasharray': '3 3' }, g);
    /* capacity marker: a short dashed line across the bar with a tag */
    mk('line', { x1: x - bw / 2 - 10, y1: cy, x2: x + bw / 2 + 10, y2: cy, stroke: on ? '#f6eedd' : inkSoft, 'stroke-width': 1.2, 'stroke-dasharray': '3 3' }, g);
    const ct = mk('text', { x: x + bw / 2 + 14, y: cy + 3.5, fill: inkSoft }, g); ct.style.font = '9.5px var(--mono)'; ct.textContent = 'cap ' + cap + 'h';
    /* the bar, with the done share lit inside it */
    const bh = Math.max(4, base - yy);
    mk('rect', { class: 'bar', x: x - bw / 2, y: base - bh, width: bw, height: bh, rx: 7, fill: on ? 'url(#bp-g-cur)' : 'url(#bp-g-old)', stroke: on ? 'rgba(255,255,255,0.55)' : 'transparent', 'stroke-width': 1 }, g);
    const doneShare = r.items ? r.done / r.items : 0;
    if (doneShare > 0) mk('rect', { x: x - bw / 2 + 5, y: base - bh * doneShare, width: 6, height: bh * doneShare, rx: 3, fill: 'url(#bp-g-done)' }, g);
    /* over capacity: a small amber cap on top */
    if (r.logged > cap) mk('rect', { x: x - bw / 2, y: base - bh, width: bw, height: Math.max(3, y(cap) - yy), rx: 3, fill: 'rgba(232,180,74,0.85)' }, g);
    const v = mk('text', { x, y: base - bh - 10, 'text-anchor': 'middle', fill: ink }, g); v.style.font = '800 15px var(--sans)'; v.textContent = TM.fmt(r.logged) + 'h';
    const pct = mk('text', { x, y: base - bh - 26, 'text-anchor': 'middle', fill: inkSoft }, g); pct.style.font = '10px var(--mono)'; pct.textContent = Math.round((r.logged / cap) * 100) + '% of cap';
    const t1 = mk('text', { x, y: base + 20, 'text-anchor': 'middle', fill: on ? ink : inkSoft }, g); t1.style.font = \`\${on ? 700 : 500} 12px var(--mono)\`; t1.textContent = String(r.sprint).replace('PS-CREAT ', '');
    const t2 = mk('text', { x, y: base + 36, 'text-anchor': 'middle', fill: inkSoft }, g); t2.style.font = '10.5px var(--mono)'; t2.textContent = \`\${r.done}/\${r.items} done\`;
    if (on) { const t3 = mk('text', { x, y: base + 51, 'text-anchor': 'middle', fill: '#f07a5f' }, g); t3.style.font = '700 9.5px var(--mono)'; t3.style.letterSpacing = '0.12em'; t3.textContent = cur && cur.state === 'active' ? 'NOW' : 'VIEWING'; }
    const go = () => dash.setParams({ sprint: r.sprint_id });
    g.addEventListener('click', go);
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });
  /* legend */
  const lg = mk('g', { transform: \`translate(\${L} \${H - 6})\` });
  [['#e0603f', 'hours logged'], ['#6fc19c', 'share done'], [null, 'cap = capacity']].forEach(([col, label], i) => {
    const lx = i * 120;
    if (col) mk('rect', { x: lx, y: -9, width: 12, height: 8, rx: 2, fill: col }, lg); else mk('line', { x1: lx, y1: -5, x2: lx + 12, y2: -5, stroke: inkSoft, 'stroke-width': 1.2, 'stroke-dasharray': '3 3' }, lg);
    const tx = mk('text', { x: lx + 18, y: 0, fill: inkSoft }, lg); tx.style.font = '10px var(--mono)'; tx.textContent = label;
  });
  box.appendChild(svg);
  const curIdx = h.data.findIndex((r) => r.sprint_id === curId);
  if (curIdx >= 0) box.scrollLeft = Math.max(0, pts[curIdx][0] - (box.clientWidth || 600) / 2);
});

` + t.slice(b);

fs.writeFileSync(out, JSON.stringify({ text: t }));
new Function(t.slice(t.indexOf('<script>') + 8, t.lastIndexOf('</script>')));
console.log('ok', t.length);
