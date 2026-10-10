# Scaffold — technical reference

Six documents. Read `01` first regardless of your role: it contains the one
insight the whole project turns on, and it is the thing you will be questioned
on hardest.

| File | Owner | What it settles |
|---|---|---|
| `01-knowledge-tracing.md` | **Zuhair** | BKT maths, why delegation breaks it, DKT encoding, the telemetry-enriched variant |
| `02-telemetry-pipeline.md` | **Jawad** | Monaco event APIs, ProgSnap2 schema, ordering, WebSocket/FastAPI, storage |
| `03-llm-serving.md` | **Jawad** | vLLM, quantisation, VRAM arithmetic, concurrency, prompt assembly |
| `04-guardrail-ast.md` | **Rauf** | tree-sitter on non-compiling C++, normalisation, similarity, thresholds |
| `05-evaluation.md` | **Rauf** | CV protocol, calibration, the injection experiment, power |
| `06-dpo-secondary.md` | **Zuhair** | LoRA + DPO on one 24 GB card (disposable track) |

## Build order (dependency-correct)

```
KC taxonomy  ─────────────────────────────┐   (blocks everything; Month 1)
                                          v
Monaco + WebSocket capture ──> ProgSnap2 store ──> feature extraction
                                          |
              CSEDM/CodeWorkout ──> pyBKT baseline ──> DKT ──> Telemetry-DKT
                                          |
                              injection experiment  (Week 4 POC)
                                          |
                      disclosure policy ──> vLLM hint engine ──> guardrail
                                          |
                                  instructor dashboard
```

**Do not** start the hint engine before the injection experiment. If the
experiment comes out flat, the disclosure policy has nothing to condition on
and the architecture changes.

## Versions to pin now

```
python 3.11            pyBKT 1.4.x           torch 2.4+cu121
tree-sitter 0.21.x     tree-sitter-cpp       apted (java) / apted-py
vllm 0.6.x             transformers 4.44+    trl 0.11.x        peft 0.13.x
fastapi 0.115  uvicorn[standard]  redis 5.x  monaco-editor 0.52
```
Pin them in `requirements.txt` on day one. Half the reproducibility problems in
this stack are version drift in `transformers`/`vllm`.
