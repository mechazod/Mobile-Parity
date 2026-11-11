#!/usr/bin/env bash
# Clone each repo in corpus/repos.txt, run ParityGuard, and emit corpus/results.csv for hand-labeling.
# Fill the `label` column with TP (real drift) or FP (false alarm), then run: node scripts/fp-rate.mjs
set -uo pipefail
cd "$(dirname "$0")/.."
mkdir -p corpus/work corpus/out
OUT=corpus/results.csv
echo "repo,rule,severity,confidence,file,line,message,label" > "$OUT"
grep -vE '^\s*(#|$)' corpus/repos.txt | while read -r entry; do
  repo="${entry%%:*}"; sub=""; [[ "$entry" == *:* ]] && sub="${entry#*:}"
  dir="corpus/work/${repo//\//__}"
  [ -d "$dir" ] || git clone --depth 1 -q "https://github.com/$repo.git" "$dir" || { echo "skip $repo (clone failed)"; continue; }
  node dist/cli.js check "$dir/$sub" --no-baseline --strict --format json > "corpus/out/${repo//\//__}.json" || true
  node -e '
    const [repo, f] = process.argv.slice(1); const r = JSON.parse(require("fs").readFileSync(f, "utf8"));
    const q = (s) => `"${String(s).replace(/"/g, "\"\"")}"`;
    for (const x of r.findings) console.log([repo, x.ruleId, x.severity, x.confidence, x.file, x.line, q(x.message), ""].join(","));
  ' "$repo" "corpus/out/${repo//\//__}.json" >> "$OUT"
  echo "done $repo"
done
echo "Wrote $OUT — label each row TP/FP"
