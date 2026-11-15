# Architecture: three questions, three components

Every hint answers three separate questions. Each has its own component, and none of them is the LLM.

| Question | Component | Example (off-by-one in `sumArray`) |
|---|---|---|
| Does the student need help right now? | Telemetry + rule-based struggle detector (`src/telemetry/`) | 4 failed runs in 6 minutes, same line edited repeatedly |
| What exactly is wrong in the code? | Code analysis: compiler, tests, diff against the nearest correct solution | Out-of-bounds test fails; nearest for-loop solution differs only at `<=` |
| How much help should they get? | Student model (`src/student/`, trained in `kt/`) | Strong on loops in past labs: a nudge. Weak: a fuller explanation |

```
telemetry ──► needs help? ──yes──┐
                                 ▼
code analysis ──► what's wrong ──► HINT ◄── how much help ◄── student model
                                    ▲
                     LLM writes the wording only
```

## Comparing against solutions without limiting creativity

1. Tests decide correctness. Any approach that passes is accepted.
2. Compare against a pool of correct solutions (reference, AI-generated variants, past passing
   submissions), pick the nearest, and diff against that one. A for-loop student is compared with a
   for-loop solution.
3. If nothing in the pool is close, the approach is new: do not steer; fall back to tests and
   compiler output. If it passes, it joins the pool.
4. Constructs a lab genuinely requires are explicit instructor rules, not hidden preferences in a
   reference solution.

## AI-generated solutions and the course profile

Each lab has a profile: allowed headers, required style (`using namespace std;`), constructs taught
so far. Generated solutions must compile, pass the tests, pass the profile check (a tree-sitter
walk), and not duplicate an existing solution. Violations go back to the model for a rewrite.

## The LLM's context

The student model replaces chat history. The prompt carries a fixed-size state
(`src/student/context.ts`), the detected issue, and the hint level chosen by policy. It never
carries the full solution, so it cannot leak it.
