# Business X-Ray — Revised Platform (xray.litehouseiq.in)

Static, git-deployed module for **Cloudflare Pages**, served at **xray.litehouseiq.in**.
This is a **separate module** from the original platform at app.litehouseiq.in — deploy
it from its own repo/Pages project; do not overwrite the existing site.

## Pages served (clean URLs)
- `/` → redirects to `/capture` (`_redirects` + `index.html` fallback)
- `/capture` — guided adaptive capture (quality gate, per-photo AI-read, live coach,
  customer ASK, Mitra parallel notes, **neighbourhood-quality grading of outside shots**)
- `/app` — Assessment engine (56 profiles) + Demonstrations gallery + Governance
- `/industries` — 56-profile industry model catalogue
- `/data-backbone` — 38 sandbox/redacted external sources, **gated by captured items**
- `/terms` — Terms & Consent (DPDP 2023 · RBI Digital Lending · Account Aggregator)

Access code (demo gate): **1504**.

## Deploy (Cloudflare Pages, git-connected)
1. Push this folder to a new GitHub repo (separate from the old one).
2. Cloudflare → Pages → Create project → connect that repo → framework preset: **None**,
   build command: *(none)*, output dir: `/` (root). Deploy.
3. Pages → the new project → Custom domains → add `xray.litehouseiq.in`.
4. GoDaddy DNS (authoritative for litehouseiq.in) → add **CNAME** `xray` →
   `<project>.pages.dev` (proxied/again per Cloudflare's instructions). Wait for SSL.

All external data pulls are **sandbox (mock)** and **redacted**; OTP is sandbox.
Loan approval & disbursement remain human-only.
