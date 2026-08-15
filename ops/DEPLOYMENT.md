# Deployment — Business X-Ray (Revised Platform)

Authoritative record of how `xray.litehouseiq.in` is built and served, as deployed.

## Live URLs

| Platform | Domain | Cloudflare Pages project | Repo |
|---|---|---|---|
| **Revised (this repo)** | `xray.litehouseiq.in` | `business-xray-revamp` → `business-xray-revamp.pages.dev` | `mathaide/business-xray-revamp` |
| Original (unchanged) | `app.litehouseiq.in` | `business-xray-app` → `business-xray-app.pages.dev` | `mathaide/business-xray` |

The two are **separate modules** — separate repos, separate Pages projects. Deploying one never touches the other.

Access gate: **`1504`** (client-side demonstration gate on every page; not authenticated login).

## Hosting — Cloudflare Pages (git-connected)

- **Account:** Malcolm.athaide@gmail.com (account id `da3e1ddd56f8478a9a18a9de5220d356`).
- **Project:** `business-xray-revamp`, connected to `mathaide/business-xray-revamp`.
- **Production branch:** `main`.
- **Framework preset:** None. **Build command:** *(none)* — the repo ships pre-built HTML. **Build output directory:** `/` (repo root).
- Clean URLs are served automatically (`/capture` ← `capture.html`, etc.); `_redirects` sends `/` → `/capture`, with `index.html` as a belt-and-braces fallback.

> ⚠️ **Known state:** Cloudflare flagged this project as *"disconnected from your Git account"* after creation. The first deploy succeeded, but **future pushes to `main` may not auto-deploy** until the GitHub connection is re-authorized (Pages → project → Settings → Builds & deployments → reconnect Git). Until then, redeploy via the dashboard **Retry deployment** or by re-uploading built HTML.

## DNS — GoDaddy (authoritative)

`litehouseiq.in` nameservers are **GoDaddy** (`ns63.domaincontrol.com`, `ns64.domaincontrol.com`). The record that makes the revised site resolve:

```
CNAME   xray   →   business-xray-revamp.pages.dev
```

Cloudflare Pages custom domain `xray.litehouseiq.in` validates that CNAME and provisions SSL automatically (minutes; up to the record TTL of 1 hour).

Current relevant GoDaddy records (captured at go-live):

| Type | Name | Value | Note |
|---|---|---|---|
| A | @ | 15.197.225.128 | root |
| A | @ | 3.33.251.168 | root |
| CNAME | app | business-xray-app.pages.dev | old platform (live) |
| CNAME | xray | business-xray-revamp.pages.dev | **this platform** |
| CNAME | www | 45i88m16.up.railway.app | ⚠️ stale (old Railway) — clean up |
| CNAME | _domainconnect | _domainconnect.gd.domaincontrol.com | GoDaddy |
| TXT | _dmarc | v=DMARC1; p=quarantine; … | email policy |

> A `litehouseiq.in` zone also exists in Cloudflare in **Pending setup** (nameservers not switched). Its scanned records are **stale** (e.g. `app` → old Railway). Do **not** switch nameservers to Cloudflare until that zone is reconciled against the GoDaddy records above, or `app.litehouseiq.in` will break. DNS migration off GoDaddy is deliberately deferred — see `OPERATIONS.md`.

## Build → deploy flow

```
edit src/*  ─▶  node src/build-*.mjs  ─▶  built HTML at repo root  ─▶  commit to main  ─▶  Cloudflare Pages deploys
```

Pages served: `/capture`, `/app`, `/industries`, `/data-backbone`, `/terms` (+ `/` → `/capture`). See `README.md` for what each page is.

## First-time / re-create runbook

1. GitHub: repo `mathaide/business-xray-revamp`, push built HTML + `_redirects` + `index.html`.
2. Cloudflare → Workers & Pages → **Pages** → Create → Connect to Git → select the repo → preset **None**, no build command, output dir `/` → Save and Deploy.
3. Pages → project → **Custom domains** → add `xray.litehouseiq.in` → choose **My DNS provider** → it prints the CNAME target.
4. GoDaddy → `litehouseiq.in` → DNS → add `CNAME xray → business-xray-revamp.pages.dev`.
5. Back in Pages → **Check DNS records**; wait for activation + SSL.
