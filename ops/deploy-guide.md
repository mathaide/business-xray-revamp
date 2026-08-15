# Business X-Ray — Deployment Guide (recommended path)

**Recommended stack:** Hybrid AI (start hosted, swap to sovereign later) on **one cloud VM in India (Mumbai)** + managed Postgres + encrypted object storage, Cloudflare in front. Right-sized for a **~100-user pilot**.

Why this: fastest and cheapest to launch, no GPU to operate, borrower data stays in-country (DPDP/RBI), and the model sits behind an interface so you can move to on-prem **Qwen-VL** later without changing the app.

---

## 1. Cloud resources to provision (AWS Mumbai example)

Equivalents: GCP `asia-south1`, Azure `Central India`, Oracle `ap-mumbai-1`.

| Resource | Spec (pilot) | Purpose |
|---|---|---|
| 1× VM (EC2) | `t3.xlarge` — 4 vCPU / 16 GB, Ubuntu 22.04, 100 GB gp3 | App + engine + auth (Docker) |
| Managed Postgres (RDS) | `db.t3.small`, 20 GB, encrypted, private subnet | Cases, evidence graph, audit |
| Object storage (S3) | 1 bucket, `ap-south-1`, SSE-KMS, versioned, lifecycle rule | Photos/docs (encrypted, retention) |
| Cloudflare | proxy the domain → VM | TLS, WAF, rate-limit, DDoS |
| Secrets | AWS Secrets Manager (or `.env` + KMS for pilot) | API keys, DB creds, AA tokens |

**Region discipline:** keep VM, DB and bucket all in the India region. No borrower data in non-India regions.

---

## 2. Bootstrap the VM

```bash
# SSH in, then:
sudo apt-get update && sudo apt-get install -y docker.io docker-compose-plugin git ufw
sudo usermod -aG docker $USER && newgrp docker
sudo ufw allow OpenSSH && sudo ufw allow 80,443/tcp && sudo ufw enable

git clone <your-repo> bx && cd bx
cp .env.example .env      # fill in secrets (below)
docker compose up -d --build
docker compose logs -f app
```

Point Cloudflare DNS `app.litehouseiq.com` (or a new host) at the VM's IP, proxied (orange cloud), SSL mode **Full (strict)** with an origin cert on the VM (or use Cloudflare Tunnel to avoid opening ports).

---

## 3. Repo scaffold

```
bx/
├─ docker-compose.yml
├─ .env.example
├─ frontend/                 # the current index.html, hardened → served as a PWA
│  ├─ index.html             # (build-static.mjs output; add manifest.json + service worker)
│  ├─ manifest.json
│  └─ sw.js                  # offline capture queue + background sync
├─ backend/                  # FastAPI — the central "decipher" module
│  ├─ main.py                # API routes, auth guard, audit
│  ├─ engine.py              # Business X-Ray engine (port of worker.js: intervals, IRI, WCR, concordance)
│  ├─ models/
│  │  ├─ provider.py         # ModelProvider interface  ← the swap point
│  │  ├─ hosted.py           # Claude / GPT-5 / Gemini vision impl
│  │  └─ local_ollama.py     # Qwen-VL via Ollama impl (drop-in later)
│  ├─ extraction.py          # g(·): calls provider, returns fields + confidence
│  ├─ triangulation.py       # AA / GST / utility / Perfios adapters (stubs first)
│  ├─ decision.py            # deterministic rules + scorecard → recommendation + reason codes
│  ├─ audit.py               # append-only audit log (data source, model version, override)
│  ├─ db.py / schema.sql     # Postgres: cases, evidence, decisions, audit
│  └─ auth.py                # OIDC verify (Keycloak/Cognito), RBAC
└─ ops/
   └─ backup.sh, monitoring/ # pg_dump to S3; Grafana/Sentry
```

**Engine reuse:** the entire scoring engine already exists in `worker.js` — port it 1:1 to `engine.py` (pure functions: `revenueInterval`, `financials`, `rankEvidence`, `energyProxy`, `concordance`, `computeEstimate`). No new logic needed.

---

## 4. The model-swap interface (why hybrid works)

```python
# backend/models/provider.py
class ModelProvider:
    async def extract(self, image_bytes: bytes, facet: str) -> dict:
        """Return {field, value, confidence, source} for a captured photo."""
        raise NotImplementedError

# Pick at startup from env: MODEL_PROVIDER=hosted | ollama
```

- **hosted.py** → call Claude/GPT-5/Gemini vision (via Bedrock `ap-south-1` for Claude to keep it in-region, or the vendor API on a no-train enterprise tier).
- **local_ollama.py** → POST to `http://ollama:11434/v1` running **Qwen2.5-VL**. Swapping is one env var + a GPU node — the app code doesn't change.

Golden rule enforced in `decision.py`: **AI extracts and recommends; a deterministic policy + human approve.** Never let the model return an approve/reject.

---

## 5. `.env` (fill these)

```
DOMAIN=app.litehouseiq.com
MODEL_PROVIDER=hosted            # later: ollama
ANTHROPIC_API_KEY=...            # or Bedrock role / OPENAI_API_KEY / GEMINI_API_KEY
DATABASE_URL=postgresql://user:pass@<rds-endpoint>:5432/bx
S3_BUCKET=bx-docs-mumbai
OIDC_ISSUER=...                  # Keycloak realm / Cognito pool
OIDC_AUDIENCE=...
JWT_SIGNING_KEY=...
RETENTION_DAYS=...               # per your DPDP policy
```

---

## 6. Go-live checklist (100 users)

- [ ] TLS everywhere (Cloudflare Full-strict / Tunnel); no plaintext ports open.
- [ ] Postgres in private subnet; encryption at rest; automated `pg_dump` → S3 nightly.
- [ ] S3 SSE-KMS, bucket private, lifecycle deletion per retention policy.
- [ ] RBAC roles: **field officer · underwriter · admin**; MFA for staff.
- [ ] Consent capture + logging (DPDP purpose limitation); deletion-on-revocation.
- [ ] Audit log immutable & complete: data sources, model version, reason codes, overrides.
- [ ] Human review required for every sanction; AI never auto-decides (RBI FREE-AI).
- [ ] Monitoring (Sentry/Grafana) + alerting; error budget; incident runbook.
- [ ] Security review / VAPT before production; DPDP + RBI DLG sign-off.

---

## 7. Indicative cost (pilot, hosted-AI path)

- VM `t3.xlarge` + RDS `db.t3.small` + S3 + Cloudflare ≈ **modest fixed monthly infra** (low tens of thousands ₹/month range, provider-dependent).
- AI = **per-token** on documents processed (variable). Self-hosted path trades this for a GPU node's fixed cost + ~zero marginal.

Validate against your real case volumes before committing.

---

*Indicative reference for a ~100-user pilot, Aug 2026. Business X-Ray outputs remain human-supervised first-pass assessments — not a validated credit-scoring model, and never an autonomous credit decision.*
