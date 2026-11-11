#!/usr/bin/env node
import { parseArgs } from "node:util";
import path from "node:path";
import { loadConfig } from "./config.js";
import { analyze, loadBaseline, writeBaseline } from "./engine.js";
import { json, sarif, terminal } from "./reporters.js";
import { rules } from "./rules/index.js";

const HELP = `parityguard — catch iOS/Android drift before it reaches a device

Usage:
  parityguard check [path] [--format terminal|json|sarif] [--strict] [--no-baseline] [--config file]
  parityguard check [path] --update-baseline
  parityguard rules
  parityguard explain <RULE_ID>

Exit codes: 0 clean (or warnings only), 1 errors found, 2 usage/internal error.`;

async function main(): Promise<number> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      format: { type: "string", default: "terminal" },
      strict: { type: "boolean", default: false },
      "update-baseline": { type: "boolean", default: false },
      "no-baseline": { type: "boolean", default: false },
      config: { type: "string" },
      help: { type: "boolean", short: "h", default: false },
    },
  });
  const [cmd, arg] = positionals;
  if (values.help || !cmd) { console.log(HELP); return cmd ? 0 : 2; }

  if (cmd === "rules") { rules.forEach((r) => console.log(`${r.id}  ${r.severity.padEnd(5)}  ${r.title}`)); return 0; }
  if (cmd === "explain") {
    const r = rules.find((x) => x.id === arg?.toUpperCase());
    if (!r) { console.error(`Unknown rule: ${arg}`); return 2; }
    console.log(`${r.id} — ${r.title}\nDefault severity: ${r.severity}, confidence: ${r.confidence}\n\n${r.explain}`);
    return 0;
  }
  if (cmd !== "check") { console.error(`Unknown command: ${cmd}\n\n${HELP}`); return 2; }

  const root = path.resolve(arg ?? ".");
  const baseline = values["no-baseline"] || values["update-baseline"] ? undefined : loadBaseline(root);
  const config = await loadConfig(root, values.config);
  const result = analyze(root, { strict: values.strict, baseline, config });

  if (values["update-baseline"]) {
    writeBaseline(root, result.findings);
    console.log(`Baseline written with ${result.findings.length} finding(s). Only new drift will fail from now on.`);
    return 0;
  }
  const out = values.format === "json" ? json(result) : values.format === "sarif" ? sarif(result) : terminal(result);
  console.log(out);
  return result.findings.some((f) => f.severity === "error") ? 1 : 0;
}

main().then((c) => { process.exitCode = c; }, (e) => { console.error(e instanceof Error ? e.message : e); process.exitCode = 2; });
