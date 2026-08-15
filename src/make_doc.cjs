const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, ImageRun, PageBreak,
} = require("docx");

const INK = "1b232d", MUT = "556070", BRAND = "2f4b8f", LINE = "c9d2dc";
const TW = 9360; // table width DXA (Letter, 1" margins)

const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing:{ before:280, after:120 },
  children:[new TextRun({ text:t, bold:true, color:BRAND, size:30 })] });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing:{ before:200, after:80 },
  children:[new TextRun({ text:t, bold:true, color:INK, size:24 })] });
const P = (runs, opts={}) => new Paragraph({ spacing:{ after:120, line:276 }, ...opts,
  children: (Array.isArray(runs)?runs:[new TextRun({ text:runs, size:21, color:INK })]) });
const T = (text, o={}) => new TextRun({ text, size:21, color:INK, ...o });
const small = (text, o={}) => new TextRun({ text, size:18, color:MUT, ...o });

function cell(children, w, { head=false, shade=null }={}) {
  const kids = Array.isArray(children) ? children : [ new Paragraph({ spacing:{after:0,line:250},
    children:[ new TextRun({ text:String(children), size: head?18:18, bold:head, color: head?"ffffff":INK }) ] }) ];
  return new TableCell({
    width:{ size:w, type:WidthType.DXA },
    shading: head ? { type:ShadingType.CLEAR, fill:BRAND, color:"auto" } : (shade?{type:ShadingType.CLEAR, fill:shade, color:"auto"}:undefined),
    margins:{ top:60, bottom:60, left:90, right:90 },
    children: kids,
  });
}
function table(widths, headers, rows) {
  const border = { style:BorderStyle.SINGLE, size:2, color:LINE };
  const borders = { top:border, bottom:border, left:border, right:border,
    insideHorizontal:border, insideVertical:border };
  const headRow = new TableRow({ tableHeader:true, children: headers.map((h,i)=>cell(h, widths[i], {head:true})) });
  const bodyRows = rows.map((r,ri)=> new TableRow({ children: r.map((c,i)=>cell(c, widths[i], { shade: ri%2? "f2f5f9": null })) }));
  return new Table({ width:{ size:TW, type:WidthType.DXA }, columnWidths:widths, borders, rows:[headRow, ...bodyRows] });
}
const gap = () => new Paragraph({ spacing:{ after:60 }, children:[new TextRun("")] });

