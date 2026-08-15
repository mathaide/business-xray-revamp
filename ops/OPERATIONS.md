# Operations — Business X-Ray (Revised Platform)

Day-to-day operation of the revised platform. Pairs with `DEPLOYMENT.md`.

## Make a change

1. Edit source under `src/` (never edit the built HTML at the repo root directly — it is regenerated).
2. Rebuild the affected page(s):

   ```bash
   cd src
   node build-app.mjs          # → app.html   (Assessment engine, 56 profiles, Demonstrations, Governance)
   node build-capture.mjs      # → business-xray-capture.html  (guided adaptive capture)
   node build-catalog.mjs      # → business-xray-industry-catalog.html  (industry models)
   node build-terms.mjs        # → business-xray-terms.html   (Terms & Consent)
   node build-databackbone.mjs # → business-xray-databackbone.html  (Data Backbone, 38 sources)
   ```

3. Copy the built files to the repo root under their served names:

   | Built file | Served as |
   |---|---|
   | `app.html` | `app.html` → `/app` |
   | `business-xray-capture.html` | `capture.html` → `/capture` |
   | `business-xray-industry-catalog.html` | `industries.html` → `/industries` |
   | `business-xray-terms.html` | `terms.html` → `/terms` |
   | `business-xray-databackbone.html` | `data-backbone.html` → `/data-backbone` |

4. Commit to `main`. Cloudflare Pages deploys automatically **once the Git connection is reconnected** (see the warning in `DEPLOYMENT.md`); otherwise use **Retry deployment** in the dashboard.

## Key source of truth

- `src/worker.js` — the assessment **engine** (interval-valued drivers, revenue = Πdrivers, EBITDA, WCR, Eq-7 next-evidence ranking, node classes). The builders slice regions out of this file.
- `src/industry-model.json` — the **56-industry** model (per-industry drivers metro/non-metro, registry economics, evidence items, shot lists).
- `src/data-backbone.json` — the **38-source** external Data Backbone registry (categories, CAM index, monitoring, consent gating, `requires`/`keyItems` linkage-key gating). Drives both the Data Backbone screen and `docs/…-harness-architecture.md` Appendix A.
- `src/aios-theme.mjs` — shared AI-OS design system + the `1504` access gate (`pslGate`).

## Change the access code

The gate is `pslGate("1504")` in `src/aios-theme.mjs`, invoked by each builder. Change the argument and rebuild all pages. (This is a client-side demo gate, not real auth.)

## Sandbox posture (do not ship as real without backing services)

- **OTP / dual-consent** is **sandbox** (codes generated client-side). Production needs a backend (`/api/otp/*`) → Twilio Verify + India DLT-registered SMS.
- **Data Backbone** pulls are **sandbox (mock)** and **redacted**; go-live connects UIDAI / GSTN / Account Aggregator / bureaus / ULI / DoLR per each source's `golive` field, consent-gated.
- **Lending decisions are human-only.** The platform extracts and recommends; a human underwriter approves. Keep this invariant in any change.

## Open operational items

1. **Reconnect Git** on the `business-xray-revamp` Pages project so pushes auto-deploy.
2. **DNS migration off GoDaddy → Cloudflare (deferred).** The Cloudflare `litehouseiq.in` zone is *Pending* with **stale** scanned records. Before switching nameservers: reconcile the zone to the live GoDaddy records (`DEPLOYMENT.md` table) — set `app → business-xray-app.pages.dev`, add `xray → business-xray-revamp.pages.dev`, fix root A + `www`, verify no email/MX is dropped — then flip nameservers. Doing it blind breaks `app.litehouseiq.in`.
3. **Stale `www`** record points to old Railway (`45i88m16.up.railway.app`) — remove or repoint during the DNS migration.
4. **Wire captured signals → assessment triangulation** (Data Backbone pulls currently light up profiles on the screen; deeper integration into the assessment panel is a fast-follow).

## Rollback

The revised deploy only publishes static assets and changes one DNS CNAME. To roll back: in Cloudflare Pages → Deployments, promote a previous deployment; or remove the `xray` CNAME at GoDaddy to detach the custom domain. No funds/records are ever mutated by the platform, so rollback is bounded to hosting + that one DNS record.
