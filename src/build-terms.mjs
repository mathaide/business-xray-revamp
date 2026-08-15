// Terms & Consent page for the Business X-Ray capture (served at /terms).
import { writeFileSync } from "node:fs";
import { AIOS_CSS, pslHeader, pslGate } from "./aios-theme.mjs";

const S = (h,body)=>`<section><h2 style="text-transform:none;letter-spacing:0;font-size:16px;color:var(--ink);margin:20px 0 6px">${h}</h2>${body}</section>`;

const html = `<!doctype html><html lang="en"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Business X-Ray — Terms &amp; Consent (Mitra capture)</title>
<style>${AIOS_CSS}
section{padding:0} p{font-size:13.5px;color:var(--ink);margin:.5em 0} li{font-size:13.5px;margin:.3em 0} h1{font-size:22px}
.twrap{max-width:900px}
</style></head><body>
${pslGate("1504")}
${pslHeader("Terms &amp; Consent","Business X-Ray · information capture by the Mitra · DPDP 2023 · RBI Digital Lending · Account Aggregator")}
<nav class="psl-nav"><div class="wrap">
  <a class="tab" href="/capture">Capture</a>
  <a class="tab" href="/industries">Industry Models</a>
  <a class="tab" href="/app">Assessment</a>
  <a class="tab" href="/data-backbone">Data Backbone</a>
  <a class="tab active" href="/terms">Terms &amp; Consent</a>
</div></nav>
<main><div class="wrap twrap"><section style="padding:18px 0">
<h1>Terms &amp; Consent — Business X-Ray information capture</h1>
<p class="lead">These terms govern the on-site capture of photographs and business information by an authorised field agent (the “Mitra”) for a first-pass, human-supervised credit assessment (“Business X-Ray”). Capture only begins after the customer has consented and both the Mitra and the customer have verified their identity by one-time password (OTP).</p>

<div class="callout ext" style="margin:14px 0"><b style="color:var(--ext)">Plain-language summary.</b> We take photos of your business premises and read a few figures from them to estimate your business activity. You decide whether to allow it. We collect only what is needed, blur faces and number plates, keep it secure, use it only for your loan assessment, and you can withdraw your consent. A human — not a model — makes the final lending decision.</div>

${S("1. Who is involved",
`<p><b>Litehouse / Phone Se Loan</b> (the “Platform”) provides the Business X-Ray assessment. The <b>Mitra</b> is the Platform’s authorised field agent who performs the capture on-site. The <b>Customer</b> is the business owner (or authorised representative) whose premises are captured.</p>`)}

${S("2. What is captured",
`<ul>
<li>Live photographs of the business premises (exterior, interior, stock, signage, meters, and — where relevant — documents such as GST board, licence, invoices).</li>
<li>Figures read from those photographs (e.g. GSTIN, UPI/QR identifier, utility consumer number, sample prices/amounts) to estimate turnover and working capital.</li>
<li>Location (GPS) of the capture, a timestamp, and the Mitra-marked business boundary (geofence).</li>
</ul>
<p>All photographs are <b>live-captured</b> using the camera only (no gallery uploads), in a single session, from inside the same establishment. Faces and vehicle number plates are cropped before a frame enters the assessment.</p>`)}

${S("3. Consent (DPDP Act 2023)",
`<p>Under the Digital Personal Data Protection Act, 2023, the Customer’s consent is <b>free, specific, informed, unconditional and unambiguous</b>, given by a clear affirmative action. Before capture, the Customer records consent in the app and both parties verify by OTP. Consent is recorded with the date, time, the mobile numbers used, and the business profile selected.</p>
<p>Consent is limited to the purpose in Section 4. The Customer may <b>withdraw consent</b> at any time (see Section 8); withdrawal does not affect processing already carried out lawfully before withdrawal.</p>`)}

${S("4. Purpose &amp; purpose limitation",
`<p>The information is used solely to produce an auditable, first-pass estimate of the business’s financial activity to support a credit assessment, and to verify the capture’s integrity (that it was taken on-site, in-session, within the marked boundary). It is <b>not</b> used for any unrelated purpose, and it is <b>not</b> sold.</p>`)}

${S("5. Data minimisation &amp; accuracy",
`<p>Only information necessary for the assessment is collected. Figures read by the on-device model are shown to the Mitra and confirmed or corrected by a human before use; every read and edit is logged. Outputs are <b>illustrative rule-engine estimates</b>, not a validated credit score.</p>`)}

${S("6. Regulatory framework",
`<ul>
<li><b>DPDP Act 2023</b> — consent, purpose limitation, data-principal rights, security safeguards.</li>
<li><b>RBI Digital Lending Guidelines</b> — need-based data collection, transparency, auditability and explainability; no automatic credit decision without human oversight.</li>
<li><b>Account Aggregator (AA) framework &amp; RBI Master Direction</b> — any consented pull of GST / bank-statement / utility data follows the AA consent architecture.</li>
</ul>`)}

${S("7. Identity verification — dual OTP",
`<p>Before capture, the Platform sends <b>two different one-time passwords</b> over SMS — one to the Mitra’s registered mobile and one to the Customer’s mobile — simultaneously. <b>Both</b> must be entered together to start the Business X-Ray. This proves the Mitra is authorised and that the Customer is present and consenting. In the current sandbox environment the OTPs are simulated in-app; in production they are delivered over DLT-registered SMS and are never displayed on screen.</p>`)}

${S("8. Customer rights",
`<ul>
<li><b>Access &amp; correction</b> of the information captured about the business.</li>
<li><b>Withdrawal of consent</b> and <b>erasure</b> of personal data no longer required, subject to lawful retention obligations.</li>
<li><b>Grievance redressal</b> — the Customer may contact the Platform’s Grievance Officer; a nomination may be exercised as provided under the DPDP Act.</li>
</ul>`)}

${S("9. Storage, security &amp; retention",
`<p>Information is stored securely with access controls and is retained only as long as necessary for the assessment and applicable legal/regulatory requirements, after which it is deleted or anonymised. Nothing is uploaded from the device during the on-device read step; transfers to the Platform occur over secured channels.</p>`)}

${S("10. Human-only lending decision",
`<p>The Business X-Ray <b>extracts and recommends</b>; it does not sanction or disburse. Any loan approval and disbursement is made by a human underwriter on independently verified repayment capacity. The indicative review band is a policy overlay, not a sanction.</p>`)}

<div class="disclaimer" style="margin-top:18px">This page is a configurable template for demonstration and must be reviewed and finalised by the Platform’s legal counsel and Data Protection Officer before production use. It does not constitute legal advice. Sandbox environment: OTP delivery is simulated.</div>
</section></div></main>
<footer class="footer"><div class="wrap">Litehouse / Phone Se Loan · Business X-Ray · Terms &amp; Consent · DPDP 2023 · RBI Digital Lending · Account Aggregator.</div></footer>
</body></html>`;

writeFileSync("/home/claude/business-xray/business-xray-terms.html", html);
console.log("terms page:", (html.length/1024).toFixed(0)+"KB");
