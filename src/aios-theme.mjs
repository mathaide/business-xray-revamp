// Phone Se Loan AI Operating System — shared design system (extracted from litehouseiq.in).
// Light theme; navy gradient header; blue #2f6bff accent; white cards with #e3e7ef borders.
export const AIOS_CSS = `
:root{
  --bg:#f4f6fb; --card:#ffffff; --line:#e3e7ef; --line2:#eef1f7;
  --ink:#1a2233; --mut:#5b6478; --dim:#8a93a6;
  --brand:#2f6bff; --brand-ink:#1c49c9;
  --navy1:#0f1b3d; --navy2:#1b2b57;
  --ok:#0c6b3f; --okbg:#e7f6ee; --bad:#8f1d31; --badbg:#fbe1e6; --warnbg:#fdf3e1; --warn:#8a5a00;
  --obs:#1c49c9; --claim:#8a5a00; --bench:#6b3fb0; --ext:#0c6b3f; --gap:#8f1d31;
  --sans:-apple-system,"Segoe UI",Roboto,Arial,sans-serif;
  --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{background:var(--bg);color:var(--ink);font-family:var(--sans);line-height:1.5;-webkit-font-smoothing:antialiased}
.mono{font-family:var(--mono)}
.wrap{max-width:1200px;margin:0 auto;padding:0 20px}
/* header */
header.psl{background:linear-gradient(120deg,var(--navy1),var(--navy2));color:#fff}
header.psl .wrap{display:flex;align-items:center;gap:12px;min-height:54px;padding-top:8px;padding-bottom:8px;flex-wrap:wrap}
header.psl .title{font-weight:700;font-size:17px;letter-spacing:.1px}
header.psl .sub{color:#c7d0e6;font-size:12px}
header.psl .right{margin-left:auto;text-align:right;color:#aeb9d6;font-size:11.5px;max-width:520px}
.badge{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;border-radius:6px;padding:3px 8px}
.badge.live{background:var(--okbg);color:var(--ok)}
.badge.stage{background:rgba(255,255,255,.14);color:#fff}
/* tab nav */
.psl-nav{background:#fff;border-bottom:1px solid var(--line)}
.psl-nav .wrap{display:flex;gap:8px;flex-wrap:wrap;padding-top:10px;padding-bottom:10px}
.tab{font-size:12.5px;color:var(--mut);background:#fff;border:1px solid var(--line);border-radius:7px;padding:6px 12px;cursor:pointer;text-decoration:none;display:inline-block}
.tab.active{background:var(--brand);color:#fff;border-color:var(--brand);font-weight:600}
.tab:hover:not(.active){border-color:#c9d2e6}
/* chips row (state cases / context) */
.chiprow{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}
.statechip{font-size:12px;border:1px solid var(--line);background:#fff;border-radius:8px;padding:6px 10px;color:var(--ink)}
.statechip.active{border-color:var(--ink);box-shadow:inset 0 0 0 1px var(--ink)}
/* sections + cards */
section{padding:18px 0}
h1{font-size:22px;margin:.1em 0 .3em;letter-spacing:-.2px}
h2{font-size:16px;margin:0 0 .4em}
h3{font-size:12px;margin:14px 0 7px;color:var(--mut);text-transform:uppercase;letter-spacing:.5px;font-weight:700}
p.lead{font-size:15px;color:var(--mut);max-width:80ch;margin:.2em 0 0}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px}
.card.tight{padding:12px}
.grid{display:grid;gap:14px}
.cols-2{grid-template-columns:1fr 1fr}
.cols-3{grid-template-columns:repeat(3,1fr)}
.cols-4{grid-template-columns:repeat(4,1fr)}
@media(max-width:900px){.cols-2,.cols-3,.cols-4{grid-template-columns:1fr}}
.note{font-size:13px;color:var(--mut)}
.small{font-size:12px}
.dim{color:var(--dim)}
.hl{color:var(--brand-ink)}
.spacer{flex:1}
.toolbar{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
/* stat chips (FMV/CRIF style) */
.stats{display:flex;flex-wrap:wrap;gap:8px}
.stat{background:#fff;border:1px solid var(--line);border-radius:9px;padding:8px 12px;min-width:120px}
.stat .k{font-size:10.5px;color:var(--mut);text-transform:uppercase;letter-spacing:.4px;display:block}
.stat .v{font-size:16px;font-weight:700;letter-spacing:-.3px}
/* KPI tiles */
.kpi .k{font-size:10.5px;color:var(--mut);text-transform:uppercase;letter-spacing:.4px;display:block}
.kpi .v{font-size:20px;font-weight:700;letter-spacing:-.3px}
/* numbered stepper */
.stepcard{display:flex;gap:11px;align-items:flex-start;padding:11px 12px;border:1px solid var(--line);border-radius:10px;margin-bottom:9px;background:#fff}
.stepcard .num{flex:none;width:24px;height:24px;border-radius:50%;background:var(--brand);color:#fff;font-weight:700;font-size:11px;display:grid;place-items:center;border:2px solid var(--brand)}
.stepcard .body{flex:1}
.stepcard .t{font-weight:600;font-size:13.5px}
/* tags (node classes) */
.tag{display:inline-block;font-size:10.5px;font-weight:700;padding:1px 7px;border-radius:5px}
.tag.Observed{color:var(--obs);background:#e8eefc}
.tag.Claim{color:var(--claim);background:var(--warnbg)}
.tag.Benchmark{color:var(--bench);background:#efe8fb}
.tag.External{color:var(--ext);background:var(--okbg)}
.tag.Derived{color:#0f6d78;background:#e0f5f7}
.tag.Gap{color:var(--gap);background:var(--badbg)}
/* driver rows */
.driver{border:1px solid var(--line);border-radius:9px;padding:10px 12px;margin-bottom:8px;background:#fff}
.driver .row{display:flex;justify-content:space-between;align-items:center;gap:10px}
.driver .name{font-weight:600;font-size:13px}
/* evidence + docs */
.evidence-item{display:flex;justify-content:space-between;gap:10px;padding:10px 11px;border:1px solid var(--line);border-radius:9px;margin-bottom:8px;background:#fff}
.evidence-item.top{border-color:#bcd0ff;box-shadow:0 0 0 1px #dbe6ff inset}
.doc{display:flex;justify-content:space-between;gap:10px;padding:9px 11px;border:1px solid var(--line);border-radius:9px;margin-bottom:7px;background:#fff;font-size:13px}
.verdict{font-size:11px;font-weight:700;padding:2px 8px;border-radius:5px}
.verdict.concordant{color:var(--ok);background:var(--okbg)}
.verdict.partial{color:var(--warn);background:var(--warnbg)}
.verdict.conflict{color:var(--bad);background:var(--badbg)}
/* callout */
.callout{border:1px solid var(--line);border-left:3px solid var(--brand);background:#fbfcff;padding:11px 13px;border-radius:0 9px 9px 0;font-size:12.5px;color:var(--ink)}
.callout.ext{border-left-color:var(--ext);background:#f6fdf9}
/* table */
table{width:100%;border-collapse:collapse;font-size:13px}
th,td{text-align:left;padding:7px 9px;border-bottom:1px solid var(--line2);vertical-align:top}
th{color:var(--mut);font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.4px}
td.num,th.num{text-align:right;font-family:var(--mono)}
/* select */
.select{background:#fff;border:1px solid var(--line);color:var(--ink);border-radius:9px;padding:9px 12px;font-size:14px}
.select:focus{outline:2px solid #bcd0ff;border-color:var(--brand)}
.pill{font-size:11px;border:1px solid var(--line);border-radius:999px;padding:3px 9px;color:var(--mut);cursor:pointer}
.pill.on{background:#e8eefc;border-color:var(--brand);color:var(--brand-ink);font-weight:600}
.empty{min-height:200px;border:1.5px dashed var(--line);border-radius:12px;display:grid;place-items:center;text-align:center;color:var(--dim);background:#fff}
.footer{border-top:1px solid var(--line);color:var(--dim);font-size:12px;padding:20px 0 44px;margin-top:22px}
`;

