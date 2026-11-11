### Q1 (months 1–3): Foundation & MVP

Finalize the drift taxonomy and write 10–15 high-confidence rules (code-path, prop support, permissions).
CLI + config + baseline + ignore comments.
Test against 15–20 real open-source RN apps to measure false positives.
Public repo, docs site, and a v0.1 alpha.
Exit criteria: false-positive rate under ~10% on the test corpus; runs under 10s on a mid-size app.

### Q2 (months 4–6): CI & developer experience

GitHub Action with PR comments and SARIF.
ESLint plugin and VS Code extension (inline diagnostics, quick fixes).
Expo config and monorepo support.
Rule catalog website with --explain.
v0.5 beta, with a small group of beta teams.
Exit criteria: 10+ external projects using it; 50+ GitHub stars from organic discovery; feedback loop in place.

### Q3 (months 7–9): Depth

Dependency/library parity checks (support matrix, New Architecture compatibility).
Native-bridge spec vs Swift/Kotlin checks.
Release metadata, deep link and OTA fingerprint checks.
Plugin API v1 and a community rule guide.
v1.0 stable with semver guarantees.
Exit criteria: 1.0 released, 3+ community-contributed rules.

### Q4 (months 10–12): Runtime & ecosystem

Optional Maestro-based dual-platform run with screenshot and accessibility-tree diff.
RN upgrade parity report.
Hosted dashboard (optional, free tier) to track drift trends over time. This is the possible sustainability path.
Conference talk or blog series, plus integrations with Expo/EAS and other CI services.
Exit criteria: runtime checks stable on at least 5 reference apps; a sustainability plan (sponsorships, a paid hosted tier, or both).