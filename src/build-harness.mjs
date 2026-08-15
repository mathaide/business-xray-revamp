// Harness Engineering Sequence — dedicated platform section (/harness).
// Header tab + sub-tabs (Demo · Profiles(56) · Overview · Sequence · Configuration ·
// Test Cases · Feedback & Logs · Reports). The Demo runs the harness for ANY of the
// 56 industry profiles: a profile selector + a Profiles table drive per-profile,
// per-scenario execution and feedback generated live from each profile's own model
// numbers (turnover band, interval, EBITDA, WCR, key driver, primary evidence,
// missing-shot). Realistic sample data; no backend.
import { writeFileSync, readFileSync } from "node:fs";
import { AIOS_CSS, pslHeader, pslGate } from "./aios-theme.mjs";

const PROFILES = JSON.parse(readFileSync("./harness-profiles.json", "utf8"));

/* ---------------- 10-step sequence (grounded in the X-Ray underwriting agent) --------------- */
const STEPS = [
  { n:1,  key:"objective", icon:"🎯", title:"Define the objective / task", short:"Objective",
    desc:"State the decision-relevant goal and success criteria for this run." },
  { n:2,  key:"configure", icon:"⚙️", title:"Configure the harness environment", short:"Configure",
    desc:"Ephemeral sandbox, egress allowlist, scoped credentials, audit chain." },
  { n:3,  key:"select", icon:"🧠", title:"Select the model / agent under evaluation", short:"Select",
    desc:"Pick the system-under-test and its role, model tier and permissions." },
  { n:4,  key:"prepare", icon:"🧩", title:"Prepare input, prompt, tools & test data", short:"Prepare",
    desc:"Assemble the case: captured evidence, prompt, tool allowlist, test fixture." },
  { n:5,  key:"execute", icon:"▶️", title:"Execute the harness", short:"Execute",
    desc:"Kick off the planner → executor → verifier loop against the case." },
  { n:6,  key:"monitor", icon:"📡", title:"Monitor execution in real time", short:"Monitor",
    desc:"Stream planner decisions, tool calls and verifier verdicts as they happen." },
  { n:7,  key:"capture", icon:"📥", title:"Capture output & intermediate actions", short:"Capture",
    desc:"Record the evidence graph, tool I/O and the final scenario produced." },
  { n:8,  key:"evaluate", icon:"🧪", title:"Evaluate output against criteria", short:"Evaluate",
    desc:"Score against the gates: interval width ≤±20%, IRI floor, concordance." },
  { n:9,  key:"feedback", icon:"💬", title:"Generate feedback, errors & recommendations", short:"Feedback",
    desc:"Produce scores, flag issues and propose concrete improvements." },
  { n:10, key:"store", icon:"🗄️", title:"Store results for comparison & reporting", short:"Store",
    desc:"Persist the run to the registry for A/B, dashboards and future iterations." },
];

/* ---------------- scenario-level knobs (exec + feedback generated per profile in JS) --------------- */
// status codes: done | warn | fail | skip
const SCEN = {
  warning: { label:"Nominal with warning (recommended demo)",
    statuses:["done","done","done","done","done","done","done","warn","done","done"],
    result:"warning", resultText:"Completed with warnings — one gate flagged.",
    width:18, iri:0.71, acc:86, rel:92, comp:74, toolRate:95, latency:"2.8 s" },
  success: { label:"Clean success",
    statuses:["done","done","done","done","done","done","done","done","done","done"],
    result:"success", resultText:"Completed — all gates passed.",
    width:13, iri:0.84, acc:92, rel:95, comp:88, toolRate:100, latency:"2.4 s" },
  failure: { label:"Tool failure → escalation",
    statuses:["done","done","done","done","done","fail","skip","skip","done","done"],
    result:"failure", resultText:"Failed at monitor — escalated to a human with a reason code.",
    width:null, iri:null, acc:null, rel:null, comp:null, toolRate:67, latency:"1.6 s" }
};

const LEGEND = [
  ["done","Completed","var(--ok)"],["running","In progress","var(--brand)"],
  ["warn","Warning","#b8860b"],["fail","Failed / critical","var(--bad)"],["pending","Not started","#9aa4ba"]
];

/* ---------------- profile grouping (server-side markup) --------------- */
const ARCH_ORDER = ["fnb","retail","manufacturing","services","transport","warehouse","scrap"];
const ARCH_COLOR = {fnb:"#c2410c",manufacturing:"#7c3aed",retail:"#2563eb",services:"#0d9488",transport:"#b45309",warehouse:"#4f46e5",scrap:"#6b7280"};
const byArch = {};
PROFILES.forEach(p=>{ (byArch[p.arch] = byArch[p.arch]||[]).push(p); });
const archList = ARCH_ORDER.filter(a=>byArch[a]);

const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

// <select> optgroups (grouped by archetype), default pharmacy
const profileOptions = archList.map(a=>{
  const label = byArch[a][0].archLabel;
  const opts = byArch[a].map(p=>'<option value="'+p.id+'"'+(p.id==="pharmacy"?" selected":"")+'>'+esc(p.name)+'</option>').join("");
  return '<optgroup label="'+esc(label)+'">'+opts+'</optgroup>';
}).join("");

// Profiles(56) table rows
const archPill = p => '<span class="arcpill" style="background:'+ARCH_COLOR[p.arch]+'22;color:'+ARCH_COLOR[p.arch]+';border-color:'+ARCH_COLOR[p.arch]+'44">'+esc(p.archLabel)+'</span>';
const profileRows = archList.flatMap(a=>byArch[a]).map((p,i)=>
  '<tr class="prow" data-pid="'+p.id+'" data-arch="'+p.arch+'" data-name="'+esc((p.name+" "+p.sub).toLowerCase())+'">'
  +'<td class="mono small">'+p.fixture+'</td>'
  +'<td><b>'+esc(p.name)+'</b><div class="small dim">'+esc(p.sub)+'</div></td>'
  +'<td>'+archPill(p)+'</td>'
  +'<td class="small">'+esc(p.band)+'</td>'
  +'<td class="small">'+esc(p.drvLabel)+'</td>'
  +'<td class="small">'+esc(p.evLabel)+'</td>'
  +'<td class="small num">±'+p.photoW+'% → ±13%</td>'
  +'<td><button class="runbtn" data-pid="'+p.id+'">▶ Run</button></td></tr>').join("");

