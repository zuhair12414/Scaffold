// Telemetry load simulator for Scaffold ingestion server.
// Simulates concurrent students generating edit bursts, cursor ticks, pastes,
// runs, compiles, idles, and hints over WebSocket with unacked event retry and ack latency tracking.

import fs from 'node:fs'
import path from 'node:path'
import WebSocket from 'ws'

// Command line argument parser supporting --clients, --minutes, --url, and --dir.
function parseArgs() {
  const args = process.argv.slice(2)
  let clients = 60
  let minutes = 2
  let url = 'ws://localhost:8787'
  let dataDir = path.resolve('data/telemetry')

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--clients' && args[i + 1]) {
      clients = Number(args[++i])
    } else if (arg.startsWith('--clients=')) {
      clients = Number(arg.split('=')[1])
    } else if (arg === '--minutes' && args[i + 1]) {
      minutes = Number(args[++i])
    } else if (arg.startsWith('--minutes=')) {
      minutes = Number(arg.split('=')[1])
    } else if (arg === '--url' && args[i + 1]) {
      url = args[++i]
    } else if (arg.startsWith('--url=')) {
      url = arg.split('=')[1]
    } else if (arg === '--dir' && args[i + 1]) {
      dataDir = path.resolve(args[++i])
    } else if (arg.startsWith('--dir=')) {
      dataDir = path.resolve(arg.split('=')[1])
    }
  }

  return { clients, minutes, url, dataDir }
}

const { clients: CLIENT_COUNT, minutes: DURATION_MINUTES, url: SERVER_URL, dataDir: DATA_DIR } = parseArgs()
const DURATION_MS = DURATION_MINUTES * 60 * 1000
const FLUSH_INTERVAL_MS = 500

// Aggregated metrics across all simulated clients.
let totalEventsGenerated = 0
let totalDeliveryAttempts = 0
let totalEventsAcked = 0
const ackLatencies = []

