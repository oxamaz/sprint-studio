const fs=require('fs'); const [src,out]=process.argv.slice(2);
let t=JSON.parse(fs.readFileSync(src,'utf8')).text;
const R=(a,b)=>{if(!t.includes(a))throw new Error('missing: '+a.slice(0,80)); t=t.split(a).join(b);};
/* kicker: never reach the day ruler (starts at 60.2%) */
R('.tm-kicker { max-width: 42%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }',
  '.tm-kicker { max-width: 34%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-size: 0.78cqw; letter-spacing: 0.16em; top: 22.3%; }');
R('<i></i>Sprint Studio · PS-CREATIVES · live <span', '<i></i>Sprint Studio · live <span');
/* chart: legend on top, taller canvas so nothing collides */
R('.bp-timeline svg { height: 230px; }', '.bp-timeline svg { height: 250px; }');
R("H = 230, base = 168, top = 40;", "H = 250, base = 178, top = 60;");
R("mk('rect', { class: 'hit', x: x - slot / 2 + 10, y: 8, width: slot - 20, height: H - 16,", "mk('rect', { class: 'hit', x: x - slot / 2 + 10, y: 34, width: slot - 20, height: base + 58 - 34,");
R("const lg = mk('g', { transform: `translate(${L} ${H - 6})` });", "const lg = mk('g', { transform: `translate(${L} ${18})` });");
fs.writeFileSync(out, JSON.stringify({text:t}));
new Function(t.slice(t.indexOf('<script>')+8, t.lastIndexOf('</script>')));
console.log('ok');
