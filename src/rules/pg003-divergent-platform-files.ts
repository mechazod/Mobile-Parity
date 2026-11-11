import type { Rule } from "../types.js";

export const pg003: Rule = {
  id: "PG003",
  title: "Platform-specific files export different names",
  severity: "error",
  confidence: "high",
  explain: "`X.ios.tsx` and `X.android.tsx` are resolved by name from shared code, so their exports must match.",
  check(ctx, report) {
    const groups = new Map<string, { ios?: any; android?: any }>();
    for (const sf of ctx.sourceFiles) {
      const m = sf.getFilePath().match(/^(.*)\.(ios|android)\.(tsx?|jsx?)$/);
      if (!m) continue;
      const key = `${m[1]}.${m[3]}`;
      groups.set(key, { ...groups.get(key), [m[2]]: sf });
    }
    for (const { ios, android } of groups.values()) {
      if (!ios || !android) continue;
      const a = new Set([...ios.getExportedDeclarations().keys()] as string[]);
      const b = new Set([...android.getExportedDeclarations().keys()] as string[]);
      const onlyIos = [...a].filter((x) => !b.has(x));
      const onlyAndroid = [...b].filter((x) => !a.has(x));
      if (!onlyIos.length && !onlyAndroid.length) continue;
      report({
        file: ios.getFilePath(), line: 1, column: 1,
        anchor: `${onlyIos.join(",")}|${onlyAndroid.join(",")}`,
        message: `Export mismatch between .ios and .android files` +
          (onlyIos.length ? ` — only iOS exports: ${onlyIos.join(", ")}` : "") +
          (onlyAndroid.length ? ` — only Android exports: ${onlyAndroid.join(", ")}` : "") + ".",
        why: "Shared code importing the missing name crashes or gets `undefined` on one platform.",
        fix: "Export the same names from both files (or extract the shared surface into a common module).",
      });
    }
  },
};
