// Build app.html from worker.js AND register all 56 industry profiles into the
// assessment engine (SECTORS / REGISTRY / CAPTURE / FACETS), grouped selector +
// metro/non-metro toggle. Same verified engine; the fetch api() -> local dispatcher.
import fs from "node:fs";
import { pslGate } from "./aios-theme.mjs";

const src = fs.readFileSync("worker.js", "utf8");
const kb  = JSON.parse(fs.readFileSync("industry-model.json", "utf8"));

/* ---------- facet label/meta (mirrors build-capture) ---------- */
const titleCase = s => s.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase());
const META_F = {
  exterior:{l:"Exterior & signage",shoot:"Full shopfront with name board & shutter",val:"Business exists at the claimed location; name → GSTIN match"},
  neighbourhood:{l:"Neighbourhood / street context",shoot:"The street & adjacent shops",val:"Catchment liveliness → demand plausibility"},
  interior:{l:"Full interior / trading floor",shoot:"Wide shot of the whole working area",val:"Scale & activity state of the premises"},
  qr_code:{l:"UPI / merchant QR",shoot:"The QR standee / soundbox at the counter",val:"Banked turnover vs total; cash residual"},
  utility_meter:{l:"Utility meter + consumer no.",shoot:"Electricity meter with consumer number legible",val:"Energy → revenue proxy; connected load; owned/rented"},
  gst_board:{l:"GST board / certificate",shoot:"GSTIN board or the GST certificate",val:"Photo vs GST-filed turnover; linkage chain"},
  udyam:{l:"Udyam certificate",shoot:"The Udyam registration print/scan",val:"Vintage, MSME category, declared activity"},
  pukka_invoice:{l:"Pukka / tax invoice sample",shoot:"A couple of GST tax invoices",val:"Average ticket & price; B2B revenue; ties to filings"},
  kacha_bill:{l:"Kacha bill / cash ledger",shoot:"The rough cash bill book / day-book",val:"Cash sales the bank feed misses"},
  price_board:{l:"Price / rate board",shoot:"The rate board or a priced shelf",val:"Unit / blended price → ticket"},
  machinery:{l:"Machinery + nameplate",shoot:"Each main machine with capacity nameplate",val:"Rated capacity → output; asset value"},
  display:{l:"Display / shelves / stock",shoot:"Stocked shelves and display zones",val:"Stock density → inventory value → DIO"},
  storage:{l:"Storage / godown",shoot:"Back-store / godown stock",val:"Hidden inventory; storage capacity"},
  weighbridge:{l:"Weighbridge / measure point",shoot:"The weighbridge and a slip",val:"Tonnage / throughput"},
  licence:{l:"Trade / FSSAI / factory licence",shoot:"The relevant licence",val:"Compliance; operating days"},
  dispatch:{l:"Dispatch bay / register",shoot:"Loading bay and dispatch register",val:"Throughput / sales cadence"},
  rental_agreement:{l:"Rental agreement",shoot:"The rent agreement / deposit page",val:"Rent → BS liability; owned vs rented"},
  footfall_timed:{l:"Time-bounded footfall",shoot:"Doorway footfall for a fixed window",val:"Independent check on transactions/day"},
  credit_ledger:{l:"Customer credit / udhaar ledger",shoot:"The credit-sales register",val:"Receivables not in bank → DSO"},
  safe_vault:{l:"Safe / vault",shoot:"The safe or vault (closed)",val:"High-value stock / cash; collateral"},
  staff_seating:{l:"Staff seats / workstations",shoot:"The desks / workstations in use",val:"Billable capacity (professional heads)"},
  portfolio_board:{l:"Portfolio / past-work board",shoot:"Portfolio wall or project photos",val:"Project scale & typical fee"},
  engagement_letter:{l:"Engagement letter / contract",shoot:"A client engagement letter",val:"Retainer/fee level; client tenure"},
  fee_schedule:{l:"Fee schedule / rate card",shoot:"The fee schedule",val:"Average fee"},
  receivables_ageing:{l:"Receivables ageing",shoot:"The ageing statement / debtor list",val:"DSO and collection risk"},
  policy_register:{l:"Policy register",shoot:"The in-force policy register",val:"Policies in force → commission base"},
  commission_statement:{l:"Commission statement",shoot:"Insurer/principal commission statement",val:"Realised commission income"},
  renewal_register:{l:"Renewal register",shoot:"The renewal/AMC register",val:"Recurring / renewal income"},
  project_wip:{l:"Project WIP / site progress",shoot:"Ongoing site / work-in-progress",val:"WIP value; milestone billing"},
  deal_register:{l:"Deal / booking register",shoot:"The closed-deal / booking register",val:"Closed deals → commission"},
};
const NEWF = Object.fromEntries((kb.newFacets||[]).map(f=>[f.id,f]));
const CAT = {exterior:"Outside",neighbourhood:"Outside",interior:"Inside",display:"Inside",storage:"Inside",machinery:"Inside",qr_code:"Counter",price_board:"Counter",kacha_bill:"Counter",credit_ledger:"Counter",safe_vault:"Counter",gst_board:"Document",udyam:"Document",licence:"Document",pukka_invoice:"Document",fee_schedule:"Document",engagement_letter:"Document",commission_statement:"Document",receivables_ageing:"Document",policy_register:"Document",renewal_register:"Document",deal_register:"Document",rental_agreement:"Document",utility_meter:"Utility",weighbridge:"Yard",dispatch:"Yard",staff_seating:"Inside",portfolio_board:"Inside",project_wip:"Site",footfall_timed:"Outside"};
const PRIV = new Set(["exterior","neighbourhood","dispatch","weighbridge","footfall_timed"]);
const facetLabel = fid => (META_F[fid]&&META_F[fid].l) || (NEWF[fid]&&(NEWF[fid].label||titleCase(fid))) || titleCase(fid);
const facetShoot = fid => (META_F[fid]&&META_F[fid].shoot) || (NEWF[fid]&&NEWF[fid].output) || "";
const facetVal   = fid => (META_F[fid]&&META_F[fid].val) || (NEWF[fid]&&NEWF[fid].validates) || "";

