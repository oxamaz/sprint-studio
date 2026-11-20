/* One-screen mode: desk fills the viewport, the blueprint is a sheet on the desk that the camera zooms into; display mode cycles the two */
const fs = require('fs');
const [src, out] = process.argv.slice(2);
const j = JSON.parse(fs.readFileSync(src, 'utf8'));
let t = (j.data && j.data.text) || j.text;
if (!t) throw new Error('no text');
const R = (a, b) => { if (!t.includes(a)) throw new Error('missing: ' + a.slice(0, 90)); t = t.split(a).join(b); };

/* ---- styles ---- */
R('</style>', `
/* ---------- One screen: the desk is the stage, the blueprint is a sheet on it ---------- */
.tm-sheet { display: none; }
.tm-back, .tm-nav { display: none; }
@media (min-width: 900px) {
  .tm { height: 100dvh; min-height: 560px; display: grid; place-items: center; border-radius: 0; background: #1a110a; box-shadow: none; }
  .tm-scene { width: min(100%, calc((100dvh - 8px) * 1672 / 941)); transform-origin: 61% 86%; transition: transform 1.15s cubic-bezier(.7,0,.2,1), opacity 0.55s ease 0.35s; }
  .tm-scene::after { display: none; }
  .bp { position: absolute; inset: 0; margin: 0; border-radius: 0; opacity: 0; pointer-events: none; transform: scale(0.3); transform-origin: 61% 86%; transition: transform 1.15s cubic-bezier(.7,0,.2,1), opacity 0.45s ease; overflow: auto; padding: 72px clamp(20px, 3vw, 40px) 70px; align-content: start; }
  .bp::before, .bp::after { display: none; }
  .tm.bp-open .tm-scene { transform: scale(3.6); opacity: 0; pointer-events: none; transition: transform 1.15s cubic-bezier(.7,0,.2,1), opacity 0.5s ease 0.45s; }
  .tm.bp-open .bp { opacity: 1; transform: none; pointer-events: auto; transition-delay: 0.3s, 0.35s; }
  .tm-sheet { display: block; }
  .tm-back { display: inline-flex; }
  .tm-nav { display: flex; }
}
.tm-sheet { position: absolute; left: 55.6%; top: 78.5%; width: 11.8%; aspect-ratio: 1.42; transform: rotate(-7deg); cursor: pointer; border: 0; padding: 0.7cqw 0.8cqw; text-align: left; font: inherit; color: #0f4f45; border-radius: 0.25cqw; z-index: 5;
  background: linear-gradient(rgba(15, 79, 69, 0.14) 1px, transparent 1px) 0 0 / 1.2cqw 1.2cqw, linear-gradient(90deg, rgba(15, 79, 69, 0.14) 1px, transparent 1px) 0 0 / 1.2cqw 1.2cqw, #f3ead6;
  box-shadow: 0 0.9cqw 1.8cqw -0.9cqw rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(0, 0, 0, 0.12); transition: transform 0.35s cubic-bezier(.3,1.4,.5,1), box-shadow 0.3s; }
.tm-sheet:hover { transform: rotate(-4deg) translateY(-0.5cqw) scale(1.05); box-shadow: 0 0 0 0.25cqw var(--coral), 0 1.2cqw 2.2cqw -0.9cqw rgba(0, 0, 0, 0.75); }
.tm-sheet:focus-visible { outline: 2px solid var(--coral); outline-offset: 3px; }
.tm-sheet b { display: block; font-family: var(--mono); font-size: 0.78cqw; letter-spacing: 0.16em; text-transform: uppercase; }
.tm-sheet span { display: block; margin-top: 0.35cqw; font-family: var(--mono); font-size: 0.68cqw; line-height: 1.5; color: rgba(15, 79, 69, 0.75); }
.tm-sheet i { position: absolute; right: 0.7cqw; bottom: 0.5cqw; font-style: normal; font-weight: 800; font-size: 1.1cqw; color: var(--coral); }
.tm-sheet::before { content: ""; position: absolute; top: -0.5cqw; left: 32%; width: 36%; height: 1cqw; background: rgba(240, 122, 95, 0.75); transform: rotate(2deg); }
.tm-scene.spot-on .tm-sheet { opacity: 0.35; }
.tm-back { position: absolute; top: 16px; left: 18px; z-index: 8; align-items: center; gap: 8px; appearance: none; cursor: pointer; padding: 9px 14px; border-radius: 999px; border: 1px solid rgba(15, 79, 69, 0.5); background: rgba(255, 251, 242, 0.9); color: #0f4f45; font-family: var(--mono); font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; opacity: 0; pointer-events: none; transition: opacity 0.3s ease 0.6s; }
.tm.bp-open .tm-back { opacity: 1; pointer-events: auto; }
.tm-back:hover { background: #fff; }
.tm-back:focus-visible { outline: 2px solid var(--coral); outline-offset: 2px; }
.tm-nav { position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%); z-index: 8; align-items: center; gap: 10px; padding: 6px 8px 6px 14px; border-radius: 999px; background: rgba(20, 12, 6, 0.55); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
.tm-nav i { width: 8px; height: 8px; border-radius: 50%; background: rgba(246, 238, 221, 0.4); transition: background 0.3s, transform 0.3s; }
.tm-nav i.on { background: var(--coral); transform: scale(1.3); }
.tm-nav button { appearance: none; cursor: pointer; margin-left: 6px; padding: 6px 12px; border-radius: 999px; border: 1px solid rgba(246, 238, 221, 0.4); background: transparent; color: #f6eedd; font-family: var(--mono); font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; }
.tm-nav button:hover { background: rgba(246, 238, 221, 0.14); }
.tm-nav button:focus-visible { outline: 2px solid var(--coral); outline-offset: 2px; }
.tm-nav .nav-on { display: none; } .tm.display .tm-nav .nav-on { display: inline; } .tm.display .tm-nav .nav-off { display: none; }
.tm.display .tm-spot, .tm.display .tm-lamp, .tm.display .tm-dim { display: none; }
.tm.display .tm-sheet { pointer-events: none; }
/* ---------- Liquid glass: strong blur, almost no fill, a light edge ---------- */
.tm-sec, .tm-person, .tm-team button { background: rgba(246, 238, 221, 0.09) !important; backdrop-filter: blur(16px) saturate(150%) brightness(1.08) !important; -webkit-backdrop-filter: blur(16px) saturate(150%) brightness(1.08) !important; border: 1px solid rgba(246, 238, 221, 0.55) !important; box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35), inset 0 -1px 0 rgba(255, 255, 255, 0.06), 0 0.6cqw 1.4cqw -0.8cqw rgba(0, 0, 0, 0.55) !important; }
.tm-sec:hover, .tm-person:hover, .tm-team button:hover { background: rgba(246, 238, 221, 0.16) !important; }
.tm-sec.on { background: color-mix(in srgb, var(--sec) 22%, rgba(246, 238, 221, 0.1)) !important; border-color: var(--sec) !important; }
.tm-person.on { background: rgba(246, 238, 221, 0.92) !important; color: var(--ink); border-color: var(--cream) !important; }
.tm-team button.is-person { background: rgba(240, 122, 95, 0.22) !important; border-color: var(--coral) !important; }
.tm.inv .tm-sec, .tm.inv .tm-person, .tm.inv .tm-team button { background: rgba(255, 251, 242, 0.22) !important; border-color: rgba(15, 79, 69, 0.45) !important; box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7), 0 0.6cqw 1.4cqw -0.8cqw rgba(60, 40, 10, 0.35) !important; }
.tm.inv .tm-sec:hover, .tm.inv .tm-person:hover, .tm.inv .tm-team button:hover { background: rgba(255, 251, 242, 0.38) !important; }
.tm.inv .tm-person.on { background: #0f4f45 !important; color: #f6eedd; border-color: #0f4f45 !important; }
.tm.inv .tm-sec.on { background: color-mix(in srgb, var(--sec) 30%, rgba(255, 251, 242, 0.4)) !important; }
.tm.inv .tm-team button.is-person { background: rgba(240, 122, 95, 0.2) !important; }
.tm-kicker, .tm-dates, .tm-switch { text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5), 0 0 12px rgba(0, 0, 0, 0.35); }
.tm-hours-n, .tm-sec-n, .tm-person-n, .tm-title { text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35); }
.tm.inv .tm-hours-n, .tm.inv .tm-sec-n, .tm.inv .tm-person-n { text-shadow: 0 1px 2px rgba(255, 255, 255, 0.55); }
.tm.inv .tm-title { text-shadow: none; }
</style>`);

