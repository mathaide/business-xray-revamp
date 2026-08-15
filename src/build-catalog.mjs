// Industries catalog in the Phone Se Loan AI OS theme (Business Analysis · Industry Models).
import { readFileSync, writeFileSync } from "node:fs";
import { AIOS_CSS, pslHeader, pslGate } from "./aios-theme.mjs";
const kb = JSON.parse(readFileSync("/home/claude/business-xray/industry-model.json","utf8"));

const scale=(o,k)=> (o.archetype==="scrap"&&k==="tonnage")?1000:1;
function rev(o,band){const ds=o.drivers[band];let lo=1,base=1,hi=1;for(const d of ds){const s=scale(o,d.key);lo*=d.lo*s;base*=d.base*s;hi*=d.hi*s;}return{lo,base,hi};}
function narrow(o,band){const ds=JSON.parse(JSON.stringify(o.drivers[band]));const m=Object.fromEntries(ds.map(d=>[d.key,d]));for(const e of o.evidenceItems||[]){if(e.target==="balance_sheet")continue;const d=m[e.driver];if(!d)continue;const h=d.base*e.narrowPct;d.lo=Math.max(d.lo,d.base-h);d.hi=Math.min(d.hi,d.base+h);}let lo=1,base=1,hi=1;for(const d of ds){const s=scale(o,d.key);lo*=d.lo*s;base*=d.base*s;hi*=d.hi*s;}return{lo,base,hi};}
const relHalf=I=>I.base>0?((I.hi-I.lo)/2)/I.base:0;
const fmt=n=> n==null?"—": Math.abs(n)>=1e7?"₹"+(n/1e7).toFixed(2)+" Cr":Math.abs(n)>=1e5?"₹"+(n/1e5).toFixed(2)+" L":"₹"+Math.round(n).toLocaleString("en-IN");
const esc=s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const ARCHE={retail:"Retail / kirana",fnb:"Food & beverage",services:"Services",warehouse:"Warehouse / distribution",scrap:"Scrap trading",manufacturing:"Light manufacturing",transport:"Transport / logistics"};
const FORMULA=Object.fromEntries(kb.meta.archetypes.map(a=>[a.id,a.revenueFormula]));
const counts={}; for(const o of kb.industries) counts[o.archetype]=(counts[o.archetype]||0)+1;

