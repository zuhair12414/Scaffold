# Telemetry schema and wire protocol

This document specifies the event envelope, payload schemas, wire transport contracts,
privacy guarantees, and dataset cross-mappings for the Scaffold IDE telemetry pipeline.

---

## 1. Envelope and event types

Every telemetry event contains standard envelope headers for ordering, session scoping,
and attribution, followed by a type-specific payload.

### Envelope fields

| Field | Type | Description |
|---|---|---|
| `sessionId` | `string` | Unique identifier generated once per browser session. |
| `seq` | `number` | Strictly monotonic integer sequence, starting at 1. |
| `t` | `number` | Client timestamp in milliseconds since epoch (`Date.now()`). |
| `studentId` | `string` | Identifier of the student session (e.g. `student-31`). |
| `labId` | `string` | Active lab identifier (e.g. `lab-05`). |
| `questionId` | `string` | Active question identifier within the lab (e.g. `p02`). |
| `type` | `string` | Discriminator naming the event type. |
| `payload` | `object \| undefined` | Event-specific data attributes. |

---

### Event types and JSON examples

Exported categorisation:
- **Behavioural events** (`BEHAVIOURAL_TYPES`): `edit`, `paste`, `cursor`, `focus`, `blur`, `idle_start`, `idle_end`.
- **Operational events** (`OPERATIONAL_TYPES`): `session_start`, `compile`, `run`, `hint_request`, `hint_shown`, `snooze`, `submit`, `opt_out`, `opt_in`.

#### `session_start`
Emitted once when the telemetry subsystem initializes in the client session.
```json
{"sessionId":"sess-9b12f4","seq":1,"t":1773245000000,"studentId":"student-31","labId":"lab-05","questionId":"p02","type":"session_start","payload":{"schemaVersion":"1.0.0"}}
```

#### `edit`
Emitted on code editor content changes. Carries deltas and line numbers only; code text is never transmitted.
```json
{"sessionId":"sess-9b12f4","seq":2,"t":1773245001200,"studentId":"student-31","labId":"lab-05","questionId":"p02","type":"edit","payload":{"versionId":42,"ins":5,"del":0,"startLine":14,"isUndo":false}}
```

#### `paste`
Emitted when a paste event occurs in Monaco. Transmits lengths and hash digests only; pasted text is never transmitted.
```json
{"sessionId":"sess-9b12f4","seq":3,"t":1773245004500,"studentId":"student-31","labId":"lab-05","questionId":"p02","type":"paste","payload":{"versionId":43,"chars":128,"lines":6,"hash":"2fd4e1c67a2d28fced849ee1bb76e7391b93eb12","hashAlg":"sha1","source":"outside"}}
```

#### `cursor`
Emitted during cursor navigation or selection movement, throttled to a maximum frequency of 4 Hz.
```json
{"sessionId":"sess-9b12f4","seq":4,"t":1773245004750,"studentId":"student-31","labId":"lab-05","questionId":"p02","type":"cursor","payload":{"line":18,"col":7}}
```

#### `focus`
Emitted when the Monaco code editor gains input focus. Has no payload.
```json
{"sessionId":"sess-9b12f4","seq":5,"t":1773245006000,"studentId":"student-31","labId":"lab-05","questionId":"p02","type":"focus"}
```

#### `blur`
Emitted when the Monaco code editor loses input focus. Has no payload.
```json
{"sessionId":"sess-9b12f4","seq":6,"t":1773245012300,"studentId":"student-31","labId":"lab-05","questionId":"p02","type":"blur"}
```

#### `idle_start`
Emitted when student input inactivity exceeds the configured inactivity threshold.
```json
{"sessionId":"sess-9b12f4","seq":7,"t":1773245042300,"studentId":"student-31","labId":"lab-05","questionId":"p02","type":"idle_start","payload":{"thresholdMs":30000}}
```

#### `idle_end`
Emitted upon first student input after an idle state, reporting total inactive duration.
```json
{"sessionId":"sess-9b12f4","seq":8,"t":1773245087500,"studentId":"student-31","labId":"lab-05","questionId":"p02","type":"idle_end","payload":{"idleMs":45200}}
```

#### `compile`
Emitted when a compilation job finishes, reporting build status and error classes.
```json
{"sessionId":"sess-9b12f4","seq":9,"t":1773245090100,"studentId":"student-31","labId":"lab-05","questionId":"p02","type":"compile","payload":{"ok":false,"errorCount":1,"warningCount":0,"errorClasses":["no_match_for_call"]}}
```

