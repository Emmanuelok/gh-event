# Durbar — Ghana's Event Command Center

A clickable concept prototype **and** full product-strategy brief for **Durbar**, an all-in-one,
Ghana-first event platform and Organizer Studio — built to be viewed online while in development.

> **The wedge:** the one painful, complaint-generating problem no major platform serving Ghana has
> solved — *reconciling the money and the people for committee/family-planned events*: pledges vs
> actual payments, MoMo + cash + diaspora money in, and many vendor balances out, all in one
> shared, trusted ledger. Today "the total spend only becomes clear after the event."

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
