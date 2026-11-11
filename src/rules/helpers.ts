import { Node, SyntaxKind } from "ts-morph";

export type PlatformName = "ios" | "android";

/** Recognises `Platform.OS === 'ios'` and variants. */
export function asPlatformCheck(expr: Node): { platform: PlatformName; negated: boolean } | undefined {
  if (!Node.isBinaryExpression(expr)) return undefined;
  const op = expr.getOperatorToken().getKind();
  const eq = op === SyntaxKind.EqualsEqualsEqualsToken || op === SyntaxKind.EqualsEqualsToken;
  const neq = op === SyntaxKind.ExclamationEqualsEqualsToken || op === SyntaxKind.ExclamationEqualsToken;
  if (!eq && !neq) return undefined;
  const [l, r] = [expr.getLeft(), expr.getRight()];
  const [osSide, litSide] = l.getText() === "Platform.OS" ? [l, r] : r.getText() === "Platform.OS" ? [r, l] : [undefined, undefined];
  if (!osSide || !litSide || !Node.isStringLiteral(litSide)) return undefined;
  const v = litSide.getLiteralValue();
  if (v !== "ios" && v !== "android") return undefined;
  return { platform: v, negated: neq };
}

export function endsWithExit(stmt: Node): boolean {
  const last = Node.isBlock(stmt) ? stmt.getStatements().at(-1) : stmt;
  return !!last && (Node.isReturnStatement(last) || Node.isThrowStatement(last) || Node.isContinueStatement(last) || Node.isBreakStatement(last));
}

export const pos = (n: Node) => {
  const sf = n.getSourceFile();
  const { line, column } = sf.getLineAndColumnAtPos(n.getStart());
  return { file: sf.getFilePath() as string, line, column };
};