// Lightweight access-code gate (client-side). Blocks the page behind a code
// until entered; remembers within the browser tab session. This is a simple
// demonstration lock, NOT authenticated login / real access control.
export function pslGate(code = "1504"){
  return `<div id="pslGate" style="position:fixed;inset:0;z-index:99999;background:linear-gradient(120deg,#0f1b3d,#1b2b57);display:flex;align-items:center;justify-content:center;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif">
  <div style="background:#fff;border-radius:16px;padding:30px 28px;max-width:360px;width:90%;box-shadow:0 24px 70px rgba(0,0,0,.4);text-align:center">
    <div style="display:inline-flex;align-items:center;gap:8px;font-weight:800;font-size:15px;color:#1a2233"><span style="background:linear-gradient(135deg,#2f6bff,#0f6d78);color:#fff;border-radius:7px;padding:3px 8px;font-size:12px">PSL</span> Phone Se Loan</div>
    <div style="font-weight:700;font-size:17px;color:#1a2233;margin:12px 0 2px">Business X-Ray</div>
    <div style="color:#5b6478;font-size:13px;margin:2px 0 16px">Enter the access code to continue</div>
    <input id="pslGateCode" type="password" inputmode="numeric" autocomplete="off" placeholder="••••" style="width:100%;text-align:center;letter-spacing:8px;font-size:22px;padding:11px;border:1px solid #e3e7ef;border-radius:11px;outline:none"/>
    <div id="pslGateErr" style="color:#8f1d31;font-size:12px;height:16px;margin:7px 0"></div>
    <button id="pslGateBtn" style="width:100%;background:#2f6bff;color:#fff;border:none;border-radius:11px;padding:12px;font-weight:700;font-size:15px;cursor:pointer">Unlock</button>
    <div style="color:#8a93a6;font-size:11px;margin-top:14px;line-height:1.4">Demonstration access gate — not a substitute for authenticated login.</div>
  </div></div>
  <script>(function(){var CODE=${JSON.stringify(String(code))};
  try{if(sessionStorage.getItem('psl_gate_ok')==='1'){var g0=document.getElementById('pslGate');if(g0)g0.remove();return;}}catch(e){}
  var g=document.getElementById('pslGate'),i=document.getElementById('pslGateCode'),b=document.getElementById('pslGateBtn'),er=document.getElementById('pslGateErr');
  function ok(){try{sessionStorage.setItem('psl_gate_ok','1');}catch(e){}g&&g.remove();}
  function tryUnlock(){if(i.value.trim()===CODE){ok();}else{er.textContent='Incorrect code';i.value='';i.focus();}}
  b&&(b.onclick=tryUnlock);i&&i.addEventListener('keydown',function(e){if(e.key==='Enter')tryUnlock();});i&&i.focus();})();</script>`;
}

export function pslHeader(stageLabel, rightText){
  return `<header class="psl"><div class="wrap">
    <span class="title">Phone Se Loan</span>
    <span class="badge stage">${stageLabel}</span>
    <span class="badge live">● BUSINESS X-RAY</span>
    <span class="right">${rightText}</span>
  </div></header>`;
}
