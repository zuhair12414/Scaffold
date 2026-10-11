# 02 · Telemetry pipeline — capture, order, store

Owner: **Jawad.** Hard requirement: **p95 < 200 ms** capture for 60 concurrent
students, **zero event loss** over a 1-hour replay.

---

## 2.1 Monaco: the events that matter

Monaco is the editor engine behind VS Code, running in the browser — so no
student installs anything. The APIs you actually need:

```js
const model = editor.getModel();

// 1. Every content change. e.changes[] = {range, rangeOffset, rangeLength, text}
model.onDidChangeModelContent(e => {
  send({t:'edit', v: e.versionId, changes: e.changes.map(c => ({
    off: c.rangeOffset, del: c.rangeLength, ins: c.text.length
  }))});
});

// 2. PASTE — the single most valuable event we capture. Monaco exposes it
//    directly; do not try to infer paste from change size alone.
editor.onDidPaste(e => {
  const text = model.getValueInRange(e.range);
  send({t:'paste', lines: e.range.endLineNumber - e.range.startLineNumber + 1,
        chars: text.length, sha: sha1(text)});   // hash, never raw text, by default
});

// 3. Focus loss — proxy for tab-switching to an external assistant
editor.onDidBlurEditorText(() => send({t:'blur'}));
editor.onDidFocusEditorText(() => send({t:'focus'}));

// 4. Cursor + selection, sampled not streamed (throttle to 4 Hz)
editor.onDidChangeCursorPosition(throttle(e => send({t:'cur', l:e.position.lineNumber}), 250));

// 5. Inline completion acceptance, if you ever enable suggestions
editor.onDidChangeModelContent  // + check e.isFlush / source
```

**Gotchas**
- `onDidChangeModelContent` fires for *programmatic* edits too. Guard with a
  flag around any `model.applyEdits` you make yourself, or you will log your own
  hint insertions as student typing.
- `versionId` is monotonic per model — use it as the client-side sequence
  number. Do not invent your own.
- Throttle cursor events. Un-throttled they are 60% of your traffic and carry
  almost no signal.
- Run Monaco's workers from a same-origin path or `getWorkerUrl` blob shim,
  otherwise the editor silently degrades to no-syntax mode.

---

## 2.2 ProgSnap2 — use the standard, do not invent a schema

ProgSnap2 (Price et al., ITiCSE 2020) is the CS-education standard for
programming process data. Using it means CSEDM/CodeWorkout loads without a
converter, and your dataset is releasable.

**MainTable** — one row per event. Required columns:
`EventID, Order, SubjectID, ToolInstances, CodeStateID, EventType`

Standard `EventType` values you will emit:
`Session.Start, Session.End, File.Edit, Compile, Compile.Error, Run.Program,
Submit, Resource.View`

**Extend, don't replace.** Custom columns are prefixed `X-`:

```
X-Paste.Chars      X-Paste.Lines     X-Paste.SHA1
X-Blur.DurationMs  X-Idle.Ms         X-Revert.ToCodeStateID
X-Keystroke.Count  X-Keystroke.IKIEntropy
X-KC.Ids           X-Hint.Level      X-Hint.Blocked
```

`CodeStates/` is a directory of code snapshots keyed by `CodeStateID`; store a
snapshot on compile/submit and on every Nth edit, not on every keystroke.

---

## 2.3 Ordering, and the race you must not lose

Events from one student arrive over one WebSocket, but your handler is async and
your KC scorer, mastery updater and dashboard publisher all touch the same
student state. **The mastery update must be single-writer per student.**

```python
# FastAPI + per-student ordered queue, one consumer task each
queues: dict[str, asyncio.Queue] = {}

@app.websocket("/ws/{sid}")
async def ws(sock: WebSocket, sid: str):
    await sock.accept()
    q = queues.setdefault(sid, asyncio.Queue(maxsize=2000))
    consumer = asyncio.create_task(drain(sid, q))
    try:
        while True:
            ev = await sock.receive_json()
            ev["server_ts"] = time.time_ns()
            try:
                q.put_nowait(ev)          # never await here: backpressure must
            except asyncio.QueueFull:      # be visible, not silently absorbed
                metrics.drop(sid); log.warning("queue full %s", sid)
    except WebSocketDisconnect:
        consumer.cancel()

async def drain(sid, q):
    buf, expect = {}, 0
    while True:
        ev = await q.get()
        buf[ev["v"]] = ev                  # v = Monaco versionId
        while expect in buf:               # emit in versionId order
            await handle(sid, buf.pop(expect)); expect += 1
```

- **Reorder window.** Hold out-of-order events for at most ~2 s / 50 events.
  Beyond that, drop **and log** — a silently applied stale event corrupts
  mastery, which is worse than a gap.
- **Never `await` inside the receive loop** other than `receive_json`. One slow
  DB write in that loop and your p95 is gone.
- Measure p95 as `server_ts − client_ts` with a clock-skew estimate from the
  handshake. Report both the raw and skew-corrected number.

---

## 2.4 Storage

| Layer | Choice | Why |
|---|---|---|
| Hot buffer | **Redis Streams** (`XADD` / `XREADGROUP`) | durable ring buffer, consumer groups, survives an app restart mid-lab |
| Event store | **Postgres + TimescaleDB** hypertable on `ts` | time-bucketed queries for the dashboard; plain Postgres is fine at 47 students |
| Code snapshots | filesystem `CodeStates/<sha1>` | content-addressed, dedupes hard — students re-submit near-identical code |
| Live dashboard | Redis pub/sub → SSE to the instructor page | do not poll Postgres every 5 s |

**Volume estimate.** 60 students × ~4 events/s × 3 h ≈ 2.6 M events per lab
session; at ~120 B/event that is ~310 MB before snapshots. Trivial for Postgres,
non-trivial for anything you keep in memory.

---

## 2.5 Struggle detection — start with the published metrics

Do **not** invent heuristics first. Implement these, then improve:

- **Error Quotient** (Jadud, 2006). Score consecutive *pairs* of compile events:
  +8 both errored, +3 same error type, +3 same error location, +2 same edit
  line; normalise to [0,1]. Well-validated predictor of course outcome.
- **Watwin score** (Watson et al., 2013). Like EQ but weights by time taken
  relative to the class distribution — fixes EQ's blindness to *fast* failure.
- **Repeated Error Density** — distinct errors vs. total errors in a window.
- **Thrashing** (ours) — reverts to a previous `CodeStateID` ≥ 3 in a window
  with no new KC touched.

Then hand-label ~200 two-minute segments as *productive / stuck / delegated* and
fit a small classifier. Precision ≥ 0.75 on "unproductive" is your acceptance
criterion, and **those labels are a scheduled deliverable, not a side task.**
