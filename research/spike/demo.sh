#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."

MODEL="llama3.2:3b"
FAST=0
OLLAMA_API="${OLLAMA_API:-http://localhost:11434}"

usage() {
  cat <<'EOF'
Usage: bash spike/demo.sh [--fast] [--model MODEL]

Runs the Scaffold Week-4 leakage demo against local Ollama.
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --fast)
      FAST=1
      shift
      ;;
    --model)
      MODEL="${2:-}"
      if [ -z "$MODEL" ]; then
        echo "Missing value for --model" >&2
        exit 2
      fi
      shift 2
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      MODEL="$1"
      shift
      ;;
  esac
done

echo "Known limitation: regex scoring is English-only and tuned to the recursive fact(n) C++ problem; it is spike evidence, not a validated benchmark."
echo

python3 - "$MODEL" "$OLLAMA_API" <<'PY'
import json
import sys
import urllib.request

model, base_url = sys.argv[1], sys.argv[2].rstrip("/")
try:
    with urllib.request.urlopen(f"{base_url}/api/tags", timeout=2) as r:
        data = json.loads(r.read())
except Exception:
    print(f"Cannot reach Ollama at {base_url}. Start it with: ollama serve", file=sys.stderr)
    sys.exit(1)

names = {m.get("name") for m in data.get("models", [])}
if model not in names:
    print(f"Ollama model {model} is not available. Run: ollama pull {model}", file=sys.stderr)
    sys.exit(1)
PY

STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="spike/results/demo-$STAMP"
mkdir "$OUT"

if [ "$FAST" -eq 1 ]; then
  SAMPLES=1
  ATTACKS="A1,A4,A5"
else
  SAMPLES=3
  ATTACKS=""
fi

LOG="$OUT/run.log"
CMD=(python3 spike/leakage.py --models "$MODEL" --samples "$SAMPLES" --prompts basic,hardened --contexts none --out "$OUT")
if [ -n "$ATTACKS" ]; then
  CMD+=(--attacks "$ATTACKS")
fi

"${CMD[@]}" >"$LOG" 2>&1

CSV="$(find "$OUT" -maxdepth 1 -name 'leakage-*.csv' | sort | tail -n 1)"
MD="$(find "$OUT" -maxdepth 1 -name 'leakage-*.md' | sort | tail -n 1)"
cp "$CSV" "$OUT/leakage.csv"
cp "$MD" "$OUT/leakage.md"

python3 - "$MODEL" "$SAMPLES" "$OUT/leakage.csv" "$LOG" <<'PY'
import collections
import csv
import pathlib
import sys

model, samples, csv_path, log_path = sys.argv[1], int(sys.argv[2]), pathlib.Path(sys.argv[3]), sys.argv[4]
rows = list(csv.DictReader(csv_path.open()))
errors = [r for r in rows if r["verdict"] == "error"]
if errors:
    print(f"Demo run had {len(errors)} model errors. See {log_path}", file=sys.stderr)
    sys.exit(1)

attacks = sorted({r["attack"] for r in rows})
prompts = ["basic", "hardened"]
counts = {p: collections.Counter() for p in prompts}
totals = collections.Counter()
for r in rows:
    p = r["prompt"]
    counts[p][r["verdict"]] += 1
    if r["semantic"] == "1":
        counts[p]["semantic"] += 1
    totals[p] += 1

print("Scaffold POC - leakage under adversarial pressure")
print(f"model {model} - {len(attacks)} attacks - {samples} samples - prompts: basic, hardened")
print()
print("  prompt      leaked   partial   clean   semantic")
for p in prompts:
    n = totals[p]
    print(
        f"  {p:<10}"
        f"{counts[p]['leaked']:>3}/{n:<5}"
        f"{counts[p]['partial']:>3}/{n:<6}"
        f"{counts[p]['clean']:>3}/{n:<5}"
        f"{counts[p]['semantic']:>3}/{n:<5}"
    )
print()

print("full evidence: recorded full run was 13/18 baseline and 2/18 hardened; not zero.")
print(f"full CSV: {csv_path}")
PY
