# Business X-Ray — Adaptive Capture Harness

**Design specification for review — v0.1**
Phone Se Loan · Litehouse · engine v2.1.0 · registry 2026.08

---

## 1. What this is (and is not)

Today the Business X-Ray capture page takes a fixed, ordered list of photos for a profile, reads a few fields from each, and hands the result to the assessment engine. It already contains most of the raw signals a harness needs — a per-photo sharpness score, in-browser OCR and field extractors, the evidence-graph node classes, the Information-Resolution Index, and the Eq-7 next-evidence score — but they run as *decorations* on a linear checklist rather than as a control loop.

This spec turns that linear checklist into an **adaptive acquisition harness**: a loop that, after every photo, measures how much it actually learned, remembers it, decides the single most valuable thing to capture next, and asks the Mitra (or the customer) for it — escalating to a human when the evidence is poor, conflicting, or exhausted.

Three framing constraints carry over unchanged and bound everything below:

- **The harness acquires and estimates; it does not decide.** No autonomous sanction, rejection, or credit score. A human underwriter approves on independently verified capacity. The loop's job is to reduce *decision-relevant uncertainty*, not to make the decision.
- **Observed ≠ claimed.** A value read from a photo is an Observed node; a value the customer states is a Claim; a value inferred is Derived. The harness never silently promotes a claim to an observation.
- **Sandbox where APIs are required.** External pulls (GST, utility, bank/AA) stay simulated until the backend and DLT/consent rails are live. The harness is designed so those slot in later without redesign.

---

## 2. The uncertainty metric the loop optimises

Everything the harness does is in service of shrinking one number per driver: the **relative interval width** of the revenue estimate,

> W = (hi − lo) / base

computed by the existing engine from the interval-valued drivers. A profile starts wide (the sector prior — typically ±150–280% as the due-diligence pass showed). Each photo can do two things to W: **recentre** the base (an AI-read value moves it to *this* customer) and **narrow** the interval (captured evidence tightens lo/hi around the base). The loop's objective at every step is: *spend the next unit of the Mitra's time on the photo that reduces total decision-relevant W the most.*

This is what makes it a harness rather than a checklist — the order is not fixed, it is recomputed from the current state after every photo.

---

## 3. State model

A capture session is a small state machine. Each state has a clear entry condition and a clear exit.

| State | Meaning | Exit condition |
|---|---|---|
| `CONSENT` | Terms shown, dual-OTP (Mitra + customer) verified | Both OTPs entered → `PROFILE` |
| `PROFILE` | Business type / scale / activity provisionally inferred; competing hypotheses held | Mitra confirms or corrects profile → `ACQUIRE` |
| `ACQUIRE` | The loop: recommend next photo → capture → quality-gate → read → update memory → re-rank | Stopping rule met (§6) → `REVIEW` |
| `ZOOM` | Targeted re-capture of one facet/field the loop flagged as low-quality or high-value | Re-read succeeds or Mitra marks unavailable → back to `ACQUIRE` |
| `ASK` | A required value can't be read from any photo; a typed question is put to Mitra/customer | Answer captured (as Claim) or skipped → back to `ACQUIRE` |
| `REVIEW` | Human confirmation of every read and edit; conflicts surfaced | Mitra confirms → `HANDOFF` |
| `ESCALATE` | Abstention: evidence poor/conflicting/exhausted below threshold | Routed to underwriter with reason code |
| `HANDOFF` | Confidence-annotated evidence package written for the assessment | Assessment opens pre-loaded |

`ZOOM`, `ASK`, and `ESCALATE` are interrupts the loop can raise from `ACQUIRE`; they always return to the loop (or terminate at `ESCALATE`).

---

## 4. Memory model

"Memory" is layered, because different things need to persist for different lifetimes. Nothing sensitive is retained beyond what the assessment needs; retention class is stamped per item (mirrors the Terms page).

**Tier 1 — Working state (this session, in-memory + `sessionStorage`).** The live evidence graph: every facet captured, its image-quality score, the fields read from it with per-field confidence, which driver each touches, the current driver intervals, and the running W per driver. This is the loop's scratchpad; it already partially exists as the capture state object and gets formalised.

**Tier 2 — Confirmed facts (per capture, promoted on human confirm).** When the Mitra confirms or corrects a read in `REVIEW` (or inline), the value is frozen as a confirmed Observed/Claim node with who-confirmed and when. Confirmed facts are *sticky* — a later photo can add corroboration but cannot silently overwrite a human-confirmed value; a conflict instead raises a flag.

