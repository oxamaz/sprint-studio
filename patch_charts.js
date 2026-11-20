/* Chart row in the blueprint: progress donut, hours by section, hours by person */
const fs = require('fs'); const [src, out] = process.argv.slice(2);
let t = JSON.parse(fs.readFileSync(src, 'utf8')).text;
const R = (a, b) => { if (!t.includes(a)) throw new Error('missing: ' + a.slice(0, 80)); t = t.split(a).join(b); };

/* ---- CSS ---- */
R('</style>', `
.bp-charts { display: grid; grid-template-columns: minmax(250px, 0.9fr) 1.1fr 1.3fr; gap: 14px; }
@media (max-width: 1100px) { .bp-charts { grid-template-columns: 1fr 1fr; } }
@media (max-width: 700px) { .bp-charts { grid-template-columns: 1fr; } }
.bp-chart { min-width: 0; padding: 12px 14px 10px; border: 1px dashed rgba(246, 238, 221, 0.35); border-radius: 8px; background: rgba(246, 238, 221, 0.04); }
.bp-chart h4 { margin: 0 0 6px; font-family: var(--mono); font-size: 11px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: var(--cream-2); }
.bp-chart h4 em { font-style: normal; font-weight: 400; letter-spacing: 0.04em; text-transform: none; }
.bp-chart svg { display: block; width: 100%; height: auto; overflow: visible; }
.tm.inv .bp-chart { border-color: rgba(15, 79, 69, 0.4); background: rgba(15, 79, 69, 0.04); }
.bp-timeline svg { height: 260px; }
</style>`);

/* ---- markup: a chart row after the sprint bars ---- */
R('<div class="bp-block" id="work-board">', `<div class="bp-block" id="charts">
      <div class="bp-label">This sprint in pictures <em>· follows the person or section you pick</em></div>
      <div class="bp-charts">
        <div class="bp-chart"><h4>Progress <em>· items by status</em></h4><div data-draw="donut" data-source="by_status" role="img" aria-label="Items by status"></div></div>
        <div class="bp-chart"><h4>Hours by section <em>· logged vs estimate</em></h4><div data-draw="secchart" data-source="by_section" role="img" aria-label="Hours by section"></div></div>
        <div class="bp-chart"><h4>Hours by person <em>· against the capacity</em></h4><div data-draw="peoplechart" data-source="by_person" role="img" aria-label="Hours by person"></div></div>
      </div>
    </div>

    <div class="bp-block" id="work-board">`);

/* bigger sprint bars */
R("const bw = 52;", "const bw = 66;");
R("v.style.font = '800 15px var(--sans)'; v.textContent = TM.fmt(r.logged) + 'h';", "v.style.font = '800 17px var(--sans)'; v.textContent = TM.fmt(r.logged) + 'h';");

