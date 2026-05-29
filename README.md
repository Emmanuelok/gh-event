# Durbar — Ghana's Event Command Center

A clickable concept prototype **and** full product-strategy brief for **Durbar**, an all-in-one,
Ghana-first event platform and Organizer Studio — built to be viewed online while in development.

> **The wedge:** the one painful, complaint-generating problem no major platform serving Ghana has
> solved — *reconciling the money and the people for committee/family-planned events*: pledges vs
> actual payments, MoMo + cash + diaspora money in, and many vendor balances out, all in one
> shared, trusted ledger. Today "the total spend only becomes clear after the event."

## 🎨 The Studio (`studio.html`)

`studio.html` is a **working, interactive event design studio** (not a mock-up): a WithJoy-style
**live designer** (edit on the left, the event page renders live on the right), template & theme
switching, a functional **guest manager**, and the **contribution & committee ledger** with live
AI gap-alerts — all persisted in the browser via `localStorage`. Open `index.html` and click
**“🎨 Open Studio”**, or go straight to `studio.html`.

## ⚙️ The backend (real MVP)

Beyond the browser-only prototype, Durbar now has a **real backend** (`server/`) so events live in a
database — not just `localStorage`. It's built with **zero external dependencies** on Node's built-in
`http`, `crypto` and `node:sqlite` (Node ≥ 22.5), so it runs and deploys anywhere with no install step.

What works end-to-end today:

- **Accounts** — email + password (scrypt-hashed), HMAC-signed session cookies.
- **Cloud events** — your studio design saves to the database and syncs across devices; hit
  **🔗 Publish** to mint a real shareable link.
- **Public guest page** — `event.html?e=<slug>` loads the event straight from the server (no login,
  no app), and **RSVPs + MoMo contributions are captured server-side** and flow back into the
  owner's **Guests**, **Money** and **Dashboard**.

```bash
npm start          # serves the whole app + API on http://localhost:3000
# config via env: PORT · DURBAR_DB (sqlite path) · DURBAR_SECRET (session signing key)
```

API surface: `POST /api/auth/{signup,login,logout}` · `GET /api/auth/me` ·
`GET|POST /api/events` · `GET|PUT /api/events/:id` ·
`GET /api/public/:slug` · `POST /api/public/:slug/{rsvp,contribute}`.

### Deploy the API server

Committed with one-click configs — pick a Node host with a **persistent disk** (so the SQLite file
survives restarts), or point `DURBAR_DB` at a managed Postgres later.

| Host | How |
| --- | --- |
| **Render** | New → Blueprint → select this repo (reads `render.yaml`); it provisions a 1 GB disk at `/var/data`. |
| **Fly.io** | `fly launch --copy-config --now`, then `fly volumes create durbar_data --size 1`. |
| **Railway** | New project from repo — runs `npm start` (`Procfile`); add a volume mounted at `/data`. |
| **Docker** | `docker build -t durbar . && docker run -p 3000:3000 -v durbar_data:/data durbar` |

**Environment variables**

| Var | Purpose |
| --- | --- |
| `DURBAR_SECRET` | **Set in production** — signs session cookies. |
| `DURBAR_DB` | SQLite path; use the mounted disk, e.g. `/data/durbar.db`. |
| `PUBLIC_URL` | Your live URL — used in verification + payment-callback links. |
| `PORT` | Port to listen on (most hosts set this for you). |
| `PAYSTACK_SECRET` | Optional — enables real Paystack MoMo/card checkout + webhook. |
| `MAIL_FROM` | From-address; wire a provider in `server/mailer.js` to actually send mail. |

**Going live with payments:** set `PAYSTACK_SECRET`, then point your Paystack dashboard webhook at
`https://<your-url>/api/webhooks/paystack`. The guest page automatically shows a **Pay online** button
when keys are present; without them it stays in record-and-track mode. Email verification / password
reset are built and log links to the server console in dev — drop a provider (Resend / Postmark / SMTP)
into `server/mailer.js` to send for real.

## View it online (one-time, ~20 seconds)

The site is a static site served straight from this branch. GitHub Pages just needs to be
switched on once (the only step a bot token isn't allowed to do for you):

1. Open **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **Deploy from a branch**.
3. Set **Branch = `claude/adoring-mccarthy-RBmgV`** and **folder = `/ (root)`**, then **Save**.

After ~1 minute the site is live, and it **re-deploys automatically on every push** to the branch:

```
https://emmanuelok.github.io/gh-event/
```

> A `.nojekyll` file is included so Pages serves the files as-is (no Jekyll build).
> Prefer a CI deploy instead? Set Source = **GitHub Actions** and add a Pages workflow —
> just note the token in this environment cannot auto-enable Pages, so the one-time switch above
> is required either way.

## Deploy to Vercel (recommended for live + continuous updates)

Vercel builds and serves from **its own servers** by pulling this GitHub repo, so it deploys
automatically on every push — and the repo is pre-configured (`vercel.json`, zero build step).

One-time setup (~1 minute):

1. Go to **[vercel.com/new](https://vercel.com/new)** and sign in with GitHub.
2. **Import** the `Emmanuelok/gh-event` repository.
3. Framework preset: **Other** · Build command: *(leave empty)* · Output directory: *(leave empty / `.`)*.
4. Pick the branch **`claude/adoring-mccarthy-RBmgV`** (Settings → Git → Production Branch) and **Deploy**.

You get a live `https://<project>.vercel.app` URL, and **every push to the branch auto-redeploys**.
Netlify ([app.netlify.com/start](https://app.netlify.com/start)) and Cloudflare Pages work the same
way — import the repo, no build command, publish directory `.`.

> Why not a one-command CLI deploy from here? This development environment uses a network
> **allowlist** (a Claude Code on the web security feature) that blocks `api.vercel.com`,
> `api.netlify.com`, etc. (`x-deny-reason: host_not_allowed`). The git-integration above sidesteps
> that entirely because the deploy runs on the host's infrastructure, not in this sandbox.

## What's inside the site

| Section | Covers |
| --- | --- |
| **Overview** | Product vision & positioning, target users, the "win one category first" principle |
| **The Gap** | Market research, the critical *unsolved* pain point, competitor comparison, why incumbents can't copy it |
| **Product** | Interactive prototype — event page, WhatsApp RSVP, **live contribution ledger**, AI assistant, Organizer Studio |
| **Strategy** | Personas, journeys, MVP list, postpone list, information architecture, data model, tech stack, AI capabilities, payments/comms plan, privacy & security checklist, vendor & expansion roadmaps |
| **Roadmap** | 90-day MVP build plan, 12-month roadmap, key metrics, risks & mitigations |
| **Pitch** | Landing-page copy, suggested screens, investor pitch-deck outline |

All 20 requested deliverables are mapped across these sections.

## Run locally

**Full app + API** (accounts, cloud events, shareable RSVP links) — Node ≥ 22.5, zero dependencies:

```bash
npm start          # then open http://localhost:3000
```

**Static strategy site only** (no backend) — any static server works:

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## Tech

Plain HTML + CSS + vanilla JS — no build step, no external fonts/CDNs — so guest-facing pages
load fast on weak networks, the same principle the real product follows.

---

*Brand name ("Durbar"), figures, and screens are illustrative. Alternatives suggested in the brief:
Afahye, Boafo, Fie, Nhyira.*