**Tier 3 — Audit log (append-only).** Every action — photo taken, quality score, field read, confidence, recommendation shown, recommendation followed/skipped, edit, question asked, answer given, escalation — with timestamp. This is the RBI-Digital-Lending / DPDP auditability record and the training signal for later tuning.

**Tier 4 — Cross-session priors (optional, later).** Aggregate, de-identified feedback: e.g. "for pharmacies, the timed-footfall photo actually reduced W by X% on average." This closes the outer loop — it lets the *expected* ΔW in the next-evidence score be learned from real captures instead of the hand-set benchmark. **Out of scope for v1**; the audit log is designed to feed it.

---

## 5. Information-quality model

Three independent quality signals, checked in order for every photo. A photo can be sharp yet uninformative, or informative yet unreadable — they are not the same axis.

1. **Image quality (capture-time gate).** The existing Laplacian sharpness score, plus exposure and a minimum-resolution check. Below threshold → the loop does not even attempt a read; it routes straight to `ZOOM` ("re-take, hold steady / move closer"). This prevents aggressive inference from a bad frame.
2. **Read confidence (per field).** Each extracted field (price, meter number, GSTIN, footfall count, area, tonnage…) carries a 0–1 confidence from the OCR/detector/extractor. Low confidence but good image → `ZOOM` on that specific detail (a close-up of just the price board or just the meter). High confidence → the value is proposed to memory (still pending human confirm).
3. **Information value realised (post-read).** After the read updates the driver, the loop measures the *actual* ΔW the photo produced. If a photo that was expected to be high-value produced little ΔW (e.g. the price board was blank, or the value equalled the prior), that is itself information — it lowers the remaining value of similar shots and may trigger `ASK`.

The **IRI** (share of the 10 verification domains resolved) rides alongside as a coverage gauge, distinct from W: W is *how tight the money estimate is*, IRI is *how many independent domains corroborate it*. The harness reports both; a tight W with low IRI is flagged as "precise but thinly corroborated."

---

## 6. The feedback loop (the core)

After each photo is captured, quality-gated, read, and folded into memory, the loop runs the **next-evidence ranking** — the existing Eq-7 score, now driven live:

> A_j = ( expected ΔW from evidence e_j ) × q_j × v_j / ( cost_j + ε )

where `q_j` is expected capture quality for that facet in *this* environment (nudged down if the last similar shot scored poorly), `v_j` is its audit value, and `cost_j` is the Mitra's burden. The loop:

1. Recomputes W for every driver from current memory.
2. Scores every *not-yet-captured, not-exhausted* facet by A_j.
3. Surfaces the **single top recommendation** as the next step — with a plain-language reason ("Photograph the price board — it's the biggest remaining unknown for revenue") and the expected effect ("should tighten the estimate from ±180% toward ±60%").
4. Offers the ranked runners-up as "or capture instead."

