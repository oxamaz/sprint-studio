/* Minimal runtime for the Sprint Studio page outside Claude: loads /api/sprint once, runs the calcs, draws, and redraws on param changes */
(() => {
  const loaders = {}, calcs = {}, draws = {}, onData = [];
  const store = {};
  let params = {};
  let computing = false;

  const dash = {
    loader: (id, spec) => { loaders[id] = spec; },
    calc: (id, spec) => { calcs[id] = spec; },
    draw: (name, spec) => { if (spec === undefined) { runDraw(name); return; } draws[name] = typeof spec === 'function' ? { update: spec } : spec; },
    onData: (fn) => { onData.push(fn); },
    data: (id) => store[id] || { status: 'loading', data: [] },
    params: () => params,
    setParams: (obj) => { for (const k in obj) { if (obj[k] === null || obj[k] === undefined) delete params[k]; else params[k] = obj[k]; } recompute(); render(); },
    resetParams: () => { params = {}; recompute(); render(); },
    setLink: () => {},
    refresh: () => boot()
  };
  window.dash = dash;

  function evalCalc(id, seen) {
    const c = calcs[id];
    if (!c) return;
    seen = seen || new Set();
    if (seen.has(id)) return; seen.add(id);
    for (const dep of c.inputs || []) if (calcs[dep]) evalCalc(dep, seen);
    try {
      const args = (c.inputs || []).map((dep) => (store[dep] && store[dep].status === 'ok') ? store[dep].data : null);
      if (args.some((a) => a === null)) { store[id] = { status: 'loading', data: null }; return; }
      store[id] = { status: 'ok', data: c.fn(...args) };
    } catch (e) { console.error('calc ' + id, e); store[id] = { status: 'error', data: null, message: String(e) }; }
  }
  function recompute() { for (const id in calcs) evalCalc(id, new Set()); }

  const made = new WeakMap();
  function runDraw(name) {
    const d = draws[name]; if (!d) return;
    document.querySelectorAll(`[data-draw="${name}"]`).forEach((el) => {
      try {
        if (d.mount && !made.has(el)) made.set(el, d.mount(el) || {});
        if (d.update) d.update(el, made.get(el));
      } catch (e) { console.error('draw ' + name, e); }
    });
  }
  function render() {
    for (const fn of onData) { try { fn(); } catch (e) { console.error('onData', e); } }
    for (const name in draws) runDraw(name);
  }

  async function boot() {
    render();
    try {
      const r = await fetch('/api/sprint', { cache: 'no-store' });
      const answer = await r.json();
      if (answer.error) throw new Error(answer.error + (answer.detail ? ': ' + answer.detail : ''));
      for (const id in loaders) {
        const out = await loaders[id].fn({ answer, items: [answer], call: async () => ({}), args: {} });
        const rows = Array.isArray(out) ? out : (out.rows || out.data || []);
        store[id] = { status: 'ok', data: rows, truncated: !!out.truncated };
      }
      window.SPRINT_FETCHED_AT = answer.fetchedAt;
    } catch (e) {
      console.error(e);
      for (const id in loaders) store[id] = { status: 'error', data: [], message: String(e) };
    }
    recompute();
    render();
  }

  let w = window.innerWidth;
  window.addEventListener('resize', () => { if (Math.abs(window.innerWidth - w) > 40) { w = window.innerWidth; render(); } });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  setInterval(boot, 5 * 60 * 1000);
})();