const EXTRA_CSS = `
.hwrap{max-width:1240px}
/* distinct hero band for the section */
.hxhero{background:linear-gradient(120deg,#0f1b3d,#2b1b57 60%,#3a1f4d);color:#fff;border-radius:16px;padding:22px 24px;margin:14px 0 6px;position:relative;overflow:hidden}
.hxhero:before{content:"";position:absolute;right:-40px;top:-40px;width:220px;height:220px;background:radial-gradient(circle,rgba(120,120,255,.35),transparent 70%)}
.hxhero h1{color:#fff;font-size:24px;margin:0 0 4px}
.hxhero p{color:#c7d0e6;font-size:13.5px;max-width:80ch;margin:0}
.hxhero .pillrow{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
.hxpill{font-size:11px;font-weight:700;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.22);color:#e7ecfb;border-radius:999px;padding:4px 11px}
/* sub-tabs */
.subtabs{display:flex;gap:6px;flex-wrap:wrap;margin:14px 0 4px;border-bottom:1px solid var(--line);padding-bottom:0}
.subtab{font-size:13px;font-weight:600;color:var(--mut);background:transparent;border:none;border-bottom:2px solid transparent;padding:9px 13px;cursor:pointer;border-radius:8px 8px 0 0}
.subtab:hover{color:var(--ink);background:#eef1f7}
.subtab.on{color:var(--brand-ink);border-bottom-color:var(--brand);background:#fff}
.pane{display:none} .pane.on{display:block}
/* demo toolbar */
.demobar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:6px 0 2px}
.dbtn{display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:700;border:1px solid var(--brand);background:var(--brand);color:#fff;border-radius:9px;padding:9px 15px;cursor:pointer}
.dbtn:hover{background:var(--brand-ink)}
.dbtn.ghost{background:#fff;color:var(--ink);border-color:var(--line)} .dbtn.ghost:hover{border-color:#c9d2e6}
.dbtn:disabled{opacity:.45;cursor:not-allowed}
.dsel{background:#fff;border:1px solid var(--line);border-radius:9px;padding:8px 11px;font-size:13px;max-width:230px}
.selwrap{display:flex;flex-direction:column;gap:2px}
.selwrap label{font-size:10px;text-transform:uppercase;letter-spacing:.4px;color:var(--mut);font-weight:700}
/* profile summary strip */
.psum{display:flex;gap:16px;flex-wrap:wrap;align-items:center;border:1px solid var(--line);background:#f8fafd;border-radius:11px;padding:9px 13px;margin:10px 0 2px;font-size:12.5px}
.psum b{color:var(--ink)} .psum .k{color:var(--mut);font-weight:700;text-transform:uppercase;font-size:10px;letter-spacing:.4px;margin-right:5px}
.psum .seg{display:flex;align-items:center;gap:4px}
/* progress */
.hxprog{height:12px;background:#e9edf5;border-radius:999px;overflow:hidden;margin:12px 0 4px}
.hxprog > i{display:block;height:100%;width:0;background:linear-gradient(90deg,#2f6bff,#6b3fb0);transition:width .5s ease}
.hxprogmeta{display:flex;justify-content:space-between;font-size:12px;color:var(--mut)}
/* timeline */
.tl{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:12px}
@media(max-width:820px){.tl{grid-template-columns:1fr}}
.tlnode{display:flex;gap:11px;align-items:flex-start;border:1px solid var(--line);border-radius:11px;padding:11px 12px;background:#fff;transition:border-color .2s,box-shadow .2s}
.tlnode.running{border-color:#bcd0ff;box-shadow:0 0 0 3px #e8eefc}
.tlnode.done{border-color:#bfe6cf}
.tlnode.warn{border-color:#f0d9a0}
.tlnode.fail{border-color:#f0b8c2}
.tlnode.skip{opacity:.5}
.dot{flex:none;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:800;color:#fff;background:#9aa4ba}
.dot.running{background:var(--brand);animation:pulse 1s infinite}
.dot.done{background:var(--ok)} .dot.warn{background:#b8860b} .dot.fail{background:var(--bad)} .dot.skip{background:#c2c9d6}
@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(47,107,255,.5)}50%{box-shadow:0 0 0 6px rgba(47,107,255,0)}}
.tlnode .body{flex:1;min-width:0}
.tlnode .tt{font-weight:700;font-size:13px;display:flex;align-items:center;gap:6px}
.tlnode .td{font-size:11.5px;color:var(--mut);margin-top:2px}
.stbadge{font-size:10px;font-weight:800;border-radius:5px;padding:2px 7px;text-transform:uppercase;letter-spacing:.3px}
.stbadge.pending{background:#eef1f7;color:#5b6478}
.stbadge.running{background:#e8eefc;color:var(--brand-ink)}
.stbadge.done{background:var(--okbg);color:var(--ok)}
.stbadge.warn{background:#fdf3e1;color:#8a5a00}
.stbadge.fail{background:var(--badbg);color:var(--bad)}
.stbadge.skip{background:#eef1f7;color:#9aa4ba}
/* exec + feedback columns */
.execgrid{display:grid;grid-template-columns:1.15fr .85fr;gap:14px;margin-top:14px}
@media(max-width:980px){.execgrid{grid-template-columns:1fr}}
.panel{border:1px solid var(--line);border-radius:12px;background:#fff;box-shadow:var(--shadow);overflow:hidden}
.panel h3{margin:0;font-size:12px;letter-spacing:.5px;text-transform:uppercase;color:var(--mut);padding:12px 14px;border-bottom:1px solid var(--line2)}
.panel .pbody{padding:12px 14px}
.exrow{margin-bottom:11px}
.exrow .k{font-size:10.5px;text-transform:uppercase;letter-spacing:.4px;color:var(--mut);font-weight:700;display:block;margin-bottom:3px}
.exrow .v{font-size:12.5px;color:var(--ink);line-height:1.5}
.emptybox{min-height:120px;display:grid;place-items:center;text-align:center;color:var(--dim);font-size:12.5px;border:1.5px dashed var(--line);border-radius:10px;background:#fbfcff}
.toolline{display:flex;justify-content:space-between;gap:8px;font-size:12px;padding:6px 9px;border:1px solid var(--line);border-radius:8px;margin-bottom:6px;background:#fff;opacity:0;transform:translateY(4px);transition:opacity .3s,transform .3s}
.toolline.show{opacity:1;transform:none}
.toolline .mono{font-family:var(--mono);font-size:11.5px}
.toolline .ok{color:var(--ok);font-weight:700} .toolline .bad{color:var(--bad);font-weight:700}
.reason{font-size:12px;color:var(--ink);border-left:3px solid var(--brand);background:#f7faff;padding:7px 10px;border-radius:0 8px 8px 0;margin-bottom:6px;opacity:0;transform:translateY(4px);transition:opacity .3s,transform .3s}
.reason.show{opacity:1;transform:none}
.outbox{font-size:12.5px;line-height:1.55;background:#f6fdf9;border:1px solid #bfe6cf;border-radius:9px;padding:10px 12px;color:var(--ink)}
.outbox.fail{background:#fbe9ec;border-color:#f0b8c2}
/* scores */
.scoregrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.score .k{font-size:10.5px;text-transform:uppercase;letter-spacing:.4px;color:var(--mut);font-weight:700}
.score .v{font-size:20px;font-weight:800;letter-spacing:-.3px}
.meter{height:7px;background:#eef1f7;border-radius:999px;overflow:hidden;margin-top:5px}
.meter > i{display:block;height:100%;width:0;border-radius:999px;transition:width .8s ease}
.mg{background:var(--ok)} .mb{background:var(--brand)} .my{background:#b8860b} .mr{background:var(--bad)}
.fbline{font-size:12px;padding:7px 10px;border-radius:8px;margin-bottom:6px;border:1px solid var(--line);background:#fff}
.fbline.good{border-color:#bfe6cf;background:#f6fdf9}
.fbline.warnl{border-color:#f0d9a0;background:#fffaf0}
.fbline.badl{border-color:#f0b8c2;background:#fbe9ec}
.rec{font-size:12px;padding:7px 10px;border-radius:8px;margin-bottom:6px;background:#eef4ff;border:1px solid #cfe0ff;color:#1c49c9}
.rec:before{content:"➤ ";font-weight:800}
/* generic cards / grid reuse */
.hcards{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
@media(max-width:980px){.hcards{grid-template-columns:1fr 1fr}}
@media(max-width:640px){.hcards{grid-template-columns:1fr}}
.hcard{border:1px solid var(--line);border-radius:12px;padding:14px;background:#fff;box-shadow:var(--shadow)}
.hcard .ic{font-size:20px} .hcard b{display:block;margin:6px 0 3px;font-size:14px}
.hcard p{font-size:12.5px;color:var(--mut);margin:0;line-height:1.5}
/* sequence vertical */
.seq{position:relative;margin-top:8px}
.seq .snode{display:flex;gap:13px;padding:0 0 16px 0;position:relative}
.seq .snum{flex:none;width:30px;height:30px;border-radius:50%;background:var(--brand);color:#fff;font-weight:800;display:grid;place-items:center;font-size:13px;z-index:1}
.seq .snode:not(:last-child):after{content:"";position:absolute;left:14px;top:30px;bottom:0;width:2px;background:var(--line)}
.seq .sbody b{font-size:14px} .seq .sbody p{font-size:12.5px;color:var(--mut);margin:2px 0 0}
.legend{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:var(--mut);margin:8px 0}
.legend span{display:inline-flex;align-items:center;gap:6px}
.ldot{width:11px;height:11px;border-radius:50%;display:inline-block}
/* logs table */
.logtable{width:100%;border-collapse:collapse;font-size:12px}
.logtable th,.logtable td{text-align:left;padding:7px 9px;border-bottom:1px solid var(--line2)}
.logtable th{font-size:10.5px;text-transform:uppercase;letter-spacing:.4px;color:var(--mut)}
.lvl{font-size:10px;font-weight:800;border-radius:5px;padding:2px 6px}
.lvl.info{background:#e8eefc;color:var(--brand-ink)} .lvl.ok{background:var(--okbg);color:var(--ok)}
.lvl.warn{background:#fdf3e1;color:#8a5a00} .lvl.err{background:var(--badbg);color:var(--bad)}
/* mini bar chart */
.bars{display:flex;align-items:flex-end;gap:14px;height:150px;padding:10px 6px;border-bottom:1px solid var(--line);border-left:1px solid var(--line)}
.bar{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%}
.bar > i{width:70%;border-radius:6px 6px 0 0;background:linear-gradient(180deg,#6b3fb0,#2f6bff)}
.bar .bl{font-size:10.5px;color:var(--mut);margin-top:6px} .bar .bv{font-size:11px;font-weight:700}
/* profiles(56) table */
.pfilter{display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;margin:12px 0 6px}
.arcpill{font-size:10.5px;font-weight:700;border:1px solid;border-radius:999px;padding:2px 9px;white-space:nowrap}
.ptable{width:100%;border-collapse:collapse;font-size:12.5px}
.ptable th,.ptable td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--line2);vertical-align:top}
.ptable th{font-size:10.5px;text-transform:uppercase;letter-spacing:.4px;color:var(--mut);position:sticky;top:0;background:#fff}
.ptable tr.prow{cursor:pointer} .ptable tr.prow:hover{background:#f4f8ff}
.runbtn{font-size:11px;font-weight:700;border:1px solid var(--brand);color:var(--brand);background:#fff;border-radius:7px;padding:5px 10px;cursor:pointer;white-space:nowrap}
.runbtn:hover{background:var(--brand);color:#fff}
.arccov{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0}
.arccov .ac{border:1px solid var(--line);border-radius:9px;padding:7px 11px;font-size:12px;background:#fff}
.arccov .ac b{font-size:15px;display:block}
`;

