// Telemetry log validator checking sequence ordering, gap detection, and monotonic version IDs.

import fs from 'node:fs'
import path from 'node:path'

const targetArg = process.argv[2] || 'data/telemetry'
const resolvedPath = path.resolve(targetArg)

if (!fs.existsSync(resolvedPath)) {
  console.error(`[verify] Target path not found: ${resolvedPath}`)
  process.exit(1)
}

let files = []
const stat = fs.statSync(resolvedPath)
if (stat.isDirectory()) {
  files = fs
    .readdirSync(resolvedPath)
    .filter((f) => f.endsWith('.jsonl'))
    .map((f) => path.join(resolvedPath, f))
} else if (resolvedPath.endsWith('.jsonl')) {
  files = [resolvedPath]
}

if (files.length === 0) {
  console.log('[verify] No .jsonl files found to verify.')
  process.exit(0)
}

let anyFailure = false

console.log(`[verify] Verifying ${files.length} telemetry session log(s)...\n`)

for (const file of files) {
  const sessionId = path.basename(file, '.jsonl')
  const content = fs.readFileSync(file, 'utf8')
  const lines = content.split('\n').filter(Boolean)

  const typeCounts = {}
  const seenSeqs = new Set()
  let maxSeq = 0
  let seqGaps = []
  let seqDuplicates = []
  let lastEditVersionId = -1
  let editVersionDecreased = false

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx]
    let ev
    try {
      ev = JSON.parse(line)
    } catch {
      console.error(`[verify] ${sessionId}: JSON parse error on line ${idx + 1}`)
      anyFailure = true
      continue
    }

    // Tally event type.
    const t = ev.type || 'unknown'
    typeCounts[t] = (typeCounts[t] || 0) + 1

    // Check sequence numbers.
    const seq = ev.seq
    if (typeof seq !== 'number') {
      console.error(`[verify] ${sessionId}: missing or invalid seq on line ${idx + 1}`)
      anyFailure = true
    } else {
      if (seenSeqs.has(seq)) {
        seqDuplicates.push(seq)
      }
      seenSeqs.add(seq)
      if (seq > maxSeq) {
        maxSeq = seq
      }
    }

    // Check monotonic edit version IDs.
    if (ev.type === 'edit' && ev.payload && typeof ev.payload.versionId === 'number') {
      const vId = ev.payload.versionId
      if (lastEditVersionId !== -1 && vId < lastEditVersionId) {
        editVersionDecreased = true
      }
      lastEditVersionId = vId
    }
  }

  // Check that seq starts at 1 and has no gaps up to maxSeq.
  if (lines.length > 0) {
    if (!seenSeqs.has(1)) {
      seqGaps.push(1)
    }
    for (let s = 1; s <= maxSeq; s++) {
      if (!seenSeqs.has(s)) {
        seqGaps.push(s)
      }
    }
  }

  const hasGaps = seqGaps.length > 0
  const hasDupes = seqDuplicates.length > 0
  const isPass = !hasGaps && !hasDupes && !editVersionDecreased && lines.length > 0

  if (!isPass) {
    anyFailure = true
  }

  console.log(`Session: ${sessionId} (total events: ${lines.length})`)
  console.log('Event breakdown:')
  for (const [t, count] of Object.entries(typeCounts)) {
    console.log(`  ${t.padEnd(16)}: ${count}`)
  }

  if (hasGaps) {
    console.log(`  [FAIL] Sequence gaps detected: missing seq(s) ${seqGaps.slice(0, 10).join(', ')}${seqGaps.length > 10 ? '...' : ''}`)
  }
  if (hasDupes) {
    console.log(`  [FAIL] Duplicate sequence numbers: ${seqDuplicates.slice(0, 10).join(', ')}`)
  }
  if (editVersionDecreased) {
    console.log(`  [FAIL] Edit versionId decreased during session.`)
  }

  console.log(`Result: ${isPass ? 'PASS' : 'FAIL'}\n`)
}

if (anyFailure) {
  console.error('[verify] Verification finished with one or more FAILURES.')
  process.exit(1)
} else {
  console.log('[verify] All session files verified: PASS.')
  process.exit(0)
}
