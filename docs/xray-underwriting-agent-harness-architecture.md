# Harness-Engineering Layer — X-Ray MSME Underwriting Agent

**Design specification for review — v0.1**
Phone Se Loan AI Operating System · Business X-Ray Platform · Litehouse

---

## Instantiation (assumptions — correct any and I'll retarget)

The task template left the agent parameters as placeholders. I've instantiated them for the one agent this platform is built around; every section below is specific to it. If you meant a different agent (portfolio-risk monitor, growth advisor), the same skeleton applies — say which and I'll re-cut it.

| Parameter | Assumed value |
|---|---|
| **Agent role** | **X-Ray Underwriting Agent** — thin-file MSME first-pass underwriting: drive on-site capture, produce an auditable financial scenario, reconcile with external signals, and recommend a decision band to a human underwriter. |
| **Primary tools / APIs** | Business X-Ray engine (capture + assessment); GSTN filing service; Udyam registry; Account Aggregator (bank inflows); DISCOM/utility lookup; credit bureau (CIBIL/CRIF); internal LOS/LMS; CRM; BI/dashboards; OTP/SMS (Twilio Verify + DLT); document/object store. |
| **Business domain** | MSME lending — thin-file micro/small enterprises, ticket ≈ ₹0.5–50 L. |
| **Risk level** | **HIGH** — regulated credit decision affecting access to finance. |
| **Compliance** | RBI Digital Lending Directions 2025; RBI FREE-AI framework; DPDP Act 2023 + Rules 2025; Account Aggregator Master Direction; internal credit policy; fair-lending. |
| **X-Ray integration** | **Both** — consumes X-Ray scores/diagnostics *and* contributes new signals back (under validation + approval). |
| **Governing objective (platform intent)** | **Minimise credit risk while keeping TAT < 48 h, with full regulator-grade auditability and human-only sanction.** Every design choice below is justified against this. |

**One framing rule dominates all others:** the agent **acquires, estimates, reconciles, and recommends; it never sanctions, rejects, disburses, or moves funds.** A human underwriter makes the credit decision on independently verified capacity. The harness's job is to make that human's decision faster, cheaper, better-evidenced, and fully auditable — not to replace it.

---

## 1. Harness architecture

### 1.1 Components

The harness wraps the model in eight components. Each has one job, a typed input/output contract, and its own failure behaviour, so a fault in one is contained and observable rather than corrupting the case.

**Planner.** Given the case state and the current X-Ray diagnostics, decides the next *objective* — not the next token. For underwriting the plan is short and mostly fixed (consent → capture → assess → triangulate → recommend), but the Planner makes it *adaptive*: it chooses whether to acquire more evidence, ask the customer, pull an external signal, or stop, by asking "what most reduces decision-relevant uncertainty per unit cost/time, given TAT budget remaining?" This is the same Eq-7 acquisition logic already running in the capture loop, lifted to the case level.

**Executor.** Carries out one planned step by calling a tool through the Tool Router, or by invoking the capture sub-agent. It is deliberately thin: it does not decide *what* to do (Planner) or judge *whether the result is acceptable* (Verifier). The on-site **capture loop already built into `/capture` is the Executor's reference implementation for the acquisition step** — quality-gate a photo, AI-read it, fold it into the evidence graph, recompute interval width, recommend the next shot.

**Verifier.** Independently checks every Executor output against schema, business rules, and guardrails *before* it is written to case memory. It is the harness's immune system: a read that fails GSTIN checksum, an interval that widens when it should narrow, a WCR that violates the accounting identity, a value outside sane driver bounds, or a driver "confirmed" without evidence — all are rejected or flagged here, not downstream. The Verifier is what lets a high-risk agent run mostly unattended between human gates.

**Memory.** The four-tier store (§1.3) holding the case's evidence graph, confirmed facts, append-only audit log, and cross-case priors. Memory is the single source of truth; components communicate *through* it, not by passing hidden state.

**Tool Router.** The only path to the outside world. It holds the tool allowlist, injects per-tool scoped credentials the agent never sees, enforces parameter-level scoping (§2.3), rate-limits and retries with backoff, and records every call I/O to the audit log. No component calls an API directly.

**Approval Gate.** Blocks any step in the "human-required" class until a named human approves in their own interface (underwriter console / maker-checker). The agent prepares the decision package and *pauses*; it never self-approves. Which steps require a gate is set by risk tier and modulated live by X-Ray flags (§2.4).

