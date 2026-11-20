const fs = require('fs'); const [src, out] = process.argv.slice(2);
let t = JSON.parse(fs.readFileSync(src, 'utf8')).text;
const css = `
/* clear glass: almost no fill, a whisper of blur at rest, real blur only on hover */
.tm-sec, .tm-person, .tm-team button { background: rgba(246, 238, 221, 0.035) !important; backdrop-filter: blur(3px) !important; -webkit-backdrop-filter: blur(3px) !important; border: 1px solid rgba(246, 238, 221, 0.5) !important; box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22), 0 0.5cqw 1.2cqw -0.8cqw rgba(0, 0, 0, 0.45) !important; transition: background 0.3s, backdrop-filter 0.3s, transform 0.3s cubic-bezier(.3,1.4,.5,1), border-color 0.3s !important; }
.tm-sec:hover, .tm-person:hover, .tm-team button:hover { background: rgba(246, 238, 221, 0.09) !important; backdrop-filter: blur(14px) saturate(140%) !important; -webkit-backdrop-filter: blur(14px) saturate(140%) !important; border-color: rgba(246, 238, 221, 0.75) !important; }
.tm.inv .tm-sec, .tm.inv .tm-person, .tm.inv .tm-team button { background: rgba(255, 251, 242, 0.08) !important; border-color: rgba(15, 79, 69, 0.42) !important; box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 0.5cqw 1.2cqw -0.8cqw rgba(60, 40, 10, 0.3) !important; }
.tm.inv .tm-sec:hover, .tm.inv .tm-person:hover, .tm.inv .tm-team button:hover { background: rgba(255, 251, 242, 0.26) !important; border-color: rgba(15, 79, 69, 0.6) !important; }
.tm.inv .tm-person.on { background: #0f4f45 !important; border-color: #0f4f45 !important; }
.tm.inv .tm-sec.on { background: color-mix(in srgb, var(--sec) 30%, rgba(255, 251, 242, 0.3)) !important; }
.tm.inv .tm-team button.is-person { background: rgba(240, 122, 95, 0.18) !important; }
</style>`;
const i = t.lastIndexOf('</style>'); t = t.slice(0, i) + css + t.slice(i + 8);
fs.writeFileSync(out, JSON.stringify({ text: t }));
new Function(t.slice(t.indexOf('<script>') + 8, t.lastIndexOf('</script>')));
console.log('ok');