function driverTable(o,band){
  const rows=o.drivers[band].map(d=>`<tr><td>${esc(d.label)}</td><td><span class="tag ${esc(d.cls)}">${esc(d.cls)}</span></td><td class="num">${esc(d.lo)}</td><td class="num" style="font-weight:700">${esc(d.base)}</td><td class="num">${esc(d.hi)}</td><td class="dim small">${esc(d.unit||"")}</td></tr>`).join("");
  return `<table><thead><tr><th>Driver</th><th>Class</th><th class="num">lo</th><th class="num">base</th><th class="num">hi</th><th></th></tr></thead><tbody>${rows}</tbody></table>`;
}
function card(o){
  const R=rev(o,"metro"), Rn=rev(o,"nonmetro"), N=narrow(o,"metro");
  const rg=o.registry.metro; const ebit=R.base*(rg.gm[1]-rg.opex[1]);
  const preH=relHalf(R), postH=relHalf(N), reach=postH<=0.20;
  const occ=o.occupancy||{}, act=o.activitySignals||{};
  const rentM=occ.typicalRentMonthly?.metro, rentN=occ.typicalRentMonthly?.nonmetro;
  const shots=(o.shotList||[]).map((s,i)=>`<span class="pill" style="cursor:default"><b class="hl">${i+1}</b> ${esc(s)}</span>`).join(" ");
  const ev=(o.evidenceItems||[]).map(e=>`<div class="evidence-item"><div><div style="font-weight:600;font-size:13px">${esc(e.label)} <span class="tag ${esc(e.cls)}">${esc(e.cls)}</span></div><div class="note" style="margin-top:3px">${esc(e.note||"")}</div></div><div style="text-align:right;white-space:nowrap"><div class="mono small hl">→ ${esc(e.driver)}${e.target==="balance_sheet"?" (BS)":""}</div><div class="mono small dim">±${Math.round(e.narrowPct*100)}%</div></div></div>`).join("");
  const pack=(o.dataPack||[]).map(p=>`<tr><td style="font-weight:600">${esc(p.source)}</td><td>${esc(p.validates)}</td><td><span class="verdict ${p.strength==='strong'?'concordant':p.strength==='medium'?'partial':'conflict'}">${esc(p.strength)}</span></td></tr>`).join("");
  return `<article class="card" data-arch="${o.archetype}" data-name="${esc((o.name+' '+(o.subtype||'')).toLowerCase())}" style="margin-bottom:16px">
    <div class="toolbar" style="margin-bottom:8px"><div><h2 style="margin:0">${esc(o.name)}</h2><div class="note">${esc(o.subtype||"")} · <span class="mono">${esc(o.id)}</span></div></div><span class="spacer"></span><span class="pill on">${ARCHE[o.archetype]}</span></div>
    <p class="note" style="margin:.1em 0 12px">${esc(o.economics||"")}</p>
    <div class="stats" style="margin-bottom:12px">
      <div class="stat"><span class="k">Turnover · metro</span><span class="v">${fmt(R.base)}</span></div>
      <div class="stat"><span class="k">Turnover · non-metro</span><span class="v">${fmt(Rn.base)}</span></div>
      <div class="stat"><span class="k">EBITDA · metro</span><span class="v">${fmt(ebit)}</span></div>
      <div class="stat"><span class="k">Half-width (photo)</span><span class="v">±${Math.round(preH*100)}%→${Math.round(postH*100)}%</span></div>
    </div>
    <div class="grid cols-2">
      <div class="card tight"><h3>Revenue drivers · metro <span class="dim small mono">${esc(FORMULA[o.archetype])}</span></h3>${driverTable(o,"metro")}
        <div class="callout" style="margin-top:10px"><b>Registry:</b> gm [${rg.gm.join(", ")}] · opex [${rg.opex.join(", ")}] · DIO ${rg.dio}d · DSO ${rg.dso}d · DPO ${rg.dpo}d · η ${rg.eta}</div></div>
      <div class="card tight"><h3>Occupancy — owned vs rented</h3>
        <table><tbody>
          <tr><td>Rent/mo · metro</td><td class="num mono">${rentM?rentM.map(fmt).join(" / "):"—"}</td></tr>
          <tr><td>Rent/mo · non-metro</td><td class="num mono dim">${rentN?rentN.map(fmt).join(" / "):"—"}</td></tr>
          <tr><td>Deposit → BS asset</td><td class="num mono">${esc(occ.depositMonths??"—")} months</td></tr>
        </tbody></table>
        <div class="callout ext" style="margin-top:8px"><b>Owned signal:</b> ${esc(occ.ownedSignal||"")}</div>
        <h3 style="margin-top:12px">Balance-sheet build</h3><p class="note">${esc(o.balanceSheetNotes||"")}</p></div>
    </div>
    <div class="grid cols-2" style="margin-top:6px">
      <div class="card tight"><h3>Guided capture — photo order</h3><div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px">${shots}</div>
        <h3>Next-photo evidence · Eq 7</h3>${ev}</div>
      <div class="card tight"><h3>Mitra data pack — cross-checks</h3><table><thead><tr><th>Source</th><th>Validates</th><th>Strength</th></tr></thead><tbody>${pack}</tbody></table>
        <h3 style="margin-top:12px">Activity signals</h3><table><tbody>
          <tr><td style="width:34%">Footfall</td><td class="note">${esc(act.footfall||act.activity||"—")}</td></tr>
          <tr><td>B2B / counterparties</td><td class="note">${esc(act.b2b||act.counterparties||"n/a (B2C)")}</td></tr></tbody></table>
        <div class="callout" style="margin-top:10px"><b>Variance path:</b> ${esc(o.varianceNotes||"")}</div></div>
    </div>
  </article>`;
}
const cards=kb.industries.map(card).join("\n");
const archeChips=kb.meta.archetypes.map(a=>`<span class="pill" data-f="${a.id}">${ARCHE[a.id]} <b class="dim">${counts[a.id]||0}</b></span>`).join(" ");
const archeRows=kb.meta.archetypes.map(a=>`<tr><td style="font-weight:600">${ARCHE[a.id]}${a.id==='transport'?' <span class="verdict concordant">new</span>':''}</td><td class="mono small">${esc(a.revenueFormula)}</td><td class="num">${counts[a.id]||0}</td></tr>`).join("");

