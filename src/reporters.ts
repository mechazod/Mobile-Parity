import type { AnalyzeResult } from "./engine.js";
import { rules } from "./rules/index.js";

const c = (code: number) => (s: string) => (process.stdout.isTTY ? `\x1b[${code}m${s}\x1b[0m` : s);
const red = c(31), yellow = c(33), cyan = c(36), dim = c(2), bold = c(1);

export function terminal(r: AnalyzeResult): string {
  const out: string[] = [];
  let file = "";
  for (const f of r.findings) {
    if (f.file !== file) { file = f.file; out.push("", bold(file)); }
    const sev = f.severity === "error" ? red("error") : f.severity === "warn" ? yellow("warn ") : cyan("info ");
    out.push(`  ${f.line}:${f.column}  ${sev}  ${f.message}  ${dim(f.ruleId)}`);
    out.push(dim(`           why: ${f.why}`), dim(`           fix: ${f.fix}`));
  }
  const errors = r.findings.filter((f) => f.severity === "error").length;
  out.push("", `${r.findings.length} finding(s), ${errors} error(s). ` +
    dim(`(${r.suppressed} suppressed, ${r.baselined} baselined, ${r.hidden} low-confidence hidden — use --strict to show)`));
  return out.join("\n");
}

export const json = (r: AnalyzeResult) => JSON.stringify(r, null, 2);

export function sarif(r: AnalyzeResult): string {
  return JSON.stringify({
    $schema: "https://json.schemastore.org/sarif-2.1.0.json", version: "2.1.0",
    runs: [{
      tool: { driver: { name: "ParityGuard", rules: rules.map((x) => ({ id: x.id, shortDescription: { text: x.title }, fullDescription: { text: x.explain } })) } },
      results: r.findings.map((f) => ({
        ruleId: f.ruleId, level: f.severity === "error" ? "error" : f.severity === "warn" ? "warning" : "note",
        message: { text: `${f.message} ${f.why}` },
        locations: [{ physicalLocation: { artifactLocation: { uri: f.file }, region: { startLine: f.line, startColumn: f.column } } }],
        partialFingerprints: { parityGuard: f.fingerprint },
      })),
    }],
  }, null, 2);
}
