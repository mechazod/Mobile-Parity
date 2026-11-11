import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ProjectContext, ReportInput, Rule } from "../types.js";

interface Capability { id: string; imports: string[]; iosKeys: string[]; androidPermissions: string[]; expoPlugins: string[] }
const here = path.dirname(fileURLToPath(import.meta.url));
export const capabilityData: { dataVersion: string; capabilities: Capability[] } = JSON.parse(
  fs.readFileSync(path.resolve(here, "../../data/capabilities.json"), "utf8"),
);

function usages(ctx: ProjectContext) {
  const found = new Map<string, { cap: Capability; file: string; line: number; column: number; mod: string }>();
  for (const sf of ctx.sourceFiles) {
    for (const imp of sf.getImportDeclarations()) {
      const mod = imp.getModuleSpecifierValue();
      for (const cap of capabilityData.capabilities) {
        if (found.has(cap.id) || !cap.imports.some((i) => mod === i || mod.startsWith(i + "/"))) continue;
        const { line, column } = sf.getLineAndColumnAtPos(imp.getStart());
        found.set(cap.id, { cap, file: sf.getFilePath(), line, column, mod });
      }
    }
  }
  return [...found.values()];
}

export function makePermissionRule(platform: "ios" | "android"): Rule {
  const ios = platform === "ios";
  return {
    id: ios ? "PG006" : "PG007",
    title: ios ? "Missing iOS usage description" : "Missing Android permission",
    severity: "error",
    confidence: "high",
    explain: ios
      ? "Using a privacy-sensitive API without the matching Info.plist usage string crashes the app on iOS and gets it rejected in review."
      : "Using a protected API without declaring the permission means the request is silently denied on Android.",
    check(ctx, report: (r: ReportInput) => void) {
      const n = ctx.native;
      if (ios ? !n.hasIosConfig : !n.hasAndroidConfig) return; // nothing to compare against
      for (const u of usages(ctx)) {
        const declared = ios
          ? u.cap.iosKeys.some((k) => n.iosKeys.has(k))
          : u.cap.androidPermissions.some((p) => n.androidPermissions.has(p));
        const viaPlugin = u.cap.expoPlugins.some((p) => n.expoPlugins.has(p));
        if (declared || viaPlugin) continue;
        const need = ios ? u.cap.iosKeys : u.cap.androidPermissions;
        report({
          file: u.file, line: u.line, column: u.column, anchor: `${u.cap.id}:${platform}`,
          confidence: n.dynamicConfig ? "low" : "high",
          message: `\`${u.mod}\` (${u.cap.id}) is used but ${ios ? "no usage description" : "no permission"} is declared. Expected one of: ${need.join(", ")}.`,
          why: ios ? "iOS terminates the app when this API is used without a usage string; App Store review also rejects it."
                   : "Android denies the permission request without a manifest declaration, so the feature fails only on Android.",
          fix: n.isExpo
            ? `Add the \`${u.cap.expoPlugins[0] ?? u.cap.id}\` config plugin, or set ${ios ? "expo.ios.infoPlist" : "expo.android.permissions"} in app.json.`
            : ios ? `Add ${need[0]} to ios/<App>/Info.plist.` : `Add <uses-permission android:name="${need[0]}"/> to AndroidManifest.xml.`,
        });
      }
    },
  };
}