/* ---------------- static markup helpers (built server-side) --------------- */
const timelineNodes = STEPS.map(s=>
  '<div class="tlnode" id="tl-'+s.key+'"><div class="dot" id="dot-'+s.key+'">'+s.n+'</div>'
  +'<div class="body"><div class="tt">'+s.icon+' '+s.title+' <span class="stbadge pending" id="badge-'+s.key+'">Pending</span></div>'
  +'<div class="td">'+s.desc+'</div></div></div>').join("");

const seqNodes = STEPS.map(s=>
  '<div class="snode"><div class="snum">'+s.n+'</div><div class="sbody"><b>'+s.title+'</b><p>'+s.desc+'</p></div></div>').join("");

const legendHtml = '<div class="legend">'+LEGEND.map(l=>'<span><i class="ldot" style="background:'+l[2]+'"></i>'+l[1]+'</span>').join("")+'</div>';

/* Overview cards — the 8 harness components */
const COMPONENTS = [
  ["🧭","Planner","Chooses the next objective by expected uncertainty reduction per unit cost/time (Eq-7)."],
  ["⚡","Executor","Runs one planned step via the Tool Router or the capture sub-agent. Deliberately thin."],
  ["🛡️","Verifier","Independently checks every output — schema, business rules, guardrails — before it enters memory."],
  ["🧠","Memory","Four tiers: working state, human-confirmed facts, append-only audit log, cross-case priors."],
  ["🔀","Tool Router","The only path out. Allowlist, scoped short-lived creds the model never sees, retries, logging."],
  ["✋","Approval Gate","Blocks human-required steps until a named human approves. Tiered by risk × impact."],
  ["📝","Logger / Tracer","One trace_id per case, span_id per step — every prompt, tool call and decision."],
  ["🔗","X-Ray Integrator","Typed adapter to the Business X-Ray engine: pulls diagnostics per profile, proposes new signals."],
];
const overviewCards = COMPONENTS.map(c=>'<div class="hcard"><span class="ic">'+c[0]+'</span><b>'+c[1]+'</b><p>'+c[2]+'</p></div>').join("");