// Fast deterministic string hash for paste payloads.
function simpleHash(str) {
  let hash = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

// Simulates an individual student's IDE telemetry session.
class SimulatedClient {
  constructor(index, serverUrl) {
    this.index = index
    this.serverUrl = serverUrl
    this.sessionId = `sim-${Date.now().toString(36)}-c${index.toString().padStart(3, '0')}`
    this.studentId = `student-${(index % 47) + 1}`
    this.labId = 'lab-05'
    this.questionId = 'p02'

    this.seq = 1
    this.versionId = 1
    this.line = 10
    this.col = 1

    this.socket = null
    this.unackedQueue = []
    this.disposed = false
    this.reconnectTimer = null
    this.flushTimer = null
    this.actionTimer = null
    this.cursorTimer = null

    // Track batch in-flight dispatch timestamps to compute round-trip ack latency:
    // batchUpToSeq -> sendTimestamp
    this.pendingBatches = []

    this.isIdle = false
    this.idleUntil = 0
    this.generatedEventsCount = 0
  }

  start() {
    this.connect()

    // Start periodic batch flush timer (every 500ms, matching real WebSocketSink).
    this.flushTimer = setInterval(() => {
      this.flushBatch()
    }, FLUSH_INTERVAL_MS)

    // Emit initial session_start event.
    this.emit('session_start', { schemaVersion: '1.0.0' })

    // Start cursor movement ticks (~4 Hz / every 250ms).
    this.cursorTimer = setInterval(() => {
      if (!this.disposed && !this.isIdle) {
        this.emitCursor()
      }
    }, 250)

    // Start scheduling student activities.
    this.scheduleNextAction()
  }

  emit(type, payload) {
    const event = {
      sessionId: this.sessionId,
      seq: this.seq++,
      t: Date.now(),
      studentId: this.studentId,
      labId: this.labId,
      questionId: this.questionId,
      type,
      payload,
    }
    this.unackedQueue.push(event)
    this.generatedEventsCount++
    totalEventsGenerated++
  }

  emitCursor() {
    this.col = (this.col % 40) + 1
    this.emit('cursor', { line: this.line, col: this.col })
  }

  scheduleNextAction() {
    if (this.disposed) return

    const now = Date.now()
    if (this.isIdle) {
      if (now < this.idleUntil) {
        this.actionTimer = setTimeout(() => this.scheduleNextAction(), 500)
        return
      }
      // Idle period ended.
      this.isIdle = false
      this.emit('idle_end', { idleMs: 5000 })
    }

    // Pick a believable student action.
    const roll = Math.random()
    let delayMs = 150 + Math.random() * 250 // Edit burst typing interval: 100 to 400ms

    if (roll < 0.82) {
      // Regular edit: keystrokes, newlines, deletions
      this.versionId++
      const ins = Math.random() < 0.85 ? Math.floor(1 + Math.random() * 5) : 0
      const del = ins === 0 ? Math.floor(1 + Math.random() * 3) : 0
      if (Math.random() < 0.1) this.line++
      this.emit('edit', {
        versionId: this.versionId,
        ins,
        del,
        startLine: this.line,
        isUndo: false,
      })
    } else if (roll < 0.87) {
      // Paste event: code block copied and inserted
      this.versionId++
      const chars = Math.floor(20 + Math.random() * 120)
      const lines = Math.floor(2 + Math.random() * 6)
      this.line += lines
      this.emit('paste', {
        versionId: this.versionId,
        chars,
        lines,
        hash: simpleHash(`snippet-${this.versionId}`),
        hashAlg: 'fallback',
        source: Math.random() < 0.4 ? 'inside_editor' : 'outside',
      })
      delayMs = 600
    } else if (roll < 0.92) {
      // Compile & run execution
      const ok = Math.random() < 0.7
      const errorCount = ok ? 0 : Math.floor(1 + Math.random() * 3)
      const warningCount = ok && Math.random() < 0.3 ? 1 : 0
      this.emit('compile', {
        ok,
        errorCount,
        warningCount,
        errorClasses: ok ? [] : ['missing_semicolon'],
      })
      const passed = ok ? Math.floor(3 + Math.random() * 4) : 0
      const failed = ok ? 6 - passed : 0
      this.emit('run', { passed, failed })
      delayMs = 1200
    } else if (roll < 0.96) {
      // Hint request & hint shown
      const level = Math.floor(1 + Math.random() * 3)
      this.emit('hint_request', { level, trigger: 'requested' })
      this.emit('hint_shown', { level, blocked: false, latencyMs: Math.floor(800 + Math.random() * 1200) })
      delayMs = 1500
    } else {
      // Idle pause gap (student reading problem or thinking)
      this.isIdle = true
      this.idleUntil = now + 4000 + Math.random() * 3000
      this.emit('idle_start', { thresholdMs: 30000 })
      delayMs = 500
    }

    this.actionTimer = setTimeout(() => this.scheduleNextAction(), delayMs)
  }

  connect() {
    if (this.disposed) return
    try {
      this.socket = new WebSocket(this.serverUrl)
    } catch {
      this.scheduleReconnect()
      return
    }

    this.socket.on('open', () => {
      // Send queued unacknowledged events immediately upon reconnection.
      this.flushBatch()
    })

    this.socket.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString())
        if (msg && msg.type === 'ack' && typeof msg.upToSeq === 'number') {
          const now = Date.now()
          const upToSeq = msg.upToSeq

          // Measure round-trip ack latency for all batches acknowledged up to upToSeq.
          while (this.pendingBatches.length > 0 && this.pendingBatches[0].maxSeq <= upToSeq) {
            const batchInfo = this.pendingBatches.shift()
            const latency = now - batchInfo.sendTime
            if (latency >= 0) {
              ackLatencies.push(latency)
            }
          }

          // Count how many events in the queue were acknowledged.
          const prevLen = this.unackedQueue.length
          this.unackedQueue = this.unackedQueue.filter((e) => e.seq > upToSeq)
          const ackedCount = prevLen - this.unackedQueue.length
          totalEventsAcked += ackedCount
        }
      } catch {}
    })

    this.socket.on('error', () => {
      // Will transition to close.
    })

    this.socket.on('close', () => {
      this.socket = null
      this.scheduleReconnect()
    })
  }

  scheduleReconnect() {
    if (this.disposed || this.reconnectTimer) return
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, 1000)
  }

  flushBatch() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN || this.unackedQueue.length === 0) {
      return
    }

    const eventsToSend = [...this.unackedQueue]
    const maxSeq = eventsToSend[eventsToSend.length - 1].seq

    const batch = {
      type: 'batch',
      sessionId: this.sessionId,
      events: eventsToSend,
    }

    this.pendingBatches.push({
      maxSeq,
      sendTime: Date.now(),
    })

    totalDeliveryAttempts += eventsToSend.length

    try {
      this.socket.send(JSON.stringify(batch))
    } catch {}
  }

  // Halts future actions and ticks while keeping socket open to drain acknowledgements.
  stopActivity() {
    if (this.actionTimer) clearTimeout(this.actionTimer)
    if (this.cursorTimer) clearInterval(this.cursorTimer)
    this.actionTimer = null
    this.cursorTimer = null
  }

  stop() {
    this.disposed = true
    this.stopActivity()
    if (this.flushTimer) clearInterval(this.flushTimer)
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)

    if (this.socket) {
      try {
        this.socket.close()
      } catch {}
      this.socket = null
    }
  }
}