**Logger / Tracer.** Emits a structured event for every prompt, context window, tool call, decision, X-Ray read, human action, and outcome, all stitched to one `trace_id` per case and `span_id` per step. Feeds observability (§4) and the audit record.

**X-Ray Integrator.** The typed adapter between the agent and the Business X-Ray engine — pulls diagnostics (scores, interval widths, cash-share, IRI, concordance, compliance flags) into the case, and packages any agent-proposed new signal for the diagnostic-governance workflow (§5). Keeps the agent decoupled from X-Ray's internals: X-Ray can version independently behind this contract.

### 1.2 Execution context & isolation boundaries

- **One ephemeral sandbox per case.** Each underwriting case runs in an isolated container (or serverless invocation) that is created for the case and destroyed at close. No case shares mutable state with another; a compromised or runaway case cannot reach a second borrower's data.
- **Front-end vs. tool plane.** The capture/assessment UI is static (Cloudflare Pages today); all privileged actions — external pulls, bureau, LOS writes, OTP — run server-side behind the Tool Router. The browser never holds a tool credential. (This is why the current OTP is sandbox-only until that server plane exists.)
- **Network egress allowlist.** The sandbox can reach only the allow-listed tool endpoints; no open internet. Egress is logged.
- **Credential isolation.** Per-tool, least-privilege, short-lived credentials issued by the Router; the model sees tool *results*, never tokens. Bureau/AA creds are scoped read-only and single-purpose.
- **PII minimisation into the model.** Faces/number-plates cropped at capture; the model receives derived fields and redacted context, not raw identity documents, wherever the task allows. Consent scope is enforced at the Router (a tool call outside the consented purpose is refused).
- **Tenant isolation.** Lender/branch/tenant boundary enforced at storage and Router; cross-tenant reads are structurally impossible, not policy-only.

### 1.3 State & context flow across turns and sessions

The unit of state is the **Case object**, keyed by `case_id`, carrying: profile & band, the **evidence graph** (every observation/claim/benchmark/derived/external node with provenance), current driver intervals and per-driver width `W`, X-Ray diagnostics snapshot, plan step, pending gates, and the audit-log reference.

Memory tiers (lifetime ascending):

