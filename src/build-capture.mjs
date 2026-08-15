// Capture configurator in the Phone Se Loan AI OS format (Stage 4 · Business Analysis).
// LIVE guided capture + per-photo DATA ENHANCEMENT (multimodal AI read: quality · QR · OCR,
// human-in-the-loop confirm, audit log, domain/IRI coverage) — across all 56 industries.
import { readFileSync, writeFileSync } from "node:fs";
import { AIOS_CSS, pslHeader, pslGate } from "./aios-theme.mjs";
const kb = JSON.parse(readFileSync("/home/claude/business-xray/industry-model.json","utf8"));

const titleCase = s => s.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase());
const baseMeta = {
  exterior:{label:"Exterior & signage",shoot:"Full shopfront with name board & shutter",validates:"Business exists at the claimed location; name → GSTIN match",data:"Maps / ONDC presence; name board · key: Business name → GSTIN lookup",feeds:"Anchors the profile & location context"},
  neighbourhood:{label:"Neighbourhood / street context",shoot:"The street & adjacent shops",validates:"Catchment is lively vs desolate → demand plausibility",data:"Street imagery; footfall cues",feeds:"Demand / footfall sanity on turnover"},
  interior:{label:"Full interior / trading floor",shoot:"Wide shot of the whole working area",validates:"Scale & activity state of the premises",data:"Floor area; counters; activity",feeds:"Size band; capacity"},
  qr_code:{label:"UPI / merchant QR",shoot:"The QR standee / soundbox at the counter",validates:"Banked turnover vs total; cash share = residual",data:"UPI VPA (payee address)",feeds:"Banked share of turnover; cash residual"},
  utility_meter:{label:"Utility meter + consumer no.",shoot:"Electricity meter with the consumer number legible",validates:"Energy-based revenue proxy; connected load → size; owned/rented",data:"Consumer number; sanctioned load",feeds:"Energy → turnover proxy; occupancy"},
  gst_board:{label:"GST board / certificate",shoot:"GSTIN board or the GST certificate",validates:"Photo turnover vs GST-filed turnover; unlocks the linkage chain",data:"GSTIN",feeds:"GST-filed turnover; linkage chain"},
  udyam:{label:"Udyam certificate",shoot:"The Udyam registration print/scan",validates:"Vintage, MSME category, declared activity",data:"Udyam registration number",feeds:"Vintage; MSME category"},
  pukka_invoice:{label:"Pukka / tax invoice sample",shoot:"A couple of GST tax invoices",validates:"Average ticket & price; B2B revenue; ties to filings",data:"Invoice amount (₹)",feeds:"Average ticket; B2B revenue"},
  kacha_bill:{label:"Kacha bill / cash ledger",shoot:"The rough cash bill book / day-book",validates:"Cash sales the bank feed misses",data:"Daily cash total",feeds:"Cash sales not in bank feed"},
  price_board:{label:"Price / rate board",shoot:"The rate board or a priced shelf",validates:"Unit / blended price → ticket",data:"Price (₹)",feeds:"Unit / blended price → ticket"},
  machinery:{label:"Machinery + nameplate",shoot:"Each main machine with its capacity nameplate",validates:"Rated capacity → output; asset/collateral value",data:"Rated capacity nameplate",feeds:"Capacity → output; asset value"},
  display:{label:"Display / shelves / stock",shoot:"Stocked shelves and display zones",validates:"Stock density → inventory value → DIO",data:"Stock density",feeds:"Inventory value → DIO"},
  storage:{label:"Storage / godown",shoot:"Back-store / godown stock",validates:"Hidden inventory; storage capacity",data:"Back-store stock",feeds:"Hidden inventory; storage capacity"},
  weighbridge:{label:"Weighbridge / measure point",shoot:"The weighbridge and a slip",validates:"Tonnage / throughput measurement",data:"Net weight",feeds:"Tonnage / throughput"},
  licence:{label:"Trade / FSSAI / factory licence",shoot:"The relevant licence",validates:"Legitimacy & compliance; bounds operating days",data:"Licence number",feeds:"Compliance; operating days"},
  dispatch:{label:"Dispatch bay / register",shoot:"Loading bay and the dispatch register",validates:"Throughput / sales cadence",data:"Dispatch register",feeds:"Throughput / sales cadence"},
};
const extraMeta = {
  credit_ledger:{label:"Customer credit / udhaar ledger",shoot:"The credit-sales register",validates:"Receivables not in bank → DSO",data:"Credit-sales register",feeds:"Receivables → DSO"},
  safe_vault:{label:"Safe / vault",shoot:"The safe or vault (closed)",validates:"High-value stock / cash on hand; collateral",data:"Vault presence",feeds:"High-value stock; collateral"},
  staff_seating:{label:"Staff seats / workstations",shoot:"The desks / workstations in use",validates:"Billable capacity (professional heads)",data:"Workstation count",feeds:"Billable capacity"},
  portfolio_board:{label:"Portfolio / past-work board",shoot:"Portfolio wall or project photos",validates:"Project scale & typical fee",data:"Portfolio scale",feeds:"Project scale; typical fee"},
  engagement_letter:{label:"Engagement letter / contract",shoot:"A client engagement letter",validates:"Retainer/fee level; client tenure",data:"Retainer/fee",feeds:"Fee level; client tenure"},
  fee_schedule:{label:"Fee schedule / rate card",shoot:"The fee schedule",validates:"Average fee",data:"Fee schedule",feeds:"Average fee"},
  receivables_ageing:{label:"Receivables ageing",shoot:"The ageing statement / debtor list",validates:"DSO and collection risk",data:"Ageing statement",feeds:"DSO; collection risk"},
  policy_register:{label:"Policy register",shoot:"The in-force policy register",validates:"Policies in force → commission base",data:"Policies in force",feeds:"Commission base"},
  commission_statement:{label:"Commission statement",shoot:"Insurer/principal commission statement",validates:"Realised commission income",data:"Commission statement",feeds:"Realised commission income"},
  renewal_register:{label:"Renewal register",shoot:"The renewal/AMC register",validates:"Recurring / renewal income",data:"Renewal/AMC register",feeds:"Recurring income"},
  project_wip:{label:"Project WIP / site progress",shoot:"Ongoing site / work-in-progress",validates:"WIP value; milestone billing",data:"Site progress",feeds:"WIP value; milestone billing"},
  deal_register:{label:"Deal / booking register",shoot:"The closed-deal / booking register",validates:"Closed deals → commission",data:"Booking register",feeds:"Closed deals → commission"},
};
const facetMeta = {};
for (const [id,m] of Object.entries(baseMeta)) facetMeta[id]=m;
for (const [id,m] of Object.entries(extraMeta)) facetMeta[id]=m;
for (const f of kb.newFacets) if(!facetMeta[f.id]) facetMeta[f.id]={label:titleCase(f.id),shoot:f.output||"",validates:f.validates||"",data:f.output||"",feeds:f.validates||""};

// facets whose frames typically contain people or number plates → privacy crop reminder
const PRIVACY = ["exterior","neighbourhood","dispatch","weighbridge"];
// facets intentionally OUTSIDE the establishment boundary → graded for neighbourhood / catchment quality
const OUTSIDE = ["exterior","neighbourhood"];

// verification-domain coverage per facet (drives the IRI / domains counter, like the old engine)
const DOMAINS = {
  exterior:["identity","location"], neighbourhood:["location","demand"], interior:["activity"],
  qr_code:["banking"], utility_meter:["energy","occupancy"], gst_board:["compliance","turnover"],
  udyam:["compliance"], pukka_invoice:["turnover","pricing"], kacha_bill:["cash"], price_board:["pricing"],
  machinery:["capacity","assets"], display:["inventory"], storage:["inventory"], weighbridge:["throughput"],
  licence:["compliance"], dispatch:["throughput"], credit_ledger:["receivables"], safe_vault:["assets"],
  staff_seating:["capacity"], portfolio_board:["scale"], engagement_letter:["contracts"], fee_schedule:["pricing"],
  receivables_ageing:["receivables"], policy_register:["income"], commission_statement:["income"],
  renewal_register:["recurring"], project_wip:["wip"], deal_register:["income"],
};
const DOMAIN_LABEL = {identity:"Identity",location:"Location",demand:"Demand",activity:"Activity",banking:"Banking",energy:"Energy",occupancy:"Occupancy",compliance:"Compliance",turnover:"Turnover",pricing:"Pricing",cash:"Cash",capacity:"Capacity",assets:"Assets",inventory:"Inventory",throughput:"Throughput",receivables:"Receivables",contracts:"Contracts",scale:"Scale",income:"Income",recurring:"Recurring",wip:"WIP"};

