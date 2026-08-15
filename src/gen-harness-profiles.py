#!/usr/bin/env python3
# Generate per-profile harness runner data for all 56 industry profiles.
# Reads industry-model.json, computes headline underwriting numbers + narrative
# hooks per profile, writes harness-profiles.json (consumed by build-harness.mjs).
import json, math, re

d = json.load(open("industry-model.json"))
inds = d["industries"]

ARCH_LABEL = {
    "fnb": "Food & Beverage", "manufacturing": "Manufacturing", "retail": "Retail",
    "services": "Services", "transport": "Transport", "warehouse": "Warehouse & Trade",
    "scrap": "Scrap & Recycling",
}
# starting photo-only interval half-width (%) by archetype (from varianceNotes tenor)
PHOTO_W = {"fnb":34,"manufacturing":33,"retail":30,"services":30,"transport":35,"warehouse":30,"scrap":36}

# shots that represent an *observed* volume/inventory/capacity data point — the
# kind whose omission forces a fallback to benchmark in the warning scenario.
CAP_SHOTS = {
    "stock":"stock / inventory photo","storage":"storage / godown photo","cold_room":"cold-chain photo",
    "cold_storage":"cold-store chamber photo","weighbridge":"weighbridge / kanta photo","kanta":"kanta-slip photo",
    "vehicle_fleet":"fleet / vehicle-count photo","machinery":"machinery / plant photo","display":"display / shelf photo",
    "odometer_permit":"odometer / permit photo","event_order_book":"order-book photo","footfall_timed":"timed-footfall clip",
    "dispatch":"dispatch / loading photo","production_floor":"production-floor photo","chairs":"chair / station photo",
    "beds":"bed / capacity photo","fuel_log":"fuel-log photo","stock_racks":"stock-rack photo",
}
SHOT_LABEL = {
    "exterior":"exterior facade","neighbourhood":"neighbourhood / catchment","interior":"interior",
    "kitchen":"kitchen","storage":"storage","machinery":"machinery","qr_code":"UPI/QR",
    "utility_meter":"utility meter","gst_board":"GST board","licence":"licence","udyam":"Udyam",
    "pukka_invoice":"tax invoice","price_board":"rate board","display":"display shelf",
    "weighbridge":"weighbridge","vehicle_fleet":"vehicle fleet","cold_room":"cold room",
}

def money(r):
    r = float(r)
    if r >= 1e7: return "₹%.2f Cr" % (r/1e7)
    if r >= 1e5: return "₹%.1f L" % (r/1e5)
    return "₹%s" % ("{:,.0f}".format(r))

def band_str(lo, hi):
    def num(v, cr): return ("%.1f" % (v/1e7)) if cr else ("%.0f" % (v/1e5))
    lo_cr, hi_cr = lo >= 1e7, hi >= 1e7
    if lo_cr == hi_cr:
        unit = "Cr" if hi_cr else "L"
        return "₹%s–%s %s/mo" % (num(lo, hi_cr), num(hi, hi_cr), unit)
    return "₹%s L–%s Cr/mo" % (num(lo, False), num(hi, True))

def round_nice(v):
    # round to 2 significant figures for a clean headline number
    if v <= 0: return 0
    mag = 10 ** (math.floor(math.log10(v)) - 1)
    return round(v / mag) * mag

def driver_product(drivers):
    p = 1.0
    for dr in drivers:
        p *= float(dr.get("base", 0) or 0)
    return p

out = []
for n, x in enumerate(inds, start=1):
    iid = x["id"]; arch = x["archetype"]
    region = "metro"
    reg = x["registry"].get(region) or list(x["registry"].values())[0]
    drivers = x["drivers"].get(region) or list(x["drivers"].values())[0]
    mrb = x.get("monthlyRevenueBand", {})
    band = mrb.get(region) or (list(mrb.values())[0] if mrb else [500000, 2500000])
    m_lo, m_hi = float(band[0]), float(band[1])
    a_lo, a_hi = m_lo*12, m_hi*12

    # headline annual turnover: prefer driver product when it lands in a sane band,
    # apply a x1000 tonnage fix when needed, else geometric mean of the annual band.
    dp = driver_product(drivers)
    base = None
    for mult in (1, 1000):
        cand = dp*mult
        if a_lo*0.4 <= cand <= a_hi*2.2:
            base = cand; break
    if base is None:
        base = math.sqrt(a_lo*a_hi)
    base = round_nice(base)

    # EBITDA margin ~ gross margin minus opex ratio (operating margin proxy), clamped
    gm = float(reg["gm"][1]); opex = float(reg["opex"][1])
    ebm = max(0.04, min(gm, gm - opex))
    ebitda = base * ebm
    # working-capital requirement via cash-conversion cycle
    ccc = max(5, float(reg.get("dio",0)) + float(reg.get("dso",0)) - float(reg.get("dpo",0)))
    wcr = base/365.0 * ccc
    # loan ticket cap ~ 0.6x monthly turnover, clamped, rounded to a clean lakh figure
    ticket = min(max(base/12.0*0.6, 100000), 3000000)
    ticket_l = max(1, round(ticket/1e5))

    # key driver + primary evidence to acquire (Eq-7 next-best)
    ev = x.get("evidenceItems") or []
    prim = ev[0] if ev else {}
    ev_label = prim.get("label", "the next-best evidence item")
    drv_key = prim.get("driver")
    dmap = {dr["key"]: dr["label"] for dr in drivers}
    drv_label = dmap.get(drv_key, drivers[0]["label"] if drivers else "the primary driver")

    # missing observed data point for the warning scenario: first capacity-type shot
    shots = x.get("shotList", [])
    miss = None
    for s in shots:
        if s in CAP_SHOTS:
            miss = CAP_SHOTS[s]; break
    if miss is None:
        miss = "an observed volume / capacity photo"

    cash_flag = arch == "scrap" or iid in ("vegetable_shop","pan_shop","tea_stall","kirana","tiffin")

    abbr = re.sub(r"[^A-Z]", "", iid.upper())[:3] or iid[:3].upper()
    fixture = "P%02d-%s-%03d" % (n, abbr, n)

    out.append({
        "id": iid, "name": x["name"], "sub": x.get("subtype",""), "arch": arch,
        "archLabel": ARCH_LABEL.get(arch, arch.title()),
        "band": band_str(m_lo, m_hi),
        "ticket": "≤ ₹%d L" % ticket_l,
        "fixture": fixture,
        "base": int(base),
        "ebitdaStr": money(ebitda),
        "wcrStr": money(wcr),
        "evLabel": ev_label, "drvLabel": drv_label,
        "missShot": miss,
        "photoW": PHOTO_W.get(arch, 32),
        "cash": cash_flag,
        "econ": x.get("economics","")[:180],
    })

json.dump(out, open("harness-profiles.json","w"), ensure_ascii=False, indent=0)
print("wrote harness-profiles.json:", len(out), "profiles")
# quick sanity print
for r in out:
    if r["id"] in ("catering","pharmacy","scrap_dealer","goods_transport","kirana","beauty_salon","cold_storage"):
        print("  %-16s base=%-9s ebitda=%-9s wcr=%-9s ticket=%-7s band=%s"
              % (r["id"], money(r["base"]), r["ebitdaStr"], r["wcrStr"], r["ticket"], r["band"]))
