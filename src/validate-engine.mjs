// Numerically exercise every industry through the paper's Eq2/Eq3 + refinement loop.
import { readFileSync } from "node:fs";
const kb = JSON.parse(readFileSync("/home/claude/business-xray/industry-model.json","utf8"));

const scale = (o,key)=> (o.archetype==="scrap" && key==="tonnage") ? 1000 : 1;
function revInterval(o, band){
  const ds = o.drivers[band];
  let lo=1,base=1,hi=1;
  for(const d of ds){ const s=scale(o,d.key); lo*=d.lo*s; base*=d.base*s; hi*=d.hi*s; }
  return {lo,base,hi};
}
const relHalf = I => I.base>0 ? ((I.hi-I.lo)/2)/I.base : 99;

// apply revenue-driver evidence narrowings (skip balance_sheet-targeted) to see best achievable width
function narrowed(o, band){
  const ds = JSON.parse(JSON.stringify(o.drivers[band]));
  const map = Object.fromEntries(ds.map(d=>[d.key,d]));
  for(const e of (o.evidenceItems||[])){
    if(e.target==="balance_sheet") continue;
    const d = map[e.driver]; if(!d) continue;
    const half = d.base * e.narrowPct;
    d.lo = Math.max(d.lo, d.base-half);
    d.hi = Math.min(d.hi, d.base+half);
  }
  let lo=1,base=1,hi=1;
  for(const d of ds){ const s=scale(o,d.key); lo*=d.lo*s; base*=d.base*s; hi*=d.hi*s; }
  return {lo,base,hi};
}

const rows=[]; const flags=[];
for(const o of kb.industries){
  for(const band of ["metro","nonmetro"]){
    const R = revInterval(o,band);
    const r = o.registry[band];
    const ebitdaBase = R.base*(r.gm[1]-r.opex[1]);
    const annualBand = o.monthlyRevenueBand?.[band];
    const inBand = annualBand ? (R.base >= annualBand[0]*12*0.6 && R.base <= annualBand[1]*12*1.6) : null;
    const pre = relHalf(R);
    const post = relHalf(narrowed(o,band));
    rows.push({id:o.id,band,arch:o.archetype,annual:Math.round(R.base),ebitda:Math.round(ebitdaBase),pre:+pre.toFixed(2),post:+post.toFixed(2),inBand});
    if(ebitdaBase<=0) flags.push(`${o.id}/${band}: EBITDA<=0 at base`);
    if(inBand===false) flags.push(`${o.id}/${band}: base annual ₹${(R.base/1e5).toFixed(1)}L outside stated band [${annualBand[0]/1e5}–${annualBand[1]/1e5}L]/mo×12`);
  }
}

const fmt = n => Math.abs(n)>=1e7? "₹"+(n/1e7).toFixed(2)+"Cr" : "₹"+(n/1e5).toFixed(1)+"L";
console.log("id".padEnd(30),"band".padEnd(9),"annualRev".padEnd(11),"EBITDA".padEnd(10),"relHalf pre→post");
for(const r of rows.filter(r=>r.band==="metro")){
  console.log(r.id.padEnd(30), r.band.padEnd(9), fmt(r.annual).padEnd(11), fmt(r.ebitda).padEnd(10), `${(r.pre*100).toFixed(0)}% → ${(r.post*100).toFixed(0)}%`, r.post<=0.20?"✓≤20":"·");
}
const reach = rows.filter(r=>r.post<=0.20).length, tot=rows.length;
console.log("\n— evidence reaches ≤20% half-width in", reach,"/",tot,"(industry×band) cases");
console.log("— avg pre relHalf:", (rows.reduce((s,r)=>s+r.pre,0)/tot*100).toFixed(0)+"%", "→ avg post:", (rows.reduce((s,r)=>s+r.post,0)/tot*100).toFixed(0)+"%");
console.log("\nFLAGS:", flags.length);
flags.forEach(f=>console.log("  ⚠", f));