const ARCHE={retail:"Retail / kirana",fnb:"Food & beverage",services:"Services",warehouse:"Warehouse / distribution",scrap:"Scrap trading",manufacturing:"Light manufacturing",transport:"Transport / logistics"};
const CAT={
  exterior:"Outside",neighbourhood:"Outside",interior:"Inside",display:"Inside",storage:"Inside",machinery:"Inside",
  qr_code:"Counter",price_board:"Counter",kacha_bill:"Counter",credit_ledger:"Counter",safe_vault:"Counter",
  gst_board:"Document",udyam:"Document",licence:"Document",pukka_invoice:"Document",fee_schedule:"Document",
  engagement_letter:"Document",commission_statement:"Document",receivables_ageing:"Document",policy_register:"Document",
  renewal_register:"Document",deal_register:"Document",utility_meter:"Utility",weighbridge:"Yard",dispatch:"Yard",
  staff_seating:"Inside",portfolio_board:"Inside",project_wip:"Site",
};
const data = kb.industries.map(o=>({
  id:o.id,name:o.name,arch:o.archetype,subtype:o.subtype||"",economics:o.economics||"",
  shotList:o.shotList, drivers:o.drivers,
  evidence:(o.evidenceItems||[]).map(e=>({label:e.label,driver:e.driver,narrowPct:e.narrowPct,cls:e.cls,note:e.note,target:e.target||null})),
  dataPack:o.dataPack||[], occupancy:o.occupancy||{},
}));
const dataById = Object.fromEntries(data.map(d=>[d.id,d]));
const groups={}; for(const d of data){ (groups[d.arch]=groups[d.arch]||[]).push(d); }
const optionHtml = Object.keys(ARCHE).filter(a=>groups[a]).map(a=>
  `<optgroup label="${ARCHE[a]}">`+groups[a].sort((x,y)=>x.name.localeCompare(y.name)).map(d=>`<option value="${d.id}">${d.name}</option>`).join("")+`</optgroup>`).join("");

const EXTRA_CSS = `
.btn{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:600;border:1px solid var(--brand);background:var(--brand);color:#fff;border-radius:8px;padding:9px 14px;cursor:pointer;text-decoration:none;line-height:1}
.btn:hover{background:var(--brand-ink);border-color:var(--brand-ink)}
.btn.ghost{background:#fff;color:var(--ink);border-color:var(--line)}
.btn.ghost:hover{border-color:#c9d2e6}
.btn.sm{padding:6px 10px;font-size:12px}
.btn:disabled{opacity:.5;cursor:not-allowed}
.dropzone{min-height:300px;border:2px dashed var(--line);border-radius:12px;display:grid;place-items:center;text-align:center;color:var(--dim);background:#fbfcff;padding:16px}
.shot{width:100%;max-height:360px;object-fit:cover;border-radius:12px;border:1px solid var(--line);display:block}
.film{display:flex;gap:5px;flex-wrap:wrap;margin:12px 0 0}
.film i{width:28px;height:6px;border-radius:3px;background:var(--line);display:inline-block}
.film i.done{background:var(--brand)}
.film i.cur{background:var(--brand);box-shadow:0 0 0 2px #bcd0ff}
.film i.skip{background:#cfd7e6}
.thumb{border:1px solid var(--line);border-radius:9px;padding:7px;background:#fff}
.thumb img{width:100%;height:96px;object-fit:cover;border-radius:6px;display:block}
.thumb .cap{font-size:11.5px;margin-top:5px;color:var(--ink)}
.thumb .val{font-size:11px;margin-top:2px}
.disclaimer{font-size:11.5px;color:var(--warn);background:var(--warnbg);border:1px solid #f0e2c4;border-radius:8px;padding:8px 10px}
.locknote{font-size:12px;color:var(--mut);border:1px dashed var(--line);border-radius:8px;padding:8px 10px;margin-top:10px}
.exwrap{margin-top:10px;border:1px solid #bcd0ff;background:#f7faff;border-radius:10px;padding:11px}
.exwrap .exhead{display:flex;align-items:center;gap:8px;margin-bottom:6px}
.exwrap .exhead b{font-size:12.5px}
.exfield input{width:100%;background:#fff;border:1px solid var(--line);color:var(--ink);border-radius:8px;padding:7px 9px;font-family:var(--mono);font-size:13px}
.spin{width:14px;height:14px;border:2px solid #cfd7e6;border-top-color:var(--brand);border-radius:50%;display:inline-block;animation:spin .8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.inp{width:100%;background:#fff;border:1px solid var(--line);color:var(--ink);border-radius:8px;padding:9px 11px;font-size:14px}
.inp:focus{outline:2px solid #bcd0ff;border-color:var(--brand)}
.chk{display:flex;gap:9px;align-items:flex-start;margin:9px 0;font-size:12.5px;color:var(--ink);line-height:1.45}
.chk input{margin-top:2px}
.otp{font-family:var(--mono);font-size:18px;letter-spacing:3px;text-align:center}
.sandbox{border:1px dashed var(--warn);background:var(--warnbg);border-radius:9px;padding:10px 12px;font-size:12.5px;color:var(--warn)}
.otpcode{font-family:var(--mono);font-size:16px;font-weight:700;letter-spacing:2px;color:var(--ink)}
.gk{display:block;color:var(--mut);font-size:11px;text-transform:uppercase;letter-spacing:.5px;margin:0 0 5px;font-weight:700}
`;

