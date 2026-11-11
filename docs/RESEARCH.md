# Research notes: building for mobile developers on the TypeScript repo

Researched 11 Nov 2026. Repository studied: `mechazod/typescript` at commit `1b54f27` (a mirror of
`microsoft/TypeScript`; contributions go upstream).

## What the repository is

The repo is the **native (Go) TypeScript compiler**, which shipped as TypeScript 7.0. Layout:

| Path | Contents |
| --- | --- |
| `tsc/` | Go module: compiler, checker, language server (`internal/lsp`), API server (`internal/api`) |
| `packages/typescript` | The npm package: `tsc` launcher plus JS API entry points `./sync`, `./async`, `./fs`, `./ast`, `./wasm` |
| `packages/typescript-wasip1-wasm` | Experimental wasm build of the compiler |
| `packages/vscode-typescript` | VS Code extension |
| `tools/` | Generators, lint rules, release tooling |

`tsc/CHANGES.md` tracks intentional behavior differences from the old JS compiler. Supported options include
`moduleSuffixes`, which is the mechanism for React Native platform files.

## What is happening around it (as of this date)

- TypeScript 7.0 is GA (`typescript@7.0.2` is `latest`) with roughly 8x to 12x faster full builds.
- **7.0 ships without a stable programmatic API.** Tools such as typescript-eslint, ts-morph and framework language
  tooling stayed on TypeScript 6.
- **7.1 is in beta** (`7.1.0-beta`, which this tool now uses) and restores the API as `typescript/sync`, `typescript/async`, `typescript/fs`
  and `typescript/ast`. The team says it will stay backward compatible across 7.x once stable, asks for gap reports
  before then, and has an open report of stale types after editing a content mapper's watched config.

## Mobile developer pain points found

- **Debugging** is the most-requested fix in the React Native community survey (54% of 3,501 respondents), with
  complaints about missing panels, profiling and editor integration.
- **New Architecture adoption** is around 50%, with library compatibility the main blocker.
- In an informal DM survey of about 40 React Native developers about boilerplates, the top complaints were
  locked-in navigation (28), wrapper types layered over SDK types (24) and shallow dark-mode support (19). Directional
  only, not statistical.

## Gap chosen

Platform-split modules (`.ios`/`.android`/`.native`) are invisible to a normal `tsc` run. Nothing in the repo or in
the sources above addresses it, and it fits the pain pattern (a failure surfacing late, on one device). That became
`mobile-parity`.

## Where a contribution to the repo could fit

These are leads to evaluate, not commitments:

1. **Report feedback on the 7.1 sync API.** `src/exports.ts` is now ported to `typescript/sync` and nothing I
   needed was missing, so there are no blocking gaps to report. Smaller observations worth verifying before filing:
   `parseConfigFile` returns numeric-enum options, but `createSnapshot` types its options as `RawCompilerOptions`,
   so passing one into the other needs a cast; and a `^7.1.0-beta` range resolves to nightly `dev` builds.
2. **A regression test for Metro's resolution chain** (`[".ios", ".native", ""]`). `moduleSuffixes` appears in
   `tsc/internal/execute/tsctests/tscbuild_test.go` and the generated option declarations; check whether a
   fallback-chain case already exists before proposing one.
3. **Documentation or issue reports** found while using the native compiler on a real React Native codebase.

## Read this before opening anything upstream

`CONTRIBUTING.md` sets rules that matter if AI tools are involved:

- AI-assisted PRs are allowed **only if disclosed** in the PR description; undisclosed ones are closed unread.
- **Bulk or agent-driven contributions are refused**, and repeat submitters can be blocked.
- An agent may open a PR only when a specific human chose that specific issue and will personally handle review.
- Automated comments (generated summaries on issues or PRs) are not allowed.

So the sensible path is: use the tool on your own app, collect concrete findings, then open a small, human-owned
issue or PR yourself, with disclosure.

## Sources

- [React Native survey shows rocky path for new architecture (DevClass)](https://devclass.com/2025/03/04/react-native-survey-shows-rocky-path-for-new-architecture/)
- [40 React Native devs on what they wish their boilerplate fixed (DEV)](https://dev.to/jules_sarah_0718e958f0d24/40-react-native-devs-on-what-they-wish-their-boilerplate-fixed-boe)
- [TypeScript 7 released (InfoQ)](https://infoq.com/news/2026/08/typescript-7-released/)
- [TypeScript 7.1 beta (InfoQ)](https://infoq.com/news/2026/11/typescript-7-1-beta)
- Repository files: `CONTRIBUTING.md`, `tsc/CHANGES.md`, `packages/typescript/package.json`
