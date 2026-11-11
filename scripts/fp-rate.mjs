// Computes false-positive rate per rule from labeled corpus/results.csv
import fs from "node:fs";
const rows = fs.readFileSync("corpus/results.csv", "utf8").trim().split("\n").slice(1);
const stats = {};
for (const line of rows) {
  const cols = line.split(","); const rule = cols[1]; const label = cols.at(-1).trim().toUpperCase();
  if (!["TP", "FP"].includes(label)) continue;
  (stats[rule] ??= { TP: 0, FP: 0 })[label]++;
}
for (const [rule, s] of Object.entries(stats).sort()) {
  const n = s.TP + s.FP; console.log(`${rule}  n=${n}  FP rate=${((s.FP / n) * 100).toFixed(1)}%  (target <5% for default-on rules)`);
}
if (!Object.keys(stats).length) console.log("No labeled rows yet.");
