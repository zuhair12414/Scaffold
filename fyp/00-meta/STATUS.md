# Status

Update at the end of any substantial working session. Keep it short; history
lives in git or in the decision log, not here.

## Now
Research question settled: the team's existing RQ from the defense sidecar is
adopted. Three analyses on file — `00-gap-analysis.md` (literature),
`01-gap-analysis.md` (handbook gates + prior-FYP comparison),
`02-rq-assessment.md` (assessment of the team RQ, and the operative one).

The one thing that must change before defense: the knowledge tracing engine
currently updates mastery from submission correctness, so a vibe-coding student
gets a rising mastery estimate and therefore *less* scaffolding. Reframe the
telemetry-enriched DKT claim around preserving validity under AI-mediated
submissions.

## Next 3 things
1. Build the contamination simulation as the Week-4 spike: inject synthetic
   AI-mediated submissions into CSEDM, measure mastery inflation for BKT vs
   DKT vs telemetry-enriched DKT. No ethics dependency.
2. Fix the C++ Data Structures KC taxonomy with the course instructor, and pick
   a KC attribution method. Everything downstream is blocked on it.
3. Decide how uncompilable submissions are handled (~25% of incorrect
   submissions in CodeWorkout). Drop, syntactically repair, or partial-AST.

## Also pending
- Correct CSEDM = Java (not Python) in the sidecar risk register.
- Verify the "first pedagogical alignment applied to code" claim; soften to
  "to our knowledge".
- Populate the C.10 prior-FYP table from `01-gap-analysis.md` §3 and prepare
  the answer to "how is this different from Codio (Fall 2025)?" — Codio is a
  fully implemented Python video-to-code platform (Gemini VLM pause-to-code,
  Judge0, adaptive quiz difficulty). It maximises disclosure; we calibrate it.
- Re-map the M1–M12 timeline onto the handbook's Week 4 / 8 / 13 / 15 gates.

## Assets now in the repo
- `06-writing/slides/` — Beamer deck (custom theme) + preview PDF + DEFENSE-SCRIPT.md
- `06-writing/figures/` — four POC interface renders (3200px, mock-data badged)
- `02-design/tech/` — six technical reference docs, one per subsystem

## Key technical decision surfaced in 02-design/tech/01
BKT's `P(G)` (guess) is a per-KC constant, so it cannot express a
per-opportunity delegation event — this is the *structural* reason standard KT
inflates. Proposed fix A: make the emission context-conditioned,
`P(G | f_t) = sigmoid(b0 + b.f_t)`. Fix B: append telemetry to the DKT input
vector. Build both; the gap between them is a result.

## Blocked on
- Nothing hard-blocked.

## Last updated
2026-09-09