#### `run`
Emitted when the test execution runner completes evaluation.
```json
{"sessionId":"sess-9b12f4","seq":10,"t":1773245095400,"studentId":"student-31","labId":"lab-05","questionId":"p02","type":"run","payload":{"passed":4,"failed":2}}
```

#### `hint_request`
Emitted when the student asks for assistance or when an escalation is triggered. Conversation questions and chat text are never included.
```json
{"sessionId":"sess-9b12f4","seq":11,"t":1773245100000,"studentId":"student-31","labId":"lab-05","questionId":"p02","type":"hint_request","payload":{"level":2,"trigger":"requested"}}
```

#### `hint_shown`
Emitted when a hint is returned to the student, noting the level, guardrail suppression decision, and round-trip latency. Tutor reply text is never included.
```json
{"sessionId":"sess-9b12f4","seq":12,"t":1773245101450,"studentId":"student-31","labId":"lab-05","questionId":"p02","type":"hint_shown","payload":{"level":2,"blocked":false,"latencyMs":1450}}
```

#### `snooze`
Emitted when the student snoozes proactive nudges. Has no payload.
```json
{"sessionId":"sess-9b12f4","seq":13,"t":1773245120000,"studentId":"student-31","labId":"lab-05","questionId":"p02","type":"snooze"}
```

#### `submit`
Emitted when the student submits an attempt for verification.
```json
{"sessionId":"sess-9b12f4","seq":14,"t":1773245150000,"studentId":"student-31","labId":"lab-05","questionId":"p02","type":"submit","payload":{"testsPassed":6}}
```

#### `opt_out`
Emitted when the student opts out of behavioural event capture. Has no payload.
```json
{"sessionId":"sess-9b12f4","seq":15,"t":1773245160000,"studentId":"student-31","labId":"lab-05","questionId":"p02","type":"opt_out"}
```

#### `opt_in`
Emitted when the student re-enables behavioural event capture. Has no payload.
```json
{"sessionId":"sess-9b12f4","seq":16,"t":1773245180000,"studentId":"student-31","labId":"lab-05","questionId":"p02","type":"opt_in"}
```

---

## 2. Wire protocol

The client and server communicate via a light batching and acknowledgement mechanism.

### Client to server: Batch message
The client transmits buffered events in ordered batches:
```json
{
  "type": "batch",
  "sessionId": "sess-9b12f4",
  "events": [
    {"sessionId":"sess-9b12f4","seq":1,"t":1773245000000,"studentId":"student-31","labId":"lab-05","questionId":"p02","type":"session_start","payload":{"schemaVersion":"1.0.0"}},
    {"sessionId":"sess-9b12f4","seq":2,"t":1773245001200,"studentId":"student-31","labId":"lab-05","questionId":"p02","type":"edit","payload":{"versionId":42,"ins":5,"del":0,"startLine":14,"isUndo":false}}
  ]
}
```

### Server to client: Ack message
The server responds with an acknowledgement recording the continuous prefix stored:
```json
{
  "type": "ack",
  "sessionId": "sess-9b12f4",
  "upToSeq": 2
}
```
* `upToSeq`: The highest sequence number $N$ such that every event from $1$ through $N$ has been persisted durably.

### Invariant & retry rules
1. **At-least-once retention:** The client buffers every generated event locally in memory/storage until the server returns an `ack` where `upToSeq >= event.seq`.
2. **Reconnection replay:** Following any transport failure or reconnect, unacknowledged events are resent in sequence order.
3. **Idempotent server deduplication:** The server ignores or deduplicates any incoming event whose sequence number `seq <= current_stored_seq` for that `sessionId`.

---

## 3. Privacy guarantees: What is never sent

In accordance with ethics guidelines and the project specification:
1. **Student source code:** Full buffer snapshots, line contents, tokens, and raw keystrokes are **never** transmitted. Only character deltas (`ins`, `del`), line indices, and monotonic version numbers are collected.
2. **Pasted content:** Raw pasted clipboard text is **never** transmitted. Only character length, line count, paste origin (`inside_editor` vs `outside`), and an unsalted one-way cryptographic hash digest (`sha1` or deterministic FNV-1a fallback) are transmitted to measure delegation bursts.
   - *Threat Model & Limitation:* Because the client-side hash is unsalted, predictable short C++ boilerplate strings (such as `#include <iostream>` or standard function signatures) can be identified via dictionary/precomputation attacks. The hash is used solely to distinguish internal editor rearrangements (`inside_editor`) from external clipboard imports (`outside`), not as a secure pseudonymization mechanism. The backend pipeline treats this hash as a cluster identifier for identical snippet reuse across lab sessions, not as private entropy.
