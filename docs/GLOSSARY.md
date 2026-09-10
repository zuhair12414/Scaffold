# Glossary

Terms are used precisely in this repo. An agent that blurs them will write the
wrong thing. If two of us use a word differently, it belongs here.

| Term | Means | Does **not** mean |
|---|---|---|
| **Disclosure level** | A number 0–5 on the ladder, chosen by the **policy** before the model is called | How verbose the reply is |
| **Ladder** | L0 question only · L1 names the concept · L2 states the fix in prose · L3 code fragments · L4 corrected function · L5 complete program | A difficulty setting |
| **Leakage** | The reply exceeded its assigned level. Measured on output | The model was asked for the answer |
| **Syntactic leakage** | `classify()` — reply contains runnable code (`leaked`) or code fragments (`partial`) | Any code-like text |
| **Semantic leakage** | `semantic()` — prose that states **both** the stopping value and the return value, with no code | A hint that mentions the concept |
| **Mastery** | P(student has mastered a knowledge component), 0–1, with uncertainty | A grade, a score, or a mark |
| **Mastery inflation** | mean(estimated mastery − true mastery) for a group | Model error in general |
| **Delegation** | Student obtained the solution from an external AI and submitted it | Cheating. **We never use that word in code, UI, or logs** |
| **Knowledge component (KC)** | One assessable concept, e.g. *in-order successor* | A lab task or a problem |
| **Struggle** | Productive difficulty — attempts that move | Being stuck; being idle |
| **Thrashing** | Reverts to earlier code states with no new KC touched | Many edits |
| **Guardrail** | Output-side check that blocks a reply exceeding its level | The system prompt |
| **Hardened prompt** | `prompts.json:hardened` — the strongest prompt-only defence we measured | A guardrail |
| **Spike** | A throwaway experiment that answers one risk question | A prototype |
| **POC-lite** | The Week-4 gate artefact. Must run live. Handbook term | A demo of the UI |

## Words that must not appear in user-facing output
`cheat`, `cheating`, `plagiarism`, `caught`, `violation`, `suspicious`, `flagged
for misconduct`. The system surfaces evidence to a human; it never accuses.
Internal variable names follow the same rule — a screenshot of the code can end
up on a slide.