/* ---- markup ---- */
R('    <div class="tm-o tm-spot" style="left: 14%; top: 66%; --pd: 2.8s">',
  `    <button type="button" class="tm-o tm-sheet" id="open-bp" aria-label="Open the blueprint: all sprints and the work board"><b>Blueprint</b><span>all sprints · work board · people</span><i>&#8599;</i></button>
    <div class="tm-o tm-spot" style="left: 14%; top: 66%; --pd: 2.8s">`);
R('  <section class="bp" id="blueprint">', `  <button type="button" class="tm-back" id="back-desk">&#8592; Desk</button>
  <div class="tm-nav" role="group" aria-label="View"><i class="on"></i><i></i><button type="button" id="display-btn" aria-pressed="false"><span class="nav-off">&#9654; Display</span><span class="nav-on">&#9632; Stop</span></button></div>
  <section class="bp" id="blueprint">`);
R('<div class="bp-eyebrow">Blueprint</div>', '<div class="bp-eyebrow">Blueprint · the sheet on the desk</div>');

/* ---- behaviour ---- */
R("TM.pick = (name) => dash.setParams({ person: name || null });", `TM.pick = (name) => dash.setParams({ person: name || null });
/* Desk or blueprint: a camera move between the two, on one screen. Display mode cycles them for a wall screen */
TM.openBp = (on) => {
  document.querySelectorAll('#studio').forEach((s) => s.classList.toggle('bp-open', !!on));
  document.querySelectorAll('.tm-nav i').forEach((d, i) => d.classList.toggle('on', (i === 1) === !!on));
  document.querySelectorAll('#back-desk').forEach((b) => b.setAttribute('aria-hidden', on ? 'false' : 'true'));
};
document.querySelectorAll('#open-bp').forEach((b) => b.addEventListener('click', () => TM.openBp(true)));
document.querySelectorAll('#back-desk').forEach((b) => b.addEventListener('click', () => TM.openBp(false)));
document.querySelectorAll('.tm-nav i').forEach((d, i) => { d.style.cursor = 'pointer'; d.addEventListener('click', () => TM.openBp(i === 1)); });
document.addEventListener('keydown', (e) => {
  if (e.target && /input|select|textarea/i.test(e.target.tagName)) return;
  if (e.key === 'ArrowRight') TM.openBp(true);
  if (e.key === 'ArrowLeft') TM.openBp(false);
});
TM.displayTimer = null;
TM.setDisplay = (on) => {
  document.querySelectorAll('#studio').forEach((s) => s.classList.toggle('display', !!on));
  document.querySelectorAll('#display-btn').forEach((b) => b.setAttribute('aria-pressed', on ? 'true' : 'false'));
  if (TM.displayTimer) { clearInterval(TM.displayTimer); TM.displayTimer = null; }
  if (on) { TM.openBp(false); TM.displayTimer = setInterval(() => TM.openBp(!document.querySelector('#studio.bp-open')), 20000); }
};
document.querySelectorAll('#display-btn').forEach((b) => b.addEventListener('click', () => TM.setDisplay(!document.querySelector('#studio.display'))));
if (/[?&]display=1/.test(location.search) || location.hash === '#display') TM.setDisplay(true);`);

fs.writeFileSync(out, JSON.stringify({ text: t }));
new Function(t.slice(t.indexOf('<script>') + 8, t.lastIndexOf('</script>')));
console.log('ok', t.length);
