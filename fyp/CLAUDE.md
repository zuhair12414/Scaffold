# Scaffold — AI working context

Read this file first in any session about this project. It is the entry point;
the deeper detail lives in `00-meta/`.

## What Scaffold is

An adaptive tutor for programming labs. It reads a student's code, estimates
what that student currently understands, and releases **graded hints** rather
than answers.

## The constraint that shapes everything

A failure here does not only leak data — it can destroy the learning the system
exists to support. A hint that is too strong removes the productive struggle
that causes learning. A misjudged understanding estimate compounds: a student
labelled as competent gets abandoned, a student labelled as lost gets
spoon-fed. Both are worse than no tutor at all.

So the default posture is: **under-help rather than over-help, and never assert
more confidence about a student's understanding than the evidence supports.**

## Working rules for AI assistance on this project

1. **Never generate the lab solution** in any artefact that could reach a
   student, including test fixtures, examples, and docstrings.
2. **Separate claim from evidence.** When writing about pedagogy or learning
   science, state what a cited study actually measured. If a claim is our
   hypothesis, mark it as such. Unsourced pedagogical assertions are the main
   failure mode of a project like this.
3. **Prefer the honest negative result.** If a prototype does not work, that
   goes in `05-evaluation/` and `00-meta/DECISIONS.md`, not quietly deleted.
4. **Prototypes are disposable, decisions are not.** Code in `03-prototypes/`
   is allowed to be throwaway. Anything that changed our thinking gets a line
   in `DECISIONS.md` the same day.
5. **Real student data is sensitive.** See `04-data/README.md` before touching
   anything collected from a human. Default to synthetic data.
6. **Update `00-meta/STATUS.md`** at the end of any substantial session.

## Current phase

Research and prototyping. Full solution development comes later — do not
optimise, harden, or productionise prototype code unless asked.

## Map

| Path | What lives there |
|---|---|
| `00-meta/` | Project definition, architecture, decisions, glossary, status |
| `01-research/` | Papers, reading notes, literature review |
| `02-design/` | Interaction design, hint taxonomy, model design |
| `03-prototypes/` | Experimental code, one folder per experiment |
| `04-data/` | Datasets, schemas, and the rules for handling them |
| `05-evaluation/` | Study designs, metrics, results |
| `06-writing/` | Report, paper drafts, presentation material |
| `99-scratch/` | Anything temporary. Nothing here is authoritative. |
