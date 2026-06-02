# Hermes Web UI

A full-stack web UI to **chat with and control your Hermes Agent**.

- **`/app`** — a Next.js app (deploys to **Vercel**) that streams chat, switches
  models, tweaks generation params, and edits the agent's config.
- **`/config-server`** — a tiny Express app that runs on your **Raspberry Pi** and
  exposes `~/.hermes/config.yaml` over an authenticated endpoint.

```
hermes-web-ui/
├── app/                 → Next.js app + API routes (Vercel)
├── components/          → React UI (chat, sidebar, toolbar, markdown)
├── lib/                 → types, token estimate, slash commands, env
├── config-server/       → Express config server (runs on the Pi)
├── .env.local.example   → env template for the Next.js app
├── .gitignore
└── README.md
```

### Features

- Streaming responses with a live blinking cursor and message fade-in
- Full conversation history (per session), markdown + syntax-highlighted code
  with copy buttons, auto-scroll that pauses when you scroll up
- Slash command hint bar (`/model`, `/clear`, `/memory`, `/skills`, `/cron`, `/help`)
- Collapsible settings sidebar: model search, system prompt, temperature, max
  tokens, advanced (top-p / frequency / presence penalty), and a **Config** tab
  that loads & saves `~/.hermes/config.yaml`
- New chat / clear / export-as-`.md`, live token estimate, and a green/red
  connection dot that polls `/api/health` every 30s (offline banner on load)
- Dark navy/charcoal theme, frosted-glass panels, purple/pink/cyan accents,
  mobile responsive

---

## Part 0 — The Hermes Agent (the backend)

