// Data Backbone screen — the ~38 redacted, sandbox external sources the Mitra/agent
// can pull. AVAILABILITY IS GATED by what the Mitra has actually captured: a source
// unlocks only when the photo/document carrying its linkage key is captured; otherwise
// the Mitra is prompted to capture more. Built from data-backbone.json (in sync with
// Appendix A of the harness architecture doc).
import { readFileSync, writeFileSync } from "node:fs";
import { AIOS_CSS, pslHeader, pslGate } from "./aios-theme.mjs";
const db = JSON.parse(readFileSync("/home/claude/business-xray/data-backbone.json","utf8"));

const EXTRA_CSS = `
.dbwrap{max-width:1200px}
.summary{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin:14px 0}
@media(max-width:900px){.summary{grid-template-columns:1fr 1fr}}
.sumtile{background:#fff;border:1px solid var(--line);border-radius:12px;padding:14px}
.sumtile .k{font-size:10.5px;color:var(--mut);text-transform:uppercase;letter-spacing:.4px;display:block}
.sumtile .v{font-size:22px;font-weight:700;letter-spacing:-.3px}
.cappanel{background:#fff;border:1px solid var(--line);border-radius:12px;padding:14px;margin:6px 0 4px}
.keygrp{margin-top:8px}
.keygrp .gl{font-size:10.5px;color:var(--mut);text-transform:uppercase;letter-spacing:.4px;font-weight:700;display:block;margin-bottom:6px}
.keychips{display:flex;gap:7px;flex-wrap:wrap}
.keychip{font-size:12px;border:1px solid var(--line);background:#fff;border-radius:8px;padding:6px 10px;cursor:pointer;color:var(--ink);display:inline-flex;align-items:center;gap:6px}
.keychip.on{border-color:var(--ext);background:var(--okbg);color:var(--ext);font-weight:600}
.keychip .n{font-size:10px;color:var(--dim);background:#eef1f7;border-radius:999px;padding:1px 6px}
.keychip.on .n{background:#cfeeda;color:var(--ext)}
.prompt{border:1px solid #e7c98a;background:#fffaf0;border-radius:10px;padding:11px 13px;margin-top:10px;font-size:12.5px;color:var(--ink)}
.catsec{margin-top:22px}
.cathead{display:flex;align-items:center;gap:10px;margin:0 0 10px}
.cathead h2{font-size:16px;margin:0}
.cathead .cb{font-size:11.5px;color:var(--mut);background:#eef1f7;border:1px solid var(--line);border-radius:999px;padding:3px 10px}
.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
@media(max-width:1000px){.cards{grid-template-columns:1fr 1fr}}
@media(max-width:680px){.cards{grid-template-columns:1fr}}
.src{background:#fff;border:1px solid var(--line);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:7px;box-shadow:0 6px 18px rgba(20,30,60,.05)}
.src.pulled{border-color:#bcd0ff;box-shadow:0 0 0 1px #dbe6ff inset,0 6px 18px rgba(20,30,60,.06)}
.src.locked{opacity:.72;background:#fbfcfe}
.src .nm{font-weight:700;font-size:13.5px;line-height:1.3}
.src .badges{display:flex;gap:6px;flex-wrap:wrap}
.sbx{font-size:10px;font-weight:700;color:var(--warn);background:var(--warnbg);border:1px solid #f0e2c4;border-radius:5px;padding:2px 7px}
.lock{font-size:10px;font-weight:700;color:var(--bad);background:var(--badbg);border-radius:5px;padding:2px 7px}
.pub{font-size:10px;font-weight:700;color:var(--ok);background:var(--okbg);border-radius:5px;padding:2px 7px}
.meta{font-size:11.5px;color:var(--mut);line-height:1.5}
.meta b{color:var(--ink);font-weight:600}
.confrow{display:flex;gap:5px;flex-wrap:wrap;margin-top:2px}
.confchip{font-size:10px;font-weight:600;color:var(--ext);background:var(--okbg);border-radius:5px;padding:2px 7px}
.needchip{font-size:10.5px;font-weight:600;color:var(--warn);background:var(--warnbg);border:1px solid #f0e2c4;border-radius:5px;padding:2px 7px}
.pullbtn{margin-top:auto;align-self:flex-start;font-size:12px;font-weight:600;border:1px solid var(--brand);background:var(--brand);color:#fff;border-radius:8px;padding:7px 12px;cursor:pointer}
.pullbtn.done{background:#fff;color:var(--ok);border-color:var(--ok);cursor:default}
.pullbtn.blocked{background:#fff;color:var(--dim);border-color:var(--line);cursor:not-allowed}
.result{font-family:var(--mono);font-size:11.5px;background:#f6f8fd;border:1px dashed #bcd0ff;border-radius:8px;padding:8px 9px;color:var(--ink)}
.ptrack{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}
.ptrack .p{font-size:11px;border:1px solid var(--line);border-radius:999px;padding:3px 9px;color:var(--dim)}
.ptrack .p.on{border-color:var(--ext);color:var(--ext);background:var(--okbg);font-weight:600}
`;

