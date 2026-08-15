# Deploy Business X-Ray on Oracle Cloud Always Free (Mumbai) — runbook

Target: a **VM.Standard.A1.Flex — 4 OCPU / 24 GB / ~200 GB**, forever free, in **Mumbai (or Hyderabad)**,
running the `bx-server-starter` stack. ~20 minutes. Near-zero cost (with `MODEL_PROVIDER=none`,
extraction runs free client-side).

> What only you can do: create the OCI account (needs a card for identity verification — the Always-Free
> resources are **not charged**) and approve the instance. I can drive the web console with you once you're
> logged in, and help debug the VM steps.

---

## 1 · Create the Always-Free VM (OCI console)

1. Sign in → set **Region: Mumbai** (top-right). 
2. **Menu → Compute → Instances → Create instance.**
3. Name: `bx-server`.
4. **Image**: Edit → **Canonical Ubuntu 22.04**.
5. **Shape**: Edit → **Ampere** → **VM.Standard.A1.Flex** → **4 OCPUs, 24 GB** (shows "Always Free eligible").
6. **Add SSH keys**: on your Mac run `ssh-keygen -t ed25519 -f ~/.ssh/oci` → upload `~/.ssh/oci.pub` (paste public key).
7. **Create.** Copy the **Public IP** when it's running.

*If you get an "out of A1 capacity" error:* retry a few times, switch to **Hyderabad**, or drop to **1 OCPU / 6 GB** (still fine for the pilot).

---

## 2 · Reach it (pick ONE)

**Option A — Cloudflare Tunnel (recommended: no open ports, free TLS, you already use Cloudflare).**
Do this in Step 4 after the app is up.

**Option B — Open ports.** OCI has two firewalls:
- Cloud: VCN → **Security List** → add Ingress `0.0.0.0/0` TCP **80** and **443**.
- VM: Oracle's Ubuntu image also has iptables — run on the VM:
  ```bash
  sudo iptables -I INPUT 6 -p tcp --dport 443 -j ACCEPT
  sudo iptables -I INPUT 6 -p tcp --dport 80  -j ACCEPT
  sudo netfilter-persistent save
  ```

---

## 3 · SSH in and bring it up

```bash
ssh -i ~/.ssh/oci ubuntu@<PUBLIC_IP>
```

Get the code onto the VM — pick one:
- **A) via GitHub:** push `bx-server/` to a (private) repo, then `git clone <repo> bx-server`.
- **B) via SCP (no GitHub):** from your Mac:
  ```bash
  scp -i ~/.ssh/oci ~/Downloads/bx-server-starter.zip ubuntu@<PUBLIC_IP>:~
  ```

Then on the VM, paste this one-shot bootstrap:

```bash
#!/usr/bin/env bash
set -e
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-plugin git unzip
sudo systemctl enable --now docker
sudo usermod -aG docker $USER

# get code (choose the line that matches step above):
# git clone <your-repo> bx-server        # option A
unzip -o bx-server-starter.zip           # option B

cd bx-server
cp -n .env.example .env
sudo docker compose up -d --build
sudo docker compose ps
```

(The `python:3.12-slim` and `postgres:16-alpine` images are multi-arch, so they run natively on the A1 Arm CPU.)

---

## 4 · Verify + put TLS in front

On the VM:
```bash
curl -s http://localhost:8080/api/health     # -> {"ok":true,...}
```

**Cloudflare Tunnel (Option A):**
```bash
# on the VM
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64 -o cloudflared
sudo install cloudflared /usr/local/bin/ && cloudflared tunnel login
cloudflared tunnel create bx
cloudflared tunnel route dns bx bx.litehouseiq.com
# create ~/.cloudflared/config.yml pointing bx.litehouseiq.com -> http://localhost:8080, then:
cloudflared tunnel run bx      # (install as a service once happy)
```
Now `https://bx.litehouseiq.com` serves the app — no open ports.

If you used **Option B (open ports)** instead, just add a Cloudflare **A record** → `<PUBLIC_IP>`, proxied, SSL **Full (strict)**.

---

## 5 · Before real users

- Edit `.env`: change `API_TOKEN / UNDERWRITER_TOKEN / ADMIN_TOKEN`; keep `MODEL_PROVIDER=none` to start (free).
- Lock SSH to your IP; enable automatic security updates.
- Nightly `pg_dump` backup (the repo's `ops/` is the place to add it).
- This free VM is great for the **pilot**; move to a small **paid India VM + managed Postgres** for production, and complete DPDP/RBI sign-off. AI extracts & recommends; a human + deterministic policy decide.

---

### Want me to drive it?
Once you've created the OCI account and are logged into the console in your browser, say the word and I'll
**drive the instance-creation clicks with you** (Step 1) and walk the VM commands line by line, fixing anything that trips.
