# Meridian Global Rules

These rules apply to all Meridian projects under the parent company **neverstill.llc**.

## The Merkava ecosystem — read this first

Meridian's flagship product is **Merkava** — a business-intelligence cockpit for operators running one business or twenty. Modular capabilities called **Drives** (content, support, CRM, HR, ATS, SEO, ads, compliance, onboarding, etc.) plug into one cockpit through a signed HMAC protocol called the Meridian Platform Contract. The AI engine underneath is **Forge**.

**Cockpit (single source of truth):** `~/PROJECTS/merkava-hq/MERKAVA.md` is the always-loaded index. Read it before any cross-cutting Merkava work — it covers brand non-negotiables, ICP + voice thesis, vendor stack ("no new services"), repo map, and the read/write protocol. Domain detail (Drives, Forge contract, marketing ops, initiatives, integrations, deploy runbooks, decisions) lives in `merkava-hq/domains/`.

When you touch any repo in the ecosystem, read that repo's `CLAUDE.md` first:

| Repo | Path | Role |
|---|---|---|
| **merkava-hq** | `/Users/everettsteele/PROJECTS/merkava-hq` | Cockpit — brand canon, ops, integrations, decisions log |
| **emmett** | `/Users/everettsteele/PROJECTS/emmett` | Merkava Core — the cockpit + all first-party Drives + Forge + Platform Contract |
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

## Project Orientation

Before starting any work, read the project's `PROMPTS/` folder to understand what has already been built. If the project does not have a `PROMPTS/` folder, create one.

## Environment Variables

`NODE_ENV=production` variables always go in **Railway Variables** — never hardcoded in source code.

## Architecture Philosophy

All projects belong to Meridian (parent company: neverstill.llc). When in doubt about architecture, keep it **simple and surgical**.