/* Configuration sample */
const CONFIG = [
  ["Profile suite","56 industry profiles across 7 archetypes — each with its own drivers, evidence ladder & floors"],
  ["Execution context","Ephemeral sandbox container · one per case · destroyed at close"],
  ["Isolation","Network egress allowlist · Router-issued scoped, short-lived credentials · tenant isolation"],
  ["System under test","X-Ray Underwriting Agent · role underwriting.first_pass"],
  ["Model","claude-opus-4-8 · reasoning: high"],
  ["Tool allowlist","xray.assess · gstn.get_filings · udyam.lookup · aa.fetch_inflows · bureau.pull · los.attach_package (+5)"],
  ["Stop / quality gates","interval half-width ≤ ±20% · IRI ≥ profile floor · concordance C · no unresolved conflict"],
  ["Approval tiers","T0 auto · T1 review · T2 maker-checker · T3 committee (by risk × impact)"],
  ["Governing objective","Minimise credit risk · TAT < 48h · full auditability · human-only sanction"],
  ["Posture","Sandbox / mock external pulls · redacted · no funds movement · abstention is valid"],
];
const configRows = CONFIG.map(c=>'<tr><td style="font-weight:600;white-space:nowrap">'+c[0]+'</td><td>'+c[1]+'</td></tr>').join("");

/* Test cases — a representative slice across the 56, one per archetype where possible */
const casePick = [
  ["pharmacy","warn","±20% width, IRI≥0.75","±18%, IRI 0.71"],
  ["restaurant","done","±20% width","±12%"],
  ["scrap_dealer","done","cash-share flagged","flagged ✓"],
  ["wholesale_cf","done","concordance ≥0.8","0.86"],
  ["vehicle_service","done","tool-use ≥90%","95%"],
  ["garment_manufacturing_jobwork","done","±20% width","±14%"],
  ["goods_transport","done","utilisation observed","FASTag ✓"],
  ["hardware_paint_sanitary","fail","consent valid","EXPIRED → escalate"],
];
const pById = Object.fromEntries(PROFILES.map(p=>[p.id,p]));
const caseRows = casePick.map(c=>{ const p=pById[c[0]]||{fixture:"—",name:c[0]};
  return '<tr><td class="mono">'+p.fixture+'</td><td>'+esc(p.name)+'</td><td class="small">'+c[2]+'</td><td class="small">'+c[3]+'</td><td><span class="stbadge '+c[1]+'">'+(c[1]==="done"?"Pass":c[1]==="warn"?"Warn":"Fail")+'</span></td></tr>';
}).join("");

/* Reports: recent runs + bar chart + archetype coverage */
const RUNS = [ ["pharmacy","warning",86],["restaurant","success",93],["scrap_dealer","success",90],["hardware_paint_sanitary","failure",0],["wholesale_cf","success",91] ];
const runRows = RUNS.map((r,i)=>{ const p=pById[r[0]]; return '<tr><td class="mono">#'+(241-i)+'</td><td>'+esc(p?p.name:r[0])+'</td><td><span class="stbadge '+(r[1]==="success"?"done":r[1]==="warning"?"warn":"fail")+'">'+r[1]+'</span></td><td class="num">'+(r[2]?r[2]+"%":"—")+'</td></tr>'; }).join("");
const bars = RUNS.slice().reverse().map((r,i)=>'<div class="bar"><div class="bv">'+(r[2]||0)+'%</div><i style="height:'+(r[2]||3)+'%"></i><div class="bl">#'+(237+i)+'</div></div>').join("");
const archCov = archList.map(a=>'<div class="ac"><b>'+byArch[a].length+'</b>'+esc(byArch[a][0].archLabel)+'</div>').join("");

