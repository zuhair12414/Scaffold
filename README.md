# Scaffold IDE (PoC)

Student-facing editor for the Scaffold FYP. React, TypeScript, Vite, Monaco. No backend, no model: hints,
diagnostics and test results are mocked behind interfaces so the real services can be swapped in later.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## PoC-lite view (default)

By default the shell is deliberately bare: editor, problem text, raw compiler output, and the assistant chat with a
prompt selector. Mastery bars, test results, compiler explanations, the struggle nudge, and the retrieval and
profile selectors are hidden. Set `VITE_UI=full` in `.env.local` to show them. The default assistant prompt is
"Plain assistant", a generic coding helper with no tutoring rules, which is what students use today.

## System prompt editor

Under the Ask box, "Show system prompt" opens the prompt the assistant runs with. Three presets load with one
click (plain, tutoring, hardened); any edit makes it a custom prompt. It applies to the next message; the problem
statement and the current code are appended automatically. The reply card records which variant was used.

## Baseline mode (default)

The tutor panel is wired to a local open model through Ollama, prompted the way CodeHelp-style assistants are:
"help, but never give the solution". Nothing is filtered. A leakage check labels each reply No code, Code
fragments, or Leaked solution. This is the control condition, System A. It exists to show the gaps: no student
model, no disclosure levels, no struggle detection, and prompt-only guardrails that fail under pressure.

```bash
ollama pull qwen2.5-coder:7b
npm run dev
```

The panel is a real chat: replies stream in as the model writes, the conversation is remembered within a
session, greetings get a greeting, and the problem plus current code ride along as context so questions about
the code are answered in context. The circular-arrow button starts a fresh conversation. The harness in
`spike/` sends the bare system prompts without the chat wrapper, so its numbers are the strict comparison.

Set `VITE_OLLAMA_MODEL` in a `.env.local` to try another model. If the configured model is not pulled the app
falls back to the first model Ollama has and says so on the card. Set `VITE_TUTOR_MODE=scaffold` to see the
mocked Scaffold ladder instead.

## Live demo and evidence

See `~/Documents/Scaffold/Scaffold_Live_Demo_Runbook.md`. `spike/demo.sh` runs a one-minute live leakage check;
`spike/leakage.py` is the full harness, `spike/aggregate.py` and `spike/chart.py` build `spike/results/leakage.png`,
`spike/disclosure.py` builds `spike/results/why_kt.png`.

## Demo script

1. Press Run. The starter code has no base case, so GCC's infinite-recursion warning appears with a plain-English explanation and all tests fail.
2. Press Run again. The status bar item at bottom right changes to "You may be stuck. Hint?". Nothing pops up.
3. Click it. The tutor panel opens with a Level 0 hint. Level 5 shows a lock; it is instructor-only.
4. Edit the code or run again, wait for the cooldown, then press Need more help. Level 1 highlights the recursive line in the editor.
5. Add `if (n <= 1) return 1;` and Run. Tests go green and the highlight clears.

## Keyboard

Cmd+Enter run, Cmd+I toggle tutor, Cmd+Shift+I ask for a hint, Cmd+. escalate, Esc close tutor,
Cmd+B toggle problem pane, Cmd+J toggle output, Cmd+Shift+S snooze nudges. Ctrl on Windows and Linux.

## Where things live

- `src/providers/HintProvider.ts` is the seam. `MockHintProvider` reads from `src/data/problems.ts`.
- `src/mock/compiler.ts` stands in for the sandboxed GCC run.
- `src/monaco-setup.ts` holds the Cursor-inspired theme. No teal or mint in the syntax set; that colour is reserved for the tutor.
- `src/styles.css` holds the design tokens at the top.
- `src/types.ts` is the data contract the real services must satisfy.

## Not in this PoC

Instructor dashboard, student profile, architecture view, light theme, multi-file problems, real compilation, real model calls.
