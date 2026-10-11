# Data

## Default: synthetic

Until a study is approved and running, work from synthetic or public data.
A synthetic trajectory generator is not a compromise here — it is the only way
to test the hint policy across student behaviours you would never see in one
semester's real cohort.

## If real student data is ever used

- Ethics approval before collection, not after.
- Informed consent, with an option to participate in the lab without
  contributing data.
- Pseudonymise at ingest. No names, student IDs, or emails in this folder —
  ever, including in filenames and commit messages.
- Never let a student's data influence any assessment of record.
- Raw data does not leave this folder or get pasted into external services.

## Layout
- `raw/` — never edited, never shared
- `processed/` — derived, reproducible from raw by a script
- `synthetic/` — generated
- `SCHEMA.md` — what a trajectory record contains

## Trajectory record — starting shape
A trajectory is one student, one task: an ordered list of submissions, each
with timestamp, code, test outcome, the system's understanding estimate at that
moment, the action taken (silence or hint level N), and — if available — a
later unaided post-test result.
