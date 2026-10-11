# problems

Lab problem definitions. Each problem folder contains:
- `statement.md` — the task shown to the student
- `solution/` — the reference solution (read only by `packages/guardrail`)
- `tests/` — test cases and expected output for the runner

**Security:** the `solution/` sub-directories must never be served to the
frontend or included in model context. Access is restricted to `packages/guardrail`.