/* ---------------- data ---------------- */
const facetRows = [
  ["Exterior & signage","Observed","Business stability; Social & digital","Maps/ONDC; name board → GSTIN lookup","Business exists at claimed location; identity match → anchors profile & context"],
  ["Neighbourhood / street","Observed","Behavioural / catchment","Telecom tower density (IV); ULI geospatial; footfall","Lively vs desolate catchment → bounds footfall/transaction drivers"],
  ["Interior / trading floor","Observed","—","Visible activity","Scale & activity state → baseline scenario coverage"],
  ["UPI / merchant QR","External","Income; Post-disbursement","UPI VPA → bank a/c (99.1%) → Account Aggregator","Banking-to-total ratio; cash share = residual; turnover vs bank inflows (r≈0.82) → banking-vs-cash panel"],
  ["Utility meter + consumer no.","Observed","Compliance; ULI gateway","Electricity consumer number → DISCOM load","Energy revenue proxy R̂ᵉˡᵉᶜ = E/η×κ → external triangulation"],
  ["GST board / certificate","External","Identity; Income; Compliance","GSTIN (primary key) → GSTN filings","Photo turnover vs GST-filed turnover (concordance C); unlocks the linkage chain"],
  ["Udyam certificate","External","Identity; Business stability","Udyam / enterprise registry","Vintage, MSME category, declared activity → confirms sector & scale"],
  ["Pukka / tax invoices","Observed","Income","e-invoice IRN / e-way bills → GSTN","Average ticket & price; B2B revenue; ties to tax filings"],
  ["Kacha bills / cash ledger","Claim","Income (cash)","None (off-banking) — validated as residual","Cash component not in banking → sizes the cash economy the records miss"],
  ["Price / rate board","Observed","Income","Item-price sample","Unit / blended price driver"],
  ["Machinery + nameplate","Observed","Collateral & assets","Nameplate capacity; secured-transactions registry","Rated capacity → output driver; asset/collateral value"],
  ["Display / shelves / stock","Observed","—","Visible stock density","Inventory value → DIO → trade cycle worksheet"],
  ["Storage / godown","Observed","—","Back-stock","Hidden inventory; storage capacity; abstention trigger if it dominates"],
  ["Weighbridge / measure pt.","Observed","Income","Weighbridge slips","Tonnage / throughput → removes dominant spread (scrap/warehouse)"],
  ["Licence (trade/FSSAI/factory)","External","Compliance","Sector licence registries","Legitimacy & compliance; bounds operating days"],
  ["Dispatch bay / register","Observed","Income","Dispatch register; e-way bills","Throughput / sales cadence (warehouse/mfg)"],
];
const domainRows = [
  ["1","Identity & verification","Aadhaar eKYC, PAN, GSTIN","GST board, Udyam, exterior signage"],
  ["2","Income & financial","GSTN filings, Account Aggregator (bank inflows), UPI","QR code, GST board, invoices, kacha bills"],
  ["3","Business stability","Udyam/Enterprise registry, MCA21, vintage","Udyam certificate, exterior signage"],
  ["4","Behavioural / catchment","Telecom tower density, footfall, ONDC, maps","Neighbourhood / street context"],
  ["5","Collateral & assets","Secured-transactions registry, land records, nameplates","Machinery nameplate"],
  ["6","Compliance & licences","FSSAI/trade/factory licences, utility, filing status","Utility meter, licence, GST board"],
  ["7","Post-disbursement","Real-time payments, consented account refresh","QR code (ongoing UPI/AA refresh)"],
  ["8","Social & digital","Business messaging, reviews, marketplace presence","Exterior signage (ONDC/maps presence)"],
  ["9","ULI consolidated gateway","136+ services (land, geospatial, tax, valuation)","Utility, GST, neighbourhood (geospatial)"],
  ["10","Public-service DPI mesh","GeM, AgriStack, ABDM, CBDC, e-way + 13 rails","Invoices/e-way, sector-specific facets"],
];
const profileRows = [
  ["Retail / kirana / supermarket","Exterior · neighbourhood · interior · price board · display · QR · GST board · utility meter · invoices · kacha bills · licence · Udyam"],
  ["Food & beverage","Exterior · neighbourhood · interior (seats) · menu/price board · QR · GST board · utility meter · FSSAI licence · kacha bills · display · Udyam"],
  ["Services","Exterior · neighbourhood · interior (bays) · rate card · equipment · QR · GST board · invoices · licence · kacha bills · Udyam"],
  ["Warehouse / distribution","Exterior · interior · racking/display · storage/godown · dispatch bay · handling equipment · GST board · invoices · QR · utility meter · Udyam"],
  ["Scrap trading / metal yard","Exterior · neighbourhood · interior · weighbridge · material piles · storage · rate board · baling press · GST board · utility meter · QR · kacha bills"],
  ["Light manufacturing","Exterior · interior · machines (nameplates) · raw/WIP/FG zones · storage · dispatch · utility meter (load) · GST board · invoices · QR · factory licence · Udyam"],
];
const linkageRows = [
  ["GST board → GSTIN","GSTN filing history","Photo-derived turnover vs GST-filed turnover; overlap C (interval Jaccard)","Turnover concordance / conflict flag"],
  ["QR → UPI VPA → bank","Account Aggregator inflows","Banked turnover vs photo turnover (r≈0.82); residual = cash","Banking-to-total & cash-share (risk)"],
  ["Utility consumer no.","DISCOM consumption","Energy proxy R̂ᵉˡᵉᶜ vs photo base; concordance band","Independent turnover cross-check"],
  ["Udyam / PAN","Udyam & MCA21 registry","Declared vintage & category vs observed scale","Applicability & sector confirmation"],
  ["Invoices → e-way/IRN","GSTN e-invoice / e-way","Sampled price & B2B flow vs drivers","Constrains price/throughput driver"],
  ["Neighbourhood → geo","Telecom density / geospatial","Catchment liveliness vs footfall driver","Demand-plausibility bound"],
];

/* ---------------- document ---------------- */
const title = [
  new Paragraph({ spacing:{after:40}, children:[ new TextRun({ text:"Business X-Ray", bold:true, size:40, color:BRAND }) ]}),
  new Paragraph({ spacing:{after:40}, children:[ new TextRun({ text:"Profile-Specific Photo Capture and the Data-Backbone Validation Layer", bold:true, size:28, color:INK }) ]}),
  new Paragraph({ spacing:{after:200}, children:[ new TextRun({ text:"Design rationale and manner of execution", italics:true, size:22, color:MUT }) ]}),
  new Paragraph({ spacing:{after:240}, border:{ bottom:{ style:BorderStyle.SINGLE, size:6, color:BRAND } }, children:[ small("Prepared for M. Athaide · litehouseiq.com · companion to the Business X-Ray and MSME Data-Backbone manuscripts") ] }),
];