const html = `<!doctype html><html lang="en"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Phone Se Loan — Data Backbone (Business X-Ray)</title>
<style>${AIOS_CSS}${EXTRA_CSS}</style></head><body>
${pslGate("1504")}
${pslHeader("Data Backbone", "Redacted, consent-based external sources — available only for the items the Mitra has captured · sandbox (mock) until go-live")}
<nav class="psl-nav"><div class="wrap">
  <a class="tab" href="/capture">Capture</a>
  <a class="tab" href="/industries">Industry Models</a>
  <a class="tab" href="/app">Assessment</a>
  <a class="tab active" href="/data-backbone">Data Backbone</a>
  <a class="tab" href="/terms">Terms &amp; Consent</a>
</div></nav>
<main><div class="wrap dbwrap">
<section style="padding-bottom:6px">
  <h1>Data Backbone — external evidence the X-Ray consumes</h1>
  <p class="lead">Beyond the on-site photos, the Business X-Ray reconciles against India's digital-public-infrastructure rails. A source is <b>available only when the Mitra has captured the item that carries its linkage key</b> — the GST board unlocks GST/GSTIN, the merchant QR unlocks the Account-Aggregator bank pull, the Udyam/licence unlock the registries, and the KYC/property documents unlock identity and collateral. Where a source is still locked, the Mitra is <b>prompted to capture that item</b>. Everything is <b>sandbox (mock)</b> and returned <b>redacted</b>; sensitive pulls are consent-gated.</p>
  <div class="summary" id="summary"></div>

  <div class="cappanel">
    <div class="toolbar" style="margin:0"><b style="font-size:13.5px">Captured by the Mitra</b><span class="spacer"></span><span class="small dim">tick what was photographed / collected — premises items pre-fill from the capture session</span></div>
    <div id="keyItems"></div>
    <div id="prompt"></div>
  </div>

  <div style="margin-top:12px">
    <span class="small dim" style="text-transform:uppercase;letter-spacing:.4px;font-weight:700">Underwriting profiles confirmed as you pull</span>
    <div class="ptrack" id="ptrack"></div>
  </div>
</section>
<div id="cats"></div>
</div></main>
<footer class="footer"><div class="wrap">
  Phone Se Loan AI Operating System · Business X-Ray · Data Backbone — sandbox (mock), redacted, gated by captured evidence. Go-live connects UIDAI / GSTN / Account Aggregator / bureaus / ULI / DoLR as listed. Loan approval &amp; disbursement remain human-only.
</div></footer>
<script>
const DB=${JSON.stringify(db)};
const PROF=DB.profiles;
const KEY=DB.keyItems;
const KEYBY=Object.fromEntries(KEY.map(k=>[k.id,k]));
const CATBY=Object.fromEntries(DB.categories.map(c=>[c.id,c]));
const esc=s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const captured=new Set();     // key items the Mitra has captured
const pulled=new Set();       // sources pulled

// prefill premises key items from a capture session handoff, if present
try{ const h=JSON.parse(sessionStorage.getItem('bx_handoff')||'null');
  if(h&&Array.isArray(h.captured)){ h.captured.forEach(f=>{ if(KEYBY[f]) captured.add(f); }); } }catch(e){}

const available=s=>(s.requires||[]).every(r=>captured.has(r));
const missingFor=s=>(s.requires||[]).filter(r=>!captured.has(r));
function confirmedProfiles(){ const set=new Set(); DB.sources.forEach(s=>{ if(pulled.has(s.id)) (s.confirms||[]).forEach(c=>set.add(c)); }); return set; }
function availCount(){ return DB.sources.filter(available).length; }
// how many still-locked sources each un-captured key item would help unlock
function unlockCounts(){ const m={}; KEY.forEach(k=>{ if(captured.has(k.id)) return; m[k.id]=DB.sources.filter(s=>!available(s) && (s.requires||[]).includes(k.id)).length; }); return m; }

function renderSummary(){
  const total=DB.sources.length, gated=DB.sources.filter(s=>s.consentGated).length;
  document.getElementById('summary').innerHTML=''
    +'<div class="sumtile"><span class="k">Sources</span><span class="v">'+total+'</span><span class="small dim">'+DB.categories.length+' categories</span></div>'
    +'<div class="sumtile"><span class="k">Available now</span><span class="v" id="avail" style="color:var(--ok)">'+availCount()+'</span><span class="small dim">gated by captured items</span></div>'
    +'<div class="sumtile"><span class="k">Consent-gated</span><span class="v">'+gated+'</span><span class="small dim">KYC · AA · bureau · tax</span></div>'
    +'<div class="sumtile"><span class="k">Pulled</span><span class="v" id="pcount">'+pulled.size+'</span><span class="small dim">redacted mock signals</span></div>'
    +'<div class="sumtile"><span class="k">Profiles confirmed</span><span class="v" id="prcount">'+confirmedProfiles().size+'</span><span class="small dim">of '+Object.keys(PROF).length+'</span></div>';
}
function renderKeyItems(){
  const uc=unlockCounts();
  const grp=(kind,label)=>{ const items=KEY.filter(k=>k.kind===kind); if(!items.length) return '';
    return '<div class="keygrp"><span class="gl">'+label+'</span><div class="keychips">'+items.map(k=>{
      const on=captured.has(k.id); const n=on?'':(uc[k.id]?'<span class="n">+'+uc[k.id]+'</span>':'');
      return '<span class="keychip'+(on?' on':'')+'" data-key="'+k.id+'">'+(on?'✓ ':'')+esc(k.label)+' '+n+'</span>';
    }).join('')+'</div></div>'; };
  document.getElementById('keyItems').innerHTML=grp('premises','Premises photos (from capture)')+grp('kyc','KYC documents')+grp('property','Collateral');
  // prompt: rank uncaptured key items by how many sources they unlock
  const ranked=KEY.filter(k=>!captured.has(k.id)&&uc[k.id]>0).sort((a,b)=>uc[b.id]-uc[a.id]);
  document.getElementById('prompt').innerHTML = ranked.length
    ? '<div class="prompt">❓ <b>Prompt the Mitra to capture more:</b> '+ranked.slice(0,4).map(k=>esc(k.label)+' <b>(unlocks '+uc[k.id]+')</b>').join(' · ')+'. '+availCount()+' of '+DB.sources.length+' sources available so far.</div>'
    : '<div class="prompt" style="border-color:#bfe6cf;background:#f6fdf9">✓ All linkage keys captured — every source is available to pull.</div>';
}
function renderTrack(){ const conf=confirmedProfiles();
  document.getElementById('ptrack').innerHTML=Object.entries(PROF).map(([k,v])=>'<span class="p'+(conf.has(k)?' on':'')+'">'+(conf.has(k)?'✓ ':'')+esc(v)+'</span>').join(''); }
function card(s){
  const avail=available(s), done=pulled.has(s.id), miss=missingFor(s);
  const conf=(s.confirms||[]).map(c=>'<span class="confchip">'+esc(PROF[c]||c)+'</span>').join('');
  const gate=s.consentGated?'<span class="lock">🔒 consent</span>':'<span class="pub">public/screen</span>';
  let btn;
  if(done) btn='<button class="pullbtn done" disabled>✓ Pulled (sandbox)</button>';
  else if(avail) btn='<button class="pullbtn" data-pull="'+s.id+'">Pull (sandbox) ▸</button>';
  else btn='<button class="pullbtn blocked" disabled>🔒 Capture to unlock</button>';
  const need = (!avail&&!done) ? '<div><span class="small" style="color:var(--warn)">Capture to unlock:</span><div class="confrow" style="margin-top:3px">'+miss.map(r=>'<span class="needchip">'+esc((KEYBY[r]||{label:r}).label)+'</span>').join('')+'</div></div>' : '';
  return '<div class="src'+(done?' pulled':'')+(avail?'':' locked')+'" id="src-'+s.id+'">'
    +'<div class="badges"><span class="sbx">SANDBOX (mock)</span>'+gate+'</div>'
    +'<div class="nm">'+esc(s.name)+'</div>'
    +'<div class="meta"><b>Feeds:</b> '+esc(s.feeds)+'<br/><b>Indexes →</b> CAM '+esc(s.cam)+'<br/><b>Monitors →</b> '+esc(s.monitors)+'<br/><b>Go-live:</b> '+esc(s.golive)+'</div>'
    +(conf?'<div><span class="small dim">Confirms:</span><div class="confrow">'+conf+'</div></div>':'')
    +need
    +(done?'<div class="result">▸ '+esc(s.mock)+'</div>':'')
    +btn+'</div>';
}
function renderCats(){
  const byCat={}; DB.sources.forEach(s=>{(byCat[s.cat]=byCat[s.cat]||[]).push(s);});
  document.getElementById('cats').innerHTML=DB.categories.map(c=>{
    const rows=byCat[c.id]||[]; if(!rows.length) return '';
    const av=rows.filter(available).length;
    return '<div class="catsec"><div class="cathead"><h2>'+esc(c.label)+'</h2><span class="cb">'+av+'/'+rows.length+' available</span><span class="cb">'+esc(c.consent)+'</span></div>'
      +'<div class="cards">'+rows.map(card).join('')+'</div></div>';
  }).join('');
  wirePulls();
}
function refreshAll(){ renderSummary(); renderKeyItems(); renderTrack(); renderCats(); wireKeys(); }
function wireKeys(){
  document.querySelectorAll('[data-key]').forEach(c=>c.onclick=()=>{ const id=c.dataset.key;
    if(captured.has(id)) captured.delete(id); else captured.add(id);
    // drop pulls that are no longer available
    DB.sources.forEach(s=>{ if(pulled.has(s.id)&&!available(s)) pulled.delete(s.id); });
    refreshAll(); });
}
function wirePulls(){
  document.querySelectorAll('[data-pull]').forEach(b=>b.onclick=()=>{ const id=b.dataset.pull;
    const s=DB.sources.find(x=>x.id===id); if(!s||!available(s)||pulled.has(id)) return; pulled.add(id);
    const host=document.getElementById('src-'+id); if(host) host.outerHTML=card(s);
    document.getElementById('pcount').textContent=pulled.size;
    document.getElementById('prcount').textContent=confirmedProfiles().size;
    renderTrack(); wirePulls(); });
}
refreshAll();
</script>
</body></html>`;

writeFileSync("/home/claude/business-xray/business-xray-databackbone.html", html);
console.log("Data Backbone screen (gated):", (html.length/1024).toFixed(0)+"KB · sources:", db.sources.length, "· keyItems:", db.keyItems.length);