**Stopping rules (exit `ACQUIRE` → `REVIEW`).** The loop stops when any of:
- All drivers' W are below the per-profile target band, **or**
- The best remaining A_j falls below a floor (nothing left is worth the Mitra's time), **or**
- A capture budget is hit (max photos / max minutes — a configurable field-time cap), **or**
- The Mitra chooses "finish & review."

Whichever fires, the reason is logged, so a short capture reads as "stopped: target reached" rather than looking identical to "stopped: gave up."

---

## 7. Zoom-in on details

`ZOOM` is a first-class sub-capture, not a retake of the whole frame. Two triggers:

- **Quality-driven:** image or read confidence too low → "get closer to the meter number / hold steady on the price list."
- **Value-driven:** a wide-angle shot established a facet exists but a specific number inside it is the bottleneck → the loop asks for a macro shot of just that number (the GSTIN digits, the weighbridge slip total, the consumer number).

A zoom sub-shot is linked to its parent photo in the evidence graph (bounding region / crop), so the audit trail shows *this number came from a close-up of that board*. Zoom results re-enter the loop like any other read.

---

## 8. Asking for additional information

When a value is **required for a material driver** and **cannot be read from any feasible photo**, the loop raises `ASK` rather than guessing. Examples: operating days (no photo shows them), receivable days for a trade counter, whether a meter is shared. The question is:

- **Typed** — numeric, date, single-choice, or yes/no — never free text where a structured answer is possible.
- **Recorded as a Claim**, not an Observation, with source = customer/Mitra and time. It narrows the interval *less* than a photographed observation would, and is flagged for later external verification (GST/AA) where relevant.
- **Rate-limited** — the loop only asks when the expected uncertainty reduction justifies the interruption, and never for something a cheaper photo could answer.

This is the "ask additional information where required" behaviour, kept honest: a claim is visibly softer evidence than a photo, and the underwriter sees which numbers are claims.

---

## 9. Escalation to a human

`ESCALATE` fires — with a reason code carried to the underwriter — on any of: image quality unrecoverable after re-capture; a hard conflict between two signals (e.g. photographed price vs stated price, or photo-turnover vs GST-filed turnover once that's live); suspected staged/stale/duplicate capture; residual W still above the abstention threshold after the loop exhausts feasible evidence; or the profile itself ambiguous (competing business-type hypotheses that the drivers can't separate). Escalation is a *safe* outcome, not a failure — it's the abstention policy the paper's propositions call for.

---

## 10. What the Mitra sees (UX surface)

The capture page gains a persistent **coach panel** above the stepper:

- **"What we know"** — a compact live readout: current turnover interval and its ±width, per-driver confidence chips, IRI gauge.
- **"Do this next"** — the top recommendation with its one-line reason and expected effect, plus a "why this?" expander showing the A_j ranking.
- **"Still needed"** — the short list of open material unknowns, each either a photo to take or a question to answer.
- Inline **quality feedback** on each shot (sharp ✓ / re-take), and inline **confirm/correct** on each read.

The existing stepper, per-photo enhancement panel, consent/OTP gate, and geofence stay; this reorganises them around the loop rather than replacing them.

---

## 11. Handoff to Assessment

The `HANDOFF` package extends the current `bx_handoff` contract with the harness's confidence layer: per-driver W at hand-off, per-field read confidence, the Observed/Claim/Derived tag per value, IRI, the capture-stop reason, and the audit-log reference. The assessment already recentres and narrows from captured evidence; with this it can additionally *show* residual uncertainty and "what would tighten it," and it inherits the escalation reason if one was raised. (If you later pick option 2 from the scoping question, this same package powers an underwriter-side "information quality / collect next" panel — the spec already produces everything it needs.)

---

## 12. Guardrails (unchanged, restated)

No autonomous decision; human confirms every read and every final disposition. Observed/Claim/Derived never conflated. Faces and number plates cropped before a frame enters the graph; questions never collect unrelated personal data. External APIs sandboxed until DLT/consent live. Benchmarks (the priors, the q/v/cost weights) remain governed, versioned, and owner-attributed — the harness makes them *act*, so getting them wrong now moves numbers, which raises the bar on that governance.

---

## 13. Build plan

**Phase 1 — Formalise memory + quality gate.** Promote the capture state to the Tier-1 evidence graph; wire the image-quality and read-confidence gates to actually route to re-capture. *(Foundation; visible change: bad photos get rejected, reads show confidence.)*

**Phase 2 — Live feedback loop.** Recompute W after each photo; run the A_j ranking live; surface the single next-best recommendation with reason + expected effect; implement stopping rules with logged reasons. *(This is the harness proper.)*

**Phase 3 — Zoom + Ask + Escalate.** The three interrupts, the typed-question flow (claims), and the abstention/escalation reason codes.

**Phase 4 — Coach panel + confidence handoff.** The Mitra-facing panel and the extended handoff contract into Assessment.

**Phase 5 (optional, later) — Outer loop.** Feed the audit log into learned expected-ΔW priors so recommendations improve from real captures. Needs the backend/data store; sandbox until then.

Phases 1–4 are front-end, ship on the existing Cloudflare Pages deploy, and are independently reviewable. Phase 5 waits on the server backend (the same one the real OTP/SMS needs).

---

## 14. Open questions for you

1. **Capture budget default** — what's a realistic field-time / photo cap per visit for a Mitra (e.g. 8–12 photos, ~10 minutes)? It sets the stopping rule.
2. **Target width band** — what residual ±width should count as "tight enough to stop" vs "escalate"? Per-profile, or one global band to start?
3. **Who answers `ASK` questions** — Mitra only, or some directed to the customer (and does that need its own consent line)?
4. **Recommendation authority** — should the loop *enforce* the next-best order, or always let the Mitra override (with the override logged)? I'd default to override-always.
5. **Scope confirm** — build Phases 1–4 on the capture page now, and treat the underwriter-side panel (scoping option 2) as a fast-follow once you've seen the loop live?