// Runs verification checks on all generated session files against expected sessions and event counts.
function verifySessionFiles(expectedManifest) {
  let anyFailure = false
  const sessionIds = Object.keys(expectedManifest.sessions)
  console.log(`\n[verify] Running sequence and manifest integrity checks on ${sessionIds.length} simulated session file(s)...`)

  for (const sessionId of sessionIds) {
    const expected = expectedManifest.sessions[sessionId]
    const file = path.join(DATA_DIR, `${sessionId}.jsonl`)
    if (!fs.existsSync(file)) {
      console.error(`  [FAIL] ${sessionId}: session file missing from storage (${file})`)
      anyFailure = true
      continue
    }

    const content = fs.readFileSync(file, 'utf8')
    const lines = content.split('\n').filter(Boolean)
    if (lines.length === 0) {
      console.error(`  [FAIL] ${sessionId}: file is empty`)
      anyFailure = true
      continue
    }

    if (lines.length !== expected.totalEvents) {
      console.error(`  [FAIL] ${sessionId}: count mismatch! expected=${expected.totalEvents}, stored=${lines.length}`)
      anyFailure = true
    }

    const seenSeqs = new Set()
    let maxSeq = 0
    let seqGaps = []
    let seqDuplicates = []
    let lastEditVersionId = -1
    let editVersionDecreased = false

    for (let idx = 0; idx < lines.length; idx++) {
      let ev
      try {
        ev = JSON.parse(lines[idx])
      } catch {
        anyFailure = true
        continue
      }

      const seq = ev.seq
      if (typeof seq !== 'number') {
        anyFailure = true
      } else {
        if (seenSeqs.has(seq)) seqDuplicates.push(seq)
        seenSeqs.add(seq)
        if (seq > maxSeq) maxSeq = seq
      }

      if (ev.type === 'edit' && ev.payload && typeof ev.payload.versionId === 'number') {
        const vId = ev.payload.versionId
        if (lastEditVersionId !== -1 && vId < lastEditVersionId) {
          editVersionDecreased = true
        }
        lastEditVersionId = vId
      }
    }

    if (!seenSeqs.has(1)) seqGaps.push(1)
    for (let s = 1; s <= maxSeq; s++) {
      if (!seenSeqs.has(s)) seqGaps.push(s)
    }

    if (maxSeq !== expected.maxSeq) {
      console.error(`  [FAIL] ${sessionId}: maxSeq mismatch! expected=${expected.maxSeq}, stored=${maxSeq}`)
      anyFailure = true
    }

    const isPass = seqGaps.length === 0 && seqDuplicates.length === 0 && !editVersionDecreased && lines.length === expected.totalEvents
    if (!isPass) {
      anyFailure = true
      console.error(`  [FAIL] ${sessionId}: gaps=${seqGaps.length}, dupes=${seqDuplicates.length}, versionDecreased=${editVersionDecreased}`)
    }
  }

  return !anyFailure
}

