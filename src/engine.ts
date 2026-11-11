import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { Config } from "./config.js";
import { loadProject } from "./project.js";
import { rules } from "./rules/index.js";
import type { Finding, ReportInput } from "./types.js";

export interface AnalyzeOptions { strict?: boolean; baseline?: Set<string>; config?: Config }
export interface AnalyzeResult { findings: Finding[]; suppressed: number; baselined: number; hidden: number }

const IGNORE_RE = /parity-ignore(?:\s+([A-Z0-9, ]+?))?(?:\s*:\s*(.*))?\s*(?:\*\/)?\s*$/;

function isSuppressed(text: string, line: number, ruleId: string): boolean {
  const lines = text.split(/\r?\n/);
  for (const idx of [line - 1, line - 2]) { // same line, or the line above
    const m = lines[idx]?.match(IGNORE_RE);
    if (!m || !/(\/\/|\/\*)\s*parity-ignore/.test(lines[idx])) continue;
    const ids = m[1]?.split(/[,\s]+/).filter(Boolean);
    if (!ids || ids.includes(ruleId)) return true;
  }
  return false;
}

export function analyze(root: string, opts: AnalyzeOptions = {}): AnalyzeResult {
  root = path.resolve(root);
  const ctx = loadProject(root, opts.config?.exclude);
  const findings: Finding[] = [];
  let suppressed = 0, baselined = 0, hidden = 0;

  for (const base of rules) {
    const override = opts.config?.rules?.[base.id];
    if (override === "off") continue;
    const rule = override ? { ...base, severity: override } : base;
    const report = (r: ReportInput) => {
      const text = fs.readFileSync(r.file, "utf8").split(/\r?\n/)[r.line - 1]?.trim() ?? "";
      const rel = path.relative(root, r.file).split(path.sep).join("/");
      const confidence = r.confidence ?? rule.confidence;
      if (isSuppressed(fs.readFileSync(r.file, "utf8"), r.line, rule.id)) { suppressed++; return; }
      const fingerprint = crypto.createHash("sha1").update(`${rule.id}|${rel}|${r.anchor ?? text}`).digest("hex").slice(0, 16);
      if (opts.baseline?.has(fingerprint)) { baselined++; return; }
      if (confidence !== "high" && !opts.strict) { hidden++; return; }
      findings.push({
        ruleId: rule.id, severity: rule.severity, confidence, message: r.message, why: r.why, fix: r.fix,
        file: rel, line: r.line, column: r.column, fingerprint,
      });
    };
    rule.check(ctx, report);
  }
  findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
  return { findings, suppressed, baselined, hidden };
}

export const BASELINE_FILE = "parityguard.baseline.json";
export function loadBaseline(root: string): Set<string> | undefined {
  const p = path.join(root, BASELINE_FILE);
  if (!fs.existsSync(p)) return undefined;
  return new Set(JSON.parse(fs.readFileSync(p, "utf8")).fingerprints);
}
export function writeBaseline(root: string, findings: Finding[]) {
  const fingerprints = [...new Set(findings.map((f) => f.fingerprint))].sort();
  fs.writeFileSync(path.join(root, BASELINE_FILE), JSON.stringify({ version: 1, fingerprints }, null, 2) + "\n");
}
