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

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}