3. **Chat and prompt text:** Student-entered questions, prompts, and assistant response texts are **never** transmitted in telemetry streams. Only disclosure levels, trigger reasons, and latency metrics are logged.
4. **Student credentials & campus identifiers:** Passwords, student emails, and external network identifiers are excluded.
5. **Opt-out compliance & sequence continuity:** When a student opts out of telemetry:
   - Behavioral editor listeners and idle timers are completely detached/suspended at the sensor layer.
   - Pre-opt-out queued events drain normally to prevent sequence disruption.
   - Any behavioral events presented during opt-out are discarded before sequence allocation (`shouldDrop`), guaranteeing that transmitted sequences remain strictly contiguous and monotonic (`1..N`).
   - Non-behavioural operational milestones (`compile`, `run`, `submit`, `opt_out`, `opt_in`) continue to be transmitted with seamless, gap-free sequence acknowledgement.

---

## 4. ProgSnap2 cross-mapping table

ProgSnap2 is a standardised format for programming process data. The table below maps our internal telemetry events to standardized ProgSnap2 event types. The backend is responsible for performing transformations to the ProgSnap2 schema; the client emits our native schema.

| Scaffold event type | ProgSnap2 event type | Notes |
|---|---|---|
| `session_start` | `Session.Start` | Marks start of user logging session. |
| `edit` | `File.Edit` | ProgSnap2 standard edit event. Transformed by backend into edit records. |
| `paste` | `TODO check against the ProgSnap2 spec` | Often logged as `File.Edit` with paste metadata in extensions. |
| `cursor` | `TODO check against the ProgSnap2 spec` | Non-standard process logging extension. |
| `focus` | `File.Focus` | Window/editor focus event. |
| `blur` | `TODO check against the ProgSnap2 spec` | Blur / defocus event. |
| `idle_start` | `TODO check against the ProgSnap2 spec` | Inactivity interval marker. |
| `idle_end` | `TODO check against the ProgSnap2 spec` | Inactivity interval marker. |
| `compile` | `Compile` | Standard compilation execution event. |
| `run` | `Submit` / `Run` | ProgSnap2 standard execution event (`Run.Program`). |
| `hint_request` | `Help.Request` | Help/scaffolding request event. |
| `hint_shown` | `Help.Show` | Help display event. |
| `snooze` | `TODO check against the ProgSnap2 spec` | Scaffold custom intervention snooze. |
| `submit` | `Submit` | Formal assignment submission event. |
| `opt_out` | `TODO check against the ProgSnap2 spec` | Consent preference transition. |
| `opt_in` | `TODO check against the ProgSnap2 spec` | Consent preference transition. |

---

## 5. For the backend

Requirements for the backend telemetry gateway (Jawad's gateway):

1. **The batch message:**
   - Accepts WebSocket connections at `/` (or configured gateway route).
   - Ingests JSON frames with the envelope:
     ```json
     {
       "type": "batch",
       "sessionId": "string",
       "events": [ /* array of TelemetryEventRecord objects */ ]
     }
     ```
   - Maintains an in-memory or persisted append log per `sessionId` (e.g. `data/telemetry/<sessionId>.jsonl` or database table).

2. **The ack rule:**
   - For every batch received from a client, the server responds over the same socket with:
     ```json
     {
       "type": "ack",
       "sessionId": "string",
       "upToSeq": 42
     }
     ```
   - `upToSeq` must be the highest integer sequence number $N$ such that **every** event from $1$ through $N$ has been durably stored without any missing sequence gaps.
   - The client will retain unacknowledged events and truncate its queue up to `upToSeq`.

3. **Deduplication by `seq`:**
   - Because clients use at-least-once delivery with reconnect replay, batches may contain events already processed in earlier attempts.
   - The gateway must deduplicate idempotently: ignore any incoming event where `seq` is already recorded for that `sessionId`.
   - Never write duplicate sequence numbers or overwrite existing records.

