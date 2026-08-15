// Assemble + validate the 56-industry knowledge base from archetype batch files.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";

const DIR = "/home/claude/business-xray/industries";
const files = readdirSync(DIR).filter(f => f.endsWith(".json")).sort();

const ARCHE_FORMULA = {
  retail: "avg ticket × transactions/day × operating days",
  fnb: "seats × turns/day × avg cover × operating days",
  services: "clients(jobs)/day × avg fee × operating days",
  warehouse: "sales per sqft/day × usable area × operating days",
  scrap: "tonnage/day × blended ₹/kg × operating days",
  manufacturing: "units/hr × productive hrs/day × utilisation × price/unit × operating days",
  transport: "vehicles × trips/veh/day × avg realisation × utilisation × operating days",
};
const ARCHE_KEYS = {
  retail: ["ticket","txns","days"],
  fnb: ["seats","turns","cover","days"],
  services: ["clients","fee","days"],
  warehouse: ["psf","area","days"],
  scrap: ["tonnage","price","days"],
  manufacturing: ["uph","hours","util","price","days"],
  transport: ["vehicles","trips","fare","util","days"],
};

const industries = [];
const archetypeDefs = {};
const problems = [];
const warnings = [];
const facetSet = {}; // id -> def (from newFacets)

function chkDrivers(id, band, arr) {
  if (!Array.isArray(arr)) { problems.push(`${id}: drivers.${band} missing/not array`); return; }
  for (const d of arr) {
    if (!(d.lo < d.base && d.base < d.hi))
      problems.push(`${id}: driver ${d.key} ${band} not lo<base<hi (${d.lo},${d.base},${d.hi})`);
  }
}
function chkReg(id, band, r) {
  if (!r) { problems.push(`${id}: registry.${band} missing`); return; }
  const need = ["gm","opex","dio","dso","dpo","eta"];
  for (const k of need) if (r[k] === undefined) problems.push(`${id}: registry.${band}.${k} missing`);
  if (r.gm && r.opex) {
    if (!(r.gm[0] < r.gm[1] && r.gm[1] < r.gm[2])) problems.push(`${id}: registry.${band}.gm not ascending`);
    if (!(r.gm[1] > r.opex[1])) problems.push(`${id}: registry.${band} gm<=opex at base (EBITDA<=0)`);
  }
}

for (const f of files) {
  let arr;
  try { arr = JSON.parse(readFileSync(`${DIR}/${f}`, "utf8")); }
  catch (e) { problems.push(`${f}: JSON parse error — ${e.message}`); continue; }
  if (!Array.isArray(arr)) { problems.push(`${f}: top-level not array`); continue; }
  for (const o of arr) {
    if (o.id === "_archetype_def") { archetypeDefs[o.archetype] = o; continue; }
    // required fields
    for (const k of ["id","name","archetype","registry","drivers","shotList","evidenceItems","occupancy","dataPack","monthlyRevenueBand","varianceNotes"])
      if (o[k] === undefined) problems.push(`${o.id||f}: missing field '${k}'`);
    if (!ARCHE_KEYS[o.archetype]) problems.push(`${o.id}: unknown archetype '${o.archetype}'`);
    chkReg(o.id, "metro", o.registry?.metro);
    chkReg(o.id, "nonmetro", o.registry?.nonmetro);
    chkDrivers(o.id, "metro", o.drivers?.metro);
    chkDrivers(o.id, "nonmetro", o.drivers?.nonmetro);
    // driver key match to archetype
    const want = ARCHE_KEYS[o.archetype] || [];
    const got = (o.drivers?.metro||[]).map(d=>d.key);
    if (want.length && got.join(",") !== want.join(","))
      warnings.push(`${o.id}: driver keys [${got}] differ from archetype ${o.archetype} [${want}]`);
    // evidence items point at real drivers
    const bsNodes = ["dio","dso","dpo"];
    for (const e of (o.evidenceItems||[])) {
      if (!got.includes(e.driver) && !bsNodes.includes(e.driver))
        warnings.push(`${o.id}: evidence '${e.id}' targets non-driver '${e.driver}'`);
      if (bsNodes.includes(e.driver) && e.target !== "balance_sheet")
        warnings.push(`${o.id}: evidence '${e.id}' targets BS node '${e.driver}' but not tagged target=balance_sheet`);
      if (e.narrowPct===undefined||e.q===undefined||e.v===undefined||e.cost===undefined)
        problems.push(`${o.id}: evidence '${e.id}' missing narrowPct/q/v/cost`);
    }
    // collect new facets
    for (const nf of (o.newFacets||[])) if (nf && nf.id && !facetSet[nf.id]) facetSet[nf.id] = nf;
    industries.push(o);
  }
}

// dedupe by id
const byId = {};
for (const o of industries) {
  if (byId[o.id]) problems.push(`duplicate id: ${o.id}`);
  byId[o.id] = o;
}

const archetypesUsed = [...new Set(industries.map(o=>o.archetype))].sort();

const kb = {
  meta: {
    name: "Business X-Ray — 56-Industry Imputation Knowledge Base",
    version: "1.0.0",
    generated: "2026-08-08",
    engineTarget: "worker.js 2.1.0 (SECTORS/REGISTRY/FACETS/rankEvidence)",
    industryCount: industries.length,
    archetypes: archetypesUsed.map(a => ({
      id: a,
      revenueFormula: ARCHE_FORMULA[a],
      driverKeys: ARCHE_KEYS[a],
      isNew: a === "transport",
      def: archetypeDefs[a] || null,
    })),
    bands: ["metro","nonmetro"],
    varianceTarget: "turnover half-width (hi-lo)/2 ≤ 0.20 × base",
  },
  newFacets: Object.values(facetSet),
  industries: industries.sort((a,b)=>a.archetype.localeCompare(b.archetype)||a.id.localeCompare(b.id)),
};

writeFileSync("/home/claude/business-xray/industry-model.json", JSON.stringify(kb, null, 2));

// report
console.log("=== ASSEMBLY REPORT ===");
console.log("files:", files.join(", "));
console.log("industries:", industries.length);
const counts = {};
for (const o of industries) counts[o.archetype]=(counts[o.archetype]||0)+1;
console.log("by archetype:", JSON.stringify(counts));
console.log("new facets:", Object.keys(facetSet).length, "→", Object.keys(facetSet).sort().join(", "));
console.log("PROBLEMS:", problems.length);
problems.forEach(p=>console.log("  ✗", p));
console.log("WARNINGS:", warnings.length);
warnings.slice(0,40).forEach(w=>console.log("  ·", w));
console.log("=== IDS ===");
console.log(industries.map(o=>o.id).sort().join(", "));
