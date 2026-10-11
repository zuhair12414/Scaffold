# Prototypes

One folder per experiment: `NN-short-name/`. Each gets a `README.md` stating
the question it answers before any code is written.

```
03-prototypes/
  01-ast-diff-signal/
    README.md      <- the question, the method, the result
    ...code...
```

## Rules
- **State the question first.** "Can an AST diff distinguish a student who is
  converging from one who is thrashing?" — not "try AST diffs".
- **Prototypes may be ugly.** Do not refactor, harden, or generalise them.
- **Record the result even when it is negative**, in the prototype README and,
  if it changed the plan, in `00-meta/DECISIONS.md`.
- **Never commit a lab solution** into this tree.
- When a prototype becomes load-bearing, that is a decision — log it, and it
  graduates out of `03-prototypes/`.
