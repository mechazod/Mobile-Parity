import { describe, expect, it } from "vitest";
import { analyze } from "../src/engine.js";

const ids = (r: ReturnType<typeof analyze>) => r.findings.map((f) => f.ruleId).sort();

describe("bad-app", () => {
  const r = analyze("fixtures/bad-app");
  it("flags unmatched branch, select, divergent files, and missing permissions", () => {
    expect(ids(r)).toEqual(["PG001", "PG002", "PG003", "PG006", "PG007"]);
  });
  it("honours parity-ignore and early-return exemptions", () => {
    expect(r.suppressed).toBe(1);
    expect(r.findings.filter((f) => f.ruleId === "PG001")).toHaveLength(1);
  });
  it("hides medium-confidence findings unless --strict", () => {
    expect(r.hidden).toBe(1);
    expect(ids(analyze("fixtures/bad-app", { strict: true }))).toContain("PG001");
    expect(analyze("fixtures/bad-app", { strict: true }).findings).toHaveLength(6);
  });
  it("baseline suppresses existing findings only", () => {
    const base = new Set(r.findings.map((f) => f.fingerprint));
    expect(analyze("fixtures/bad-app", { baseline: base }).findings).toHaveLength(0);
  });
});

describe("good-app", () => {
  it("is clean", () => expect(analyze("fixtures/good-app").findings).toEqual([]));
});

describe("config", () => {
  it("overrides severity and turns rules off", () => {
    const r = analyze("fixtures/bad-app", { config: { rules: { PG002: "warn", PG003: "off" } } });
    expect(r.findings.find((f) => f.ruleId === "PG002")?.severity).toBe("warn");
    expect(ids(r)).not.toContain("PG003");
  });
  it("excludes paths", () => {
    expect(analyze("fixtures/bad-app", { config: { exclude: ["src/**"] } }).findings).toEqual([]);
  });
});