The Vercel UI is only a frontend — it talks to **[Hermes Agent](https://github.com/NousResearch/hermes-agent)**
(Nous Research), which must run on your Pi and expose its **OpenAI-compatible API
server** on port **8642**. Without this, the UI just shows *Offline*.

```bash
# on the Pi (SSH in first)
pip install hermes-agent     # or the install script from the Hermes repo
hermes postinstall           # optional: node, browser, ripgrep, ffmpeg
hermes setup                 # pick an LLM provider (e.g. OpenRouter) + paste its API key
```

Enable the API server so this UI can reach it. Add to **`~/.hermes/.env`**:

```bash
API_SERVER_ENABLED=true
API_SERVER_HOST=0.0.0.0              # MUST be 0.0.0.0, not 127.0.0.1, to be reachable from Vercel
API_SERVER_PORT=8642
API_SERVER_KEY=a-long-random-secret  # use this same value as HERMES_API_KEY on Vercel
```

Start the gateway (keep it running — see the systemd pattern in Part 2, or run it
under `tmux`/`screen`):

```bash
hermes gateway
```

Sanity check on the Pi:

```bash
curl http://localhost:8642/health
curl http://localhost:8642/v1/chat/completions \
  -H "Authorization: Bearer a-long-random-secret" \
  -H "Content-Type: application/json" \
  -d '{"model":"hermes-agent","messages":[{"role":"user","content":"hi"}]}'
```

- The agent's underlying LLM is whatever you chose in `hermes setup` / `hermes model`.
  In this UI's model search, use what `/v1/models` returns (typically `hermes-agent`).
- `API_SERVER_KEY` is the agent's auth token → set the **same** value as
  `HERMES_API_KEY` in Vercel (the UI's proxy sends it as `Authorization: Bearer …`).

---

## Part 1 — Next.js app (Vercel)

### Local development

```bash
# from the repo root
cp .env.local.example .env.local      # then edit the values
npm install
npm run dev                           # http://localhost:3000
```

### Environment variables

Set these in `.env.local` (local) and in the Vercel dashboard (production). They
are **server-side only** — never exposed to the browser.

| Variable            | Example                      | Purpose                                              |
| ------------------- | ---------------------------- | ---------------------------------------------------- |
| `HERMES_API_URL`    | `http://104.229.7.78:8642`   | Hermes Agent's OpenAI-compatible API (chat/models/health) |
| `HERMES_API_KEY`    | `a-long-random-secret`       | Bearer token for the agent API; must match `API_SERVER_KEY` on the Pi |
| `HERMES_CONFIG_URL` | `http://104.229.7.78:8643`   | The config server in `/config-server` (runs on the Pi) |
| `HERMES_CONFIG_KEY` | `a-long-random-secret`       | Shared secret; must match `CONFIG_KEY` on the Pi     |

### API routes (`/app/api`)

| Route                | Method | What it does                                                            |
| -------------------- | ------ | ----------------------------------------------------------------------- |
| `/api/chat`          | POST   | Proxies to `HERMES_API_URL/v1/chat/completions`, **streams** the response back |
| `/api/models`        | GET    | Fetches `HERMES_API_URL/v1/models`                                      |
| `/api/health`        | GET    | Hits `HERMES_API_URL/health` for the connection dot                     |
| `/api/config`        | GET    | Reads config via `HERMES_CONFIG_URL/config` (`x-api-key` header)        |
| `/api/config`        | POST   | Writes config via `HERMES_CONFIG_URL/config` (same key)                 |

### Deploy to Vercel

1. Push this repo to GitHub and **Import Project** in Vercel (root directory = repo
   root; framework auto-detects as Next.js).
2. In **Project → Settings → Environment Variables**, add the four variables
   above (`HERMES_API_URL`, `HERMES_API_KEY`, `HERMES_CONFIG_URL`,
   `HERMES_CONFIG_KEY`) for the **Production** (and Preview, if you want)
   environments.
3. **Deploy.** After changing any env var later, **redeploy** so the new value
   takes effect.

> Vercel runs in the cloud, so it reaches your Pi over the **public internet** —
> which is why the next two sections (port forwarding + dynamic DNS) matter.

---

## Part 2 — Config server (Raspberry Pi)

This tiny Express app lets the **Config** tab read and write
`~/.hermes/config.yaml`. It listens on port **8643** and requires an
`x-api-key` header matching `CONFIG_KEY`.

### Install & run by hand

```bash
# on the Pi
git clone <this-repo> ~/hermes-web-ui
cd ~/hermes-web-ui/config-server
cp .env.example .env          # set CONFIG_KEY to a long random secret
npm install --omit=dev
npm start                     # listens on :8643
```

Quick test from the Pi:

```bash
curl -s localhost:8643/health
curl -s -H "x-api-key: YOUR_KEY" localhost:8643/config
```

`.env` for the config server:

```
CONFIG_KEY=changeme   # MUST match HERMES_CONFIG_KEY in the Vercel app
PORT=8643
# CONFIG_PATH=/home/pi/.hermes/config.yaml   # optional override
```

> **Note on "Saving will reload model config":** this server writes the YAML
> file. For the change to take effect, Hermes needs to pick up the new config —
> either it watches `~/.hermes/config.yaml`, or you restart/reload the agent.

### Run as a systemd service (starts on boot)

A unit file is included at `config-server/hermes-config.service`. **Edit it first**
so `User`, `WorkingDirectory`, `ExecStart`, and `EnvironmentFile` match your Pi
(check with `whoami` and `pwd`). Then:

```bash
# from ~/hermes-web-ui/config-server
sudo cp hermes-config.service /etc/systemd/system/hermes-config.service
sudo systemctl daemon-reload
sudo systemctl enable --now hermes-config

# verify
systemctl status hermes-config
journalctl -u hermes-config -f      # live logs
```

The bundled `start.sh` runs `npm install --omit=dev` on first launch (if
`node_modules` is missing) and then `node server.js`, so the service is
self-contained.

---

## Networking — exposing the Pi to Vercel

Vercel calls your Pi from the public internet, so both ports must be reachable.

### 1. Forward ports on your router

In your router admin (port forwarding / virtual servers), forward both ports to
the Pi's **LAN IP `192.168.0.186`**:

| External port | → Internal host  | Internal port | Service                  |
| ------------- | ---------------- | ------------- | ------------------------ |
| `8642`        | `192.168.0.186`  | `8642`        | Hermes Agent API         |
| `8643`        | `192.168.0.186`  | `8643`        | This config server       |

Tips:
- Give the Pi a **static LAN IP** (or a DHCP reservation) so it stays
  `192.168.0.186`.
- Protect both with strong secrets — port forwarding exposes them publicly.
  Consider HTTPS via a reverse proxy (Caddy/Nginx) or a tunnel (Cloudflare
  Tunnel / Tailscale Funnel) if you want TLS.

### 2. If your home IP changes

`HERMES_API_URL` / `HERMES_CONFIG_URL` point at `104.229.7.78`, your current
public IP. Residential IPs are usually **dynamic**, so this can change and break
the app. Two options:

**Quick fix** — update the value:
1. Find your new public IP (e.g. `curl ifconfig.me` on the Pi).
2. In Vercel → Settings → Environment Variables, update the host in
   `HERMES_API_URL` (and `HERMES_CONFIG_URL`).
3. **Redeploy.**

**Better fix — free dynamic DNS with [DuckDNS](https://www.duckdns.org):**
1. Sign in at duckdns.org and create a subdomain, e.g. `myhermes.duckdns.org`.
2. Run the DuckDNS updater on the Pi (a tiny cron/systemd-timer script from their
   "install" page) so the subdomain always points at your current IP.
3. Set the Vercel env vars to the hostname instead of a raw IP — no more manual
   updates when your IP changes:
   ```
   HERMES_API_URL=http://myhermes.duckdns.org:8642
   HERMES_CONFIG_URL=http://myhermes.duckdns.org:8643
   ```
4. Redeploy once. Done.

---

## Slash commands

Type `/` in the message box to see the hint bar.

| Command   | Handled by | Action                                          |
| --------- | ---------- | ----------------------------------------------- |
| `/model`  | UI         | Opens settings and focuses the model search     |
| `/clear`  | UI         | Clears the conversation                          |
| `/memory` | Agent      | Sent to Hermes                                   |
| `/skills` | Agent      | Sent to Hermes                                   |
| `/cron`   | Agent      | Sent to Hermes                                   |
| `/help`   | UI         | Shows the command list                          |
