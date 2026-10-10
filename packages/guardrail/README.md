# packages/guardrail

Output-side disclosure guardrail. The **only** component in this repo that reads
the reference solution. Scores model output on the 0–5 disclosure ladder and
blocks any response that exceeds the policy-chosen level.

**Invariant:** the reference solution never leaves this package. It must not be
passed to the model, logged, or included in any context window.

**Status:** Prototype logic exists in `apps/web/src/providers/guardrail.ts`.
Production implementation goes here.