const html=`<!doctype html><html lang="en"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Phone Se Loan — Business Analysis (Business X-Ray Capture)</title>
<style>${AIOS_CSS}${EXTRA_CSS}</style></head><body>
${pslGate("1504")}
${pslHeader("Stage 4 · Business Analysis", "Guided capture · CAM §4 Business &amp; banking assessment · photos live-captured inside the Mitra-marked geofence (CPV-verified later)")}
<nav class="psl-nav"><div class="wrap">
  <a class="tab active" href="/capture">Capture</a>
  <a class="tab" href="/industries">Industry Models</a>
  <a class="tab" href="/app">Assessment</a>
  <a class="tab" href="/data-backbone">Data Backbone</a>
  <a class="tab" href="/app#/governance">Governance</a>
</div></nav>

<main><div class="wrap">
<section>
  <h1>Business Analysis — guided capture</h1>
  <p class="lead">Pick the borrower's business profile, then capture the photos one at a time — live from inside the Mitra-marked geofence. Each shot is <b>AI-read on the spot</b> (image quality · QR · OCR), a human confirms the value, and it feeds the CAM Business &amp; banking assessment. Nothing is uploaded; every read and edit is logged.</p>

  <div class="card" style="margin-top:14px">
    <div class="toolbar">
      <div style="min-width:280px;flex:1">
        <label class="k" style="display:block;color:var(--mut);font-size:11px;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;font-weight:700">Business profile</label>
        <select id="ind" class="select" style="width:100%">
          <option value="">— Select an industry (56) —</option>
          ${optionHtml}
        </select>
      </div>
      <div>
        <label class="k" style="display:block;color:var(--mut);font-size:11px;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;font-weight:700">Location band</label>
        <span class="pill on" data-band="metro">Metro</span>
        <span class="pill" data-band="nonmetro">Non-metro</span>
      </div>
    </div>
    <div class="callout ext" style="margin:14px 0 4px">
      <b style="color:var(--ext)">◉ Capture integrity — Mitra-marked geofence.</b>
      The Mitra establishes the business on-site: all photos are <b>live-captured</b> (camera only, no gallery), in a <b>single session</b>, from <b>inside the same establishment</b>, and the Mitra <b>marks the business's GPS boundary</b> during the visit. Each frame is geotagged + timestamped and must fall within that marked boundary; frames out of sequence, or with device/EXIF/reuse anomalies are <b>rejected and re-prompted</b>. The <b>street / neighbourhood shots are the intended exception</b> — they are deliberately taken outside the boundary and graded for <b>locality / catchment quality</b> rather than rejected. The marked boundary is then <b>independently verified later by the CPV agent</b> — a downstream check, not the capture-time source.
    </div>
  </div>

  <div id="out" style="margin-top:14px"><div class="empty"><div><div style="font-size:34px">📷</div><div style="margin-top:8px">Select a business profile to start the guided capture</div></div></div></div>
</section>
</div></main>

<footer class="footer"><div class="wrap">
  Phone Se Loan AI Operating System · Business X-Ray (Business Analysis stage) · illustrative rule-engine outputs on sample-grounded ranges. Loan approval &amp; disbursement are human-only; the model extracts and recommends.
</div></footer>

<script>
const DATA=${JSON.stringify(dataById)};
const FACET=${JSON.stringify(facetMeta)};
const ARCHE=${JSON.stringify(ARCHE)};
const CAT=${JSON.stringify(CAT)};
const DOMAINS=${JSON.stringify(DOMAINS)};
const DOMAIN_LABEL=${JSON.stringify(DOMAIN_LABEL)};
const PRIVACY=new Set(${JSON.stringify(PRIVACY)});
const OUTSIDE=new Set(${JSON.stringify(OUTSIDE)});
const NEIGH_GRADES=[['prime','Prime',1.0],['good','Good',0.8],['fair','Fair',0.55],['weak','Weak',0.35]];
const esc=s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const scale=(a,k)=>(a==="scrap"&&k==="tonnage")?1000:1;
const fmt=n=> n==null?"—": Math.abs(n)>=1e7?"₹"+(n/1e7).toFixed(2)+" Cr":Math.abs(n)>=1e5?"₹"+(n/1e5).toFixed(2)+" L":"₹"+Math.round(n).toLocaleString("en-IN");
function rev(o,band){let lo=1,base=1,hi=1;for(const d of (o.drivers[band]||[])){const s=scale(o.arch,d.key);lo*=d.lo*s;base*=d.base*s;hi*=d.hi*s;}return{lo,base,hi};}
function narrow(o,band){const ds=JSON.parse(JSON.stringify(o.drivers[band]||[]));const m=Object.fromEntries(ds.map(d=>[d.key,d]));for(const e of o.evidence){if(e.target==="balance_sheet")continue;const d=m[e.driver];if(!d)continue;const h=d.base*e.narrowPct;d.lo=Math.max(d.lo,d.base-h);d.hi=Math.min(d.hi,d.base+h);}let lo=1,base=1,hi=1;for(const d of ds){const s=scale(o.arch,d.key);lo*=d.lo*s;base*=d.base*s;hi*=d.hi*s;}return{lo,base,hi};}
function paramLabel(o,band,key){const d=(o.drivers[band]||[]).find(x=>x.key===key);return d?d.label:key;}
function facetDomains(fid){ return DOMAINS[fid]||["activity"]; }

/* ================= ADAPTIVE HARNESS ================= */
/* Config (locked with the field team): 10 required slots per profile (the shot
 * list), extensible to a hard cap of 20 when the loop asks for more; stop when
 * the revenue interval is within ±20% of base; questions go to the customer only
 * (recorded as Claims); the Business X-Ray estimate is the system of record —
 * the Mitra adds parallel notes, never overrides it. */
const TARGET_HALFWIDTH=0.20;   // ±20% of base = "tight enough to stop"
const CAP_MAX=20;              // hard photo cap per visit
const QMIN=2.5;                // image-quality score (1–5) below which we re-capture
const CONF_MIN=0.45;           // read-confidence below which we zoom on the detail
const A_FLOOR=0.01;            // next-evidence score floor — below this nothing is worth the time

// value keys (mirror the assessment engine) — which driver a numeric read moves
const PRICE_KEYS=['ticket','price','cover','fee','avg_fee','uv','unitprice','rate','psf'];
const VOL_KEYS=['txns','clients','footfall','seats','turns','units','uph','trips','loads','members','patients','policies','deals','area','sqft','tonnage'];
// which captured facet's AI-read supplies a price / volume / tonnage number
const PRICE_FACETS=['price_board','pukka_invoice','fee_schedule','menu_board'];
const VOL_FACETS=['footfall_timed','storage','occupancy_gauge'];
const IDENTITY_FACETS=['exterior','neighbourhood','gst_board','udyam','rental_agreement','interior'];

// map an evidence item to the photo (facet) that provides it, so narrowing only
// fires for evidence whose photo was actually captured
const EV_KW=[
 [/weigh|tonnage|slip/i,'weighbridge'],[/z-?report|day-?book|pos|bill count|transactions|txn/i,'kacha_bill'],
 [/footfall|occupanc|peak/i,'footfall_timed'],[/fee schedule|rate card|fee board/i,'fee_schedule'],
 [/price|rate board|menu|tariff/i,'price_board'],[/invoice|tax bill/i,'pukka_invoice'],
 [/gstin|gst filing|gst return/i,'gst_board'],[/udyam/i,'udyam'],
 [/machine|nameplate|capacity|counter reading|shift|output/i,'machinery'],[/dispatch|loading|throughput|stock-?turn/i,'dispatch'],
 [/area|floor|sq ?ft|usable/i,'storage'],[/stock|inventory|sku|shelf|display/i,'display'],
 [/godown|back-?store/i,'storage'],[/credit|udhaar|receivable|ageing|debtor|khata/i,'credit_ledger'],
 [/appointment|job register|booking|deal register/i,'deal_register'],[/policy/i,'policy_register'],
 [/renewal|amc/i,'renewal_register'],[/commission/i,'commission_statement'],
 [/engagement|contract|retainer/i,'engagement_letter'],[/portfolio|past-?work/i,'portfolio_board'],
 [/wip|site progress|milestone/i,'project_wip'],[/licence|license|operating days/i,'licence'],
 [/upi|qr|banked|bank credit/i,'qr_code'],[/meter|energy|kwh|consumption|electric/i,'utility_meter'],
 [/seat/i,'interior'],[/rent|lease|deposit/i,'rental_agreement'],
];
function evFacet(o,e){ const t=((e.label||'')+' '+(e.note||'')).toLowerCase();
  for(const [re,f] of EV_KW){ if(re.test(t)&&o.shotList.includes(f)) return f; }
  for(const [re,f] of EV_KW){ if(re.test(t)) return f; }
  return o.shotList.find(f=>!IDENTITY_FACETS.includes(f))||o.shotList[0]; }
function readNum(fid){ const ex=S.ext[fid]; if(!ex||ex.value==null||ex.value==='') return NaN;
  const n=parseFloat(String(ex.value).replace(/[^0-9.]/g,'')); return isFinite(n)?n:NaN; }
function readConf(fid){ const ex=S.ext[fid]; return ex?(ex.confidence||0):0; }
function qScore(fid){ const ex=S.ext[fid]; return (ex&&ex.quality)?ex.quality.score:null; }

// Live evidence-graph estimate: recentre driver bases from the customer's actual
// AI-read values, then narrow every driver whose evidence photo was captured.
// The extra arg (a Set of facet ids) is treated as captured for narrowing only,
// used by the next-best simulation to score an as-yet-uncaptured photo.
function liveEstimate(o, extra){
  const band=S.band, ds=o.drivers[band]||[];
  const D={}; ds.forEach(d=>D[d.key]={key:d.key,label:d.label,unit:d.unit||'',cls:d.cls,lo:d.lo,base:d.base,hi:d.hi});
  const prior={}; for(const k in D) prior[k]=D[k].base;
  const captured=new Set(Object.keys(S.cap)); if(extra) extra.forEach(f=>captured.add(f));
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const setBase=(d,val)=>{ if(!(val>0))return; const rl=d.lo/d.base,rh=d.hi/d.base; d.base=val; d.lo=val*rl; d.hi=val*rh; };
  const pick=keys=>{ for(const k of keys) if(D[k]) return k; return null; };
  const narrowed={}, recentred={};
  // (a) recentre base to the customer's read (only for actually-captured facets, never the simulated one)
  const pk=pick(PRICE_KEYS);
  if(pk){ for(const f of PRICE_FACETS){ if(S.cap[f]){ const v=readNum(f); if(isFinite(v)&&v>0){ setBase(D[pk],clamp(v,prior[pk]*0.3,prior[pk]*3)); narrowed[pk]=true; recentred[pk]=true; break; } } } }
  const vk=pick(VOL_KEYS);
  if(vk){ for(const f of VOL_FACETS){ if(S.cap[f]){ const v=readNum(f); if(isFinite(v)&&v>0){ setBase(D[vk],clamp(v,prior[vk]*0.3,prior[vk]*3)); narrowed[vk]=true; recentred[vk]=true; break; } } } }
  if(D.tonnage && S.cap.weighbridge){ const v=readNum('weighbridge'); if(isFinite(v)&&v>0){ setBase(D.tonnage,clamp(v,prior.tonnage*0.3,prior.tonnage*3)); narrowed.tonnage=true; recentred.tonnage=true; } }
  // (b) narrow drivers whose evidence photo is captured (or simulated)
  o.evidence.forEach(e=>{ if(e.target==='balance_sheet')return; const fid=evFacet(o,e); if(fid&&captured.has(fid)){ const d=D[e.driver]; if(d){ const h=d.base*(e.narrowPct||0.08); d.lo=Math.max(d.lo,d.base-h); d.hi=Math.min(d.hi,d.base+h); narrowed[e.driver]=true; } } });
  // (c) customer Claims (softer than a photo — recentre if no observation, and only a ±25% narrow)
  const claimed={};
  for(const dk in (S.ask||{})){ const v=parseFloat(String(S.ask[dk].value).replace(/[^0-9.]/g,''));
    if(D[dk]&&isFinite(v)&&v>0){ if(!recentred[dk]) setBase(D[dk],clamp(v,prior[dk]*0.3,prior[dk]*3));
      const h=D[dk].base*0.25; D[dk].lo=Math.max(D[dk].lo,D[dk].base-h); D[dk].hi=Math.min(D[dk].hi,D[dk].base+h); narrowed[dk]=true; claimed[dk]=true; } }
  let lo=1,base=1,hi=1; for(const k in D){ const s=scale(o.arch,k); lo*=D[k].lo*s; base*=D[k].base*s; hi*=D[k].hi*s; }
  const relW={}; for(const k in D) relW[k]= D[k].base>0?(D[k].hi-D[k].lo)/D[k].base:0;
  return { D, rev:{lo,base,hi}, relWidth:base>0?(hi-lo)/base:0, halfWidth:base>0?((hi-lo)/2)/base:0, narrowed, recentred, claimed, relW }; }

// per-facet expected quality / audit-value / operator-cost for the Eq-7 score
function facetCost(fid){ const c=CAT[fid]||'Inside'; return c==='Document'?1.6:c==='Yard'?2:c==='Site'?2:c==='Utility'?1.2:1; }
function facetValue(o,fid){ const tiesDriver=o.evidence.some(e=>e.target!=='balance_sheet'&&evFacet(o,e)===fid);
  return tiesDriver?0.9:(IDENTITY_FACETS.includes(fid)?0.45:0.6); }
function expQuality(fid){ // nudge down if a same-category shot already scored poorly
  const c=CAT[fid]; let q=0.85; for(const f in S.ext){ if(CAT[f]===c){ const s=qScore(f); if(s!=null&&s<QMIN) q=0.6; } } return q; }

// Feedback loop: rank every uncaptured facet by A_j = ΔW · q · v / (cost+ε)
function nextBest(o){
  const base=liveEstimate(o);
  const capt=new Set(Object.keys(S.cap));
  const cands=o.shotList.filter(fid=>!capt.has(fid)&&!S.skip[fid]);
  const scored=cands.map(fid=>{
    const sim=liveEstimate(o,new Set([fid]));
    const dW=Math.max(0, base.relWidth - sim.relWidth);
    const q=expQuality(fid), v=facetValue(o,fid), cost=facetCost(fid);
    const A=(dW>0?dW:0.002)*q*v/(cost+0.1);   // coverage shots keep a tiny score so identity still gets taken
    return {fid, A, dW, q, v, cost, expHalf:sim.halfWidth};
  }).sort((a,b)=>b.A-a.A);
  return {base, scored}; }

// Stopping rule → {stop:bool, reason, escalate:bool}
function stopState(o){
  const nb=nextBest(o); const hw=nb.base.halfWidth; const nCap=Object.keys(S.cap).length;
  const openReq=o.shotList.filter(fid=>!S.cap[fid]&&!S.skip[fid]).length;
  const bestA=nb.scored.length?nb.scored[0].A:0;
  if(hw<=TARGET_HALFWIDTH && nCap>0) return {stop:true, escalate:false, reason:'Target reached — estimate within ±'+Math.round(TARGET_HALFWIDTH*100)+'%.', nb};
  if(nCap>=CAP_MAX) return {stop:true, escalate:hw>TARGET_HALFWIDTH, reason:'Photo cap ('+CAP_MAX+') reached.', nb};
  if(openReq===0) return {stop:true, escalate:hw>TARGET_HALFWIDTH, reason:'All required photos captured or skipped.', nb};
  if(bestA<A_FLOOR) return {stop:true, escalate:hw>TARGET_HALFWIDTH, reason:'No remaining photo meaningfully tightens the estimate.', nb};
  return {stop:false, escalate:false, reason:'', nb}; }

/* ---- per-facet field the AI reads (data-enhancement step g(·)) ---- */
const FEX={
  exterior:{field:'business_name',label:'Business name',type:'text'},
  qr_code:{field:'upi_vpa',label:'UPI VPA (payee address)',type:'qr'},
  utility_meter:{field:'consumer_no',label:'Electricity consumer number',type:'num'},
  gst_board:{field:'gstin',label:'GSTIN',type:'gstin'},
  udyam:{field:'udyam_no',label:'Udyam registration number',type:'udyam'},
  pukka_invoice:{field:'invoice_amt',label:'Invoice amount (₹)',type:'amount'},
  price_board:{field:'price',label:'Price (₹)',type:'amount'},
  weighbridge:{field:'weight',label:'Net weight',type:'text'},
  licence:{field:'licence_no',label:'Licence number',type:'text'},
  kacha_bill:{field:'cash_total',label:'Daily cash total (₹)',type:'amount'},
  fee_schedule:{field:'avg_fee',label:'Average fee (₹)',type:'amount'},
  footfall_timed:{field:'footfall',label:'People counted in a 10-min window',type:'num'},
  storage:{field:'area',label:'Usable area (sq ft)',type:'num'},
  occupancy_gauge:{field:'area',label:'Utilised area / capacity (sq ft)',type:'num'},
};
let _tessP=null;
function loadTesseract(){ if(window.Tesseract) return Promise.resolve(window.Tesseract);
  if(_tessP) return _tessP;
  _tessP=new Promise((res,rej)=>{ const sc=document.createElement('script');
    sc.src='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    sc.onload=()=>res(window.Tesseract); sc.onerror=()=>rej(new Error('OCR engine unavailable')); document.head.appendChild(sc); });
  return _tessP; }
function imgQuality(file){ return new Promise((resolve)=>{ const img=new Image();
  img.onload=()=>{ try{ const w=240,h=Math.max(1,Math.round(img.height*(240/img.width)));
    const c=document.createElement('canvas'); c.width=w;c.height=h; const ctx=c.getContext('2d'); ctx.drawImage(img,0,0,w,h);
    const d=ctx.getImageData(0,0,w,h).data; const g=new Float64Array(w*h);
    for(let i=0;i<w*h;i++) g[i]=0.299*d[i*4]+0.587*d[i*4+1]+0.114*d[i*4+2];
    let mean=0,n=0; const L=[]; for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){ const i=y*w+x; const v=4*g[i]-g[i-1]-g[i+1]-g[i-w]-g[i+w]; L.push(v); mean+=v; n++; }
    mean/=n||1; let vv=0; for(const v of L) vv+=(v-mean)*(v-mean); vv/=n||1;
    const score=Math.max(1,Math.min(5, 1+(Math.log10(Math.max(vv,1))-1)*(4/2.7)));
    resolve({score:Math.round(score*10)/10, sharpness:Math.round(vv)}); }catch(_){ resolve(null); } };
  img.onerror=()=>resolve(null); img.src=URL.createObjectURL(file); }); }
async function ocr(file){ const T=await loadTesseract(); const url=URL.createObjectURL(file);
  try{ const {data}=await T.recognize(url,'eng'); return {text:data.text||'', conf:(data.confidence||0)/100}; }
  finally{ try{URL.revokeObjectURL(url);}catch(_){} } }
function extractField(text,type){ const t=(text||''); const clean=t.replace(/\\s/g,'');
  if(type==='gstin'){
    let m=clean.match(/\\d{2}[A-Z]{5}\\d{4}[A-Z]\\d[Z][A-Z\\d]/i); if(m) return {value:m[0].toUpperCase(), conf:0.9};
    let lm=clean.match(/GSTIN[:\\-]?([0-9A-Z]{13,15})/i); if(lm) return {value:lm[1].toUpperCase(), conf:0.55};
    let gm=clean.match(/\\b[0-9A-Z]{15}\\b/); if(gm) return {value:gm[0].toUpperCase(), conf:0.5};
    return {value:'', conf:0}; }
  if(type==='udyam'){ let m=t.match(/UDYAM-?[A-Z]{2}-?\\d{2}-?\\d{7}/i); if(m) return {value:m[0].toUpperCase(), conf:0.85};
    let lm=t.match(/UDYAM[^\\n]{0,30}/i); return {value:lm?lm[0].replace(/\\s+/g,''):'', conf:lm?0.5:0}; }
  if(type==='amount'){ const m=t.match(/(?:₹|rs\\.?|inr|total|amount)\\s*[:\\-]?\\s*([\\d,]{2,})/i)||t.match(/\\b([\\d,]{3,})\\b/); return {value:m?m[1].replace(/,/g,''):'', conf:m?0.6:0}; }
  if(type==='num'){ const lm=t.match(/(?:consumer|meter|account|no|number)\\D{0,6}(\\d{6,})/i); if(lm) return {value:lm[1], conf:0.75};
    const m=t.match(/\\b\\d{6,}\\b/); return {value:m?m[0]:'', conf:m?0.65:0}; }
  const line=(t.split(/\\n/).map(s=>s.trim()).filter(s=>s.length>2)[0]||''); return {value:line, conf:line?0.5:0}; }
async function aiRead(file, fid){ const spec=FEX[fid]; const res={quality:null, value:'', confidence:0, source:'', raw:''};
  res.quality=await imgQuality(file);
  if(!spec){ res.source='image quality'; return res; }
  if(spec.type==='qr' && ('BarcodeDetector' in window)){
    try{ const bmp=await createImageBitmap(file); const det=new BarcodeDetector({formats:['qr_code']}); const codes=await det.detect(bmp);
      if(codes&&codes.length){ const rv=codes[0].rawValue||''; const m=rv.match(/[a-z0-9._-]+@[a-z]+/i);
        res.value=m?m[0]:rv; res.confidence=0.98; res.source='QR decode (BarcodeDetector)'; return res; } }catch(_){}
  }
  try{ const {text,conf}=await ocr(file); res.raw=text; const ex=extractField(text, spec.type);
    res.value=ex.value; res.confidence=ex.value?Math.max(conf, ex.conf):conf; res.source='OCR (Tesseract.js)'+(ex.value?' + pattern match':''); }
  catch(e){ res.source='manual entry'; res.error=String(e&&e.message||e); }
  return res; }

// ---- session state ----
const S={id:null,step:0,band:"metro",cap:{},skip:{},ext:{},busy:{},audit:[],
  ask:{},mitraNotes:{},askDraft:{},stopReason:'',neigh:{},
  gate:{passed:false,mitra:'',cust:'',biz:'',consentCust:false,consentTC:false,sent:false,codeM:'',codeC:'',err:''},
  consent:null};
function reset(id){ for(const k in S.cap){ try{URL.revokeObjectURL(S.cap[k].url);}catch(_){} }
  S.id=id; S.step=0; S.cap={}; S.skip={}; S.ext={}; S.busy={}; S.audit=[]; S.ask={}; S.mitraNotes={}; S.askDraft={}; S.stopReason=''; S.neigh={}; }  // gate/consent persist for the session

// Neighbourhood / catchment quality from the outside-the-establishment shots
function neighSummary(){
  const shots=Object.keys(S.cap).filter(f=>OUTSIDE.has(f));
  let sum=0,gc=0; shots.forEach(f=>{ const e=NEIGH_GRADES.find(x=>x[0]===S.neigh[f]); if(e){ sum+=e[2]; gc++; } });
  const qs=shots.map(f=>qScore(f)).filter(v=>v!=null); const qAvg=qs.length?qs.reduce((a,b)=>a+b,0)/qs.length:null;
  const gradeScore=gc?sum/gc:null;
  const label=gradeScore==null?null:(gradeScore>=0.9?'Prime':gradeScore>=0.7?'Good':gradeScore>=0.5?'Fair':'Weak');
  return { shots:shots.length, graded:gc, gradeScore, label, qAvg }; }
function neighBlock(fid){ if(!OUTSIDE.has(fid)) return '';
  const cur=S.neigh[fid]||'', q=qScore(fid);
  return '<div class="exwrap" style="border-color:#cdd8ef;background:#f7faff;margin-top:10px"><div class="exhead"><b>📍 Neighbourhood / locality quality</b><span class="spacer"></span><span class="tag External">outside boundary</span></div>'
    +'<p class="small dim" style="margin:0 0 6px">This shot is taken <b>outside the establishment</b> (the intended exception to the geofence, not rejected) — grade the catchment that bounds demand plausibility.'+(q!=null?' Image quality '+q+'/5.':'')+'</p>'
    +'<div style="display:flex;gap:7px;flex-wrap:wrap">'+NEIGH_GRADES.map(g=>'<span class="pill'+(cur===g[0]?' on':'')+'" data-neigh="'+fid+'" data-grade="'+g[0]+'">'+g[1]+'</span>').join('')+'</div></div>'; }

// Customer-answered questions (Claims) for values no photo can show. Keyed by driver.
const ASK_Q={
  ticket:'On a normal day, what is the typical bill / ticket value (₹)?',
  price:'What is the typical selling price per unit (₹)?', cover:'What is the average spend per customer / cover (₹)?',
  fee:'What is your typical fee per job / client (₹)?', avg_fee:'What is your average professional fee (₹)?',
  txns:'On a normal day, roughly how many bills / customers?', clients:'On a normal day, roughly how many jobs / clients?',
  footfall:'On a normal day, roughly how many customers walk in?', seats:'How many seats / covers can you serve at once?',
  turns:'How many times do the seats turn over on a busy day?', patients:'On a normal day, roughly how many patients?',
  members:'How many active members do you have?', policies:'How many policies are currently in force?',
  deals:'How many deals do you typically close in a month?', units:'Roughly how many units do you make per hour?',
  uph:'Roughly how much output per hour (units/kg)?', tonnage:'Roughly how many tonnes do you handle per day?',
  area:'What is the usable area of the premises (sq ft)?', psf:'What monthly rent per sq ft do you charge/pay (₹)?',
  days:'How many days in a year is the business open?'
};
function askQ(dk){ return ASK_Q[dk]||('What is the typical value for '+dk+'?'); }

// ===== Consent & dual-OTP gate (SANDBOX) =====
// Production swaps genOtp/sendOtps for a backend call: POST /api/otp/send -> Twilio Verify
// sends two DISTINCT OTPs (Mitra + Customer) over DLT-registered SMS; codes never returned to the client.
const SANDBOX=true;
function genOtp(){ return String(Math.floor(100000+Math.random()*900000)); }
function validPhone(p){ return /^[6-9][0-9]{9}$/.test(String(p||'').replace(/\\D/g,'')); }
async function sendOtps(){
  const g=S.gate; g.err='';
  if(!validPhone(g.mitra)){ g.err='Enter a valid 10-digit Mitra mobile number.'; return render(); }
  if(!validPhone(g.cust)){ g.err='Enter a valid 10-digit Customer mobile number.'; return render(); }
  if(!g.consentCust){ g.err='The customer must consent to the information capture.'; return render(); }
  if(!g.consentTC){ g.err='The Mitra must accept the Terms & compliance declaration.'; return render(); }
  // SANDBOX: generate two distinct OTPs locally. Production: await fetch('/api/otp/send',{method:'POST',body:JSON.stringify({mitra:g.mitra,cust:g.cust,profile:S.id})});
  g.codeM=genOtp(); g.codeC=genOtp(); while(g.codeC===g.codeM){ g.codeC=genOtp(); }
  g.sent=true; g.entM=''; g.entC=''; render();
}
function verifyOtps(){
  const g=S.gate; g.err='';
  const em=String(g.entM||'').trim(), ec=String(g.entC||'').trim();
  // SANDBOX check. Production: POST /api/otp/verify -> {ok:true} only if both codes match server-side.
  if(em!==g.codeM || ec!==g.codeC){ g.err='OTP mismatch. Re-enter the two codes sent to the Mitra and the Customer.'; return render(); }
  g.passed=true;
  S.consent={ profile:S.id, mitraPhone:g.mitra, customerPhone:g.cust, business:g.biz||'',
    customerConsent:true, termsAccepted:true, method:'dual-OTP', channel:(SANDBOX?'sandbox':'sms'),
    at:new Date().toISOString() };
  render();
}
function gateView(o){
  const g=S.gate;
  const sentBlock = g.sent ? (
    (SANDBOX?'<div class="sandbox" style="margin:10px 0"><b>SANDBOX mode.</b> Two distinct OTPs were generated in-browser to simulate the SMS sent to each party. In production these go over DLT-registered SMS via Twilio and are never shown here.<div style="margin-top:6px">Mitra OTP: <span class="otpcode">'+g.codeM+'</span> &nbsp;·&nbsp; Customer OTP: <span class="otpcode">'+g.codeC+'</span></div></div>':'')
    +'<div class="grid cols-2" style="margin-top:6px">'
    +'<div><label class="gk">Mitra OTP</label><input class="inp otp" id="otpM" maxlength="6" inputmode="numeric" placeholder="______" value="'+esc(g.entM||'')+'"/></div>'
    +'<div><label class="gk">Customer OTP</label><input class="inp otp" id="otpC" maxlength="6" inputmode="numeric" placeholder="______" value="'+esc(g.entC||'')+'"/></div>'
    +'</div>'
    +'<div class="toolbar" style="margin-top:12px"><button class="btn" id="verify">✓ Verify &amp; start Business X-Ray</button><button class="btn ghost" id="resend">Resend OTPs</button></div>'
  ) : '<div class="toolbar" style="margin-top:12px"><button class="btn" id="send">Send OTPs to Mitra &amp; Customer</button></div>';

  return '<div class="card">'
    +'<div class="toolbar"><h2 style="margin:0">Consent &amp; verification</h2><span class="spacer"></span><span class="pill on">'+esc(o.name)+'</span></div>'
    +'<p class="note" style="margin:6px 0 0">Before any photo is captured, the customer must consent to the information capture and both the Mitra and the customer verify with a one-time password. This is the consent record that accompanies the Business X-Ray.</p>'
    +'<div class="callout ext" style="margin:12px 0"><b style="color:var(--ext)">◉ Compliance.</b> Capture follows the <b>DPDP Act 2023</b> (informed, purpose-limited consent), the <b>RBI Digital Lending Guidelines</b> and the <b>Account Aggregator</b> framework. Data is minimised, live-captured inside the Mitra-marked geofence, faces &amp; number plates are cropped, and the customer may withdraw consent. Full terms: <a href="/terms" target="_blank" class="hl">Terms &amp; Consent →</a></div>'
    +'<div class="grid cols-3">'
    +'<div><label class="gk">Mitra mobile (agent)</label><input class="inp" id="mitra" inputmode="numeric" maxlength="10" placeholder="10-digit" value="'+esc(g.mitra)+'"/></div>'
    +'<div><label class="gk">Customer mobile</label><input class="inp" id="cust" inputmode="numeric" maxlength="10" placeholder="10-digit" value="'+esc(g.cust)+'"/></div>'
    +'<div><label class="gk">Business name (optional)</label><input class="inp" id="biz" placeholder="e.g. Sharma Kirana" value="'+esc(g.biz)+'"/></div>'
    +'</div>'
    +'<div style="margin-top:12px">'
    +'<label class="chk"><input type="checkbox" id="cCust" '+(g.consentCust?'checked':'')+'/> <span><b>Customer consent.</b> I, the customer, consent to Litehouse / Phone Se Loan and its authorised Mitra capturing photographs and information about my business premises for a first-pass credit assessment, under the DPDP Act 2023. I understand the purpose, that data is minimised and that I may withdraw consent.</span></label>'
    +'<label class="chk"><input type="checkbox" id="cTC" '+(g.consentTC?'checked':'')+'/> <span><b>Mitra declaration.</b> I confirm I am the authorised Mitra, I am on-site inside the customer’s premises, and I accept the <a href="/terms" target="_blank" class="hl">Terms &amp; compliance declaration</a>.</span></label>'
    +'</div>'
    +(g.err?'<div class="disclaimer" style="margin-top:10px">'+esc(g.err)+'</div>':'')
    +sentBlock
    +'</div>';
}
function wireGate(o){
  const el=id=>document.getElementById(id);
  const bind=(id,k)=>{ if(el(id)) el(id).oninput=e=>{ S.gate[k]=e.target.value; }; };
  bind('mitra','mitra'); bind('cust','cust'); bind('biz','biz'); bind('otpM','entM'); bind('otpC','entC');
  if(el('cCust')) el('cCust').onchange=e=>{ S.gate.consentCust=e.target.checked; };
  if(el('cTC')) el('cTC').onchange=e=>{ S.gate.consentTC=e.target.checked; };
  if(el('send')) el('send').onclick=sendOtps;
  if(el('resend')) el('resend').onclick=sendOtps;
  if(el('verify')) el('verify').onclick=verifyOtps;
}
function logAudit(fid,action){ const ex=S.ext[fid]||{}; S.audit.push({facet:(FACET[fid]||{}).label||fid, action, value:ex.value||'', confidence:ex.confidence, source:ex.source||''}); }
async function runAI(fid){ S.busy[fid]=true; render();
  let r; try{ r=await aiRead(S.cap[fid].file, fid); }catch(e){ r={source:'manual entry', error:String(e)}; }
  S.busy[fid]=false;
  S.ext[fid]={ field:(FEX[fid]&&FEX[fid].field)||null, value:r.value||'', confidence:r.confidence||0, quality:r.quality, source:r.source||'—' };
  logAudit(fid,'ai_extract'); render(); }

function coverage(o){ const cap=new Set(), all=new Set();
  o.shotList.forEach(fid=>facetDomains(fid).forEach(d=>all.add(d)));
  Object.keys(S.cap).forEach(fid=>facetDomains(fid).forEach(d=>cap.add(d)));
  const total=all.size; return {resolved:cap.size, total, iri: total?cap.size/total:0}; }

function film(o){ return '<div class="film">'+o.shotList.map((fid,i)=>{
    let c=''; if(S.cap[fid])c='done'; else if(S.skip[fid])c='skip'; if(i===S.step)c=(c?c+' ':'')+'cur';
    return '<i class="'+c+'" title="'+esc((FACET[fid]||{}).label||fid)+'"></i>';
  }).join('')+'</div>'; }

function headerBar(o){ const N=o.shotList.length, done=Object.keys(S.cap).length, read=Object.keys(S.ext).length; const cov=coverage(o);
  return '<div class="toolbar"><h2 style="margin:0;font-size:22px">Guided capture</h2>'
    +'<span class="spacer"></span>'
    +'<span class="pill'+(S.band==='metro'?' on':'')+'" data-band="metro">Metro</span>'
    +'<span class="pill'+(S.band==='nonmetro'?' on':'')+'" data-band="nonmetro">Non-metro</span>'
    +'<a class="btn ghost sm" href="/app">Assessment →</a></div>'
    +'<p class="note" style="margin:4px 0 0">Profile <b>'+esc(o.name)+'</b> · one photo at a time · '+done+'/'+N+' captured · '+read+' AI-read · '+cov.resolved+'/'+cov.total+' domains · IRI '+cov.iri.toFixed(2)+'</p>'
    +film(o); }

function enhancePanel(fid){
  const spec=FEX[fid], ex=S.ext[fid], busy=S.busy[fid];
  let inner;
  if(busy){ inner='<div class="toolbar" style="margin:0"><span class="spin"></span><span class="note">Multimodal AI reading the photo…</span></div>'; }
  else if(ex){
    const q=ex.quality?'<span class="pill">image quality '+ex.quality.score+'/5</span>':'';
    const src=ex.source?'<span class="pill">'+esc(ex.source)+'</span>':'';
    const fields = spec
      ? '<div class="exfield" style="margin-top:8px"><label class="small dim">'+esc(spec.label)+' <span class="mono" style="font-size:11px">('+esc(ex.source||'AI')+' · '+Math.round((ex.confidence||0)*100)+'% conf)</span></label>'
        +'<input id="exVal" value="'+esc(ex.value||'')+'" placeholder="not detected — enter manually"/></div>'
      : '<div class="small note" style="margin-top:8px">No structured field for this facet — held as an Observed photo (quality '+(ex.quality?ex.quality.score+'/5':'n/a')+').</div>';
    inner='<div class="exhead"><b>✨ Data enhancement — multimodal read</b><span class="spacer"></span><span class="tag External">g(·)</span></div>'
      +'<div class="toolbar" style="margin:0">'+q+src+'</div>'+fields
      +'<div class="toolbar" style="margin-top:8px">'+(spec?'<button class="btn sm" id="exAccept">Accept &amp; continue</button>':'')+'<button class="btn ghost sm" id="exRerun">Re-run AI</button></div>'
      +'<p class="small dim" style="margin:8px 0 0">Human-in-the-loop: confirm or correct before it enters the evidence graph. Every read &amp; edit is logged. Nothing is uploaded.</p>';
  } else {
    inner='<div class="exhead"><b>✨ Data enhancement</b><span class="spacer"></span><span class="tag External">g(·)</span></div>'
      +'<button class="btn sm" id="exRun">✨ AI-read this photo</button><span class="small dim" style="margin-left:8px">image quality · QR · OCR</span>';
  }
  return '<div class="exwrap">'+inner+'</div>';
}

/* ---- Mitra parallel annotation (never overrides the engine) ---- */
function mitraNoteBlock(fid){ const v=S.mitraNotes[fid]||'';
  return '<div class="exwrap" style="border-color:#e3e7ef;background:#fbfcff;margin-top:10px"><div class="exhead"><b>📝 Mitra note (parallel)</b><span class="spacer"></span><span class="tag Claim">annotation</span></div>'
    +'<p class="small dim" style="margin:0 0 6px">Your on-site observation is logged alongside the read — it does <b>not</b> override the Business X-Ray estimate.</p>'
    +'<input class="inp" id="mitraNote" data-mn="'+fid+'" placeholder="e.g. busier than the photo suggests; owner also runs a stall next door" value="'+esc(v)+'"/></div>'; }

/* ---- driver confidence chip (how a driver came to its current value) ---- */
function driverConfChip(est,k){
  if(est.recentred[k]) return '<span class="tag External" title="Base set from a photo read">◉ from photo</span>';
  if(est.claimed[k])   return '<span class="tag Claim" title="From the customer’s stated answer">~ customer</span>';
  if(est.narrowed[k])  return '<span class="tag Observed" title="Tightened by a captured photo">✓ tightened</span>';
  return '<span class="tag Benchmark" title="Sector prior — not yet evidenced">prior</span>'; }

/* ---- the widest revenue driver no remaining photo can close (→ ask customer) ---- */
function widestOpenDriver(o){
  const nb=nextBest(o), relW=nb.base.relW, capt=new Set(Object.keys(S.cap));
  let best=null;
  (o.drivers[S.band]||[]).forEach(d=>{ if(d.key==='days')return; const w=relW[d.key]||0;
    const facetsForDriver=o.evidence.filter(e=>e.target!=='balance_sheet'&&e.driver===d.key).map(e=>evFacet(o,e));
    const hasOpenFacet=facetsForDriver.some(f=>f&&!capt.has(f)&&!S.skip[f]);
    const priceOrVol=PRICE_KEYS.includes(d.key)||VOL_KEYS.includes(d.key);
    if(w>0.4 && !hasOpenFacet && priceOrVol && !S.ask[d.key]){ if(!best||w>best.w) best={key:d.key,label:d.label,w}; } });
  return best; }

/* ---- the coach: What we know · Do this next · Still needed · Ask the customer ---- */
function coachPanel(o){
  const st=stopState(o), est=st.nb.base, nb=st.nb;
  const hwPct=Math.round(est.halfWidth*100), cov=coverage(o);
  const ds=o.drivers[S.band]||[];
  const confChips=ds.map(d=>'<span class="statechip">'+esc(d.label)+' '+driverConfChip(est,d.key)+'</span>').join(' ');
  let know='<div class="grid cols-3" style="margin-top:8px">'
    +'<div class="kpi"><span class="k">Turnover ('+S.band+')</span><span class="v" style="font-size:19px">'+fmt(est.rev.base)+'</span><span class="small dim">'+fmt(est.rev.lo)+' – '+fmt(est.rev.hi)+'</span></div>'
    +'<div class="kpi"><span class="k">Confidence (±width)</span><span class="v" style="font-size:19px;color:'+(est.halfWidth<=TARGET_HALFWIDTH?'var(--ok)':'var(--warn)')+'">±'+hwPct+'%</span><span class="small dim">target ±'+Math.round(TARGET_HALFWIDTH*100)+'%</span></div>'
    +'<div class="kpi"><span class="k">Domains / IRI</span><span class="v" style="font-size:19px">'+cov.resolved+'/'+cov.total+'</span><span class="small dim">IRI '+cov.iri.toFixed(2)+'</span></div>'
    +'</div><div class="chiprow" style="margin-top:8px">'+confChips+'</div>';
  let next=''; const top=nb.scored[0];
  if(!st.stop && top){ const idx=o.shotList.indexOf(top.fid), m=FACET[top.fid]||{};
    next='<div class="callout" style="margin-top:6px;border-left-color:var(--brand)"><b>Do this next → '+esc(m.label||top.fid)+'.</b> '+esc(m.validates||'')
      +' <span class="small dim">Expected: ±'+hwPct+'% → ±'+Math.round(top.expHalf*100)+'%.</span>'
      +' <button class="btn sm" data-goto="'+idx+'" style="margin-left:6px">Go to this photo →</button></div>';
    const alt=nb.scored.slice(1,4).map(s=>{const i=o.shotList.indexOf(s.fid);return '<span class="pill" data-goto="'+i+'">'+esc((FACET[s.fid]||{}).label||s.fid)+'</span>';}).join(' ');
    if(alt) next+='<div class="small dim" style="margin-top:6px">or capture instead: '+alt+'</div>';
  } else if(st.stop){
    next='<div class="callout '+(st.escalate?'':'ext')+'" style="margin-top:6px"><b>'+(st.escalate?'⚠ Escalate to underwriter':'✓ Ready to review')+'.</b> '+esc(st.reason)
      +(st.escalate?' Still ±'+hwPct+'% after the feasible photos — route to a human with this reason code.':'')+'</div>'; }
  const open=o.shotList.filter(fid=>!S.cap[fid]&&!S.skip[fid]);
  const still=open.length?('<div class="small dim" style="margin-top:8px"><b>Still needed:</b> '+open.map(fid=>{const i=o.shotList.indexOf(fid);return '<span class="pill" data-goto="'+i+'">'+esc((FACET[fid]||{}).label||fid)+'</span>';}).join(' ')+'</div>'):'';
  const ask=widestOpenDriver(o); let askCard='';
  if(ask){ askCard='<div class="exwrap" style="border-color:#e7c98a;background:#fffaf0;margin-top:10px"><div class="exhead"><b>❓ Ask the customer</b><span class="spacer"></span><span class="tag Claim">Claim</span></div>'
      +'<p class="small" style="margin:0 0 6px">No photo can pin <b>'+esc(ask.label)+'</b> (still ±'+Math.round(ask.w*50)+'%). The customer’s answer is a softer <b>Claim</b>, flagged for GST/bank check.</p>'
      +'<div class="small" style="margin-bottom:4px">'+esc(askQ(ask.key))+'</div>'
      +'<div class="toolbar" style="margin:0"><input class="inp" id="askVal" inputmode="numeric" placeholder="customer’s answer" value="'+esc(S.askDraft[ask.key]||'')+'" data-ask="'+esc(ask.key)+'" style="max-width:220px"/><button class="btn sm" id="askSave" data-ask="'+esc(ask.key)+'">Record answer</button></div></div>'; }
  return '<div class="card" style="margin-top:14px;border:1px solid #bcd0ff"><div class="toolbar"><h2 style="margin:0;font-size:16px">🧭 Capture coach — adaptive loop</h2><span class="spacer"></span><span class="tag Derived">'+Object.keys(S.cap).length+'/'+CAP_MAX+' photos</span></div>'
    +'<h3 style="margin-top:10px">What we know</h3>'+know
    +'<h3 style="margin-top:12px">Do this next</h3>'+next+still+askCard+'</div>'; }

function stepView(o){
  const N=o.shotList.length, fid=o.shotList[S.step], m=FACET[fid]||{label:fid,shoot:"",validates:""};
  const cap=S.cap[fid];
  const big = cap ? '<img class="shot" src="'+cap.url+'"/>'
    : '<div class="dropzone"><div><div style="font-size:44px">📷</div><div style="margin-top:6px">Point the camera at the<br/><b style="color:var(--ink)">'+esc((m.label||'').toLowerCase())+'</b></div></div></div>';
  const doms=facetDomains(fid).map(d=>'<span class="tag External">'+esc(DOMAIN_LABEL[d]||d)+'</span>').join(' ');

  return '<div class="card">'+headerBar(o)+'</div>'
    +'<div class="card" style="margin-top:14px">'
    +'<div class="toolbar" style="margin-bottom:6px"><span class="pill on">Photo '+(S.step+1)+' of '+N+'</span>'
      +(CAT[fid]?'<span class="pill">'+esc(CAT[fid])+'</span>':'')
      +'<span class="tag Observed">Observed</span>'
      +(OUTSIDE.has(fid)
        ?'<span class="tag Claim" title="Intentionally outside the establishment — graded for neighbourhood / catchment quality">◉ outside · neighbourhood</span>'
        :'<span class="tag External" title="Live-captured inside the Mitra-marked geofence (CPV-verified later)">◉ in-boundary</span>')
      +'<span class="spacer"></span>'+doms+'</div>'
    +'<h1 style="margin:.1em 0;font-size:26px">'+esc(m.label)+'</h1>'
    +'<div class="grid cols-2" style="margin-top:8px">'
    +'<div>'+big+(cap?'<p class="small dim" style="margin-top:6px">✓ captured — retake, AI-read, or continue.</p>':'')+'</div>'
    +'<div>'
      +'<div class="callout"><b>What to capture &amp; why:</b> '+esc(m.validates||'—')+'</div>'
      +(m.data?'<div class="callout" style="margin-top:8px"><b>Data backing:</b> '+esc(m.data)+'</div>':'')
      +(m.feeds?'<div class="callout" style="margin-top:8px"><b>Feeds the analysis:</b> '+esc(m.feeds)+'</div>':'')
      +(PRIVACY.has(fid)?'<div class="locknote">🔒 Crop faces &amp; number plates before the frame enters the evidence graph (DPDP 2023).</div>':'')
      +(cap?enhancePanel(fid):'')
      +(cap?neighBlock(fid):'')
    +'</div></div>'
    +'<div class="toolbar" style="margin-top:16px">'
    +(S.step>0?'<button class="btn ghost" id="back">← Back</button>':'')
    +'<label class="btn" style="cursor:pointer">'+(cap?'📷 Retake photo':'📷 Take / upload photo')+'<input type="file" accept="image/*" capture="environment" id="capInput" style="display:none"/></label>'
    +(cap?'<button class="btn" id="next">Next →</button>':'<button class="btn ghost" id="skip">Skip — not applicable</button>')
    +'<span class="spacer"></span><button class="btn ghost sm" id="finish">Finish &amp; review</button>'
    +'</div></div>';
}

function reviewView(o){
  const N=o.shotList.length, done=Object.keys(S.cap).length, skipped=Object.keys(S.skip).length, read=Object.keys(S.ext).length;
  const cov=coverage(o);
  const R=rev(o,S.band), Nr=narrow(o,S.band);
  const relPre=R.base>0?((R.hi-R.lo)/2)/R.base:0, relPost=Nr.base>0?((Nr.hi-Nr.lo)/2)/Nr.base:0;
  const reach=relPost<=0.20;

  const shots=o.shotList.filter(fid=>S.cap[fid]).map(fid=>{ const ex=S.ext[fid];
    return '<div class="thumb"><img src="'+S.cap[fid].url+'"/><div class="cap">'+esc((FACET[fid]||{}).label||fid)+'</div>'+(ex&&ex.value?'<div class="val mono hl">'+esc(ex.value)+'</div>':'')+'</div>'; }).join('');
  const missing=o.shotList.filter(fid=>!S.cap[fid]);
  const auditRows=(S.audit||[]).slice(-24).reverse().map(a=>'<tr><td class="small">'+esc(a.facet)+'</td><td class="small">'+esc(a.action)+'</td><td class="small mono">'+esc(a.value||'—')+'</td><td class="num small">'+(a.confidence!=null?Math.round(a.confidence*100)+'%':'—')+'</td><td class="small dim">'+esc(a.source||'')+'</td></tr>').join('');

  const evByDriver={}; o.evidence.forEach(e=>{(evByDriver[e.driver]=evByDriver[e.driver]||[]).push(e.label);});
  const params=(o.drivers[S.band]||[]).map(d=>{const tight=evByDriver[d.key]?('<div class="note small" style="margin-top:4px">tightened by: '+evByDriver[d.key].map(esc).join(", ")+'</div>'):'';
    return '<div class="driver"><div class="row"><span class="name">'+esc(d.label)+' <span class="tag '+esc(d.cls)+'">'+esc(d.cls)+'</span></span><span class="mono small">'+esc(d.lo)+' · <b class="hl">'+esc(d.base)+'</b> · '+esc(d.hi)+' '+esc(d.unit||"")+'</span></div>'+tight+'</div>';}).join("");
  const ev=o.evidence.map((e,i)=>'<div class="evidence-item'+(i===0?' top':'')+'"><div><div style="font-weight:600;font-size:13px">'+esc(e.label)+' <span class="tag '+esc(e.cls)+'">'+esc(e.cls)+'</span></div><div class="note" style="margin-top:3px">'+esc(e.note||"")+'</div></div><div style="text-align:right;white-space:nowrap"><div class="mono small hl">→ '+esc(paramLabel(o,S.band,e.driver))+(e.target==="balance_sheet"?" (BS)":"")+'</div><div class="mono small dim">±'+Math.round(e.narrowPct*100)+'%</div></div></div>').join("");
  const pack=o.dataPack.map(p=>'<div class="doc"><div><b>'+esc(p.source)+'</b> <span class="note">— '+esc(p.validates)+'</span></div><span class="verdict '+(p.strength==='strong'?'concordant':p.strength==='medium'?'partial':'conflict')+'">'+esc(p.strength)+'</span></div>').join("");

  return '<div class="card">'+headerBar(o)+'</div>'
    +'<div class="card" style="margin-top:14px"><div class="toolbar"><h2 style="margin:0">Capture complete</h2><span class="spacer"></span><span class="tag Derived">IRI '+cov.iri.toFixed(2)+'</span></div>'
    +'<p class="note">'+done+' of '+N+' photos captured'+(skipped?' · '+skipped+' skipped':'')+' · '+read+' AI-read · '+cov.resolved+'/'+cov.total+' verification domains resolved. Photo loop reaches <b>±'+Math.round(relPost*100)+'%</b> from ±'+Math.round(relPre*100)+'% — '+(reach?'within the ≤20% target':'closes to ≤20% with the Mitra data-pack (GST/bank) concordance')+'.</p>'
    +(shots?'<div class="grid cols-4" style="margin-top:10px">'+shots+'</div>':'<p class="note">No photos captured yet — use “take photo” below.</p>')
    +(missing.length?'<p class="note small" style="margin-top:10px"><b>Not yet captured:</b> '+missing.map(fid=>esc((FACET[fid]||{}).label||fid)).join(", ")+'</p>':'')
    +'<div class="stats" style="margin-top:12px">'
      +'<div class="stat"><span class="k">Turnover ('+S.band+')</span><span class="v">'+fmt(R.base)+'</span></div>'
      +'<div class="stat"><span class="k">Range</span><span class="v" style="font-size:13px">'+fmt(R.lo)+' – '+fmt(R.hi)+'</span></div>'
      +'<div class="stat"><span class="k">Half-width</span><span class="v">±'+Math.round(relPre*100)+'% → '+Math.round(relPost*100)+'%</span></div>'
      +'<div class="stat"><span class="k">Photos</span><span class="v">'+done+'/'+N+'</span></div>'
      +(function(){var ns=neighSummary(); return '<div class="stat"><span class="k">Neighbourhood</span><span class="v">'+(ns.label||'—')+'</span><span class="small dim">'+ns.graded+'/'+ns.shots+' outside shots graded'+(ns.qAvg!=null?' · img '+ns.qAvg.toFixed(1)+'/5':'')+'</span></div>';})()
    +'</div>'
    +'<div class="toolbar" style="margin-top:14px"><button class="btn" id="toAssess">Review in Assessment →</button><button class="btn ghost" id="reshoot">← Back to photos</button><button class="btn ghost" id="restart">Start over</button></div>'
    +'</div>'
    +'<div class="grid cols-2" style="margin-top:14px">'
      +'<div class="card"><h3>Extraction audit log</h3><p class="note small" style="margin-top:0">Every AI read and human override is recorded (RBI DLG explainability · EU AI Act accountability).</p>'
        +(auditRows?'<table><thead><tr><th>Facet</th><th>Action</th><th>Value</th><th class="num">Conf.</th><th>Source</th></tr></thead><tbody>'+auditRows+'</tbody></table>':'<p class="note">No AI extractions yet.</p>')+'</div>'
      +'<div class="card"><h3>Parameters this profile estimates</h3>'+params+'</div>'
    +'</div>'
    +'<div class="grid cols-2" style="margin-top:14px">'
      +'<div class="card"><h3>Priority next-photo evidence · Eq 7</h3>'+ev+'</div>'
      +'<div class="card"><h3>Mitra data pack — documentary cross-checks</h3>'+pack+'</div>'
    +'</div>';
}

function render(){
  const out=document.getElementById('out');
  if(!S.id){ out.innerHTML='<div class="empty"><div><div style="font-size:34px">📷</div><div style="margin-top:8px">Select a business profile to begin — consent &amp; OTP verification come first</div></div></div>'; return; }
  const o=DATA[S.id];
  if(!S.gate.passed){ out.innerHTML=gateView(o); wireGate(o); return; }   // consent + dual-OTP gate before any capture
  out.innerHTML = (S.step>=o.shotList.length) ? reviewView(o) : stepView(o);
  wire(o);
}

function wire(o){
  const N=o.shotList.length;
  const adv=()=>{ S.step=Math.min(N, S.step+1); render(); };
  const el=id=>document.getElementById(id);
  document.querySelectorAll('#out .pill[data-band]').forEach(p=>p.onclick=()=>{ S.band=p.dataset.band; syncBand(); render(); });
  const inp=el('capInput');
  if(inp) inp.onchange=e=>{ const f=e.target.files&&e.target.files[0]; if(!f) return; const fid=o.shotList[S.step];
    if(S.cap[fid]){ try{URL.revokeObjectURL(S.cap[fid].url);}catch(_){} }
    S.cap[fid]={name:f.name,url:URL.createObjectURL(f),file:f}; delete S.skip[fid]; delete S.ext[fid];
    render(); runAI(fid); };
  if(el('exRun')) el('exRun').onclick=()=>runAI(o.shotList[S.step]);
  if(el('exRerun')) el('exRerun').onclick=()=>runAI(o.shotList[S.step]);
  if(el('exAccept')) el('exAccept').onclick=()=>{ const fid=o.shotList[S.step]; const ex=S.ext[fid]; const inp=el('exVal');
    if(ex&&inp&&inp.value!=null&&inp.value!==ex.value){ ex.value=inp.value; ex.source=(ex.source||'')+' + human override'; logAudit(fid,'human_override'); } adv(); };
  if(el('skip')) el('skip').onclick=()=>{ S.skip[o.shotList[S.step]]=true; adv(); };
  if(el('next')) el('next').onclick=()=>{ const fid=o.shotList[S.step]; const inp=el('exVal'); const ex=S.ext[fid];
    if(ex&&inp&&inp.value!=null&&inp.value!==ex.value){ ex.value=inp.value; ex.source=(ex.source||'')+' + human override'; logAudit(fid,'human_override'); } adv(); };
  document.querySelectorAll('#out [data-neigh]').forEach(elm=>elm.onclick=()=>{ S.neigh[elm.dataset.neigh]=elm.dataset.grade; render(); });
  if(el('back')) el('back').onclick=()=>{ S.step=Math.max(0,S.step-1); render(); };
  if(el('finish')) el('finish').onclick=()=>{ S.step=N; render(); };
  if(el('reshoot')) el('reshoot').onclick=()=>{ S.step=Math.max(0,N-1); render(); };
  if(el('restart')) el('restart').onclick=()=>{ reset(S.id); render(); };
  if(el('toAssess')) el('toAssess').onclick=()=>{
    const captured=Object.keys(S.cap); const ext={}, quality={};
    for(const f in S.ext){ if(S.ext[f]){ if(S.ext[f].value) ext[f]=S.ext[f].value; if(S.ext[f].quality) quality[f]=S.ext[f].quality.score; } }
    const _ns=neighSummary(); const neighbourhood={grade:_ns.label,score:_ns.gradeScore,outsideShots:_ns.shots,graded:_ns.graded,avgQuality:_ns.qAvg,byShot:S.neigh};
    try{ sessionStorage.setItem('bx_handoff', JSON.stringify({id:S.id, band:S.band, captured, ext, quality, neighbourhood, consent:S.consent, ts:Date.now()})); }catch(_){}
    location.href='/app#/assess?from=capture';
  };
}
function syncBand(){ document.querySelectorAll('.pill[data-band]').forEach(p=>p.classList.toggle('on', p.dataset.band===S.band)); }

document.getElementById('ind').addEventListener('change',e=>{ const id=e.target.value; if(!id){ S.id=null; render(); return; } reset(id); render(); });
document.querySelectorAll('.pill[data-band]').forEach(p=>{ if(!p.closest('#out')) p.addEventListener('click',()=>{ S.band=p.dataset.band; syncBand(); if(S.id)render(); }); });
</script>
</body></html>`;
writeFileSync("/home/claude/business-xray/business-xray-capture.html", html);
console.log("AI-OS LIVE capture + enhancement:", (html.length/1024).toFixed(0)+"KB · industries:", data.length);