async function main() {
  console.log('====================================================')
  console.log('       Scaffold Telemetry Load Simulator            ')
  console.log('====================================================')
  console.log(`Target URL : ${SERVER_URL}`)
  console.log(`Target Dir : ${DATA_DIR}`)
  console.log(`Clients    : ${CLIENT_COUNT}`)
  console.log(`Duration   : ${DURATION_MINUTES} minute(s) (${DURATION_MS / 1000}s)`)
  console.log('Starting simulated clients...')

  const clients = []
  for (let i = 0; i < CLIENT_COUNT; i++) {
    const client = new SimulatedClient(i + 1, SERVER_URL)
    clients.push(client)
    client.start()
  }

  // Periodic heartbeat log every 10 seconds.
  const startTime = Date.now()
  const progressInterval = setInterval(() => {
    const elapsedSec = Math.floor((Date.now() - startTime) / 1000)
    const remainingSec = Math.max(0, Math.floor(DURATION_MS / 1000 - elapsedSec))
    console.log(
      `[sim] elapsed: ${elapsedSec}s / remaining: ${remainingSec}s | gen: ${totalEventsGenerated} | attempts: ${totalDeliveryAttempts} | acked: ${totalEventsAcked}`,
    )
  }, 10000)

  // Wait for the full simulation duration.
  await new Promise((resolve) => setTimeout(resolve, DURATION_MS))
  clearInterval(progressInterval)

  console.log('\nSimulation duration elapsed. Stopping activity and draining client queues with explicit ack waiting...')

  // Halt new event creation across all clients
  for (const client of clients) {
    client.stopActivity()
  }

  // Await queue drain across all clients subject to a 15-second timeout
  const DRAIN_TIMEOUT_MS = 15000
  const drainStart = Date.now()
  let allDrained = false

  while (Date.now() - drainStart < DRAIN_TIMEOUT_MS) {
    // Trigger immediate batch flush on clients with remaining unacked events
    for (const client of clients) {
      if (client.unackedQueue.length > 0) {
        client.flushBatch()
      }
    }

    const pendingSum = clients.reduce((sum, c) => sum + c.unackedQueue.length, 0)
    if (pendingSum === 0) {
      allDrained = true
      break
    }
    await new Promise((resolve) => setTimeout(resolve, 200))
  }

  const outstandingEvents = clients.reduce((sum, c) => sum + c.unackedQueue.length, 0)

  // Stop all simulated clients and close sockets
  for (const client of clients) {
    client.stop()
  }

  // Build the expected manifest mapping each session to exact generated event count and max sequence.
  const expectedManifest = {
    generatedAt: new Date().toISOString(),
    totalClients: CLIENT_COUNT,
    totalEventsGenerated,
    sessions: {},
  }

  for (const client of clients) {
    expectedManifest.sessions[client.sessionId] = {
      totalEvents: client.generatedEventsCount,
      maxSeq: client.seq - 1,
    }
  }

  // Save manifest file in target data directory
  const manifestPath = path.join(DATA_DIR, 'sim-expected-manifest.json')
  fs.writeFileSync(manifestPath, JSON.stringify(expectedManifest, null, 2), 'utf8')

  // Compute percentile and max latency metrics.
  ackLatencies.sort((a, b) => a - b)
  const p50 = ackLatencies.length ? ackLatencies[Math.floor(ackLatencies.length * 0.5)] : 0
  const p95 = ackLatencies.length ? ackLatencies[Math.floor(ackLatencies.length * 0.95)] : 0
  const maxLatency = ackLatencies.length ? ackLatencies[ackLatencies.length - 1] : 0

  console.log('\n====================================================')
  console.log('                Simulation Results                  ')
  console.log('====================================================')
  console.log(`clients                 : ${CLIENT_COUNT}`)
  console.log(`total events generated  : ${totalEventsGenerated}`)
  console.log(`total delivery attempts : ${totalDeliveryAttempts}`)
  console.log(`total events acked      : ${totalEventsAcked}`)
  console.log(`outstanding queue count : ${outstandingEvents}`)
  console.log(`p50 ack latency (ms)    : ${p50}`)
  console.log(`p95 ack latency (ms)    : ${p95}`)
  console.log(`max ack latency (ms)    : ${maxLatency}`)
  console.log('====================================================')

  if (!allDrained) {
    console.error(`\n[sim] FAIL: Queue drain timed out with ${outstandingEvents} unacknowledged event(s) remaining!`)
    process.exit(1)
  }

  // Verify all generated session log files against expected manifest
  const allPassed = verifySessionFiles(expectedManifest)

  if (allPassed) {
    console.log('\nResult: PASS')
    process.exit(0)
  } else {
    console.error('\nResult: FAIL')
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('[sim] Fatal error:', err)
  process.exit(1)
})
