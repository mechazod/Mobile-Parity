import fs from "node:fs";
import path from "node:path";
import { Project } from "ts-morph";
import type { NativeConfig, ProjectContext } from "./types.js";

const IGNORE = ["node_modules", "dist", "build", "Pods", ".expo", "coverage", "ios", "android"];

export function loadProject(root: string, exclude: string[] = []): ProjectContext {
  const project = new Project({
    skipAddingFilesFromTsConfig: true,
    skipFileDependencyResolution: true,
    compilerOptions: { allowJs: true, jsx: 4 },
  });
  const globs = [`${root}/**/*.{ts,tsx,js,jsx}`, `!${root}/**/*.d.ts`, ...IGNORE.map((d) => `!${root}/**/${d}/**`), ...exclude.map((g) => `!${root}/${g}`)];
  project.addSourceFilesAtPaths(globs);
  return { root, project, sourceFiles: project.getSourceFiles(), native: loadNativeConfig(root) };
}

function readJson(p: string): any | undefined {
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return undefined; }
}

export function loadNativeConfig(root: string): NativeConfig {
  const n: NativeConfig = {
    isExpo: false, dynamicConfig: false, hasIosConfig: false, hasAndroidConfig: false,
    iosKeys: new Set(), androidPermissions: new Set(), expoPlugins: new Set(),
  };

  // Expo static config
  const appJson = readJson(path.join(root, "app.json"));
  const expo = appJson?.expo ?? appJson;
  if (expo && typeof expo === "object" && (appJson?.expo || expo.name)) {
    n.isExpo = true;
    n.hasIosConfig = true;
    n.hasAndroidConfig = true;
    Object.keys(expo.ios?.infoPlist ?? {}).forEach((k) => n.iosKeys.add(k));
    for (const p of expo.android?.permissions ?? []) {
      n.androidPermissions.add(p.includes(".") ? p : `android.permission.${p}`);
    }
    for (const pl of expo.plugins ?? []) n.expoPlugins.add(Array.isArray(pl) ? pl[0] : pl);
  }
  if (["app.config.ts", "app.config.js"].some((f) => fs.existsSync(path.join(root, f))) && !n.isExpo) {
    n.isExpo = true;
    n.dynamicConfig = true;
  }

  // Bare iOS: ios/<App>/Info.plist
  const iosDir = path.join(root, "ios");
  if (fs.existsSync(iosDir)) {
    for (const d of fs.readdirSync(iosDir, { withFileTypes: true })) {
      const plist = path.join(iosDir, d.name, "Info.plist");
      if (d.isDirectory() && fs.existsSync(plist)) {
        n.hasIosConfig = true;
        for (const m of fs.readFileSync(plist, "utf8").matchAll(/<key>([^<]+)<\/key>/g)) n.iosKeys.add(m[1]);
      }
    }
  }
  // Bare Android manifest
  const manifest = path.join(root, "android/app/src/main/AndroidManifest.xml");
  if (fs.existsSync(manifest)) {
    n.hasAndroidConfig = true;
    for (const m of fs.readFileSync(manifest, "utf8").matchAll(/<uses-permission[^>]*android:name="([^"]+)"/g)) {
      n.androidPermissions.add(m[1]);
    }
  }
  return n;
}
