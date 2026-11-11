import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { Severity } from "./types.js";

export interface Config {
  /** Override severity per rule, or turn it off. */
  rules?: Record<string, Severity | "off">;
  /** Globs (relative to project root) to skip, e.g. "src/legacy/**". */
  exclude?: string[];
}

const NAMES = ["parityguard.config.json", "parityguard.config.mjs", "parityguard.config.js"];

export async function loadConfig(root: string, explicit?: string): Promise<Config> {
  const file = explicit ? path.resolve(explicit) : NAMES.map((n) => path.join(root, n)).find((p) => fs.existsSync(p));
  if (!file) return {};
  const cfg: Config = file.endsWith(".json")
    ? JSON.parse(fs.readFileSync(file, "utf8"))
    : (await import(pathToFileURL(file).href)).default;
  validate(cfg, file);
  return cfg;
}

function validate(cfg: Config, file: string) {
  const ok = new Set(["error", "warn", "info", "off"]);
  for (const [id, sev] of Object.entries(cfg.rules ?? {})) {
    if (!ok.has(sev)) throw new Error(`${file}: rule ${id} has invalid severity "${sev}" (use error|warn|info|off)`);
  }
  if (cfg.exclude && !Array.isArray(cfg.exclude)) throw new Error(`${file}: "exclude" must be an array of globs`);
}
