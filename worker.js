/* Sprint Studio worker: serves the page from ./public and fetches the sprint work items live from Jira.
   Secrets (set with `npx wrangler secret put`): JIRA_EMAIL, JIRA_TOKEN. */

const JIRA_SITE = 'https://playspare.atlassian.net';
const JQL = 'project = DG AND cf[10001] in (99d9c977-9456-4417-9d9a-027cb7beda56) AND (sprint in openSprints() OR sprint in closedSprints()) ORDER BY rank';
const FIELDS = ['summary', 'assignee', 'status', 'issuetype', 'timeoriginalestimate', 'timespent', 'customfield_10472', 'customfield_10020', 'customfield_10471', 'customfield_10468'];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/sprint') return sprint(env);
    if (url.pathname === '/api/health') return json({ ok: true, at: new Date().toISOString() });
    return env.ASSETS.fetch(request);
  }
};

async function sprint(env) {
  if (!env.JIRA_EMAIL || !env.JIRA_TOKEN) return json({ error: 'Jira secrets are not set on the worker.' }, 500);
  const auth = 'Basic ' + btoa(`${env.JIRA_EMAIL}:${env.JIRA_TOKEN}`);
  const issues = [];
  let nextPageToken = undefined;
  for (let page = 0; page < 20; page++) {
    const body = { jql: JQL, fields: FIELDS, maxResults: 100 };
    if (nextPageToken) body.nextPageToken = nextPageToken;
    const r = await fetch(`${JIRA_SITE}/rest/api/3/search/jql`, {
      method: 'POST',
      headers: { Authorization: auth, Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!r.ok) return json({ error: `Jira answered ${r.status}`, detail: (await r.text()).slice(0, 300) }, 502);
    const j = await r.json();
    issues.push(...(j.issues || []));
    if (j.isLast !== false || !j.nextPageToken) break;
    nextPageToken = j.nextPageToken;
  }
  return json({ issues, fetchedAt: new Date().toISOString() });
}

/* Which Jira account the token belongs to, and whether it can see the project: for setup checks only */
async function whoami(env) {
  if (!env.JIRA_EMAIL || !env.JIRA_TOKEN) return json({ error: 'Jira secrets are not set on the worker.' }, 500);
  const auth = 'Basic ' + btoa(`${env.JIRA_EMAIL}:${env.JIRA_TOKEN}`);
  const h = { Authorization: auth, Accept: 'application/json', 'Content-Type': 'application/json' };
  const me = await fetch(`${JIRA_SITE}/rest/api/3/myself`, { headers: h });
  const meBody = me.ok ? await me.json() : { status: me.status, text: (await me.text()).slice(0, 200) };
  const alt = await fetch('https://api.atlassian.com/ex/jira/0b710720-23d3-4538-bf38-791faa12a399/rest/api/3/myself', { headers: h });
  const altBody = alt.ok ? { displayName: (await alt.json()).displayName } : { status: alt.status, text: (await alt.text()).slice(0, 160) };
  const shape = { emailLooksValid: /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(env.JIRA_EMAIL.trim()), emailLength: env.JIRA_EMAIL.length, emailHasSpaces: /\s/.test(env.JIRA_EMAIL), tokenLength: env.JIRA_TOKEN.length, tokenStartsATATT: env.JIRA_TOKEN.trim().startsWith('ATATT'), tokenHasSpaces: /\s/.test(env.JIRA_TOKEN) };
  const probe = async (jql) => { const r = await fetch(`${JIRA_SITE}/rest/api/3/search/jql`, { method: 'POST', headers: h, body: JSON.stringify({ jql, fields: ['summary'], maxResults: 5 }) }); const b = await r.text(); let n = null; try { n = (JSON.parse(b).issues || []).length; } catch (e) {} return { status: r.status, count: n, text: n === null ? b.slice(0, 200) : undefined }; };
  return json({
    account: me.ok ? { displayName: meBody.displayName, active: meBody.active, emailDomain: String(meBody.emailAddress || '').split('@')[1] } : meBody,
    viaApiGateway: altBody,
    shape,
    anyDG: await probe('project = DG'),
    sprintQuery: await probe(JQL)
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}