/* ---------- map each evidence item -> the photo (facet) that provides it ---------- */
// So the assessment can tighten a driver only when its evidence photo was actually captured.
const EV_KW = [
  [/weighbridge|weigh|tonnage|slip/, "weighbridge"],
  [/z-?report|z-?total|day-?book|pos|bill count|transactions|txn|footfall count|customer count/, "kacha_bill"],
  [/footfall|occupanc|peak-?hour|foot traffic/, "footfall_timed"],
  [/fee schedule|fee card|rate card/, "fee_schedule"],
  [/price|rate board|item-?price|tariff|menu/, "price_board"],
  [/invoice|tax bill|gst bill/, "pukka_invoice"],
  [/gstin|gst filing|gst return/, "gst_board"],
  [/udyam/, "udyam"],
  [/seat/, "interior"],
  [/machine|counter reading|nameplate|capacity|shift record|output rate/, "machinery"],
  [/dispatch|loading|throughput|stock-?turn/, "dispatch"],
  [/area|floor|sq ?ft|usable/, "interior"],
  [/stock|inventory|sku|shelf|display/, "display"],
  [/godown|storage/, "storage"],
  [/credit|udhaar|receivable|ageing|debtor/, "credit_ledger"],
  [/appointment|job register|booking|deal register/, "deal_register"],
  [/policy register|policies in force/, "policy_register"],
  [/renewal|amc/, "renewal_register"],
  [/commission/, "commission_statement"],
  [/engagement|contract|retainer/, "engagement_letter"],
  [/portfolio|past-?work/, "portfolio_board"],
  [/wip|site progress|milestone/, "project_wip"],
  [/licence|license|shutter|operating days/, "licence"],
  [/upi|qr|banked|bank credit/, "qr_code"],
  [/meter|energy|kwh|consumption|electric/, "utility_meter"],
  [/rent|lease|deposit/, "rental_agreement"],
];
const IDENTITY = new Set(["exterior","neighbourhood","gst_board","udyam","rental_agreement","interior"]);
function resolveEvFacet(e, shotList){
  const t = (String(e.label||"")+" "+String(e.note||"")).toLowerCase();
  for (const [re,f] of EV_KW) if (re.test(t) && shotList.includes(f)) return f;   // best: keyword ∈ this profile's shots
  for (const [re,f] of EV_KW) if (re.test(t)) return f;                            // keyword match even if not in shots
  // fallback: a non-identity shot for the evidence's driver, else first informative shot
  return shotList.find(f=>!IDENTITY.has(f)) || shotList[0];
}

/* ---------- build 56-profile payloads ---------- */
const GENERIC = ["retail","fnb","services","warehouse","scrap","manufacturing"];
const IND_SECTORS = [], IND_REG = {}, IND_CAP = {}, IND_FAC = {}, FACET_LABEL = {};
for (const o of kb.industries) {
  const mk = band => (o.drivers[band]||[]).map(d=>({key:d.key,label:d.label,unit:d.unit||"",cls:d.cls||"Claim",lo:+d.lo,base:+d.base,hi:+d.hi}));
  const ev = (o.evidenceItems||[]).map((e,i)=>({id:e.id||("ev_"+i),label:e.label,driver:e.driver,narrowPct:+e.narrowPct||0.08,q:e.q==null?0.8:+e.q,v:e.v==null?0.7:+e.v,cost:e.cost==null?2:+e.cost,cls:e.cls||"Observed",note:e.note||"",facet:resolveEvFacet(e,o.shotList)}));
  const hasTon = (o.drivers.metro||[]).some(d=>d.key==="tonnage");
  IND_SECTORS.push({ id:o.id, name:o.name, archetype:o.archetype, revenueFormula:o.economics||"",
    driversMetro:mk("metro"), driversNonmetro:mk("nonmetro"),
    shotLabels:o.shotList.map(facetLabel), shotFacets:o.shotList.slice(), evidenceItems:ev,
    unitScale: (o.archetype==="scrap"&&hasTon)?{tonnage:1000}:null });
  IND_REG[o.id] = { metro:o.registry.metro, nonmetro:o.registry.nonmetro };
  IND_CAP[o.id] = o.shotList.slice();
  for (const fid of o.shotList){ FACET_LABEL[fid]=facetLabel(fid); if (!IND_FAC[fid]) IND_FAC[fid] = {
    label:facetLabel(fid), cat:(CAT[fid]||"Inside"), node:"Observed", domains:[],
    key:"", data:facetShoot(fid), validates:facetVal(fid), output:"", privacy:PRIV.has(fid)?"Crop faces & number plates":"—" }; }
}

/* ---------- slice worker.js (same regions build-static uses) ---------- */
const slice = (start, end) => { const a=src.indexOf(start), b=src.indexOf(end);
  if (a<0||b<0) throw new Error("marker not found: "+(a<0?start:end)); return src.slice(a,b); };
