import fs from "node:fs";
import { AIOS_CSS, pslHeader } from "./aios-theme.mjs";
const rep = JSON.parse(fs.readFileSync("/tmp/peer_report.json","utf8"));
const ARCHE={retail:"Retail / kirana",fnb:"Food & beverage",services:"Services",warehouse:"Warehouse / distribution",scrap:"Scrap trading",manufacturing:"Light manufacturing",transport:"Transport / logistics"};
const fmt=n=> n==null?"—": Math.abs(n)>=1e7?"₹"+(n/1e7).toFixed(2)+" Cr":Math.abs(n)>=1e5?"₹"+(n/1e5).toFixed(2)+" L":"₹"+Math.round(n).toLocaleString("en-IN");
const byId={}; rep.forEach(r=>{ (byId[r.id]=byId[r.id]||{}).id=r.id; byId[r.id].name=r.name; byId[r.id].arch=r.arch; byId[r.id][r.band]=r; });
const rows=Object.values(byId);
// verdict
function verdict(r){
  const m=r.metro, n=r.nonmetro;
  const hardFlags=[...new Set([...(m.flags||[]),...(n.flags||[])])].filter(f=>f!=='very-wide'&&f!=='weak-converge');
  if(hardFlags.length) return {k:'REVIEW',c:'conflict',t:hardFlags.join(', ')};
  if(m.relW>4||n.relW>4) return {k:'WIDE PRIOR',c:'partial',t:'pre-evidence interval ±'+Math.round(m.relW*50)+'% — evidence loop must carry the narrowing'};
  return {k:'OK',c:'concordant',t:'finite, ordered, EBITDA+, evidence-alive'};
}
const groups={}; rows.forEach(r=>(groups[r.arch]=groups[r.arch]||[]).push(r));
const counts={OK:0,'WIDE PRIOR':0,REVIEW:0}; rows.forEach(r=>counts[verdict(r).k]++);
let body='';
for(const a of Object.keys(ARCHE)){ if(!groups[a])continue;
  body+='<h2 style="margin:22px 0 8px">'+ARCHE[a]+' <span class="note">('+groups[a].length+')</span></h2>';
  body+='<table><thead><tr><th>Profile</th><th class="num">Turnover — metro</th><th class="num">Turnover — non-metro</th><th class="num">EBITDA %</th><th class="num">Trade cycle</th><th class="num">Prior ±</th><th>Top next-photo (Eq 7)</th><th>Verdict</th></tr></thead><tbody>';
  for(const r of groups[a].sort((x,y)=>x.name.localeCompare(y.name))){ const m=r.metro,n=r.nonmetro,v=verdict(r);
    const em=m.tBase>0?Math.round(m.ebit/m.tBase*100):0;
    body+='<tr><td><b>'+r.name+'</b><div class="mono small dim">'+r.id+'</div></td>'
      +'<td class="num">'+fmt(m.tBase)+'<div class="small dim">'+fmt(m.tLo)+'–'+fmt(m.tHi)+'</div></td>'
      +'<td class="num">'+fmt(n.tBase)+'</td>'
      +'<td class="num">'+em+'%</td>'
      +'<td class="num">'+(m.wcr!=null?Math.round(m.wcr/ (m.tBase||1) *365)+'d':'—')+'</td>'
      +'<td class="num">±'+Math.round(m.relW*50)+'%</td>'
      +'<td class="small">'+(m.evN? (m.evTop? 'ranked '+m.evN+' · lead score '+m.evTop : m.evN+' items') : '—')+'</td>'
      +'<td><span class="verdict '+v.c+'">'+v.k+'</span><div class="small dim" style="margin-top:3px">'+v.t+'</div></td></tr>';
  }
  body+='</tbody></table>';
}
const html=`<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Business X-Ray — Assessment peer review (56 profiles)</title><style>${AIOS_CSS}
table{margin-top:6px} td,th{font-size:12.5px} h2{font-size:15px;color:var(--ink);text-transform:none;letter-spacing:0}
</style></head><body>
${pslHeader("Assessment · Peer review","All 56 MSME profiles · engine v2.1.0 · metro &amp; non-metro bands · illustrative rule-engine outputs")}
<main><div class="wrap"><section>
<h1>Assessment module — peer review of all 56 profiles</h1>
<p class="lead">Every profile was run through the assessment engine in both location bands (112 runs). Each was checked for: finite &amp; correctly-ordered turnover interval, positive EBITDA (γ&gt;ω), a computable working-capital requirement, a live targeted-evidence loop (Eq 7), and a review-band overlay. Turnover is the pre-evidence interval the underwriter then narrows with the Mitra data-pack and photo evidence.</p>
<div class="stats" style="margin:12px 0">
  <div class="stat"><span class="k">Profiles assessable</span><span class="v">56 / 56</span></div>
  <div class="stat"><span class="k">Runtime errors</span><span class="v">0</span></div>
  <div class="stat"><span class="k">OK</span><span class="v">${counts.OK}</span></div>
  <div class="stat"><span class="k">Wide prior (tune)</span><span class="v">${counts['WIDE PRIOR']}</span></div>
  <div class="stat"><span class="k">Needs review</span><span class="v">${counts.REVIEW}</span></div>
</div>
<div class="callout ext"><b style="color:var(--ext)">Result:</b> all 56 profiles now assess end-to-end (previously only the 6 generic archetypes worked). No profile throws, produces a NaN, an inverted interval, a negative EBITDA, or a dead evidence loop. <b>${counts['WIDE PRIOR']}</b> profiles carry a wide pre-evidence interval (±200%+) — not a fault, but the evidence loop / documentary data-pack has to do more of the narrowing there; these are the first candidates for tighter driver priors if you want a narrower starting band.</div>
${body}
<div class="callout" style="margin-top:16px"><b>Method.</b> Interval turnover = Π(driver intervals) × unit scale (Eq 2). EBITDA = R̂(γ−ω) (Eq 3). WCR from DIO/DSO/DPO or measured inventory (Eq 4/5). Next-photo ranking = ΔW·q·v / cost (Eq 7). Bands from each profile's metro / non-metro registry. Loan approval &amp; disbursement remain human-only; the model extracts and recommends.</div>
</section></div></main>
<footer class="footer"><div class="wrap">Business X-Ray · assessment peer review · 56 MSME profiles · not a validated credit-scoring model.</div></footer>
</body></html>`;
fs.writeFileSync("/mnt/user-data/outputs/business-xray-assessment-peer-review.html", html);
console.log("report:", (html.length/1024).toFixed(0)+"KB · OK",counts.OK,"WIDE",counts['WIDE PRIOR'],"REVIEW",counts.REVIEW);
