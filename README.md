# Business X-Ray — Revised Platform

Phone Se Loan AI Operating System · thin-file MSME credit-assessment platform.
Live at **https://xray.litehouseiq.in** (Cloudflare Pages). Access code: **`1504`**.

This repository is a **complete, self-contained module** — source, data, build system, deployment/operations docs, and the pre-built static site — separate from the original platform at `app.litehouseiq.in` (`mathaide/business-xray`).

## What it is

An auditable, human-supervised **first-pass** assessment method that turns premises photographs (and consented digital-public-infrastructure signals) into traceable financial scenarios for thin-file micro/small enterprises. It **extracts and recommends; it does not sanction** — a human underwriter makes the credit decision.

## Repository layout

```
/                      ← deployed static site (served by Cloudflare Pages, output dir "/")
  index.html           ← redirects to /capture
  _redirects           ← "/ /capture 301"
  capture.html         ← /capture       guided adaptive capture (quality gate, per-photo AI-read,
                                         live "next-best-photo" coach, customer ASK, Mitra notes,
                                         neighbourhood-quality grading of outside shots)
  app.html             ← /app           assessment engine (56 profiles) + Demonstrations + Governance
  industries.html      ← /industries    56-profile industry-model catalogue
  data-backbone.html   ← /data-backbone  38 sandbox/redacted external sources, gated by captured items
  terms.html           ← /terms         Terms & Consent (DPDP 2023 · RBI Digital Lending · AA)

/src                   ← SOURCE (the site is generated from here)
  worker.js            ← assessment engine (single source of truth)
  industry-model.json  ← 56-industry model
  data-backbone.json   ← 38-source Data Backbone registry
  aios-theme.mjs       ← AI-OS design system + 1504 access gate
  build-*.mjs          ← builders (app / capture / catalog / terms / databackbone / static)
  tighten-priors.mjs, gen-*-report.mjs, validate-engine.mjs, assemble.mjs, test.mjs
  INDUSTRY_MODEL_BRIEF.md

/docs                  ← design & analysis
  xray-underwriting-agent-harness-architecture.md   ← harness-engineering architecture (+ Data Backbone appendix)
  business-xray-harness-spec.md                      ← adaptive capture-harness design spec
  business-xray-assessment-peer-review.html          ← 56-profile assessment peer review
  business-xray-photo-variance-due-diligence.html    ← per-customer photo-variance due diligence

/ops                   ← deployment & operations
  DEPLOYMENT.md        ← how it's built and served (URLs, Pages config, DNS, runbook)
  OPERATIONS.md        ← how to change it, sandbox posture, open items, rollback
  deployment-architecture.html, deploy-*.md, wrangler.toml
```

## Build

No build step is required to deploy (the HTML is committed). To regenerate after editing `src/`:

```bash
cd src
node build-app.mjs && node build-capture.mjs && node build-catalog.mjs \
  && node build-terms.mjs && node build-databackbone.mjs
# then copy the built HTML to the repo root under its served name (see ops/OPERATIONS.md)
```

## Deploy

Cloudflare Pages, git-connected to `main`, framework **None**, output dir **`/`**.
Custom domain `xray.litehouseiq.in` via a GoDaddy `CNAME xray → business-xray-revamp.pages.dev`.
Full runbook and DNS details in **`ops/DEPLOYMENT.md`**.

## Status & posture

- OTP/dual-consent and all Data-Backbone pulls are **sandbox (mock), redacted** until backing services are connected.
- Lending decisions are **human-only**.
- Open items (reconnect Git auto-deploy, deferred DNS-off-GoDaddy migration, stale `www` record) are tracked in `ops/OPERATIONS.md`.