let engine = slice("const APP = {", "/* ============================= 6. API HANDLERS");
engine = engine.replace(/function fmtCr\(x\) \{[\s\S]*?en-IN"\);\n\}/, "");
const propsBlock = src.match(/const PROPOSITIONS = \[[\s\S]*?\];/)[0];
const wfBlock    = src.match(/const WORKFLOW = \[[\s\S]*?\];/)[0];
const css    = src.match(/const CSS = `([\s\S]*?)`;/)[1];
let client   = src.match(/const CLIENT = String\.raw`([\s\S]*?)`;/)[1];

/* ---------- PSL light-theme override (remap the engine's dark palette to the AI-OS look) ---------- */
const PSL_OVERRIDE = `
/* Phone Se Loan AI-OS theme — remap engine variables + header to match /capture & /industries */
:root{
  --bg:#f4f6fb; --panel:#ffffff; --panel2:#eef1f7; --line:#e3e7ef;
  --ink:#1a2233; --mut:#5b6478; --dim:#8a93a6;
  --brand:#2f6bff; --brand2:#1c49c9;
  --obs:#1c49c9; --claim:#8a5a00; --bench:#6b3fb0; --deriv:#0f6d78; --ext:#0c6b3f; --gap:#8f1d31;
  --ok:#0c6b3f; --warn:#8a5a00; --bad:#8f1d31;
  --radius:12px; --shadow:0 8px 24px rgba(20,30,60,.08);
}
body{background:var(--bg)}
a{color:var(--brand2)}
/* navy PSL header + light tab nav */
header.top{position:sticky;top:0;z-index:50;background:linear-gradient(120deg,#0f1b3d,#1b2b57);backdrop-filter:none;border-bottom:none}
header.top .brand{color:#fff}
header.top .logo{background:linear-gradient(135deg,#2f6bff,#0f6d78);color:#fff}
header.top .pill{border-color:rgba(255,255,255,.28);color:#c7d0e6;background:rgba(255,255,255,.08)}
nav.main a{color:#c7d0e6;font-weight:600}
nav.main a.active,nav.main a:hover{background:rgba(255,255,255,.16);color:#fff}
/* flatten the old dark hero to a clean light band */
.hero{background:#fff;border-bottom:1px solid var(--line);padding:40px 0 22px}
h1,h2,h3{color:var(--ink)}
.card{box-shadow:var(--shadow)}
.btn{box-shadow:0 1px 2px rgba(20,30,60,.12)}
.step{background:#fff}
/* inputs read cleaner on white */
.rng input[type=number],.select{background:#fff}
`;

/* ---------- bridge: register all 56 into the engine + band control ---------- */
const bridge = `
/* ===== 56-industry bridge: every profile is a first-class assessment sector ===== */
const IND_SECTORS = ${JSON.stringify(IND_SECTORS)};
const IND_REG = ${JSON.stringify(IND_REG)};
const IND_CAP = ${JSON.stringify(IND_CAP)};
const IND_FAC = ${JSON.stringify(IND_FAC)};
const GENERIC = new Set(${JSON.stringify(GENERIC)});
const FACET_LABEL = ${JSON.stringify(FACET_LABEL)};
const ARCHE_LABEL = {retail:'Retail / kirana',fnb:'Food & beverage',services:'Services',warehouse:'Warehouse / distribution',scrap:'Scrap trading',manufacturing:'Light manufacturing',transport:'Transport / logistics'};
let BAND='metro';
(function registerIndustries(){
  for(const s of IND_SECTORS){
    SECTORS[s.id]={ id:s.id, name:s.name, archetype:s.archetype, revenueFormula:s.revenueFormula,
      drivers: JSON.parse(JSON.stringify(s.driversMetro)), shotList:s.shotLabels.slice(),
      evidenceItems:s.evidenceItems, unitScale: s.unitScale||undefined,
      _bands:{metro:s.driversMetro, nonmetro:s.driversNonmetro} };
    REGISTRY.sectors[s.id]=Object.assign({}, IND_REG[s.id].metro, {_bands:IND_REG[s.id]});
    CAPTURE[s.id]=IND_CAP[s.id];
  }
  for(const fid in IND_FAC){ if(!FACETS[fid]) FACETS[fid]=IND_FAC[fid]; }
})();
function applyBand(band){
  if(band!=='metro'&&band!=='nonmetro') return; BAND=band;
  for(const s of IND_SECTORS){
    SECTORS[s.id].drivers = JSON.parse(JSON.stringify(SECTORS[s.id]._bands[band]));
    const r=REGISTRY.sectors[s.id]._bands[band], t=REGISTRY.sectors[s.id];
    t.gm=r.gm; t.opex=r.opex; t.dio=r.dio; t.dso=r.dso; t.dpo=r.dpo; t.eta=r.eta;
    if(typeof META!=='undefined'&&META&&META.sectors){ const m=META.sectors.find(x=>x.id===s.id); if(m) m.drivers=JSON.parse(JSON.stringify(SECTORS[s.id]._bands[band])); }
  }
}
`;

/* ---------- patch client: grouped picker + band toggle + default profile ---------- */
const oldPicker = `function sectorPicker(){
  return '<select class="select" id="sectorSel">'+META.sectors.map(s=>'<option value="'+s.id+'"'+(s.id===STATE.sector?' selected':'')+'>'+s.name+'</option>').join('')+'</select>';
}`;
const newPicker = `function sectorPicker(){
  const groups={}; META.sectors.forEach(s=>{ if(GENERIC.has(s.id))return; (groups[s.archetype]=groups[s.archetype]||[]).push(s); });
  let opts=Object.keys(ARCHE_LABEL).filter(a=>groups[a]).map(a=>'<optgroup label="'+ARCHE_LABEL[a]+'">'+groups[a].slice().sort((x,y)=>x.name.localeCompare(y.name)).map(s=>'<option value="'+s.id+'"'+(s.id===STATE.sector?' selected':'')+'>'+s.name+'</option>').join('')+'</optgroup>').join('');
  const gen=META.sectors.filter(s=>GENERIC.has(s.id));
  if(gen.length) opts+='<optgroup label="Generic archetype (reference)">'+gen.map(s=>'<option value="'+s.id+'"'+(s.id===STATE.sector?' selected':'')+'>'+s.name+'</option>').join('')+'</optgroup>';
  const banner = STATE._fromCapture ? '<div class="disclaimer" style="width:100%;margin-bottom:8px;background:var(--okbg,#e7f6ee);color:var(--ok,#0c6b3f);border:1px solid #bfe6cf">◉ Assessment derived from <b>'+STATE._fromCapture.n+' photo(s) captured on-site</b> for '+STATE._fromCapture.name+'. Drivers marked <b>◉ from photo</b> were tightened by the evidence read during capture — take more photos to close the interval further.</div>' : '';
  return banner+'<span class="chip'+(BAND==='metro'?' on':'')+'" data-band="metro">Metro</span><span class="chip'+(BAND==='nonmetro'?' on':'')+'" data-band="nonmetro">Non-metro</span> <select class="select" id="sectorSel">'+opts+'</select>';
}`;
if(!client.includes(oldPicker)) throw new Error("sectorPicker source not found — worker.js changed");
client = client.replace(oldPicker, ()=>newPicker);   // function replacer: avoid $$ -> $ mangling

// ---- capture -> assessment handoff: read the Capture session and narrow drivers from photos taken ----
const oldViewAssess = `async function viewAssess(query){
  const params=new URLSearchParams(query||'');
  if(params.get('demo')==='scrap'){ const d=await api('/api/demo/scrap');`;
const newViewAssess = `var PRICE_KEYS=['ticket','price','cover','fee','avg_fee','uv','unitprice','rate','psf'];
var VOL_KEYS=['txns','clients','footfall','seats','turns','units','uph','trips','loads','members','patients','policies','deals','area','sqft','tonnage'];
function _num(v){ var n=parseFloat(String(v==null?'':v).replace(/[^0-9.]/g,'')); return isFinite(n)?n:0; }
function _clamp(x,a,b){ return Math.max(a,Math.min(b,x)); }
function _pick(st,keys){ for(var i=0;i<keys.length;i++){ if(st[keys[i]]) return keys[i]; } return null; }
function _setBase(d,val){ if(!(val>0)) return; var rl=d.lo/d.base, rh=d.hi/d.base; d.base=val; d.lo=val*rl; d.hi=val*rh; }
function applyHandoff(h){
  if(h.band) applyBand(h.band);
  const id = SECTORS[h.id] ? h.id : 'kirana';
  STATE=defaultState(id);
  const s=SECTORS[id], cap=new Set(h.captured||[]); const narrowed={};
  // (a) shift driver BASES to the customer's actual AI-read values (this is what makes two customers differ)
  const ext=h.ext||{}; const prior={}; for(const k in STATE.drivers) prior[k]=STATE.drivers[k].base;
  const pk=_pick(STATE.drivers,PRICE_KEYS);
  if(pk){ const pv=_num(ext.price_board||ext.pukka_invoice||ext.fee_schedule);
    if(pv>0){ _setBase(STATE.drivers[pk], _clamp(pv, prior[pk]*0.3, prior[pk]*3)); narrowed[pk]=true; } }
  const vk=_pick(STATE.drivers,VOL_KEYS);
  if(vk){ const vv=_num(ext.footfall_timed||ext.footfall||ext.storage||ext.interior||ext.occupancy_gauge||ext.area);
    if(vv>0){ _setBase(STATE.drivers[vk], _clamp(vv, prior[vk]*0.3, prior[vk]*3)); narrowed[vk]=true; } }
  if(STATE.drivers.tonnage){ const wv=_num(ext.weighbridge);
    if(wv>0){ _setBase(STATE.drivers.tonnage, _clamp(wv, prior.tonnage*0.3, prior.tonnage*3)); narrowed.tonnage=true; } }
  // (b) narrow drivers whose evidence photo was actually captured (around the shifted base)
  (s.evidenceItems||[]).forEach(e=>{ if(cap.has(e.facet)){ const d=STATE.drivers[e.driver];
    if(d){ const half=d.base*(e.narrowPct||0.08); d.lo=Math.max(d.lo,d.base-half); d.hi=Math.min(d.hi,d.base+half); narrowed[e.driver]=true; } } });
  STATE._narrowed=narrowed;
  STATE.providedShots=(h.captured||[]).map(f=>FACET_LABEL[f]||f).filter(l=>s.shotList.includes(l));
  STATE.external=STATE.external||{energy:{kwh:0,months:1},gstin:null,banking:null,cashSharePct:null};
  if(h.ext){ if(h.ext.gst_board) STATE.external.gstin={status:'captured',gstin:h.ext.gst_board};
    if(h.ext.qr_code) STATE.external.vpa=h.ext.qr_code; if(h.ext.utility_meter) STATE.external.consumerNo=h.ext.utility_meter; }
  STATE._fromCapture={ n:(h.captured||[]).length, id:id, name:s.name };
}
async function viewAssess(query){
  const params=new URLSearchParams(query||'');
  let _h=null; try{ _h=JSON.parse(sessionStorage.getItem('bx_handoff')||'null'); }catch(_){ _h=null; }
  if(_h && (params.get('from')==='capture' || !STATE)){ applyHandoff(_h); try{sessionStorage.removeItem('bx_handoff');}catch(_){}
    render(); return '<div class="wrap" id="assessRoot"></div>'; }
  const _d2=params.get('demo2');
  if(_d2){ const dd=(typeof DEMO2!=='undefined')&&DEMO2.find(x=>x.key===_d2);
    if(dd){ STATE=_demoNarrow(dd); STATE._fromCapture={ n:(dd.captured||CAPTURE[dd.id]||[]).length, id:dd.id, name:SECTORS[dd.id].name+' — '+dd.city };
      render(); return '<div class="wrap" id="assessRoot"></div>'; } }
  if(params.get('demo')==='scrap'){ const d=await api('/api/demo/scrap');`;
if(!client.includes(oldViewAssess)) throw new Error("viewAssess head not found — worker.js changed");
client = client.replace(oldViewAssess, ()=>newViewAssess);
// default profile kirana (only the standalone !STATE branch remains to swap)
client = client.replace("else if(!STATE){ STATE=defaultState('retail'); }", ()=>"else if(!STATE){ STATE=defaultState('kirana'); }");

// ---- driver rows: tag drivers that were tightened by a captured photo ----
const oldDriverTag = `<span class="tag '+d.cls+'">'+d.cls+'</span></div>'`;
const newDriverTag = `<span class="tag '+d.cls+'">'+d.cls+'</span>'+((STATE._narrowed&&STATE._narrowed[d.key])?' <span class="tag External" title="Tightened by a photo captured on-site">◉ from photo</span>':'')+'</div>'`;
if(client.includes(oldDriverTag)) client = client.replace(oldDriverTag, ()=>newDriverTag);

// default route -> Assessment (retire the old dark Overview landing)
client = client.replace("if(path==='/'||path===''){ html=viewHome(); }", ()=>"if(path==='/'||path===''){ location.hash='#/assess'; return; }");

const oldWire = `$('#sectorSel') && ($('#sectorSel').onchange=(e)=>{ STATE=defaultState(e.target.value); render(); });`;
const newWire = `$('#sectorSel') && ($('#sectorSel').onchange=(e)=>{ STATE=defaultState(e.target.value); render(); });
  $$('#assessRoot .chip[data-band]').forEach(c=>c.onclick=()=>{ applyBand(c.dataset.band); STATE=defaultState(STATE.sector); render(); });`;
if(!client.includes(oldWire)) throw new Error("sectorSel wiring not found — worker.js changed");
client = client.replace(oldWire, ()=>newWire);   // function replacer: keep $$ intact

/* ---------- Demonstrations: extend viewDemos with a photo-driven industry gallery ---------- */
const oldDemosReturn = `  return '<div class="wrap"><section><h1>Worked demonstrations</h1>'
    +'<p class="lead">Two deterministic workflow demonstrations from the paper (§6). They illustrate internal consistency, traceable reconciliation and evidence closure — not predictive accuracy.</p>'
    +'<div class="grid cols-2" style="margin-top:8px">'+scrapCard+supCard+'</div></section></div>';`;
const newDemosReturn = `  return '<div class="wrap"><section><h1>Worked demonstrations</h1>'
    +'<p class="lead">Deterministic workflow demonstrations. The two paper cases (§6) show reconciliation and evidence closure; the industry gallery below shows the same rule engine turning a specific on-site photo set into a specific scenario across a sample of the 56 profiles. Illustrative rule-engine outputs — not predictive accuracy.</p>'
    +'<div class="grid cols-2" style="margin-top:8px">'+scrapCard+supCard+'</div></section>'
    +viewDemos2Gallery()+'</div>';`;
if(!client.includes(oldDemosReturn)) throw new Error("viewDemos return not found — worker.js changed");
client = client.replace(oldDemosReturn, ()=>newDemosReturn);

const demo2Block = `
/* ===== Industry demonstration gallery — assessments driven by captured photos ===== */
const DEMO2 = [
 { key:'pharmacy_a', id:'pharmacy', band:'metro', city:'Pune · Hospital Road',
   blurb:'Busy chemist beside a multispeciality hospital — high prescription throughput, deep expiry-managed stock and a cold-chain fridge.',
   captured:['exterior','neighbourhood','interior','display','storage','cold_room','price_board','qr_code','gst_board','pukka_invoice','footfall_timed'],
   ext:{price:460, vol:210},
   reads:['Sample GST bills → ₹460 avg ticket','Timed footfall → ~210 bills/day','Cold-chain fridge → biologics stock'],
   story:'The ₹460 ticket and ~210 bills/day, read from the price board, sample invoices and timed footfall, recentre the scenario high and the captured evidence narrows it — a materially larger business than the colony chemist beside it on the same trade.' },
 { key:'pharmacy_b', id:'pharmacy', band:'metro', city:'Nashik · residential colony',
   blurb:'Small neighbourhood chemist — mostly OTC and repeat-prescription walk-ins, shallow stock, no cold-chain.',
   captured:['exterior','neighbourhood','interior','display','price_board','qr_code','gst_board'],
   ext:{price:300, vol:95},
   reads:['Rate board → ₹300 avg ticket','Counter bill count → ~95/day'],
   story:'Same trade, different premises: a lower ticket and roughly half the daily bills drive the same rule engine to about a third of the hospital-road chemist’s turnover — the divergence comes entirely from the photos.' },
 { key:'restaurant_a', id:'restaurant', band:'metro', city:'Highway family restaurant',
   blurb:'AC family restaurant on a highway service road — large covers, steady dinner turns and a healthy Swiggy/Zomato share.',
   captured:['exterior','neighbourhood','interior','menu_board','display','qr_code','aggregator_dashboard','gst_board','pukka_invoice','kacha_bill'],
   ext:{price:520, vol:60},
   reads:['Menu board → ₹520 avg cover','Peak-hour count → ~60 seats','Aggregator dashboard → online orders'],
   story:'A ₹520 cover across ~60 seats, read from the menu board and a timed occupancy count and corroborated by the aggregator dashboard, places this well above the local fast-food corner on the same food-and-beverage template.' },
 { key:'restaurant_b', id:'restaurant', band:'metro', city:'Local fast-food corner',
   blurb:'Small quick-service corner — low cover, high churn, mostly cash with a counter QR.',
   captured:['exterior','neighbourhood','interior','menu_board','qr_code','kacha_bill'],
   ext:{price:300, vol:32},
   reads:['Rate board → ₹300 avg cover','Counter QR + day-book → ~32 seats'],
   story:'A lower cover and a smaller room read from the photos recentre the same template far below the highway restaurant — two food businesses, two scenarios, from their own evidence.' },
 { key:'hardware_a', id:'hardware_paint_sanitary', band:'metro', city:'Building-material market',
   blurb:'Hardware, paint & sanitaryware store — walk-in retail plus credit trade sales to contractors, bulky slow-moving stock.',
   captured:['exterior','neighbourhood','interior','price_board','display','storage','qr_code','gst_board','utility_meter','pukka_invoice','credit_ledger'],
   ext:{price:2600, vol:55},
   reads:['Paint/sanitaryware price list → ₹2,600 avg ticket','Counter challan sample → ~55 bills/day','Contractor khata → ~30-day credit'],
   story:'The contractor credit ledger keeps the working-capital cycle long even as the price-list and challan reads fix a solid ticket and daily count — the evidence separates a healthy trade counter from a thin one.' },
 { key:'mobile_a', id:'mobile_electronics', band:'metro', city:'Mobile & electronics dealer',
   blurb:'Handset and electronics dealer — thin metal margin on high-value boxes, real profit on accessories, EMI and activation.',
   captured:['exterior','neighbourhood','interior','price_board','display','storage','qr_code','gst_board','pukka_invoice','footfall_timed'],
   ext:{price:13500, vol:22},
   reads:['Sealed-box display → ₹13,500 avg ticket','EMI/activation register → ~22 sales/day'],
   story:'High ticket, low count: the sealed-box price display and the financier activation register read a very different revenue shape from a kirana of the same footprint — exactly the point of a per-trade template.' },
 { key:'vehicle_a', id:'vehicle_service', band:'metro', city:'Multi-brand service garage',
   blurb:'Workshop with lifts and bays — jobs per day × average job value (spares + labour), constrained by bay and mechanic capacity.',
   captured:['exterior','neighbourhood','workshop_bay','machinery','spares_rack','job_card_register','price_board','qr_code','utility_meter','pukka_invoice'],
   ext:{price:2300, vol:15},
   reads:['Job invoice sample → ₹2,300 avg job','Job-card register (7-day) → ~15 jobs/day','Bay & lift count → capacity'],
   story:'The bay photo bounds capacity while the job-card register and invoice split read the real daily jobs and ticket — evidence that lifts this out of a bare sector-median guess.' },
 { key:'spinning_a', id:'spinning_weaving', band:'metro', city:'Spinning & weaving plant',
   blurb:'Continuous-shift yarn/fabric plant — spindles and looms running near round-the-clock; power and depreciation dominate cost.',
   captured:['exterior','machinery','nameplate','storage','rm_silo','wip_floor','dispatch','utility_meter','production_register','gst_board','pukka_invoice'],
   ext:{price:270, vol:125},
   reads:['Machine nameplate → ~125 kg/hr installed','Production board → 3-shift running','Sale invoice → ₹270/kg'],
   story:'The installed-capacity nameplate, the production register and the HT power bill together pin output and price — the manufacturing template rewards machine-level evidence over a wide-angle shot.' },
 { key:'godown_a', id:'godown_owner', band:'metro', city:'Warehouse / godown owner',
   blurb:'Rents warehouse space by the square foot — near-zero COGS, the building is the asset, revenue is area × rent × occupancy.',
   captured:['exterior','neighbourhood','storage','occupancy_gauge','rental_agreement','interior','utility_meter','gst_board','pukka_invoice'],
   ext:{price:0.6, vol:22000},
   reads:['Occupancy read → bays largely full','Rent ledger → ₹0.6 /sq ft/day','Area measurement → ~22,000 sq ft'],
   story:'Rentable area and occupancy read from the photos and the lease schedule are the whole story here — a rent model looks nothing like a trading one, and the gallery shows the engine switching template accordingly.' },
 { key:'trader_a', id:'trader', band:'metro', city:'General-goods trader (C&F)',
   blurb:'Buys in bulk on supplier credit and resells B2B on a thin buy-sell margin — profit rides on inventory turn and the payables spread.',
   captured:['exterior','neighbourhood','interior','storage','dispatch','price_board','qr_code','gst_board','utility_meter','pukka_invoice','kacha_bill'],
   ext:{price:22, vol:3000},
   reads:['Dispatch register → outward volume','Usable-area pace-out → ~3,000 sq ft','GSTR-1 → B2B counterparties'],
   story:'A thin gross margin means the working-capital cycle, not the headline turnover, decides the credit — the dispatch register and area read size the throughput the trade actually turns.' },
 { key:'reg_medical_a', id:'reg_medical', band:'metro', city:'Registered medical practitioner',
   blurb:'Doctor’s clinic — consultations per day × fee, with a thin pharmacy/procedure add-on; mostly cash/UPI at point of care.',
   captured:['exterior','neighbourhood','interior','licence','appointment_register','fee_schedule','display','qr_code','gst_board','pukka_invoice'],
   ext:{price:650, vol:48},
   reads:['Fee board → ₹650 consult','OP register → ~48 patients/day','UPI settlement → banked share'],
   story:'The appointment register and fee board read a specific practice size; the UPI settlement fixes the banked-vs-cash split a lender needs — soft information hardened into an auditable scenario.' },
 { key:'realestate_a', id:'real_estate_agency', band:'metro', city:'Real estate brokerage',
   blurb:'Brokerage = deals closed × deal value × brokerage %; income is lumpy and lands as large irregular payments at closing.',
   captured:['exterior','neighbourhood','interior','staff_seating','deal_register','commission_statement','fee_schedule','licence','qr_code','gst_board'],
   ext:{price:230000, vol:4.2},
   reads:['Deal register → ~4 closings/month','Commission slab → ₹2.3 L avg brokerage','AA inflows → large irregular credits'],
   story:'Lumpy brokerage is exactly where a photo of the premises alone fails — the deal register and commission statements are what let the engine bound a high-variance income at all.' },
];
function _demoNarrow(dd){
  applyBand(dd.band||'metro');
  var st=defaultState(dd.id);
  var s=SECTORS[dd.id], cap=new Set(dd.captured||CAPTURE[dd.id]||[]);
  var prior={}; for(var k in st.drivers) prior[k]=st.drivers[k].base;
  st._narrowed={};
  var pk=_pick(st.drivers,PRICE_KEYS);
  if(pk && dd.ext && dd.ext.price>0){ _setBase(st.drivers[pk], _clamp(dd.ext.price, prior[pk]*0.3, prior[pk]*3)); st._narrowed[pk]=true; }
  var vk=_pick(st.drivers,VOL_KEYS);
  if(vk && dd.ext && dd.ext.vol>0){ _setBase(st.drivers[vk], _clamp(dd.ext.vol, prior[vk]*0.3, prior[vk]*3)); st._narrowed[vk]=true; }
  if(st.drivers.tonnage && dd.ext && dd.ext.weigh>0){ _setBase(st.drivers.tonnage, _clamp(dd.ext.weigh, prior.tonnage*0.3, prior.tonnage*3)); st._narrowed.tonnage=true; }
  (s.evidenceItems||[]).forEach(function(e){ if(cap.has(e.facet)){ var d=st.drivers[e.driver]; if(d){ var half=d.base*(e.narrowPct||0.08); d.lo=Math.max(d.lo,d.base-half); d.hi=Math.min(d.hi,d.base+half); st._narrowed[e.driver]=true; } } });
  st.providedShots=(dd.captured||CAPTURE[dd.id]||[]).map(function(f){return FACET_LABEL[f]||f;}).filter(function(l){return s.shotList.includes(l);});
  st.external=st.external||{energy:{kwh:0,months:1},gstin:null,banking:null,cashSharePct:null};
  return st;
}
function demo2Card(dd){
  var st=_demoNarrow(dd);
  var rPh=computeEstimate(dd.id, st.drivers, {external:st.external, providedShots:st.providedShots, flags:{}, inventory:st.inventory});
  applyBand(dd.band||'metro');
  var base=defaultState(dd.id);
  var rBase=computeEstimate(dd.id, base.drivers, {external:{}, providedShots:[], flags:{}});
  var nm=SECTORS[dd.id].name;
  var tvB={lo:rBase.turnover.conservative,base:rBase.turnover.base,hi:rBase.turnover.optimistic};
  var tvP={lo:rPh.turnover.conservative,base:rPh.turnover.base,hi:rPh.turnover.optimistic};
  var wB=rBase.turnover.relWidth, wP=rPh.turnover.relWidth;
  var domLo=Math.min(tvB.lo,tvP.lo)*0.92, domHi=Math.max(tvB.hi,tvP.hi)*1.05;
  var reads=(dd.reads||[]).map(function(r){return '<span class="chip on" style="cursor:default">'+r+'</span>';}).join(' ');
  var shots=st.providedShots.map(function(l){return '<span class="chip" style="cursor:default">✓ '+l+'</span>';}).join(' ');
  return '<div class="card"><div class="toolbar"><h2 style="margin:0;font-size:15px">'+nm+' · '+dd.city+'</h2>'
    +'<span class="tag '+(dd.band==='nonmetro'?'Benchmark':'Observed')+'">'+(dd.band==='nonmetro'?'Non-metro':'Metro')+'</span>'
    +'<span class="spacer"></span><a class="btn sm" href="#/assess?demo2='+dd.key+'">Load in workspace →</a></div>'
    +'<p class="note">'+dd.blurb+'</p>'
    +'<div style="margin:8px 0 2px"><span class="small dim">Captured on-site — '+st.providedShots.length+' photos:</span></div>'
    +'<div class="chiprow" style="margin:4px 0">'+shots+'</div>'
    +'<div style="margin:8px 0 2px"><span class="small dim">AI-read from those photos:</span></div>'
    +'<div class="chiprow" style="margin:4px 0">'+reads+'</div>'
    +'<table style="margin-top:8px"><thead><tr><th></th><th class="num">Cons.</th><th class="num">Base</th><th class="num">Optim.</th><th class="num">±width</th></tr></thead><tbody>'
    +'<tr><td>Sector prior (no photos)</td><td class="num">'+fmtCr(tvB.lo)+'</td><td class="num">'+fmtCr(tvB.base)+'</td><td class="num">'+fmtCr(tvB.hi)+'</td><td class="num">'+pct(wB)+'</td></tr>'
    +'<tr><td><b>From these photos</b></td><td class="num">'+fmtCr(tvP.lo)+'</td><td class="num"><b>'+fmtCr(tvP.base)+'</b></td><td class="num">'+fmtCr(tvP.hi)+'</td><td class="num">'+pct(wP)+'</td></tr>'
    +'</tbody></table>'
    +'<div class="interval" style="margin-top:10px"><div class="ivlabels"><span>Sector prior — relative width '+pct(wB)+'</span></div>'+ivbar(tvB,domLo,domHi)+'</div>'
    +'<div class="interval" style="margin-top:8px"><div class="ivlabels"><span>Driven by the captured photos — relative width '+pct(wP)+'</span></div>'+ivbar(tvP,domLo,domHi)+'</div>'
    +'<div class="grid cols-3" style="margin-top:12px">'
    +'<div class="kpi"><span class="k">EBITDA (base)</span><span class="v" style="font-size:18px">'+fmtCr(rPh.pnl.ebitda.base)+'</span></div>'
    +'<div class="kpi"><span class="k">Working-capital req.</span><span class="v" style="font-size:18px">'+fmtCr(rPh.pnl.wcr.base)+'</span></div>'
    +'<div class="kpi"><span class="k">Net trade cycle</span><span class="v" style="font-size:18px">'+rPh.pnl.cycleDays+'d</span></div>'
    +'</div>'
    +(dd.story?'<div class="callout" style="margin-top:12px">'+dd.story+'</div>':'')
    +'</div>';
}
function viewDemos2Gallery(){
  var cards=DEMO2.map(function(dd){ try{ return demo2Card(dd); }catch(e){ return ''; } }).join('');
  applyBand('metro');
  return '<section style="padding-top:2px"><h2 style="font-size:19px">Industry gallery — assessments driven by captured photos</h2>'
    +'<p class="lead">A sample of the 56 profiles, each computed by the same rule engine from a specific on-site photo set. The values read from the photos (price and volume) recentre the scenario and the captured evidence narrows it — so two businesses in the same trade (see the two chemists and the two food outlets) land on different numbers. Deterministic demonstrations, not validated accuracy.</p>'
    +'<div class="grid cols-2" style="margin-top:10px">'+cards+'</div></section>';
}
`;
client = client + "\n" + demo2Block;

/* ---------- local api dispatcher (adds archetype to sectors) ---------- */
const localApi = `
async function api(path, opts){
  if(path==='/api/meta') return { app:APP, nodeClasses:NODE_CLASSES, registry:REGISTRY,
    sectors:Object.values(SECTORS).map(s=>({id:s.id,name:s.name,archetype:s.archetype,revenueFormula:s.revenueFormula,drivers:s.drivers,shotList:s.shotList,evidenceItems:s.evidenceItems})),
    demos:Object.values(DEMOS).map(d=>({id:d.id,title:d.title,sector:d.sector,blurb:d.blurb})),
    propositions:PROPOSITIONS, workflow:WORKFLOW,
    dataDomains:DATA_DOMAINS, facets:FACETS, capture:CAPTURE };
  if(path==='/api/estimate'){ const b=JSON.parse(opts.body);
    return computeEstimate(b.sector,b.drivers,{external:b.external,policy:b.policy,providedShots:b.providedShots,flags:b.flags,inventory:b.inventory}); }
  if(path==='/api/demo/scrap'){ const d=DEMOS.scrap;
    const result=computeEstimate('scrap',d.drivers,{external:d.external,inventory:d.inventory,flags:d.flags,providedShots:SECTORS.scrap.shotList});
    return { demo:{id:d.id,title:d.title,sector:d.sector,blurb:d.blurb,story:d.story}, state:{drivers:d.drivers,external:d.external,inventory:d.inventory}, result }; }
  if(path==='/api/demo/supermarket'){ const d=DEMOS.supermarket;
    const initial=computeEstimate('retail',d.initial,{external:d.external,providedShots:SECTORS.retail.shotList.slice(0,4)});
    const closed=computeEstimate('retail',d.closed,{external:d.external,providedShots:SECTORS.retail.shotList});
    return { demo:{id:d.id,title:d.title,sector:d.sector,blurb:d.blurb,story:d.story}, state:{initial:d.initial,closed:d.closed}, result:{initial,closed,narrowing:{from:initial.turnover.relWidth,to:closed.turnover.relWidth}} }; }
  throw new Error('no route '+path);
}
`;

const html = `<!doctype html><html lang="en"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Business X-Ray — An auditable first-pass assessment method for thin-file MSMEs</title>
<meta name="description" content="Business X-Ray: an auditable, human-supervised first-pass assessment method that turns premises photographs into traceable financial scenarios for thin-file MSMEs."/>
<style>${css}${PSL_OVERRIDE}</style>
</head><body>
${pslGate("1504")}
<header class="top"><div class="wrap">
  <a class="brand" href="#/assess"><span class="logo">PSL</span> Phone Se Loan
    <span class="pill">Business X-Ray · Analysis</span></a>
  <nav class="main" id="nav">
    <a href="/capture">Capture</a>
    <a href="/industries">Industry Models</a>
    <a href="#/assess">Assessment</a>
    <a href="/data-backbone">Data Backbone</a>
    <a href="#/demos">Demonstrations</a>
    <a href="#/governance">Governance</a>
  </nav>
</div></header>
<main id="view"><div class="wrap"><section><p class="muted">Loading…</p></section></div></main>
<footer class="footer"><div class="wrap">
  Business X-Ray · engine v2.1.0 · registry 2026.08 — an auditable first-pass assessment method and a pre-registration-ready research protocol,
  <b>not a validated credit-scoring model</b>. All figures are illustrative rule-engine outputs.
</div></footer>
<script>
${engine}
${bridge}
${propsBlock}
${wfBlock}
${client}
${localApi}
</script>
</body></html>`;

fs.writeFileSync("app.html", html);
console.log("app.html written:", (html.length/1024).toFixed(0)+"KB · profiles registered:", IND_SECTORS.length);
