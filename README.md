# Sprint Studio

Live sprint dashboard for the PS-CREATIVES team, hosted on a Cloudflare Worker. No login for viewers: the page fetches the current sprint from Jira on every load through the worker, which holds the Jira API token as a secret.

## Layout

- `public/index.html` – the page (built from the Claude dashboard by `build.js`)
- `public/shim.js` – tiny runtime: loads `/api/sprint`, runs the calculations, draws, redraws on filter changes
- `public/team_desk.jpg`, `public/team_desk_cream.jpg` – the desk photos
- `worker.js` – serves `public/` and answers `/api/sprint` with the Jira search (all pages merged)
- `wrangler.toml` – Cloudflare config

## First deploy

```bash
npx wrangler login
npx wrangler secret put JIRA_EMAIL     # the Atlassian account email the token belongs to
npx wrangler secret put JIRA_TOKEN     # from https://id.atlassian.com/manage-profile/security/api-tokens
npx wrangler deploy
```

The deploy prints the public URL (`https://sprint-studio.<account>.workers.dev`).

## Update after changing the page

```bash
node build.js <exported-page.json>
npx wrangler deploy
```

The Jira query and fields live at the top of `worker.js`. The page refreshes its data every 5 minutes while open.
