// Compile worker.js into a single self-contained static index.html.
// The same verified engine runs client-side; the fetch-based api() is replaced
// by a local dispatcher so no server is needed (fits Cloudflare static-assets).
import fs from "node:fs";

const src = fs.readFileSync("worker.js", "utf8");

const slice = (start, end) => {
  const a = src.indexOf(start), b = src.indexOf(end);
  if (a < 0 || b < 0) throw new Error("marker not found: " + (a<0?start:end));
  return src.slice(a, b);
};

// 1) engine + data: from APP declaration to the API HANDLERS banner
let engine = slice("const APP = {", "/* ============================= 6. API HANDLERS");
// drop worker's fmtCr (CLIENT defines its own const fmtCr — avoid redeclaration)
engine = engine.replace(/function fmtCr\(x\) \{[\s\S]*?en-IN"\);\n\}/, "");

// 2) PROPOSITIONS + WORKFLOW live in the API section
const propsBlock = src.match(/const PROPOSITIONS = \[[\s\S]*?\];/)[0];
const wfBlock    = src.match(/const WORKFLOW = \[[\s\S]*?\];/)[0];

// 3) CSS + CLIENT
const css    = src.match(/const CSS = `([\s\S]*?)`;/)[1];
const client = src.match(/const CLIENT = String\.raw`([\s\S]*?)`;/)[1];

// 4) local API dispatcher (declared AFTER client so it wins over the fetch one)
const localApi = `
async function api(path, opts){
  if(path==='/api/meta') return { app:APP, nodeClasses:NODE_CLASSES, registry:REGISTRY,
    sectors:Object.values(SECTORS).map(s=>({id:s.id,name:s.name,revenueFormula:s.revenueFormula,drivers:s.drivers,shotList:s.shotList,evidenceItems:s.evidenceItems})),
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
<style>${css}</style>
</head><body>
<header class="top"><div class="wrap">
  <a class="brand" href="#/"><span class="logo">BX</span> Business X-Ray
    <span class="pill">engine v2.1.0</span></a>
  <nav class="main" id="nav">
    <a href="#/">Overview</a>
    <a href="#/capture">Capture</a>
    <a href="#/assess">Assessment</a>
    <a href="#/demos">Demonstrations</a>
    <a href="#/governance">Governance</a>
    <a href="#/about">About</a>
  </nav>
</div></header>
<main id="view"><div class="wrap"><section><p class="muted">Loading…</p></section></div></main>
<footer class="footer"><div class="wrap">
  Business X-Ray · engine v2.1.0 · registry 2026.08 — an auditable first-pass assessment method and a pre-registration-ready research protocol,
  <b>not a validated credit-scoring model</b>. All figures are illustrative rule-engine outputs.
</div></footer>
<script>
${engine}
${propsBlock}
${wfBlock}
${client}
${localApi}
</script>
</body></html>`;

fs.writeFileSync("index.html", html);
console.log("index.html written:", html.length, "bytes");
