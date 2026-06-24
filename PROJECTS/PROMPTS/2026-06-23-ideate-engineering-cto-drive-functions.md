# Engineering Department — capability expansion (ideation)

**Date:** 2026-06-23
**Status:** Ideation / pre-spec. Whole-arc spec to follow (one document).
**Context read:** `merkava-hq/MERKAVA.md`, `domains/drives.md`, `emmett/CLAUDE.md`,
`emmett/src/c2/playbooks/tech.js`, `emmett/docs/pitch/byok-llm-scope-spec.md`,
`emmett/src/sam/forge.js`, `emmett/src/drives/departments.js`,
`emmett/docs/superpowers/specs/2026-06-23-drives-pricing-model-design.md`.

---

## Frame (follows the canonical department schema)

Per `departments.js` + the approved pricing-model spec, Merkava is now **5 exec-led
departments**, each an **org chart of de-named capabilities** — not a toolbox of
codenames. Rule: *named card = optional add-on; unnamed = core capability.*

**Engineering** is one of the five, headed by the **CTO (TECH exec — already exists)**.
- Today's capability list (thin): *Engineering project mgmt · GitHub sync ·
  forms/embeds · internal builders.* Named member: **Freeform** (Forms). $99/mo, opt-in,
  replaces ~$130 (Linear + Retool).
- **This work expands that capability list into a full tech org**, de-named, surfaced
  in **one tabbed Engineering cockpit** (a new department-cockpit pattern that may
  later become the template for the other four departments).

The CTO is the department **head**, per schema — not a new persona. No "Office of the
CTO" unit; the head's advisory voice lives in the **Overview** tab.

## Hard constraints (operator-set, 2026-06-23)

1. **We do not host apps.** Build outputs are PRs to the operator's *own* repo (the
   GitHub App sync Chassis already uses), generated scripts/configs, or Freeform tools.
   Merkava is never the app runtime. (We host *sites* via Webster, not arbitrary apps.)
2. **Heavy tech work requires BYOK.** Generation (code, tool-building, deep multi-file
   audits, large refactors) runs on the operator's *own* LLM key.
3. **Token limits enforced.** Reuse `checkCaps()` in `src/sam/forge.js` (daily call +
   USD cap, throws if over, records after); **generalize** it from SAM-global to
   per-tenant / per-credential / per-job-class.

## Cost-tier model (what keeps a full team affordable)

| Tier | Runs here | Cost | Cap |
|---|---|---|---|
| ⚪ **Deterministic** | HTTP probes, SSL/DNS/expiry, secret-regex, CVE lookups, header/config audits, diffs | ~$0 | none |
| 🟢 **Merkava tokens** | Judgment on ⚪ signals — memos, posture summaries, build-vs-buy, triage | bundled allowance | generalized `checkCaps` |
| 🔵 **BYOK-required** | Generation — code, tools, automations, deep audits, refactors | operator's key + bill | per-credential/job caps; **refuses if no BYOK** |

⚪/🟢 = always-on bundled allowance. 🔵 = BYOK-gated. The Engineering department is the
one where heavy generation lives, so BYOK is its natural guardrail (consistent with the
pricing spec's "token-heavy capabilities run only inside a paid department").

---

## Expanded capability list → tabbed cockpit

The Engineering cockpit gets one tab per capability cluster. Capabilities are de-named
function descriptions (the schema contract), each tagged with its tier + the existing
primitive it reuses.

### Overview  🟢
The CTO head's desk. Not a persona unit — the department digest + advisory.
- "What changed, what needs you" digest across all tabs.
- On-demand advisory: **build-vs-buy**, vendor/agency **proposal review**, jargon
  translation, technical second opinion.
- Tech **roadmap + risk register**, written for a non-technical reader.
- Reuses: honest-broker verdict logic in `tech.js`. Ships: feed memos + digest.

### Reliability  ⚪🟢
- Uptime + response-time monitoring on money surfaces: site, checkout, app, key APIs, login. ⚪
- **SSL cert / domain / DNS expiry watch.** ⚪
- Email deliverability: SPF / DKIM / DMARC present + valid. ⚪
- Deploy/health-change detection (existing daily diff). ⚪
- Incident triage memo + one-page runbook. 🟢
- Public **status page** — reuse Webster `renderStatusPage`. ⚪
- Reuses: `tech.js` daily probe; Webster status renderer. Cadence: `daily` + event alerts.

### Stack & Spend  ⚪🟢
- SaaS inventory + **total monthly tool spend** (extends crawler + connected-integration costs). ⚪
- Unused / duplicate / underused detection → consolidation plays. 🟢
- **Renewal calendar** + price-hike alerts. ⚪
- Seat/license right-sizing; access-offboarding hygiene. ⚪
- Keep / evaluate / switch honest-broker verdicts (existing). 🟢
- Reuses: `tech.js` detectors + `bridge-review`; `integrations` table. Cadence: `weekly` + renewal triggers.

### Security  ⚪🟢🔵
- Exposed-secret scan (keys leaked in public JS bundles, repos). ⚪
- Breach / leaked-credential monitoring on the operator's domains. ⚪
- Vendor **DPA / BAA gaps** → Compliance (Redline) registry; GDPR data-map. 🟢
- Posture scorecard (headers, TLS, open surfaces); SOC2-readiness checklist. ⚪🟢
- **Deep multi-file codebase security audit.** 🔵 *(BYOK)*
- Reuses: Redline. Cadence: `weekly` posture + event-driven breach alerts.

### Projects  ⚪
- Engineering project mgmt + GitHub bidirectional sync (existing Chassis engineering view). ⚪
- Reuses: Chassis + GitHub App sync (already in the bundle).

### Build  🔵 *(entirely BYOK — unlock depends on the BYOK rail)*
- Internal tools, integration glue, scripts, small automations.
- Code review + technical-debt passes on the operator's repo.
- **AI/automation strategy** sits here too: "what to automate next, ranked by ROI" (🟢
  to rank, 🔵 to build).
- Outputs: **PRs to the operator's own repo** or **Freeform** tools — never Merkava-hosted.
  Tracked in **Projects/Chassis**.
- Reuses: Chassis + GitHub App sync; Freeform; the BYOK worker (to build).

### Forms  ⚪
- Freeform (named member, existing) — forms/embeds.

### QA *(guards Build)*  ⚪🟢
- Regression watch + smoke-tests on critical flows (checkout, signup) for anything Build shipped.

---

## Sequencing (inside the one spec)

- **Spine (no BYOK):** Overview, Reliability, Stack & Spend, Security-light, Projects,
  Forms. All ⚪/🟢, immediately demoable, the data layer everything reports into.
- **Enforcement + BYOK rail:** generalize `checkCaps` per-tenant/per-job; wire BYOK per
  `byok-llm-scope-spec.md` (`byok_credentials` table, isolated per-provider worker,
  `/settings/forge` preferred/required toggle).
- **Heavy half (post-BYOK):** Build, deep Security audit, QA.

All three ship in one whole-arc spec.

## Pricing input (downstream — not decided here)
Expanding Engineering from "Linear + Retool" (~$130) to a full tech org also replaces
uptime monitoring (Better Uptime/Pingdom ~$50–100), security scanning (~$50–200), SaaS
spend management, and a fractional CTO. The competitor-replacement table needs
repopulating; the $99 opt-in price point likely rises. Feeds the pricing-model spec.

## Open (for the spec)
- Per-user capability opt-out (hide tabs you don't use) — already a department-model
  feature; applies per tab here.
- Whether QA is its own tab or folds into Build/Projects.