/* ---- drawings ---- */
R("/* People chips: click to highlight one person's work on the board */", `
TM.inkset = () => { const inv = !!document.querySelector('#studio.inv'); return { inv, ink: inv ? '#0f4f45' : '#f6eedd', soft: inv ? 'rgba(15,79,69,0.65)' : 'rgba(246,238,221,0.65)', track: inv ? 'rgba(15,79,69,0.12)' : 'rgba(246,238,221,0.12)', line: inv ? 'rgba(15,79,69,0.4)' : 'rgba(246,238,221,0.4)' }; };
TM.mkSvg = (w, h, label) => { const s = document.createElementNS(TM.ns, 'svg'); s.setAttribute('viewBox', \`0 0 \${w} \${h}\`); s.setAttribute('role', 'img'); if (label) s.setAttribute('aria-label', label); return s; };
TM.el = (svg, tag, at, p) => { const e = document.createElementNS(TM.ns, tag); for (const k in at) e.setAttribute(k, at[k]); (p || svg).appendChild(e); return e; };
TM.txt = (svg, x, y, s, font, fill, anchor, p) => { const e = TM.el(svg, 'text', { x, y, fill, 'text-anchor': anchor || 'start' }, p); e.style.font = font; e.textContent = s; return e; };
TM.empty = (box, msg) => { const p = document.createElement('div'); p.className = 'bp-empty'; p.textContent = msg; box.appendChild(p); };
TM.statusColor = { 'Done': '#8fd3b6', 'In Review': '#b9a6e0', 'In Progress': '#7fb8e8', 'Reopened': '#7fb8e8', 'Rollover': '#f07a5f', 'Blocked': '#e8b44a', 'Paused': '#e8b44a' };

/* Progress donut: items by status, done share in the middle */
dash.draw('donut', (box) => {
  const d = dash.data('by_status'); box.replaceChildren();
  if (d.status !== 'ok' || !Array.isArray(d.data)) return TM.empty(box, d.status === 'error' ? 'Failed to load' : 'Loading…');
  const k = TM.inkset(), rows = d.data.filter((r) => r.items > 0), total = rows.reduce((s, r) => s + r.items, 0);
  if (!total) return TM.empty(box, 'Nothing here yet.');
  const W = 320, H = 170, cx = 82, cy = 85, r = 60, sw = 22, C = 2 * Math.PI * r;
  const svg = TM.mkSvg(W, H, rows.map((x) => \`\${x.status} \${x.items}\`).join(', '));
  TM.el(svg, 'circle', { cx, cy, r, fill: 'none', stroke: k.track, 'stroke-width': sw });
  let off = 0;
  rows.forEach((x) => {
    const len = (x.items / total) * C, col = TM.statusColor[x.status] || k.line, vis = Math.max(0, len - 2);
    TM.el(svg, 'circle', { cx, cy, r, fill: 'none', stroke: col, 'stroke-width': sw, 'stroke-dasharray': \`\${vis} \${C - vis}\`, 'stroke-dashoffset': -off, transform: \`rotate(-90 \${cx} \${cy})\` });
    off += len;
  });
  const done = rows.filter((x) => x.status === 'Done').reduce((s, x) => s + x.items, 0);
  TM.txt(svg, cx, cy + 4, Math.round((done / total) * 100) + '%', '800 26px var(--sans)', k.ink, 'middle');
  TM.txt(svg, cx, cy + 22, 'done', '10px var(--mono)', k.soft, 'middle').style.letterSpacing = '0.14em';
  const lx = 165, rowH = Math.min(24, (H - 20) / rows.length);
  rows.forEach((x, i) => {
    const y = 20 + i * rowH + rowH / 2;
    TM.el(svg, 'rect', { x: lx, y: y - 6, width: 12, height: 12, rx: 3, fill: TM.statusColor[x.status] || k.line });
    TM.txt(svg, lx + 20, y + 4, x.status.toLowerCase(), '11px var(--mono)', k.ink);
    TM.txt(svg, W - 4, y + 4, \`\${x.items} · \${Math.round((x.items / total) * 100)}%\`, '11px var(--mono)', k.soft, 'end');
  });
  box.appendChild(svg);
});

/* Hours by section: logged bar with the estimate as a dashed outline behind it */
dash.draw('secchart', (box) => {
  const d = dash.data('by_section'); box.replaceChildren();
  if (d.status !== 'ok' || !Array.isArray(d.data)) return TM.empty(box, d.status === 'error' ? 'Failed to load' : 'Loading…');
  const k = TM.inkset(), rows = d.data, cols = { 'Creatives Sprint': '#f07a5f', 'Production': '#e8b44a', 'General Tasks': '#b9a6e0' };
  const W = 360, rowH = 50, H = rows.length * rowH + 16, L = 96, Rm = 8, bw = W - L - Rm;
  const max = Math.max(1, ...rows.map((r) => Math.max(r.logged, r.estimated)));
  const svg = TM.mkSvg(W, H, rows.map((r) => \`\${r.section}: \${TM.fmt(r.logged)} of \${TM.fmt(r.estimated)} estimated hours, \${r.done} of \${r.items} done\`).join('; '));
  rows.forEach((r, i) => {
    const y = 10 + i * rowH, name = r.section.replace(' Sprint', '').replace(' Tasks', '');
    TM.txt(svg, 0, y + 15, name.toUpperCase(), '700 11px var(--mono)', k.ink).style.letterSpacing = '0.12em';
    TM.txt(svg, 0, y + 29, \`\${r.done}/\${r.items} done\`, '10px var(--mono)', k.soft);
    TM.el(svg, 'rect', { x: L, y: y + 4, width: bw, height: 18, rx: 5, fill: k.track });
    if (r.estimated > 0) TM.el(svg, 'rect', { x: L, y: y + 4, width: Math.max(2, (r.estimated / max) * bw), height: 18, rx: 5, fill: 'none', stroke: k.line, 'stroke-dasharray': '3 3' });
    if (r.logged > 0) TM.el(svg, 'rect', { x: L, y: y + 4, width: Math.max(3, (r.logged / max) * bw), height: 18, rx: 5, fill: cols[r.section] || k.line });
    const over = r.estimated > 0 && r.logged > r.estimated;
    const note = r.logged > 0 ? \`\${TM.fmt(r.logged)}h logged\${r.estimated ? \` · est \${TM.fmt(r.estimated)}h\` : ''}\${over ? ' · over' : ''}\` : (r.items ? 'nothing logged yet' : 'no items');
    TM.txt(svg, L, y + 36, note, '10px var(--mono)', over ? '#e8b44a' : k.soft);
  });
  box.appendChild(svg);
});

/* Hours by person: stacked by section, with the capacity line */
dash.draw('peoplechart', (box) => {
  const d = dash.data('by_person'), c = dash.data('current'); box.replaceChildren();
  if (d.status !== 'ok' || !Array.isArray(d.data)) return TM.empty(box, d.status === 'error' ? 'Failed to load' : 'Loading…');
  const k = TM.inkset(), cap = c.status === 'ok' && c.data && c.data[0] && c.data[0].cap_each ? c.data[0].cap_each : 60;
  const rows = d.data; if (!rows.length) return TM.empty(box, 'Nothing here yet.');
  const W = 400, rowH = 34, top = 18, H = top + rows.length * rowH + 14, L = 84, Rm = 66, bw = W - L - Rm;
  const max = Math.max(cap, ...rows.map((r) => r.logged)) * 1.04;
  const x = (v) => L + (v / max) * bw;
  const svg = TM.mkSvg(W, H, rows.map((r) => \`\${r.person} \${TM.fmt(r.logged)} of \${cap} hours\`).join('; '));
  const segs = [['creatives', '#f07a5f'], ['production', '#e8b44a'], ['general', '#b9a6e0']];
  rows.forEach((r, i) => {
    const y = top + i * rowH;
    TM.txt(svg, L - 10, y + 16, String(r.person).split(' ')[0], '700 12px var(--sans)', k.ink, 'end');
    TM.el(svg, 'rect', { x: L, y: y + 4, width: bw, height: 16, rx: 4, fill: k.track });
    let run = 0;
    segs.forEach(([key, col]) => { const v = Number(r[key]) || 0; if (v > 0) { TM.el(svg, 'rect', { x: x(run), y: y + 4, width: Math.max(2, x(run + v) - x(run)), height: 16, fill: col }); run += v; } });
    TM.txt(svg, W - Rm + 8, y + 16, r.logged > 0 ? \`\${TM.fmt(r.logged)}h · \${r.cap_pct}%\` : 'not yet', '11px var(--mono)', r.logged > cap ? '#e8b44a' : k.soft);
  });
  TM.el(svg, 'line', { x1: x(cap), y1: top - 6, x2: x(cap), y2: top + rows.length * rowH, stroke: k.ink, 'stroke-width': 1.2, 'stroke-dasharray': '3 3' });
  TM.txt(svg, x(cap), top - 9, \`cap \${cap}h\`, '700 9.5px var(--mono)', k.soft, 'middle').style.letterSpacing = '0.1em';
  const lg = TM.el(svg, 'g', { transform: \`translate(\${L} \${H - 2})\` });
  segs.forEach(([key, col], i) => { TM.el(svg, 'rect', { x: i * 92, y: -9, width: 10, height: 10, rx: 2, fill: col }, lg); TM.txt(svg, i * 92 + 15, 0, key, '10px var(--mono)', k.soft, 'start', lg); });
  box.appendChild(svg);
});

/* People chips: click to highlight one person's work on the board */`);

fs.writeFileSync(out, JSON.stringify({ text: t }));
new Function(t.slice(t.indexOf('<script>') + 8, t.lastIndexOf('</script>')));
console.log('ok', t.length);
