#!/bin/bash
cd "$(dirname "$0")/.."
set -x
python3 spike/leakage.py --models llama3.2:3b --samples 3 --prompts basic,hardened --contexts rag,rag_solution --out spike/results/rag3b
python3 spike/leakage.py --models llama3.2:3b --samples 3 --prompts hardened --contexts none --profiles strong,novice --attacks B0,A1 --out spike/results/prof3b
python3 spike/leakage.py --models qwen2.5-coder:7b --samples 3 --prompts basic,hardened --contexts none,rag,rag_solution --out spike/results/qwen7b
touch spike/results/ALL_DONE
