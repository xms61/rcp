---
status: draft
last-verified: 2026-10-16
---

# Deploy

How RCP's API gets onto the owner's VPS and stays current. Why it is built this way: [an Android app with the data on the VPS](design-docs/mobile-app-and-api.md). It follows BeanQuery's runbook on the same VPS (`docs/DEPLOY.md` in github.com/xms61/BeanQuery), which this doc doesn't repeat. Commands marked *owner machine* run in the repo on the development machine; the others run on the VPS over SSH as the `deploy` user. Real domains, addresses and folders go in `.env` files and on the VPS, never in this doc.

## Status
Not deployed yet. The files and this runbook exist; the first run of it ticks milestone 4 of the [migration plan](exec-plans/active/2026-10-15-mobile-migration.md). The API keeps its recipes in SQLite at `/opt/rcp/data/rcp.db`. There is no backup yet: the timer and a restore drill come before the first deploy with recipe data ([tech-debt tracker](exec-plans/tech-debt-tracker.md)).

## What runs where
- **The VPS** is the one that runs ysto and BeanQuery, set up by ysto's runbook: Docker, keys-only SSH, a firewall allowing 22, 80 and 443 only. Nothing in that setup changes.
- **ysto's Caddy** serves HTTPS for every app. It joins the Docker network `edge` and imports the site files in `/opt/caddy-sites/`, one of which is `rcp.caddy`.
- **The API** runs from `/opt/rcp/compose.yml`: the image `ghcr.io/xms61/rcp` from GHCR, on `edge`, with no published port, a read-only filesystem and no capabilities.
- **GitHub** builds and publishes the image when the owner starts the release workflow. It holds no credentials for the VPS.
- **The phone** reaches `https://<domain>`; the app stores the address and token ([SECURITY.md](SECURITY.md)).

## One-time setup
### 1. The domain
Add an `A` record (and `AAAA`) for RCP's name, such as `rcp` under a domain the owner has, pointing at the VPS's addresses, as BeanQuery's runbook does. On Cloudflare, keep it **DNS only**. Check with `nslookup <domain>` before the first start, so Caddy can get the certificate.

### 2. Folders and settings
The `edge` network and `/opt/caddy-sites` exist already (BeanQuery's step 2).
```bash
sudo mkdir -p /opt/rcp/data && sudo chown deploy:deploy /opt/rcp && sudo chown 1000:1000 /opt/rcp/data
```
`/opt/rcp/data` holds the database, `rcp.db`. It belongs to uid 1000, the image's `node` user, because the API's filesystem is read-only apart from that folder.
*Owner machine*: copy the deploy files over:
```bash
scp deploy/compose.yml deploy@<server>:/opt/rcp/
scp deploy/.env.example deploy@<server>:/opt/rcp/.env
scp deploy/rcp.caddy deploy@<server>:/opt/caddy-sites/
```
On the VPS:
- Make the token and put it in `/opt/rcp/.env` without it passing through the terminal's history: `chmod 600 /opt/rcp/.env && sed -i "s/^RCP_API_TOKEN=.*/RCP_API_TOKEN=$(openssl rand -hex 32)/" /opt/rcp/.env`. The `chmod` comes first, so the file is never readable by others once it holds the token; `sed -i` keeps its mode. Read it once to paste into the app (`grep RCP_API_TOKEN /opt/rcp/.env`), and keep it nowhere else.
- In `/opt/caddy-sites/rcp.caddy`, replace `rcp.example.org` with the domain: `sed -i 's/rcp.example.org/<domain>/' /opt/caddy-sites/rcp.caddy`. With the placeholder left in, HTTPS to the domain fails with `tlsv1 alert internal error`.

### 3. The image
The first release makes the GHCR package `ghcr.io/xms61/rcp` ([Release and update](#release-and-update)). It is private at first: in its package settings on GitHub, set the visibility to public once, as BeanQuery's is. The image holds the bundled API, its migrations and better-sqlite3's prebuilt binaries: no data, no `.env`, no token.

### 4. First start
```bash
cd /opt/rcp
docker compose pull
docker compose up -d
docker compose ps
```
Then have Caddy load the new site: `cd /opt/ysto && docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile`. Check:
```bash
curl -fsS https://<domain>/healthz
```
It answers `ok`. If not, `docker compose logs rcp` in `/opt/rcp` shows the API's errors (a missing or short token stops it at start), and `docker compose logs caddy` in `/opt/ysto` shows certificate problems.

### 5. The app
On the phone, open RCP, enter `https://<domain>` and the token, and tap **Save and test**. It says "Connected to the API."

## Checks after setup
- `curl -s -o /dev/null -w '%{http_code}' https://<domain>/api/ping` answers `401`; with `-H "Authorization: Bearer <token>"` it answers `200`.
- `curl -sI http://<domain>/healthz` redirects to HTTPS, and `curl -sI https://<domain>/healthz` shows `strict-transport-security`.
- ysto and BeanQuery still answer on their domains.
- *Owner machine*: `nmap -Pn -p- <domain>` shows only 22, 80 and 443 open.

## Routines
### Release and update
1. Merge the PR that sets the new `version` in the root `package.json`.
2. *Owner machine*: `gh workflow run release.yml -f version=<version>`. It reruns CI, publishes `ghcr.io/xms61/rcp:<version>` and `:latest` for amd64 and arm64, tags `v<version>` and creates the GitHub release.
3. On the VPS: `cd /opt/rcp && docker compose pull && docker compose up -d`.

To roll back, set `RCP_VERSION=<older version>` in `/opt/rcp/.env` and run `docker compose up -d`. Remove the setting again to follow `latest`. When `deploy/compose.yml` or `deploy/rcp.caddy` changes in a release, copy it over again (step 2) first, and after a site change reload Caddy (step 4).

### Rotating the token
Make a new one as in step 2, then `docker compose up -d` in `/opt/rcp` (compose recreates the container when `.env` changes), and paste the new token into the app. The old token stops working at once.

### Logs and disk
- `docker compose logs -f rcp`: the API logs its start and unexpected errors only, never requests, headers or addresses. Docker keeps 3 files of 10 MB.
- `docker image prune -f` after updates removes old images.