const html=`<!doctype html><html lang="en"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Phone Se Loan — Industry Models (Business X-Ray)</title>
<style>${AIOS_CSS}
#catControls{position:sticky;top:0;z-index:40;background:rgba(244,246,251,.92);backdrop-filter:blur(8px);border-bottom:1px solid var(--line);padding:10px 0}
#catControls .wrap{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
#catControls input{flex:1;min-width:220px;background:#fff;border:1px solid var(--line);color:var(--ink);border-radius:9px;padding:9px 12px;font-size:14px}
.pill[data-f].on{background:#e8eefc;border-color:var(--brand);color:var(--brand-ink);font-weight:600}
</style></head><body>
${pslGate("1504")}
${pslHeader("Stage 4 · Business Analysis", "Industry Models — 56 MSME profiles · interval P&amp;L and balance sheet, guided capture and the next-photo refinement loop")}
<nav class="psl-nav"><div class="wrap">
  <a class="tab" href="/capture">Capture</a>
  <a class="tab active" href="/industries">Industry Models</a>
  <a class="tab" href="/app">Assessment</a>
  <a class="tab" href="/data-backbone">Data Backbone</a>
  <a class="tab" href="/app#/governance">Governance</a>
</div></nav>
<main><div class="wrap">
<section>
  <h1>Industry Models</h1>
  <p class="lead">Each of the 56 MSME profiles is a parameter pack for the same engine — interval revenue model, P&amp;L / balance-sheet build and the evidence-acquisition score that chooses the next photo. Metro and non-metro bands; target is turnover half-width ≤20% once photos + the Mitra data pack are in.</p>
  <div class="stats" style="margin-top:14px">
    <div class="stat"><span class="k">Industries</span><span class="v">56</span></div>
    <div class="stat"><span class="k">Revenue archetypes</span><span class="v">7</span></div>
    <div class="stat"><span class="k">Avg half-width (photo)</span><span class="v">±187%→26%</span></div>
    <div class="stat"><span class="k">Reach ≤20% on photos</span><span class="v">47 / 112</span></div>
  </div>
  <div class="card" style="margin-top:14px">
    <h2>How the model works</h2>
    <table style="margin:6px 0"><thead><tr><th>Archetype</th><th>Revenue formula (Eq 2)</th><th class="num">Count</th></tr></thead><tbody>${archeRows}</tbody></table>
    <div class="grid cols-3" style="margin-top:12px">
      <div class="stepcard"><div class="num">1</div><div class="body"><div class="t">Drivers → turnover</div><div class="note">Interval drivers, node-tagged, multiplied to a revenue interval.</div></div></div>
      <div class="stepcard"><div class="num">2</div><div class="body"><div class="t">P&amp;L + balance sheet</div><div class="note">gm/opex → EBITDA; DIO/DSO/DPO or stock worksheet → WCR.</div></div></div>
      <div class="stepcard"><div class="num">3</div><div class="body"><div class="t">Next-photo loop</div><div class="note">Each evidence item tightens one driver; ranked by (Δw×q×v)/cost.</div></div></div>
      <div class="stepcard"><div class="num">4</div><div class="body"><div class="t">Mitra data pack</div><div class="note">GST / bank / UPI / utility intersect the photo interval; residual = cash.</div></div></div>
      <div class="stepcard"><div class="num">5</div><div class="body"><div class="t">Occupancy &amp; footfall</div><div class="note">Electricity + rent set owned/rented; timed captures build footfall.</div></div></div>
      <div class="stepcard"><div class="num">6</div><div class="body"><div class="t">≤20% or abstain</div><div class="note">Loop until half-width ≤20%, else abstention. Human underwriter decides.</div></div></div>
    </div>
  </div>
</section>
</div></main>
<div id="catControls"><div class="wrap">
  <input id="q" placeholder="Search 56 industries…"/>
  <span class="pill on" data-f="all">All <b class="dim">56</b></span>
  ${archeChips}
</div></div>
<section><div class="wrap" id="cards">
${cards}
</div></section>
<footer class="footer"><div class="wrap">Phone Se Loan AI Operating System · Business X-Ray Industry Models (v${kb.meta.version}) · illustrative benchmarks for a thin-file MSME pilot; not a validated scoring model. Human-only approval.</div></footer>
<script>
const q=document.getElementById('q'),cards=[...document.querySelectorAll('#cards .card')],chips=[...document.querySelectorAll('.pill[data-f]')];
let af='all';
function apply(){const t=q.value.trim().toLowerCase();cards.forEach(c=>{const okF=af==='all'||c.dataset.arch===af;const okQ=!t||c.dataset.name.includes(t);c.style.display=okF&&okQ?'':'none';});}
q.addEventListener('input',apply);
chips.forEach(b=>b.addEventListener('click',()=>{chips.forEach(x=>x.classList.remove('on'));b.classList.add('on');af=b.dataset.f;apply();}));
</script></body></html>`;
writeFileSync("/home/claude/business-xray/business-xray-industry-catalog.html", html);
console.log("AI-OS industries catalog:", (html.length/1024).toFixed(0)+"KB · industries:", kb.industries.length);
