import type { Project, SourceFile } from "ts-morph";

export type Severity = "error" | "warn" | "info";
export type Confidence = "high" | "medium" | "low";

export interface Finding {
  ruleId: string;
  severity: Severity;
  confidence: Confidence;
  message: string;
  why: string;
  fix: string;
  file: string; // relative to project root, posix separators
  line: number;
  column: number;
  fingerprint: string;
}

export interface ReportInput {
  file: string; // absolute path
  line: number;
  column: number;
  message: string;
  why: string;
  fix: string;
  confidence?: Confidence;
  /** Stable text used for the baseline fingerprint (defaults to the source line). */
  anchor?: string;
}

export interface NativeConfig {
  isExpo: boolean;
  /** app.config.ts/js exists and can't be statically evaluated. */
  dynamicConfig: boolean;
  hasIosConfig: boolean;
  hasAndroidConfig: boolean;
  iosKeys: Set<string>;
  androidPermissions: Set<string>;
  expoPlugins: Set<string>;
}

export interface ProjectContext {
  root: string;
  project: Project;
  sourceFiles: SourceFile[];
  native: NativeConfig;
}

export interface Rule {
  id: string;
  title: string;
  severity: Severity;
  confidence: Confidence;
  explain: string;
  check(ctx: ProjectContext, report: (r: ReportInput) => void): void;
}