const html = `<!doctype html><html lang="en"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Phone Se Loan — Harness Engineering Sequence</title>
<style>${AIOS_CSS}${EXTRA_CSS}</style></head><body>
${pslGate("1504")}
${pslHeader("Harness Engineering Sequence","Define → configure → execute → monitor → evaluate → feedback → store · runs across all 56 industry profiles with live, colour-coded feedback")}
<nav class="psl-nav"><div class="wrap">
  <a class="tab" href="/capture">Capture</a>
  <a class="tab" href="/industries">Industry Models</a>
  <a class="tab" href="/app">Assessment</a>
  <a class="tab" href="/data-backbone">Data Backbone</a>
  <a class="tab active" href="/harness">Harness Sequence</a>
  <a class="tab" href="/terms">Terms &amp; Consent</a>
</div></nav>
<main><div class="wrap hwrap">

<div class="hxhero">
  <h1>⚙️ Harness Engineering Sequence</h1>
  <p>The engineered loop that runs and evaluates the X-Ray Underwriting Agent — a disciplined sequence from objective to stored result, with a verifier, tiered human gates and dynamic feedback at every stage. Pick any of the <b>56 industry profiles</b> and the <b>Demo</b> runs the whole thing live on that profile's own numbers (no backend required).</p>
  <div class="pillrow"><span class="hxpill">56 industry profiles</span><span class="hxpill">7 archetypes</span><span class="hxpill">10-stage sequence</span><span class="hxpill">Colour-coded feedback</span><span class="hxpill">Success · Warning · Failure</span></div>
</div>

<div class="subtabs">
  <button class="subtab on" data-pane="demo">Demo</button>
  <button class="subtab" data-pane="profiles">Profiles (56)</button>
  <button class="subtab" data-pane="overview">Overview</button>
  <button class="subtab" data-pane="sequence">Sequence</button>
  <button class="subtab" data-pane="config">Configuration</button>
  <button class="subtab" data-pane="cases">Test Cases</button>
  <button class="subtab" data-pane="logs">Feedback &amp; Logs</button>
  <button class="subtab" data-pane="reports">Reports</button>
</div>

<!-- ===================== DEMO ===================== -->
<section class="pane on" id="pane-demo" style="padding-top:8px">
  <div class="demobar">
    <button class="dbtn" id="startBtn">▶ Start Demo</button>
    <button class="dbtn ghost" id="pauseBtn" disabled>⏸ Pause</button>
    <button class="dbtn ghost" id="resetBtn">↺ Reset</button>
    <span class="spacer" style="flex:1"></span>
    <div class="selwrap"><label>Industry profile (56)</label>
      <select class="dsel" id="profSel">${profileOptions}</select></div>
    <div class="selwrap"><label>Scenario</label>
      <select class="dsel" id="scenSel">
        <option value="warning">Nominal with warning</option>
        <option value="success">Clean success</option>
        <option value="failure">Tool failure → escalation</option>
      </select></div>
  </div>
  <div class="psum" id="psum"></div>
  ${legendHtml}
  <div class="hxprog"><i id="progBar"></i></div>
  <div class="hxprogmeta"><span id="progLabel">Idle — press Start Demo</span><span id="progPct">0 / 10</span></div>

  <div class="tl" id="timeline">${timelineNodes}</div>

  <div class="execgrid">
    <div class="panel">
      <h3>Execution panel</h3>
      <div class="pbody" id="execBody">
        <div class="emptybox" id="execEmpty">Empty — start the demo to stream the harness execution here.</div>
        <div id="execContent" style="display:none">
          <div class="exrow" id="ex-objective" style="display:none"><span class="k">Input · objective</span><span class="v" id="v-objective"></span></div>
          <div class="exrow" id="ex-config" style="display:none"><span class="k">Environment</span><span class="v" id="v-config"></span></div>
          <div class="exrow" id="ex-select" style="display:none"><span class="k">System under test</span><span class="v" id="v-select"></span></div>
          <div class="exrow" id="ex-prepare" style="display:none"><span class="k">Prepared input · prompt · tools · data</span><span class="v" id="v-prepare"></span></div>
          <div class="exrow" id="ex-tools" style="display:none"><span class="k">Tools / actions triggered</span><div id="v-tools"></div></div>
          <div class="exrow" id="ex-reason" style="display:none"><span class="k">Intermediate reasoning / status</span><div id="v-reason"></div></div>
          <div class="exrow" id="ex-output" style="display:none"><span class="k">Final output</span><div class="outbox" id="v-output"></div></div>
        </div>
      </div>
    </div>
    <div class="panel">
      <h3>Feedback &amp; evaluation</h3>
      <div class="pbody" id="fbBody">
        <div class="emptybox" id="fbEmpty">Feedback appears when the run reaches the evaluation stage.</div>
        <div id="fbContent" style="display:none">
          <div class="scoregrid">
            <div class="score"><span class="k">Accuracy</span><span class="v" id="s-acc">—</span><div class="meter"><i id="m-acc" class="mg"></i></div></div>
            <div class="score"><span class="k">Relevance</span><span class="v" id="s-rel">—</span><div class="meter"><i id="m-rel" class="mb"></i></div></div>
            <div class="score"><span class="k">Completeness</span><span class="v" id="s-comp">—</span><div class="meter"><i id="m-comp" class="my"></i></div></div>
            <div class="score"><span class="k">Tool-use success</span><span class="v" id="s-tool">—</span><div class="meter"><i id="m-tool" class="mg"></i></div></div>
          </div>
          <div class="grid cols-2" style="margin-top:10px">
            <div class="kpi"><span class="k">Latency</span><span class="v" id="s-lat" style="font-size:18px">—</span></div>
            <div class="kpi"><span class="k">Result</span><span class="v" id="s-res" style="font-size:15px">—</span></div>
          </div>
          <h3 style="padding:12px 0 4px;border:none">Evaluation</h3>
          <div id="fbIssues"></div>
          <div class="note small" id="fbComments" style="margin:6px 0"></div>
          <h3 style="padding:8px 0 4px;border:none">Recommendations</h3>
          <div id="fbRecs"></div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ===================== PROFILES (56) ===================== -->
<section class="pane" id="pane-profiles">
  <h2 style="font-size:19px;margin-top:8px">Harness coverage — all 56 industry profiles</h2>
  <p class="lead">Every profile is wired into the same harness: its own drivers, evidence ladder, benchmark floors and turnover band. Filter the list, then click a row (or <b>Run</b>) to load that profile into the Demo and watch the harness execute it.</p>
  <div class="arccov">${archCov}</div>
  <div class="pfilter">
    <div class="selwrap"><label>Search</label><input class="dsel" id="pq" placeholder="name or sub-type…" style="max-width:260px"/></div>
    <div class="selwrap"><label>Archetype</label>
      <select class="dsel" id="pa"><option value="">All archetypes</option>${archList.map(a=>'<option value="'+a+'">'+esc(byArch[a][0].archLabel)+'</option>').join("")}</select></div>
    <span class="spacer" style="flex:1"></span>
    <span class="small dim" id="pcount"></span>
  </div>
  <div class="card" style="margin-top:4px;max-height:620px;overflow:auto">
    <table class="ptable"><thead><tr>
      <th>Fixture</th><th>Profile</th><th>Type</th><th>Turnover band</th><th>Key driver</th><th>Primary evidence (Eq-7 next)</th><th class="num">Interval</th><th></th>
    </tr></thead><tbody id="pbody">${profileRows}</tbody></table>
  </div>
</section>

<!-- ===================== OVERVIEW ===================== -->
<section class="pane" id="pane-overview">
  <h2 style="font-size:19px;margin-top:8px">What the harness is</h2>
  <p class="lead">The harness wraps the model in eight cooperating components, each with one job, a typed contract and its own failure behaviour — so a fault is contained and observable, not silently corrupting the case. It acquires, estimates, reconciles and recommends across all 56 profiles; a human decides.</p>
  <div class="hcards" style="margin-top:12px">${overviewCards}</div>
  <div class="callout ext" style="margin-top:14px"><b style="color:var(--ext)">Governing objective.</b> Minimise credit risk while keeping TAT under 48 hours, with full regulator-grade auditability and human-only sanction. Every stage below is justified against it — for every industry profile.</div>
</section>

<!-- ===================== SEQUENCE ===================== -->
<section class="pane" id="pane-sequence">
  <h2 style="font-size:19px;margin-top:8px">The 10-stage workflow</h2>
  <p class="lead">A short, mostly-fixed plan made adaptive: the loop chooses whether to acquire more evidence, ask, pull an external signal or stop — by what most reduces decision-relevant uncertainty, given the TAT budget. The plan is identical across profiles; the profile decides which evidence and floors bind.</p>
  <div class="seq" style="margin-top:12px">${seqNodes}</div>
</section>

<!-- ===================== CONFIGURATION ===================== -->
<section class="pane" id="pane-config">
  <h2 style="font-size:19px;margin-top:8px">Harness configuration</h2>
  <p class="lead">The environment, permissions and gates this run executes under. Read-only sample; production values come from the versioned policy registry at decision time.</p>
  <div class="card" style="margin-top:12px"><table>${configRows}</table></div>
</section>

<!-- ===================== TEST CASES ===================== -->
<section class="pane" id="pane-cases">
  <h2 style="font-size:19px;margin-top:8px">Test cases</h2>
  <p class="lead">A representative, blinded slice of the 56-profile fixture set, with expected criteria and the latest actual result. The full suite runs one fixture per profile.</p>
  <div class="card" style="margin-top:12px"><table><thead><tr><th>Fixture</th><th>Profile</th><th>Expected</th><th>Actual</th><th>Result</th></tr></thead><tbody>${caseRows}</tbody></table></div>
</section>

<!-- ===================== FEEDBACK & LOGS ===================== -->
<section class="pane" id="pane-logs">
  <h2 style="font-size:19px;margin-top:8px">Feedback &amp; logs</h2>
  <p class="lead">Append-only, timestamped trace of the most recent run. Colour-coded by severity. Run the Demo to populate this live.</p>
  ${legendHtml}
  <div class="card" style="margin-top:6px"><table class="logtable" id="logTable"><thead><tr><th style="width:90px">Time</th><th style="width:70px">Level</th><th style="width:110px">Stage</th><th>Event</th></tr></thead><tbody id="logBody"><tr><td colspan="4" class="note" style="text-align:center;padding:18px">No events yet — start the Demo.</td></tr></tbody></table></div>
</section>

<!-- ===================== REPORTS ===================== -->
<section class="pane" id="pane-reports">
  <h2 style="font-size:19px;margin-top:8px">Reports</h2>
  <div class="grid cols-4" style="margin-top:8px">
    <div class="stat"><span class="k">Profiles wired</span><span class="v">56 / 56</span></div>
    <div class="stat"><span class="k">Pass rate</span><span class="v">88%</span></div>
    <div class="stat"><span class="k">Avg quality</span><span class="v">89%</span></div>
    <div class="stat"><span class="k">Median TAT</span><span class="v">2.6 s</span></div>
  </div>
  <div class="grid cols-2" style="margin-top:14px">
    <div class="card"><h3>Output quality — last 5 runs</h3><div class="bars">${bars}</div></div>
    <div class="card"><h3>Recent runs</h3><table><thead><tr><th>Run</th><th>Profile</th><th>Result</th><th class="num">Quality</th></tr></thead><tbody>${runRows}</tbody></table></div>
  </div>
  <div class="disclaimer" style="margin-top:14px">Illustrative sample data for demonstration. Production reports draw from the run registry (per-run trace, scores, gate outcomes) for A/B tests, drift and fairness slices — sliced by industry profile and archetype.</div>
</section>

</div></main>
<footer class="footer"><div class="wrap">Phone Se Loan AI Operating System · Business X-Ray · Harness Engineering Sequence — interactive demonstration across 56 industry profiles on sample data. The harness acquires, estimates and recommends; a human underwriter decides.</div></footer>
<script>
var STEPS=${JSON.stringify(STEPS)};
var SCEN=${JSON.stringify(SCEN)};
var PROFILES=${JSON.stringify(PROFILES)};
var PBYID={}; PROFILES.forEach(function(p){PBYID[p.id]=p;});
var $=function(id){return document.getElementById(id);};

/* sub-tab switching */
document.querySelectorAll('.subtab').forEach(function(b){ b.onclick=function(){
  document.querySelectorAll('.subtab').forEach(function(x){x.classList.remove('on');});
  document.querySelectorAll('.pane').forEach(function(x){x.classList.remove('on');});
  b.classList.add('on'); var p=$('pane-'+b.dataset.pane); if(p)p.classList.add('on');
}; });
function gotoDemo(){ document.querySelectorAll('.subtab').forEach(function(x){x.classList.toggle('on', x.dataset.pane==='demo');});
  document.querySelectorAll('.pane').forEach(function(x){x.classList.toggle('on', x.id==='pane-demo');}); }

/* ---- formatting helpers ---- */
function money(r){ if(r>=1e7) return '₹'+(r/1e7).toFixed(2)+' Cr'; if(r>=1e5) return '₹'+(r/1e5).toFixed(1)+' L'; return '₹'+Math.round(r).toLocaleString('en-IN'); }

/* ---- per-profile exec + feedback generation ---- */
function buildExec(p,key){
  var sc=SCEN[key]; var photo=p.photoW;
  var objective='First-pass underwriting · '+p.name+' ('+p.sub+') · turnover band '+p.band+' · ticket '+p.ticket+'.';
  var config='Sandbox: ephemeral container · egress allowlist (11 tools) · Router-scoped creds · audit chain ON · TAT budget 48h.';
  var select='X-Ray Underwriting Agent · model claude-opus-4-8 · role underwriting.first_pass · human-only sanction.';
  var xrayR=money(p.base)+' · ±'+photo+'%';
  var prepare,tools,reasoning,output;
  if(key==='failure'){
    prepare='Fixture '+p.fixture+' · 10 captured photos · prompt v2.1 · consent artefact: EXPIRED.';
    tools=[{t:'xray.assess',r:xrayR,ok:true},{t:'gstn.get_filings',r:'12-mo turnover band ✓',ok:true},{t:'aa.fetch_inflows',r:'BLOCKED — consent artefact expired',ok:false}];
    reasoning=[(p.cash?'Planner: high cash-share flag → mandate AA bank pull before recommending.':'Planner: bank corroboration required before recommending → AA pull.'),
      'Tool Router: aa.fetch_inflows refused — consent scope invalid/expired.',
      "Verifier: cannot satisfy 'bank-corroborated' gate → ESCALATE (reason: CONSENT_EXPIRED)."];
    output='— no recommendation produced — routed to underwriter (T2) with reason code CONSENT_EXPIRED.';
  } else {
    var nPhotos=(key==='warning')?9:10;
    prepare='Fixture '+p.fixture+' · '+nPhotos+' captured photos'+(key==='warning'?' (1 missing)':'')+' · prompt v2.1 · tools: xray.assess, gstn, aa, udyam, bureau.';
    tools=[{t:'xray.assess',r:xrayR,ok:true},{t:'gstn.get_filings',r:'12-mo turnover band · filing regular ✓',ok:true},{t:'aa.fetch_inflows',r:'avg credits ✓ · bounce 0',ok:true},{t:'udyam.lookup',r:'Micro ✓',ok:true},{t:'bureau.pull',r:'score band · 0 DPD',ok:true}];
    reasoning=['Planner: interval still ±'+photo+'% → acquire '+p.evLabel+' next to tighten '+p.drvLabel+' (Eq-7).',
      'Verifier: GSTIN checksum ✓ · WCR identity holds · no interval inversion.',
      (key==='warning')?('Note: '+p.missShot+' not captured — inventory / capacity leans on benchmark, not observed.')
                       :('Concordance C=0.88 between photo-derived turnover and GST-filed band.')];
    var w=sc.width; var lo=money(p.base*(1-w/100)), hi=money(p.base*(1+w/100));
    var recTxt=(key==='warning')?'review with condition':'eligible for review';
    output='Turnover '+money(p.base)+' ('+lo+'–'+hi+', ±'+w+'%) · EBITDA '+p.ebitdaStr+' · WCR '+p.wcrStr+' · IRI '+sc.iri.toFixed(2)+' · recommend band: '+recTxt+'.';
  }
  return {objective:objective,config:config,select:select,prepare:prepare,tools:tools,reasoning:reasoning,output:output};
}
function buildFeedback(p,key){
  var sc=SCEN[key];
  if(key==='failure') return {accuracy:null,relevance:null,completeness:null,latency:sc.latency,toolRate:sc.toolRate,
    issues:['Input validation: Passed.','Tool execution: FAILED — aa.fetch_inflows blocked (consent expired).',"Gate 'bank-corroborated' not satisfiable → abstention."],
    comments:'Run halted safely on '+p.name+'. Abstention is a valid, logged outcome — no autonomous decision was made.',
    recs:["Refresh the customer's Account-Aggregator consent and re-run.",'Add a pre-flight consent-validity check to the Prepare stage so this fails fast before Execute.']};
  if(key==='warning') return {accuracy:sc.acc,relevance:sc.rel,completeness:sc.comp,latency:sc.latency,toolRate:sc.toolRate,
    issues:['Input validation: Passed.','Tool execution: Completed successfully.','Detected issue: the response omitted one required data point ('+p.missShot+') — capacity fell back to benchmark.'],
    comments:'Output quality '+sc.acc+'% · Relevance High · Completeness Medium. Estimate is within the ±20% target but corroboration (IRI '+sc.iri.toFixed(2)+') is at the floor.',
    recs:['Add a validation step before final submission that requires '+p.missShot+' when it drives working capital.','Re-capture '+p.missShot+' to lift IRI above 0.75 before recommending.']};
  return {accuracy:sc.acc,relevance:sc.rel,completeness:sc.comp,latency:sc.latency,toolRate:sc.toolRate,
    issues:[],comments:'All quality gates met on '+p.name+'. Interval within ±20%, IRI above floor, external signals concordant.',
    recs:['Promote to underwriter review queue (T1).','Cache the GST concordance for the periodic refresh.']};
}
function renderSummary(p){
  $('psum').innerHTML='<span class="seg"><span class="k">Profile</span><b>'+p.name+'</b></span>'
    +'<span class="seg"><span class="k">Type</span>'+p.archLabel+' · '+p.sub+'</span>'
    +'<span class="seg"><span class="k">Band</span>'+p.band+'</span>'
    +'<span class="seg"><span class="k">Ticket</span>'+p.ticket+'</span>'
    +'<span class="seg"><span class="k">Fixture</span><span class="mono">'+p.fixture+'</span></span>';
}

/* ---- demo engine ---- */
var st={playing:false,paused:false,i:0,scen:'warning',pid:'pharmacy',exec:null,fb:null,timer:null};
var STAGE_MS=1000;
function badge(key,cls,txt){ var b=$('badge-'+key); if(b){b.className='stbadge '+cls;b.textContent=txt;} }
function nodeCls(key,cls){ var n=$('tl-'+key); var d=$('dot-'+key); if(n){n.className='tlnode '+cls;} if(d){d.className='dot '+cls; if(cls==='done')d.textContent='✓'; else if(cls==='warn')d.textContent='!'; else if(cls==='fail')d.textContent='✕'; else if(cls==='skip')d.textContent='–'; } }
function setProg(done){ var pct=Math.round(done/10*100); $('progBar').style.width=pct+'%'; $('progPct').textContent=done+' / 10'; }
function log(level,stage,text){ var tb=$('logBody'); if(tb.children.length===1 && tb.children[0].children.length===1){ tb.innerHTML=''; }
  var t=new Date(); var hh=('0'+t.getHours()).slice(-2), mm=('0'+t.getMinutes()).slice(-2), ssv=('0'+t.getSeconds()).slice(-2);
  var tr=document.createElement('tr'); tr.innerHTML='<td class="mono">'+hh+':'+mm+':'+ssv+'</td><td><span class="lvl '+level+'">'+level+'</span></td><td class="small">'+stage+'</td><td class="small">'+text+'</td>';
  tb.insertBefore(tr, tb.firstChild); }
function reveal(rowId){ var r=$(rowId); if(r) r.style.display='block'; }
function showExec(){ $('execEmpty').style.display='none'; $('execContent').style.display='block'; }

function applyExecForStep(key){
  var e=st.exec;
  if(key==='objective'){ showExec(); $('v-objective').textContent=e.objective; reveal('ex-objective'); }
  if(key==='configure'){ $('v-config').textContent=e.config; reveal('ex-config'); }
  if(key==='select'){ $('v-select').textContent=e.select; reveal('ex-select'); }
  if(key==='prepare'){ $('v-prepare').textContent=e.prepare; reveal('ex-prepare'); }
  if(key==='monitor'){ reveal('ex-tools'); var box=$('v-tools'); box.innerHTML='';
    e.tools.forEach(function(t,idx){ var d=document.createElement('div'); d.className='toolline';
      d.innerHTML='<span class="mono">'+t.t+'</span><span>'+t.r+' <span class="'+(t.ok?'ok':'bad')+'">'+(t.ok?'✓':'✕')+'</span></span>'; box.appendChild(d);
      setTimeout(function(){d.classList.add('show'); log(t.ok?'ok':'err','Monitor', (t.ok?'tool ok · ':'tool FAILED · ')+t.t+' → '+t.r);}, 120*idx+120); }); }
  if(key==='capture'){ reveal('ex-reason'); var rb=$('v-reason'); rb.innerHTML='';
    e.reasoning.forEach(function(r,idx){ var d=document.createElement('div'); d.className='reason'; d.textContent=r; rb.appendChild(d); setTimeout(function(){d.classList.add('show');},150*idx+120); });
    reveal('ex-output'); var ob=$('v-output'); ob.className='outbox'+(SCEN[st.scen].result==='failure'?' fail':''); ob.textContent=e.output; }
}
function showFeedback(){
  var f=st.fb; $('fbEmpty').style.display='none'; $('fbContent').style.display='block';
  $('s-acc').textContent=f.accuracy==null?'n/a':f.accuracy+'%'; $('m-acc').style.width=(f.accuracy||0)+'%';
  $('m-acc').className=f.accuracy==null?'mr':(f.accuracy>=85?'mg':'my');
  $('s-rel').textContent=f.relevance==null?'n/a':(f.relevance+'% · High'); $('m-rel').style.width=(f.relevance||0)+'%';
  $('s-comp').textContent=f.completeness==null?'n/a':(f.completeness+'% · '+(f.completeness>=85?'High':f.completeness>=70?'Medium':'Low')); $('m-comp').style.width=(f.completeness||0)+'%';
  $('m-comp').className=f.completeness==null?'mr':(f.completeness>=85?'mg':'my');
  $('s-tool').textContent=f.toolRate+'%'; $('m-tool').style.width=f.toolRate+'%'; $('m-tool').className=f.toolRate>=90?'mg':(f.toolRate>=70?'my':'mr');
  $('s-lat').textContent=f.latency;
  var res=SCEN[st.scen].result; $('s-res').innerHTML='<span class="stbadge '+(res==='success'?'done':res==='warning'?'warn':'fail')+'">'+SCEN[st.scen].resultText+'</span>';
  var iss=$('fbIssues'); iss.innerHTML=''; (f.issues.length?f.issues:['All checks passed.']).forEach(function(x){ var cls='good'; if(/omit|medium|floor/i.test(x))cls='warnl'; if(/fail|block|not satisf/i.test(x))cls='badl'; var d=document.createElement('div'); d.className='fbline '+cls; d.textContent=x; iss.appendChild(d); });
  $('fbComments').textContent=f.comments;
  var rc=$('fbRecs'); rc.innerHTML=''; f.recs.forEach(function(x){ var d=document.createElement('div'); d.className='rec'; d.textContent=x; rc.appendChild(d); });
}

function runStep(i){
  if(st.paused||!st.playing) return;
  if(i>=STEPS.length){ finish(); return; }
  st.i=i; var s=STEPS[i]; var scen=SCEN[st.scen]; var final=scen.statuses[i];
  nodeCls(s.key,'running'); badge(s.key,'running','Running');
  $('progLabel').textContent='Stage '+s.n+' — '+s.title;
  log('info', s.short, 'stage started');
  applyExecForStep(s.key);
  st.timer=setTimeout(function(){
    if(st.paused||!st.playing) return;
    nodeCls(s.key, final==='skip'?'skip':final); badge(s.key, final==='skip'?'skip':final, final==='done'?'Completed':final==='warn'?'Warning':final==='fail'?'Failed':'Skipped');
    log(final==='done'?'ok':final==='warn'?'warn':final==='fail'?'err':'info', s.short, final==='done'?'stage completed':final==='warn'?'completed with warning':final==='fail'?'stage FAILED — escalating':'skipped');
    setProg(i+1);
    if(s.key==='evaluate'){ showFeedback(); }
    if(final==='fail'){
      for(var j=i+1;j<STEPS.length;j++){ if(scen.statuses[j]==='skip'){ nodeCls(STEPS[j].key,'skip'); badge(STEPS[j].key,'skip','Skipped'); } }
      reveal('ex-output'); var ob=$('v-output'); ob.className='outbox fail'; ob.textContent=st.exec.output;
      showFeedback();
      st.timer=setTimeout(function(){ if(st.paused||!st.playing)return; nodeCls('feedback','done'); badge('feedback','done','Completed'); log('warn','Feedback','feedback + escalation recorded');
        st.timer=setTimeout(function(){ if(st.paused||!st.playing)return; nodeCls('store','done'); badge('store','done','Completed'); setProg(10); log('ok','Store','run persisted (escalated)'); finish(); }, STAGE_MS); }, STAGE_MS);
      return;
    }
    runStep(i+1);
  }, STAGE_MS);
}
function finish(){
  st.playing=false; $('startBtn').disabled=false; $('pauseBtn').disabled=true; $('scenSel').disabled=false; $('profSel').disabled=false;
  var res=SCEN[st.scen].result; $('progLabel').textContent=SCEN[st.scen].resultText;
  if($('fbContent').style.display==='none' || !$('fbContent').style.display){ showFeedback(); }
  log(res==='success'?'ok':res==='warning'?'warn':'err','Done',SCEN[st.scen].resultText);
}
function resetDemo(){
  if(st.timer)clearTimeout(st.timer);
  var pid=$('profSel').value, scen=$('scenSel').value;
  var p=PBYID[pid]||PROFILES[0];
  st={playing:false,paused:false,i:0,scen:scen,pid:pid,exec:buildExec(p,scen),fb:buildFeedback(p,scen),timer:null};
  renderSummary(p);
  STEPS.forEach(function(s){ nodeCls(s.key,''); $('dot-'+s.key).textContent=s.n; badge(s.key,'pending','Pending'); });
  setProg(0); $('progLabel').textContent='Idle — press Start Demo';
  $('execEmpty').style.display='grid'; $('execContent').style.display='none';
  ['ex-objective','ex-config','ex-select','ex-prepare','ex-tools','ex-reason','ex-output'].forEach(function(id){var r=$(id);if(r)r.style.display='none';});
  $('fbEmpty').style.display='grid'; $('fbContent').style.display='none';
  $('logBody').innerHTML='<tr><td colspan="4" class="note" style="text-align:center;padding:18px">No events yet — start the Demo.</td></tr>';
  $('startBtn').disabled=false; $('pauseBtn').disabled=true; $('scenSel').disabled=false; $('profSel').disabled=false; $('pauseBtn').textContent='⏸ Pause';
}
$('startBtn').onclick=function(){ if(st.playing)return; resetDemo(); st.playing=true; st.paused=false;
  $('startBtn').disabled=true; $('pauseBtn').disabled=false; $('scenSel').disabled=true; $('profSel').disabled=true;
  log('info','Harness','run started — '+PBYID[st.pid].name+' · scenario: '+SCEN[st.scen].label); runStep(0); };
$('pauseBtn').onclick=function(){ if(!st.playing)return; st.paused=!st.paused; $('pauseBtn').textContent=st.paused?'▶ Resume':'⏸ Pause';
  if(!st.paused){ log('info','Harness','resumed'); runStep(st.i+1); } else { if(st.timer)clearTimeout(st.timer); log('warn','Harness','paused'); } };
$('resetBtn').onclick=function(){ resetDemo(); };
$('scenSel').onchange=function(){ resetDemo(); };
$('profSel').onchange=function(){ resetDemo(); };

/* ---- profiles(56) table: filter + row/Run wiring ---- */
function pfilter(){
  var q=($('pq').value||'').toLowerCase().trim(), a=$('pa').value, shown=0;
  document.querySelectorAll('#pbody tr.prow').forEach(function(tr){
    var ok=(!a || tr.dataset.arch===a) && (!q || tr.dataset.name.indexOf(q)>=0);
    tr.style.display=ok?'':'none'; if(ok)shown++;
  });
  $('pcount').textContent=shown+' / '+PROFILES.length+' profiles';
}
function loadProfile(pid,run){ $('profSel').value=pid; resetDemo(); gotoDemo(); window.scrollTo({top:0,behavior:'smooth'}); if(run){ setTimeout(function(){$('startBtn').click();},250);} }
$('pq').oninput=pfilter; $('pa').onchange=pfilter;
document.querySelectorAll('#pbody tr.prow').forEach(function(tr){
  tr.addEventListener('click',function(e){ if(e.target.classList.contains('runbtn'))return; loadProfile(tr.dataset.pid,false); });
});
document.querySelectorAll('.runbtn').forEach(function(b){ b.addEventListener('click',function(e){ e.stopPropagation(); loadProfile(b.dataset.pid,true); }); });

pfilter();
resetDemo();
</script>
</body></html>`;

writeFileSync("/home/claude/business-xray/business-xray-harness.html", html);
console.log("Harness Engineering Sequence page:", (html.length/1024).toFixed(0)+"KB · profiles:", PROFILES.length);
