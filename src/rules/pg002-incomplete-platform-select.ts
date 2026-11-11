import { Node, SyntaxKind } from "ts-morph";
import type { Rule } from "../types.js";
import { pos } from "./helpers.js";

export const pg002: Rule = {
  id: "PG002",
  title: "Platform.select is missing a platform",
  severity: "error",
  confidence: "high",
  explain: "`Platform.select({ ios: … })` returns `undefined` on Android unless `android`, `native`, or `default` is provided.",
  check(ctx, report) {
    for (const sf of ctx.sourceFiles) {
      for (const call of sf.getDescendantsOfKind(SyntaxKind.CallExpression)) {
        if (call.getExpression().getText() !== "Platform.select") continue;
        const arg = call.getArguments()[0];
        if (!arg || !Node.isObjectLiteralExpression(arg)) continue;
        if (arg.getProperties().some((p) => Node.isSpreadAssignment(p))) continue; // can't know
        const keys = new Set(arg.getProperties().map((p) => (Node.isPropertyAssignment(p) || Node.isShorthandPropertyAssignment(p) ? p.getName().replace(/['"]/g, "") : "")));
        if (keys.has("default") || keys.has("native")) continue;
        const missing = (["ios", "android"] as const).filter((k) => !keys.has(k));
        if (missing.length === 0) continue;
        report({
          ...pos(call),
          message: `Platform.select is missing: ${missing.join(", ")}.`,
          why: `On ${missing.join(" and ")} this expression evaluates to \`undefined\` at runtime.`,
          fix: "Add the missing key, or add a `default` value.",
        });
      }
    }
  },
};