const sec1 = [
  H1("1. Purpose"),
  P("This document sets out how the Business X-Ray platform captures photographs of a micro, small or medium enterprise (MSME) on a profile-specific basis, and how each photograph is tied to a data source that validates the analysis it feeds. It is written as a design-and-execution note: it explains the reasoning behind the taxonomy of photographs required for each business profile, the mapping from each photograph to an evidence node and to a Digital Public Infrastructure (DPI) data source, and the way the two combine to produce an auditable output. It is the connective tissue between two manuscripts — the photo-based Business X-Ray framework and the MSME Data-Backbone (record-linkage) framework — and describes how both are realised in the live product."),
  P([ T("The governing idea is simple to state. "), T("A photograph is the cheapest, fastest, most universally available piece of evidence about a thin-file business, and it is the first resolver of information. ", {bold:true}), T("A data record — a GST filing, a bank inflow reached through the Account Aggregator, an electricity load — is the confirmation. Business X-Ray is therefore photo-first: every number begins in something visible, and the data backbone corroborates or challenges it as consent and application-programming interfaces (APIs) allow. Conflicts are surfaced, never averaged away, and a human credit officer always makes the final decision.") ]),
];

const sec2 = [
  H1("2. The core idea: photo-first, data-validated"),
  P("The two frameworks answer two different questions. The Business X-Ray framework asks how a purpose-limited set of premises photographs becomes a case for auditable financial scenarios, holding apart what was seen, what was claimed, what was benchmarked and what was derived. The Data-Backbone framework asks how India's DPI exhaust — Aadhaar eKYC, the Unified Payments Interface, the Account Aggregator, the Unified Lending Interface and the Goods-and-Services-Tax Network — can be linked into research-grade micro-data using GSTIN as the primary key, PAN as the secondary key and Aadhaar as the tertiary key."),
  P([ T("Joined, they form a single pipeline. "), T("Photographs resolve the cheap first domains; the data backbone resolves the expensive, consent-gated ones; and an Information-Resolution Index measures how much of the borrower has been brought into view.", {bold:true}), T(" The photograph of a GST board is not merely an observation — it surfaces the GSTIN that unlocks the entire linkage chain. The photograph of a QR code surfaces a Virtual Payment Address that maps deterministically to a bank account and, with consent, to the inflows that size the cash economy. The photograph of a utility meter surfaces a consumer number that maps to an electricity load and an independent revenue proxy. Each facet of each photograph is, at once, a piece of visible evidence and a pointer into the data backbone.") ]),
];

const sec3 = [
  H1("3. Design principles"),
  P([ T("Provenance over precision. ",{bold:true}), T("Every photograph enters the evidence graph as a typed node — most often an Observed node — and every derived number can be traced back to it. Ranges propagate when evidence is incomplete, so precision is never manufactured from uncertain inputs.") ]),
  P([ T("Closable uncertainty. ",{bold:true}), T("Each facet is chosen for how much it narrows a material driver. The capture pack is ordered so that the highest-value evidence is collected first, and the scenario interval narrows monotonically as photographs arrive.") ]),
  P([ T("Conflict, not blending. ",{bold:true}), T("Where a photograph-derived estimate and a data record disagree — photo turnover above GST-filed turnover, or a near-total cash share against a thin banking trail — the disagreement is reported as a flag and a verification priority. Signals are never silently reconciled.") ]),
  P([ T("Cash made visible. ",{bold:true}), T("The unexplained gap between photo/GST turnover and banked inflows (empirically around eighteen per cent in the linked data) is precisely the informal cash component. Kacha-bill photographs and the banking-to-total ratio make that gap explicit rather than hiding it.") ]),
  P([ T("Privacy by design. ",{bold:true}), T("Capture is purpose-limited and minimised: faces, number plates and customer identifiers are cropped; identity documents such as Aadhaar are never stored as images; and every data pull is gated on explicit, revocable consent under the Digital Personal Data Protection Act 2023, the RBI Digital Lending Directions 2025 and the Account Aggregator Master Direction.") ]),
];

