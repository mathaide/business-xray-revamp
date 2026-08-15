# Business X-Ray — 56-Industry Model: authoring brief & schema (v1)

You are extending an EXISTING, paper-faithful engine — do not invent a new framework.
Your job: produce realistic, India-grounded **parameter packs** for a set of MSME industries so
they plug directly into the engine below. Output STRICT JSON (schema at the end). Values are
illustrative-but-realistic and **interval-valued** `[lo, base, hi]`.

---

## 1. What the engine already does (reuse it)

The Business X-Ray images a thin-file MSME from field **photos** + a **Mitra data pack** and imputes an
auditable P&L and balance sheet as INTERVALS, targeting **≤20% half-width** around the base (i.e.
`(hi−lo)/2 ≤ 0.20 × base` on turnover) once enough evidence is captured.

Core mechanics you are feeding:
- **Revenue interval, Eq 2:** `R̂ = Π(driver_i) × operating_days`. Each driver is `[lo,base,hi]`. Positive drivers → exact interval multiplication.
- **P&L, Eq 3:** gross margin `gm=[lo,base,hi]`, opex ratio `opex=[lo,base,hi]`, `EBITDA = R(gm−opex)`.
- **Balance sheet, Eq 4/5:** inventory (from `dio` days or measured stock worksheet), receivables (`dso`), payables (`dpo`) → Working-Capital Requirement + trade cycle.
- **Evidence acquisition score, Eq 7 (THE refinement loop):** each `evidenceItem` names the ONE driver it tightens and by how much (`narrowPct` = new half-width as fraction of base). The engine simulates the narrowing, ranks items by `(ΔWidth × q × v)/cost`, and prompts the **highest-value next photo**. This is how "what photo to take next" is chosen — you must populate it well.
- **Triangulation:** energy proxy (Eq 8, `eta` = kWh per ₹1,000 turnover), banking-vs-cash reconciliation, GSTIN, concordance (Eq 9). These come from the **Mitra data pack** (see §4) and corroborate — never overwrite — the photo estimate.
- **Node classes (tag every driver & evidence `cls`):** `Observed` (visible in a bounded frame), `Claim` (borrower-reported), `Benchmark` (lender-approved constant), `External` (GSTIN/utility/digital), `Derived`, `Gap`.

## 2. Archetype = revenue-formula family (pick the one assigned)

| archetype | revenueFormula | driver keys |
|---|---|---|
| `retail` | avg ticket × transactions/day × operating days | ticket, txns, days |
| `fnb` | seats × turns/day × avg cover × operating days | seats, turns, cover, days |
| `services` | clients(jobs)/day × avg fee × operating days | clients, fee, days |
| `warehouse` | sales per sqft/day × usable area × operating days | psf, area, days |
| `scrap` | tonnage/day × blended ₹/kg × operating days (unitScale tonnage×1000) | tonnage, price, days |
| `manufacturing` | units/hr × productive hrs/day × utilisation × price/unit × operating days | uph, hours, util, price, days |
| `transport` | vehicles × trips(or trip-value)/day × avg realisation × utilisation × operating days | vehicles, trips, fare, util, days |

You may KEEP the archetype's driver keys but you MUST retune every `[lo,base,hi]` and the registry
constants (`gm/opex/dio/dso/dpo/eta`) to YOUR specific industry. A pharmacy and a pan shop are both
`retail` but have very different margins, ticket, DIO and eta. Where a driver key doesn't fit an
industry, you may rename its `label`/`unit` (keep the `key`) so the formula still reads sensibly
(e.g. transport `trips` → "trips/vehicle/day" or "km/day"; services `clients` → "tests/day" for a lab).

## 3. Benchmark bands — pan-India, metro & non-metro

Every numeric block must carry TWO bands: `metro` (tier-1/metro economics — higher rent, wages, ticket)
and `nonmetro` (tier-2/3/rural). This applies to drivers, registry constants, occupancy, and the
`monthlyRevenueBand`. Ground them in realistic Indian MSME economics for 2026 (thin-file segment).

## 4. The Mitra data pack (documentary layer already collected)

Before the X-Ray, a field agent ("Mitra") collects and attaches: **GST filings (GSTR-3B/1, e-invoice,
e-way), Account-Aggregator bank feed, UPI/QR settlement, electricity/DISCOM bill, rental agreement,
Udyam.** The X-Ray REVIEWS these as ground-truth-ish cross-checks. For each industry list, in
`dataPack`, which pack items validate which driver/output, and the expected concordance strength. The
next-photo loop should prefer photos that **resolve disagreement between the pack and the visual scene**
or fill a gap the pack can't cover (e.g. cash sales a bank feed misses; true footfall vs declared).

## 5. Occupancy (owned vs rented) — first-class

Every industry must specify `occupancy`: how the **electricity bill + rental agreement** (Mitra pack) +
premises photo establish owned-vs-rented, the typical **monthly rent** band (metro/nonmetro), the
**security deposit** multiple (→ balance-sheet asset), and whether rent is a material opex line (it is
embedded in the `opex` band — note the share). Owned premises → a fixed-asset/collateral note instead of rent.

## 6. Footfall / activity capture (where relevant)

