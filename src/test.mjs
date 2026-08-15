// Offline verification of the Business X-Ray engine against the paper's numbers.
import { computeEstimate, energyProxy, concordance, DEMOS } from "./worker.js";

let pass = 0, fail = 0;
const cr = (x) => (x / 1e7).toFixed(2) + " Cr";
function approx(label, got, want, tolPct) {
  const ok = Math.abs(got - want) / want <= tolPct;
  (ok ? pass++ : fail++);
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}: got ${cr(got)} want ~${cr(want)} (±${tolPct*100}%)`);
}
function ok(label, cond) { (cond ? pass++ : fail++); console.log(`${cond?"PASS":"FAIL"}  ${label}`); }

console.log("=== Scrap-metal yard (paper §6.1) ===");
const scrap = computeEstimate("scrap", DEMOS.scrap.drivers, { external: DEMOS.scrap.external, inventory: DEMOS.scrap.inventory });
approx("base turnover ~16.1 Cr", scrap.turnover.base, 16.1e7, 0.03);
approx("conservative ~5.8 Cr", scrap.turnover.conservative, 5.8e7, 0.05);
approx("optimistic ~26.9 Cr", scrap.turnover.optimistic, 26.9e7, 0.05);
approx("EBITDA ~64.6 L", scrap.pnl.ebitda.base, 0.646e7, 0.06);
ok("net operating cycle ~13 days", Math.abs(scrap.pnl.cycleDays - 13) <= 2);

const elec = energyProxy("scrap", 2000, 1);
approx("energy proxy ~12 Cr", elec.base, 12e7, 0.02);
ok("energy proxy concordant with photo interval (C in (0,1))",
   scrap.triangulation.concordance > 0.2 && scrap.triangulation.concordance < 1);
ok("cash-share flagged as conflict", scrap.triangulation.signals.some(s => s.type==="payments" && s.verdict==="conflict"));

console.log("\n=== Supermarket iterative closure (paper §6.2) ===");
const init = computeEstimate("retail", DEMOS.supermarket.initial, {});
const closed = computeEstimate("retail", DEMOS.supermarket.closed, {});
console.log(`  initial relWidth ${(init.turnover.relWidth*100).toFixed(0)}%  ->  closed relWidth ${(closed.turnover.relWidth*100).toFixed(0)}%`);
ok("interval narrows monotonically", closed.turnover.relWidth < init.turnover.relWidth);
ok("closed interval ~±14% (relWidth ~0.28)", Math.abs(closed.turnover.relWidth - 0.28) < 0.06);

console.log("\n=== Engine invariants ===");
// monotone narrowing: tightening a driver never widens revenue
const base = computeEstimate("retail", DEMOS.supermarket.initial, {});
const tightened = JSON.parse(JSON.stringify(DEMOS.supermarket.initial));
tightened.txns = { lo: 400, base: 450, hi: 500 };
const t2 = computeEstimate("retail", tightened, {});
ok("narrowing a driver reduces scenario width", t2.turnover.width < base.turnover.width);
// next-evidence ranking present and sorted
ok("evidence ranked, top item has highest score",
   scrap.evidence.items.length > 0 &&
   scrap.evidence.items.every((e,i,a)=> i===0 || a[i-1].acquisitionScore >= e.acquisitionScore));
// abstention triggers on hard flag
const ab = computeEstimate("scrap", DEMOS.scrap.drivers, { flags:{ reuse:true } });
ok("abstention triggers on 'possible photo reuse'", ab.abstention.abstain === true);
ok("concordance identity: C(I,I)=1", Math.abs(concordance({lo:1,hi:2},{lo:1,hi:2}) - 1) < 1e-9);
ok("concordance disjoint: C=0", concordance({lo:1,hi:2},{lo:5,hi:6}) === 0);

console.log("\n=== Inventory worksheet -> trade cycle (Eq 4) ===");
ok("inventory is evidence-backed (observed)", scrap.pnl.inventorySource === "observed");
ok("measured DIO ~12 days from stock", Math.abs(scrap.pnl.dio - 12) <= 2);
ok("net trade cycle ~13 days", Math.abs(scrap.pnl.cycleDays - 13) <= 2);
ok("WCR positive from identity Inv+Rec-Pay", scrap.pnl.wcr.base > 0);
// without inventory it falls back to benchmark DIO
const noInv = computeEstimate("scrap", DEMOS.scrap.drivers, {});
ok("falls back to benchmark DIO when no stock lines", noInv.pnl.inventorySource === "benchmark" && noInv.pnl.dio === 12);

console.log("\n=== Banking vs cash reconciliation ===");
const bk = scrap.triangulation.banking;
ok("banking reconciliation present", !!bk);
ok("cash share ~99% (scrap is cash-heavy)", Math.abs(bk.cashSharePct - 99) <= 2);
ok("high cash share flagged as conflict", bk.verdict === "conflict");
// more banked credits -> lower cash share
const banked = computeEstimate("retail", DEMOS.supermarket.closed, { external:{ banking:{ credits: 3.3e7, months:12, channels:1 } } });
ok("higher banked credits lower the cash share", banked.triangulation.banking.cashSharePct < 40);

console.log(`\n=== ${pass} passed, ${fail} failed ===`);
process.exit(fail ? 1 : 0);
