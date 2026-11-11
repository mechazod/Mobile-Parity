import { Node, SyntaxKind } from "ts-morph";
import type { Rule } from "../types.js";
import { asPlatformCheck, endsWithExit, pos } from "./helpers.js";

export const pg001: Rule = {
  id: "PG001",
  title: "Platform.OS branch has no counterpart",
  severity: "warn",
  confidence: "high",
  explain:
    "An `if (Platform.OS === 'ios')` with no else (and no early return) means the other platform silently skips that logic. " +
    "`Platform.OS === 'x' && <JSX/>` is reported at medium confidence because it is often intentional (shown only with --strict).",
  check(ctx, report) {
    for (const sf of ctx.sourceFiles) {
      for (const ifs of sf.getDescendantsOfKind(SyntaxKind.IfStatement)) {
        const chk = asPlatformCheck(ifs.getExpression());
        if (!chk || ifs.getElseStatement() || endsWithExit(ifs.getThenStatement())) continue;
        const other = chk.platform === "ios" ? "android" : "ios";
        report({
          ...pos(ifs),
          message: `Branch for ${chk.negated ? "non-" : ""}${chk.platform} has no ${other} counterpart.`,
          why: `On ${chk.negated ? chk.platform : other}, this logic is skipped entirely with no fallback.`,
          fix: `Add an else branch, or add \`// parity-ignore PG001: <reason>\` if the difference is intentional.`,
        });
      }
      for (const bin of sf.getDescendantsOfKind(SyntaxKind.BinaryExpression)) {
        if (bin.getOperatorToken().getKind() !== SyntaxKind.AmpersandAmpersandToken) continue;
        const chk = asPlatformCheck(bin.getLeft());
        if (!chk || Node.isIfStatement(bin.getParent())) continue;
        report({
          ...pos(bin),
          confidence: "medium",
          message: `\`Platform.OS === '${chk.platform}' && …\` renders/runs on ${chk.platform} only.`,
          why: "The other platform gets no equivalent. Fine for iOS-only chrome, risky for functional UI.",
          fix: "Confirm the other platform doesn't need an equivalent, then add a parity-ignore comment with a reason.",
        });
      }
    }
  },
};
