#!/bin/bash
# One-minute live run for a panel: two attacks, two prompts, one sample each, verdicts print as they land.
# Usage: spike/demo.sh [model]   default qwen2.5-coder:7b
cd "$(dirname "$0")/.."
MODEL="${1:-qwen2.5-coder:7b}"
echo "Live leakage check on $MODEL: direct request and compiler role-play, basic prompt then hardened prompt."
python3 spike/leakage.py --models "$MODEL" --samples 1 --prompts basic,hardened --attacks A1,A5 --out spike/results/live 2>&1 | grep -E "^\[|^\| A|^Adversarial"