1. **Working state** — the live evidence graph and running `W`, in the sandbox for the active session. (Reference implementation exists: the capture page's `liveEstimate` recomputes recentred+narrowed intervals and `W` after every photo.)
2. **Confirmed facts** — values a human confirmed/corrected; *sticky* (a later signal corroborates but cannot silently overwrite; a mismatch raises a conflict flag).
3. **Audit log** — append-only, hash-chained, every action with actor + timestamp. Survives the sandbox; it is the regulator record and the rollback source.
4. **Cross-case priors** — aggregate, de-identified learning (e.g. realised ΔW per evidence type, benchmark drift). Closes the outer loop; **out of scope for v1**, but the audit log is shaped to feed it.

**Across turns:** each step reads the Case object, acts, and the Verifier writes results back — so context is reconstructed from Memory, never carried implicitly in a chat history that could drift. **Across sessions:** a paused case (e.g. awaiting an AA consent or a human gate) rehydrates from tiers 2–3; the capture→assessment `bx_handoff` contract is the concrete cross-session handoff and is being extended to carry per-driver `W`, read confidence, node-class tags, IRI, and the stop/escalation reason.

---

## 2. Constraints & permissions

### 2.1 Hard constraints (never, regardless of instruction)

- **No autonomous credit decision** — no sanction, rejection, limit-setting, or pricing without a human at the Approval Gate.
- **No movement of funds** — no disbursement, transfer, or ledger posting; the agent cannot touch money.
- **No writes to external systems of record** the borrower can't see (bureau, GSTN) — read-only there.
- **No data beyond consent scope** — no pull the customer didn't consent to; consent is checked at the Router per call; withdrawal halts processing.
- **No PII in URLs/query strings or logs**; no compiling personal data across borrowers; no cross-tenant access.
- **No overriding the X-Ray estimate** — the engine output is the system of record; agent (and Mitra) inputs are parallel annotations, never replacements.
- **No fabricated evidence** — an inferred value is never promoted to Observed; claims stay Claims.
- **Abstain rather than guess** on high-impact uncertainty — escalation is a valid, logged outcome.

These hold even if a document, tool result, or user message *instructs* otherwise; instructions arrive only from authenticated humans through the console, and everything a tool returns is data, not a command.

### 2.2 Soft constraints (preferences & fallbacks)

- **Cheapest-evidence-first** — prefer the highest ΔW-per-cost next step (Eq-7); don't over-collect (RBI data-minimisation + TAT).
- **Risk-adjusted depth** — low-risk/low-ticket cases stop at a wider band and lighter capture; high-ticket/flagged cases demand tighter `W`, external corroboration, and more human review.
- **Fallback chains** — OCR fails → zoom/re-capture → ask customer (Claim) → external pull → escalate. AA unavailable → utility/GST proxy → flag as unreconciled. Each fallback is logged with why.
- **Graceful degradation** — a tool outage narrows what the agent *claims*, not what it *asserts*; it never hard-fails a case silently.

### 2.3 Role, tool allowlist, parameter scoping, approval workflows

- **Role**: `underwriting.first_pass` — may capture, read, estimate, triangulate, recommend; may **not** decide/disburse.
- **Tool allowlist** (illustrative): `xray.capture`, `xray.assess`, `gstn.get_filings(read)`, `udyam.lookup(read)`, `aa.fetch_inflows(read, consented)`, `discom.lookup(read)`, `bureau.pull(read, consented, single-purpose)`, `los.create_case`, `los.attach_package`, `crm.read`, `otp.send/verify`. Everything else denied by default.
- **Parameter-level scoping** — e.g. `bureau.pull` locked to the consented borrower + purpose code; `aa.fetch_inflows` locked to consented accounts + date range; `los.attach_package` may attach a recommendation but not set `status=approved`.
- **Approval workflows** — sensitive ops route to maker-checker: any external PII pull (consent double-check), any LOS write, escalations, and any decision-band recommendation above a ticket threshold. Approver identity, time, and reason are logged.

### 2.4 How X-Ray scores modify constraints dynamically

Constraints are not static; X-Ray diagnostics tighten or relax the gates in real time:

| X-Ray signal | Constraint effect |
|---|---|
| Interval width `W` still > **±20%** | Block "ready to recommend"; require more evidence or escalate. |
| **IRI** below profile floor | Block auto-progress — "precise but thinly corroborated"; require an external domain. |
| High **cash-share** flag | Mandate an AA bank pull before any recommendation; raise human-review tier. |
| **Concordance conflict** (photo vs GST/bank) | Force `ESCALATE`; disable auto-recommend; attach conflict to package. |
| **Staged/stale/duplicate** capture flag | Halt; require re-capture; raise fraud review. |
| Low ticket **and** tight `W` **and** clean flags | *Relax* — allow lighter capture and a wider stop band to protect TAT. |

This is the mechanism that keeps TAT low on easy cases while forcing depth exactly where risk concentrates.

---

## 3. Verification & evaluation

### 3.1 Automated checks (run by the Verifier, every step)

- **Schema validation** — every tool result and evidence node conforms to its typed contract or is rejected.
- **Business-rule validators** — interval monotonicity (evidence narrows, never widens `W`); driver values within sane bounds (the clamp already in the engine); WCR = Inventory + Receivables − Payables identity holds; GSTIN checksum; Udyam format; concordance `C` computed and thresholded; cash-share = residual sanity.
- **Guardrail classifiers** — prompt-injection / instruction-in-data detection on any tool text; PII-leak check on outbound payloads; consent-scope check per call.
- **Property/unit tests in CI** — engine invariants (two captures of the same profile with different reads must diverge; a fully-evidenced profile must reach target `W`; no interval inversions) run on every model/registry change. (The 56-profile due-diligence harness already does the divergence check.)

### 3.2 Human review points (by risk × impact)

| Tier | Trigger | Human point |
|---|---|---|
| **T0 auto** | Low ticket, tight `W`, IRI ok, no flags | Underwriter reviews the package; no mid-flow gate. |
| **T1 review** | Standard case | Underwriter confirms reads + final recommendation before it enters LOS. |
| **T2 dual** | High ticket / conflict / low IRI / cash-heavy | Maker-checker: two humans; conflict must be resolved before recommend. |
| **T3 committee** | Above policy threshold / fraud flag / model-abstention | Credit committee; agent output advisory only. |

Every human point captures identity, decision, override direction, and reason code.

### 3.3 Success metrics, "done", quality gates

- **"Done" for a case** = target `W` ≤ ±20% **or** a logged escalation reason; **and** IRI ≥ profile floor; **and** no unresolved conflict; **and** consent + audit record complete; **and** a human disposition recorded.
- **Quality gates** (block progress): schema clean, business-rules pass, no unredacted PII, consent valid, `W`/IRI thresholds met.
- **Case success metrics**: TAT (target < 48 h), field-minutes & reviewer-minutes per case, recapture rate, override rate, escalation rate, % reaching target `W`.

### 3.4 Evaluation over time

- **Golden set + backtest** — a locked, blinded set of cases with independently verified outcomes; report median-absolute-log-error and WAPE on turnover, interval **coverage** and interval score, WCR/P&L error, all sliced by sector/size/region/season/evidence tier.
- **A/B** — the adaptive acquisition policy vs a fixed checklist (interval reduction per field-minute); recommendation-band calibration vs realised performance.
- **Fairness slices** — error, abstention, and capture-burden gaps across lawful, pre-approved groups and evidence-availability strata; no subgroup conclusion below minimum cell size.
- **Drift dashboards** — benchmark drift, extraction error, calibration, override patterns; thresholds trip re-validation.

---

## 4. Observability, audit & governance

### 4.1 What to log & how to trace

Per case, one `trace_id`; per step, a `span_id`. Logged events: the prompt and *reference* to the context window (content hashed/stored per retention class), each tool call (name, scoped params, latency, result hash, cost), each evidence node written (with provenance and confidence), each X-Ray read, each Planner decision (chosen step + the A-scores it beat), each Verifier verdict, each human action, and the final outcome. Sessions are replayable from the log.

### 4.2 Metrics & dashboards

- **Reliability** — step success/error rate, Verifier rejection rate, tool timeout/retry rate, escalation rate.
- **Cost** — tokens & tool cost per case; cost per *usable* assessment.
- **Latency / TAT** — per-step and end-to-end; % of cases under 48 h; queue/wait at human gates.
- **Risk** — % reaching target `W`, override rate & direction, conflict rate, fraud-flag rate, calibration/coverage, fairness gaps.

### 4.3 Audit-log structure & rollback runbook

- **Structure** — append-only, **hash-chained** records `{trace_id, span_id, ts, actor(human|agent|tool), action, inputs_ref, output_ref, verdict, policy_versions, retention_class}`. Immutable; tamper-evident.
- **Rollback runbook** — because the agent makes **no external state changes** except (a) LOS package attachments and (b) OTP/notifications, rollback is bounded: *revoke* a recommendation package in LOS (never delete — supersede with a reason), void a pending gate, and mark the case re-open. Disbursement is downstream and human-owned, so no financial rollback is ever the agent's. Every rollback is itself a logged event; the hash chain proves what was known when.

### 4.4 Policy registry

Applicable policies — RBI Digital Lending 2025, DPDP 2023 + Rules 2025, AA Master Direction, internal credit policy, fair-lending, the X-Ray benchmark registry — live in a **versioned policy registry**. The agent **fetches the policy version at decision time** through the Tool Router (never hard-codes thresholds), and the resolved policy versions are stamped into the audit record, so any past decision can be re-evaluated against the rules **as they stood then**. Benchmark constants carry owner, source, geography, effective period, and drift threshold; changing one is a governed, signed-off event.

---

## 5. Business X-Ray integration

### 5.1 Consuming X-Ray diagnostics

Through the X-Ray Integrator the agent reads, per case: the turnover scenario and per-driver interval width `W`; simplified P&L and WCR; **IRI** (domain coverage); **cash-share** estimate; external **concordance `C`**; and **compliance flags** (GSTIN validity, licence, staged/stale capture). These drive the Planner (what to collect next), the dynamic constraints (§2.4), the quality gates (§3.3), and the recommendation band.

### 5.2 Contributing new signals back

The agent can *propose* — never unilaterally add — new diagnostics or benchmark refinements it discovers (e.g. "for pharmacies, timed footfall reduces `W` more than the current weight assumes," or a new evidence facet). A proposal is packaged with its supporting cases, expected effect, and back-test, and routed to governance.

### 5.3 Validation & approval for new diagnostics

A proposed signal moves through: **(1) shadow** — computed but not used, logged alongside live output; **(2) back-test** — against the golden set for lift and fairness; **(3) independent challenge** — sector-risk owner review; **(4) sign-off** — credit-analytics + model-risk approval with a version bump in the benchmark registry; **(5) monitored rollout** — with drift thresholds and rollback. Only after (4) does the signal influence any live decision. This mirrors the platform's benchmark-governance rule: a constant that moves numbers needs an owner, a source, and a gate.

---

## 6. Implementation sketch

### 6.1 Node-graph (LangGraph-style)

```mermaid
flowchart TD
  A[Intake: case_id, consent, profile] --> B{Consent + dual-OTP valid?}
  B -- no --> B
  B -- yes --> C[Planner: pick next objective\nusing X-Ray W / IRI / flags + TAT budget]
  C --> D[Executor: run step via Tool Router]
  D --> E[Verifier: schema + business-rules + guardrails]
  E -- reject --> R{Retry / fallback / zoom}
  R -- retryable --> D
  R -- exhausted --> H
  E -- accept --> M[(Memory: evidence graph + audit)]
  M --> X[X-Ray Integrator: recompute scenario, W, IRI, C, flags]
  X --> G{Stop conditions}
  G -- W>±20% and evidence remains --> C
  G -- no photo can close driver --> Q[Ask customer -> Claim] --> X
  G -- conflict / fraud / W stuck --> H[Escalate: reason code]
  G -- target reached --> P[Assemble decision package + band]
  P --> AG{{Approval Gate: human underwriter\n(tier by risk x impact)}}
  H --> AG
  AG -- approved --> L[Attach package to LOS  •  log outcome]
  AG -- changes --> C
  L --> Z[Close case  •  seal audit chain]
```

### 6.2 Execution loop (pseudocode)

```
case = intake(case_id)                      # consent + dual-OTP gate first (hard)
assert case.consent.valid                    # else stop — never proceed
while not done(case):
    xr   = xray.diagnostics(case)            # W, IRI, cash-share, C, flags
    step = planner.next(case, xr, tat_left)  # Eq-7: max ΔW per cost, given TAT
    if step.needs_gate(xr):                   # dynamic: cash-heavy/high-ticket/conflict
        await approval_gate(step)             # human in their own console; logged
    try:
        raw = tool_router.call(step.tool, scope(step.params))   # scoped creds, retries
    except ToolError as e:
        step = fallback(step, e)              # zoom -> ask -> external -> escalate
        continue
    ok, verdict = verifier.check(raw)         # schema + business rules + guardrails
    log(case, step, raw, verdict)             # append-only, hash-chained
    if not ok:
        if retryable(verdict): continue
        else: escalate(case, verdict.reason); break
    memory.write(case, verdict.node)          # sticky confirmed facts; evidence graph
    if xray.width(case) <= 0.20 and xray.iri_ok(case) and no_conflict(case):
        break                                 # done condition
package = assemble_recommendation(case, xray.diagnostics(case))   # band, not decision
await approval_gate(package)                  # human-only sanction downstream
los.attach(package)                           # supersede, never overwrite
seal_audit(case)
```

### 6.3 Where the key behaviours live

- **Retries / fallbacks** — Tool Router (transport) + `fallback()` (semantic: zoom → ask → external → escalate).
- **Escalation** — Verifier verdict or the stop-condition node `H`; always a reason code, always a valid outcome.
- **Human approval gates** — sensitive tool calls (dynamic, X-Ray-modulated) and the final package, before anything reaches LOS.
- **X-Ray fetch/apply** — the `xray.diagnostics()` call at the top of every loop iteration and again before assembling the package; applied by Planner, constraints, gates, and the stop condition.

### 6.4 Alignment with platform standards

- **Logging/tracing** — one `trace_id`/case, `span_id`/step; every prompt, tool call, decision, and human action emitted to the platform's event stream (§4.1).
- **Policy registry** — thresholds and compliance rules fetched at decision time and version-stamped (§4.4); no hard-coded policy.
- **Isolation & credentials** — per-case sandbox, egress allowlist, Router-issued scoped creds (§1.2) — the platform's standard for any high-risk agent.
- **X-Ray contract** — all engine access via the typed X-Ray Integrator, so the agent and engine version independently.

---

## 7. How this meets the governing objective

**Minimise credit risk:** adaptive acquisition drives every case to a defined uncertainty target or an explicit abstention; the Verifier blocks bad evidence; conflicts and thin corroboration force human depth; the human-only sanction rule means the model never takes credit risk on its own. **TAT < 48 h:** cheapest-evidence-first, risk-adjusted depth, and the "relax on easy cases" constraint spend field and reviewer time only where risk concentrates; latency/queue dashboards surface gate bottlenecks. **Full auditability:** hash-chained append-only log, version-stamped policies, and provenance on every node make any decision reconstructable as it stood — the regulator record is a by-product of how the harness runs, not an afterthought.

---

## 8. Build sequence & open points

**Sequence.** (1) Case object + four-tier memory + audit chain; (2) Tool Router with allowlist, scoped creds, retries; (3) Verifier rule-set + CI invariants; (4) Planner (lift the capture Eq-7 loop to case level) + dynamic constraints from X-Ray; (5) Approval Gate + LOS package contract; (6) Observability dashboards; (7) policy registry integration; (8) contribute-back diagnostic workflow; (9) cross-case learning (outer loop). The **capture-side executor/verifier/memory already exists** in `/capture` (the adaptive loop I was mid-building) and becomes component-level reference code for steps 3–4.

**Open points for you.**
1. Confirm the agent instantiation in the box above (or name a different agent to target).
2. Server/tool plane — is there an existing LOS/LMS and AA/bureau integration to bind the Tool Router to, or is that greenfield? (Sets how much of §1.2 is build-vs-connect.)
3. Human-gate tiers — do the T0–T3 triggers match your credit policy's maker-checker thresholds?
4. Deliverable format — keep this as the living Markdown spec, or should I also produce a formatted Word/PDF version for circulation once the content is settled?
5. Do you want me to resume and finish the concrete capture-harness code (Phases 1–4) now, or hold it until this architecture is approved?

---

## Appendix A — Data Backbone (external source registry)

The Mitra/agent also consumes the platform **Data Backbone**: 38 external sources across 10 categories. Every source is **SANDBOX (mock)** and returned **redacted/masked** until go-live; sensitive pulls (Aadhaar/KYC, Account Aggregator, bureau, tax) are **consent-gated** and refused outside the consented purpose. Each source feeds the Credit Assessment Memo (CAM) at a specific section, drives a post-disbursement monitoring trigger, and confirms one or more downstream underwriting profiles.

**How the harness handles the backbone.** Every source is a Tool-Router entry (§2.3) with least-privilege, single-purpose, short-lived credentials the model never sees; the model receives the **redacted signal**, never the raw record. Consent-gated sources check a valid AA/KYC consent artefact per call and are blocked on withdrawal. Pulls are ordered by the same Eq-7 value-per-cost logic — the agent pulls the source that most reduces decision-relevant uncertainty next, not all of them. Each pull is logged (source, consent ref, purpose, latency, result hash) and its signal is written to the evidence graph as an **External** node with provenance, so a photo-derived estimate and an external signal are visibly reconciled (concordance `C`), never silently merged. `Monitors` columns become recurring post-disbursement jobs (EWS/IRACP) under a separate recurring consent.

**Downstream profiles confirmed:** `Mitra Customer Profile` · `CPV Residence PD` · `ACM Business PD` · `RCU Property PD` · `CRIF Bureau` · `Sustainable Profile` · `Banking scorecard` · `Post-disbursement monitoring`.

### Identity & KYC — 5 sources  
*Consent basis: eKYC / OKYC consent*

| Source | Feeds | CAM index | Monitors | Go-live source | Consent | Confirms |
|---|---|---|---|---|---|---|
| 🔒 Aadhaar eKYC / OKYC | Onboarding · KYC identity | §1 Applicant · §2 KYC/consent | Re-KYC / periodic KYC refresh | UIDAI via ULI Auth Suite (consent-based) | consent-gated | Mitra Customer Profile, CPV Residence PD |
| 🔒 PAN Verification | Onboarding · KYC · GSTIN link | §1 Applicant · §2 KYC/consent | Re-KYC / periodic KYC refresh | Protean / Income Tax via ULI | consent-gated | Mitra Customer Profile |
| 🔒 Driving Licence | Background check · identity | §1 Applicant · §2 KYC/consent | Re-KYC / periodic KYC refresh | Sarathi / Parivahan (MoRTH) | consent-gated | Mitra Customer Profile |
| 🔒 Face Match / Liveness | Background check · fraud | §1 Applicant · §2 KYC/consent | Re-KYC / periodic KYC refresh | NPCI / licensed vendor | consent-gated | Mitra Customer Profile |
| 🔒 DHRUVA Digital Address | Background check · residence | §1 Applicant · §2 KYC/consent | Re-KYC / periodic KYC refresh | DHRUVA (Dept. of Posts) | consent-gated | Mitra Customer Profile, Sustainable Profile, CPV Residence PD |

### Income & tax — 7 sources  
*Consent basis: AA / taxpayer consent*

| Source | Feeds | CAM index | Monitors | Go-live source | Consent | Confirms |
|---|---|---|---|---|---|---|
| 🔒 GST Returns (GSTR-1, GSTR-3B) | Eligibility · verified turnover | §6 Income & eligibility | Turnover / income drift → EWS | GSP / GSTN | consent-gated | Mitra Customer Profile, Sustainable Profile, ACM Business PD, Post-disbursement monitoring |
| 🔒 Income Tax Returns | Eligibility · declared income | §6 Income & eligibility | Turnover / income drift → EWS | Income Tax Dept (e-filing) | consent-gated | Mitra Customer Profile |
| 🔒 Equities / Demat Holdings | Eligibility · assets/liquidity | §6 Income & eligibility | Turnover / income drift → EWS | CDSL / NSDL via AA | consent-gated | Mitra Customer Profile |
| 🔒 AA Bank Statements | Eligibility · verified cash-flow | §6 Income & eligibility | Turnover / income drift → EWS | Account Aggregator (Sahamati / FIP) — consent-based | consent-gated | Mitra Customer Profile, Sustainable Profile, Banking scorecard, ACM Business PD |
| 🔒 AA Mutual-Fund Holdings | Eligibility · assets/liquidity | §6 Income & eligibility | Turnover / income drift → EWS | Account Aggregator (RTA / CAMS-KFin via AA) | consent-gated | Mitra Customer Profile, CPV Residence PD |
| 🔒 AA Insurance Policies | Eligibility · protection/obligation | §6 Income & eligibility | Turnover / income drift → EWS | Account Aggregator (insurers via AA) | consent-gated | Mitra Customer Profile, Sustainable Profile, CPV Residence PD |
| 🔒 AA NPS / EPFO Passbook | Eligibility · savings continuity | §6 Income & eligibility | Turnover / income drift → EWS | Account Aggregator (NPS-CRA / EPFO via AA) | consent-gated | Mitra Customer Profile |

### Business & registry — 5 sources  
*Consent basis: public / business registry*

| Source | Feeds | CAM index | Monitors | Go-live source | Consent | Confirms |
|---|---|---|---|---|---|---|
| GSTIN Registration | Eligibility · KYC link | §1 Applicant · §4 Business | Registration / vintage lapse watch | GSTN | public/screen | Mitra Customer Profile, ACM Business PD |
| Udyam Registration | Business stability · scheme | §1 Applicant · §4 Business | Registration / vintage lapse watch | Udyam (MoMSME) | public/screen | Mitra Customer Profile, ACM Business PD |
| EPFO Establishment | Business stability · scale | §1 Applicant · §4 Business | Registration / vintage lapse watch | EPFO | public/screen | Mitra Customer Profile, ACM Business PD |
| Shop & Establishment Act | Background check · premises | §1 Applicant · §4 Business | Registration / vintage lapse watch | State Labour Dept | public/screen | Mitra Customer Profile, Sustainable Profile, ACM Business PD |
| FSSAI Licence | Business stability · compliance | §1 Applicant · §4 Business | Registration / vintage lapse watch | FSSAI FoSCoS | public/screen | Mitra Customer Profile |

### Behaviour & repayment — 3 sources  
*Consent basis: bureau / AA consent*

| Source | Feeds | CAM index | Monitors | Go-live source | Consent | Confirms |
|---|---|---|---|---|---|---|
| 🔒 Credit Bureaus (CIBIL · Experian · CRIF · Equifax) | Underwriting · repayment history | §2 Bureau · §3 PD · §6 FOIR | Repayment / bounce → EWS & IRACP | TransUnion CIBIL / Experian / CRIF High Mark / Equifax | consent-gated | CRIF Bureau |
| 🔒 UPI Transaction Patterns | Eligibility · cash-flow | §2 Bureau · §3 PD · §6 FOIR | Repayment / bounce → EWS & IRACP | NPCI / AA | consent-gated | Mitra Customer Profile, Sustainable Profile, Banking scorecard, ACM Business PD |
| 🔒 Telecom Payment History | Alt-data · conduct | §2 Bureau · §3 PD · §6 FOIR | Repayment / bounce → EWS & IRACP | DoT / TSPs | consent-gated | Sustainable Profile |

### Collateral & land — 4 sources  
*Consent basis: property / registry*

| Source | Feeds | CAM index | Monitors | Go-live source | Consent | Confirms |
|---|---|---|---|---|---|---|
| Bhu-Aadhaar / ULPIN | Collateral · title | §7 Collateral & title | Collateral revaluation / charge review | DoLR (Digital India Land Records) | public/screen | RCU Property PD |
| Property Tax Records | Collateral · ownership | §7 Collateral & title | Collateral revaluation / charge review | ULB / municipal | public/screen | Mitra Customer Profile, CPV Residence PD, RCU Property PD, ACM Business PD |
| CERSAI Registry | Collateral · existing charges | §7 Collateral & title | Collateral revaluation / charge review | CERSAI | public/screen | RCU Property PD |
| Stamp Duty / Registration (IGR) | Collateral · title chain | §7 Collateral & title | Collateral revaluation / charge review | State IGR / e-Registration (ULI e-Stamping) | public/screen | RCU Property PD |

### Compliance & schemes — 3 sources  
*Consent basis: screening*

| Source | Feeds | CAM index | Monitors | Go-live source | Consent | Confirms |
|---|---|---|---|---|---|---|
| ULI Credit Guarantee / Schemes | Structuring · guarantee | §8 Recommendation | Scheme / negative-list refresh | ULI / CGTMSE | public/screen | — |
| Negative Lists | Background check · sanctions/PEP | §8 Recommendation | Scheme / negative-list refresh | RBI / SEBI / MCA / UN / internal | public/screen | CRIF Bureau |
| RBI Defaulter / CRILC & Wilful-Defaulter Lists | Background check · large-exposure default | §8 Recommendation | Scheme / negative-list refresh | RBI CRILC · TransUnion CIBIL Suit-filed / Wilful-defaulter | public/screen | CRIF Bureau, Post-disbursement monitoring |

### Monitoring & collections — 3 sources  
*Consent basis: recurring consent*

| Source | Feeds | CAM index | Monitors | Go-live source | Consent | Confirms |
|---|---|---|---|---|---|---|
| 🔒 Skip-Tracing (collections) | Collections · contactability | §8 (post-sanction) | Collections contactability & recovery | Telco / bureau / vendor | consent-gated | CPV Residence PD, Post-disbursement monitoring |
| 🔒 AA Ongoing Consent (cash-flow monitoring) | Post-disbursement · cash-flow EWS | §8 (post-sanction) | Collections contactability & recovery | Account Aggregator — recurring consent (up to 12m) | consent-gated | Post-disbursement monitoring |
| 🔒 Bureau Periodic Refresh | Post-disbursement · repayment EWS | §8 (post-sanction) | Collections contactability & recovery | CRIF / CIBIL / Experian / Equifax — portfolio monitoring | consent-gated | Post-disbursement monitoring |

### Digital footprint — 4 sources  
*Consent basis: public / platform*

| Source | Feeds | CAM index | Monitors | Go-live source | Consent | Confirms |
|---|---|---|---|---|---|---|
| E-commerce Ratings | Business stability · demand | §4 Business assessment | Demand / rating trend → EWS | ONDC / marketplaces | public/screen | Mitra Customer Profile, ACM Business PD |
| WhatsApp Business API | Background check · presence | §4 Business assessment | Demand / rating trend → EWS | Meta (BSP) | public/screen | Mitra Customer Profile |
| WhatsApp Business Analytics | Business stability · engagement | §4 Business assessment | Demand / rating trend → EWS | Meta (BSP) | public/screen | Mitra Customer Profile, ACM Business PD |
| App Store Presence | Business stability · digital maturity | §4 Business assessment | Demand / rating trend → EWS | Play Store / App Store | public/screen | — |

### ULI (Unified Lending Interface) — 3 sources  
*Consent basis: RBIH ULI*

| Source | Feeds | CAM index | Monitors | Go-live source | Consent | Confirms |
|---|---|---|---|---|---|---|
| ULI Transliteration Services | Record-linkage · name standardisation | §7 Collateral & title | Land-record / valuation refresh | Unified Lending Interface (RBIH) | public/screen | Mitra Customer Profile |
| ULI Digitised Land Records | Collateral · title | §7 Collateral & title | Land-record / valuation refresh | Unified Lending Interface (RBIH) | public/screen | RCU Property PD |
| ULI Property Search / Valuation | Collateral · LTV | §7 Collateral & title | Land-record / valuation refresh | Unified Lending Interface (RBIH) | public/screen | RCU Property PD |

### Legal & litigation — 1 source  
*Consent basis: public records*

| Source | Feeds | CAM index | Monitors | Go-live source | Consent | Confirms |
|---|---|---|---|---|---|---|
| e-Courts Litigation Analytics | Background check · legal risk | §1 Applicant · §7 Title | Litigation / adverse-event watch | e-Courts / vendor | public/screen | CRIF Bureau |

> 🔒 = consent-gated (Aadhaar/KYC, Account Aggregator, bureau, tax). All rows are sandbox/mock and redacted until the go-live source is connected.
