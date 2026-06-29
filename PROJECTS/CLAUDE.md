# Meridian Global Rules

These rules apply to all **Meridian** projects. Meridian is the venture studio (site: **MeridianBaseHQ.com**) that runs Merkava and the other ventures here — it is the top-level company; do not name a parent above it. **neverstill.llc is unrelated**: it is Everett Steele's personal brand/site only, never Meridian's parent, URL, or holding company. Never reference neverstill.llc in relation to Meridian, Merkava, or any holdings.

## The Merkava ecosystem — read this first

Meridian's flagship product is **Merkava** — a business-intelligence cockpit that hires AI executives against the work an early-stage operator would otherwise have to do alone. Modular capabilities called **Drives** (content, support, CRM, HR, ATS, SEO, ads, compliance, onboarding, etc.) plug into one cockpit through a signed HMAC protocol called the Meridian Platform Contract. The AI engine underneath is **Forge**. ICP canon: `merkava-hq/MERKAVA.md §2` — operators who haven't taken the raise, need C-suite muscle without C-suite payroll. Do **not** carry forward "running one business or twenty" / "portfolio operator" / "holdco" / "5–40 P&Ls" framing; that's stale wedge language from a prior pivot.

**Cockpit (single source of truth):** `~/PROJECTS/merkava-hq/MERKAVA.md` is the always-loaded index. Read it before any cross-cutting Merkava work — it covers brand non-negotiables, ICP + voice thesis, vendor stack ("no new services"), repo map, and the read/write protocol. Domain detail (Drives, Forge contract, marketing ops, initiatives, integrations, deploy runbooks, decisions) lives in `merkava-hq/domains/`.

When you touch any repo in the ecosystem, read that repo's `CLAUDE.md` first:

| Repo | Path | Role |
|---|---|---|
| **merkava-hq** | `/Users/everettsteele/PROJECTS/merkava-hq` | Cockpit — brand canon, ops, integrations, decisions log |
| **merkava** | `/Users/everettsteele/PROJECTS/emmett` | Merkava Core — the cockpit + all first-party Drives + Forge + Platform Contract. Local dir name `emmett` is a legacy artifact; the repo + venture id + brand are all Merkava. |
| **withmerkava** | `/Users/everettsteele/PROJECTS/withmerkava` | Public marketing site at withmerkava.com (Cloudflare Pages) |
| **quillsly** | `/Users/everettsteele/PROJECTS/quillsly` | Content Drive — standalone product at quillsly.com + mounts inside Merkava |
| **relay** | `/Users/everettsteele/PROJECTS/relay` | Support Drive — embedded chat widget, separate Railway deploy |
| **centerlineos** | `/Users/everettsteele/PROJECTS/centerlineos` | Operating-cadence Drive — external, runs as its own SaaS |

**Each repo has its own `CLAUDE.md`** with repo-specific conventions (Drive roster, event catalog, UI shell rules, deploy flow). Those files are the single source of truth for repo-specific detail. The cockpit (`merkava-hq/`) owns cross-cutting context — update both when you change the system.

## Merkava brand non-negotiables (apply across every repo)

- **Never credit Claude / Anthropic / OpenAI / GPT by name in user-facing copy.** Infrastructure is invisible. Merkava is the actor. The AI engine is Forge.
- **Use "Drives" not "Hubs" or "Apps."** HubSpot owns "Hubs"; we're not them.
- **Vehicle metaphor runs everywhere.** Merkava = chariot (Hebrew). Garage = marketplace. Spark = ignition. Nitrous = boost. Ignition = first key-turn. Redline = the limit. Gauge = instrumentation.
- **Show the product, don't narrate.** No constructed hero arcs unless explicitly asked.


## Git Workflow

After completing any task, always run the following — never wait to be asked:

```bash
git add .
git commit -m "<descriptive message>"
git push
```

Never commit:
- `.env` files
- Database files (`.db`)
- `node_modules`

## Definition of done — Relay KB sync (Merkava ecosystem)

**When you ship major work that changes a customer-facing product claim, syncing the Relay support-bot KB is part of closing out — do it automatically, without being asked.** "Major work / product claim" = a new or changed Drive, a pricing/packaging change, a brand-lexicon or Drive-roster change, a Platform Contract change, **or a new customer-facing program or page** (e.g. a new landing page like Founding Operators). Typo/CSS/layout-only edits do **not** qualify.

The KB is URL-sourced from `emmett/docs/customer-docs/**` (served at `app.withmerkava.com/docs/api/all.json`). Close-out steps: (1) edit the relevant customer-docs so the new claim is represented, (2) deploy emmett so the URL is live, (3) re-ingest from the relay repo: `MERIDIAN_AGENT_SECRET="…" node bin/sync-kb.js merkava` (secret lives on the Relay Railway service — ask inline if you don't have it). Full protocol: `emmett/CLAUDE.md` + `relay/CLAUDE.md` ("Relay as Merkava's support surface"). If a deploy is gated (e.g. the overnight promote cadence), queue the KB sync to ride the same train and **say so in the close-out summary** — never silently skip it.

## Project Orientation

Before starting any work, read the project's `PROMPTS/` folder to understand what has already been built. If the project does not have a `PROMPTS/` folder, create one.

## Environment Variables

`NODE_ENV=production` variables always go in **Railway Variables** — never hardcoded in source code.

## Architecture Philosophy

All projects belong to Meridian (the venture studio; MeridianBaseHQ.com). When in doubt about architecture, keep it **simple and surgical**.