const sec4 = [
  H1("4. The photo-facet taxonomy"),
  P("A facet is a specific type of photograph or in-frame detail that a field officer collects. Facets fall into four categories — Outside, Neighbourhood, Inside, and Codes & documents / Assets & stock. Each facet is defined once, independently of profile, by the evidence node it feeds, the verification domain(s) it resolves, the data source and record-linkage key it surfaces, the validation it enables and the analysis output it drives. The table below is the facet library used in the platform."),
  gap(),
  table([1650,900,1650,2560,2600],
    ["Facet","Node","Verification domain(s)","Data source & linkage key","Validates → output"],
    facetRows),
];

const sec5 = [
  H1("5. Profile-specific capture packs"),
  P("What is diagnostic differs by business type, so each profile has its own prioritised capture pack — an ordered list of facets. A scrap yard is defined by tonnage and material mix, so a weighbridge and material piles rank first; a supermarket is defined by ticket and footfall, so a price board, POS/QR and shelf density lead; light manufacturing is defined by machine capacity and power load, so machine nameplates and the utility meter lead. The platform renders the pack for the selected profile and lets the officer capture or upload each facet in order."),
  gap(),
  table([2300,7060], ["Profile","Prioritised capture pack (in collection order)"], profileRows),
  P([ small("The six archetypes above are the sector models in the live engine; the same facet library extends to the fuller profile library (the platform ships sector templates that each map onto one of these archetypes).") ], { spacing:{ before:80, after:120 } }),
];

const sec6 = [
  H1("6. The data-backbone tie-up"),
  P("The Data-Backbone framework catalogues 103 sources across ten verification domains and links them with a hierarchical key strategy. For the photo X-ray, the relevant point is that each domain has a characteristic photograph that resolves it cheaply, and a data source that confirms it. The table maps the ten domains to their illustrative DPI sources and the photo facet that first resolves each."),
  gap(),
  table([560,2200,3540,3060], ["#","Verification domain","Illustrative DPI sources","Photo facet that resolves it"], domainRows),
  H2("6.1 Record-linkage keys the photographs surface"),
  P("Photographs do not carry financial values by themselves; they carry keys. GSTIN, read from a GST board, is the primary key that chains to PAN (99.8 per cent match via the tax-registry proprietor field) and to Aadhaar (97.2 per cent via bank KYC), and from there to consented bank, telecom and government data. A UPI Virtual Payment Address, read from a QR code, maps to a bank account at 99.1 per cent. A utility consumer number maps to an electricity load. The photograph is thus the on-site trigger for the entire linkage; the data pull follows under consent."),
  H2("6.2 Concordance validations the data enables"),
  P("Once linked, the data validates the photo-derived analysis through concordance checks on fields that appear in more than one source. The platform expresses this as interval overlap between the photo-derived scenario and each external signal."),
  gap(),
  table([1900,2200,2900,2360], ["Photo → key","Data source","Validation (concordance)","Output"], linkageRows),
  H2("6.3 The Information-Resolution Index"),
  P([ T("The unifying metric is the Information-Resolution Index (IRI): the weighted share of verification domains in which a valid signal is observed for the borrower. Photographs resolve the cheap first domains, lifting the IRI from the near-zero of a true thin file toward the coverage of a verified borrower. This matters because, in the backbone framework, a higher IRI lowers and sharpens the assessed probability of default, which lowers the break-even spread and lifts approval — with the largest effect for thin-file borrowers. "), T("In the platform, the Capture view computes the IRI live as facets are collected, so the field officer can see the marginal value of the next photograph.", {bold:true}) ]),
];

