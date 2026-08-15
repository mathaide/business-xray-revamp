# Deploy Business X-Ray on DigitalOcean (Bangalore) — runbook

Target: a **2 vCPU / 2 GB / 60 GB Droplet** in **Bangalore (BLR1)** — India-resident,
running the `bx-server-starter` stack. ~20 minutes, ~$12/mo (~₹1,000). Reliable, no capacity roulette.

> What only you can do: create the DigitalOcean account + Droplet (needs a card; ~$1 verification hold),
> and paste your SSH public key. I can drive the browser with you for the sign-up screens and walk every
> VM command line by line, fixing anything that trips.

Everything runs on `MODEL_PROVIDER=none` to start → multimodal extraction runs **free, client-side**;
the server does the authoritative estimate, persistence and immutable audit.

---

## 0 · One-time: make an SSH key on your Mac (2 min)

In Terminal on your Mac:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/bx -C "bx-server"   # press Enter twice (no passphrase is fine for a pilot)
cat ~/.ssh/bx.pub                                    # copy this whole line — you'll paste it in Step 1
```

Keep `~/.ssh/bx` (the private key) secret; you only ever paste the `.pub`.

---

## 1 · Create the Droplet (DigitalOcean console)

1. Sign in at **cloud.digitalocean.com** → **Create → Droplets**.
2. **Region: Bangalore (BLR1)**. (India-resident — important for DPDP.)
3. **Image: Ubuntu 24.04 LTS**.
4. **Size: Basic → Regular → 2 GB / 2 vCPU / 60 GB SSD** (~$12/mo). *(1 GB works but is tight with Postgres; 2 GB is the sweet spot.)*
5. **Authentication: SSH Key → New SSH Key** → paste the `~/.ssh/bx.pub` line from Step 0 → name it `bx-mac`.
6. **Hostname:** `bx-server`.
7. **Create Droplet.** Copy the **public IPv4** when it's up (~45 s).

*(Optional but recommended: enable **Backups** — $2.40/mo — for automatic weekly snapshots.)*

---

## 2 · SSH in and bring the stack up

From your Mac:

```bash
ssh -i ~/.ssh/bx root@<PUBLIC_IP>       # type "yes" to trust the host on first connect
```

Get the code onto the Droplet — pick one:
- **A) via SCP (no GitHub):** from your Mac, in a second Terminal tab:
  ```bash
  scp -i ~/.ssh/bx ~/Downloads/bx-server-starter.zip root@<PUBLIC_IP>:~
  ```
- **B) via GitHub:** push `bx-server/` to a private repo, then `git clone <repo> bx-server` on the Droplet.

Then, on the Droplet, paste this one-shot bootstrap:

```bash
#!/usr/bin/env bash
set -e
apt-get update
apt-get install -y docker.io docker-compose-plugin git unzip
systemctl enable --now docker

# get code (choose the line that matches above):
unzip -o bx-server-starter.zip           # option A
# git clone <your-repo> bx-server        # option B

cd bx-server
cp -n .env.example .env
docker compose up -d --build
docker compose ps
```

*(DigitalOcean Droplets are x86_64, so every image — `python:3.12-slim`, `postgres:16-alpine` — pulls natively.)*

---

## 3 · Verify + put TLS in front

On the Droplet:
```bash
curl -s http://localhost:8080/api/health     # -> {"ok":true,...}
```

**Option A — Cloudflare Tunnel (recommended: no open ports, free TLS, you already use Cloudflare):**
```bash
# on the Droplet
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
install cloudflared /usr/local/bin/ && cloudflared tunnel login
cloudflared tunnel create bx
cloudflared tunnel route dns bx bx.litehouseiq.com
# create ~/.cloudflared/config.yml pointing bx.litehouseiq.com -> http://localhost:8080, then:
cloudflared tunnel run bx      # (install as a service once happy: cloudflared service install)
```
Now `https://bx.litehouseiq.com` serves the app — no open ports on the Droplet.

**Option B — Open ports + Cloudflare proxy.** DigitalOcean's firewall is off by default, so the app is
reachable on `http://<PUBLIC_IP>:8080` immediately. To use 80/443 with your domain: add a Cloudflare
**A record** `bx` → `<PUBLIC_IP>` (proxied, orange cloud), SSL **Full**, and either run the app on 80/443
or add a small Caddy/Nginx TLS front. Tunnel (Option A) is cleaner and I'd default to it.

---

## 4 · Before real users

- Edit `.env`: change `API_TOKEN / UNDERWRITER_TOKEN / ADMIN_TOKEN` to real secrets; keep `MODEL_PROVIDER=none` (free) to start.
- **Harden SSH:** `ufw allow OpenSSH && ufw enable` (Tunnel needs no inbound app port); disable password login (key-only is already the default here).
- **Enable auto security updates:** `apt-get install -y unattended-upgrades`.
- **Nightly Postgres backup** — add to the repo's `ops/` (a `pg_dump` cron + weekly DigitalOcean snapshot).
- This 2 GB Droplet is right for the **pilot**. For production: move to **managed DigitalOcean Postgres** (encrypted, backed-up), add OIDC auth, encrypted object storage for photos, monitoring, VAPT, and **DPDP 2023 / RBI DLG 2025 + FREE-AI** sign-off. The model **extracts and recommends only** — a deterministic policy + a human decide.

---

## Cost summary (pilot)

| Item | Monthly |
|---|---|
| Droplet 2 GB / 2 vCPU (BLR1) | ~$12 (~₹1,000) |
| Backups (optional) | ~$2.40 |
| Cloudflare Tunnel + DNS | Free (you already use it) |
| Extraction (`MODEL_PROVIDER=none`) | Free (client-side) |
| **Total** | **~₹1,000–1,200/mo** |

Hosted AI (Claude/GPT-5/Gemini) or a GPU node is opt-in later via one env var — no app changes.

---

### Want me to drive it?
Once you're signed in at cloud.digitalocean.com, say the word and I'll **drive the Droplet-creation
clicks with you** (Step 1) and walk the SSH/Docker commands line by line, fixing anything that trips.
