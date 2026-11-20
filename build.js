/* Turns the dashboard page (from the Claude artifact export) into a standalone public/index.html */
const fs = require('fs');
const path = require('path');
const src = process.argv[2];
const j = JSON.parse(fs.readFileSync(src, 'utf8'));
let t = (j.data && j.data.text) || j.text;
if (!t) throw new Error('no page text in ' + src);

const R = (a, b, opt) => { if (!t.includes(a)) { if (opt) return; throw new Error('missing: ' + a.slice(0, 80)); } t = t.split(a).join(b); };
R('<meta name="dash-one-writer">\n', '');
R('/_blob/eb2811ef4ffbe6711395af12226c8393', 'team_desk.jpg');
R('/_blob/a05edfb55c839f7f44b25aefbf40190c', 'team_desk_cream.jpg');
// the live page's "updated" mark: use the time the worker fetched Jira
R("if (d.status === 'ok') { TM.updatedAt = new Date(); }", "if (d.status === 'ok') { TM.updatedAt = window.SPRINT_FETCHED_AT ? new Date(window.SPRINT_FETCHED_AT) : new Date(); }", true);
// strip Claude-only helpers that the shim doesn't provide
R("const ssRow", "const ssRow", true);

const head = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Sprint Studio</title>
<meta name="robots" content="noindex">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Fraunces:ital,wght@1,400&display=swap">
<style>
  :root { --font-anthropic-sans: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif; --font-anthropic-serif: "Fraunces", "Iowan Old Style", Georgia, serif; color-scheme: dark; }
  html, body { margin: 0; background: #1a110a; }
  body { font-family: var(--font-anthropic-sans); padding: clamp(10px, 2vw, 28px); padding-left: max(10px, env(safe-area-inset-left, 0px)); padding-right: max(10px, env(safe-area-inset-right, 0px)); }
  #dash-root { max-width: 1480px; margin: 0 auto; }
  .ss-err { display: none; margin: 0 0 14px; padding: 12px 16px; border-radius: 10px; background: #4a1f16; color: #ffd9cf; font: 13px/1.5 var(--font-anthropic-sans); }
  .ss-err.on { display: block; }
  .dash-skeleton { opacity: 0.45; }
</style>
<script src="shim.js"></script>
</head>
<body>
<div id="dash-root">
<div class="ss-err" id="ss-err"></div>
`;
const foot = `
</div>
<script>
(function () {
  var box = document.getElementById('ss-err');
  var orig = console.error;
  console.error = function () { orig.apply(console, arguments); var m = String(arguments[1] || arguments[0] || ''); if (/Jira|secrets|fetch/i.test(m)) { box.textContent = 'Could not load from Jira: ' + m; box.classList.add('on'); } };
})();
</script>
</body>
</html>
`;
const out = path.join(__dirname, 'public', 'index.html');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, head + t + foot);
// syntax check of the page script
const s = t.slice(t.indexOf('<script>') + 8, t.lastIndexOf('</script>'));
new Function(s);
console.log('built', out, (head + t + foot).length, 'bytes');
