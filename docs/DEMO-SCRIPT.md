# Demo script — the eight minutes that matter

Run it on rails. Every screen below is reachable in one click from the previous
one, and every number on screen comes from the seeded mock dataset.

**Before the room:** `npm run dev`, open `/instructor/overview?demo=1`, turn on
**Projector mode** in Settings, and check the room's resolution, not the laptop's.
`?demo=1` drops any lab, manual or policy edit left over from a rehearsal.

**Say this once, at the start:** *"Everything on the dashboard is seeded demo
data — the badge in the header says so. The measured numbers are in the terminal
demo, and they are the ones we stand behind."*

---

## 1 · Overview — the claim, in one screen (60s)

`/instructor/overview`

- Stat row: 47 students, **6 with correct submissions and low verified mastery**.
- Point at the heatmap: one row per student, one column per concept. Sort by
  **successor** — the weakest column moves to the top.
- Point at the attention panel: *"Correct submissions, low verified mastery."*
  Student #31 has the widest gap.

> The line: *"Every one of these six is passing. That is exactly why they are here."*

## 2 · Student #31 — the thesis becomes a picture (90s)

Click the top row of the attention panel.

- **Mastery over time**: two lines. Accent is *estimated from correctness*, amber
  is *adjusted for how the work was done*. They track together until Lab 4, then
  the gap opens and stays open.
- **Concept bars**: weakest first, each with a hatched uncertainty band. Say:
  *"When the band is wide, the policy discloses less, not more."*
- **Session timeline**: Lab 5 has a paste marker at minute 11 and a compile at 15.
  Say: *"This is an observation, not an accusation. The system never accuses."*
- **Submissions**: open Lab 5 — six of six tests pass, ten minutes on task.

> The line: *"Correctness says mastered. The way the work was done says not yet.
> Every student model in the literature reads only the first one."*

## 3 · Hint Audit — the guardrail is real (60s)

Left nav → **Hint Audit** → tick **Withheld only** → expand one row.

- Level released, measured similarity against the reference solution, the lab
  threshold, and the text that was withheld.
- Say: *"The model never sees the reference solution. Only the comparator does."*

## 4 · Labs & Manuals — the instructor is in control (90s)

Left nav → **Labs & Manuals**, select **Lab 5**.

- **This lab** panel: attempts, how many passed, median time on task, how much
  assistance was withheld, and the fastest pass — Student #31 again.
- Click **View** on the attached manual. It opens and reads like a handout; drag a
  PDF onto the drop zone and view that one too.
- Drag **Max hint level** down to 2 and **Similarity threshold** down to 0.45.
- Click **Use in student view**.
- Optional, if asked whether the instructor is really in control: set **Status** to
  draft and note that the lab disappears from the student's list, then set it back.

## 5 · Student IDE — the same policy, from the student's side (2 min)

Header → **Demo: view as → Student**.

- The student has **their own lab list** in the top left — but the lab you just
  pushed is the one open, and it stays open.
- Left pane: the statement, the attached manual (click it — same viewer the
  instructor used), *Hints capped at Level 2*, the concept bars with their
  uncertainty bands, this student's **past attempts**, and the recording notice —
  open it and read one line of what is collected.
- Click **Run**. The diagnostic is this lab's own — *no node is ever unlinked or
  freed* — and the Tests tab lists this lab's tests.
- Click **Hint**. The hint is about deleting from a BST, not about some other lab.
  The **ladder** shows Level 1 as next with its unlock condition, and Levels 3 and 4
  marked as capped by you in step 4.
- Click **Run**, then **Need more help**. Levels release one at a time; with the
  cap lifted, the ladder eventually shows the level the guardrail **withheld** with
  its measured similarity.
- Click **Submit**.

### The round trip — do not skip this

Switch back to **Instructor → Submissions**. The attempt you just submitted is the
top row, marked *this session*. Open **Hint Audit**: the request you just made is
there too, with the level, the measured similarity and the decision.

> The line: *"That is the loop. The student's work produced the evidence, the
> policy chose the level, the guardrail measured the answer, and the instructor is
> reading all three."*

> The line: *"The policy chose the level. The model only wrote the sentence."*

## 6 · Baseline assistant — what students use today (60s)

In the tutor header, switch to **Baseline assistant**.

- No ladder, no levels, no student model, no output filter.
- If Ollama is running locally, ask it the lab question and let it answer.
- Then: *"That is the control condition. `spike/` measures how often it hands over
  a runnable solution — 13 of 18 under a plain prompt, 2 of 18 hardened. Never
  zero. That is why the level is a policy decision and the guardrail reads output."*

## 7 · Close on the evidence (30s)

Terminal: `bash spike/demo.sh --fast`. The dashboard is the product; the spike is
the evidence. Say which is which.

---

## If something goes wrong

- A screen looks edited → Settings → **Reset demo**, or reload `?demo=1`.
- The baseline assistant errors → Ollama is not running; switch back to
  **Scaffold tutor**, which needs no model at all.
- Type is too small in the room → Settings → **Projector mode**.