For footfall-driven industries (retail, fnb, some services), specify `activitySignals`: **timed exterior
captures** (day-of-week × time-of-day) that build a footfall curve, queue/parking counts, and how these
cross-check the POS/UPI transaction count. For B2B-facing industries (warehouse, distribution, some
manufacturing), specify how to estimate the **number of B2B counterparties** (dispatch register, e-way
bills, GSTR-1 counterparty count) and how that bounds throughput.

## 7. Facets available (capture types)

Use these existing facet ids in `shotList` (capture order): `exterior, neighbourhood, interior,
price_board, display, storage, machinery, weighbridge, dispatch, qr_code, utility_meter, gst_board,
udyam, pukka_invoice, kacha_bill, licence`. You MAY introduce a new facet id where an industry needs one
(e.g. `rental_agreement`, `footfall_timed`, `appointment_register`, `cold_room`, `vehicle_fleet`,
`chair_station`, `menu_board`, `assay_kit`) — list any new facets you use under `newFacets` with a
one-line `validates`/`output`/`privacy` note each, matching the FACETS structure.

---

## OUTPUT SCHEMA (strict JSON — one object per industry, in an array)

```json
{
  "id": "kirana",
  "name": "Kirana Shop",
  "archetype": "retail",
  "subtype": "grocery / daily-needs",
  "economics": "one sentence: how this business actually makes money",
  "registry": {
    "metro":    { "gm": [0.12,0.15,0.18], "opex": [0.08,0.10,0.12], "dio": 28, "dso": 3, "dpo": 22, "eta": 0.5 },
    "nonmetro": { "gm": [0.13,0.16,0.20], "opex": [0.07,0.09,0.11], "dio": 25, "dso": 2, "dpo": 18, "eta": 0.4 }
  },
  "drivers": {
    "metro":    [ {"key":"ticket","label":"Average ticket","unit":"₹","cls":"Claim","lo":180,"base":260,"hi":340},
                  {"key":"txns","label":"Transactions / day","unit":"count","cls":"Observed","lo":180,"base":300,"hi":460},
                  {"key":"days","label":"Operating days / yr","unit":"days","cls":"Claim","lo":345,"base":355,"hi":362} ],
    "nonmetro": [ … same keys, retuned … ]
  },
  "shotList": ["exterior","neighbourhood","interior","price_board","display","qr_code","gst_board","utility_meter","pukka_invoice","kacha_bill","licence","udyam"],
  "evidenceItems": [
    {"id":"pos_daytotal","label":"POS day-total (Z-report)","driver":"txns","narrowPct":0.07,"q":0.9,"v":0.9,"cost":2,"cls":"Observed","note":"Constrains daily count directly."},
    {"id":"item_price","label":"Shelf price sample","driver":"ticket","narrowPct":0.06,"q":0.85,"v":0.7,"cost":1,"cls":"Observed","note":"Constrains average ticket."}
  ],
  "occupancy": {
    "typicalRentMonthly": { "metro": [25000,45000,80000], "nonmetro": [6000,12000,22000] },
    "depositMonths": 6,
    "rentShareOfOpex": "≈ 30–45% of opex; embedded in opex band",
    "ownedSignal": "electricity bill in proprietor's name + no rental agreement in Mitra pack → owned; then substitute a fixed-asset/collateral note for rent"
  },
  "dataPack": [
    {"source":"UPI/QR settlement","validates":"txns & ticket → banked turnover; cash share = residual","strength":"strong"},
    {"source":"GST 3B/GSTR-1","validates":"declared turnover vs photo-derived (concordance)","strength":"strong"},
    {"source":"Electricity bill","validates":"connected load → floor size sanity; owned/rented; power cost","strength":"medium"},
    {"source":"Rental agreement","validates":"rent expense + deposit (BS)","strength":"medium"}
  ],
  "activitySignals": {
    "footfall": "3 timed exterior/interior captures (morning, evening peak, weekend) → footfall curve; cross-check vs UPI txn count",
    "b2b": "n/a for kirana (B2C)"
  },
  "balanceSheetNotes": "inventory = shelf+back-stock worksheet (Observed) overrides benchmark DIO; near-zero receivables (cash/UPI); payables = distributor credit 15–30d; fixed assets = shelving, refrigeration, weighing, POS",
  "monthlyRevenueBand": { "metro": [400000,1100000], "nonmetro": [150000,500000] },
  "varianceNotes": "UPI+GST concordance → ≤10%; photo-only ≈ ±25–30% until footfall curve + POS day-total close the txns gap",
  "newFacets": []
}
```

### Authoring rules
- Retune EVERY number to the specific industry — no copy-paste defaults across industries.
- `lo < base < hi` for every driver; ratios in `gm`/`opex` as decimals; `gm` must exceed `opex` at base for a viable EBITDA.
- Give 2–4 `evidenceItems` per industry, each tightening a DIFFERENT high-uncertainty driver; the set should be able to drive turnover half-width from its wide start to ≤20%.
- Ground `eta` (energy intensity) sensibly: heavy processing/cold-storage high, services/agency low.
- Keep notes short and lender-relevant. British/Indian spelling fine. Currency ₹.
- Realistic thin-file MSME scale — most of these are ₹10L–₹15Cr/yr turnover businesses, not corporates.
