# Durbar — Ghana's Event Command Center

A clickable concept prototype **and** full product-strategy brief for **Durbar**, an all-in-one,
Ghana-first event platform and Organizer Studio — built to be viewed online while in development.

> **The wedge:** the one painful, complaint-generating problem no major platform serving Ghana has
> solved — *reconciling the money and the people for committee/family-planned events*: pledges vs
> actual payments, MoMo + cash + diaspora money in, and many vendor balances out, all in one
> shared, trusted ledger. Today "the total spend only becomes clear after the event."

## View it online

This repo deploys automatically to **GitHub Pages** via
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) on every push to the
working branch. Once the "Deploy Durbar site to GitHub Pages" Action finishes, the site is live at:

```
https://emmanuelok.github.io/gh-event/
```

If Pages isn't enabled yet: open **Settings → Pages**, set **Source = GitHub Actions**, then
re-run the workflow (Actions tab → "Deploy Durbar site to GitHub Pages" → Run workflow).

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

It's a dependency-free static site (intentionally low-data). Any static server works:

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## Tech

Plain HTML + CSS + vanilla JS — no build step, no external fonts/CDNs — so guest-facing pages
load fast on weak networks, the same principle the real product follows.

---

*Brand name ("Durbar"), figures, and screens are illustrative. Alternatives suggested in the brief:
Afahye, Boafo, Fie, Nhyira.*
