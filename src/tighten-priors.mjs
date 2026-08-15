import fs from "node:fs";
const path="industry-model.json";
const kb=JSON.parse(fs.readFileSync(path,"utf8"));
const TARGET=2.0;              // product relWidth target (~±100%)
const KFLOOR=0.25;            // don't shrink deviations below 25% of original
const relW=drs=>{ let lo=1,ba=1,hi=1; for(const d of drs){lo*=d.lo;ba*=d.base;hi*=d.hi;} return ba>0?(hi-lo)/ba:0; };
const isInt=v=>Number.isInteger(v);
function roundSig(x,int){ if(int) return Math.round(x); if(Math.abs(x)>=100)return Math.round(x); if(Math.abs(x)>=10)return Math.round(x*10)/10; return Math.round(x*1000)/1000; }
function shrinkBand(drs){
  // find k in [KFLOOR,1] so product relWidth <= TARGET (binary search)
  if(relW(drs)<=TARGET) return {drs, k:1, changed:false};
  let lo=KFLOOR, hi=1;
  const apply=k=>drs.map(d=>({...d, lo:d.base-k*(d.base-d.lo), hi:d.base+k*(d.hi-d.base)}));
  for(let i=0;i<40;i++){ const mid=(lo+hi)/2; if(relW(apply(mid))>TARGET) hi=mid; else lo=mid; }
  const k=Math.max(KFLOOR, lo);
  const scaled=apply(k).map(d=>{ const int=isInt(d.base)&&isInt(d.lo??0)&&isInt(d.hi??0);
    let nlo=roundSig(d.lo,int), nhi=roundSig(d.hi,int);
    if(nlo>=d.base) nlo=int?d.base-1:+(d.base*0.98).toPrecision(3);
    if(nhi<=d.base) nhi=int?d.base+1:+(d.base*1.02).toPrecision(3);
    return {...d, lo:nlo, hi:nhi};
  });
  return {drs:scaled, k:+k.toFixed(2), changed:true};
}
// identify flagged: relW>4 in either band
const flagged=kb.industries.filter(o=>relW(o.drivers.metro||[])>4 || relW(o.drivers.nonmetro||[])>4);
console.log("flagged (relW>4):", flagged.length);
console.log("id".padEnd(30),"metro before→after","| nonmetro before→after","| k(m/n)");
for(const o of kb.industries){
  const isFlag = flagged.includes(o);
  if(!isFlag) continue;
  const mBefore=relW(o.drivers.metro), nBefore=relW(o.drivers.nonmetro);
  const rm=shrinkBand(o.drivers.metro), rn=shrinkBand(o.drivers.nonmetro);
  o.drivers.metro=rm.drs; o.drivers.nonmetro=rn.drs;
  const mAfter=relW(o.drivers.metro), nAfter=relW(o.drivers.nonmetro);
  console.log(o.id.padEnd(30),
    ('±'+Math.round(mBefore*50)+'%').padStart(6)+'→'+('±'+Math.round(mAfter*50)+'%').padStart(6),
    '|',('±'+Math.round(nBefore*50)+'%').padStart(6)+'→'+('±'+Math.round(nAfter*50)+'%').padStart(6),
    '| k',rm.k+'/'+rn.k);
}
fs.writeFileSync(path, JSON.stringify(kb,null,1));
console.log("industry-model.json updated. bases unchanged (only lo/hi tightened).");