let capImg = null;
try { capImg = fs.readFileSync("capnew.png"); } catch(e) {}
const sec7 = [
  H1("7. Execution in the platform"),
  P("The platform adds a Capture view alongside the Assessment, Demonstrations and Governance views. It is deliberately a guided, one-photo-at-a-time flow rather than a gallery: on selecting a profile, the officer is prompted for a single specific photograph — for example, 'Photo 1 of 12: Exterior & signage' — with a camera target and, beside it, what to capture and why, the data source and record-linkage key that facet surfaces, what it feeds in the analysis, and the privacy guardrail. Taking or uploading the photograph advances automatically to the next facet in the profile's prioritised order, and so on until the pack is complete. A facet that does not apply can be skipped, and any step can be revisited."),
  P([ T("A progress filmstrip and running counters — photos captured, verification domains resolved, and the Information-Resolution Index — update as the officer proceeds, so the marginal value of the next photograph is always visible. A closing 'finish and review' summary shows the captured shots, the domains resolved and the data-backed validations unlocked, with a link into the Assessment. Photographs are held in-session on the device and are not uploaded; the officer, not an algorithm, reads them at this stage. "), T("In this way a photograph does not merely sit in a gallery: capturing a QR code opens the banking-vs-cash reconciliation, a utility meter opens the energy triangulation, a GST board opens the turnover concordance, and display and storage feed the inventory worksheet — each photograph ties to a data-backing check that validates an analysis and produces an output.", {bold:true}) ]),
];
if (capImg) {
  sec7.push(new Paragraph({ spacing:{ before:120, after:40 }, alignment:AlignmentType.CENTER,
    children:[ new ImageRun({ type:"png", data:capImg, transformation:{ width:600, height:Math.round(600*1700/1440) } }) ]}));
  sec7.push(new Paragraph({ alignment:AlignmentType.CENTER, spacing:{ after:160 },
    children:[ small("Figure 1. The live guided Capture view (Scrap-trading profile): the officer is prompted for one photograph at a time, with the facet's node, verification domains, data-backing key and privacy guardrail, a progress filmstrip and a running Information-Resolution Index.", {italics:true}) ]}));
}
sec7.push(H2("7.1 The visual-extraction slot (computer vision)"));
sec7.push(P([ T("Extraction is currently human-in-the-loop, which is faithful to the framework: a photograph is a reviewable observation, not an automated score. The architecture reserves the paper's g(·) visual-extraction step as a clean drop-in for computer vision and optical character recognition. "), T("At that slot, a vision model would auto-read the GSTIN off the board, the consumer number off the meter, the VPA out of the QR, and the licence and Udyam numbers, and would count shelf-facings, seats or stock — populating the Observed nodes and the linkage keys with an explicit extraction-confidence score.", {bold:true}), T(" Because every facet is already structured around the node it feeds and the key it surfaces, adding automated extraction changes how a node is filled, not the surrounding logic or audit trail.") ]));

const sec8 = [
  H1("8. Privacy, consent and governance"),
  P("The capture-and-validate design operates inside three instruments. The Digital Personal Data Protection Act 2023 requires a lawful basis, purpose limitation, data minimisation, and retention and deletion protocols, with penalties reaching ₹250 crore. The RBI Digital Lending Directions 2025 require that underwriting data sources be documented and disclosed, that algorithmic decisions carry human oversight and appeal, that prohibited bases for discrimination be excluded, and that decisions be explainable and auditable. The Account Aggregator Master Direction requires explicit, granular, time-bound and revocable consent, audit logging and deletion on revocation."),
  P("Three consequences follow for capture. First, photographs are minimised and redacted, and identity documents are never stored as images; the identity check is handled under the lender's own KYC, not by the X-ray. Second, every data pull the photographs unlock — the Account Aggregator inflows behind a QR code, the GST filings behind a board, the utility load behind a meter — is executed only after purpose-limited consent, and is logged. Third, the whole apparatus remains an auditable first-pass assessment: the outputs are illustrative scenarios and an indicative review band, not a sanction, and they are offered under regulated-lender governance with a human decision-maker."),
];

const sec9 = [
  H1("9. Staged rollout"),
  P("The design is built to be delivered in stages. The live product implements the capture taxonomy, the profile packs, the Information-Resolution Index and the manual tie-ins to banking, energy, GST and inventory analysis. The next stage adds the g(·) extraction layer — client-side QR and OCR for codes, meter numbers and GSTIN as a first pass, with a vision-API option for counts. The stage after that wires the consented data pulls themselves — Account Aggregator, GSTN and utility APIs through the Unified Lending Interface — so that a captured key triggers a live validation. Each stage preserves the same evidence graph, the same provenance, and the same human-in-the-loop governance; only the degree of automation increases."),
  P([ small("This note is a design-and-execution rationale for the litehouseiq.com Business X-Ray platform. Figures and coverage statistics are drawn from the companion manuscripts and are illustrative; the platform is an auditable first-pass assessment method, not a validated credit-scoring model.") ]),
];

const doc = new Document({
  creator:"Business X-Ray",
  title:"Business X-Ray — Photo Capture and Data-Backbone Validation",
  styles:{ default:{ document:{ run:{ font:"Calibri", size:21, color:INK } } } },
  sections:[{
    properties:{ page:{ size:{ width:12240, height:15840 }, margin:{ top:1440, bottom:1440, left:1440, right:1440 } } },
    children:[
      ...title, ...sec1, ...sec2, ...sec3, ...sec4, ...sec5, ...sec6, ...sec7, ...sec8, ...sec9,
    ],
  }],
});

Packer.toBuffer(doc).then(b => { fs.writeFileSync("Business-Xray-Photo-Capture-Design.docx", b); console.log("docx written", b.length, "bytes"); });
