# ParityGuard

Catch iOS/Android drift in React Native + TypeScript projects before it reaches a device.

> **Status: v0.1 alpha.** Five rules, tested on small fixtures and two clean real-world repos. Expect rough edges, and please report false positives.

ESLint tells you your code is wrong. ParityGuard tells you your code is right on one platform and wrong on the other.

## Requirements

| Use | Node |
|---|---|
| Developing ParityGuard (build + tests) | **22.12+** (Vitest 5 requirement) |
| Running the built CLI | 20.19+ (only tested on Node 22) |

Works on macOS, Linux and Windows. No network access is needed during a run.

## Quick start

```bash
git clone <your-repo-url> parityguard && cd parityguard
npm install
npm run build
npm test

node dist/cli.js check <path-to-your-rn-app>
```

Once published to npm this becomes `npx parityguard check`.

## Commands

```bash
parityguard check [path]                  # analyze a project (default: current dir)
parityguard check [path] --strict         # include medium/low-confidence findings
parityguard check [path] --format sarif   # terminal (default) | json | sarif
parityguard check [path] --update-baseline  # record existing findings; only NEW drift fails later
parityguard check [path] --no-baseline    # ignore the baseline file
parityguard check [path] --config <file>  # explicit config file
parityguard rules                         # list rules
parityguard explain PG002                 # explain one rule
```

**Exit codes:** `0` clean or warnings only, `1` errors found, `2` usage/internal error.

## Rules

| ID | What it catches | Default |
|---|---|---|
| PG001 | `if (Platform.OS === 'ios')` with no else and no early return. The `&&` form (`Platform.OS === 'ios' && …`) is medium confidence and needs `--strict`. | warn |
| PG002 | `Platform.select` missing `ios`/`android` with no `default` or `native` key | error |
| PG003 | `X.ios.tsx` and `X.android.tsx` that export different names | error |
| PG006 | Privacy-sensitive library used (camera, location, ...) with no iOS usage string | error |
| PG007 | Same library used with no Android permission | error |

PG006 and PG007 are data-driven: add libraries in `data/capabilities.json`, no code change needed.
Config plugins (Expo) are matched by name only, so a plugin is assumed to declare what it should.

Run `parityguard explain <ID>` for details.

## Handling intentional differences

Suppress a finding with a comment on the same line or the line above. Always give a reason:

```ts
// parity-ignore PG001: Android uses the system picker
if (Platform.OS === 'ios') { showNativePicker(); }
```

Omit the rule ID to suppress all rules on that line.

## Adopting on an existing app (baseline)

```bash
parityguard check . --update-baseline   # writes parityguard.baseline.json
```

Commit the baseline file. From then on only findings that are not in it are reported. Entries are matched by rule, file and source text, so they survive unrelated line shifts.

## Configuration

Create `parityguard.config.json` (or `.mjs` / `.js`) in the project root:

```json
{
  "rules": { "PG001": "warn", "PG003": "off" },
  "exclude": ["src/legacy/**"]
}
```

- `rules`: set a rule to `error`, `warn`, `info` or `off`.
- `exclude`: globs relative to the project root.

See `examples/parityguard.config.json`.

## GitHub Action

Copy `examples/parityguard-workflow.yml` into your app repo as `.github/workflows/parityguard.yml`. It runs the check, uploads SARIF to GitHub code scanning, and fails the job on errors.

Action inputs: `path`, `strict`, `version`, `sarif-file`, `upload-sarif`, `fail-on-error`.

Before using it: publish the package to npm (the Action runs it through `npx`), replace `mechazod` in the workflow, and confirm the pinned versions of `actions/setup-node` and `github/codeql-action` are current. The Action has not yet been run on GitHub.

## Known limitations

- Dynamic `app.config.ts/js` cannot be evaluated, so permission findings there are low confidence (hidden without `--strict`).
- Apps nested inside a larger repo are not auto-discovered yet. Point the CLI at the app folder.
- Only `Platform.OS` comparisons against `'ios'` and `'android'` are analyzed. `web` is ignored.
- `ios/` and `android/` source folders are not scanned for JS/TS.
- Not yet validated on a large corpus, so the false-positive rate is unknown.

## Measuring false positives (corpus)

1. List repos in `corpus/repos.txt` (`owner/name` or `owner/name:subdir`).
2. `./scripts/corpus.sh` clones them and writes `corpus/results.csv` (needs bash and git; on Windows use WSL or Git Bash).
3. Label each row `TP` or `FP` in the last column.
4. `node scripts/fp-rate.mjs` prints the false-positive rate per rule. Target: under 5% for default-on rules.

## Project layout

```
src/
  cli.ts            command-line entry
  engine.ts         runs rules, applies ignores, baseline, confidence
  project.ts        loads source files and Expo/bare native config
  config.ts         config file loading and validation
  reporters.ts      terminal, JSON, SARIF output
  rules/            one file per rule, plus shared helpers
data/               versioned JSON data (capabilities)
fixtures/           bad-app and good-app used by tests
test/               Vitest tests
scripts/            corpus tooling
```

## Adding a rule

1. Create `src/rules/pgXXX-name.ts` exporting a `Rule` (`id`, `title`, `severity`, `confidence`, `explain`, `check`).
2. Register it in `src/rules/index.ts`.
3. Add a violation to `fixtures/bad-app`, keep `fixtures/good-app` clean, and update `test/engine.test.ts`.
4. Prefer fewer, high-confidence rules. Medium-confidence rules stay hidden unless `--strict`.

## Troubleshooting

- `tsc` or `vitest` not found: run `npm install` first.
- Tests fail on startup: check `node -v` (need 22.12+ for development).
- Nothing found in an Expo project using `app.config.ts`: expected, see limitations.

## License

MIT. Add a `LICENSE` file before publishing.
