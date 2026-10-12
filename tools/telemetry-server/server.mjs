// Local test ingestion server for Scaffold telemetry validation.
// Stores incoming event batches to data/telemetry/<sessionId>.jsonl and acknowledges contiguous sequences.

import fs from 'node:fs'
import path from 'node:path'
import { WebSocketServer } from 'ws'

const PORT = Number(process.env.PORT) || 8787
let DATA_DIR = path.resolve(process.env.TELEMETRY_DIR || 'data/telemetry')
for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i] === '--dir' && process.argv[i + 1]) {
    DATA_DIR = path.resolve(process.argv[++i])
  } else if (process.argv[i].startsWith('--dir=')) {
    DATA_DIR = path.resolve(process.argv[i].split('=')[1])
  }
}
const isChaos = process.argv.includes('--chaos')

// Ensure destination directory exists.
fs.mkdirSync(DATA_DIR, { recursive: true })

// Per-session tracking of stored sequences.
// Maps sessionId -> Set of stored sequence numbers.
const storedSeqs = new Map()
// Maps sessionId -> highest contiguous sequence acknowledged.
const highestContiguousSeq = new Map()

// Total event count stored across all sessions.
let totalEventsStored = 0

// Load existing session files to restore sequence state if server is restarted.
for (const file of fs.readdirSync(DATA_DIR)) {
  if (file.endsWith('.jsonl')) {
    const sessionId = file.replace(/\.jsonl$/, '')
    const filePath = path.join(DATA_DIR, file)
    const content = fs.readFileSync(filePath, 'utf8')
    const lines = content.split('\n').filter(Boolean)
    const seqSet = new Set()
    for (const line of lines) {
      try {
        const ev = JSON.parse(line)
        if (typeof ev.seq === 'number') {
          seqSet.add(ev.seq)
        }
      } catch {
        // Skip malformed line.
      }
    }
    storedSeqs.set(sessionId, seqSet)
    let c = 1
    while (seqSet.has(c)) {
      c++
    }
    highestContiguousSeq.set(sessionId, c - 1)
    totalEventsStored += lines.length
  }
}

const wss = new WebSocketServer({ port: PORT })

console.log(`[telemetry-server] Listening on ws://localhost:${PORT}`)
console.log(`[telemetry-server] Storage path: ${DATA_DIR}`)
if (isChaos) {
  console.log('[telemetry-server] Chaos mode enabled: closing connections every ~20s')
}

// Computes the highest contiguous sequence number starting from 1.
function computeHighestContiguous(sessionId) {
  const seqSet = storedSeqs.get(sessionId) || new Set()
  let current = highestContiguousSeq.get(sessionId) || 0
  let check = current + 1
  while (seqSet.has(check)) {
    check++
  }
  const nextContiguous = check - 1
  highestContiguousSeq.set(sessionId, nextContiguous)
  return nextContiguous
}

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString())
      if (data.type === 'batch' && Array.isArray(data.events)) {
        const sessionId = data.sessionId || (data.events[0] && data.events[0].sessionId)
        if (!sessionId) return

        let sessionSeqSet = storedSeqs.get(sessionId)
        if (!sessionSeqSet) {
          sessionSeqSet = new Set()
          storedSeqs.set(sessionId, sessionSeqSet)
        }

        const filePath = path.join(DATA_DIR, `${sessionId}.jsonl`)
        let linesToAppend = ''

        for (const ev of data.events) {
          if (typeof ev.seq === 'number') {
            if (!sessionSeqSet.has(ev.seq)) {
              sessionSeqSet.add(ev.seq)
              linesToAppend += JSON.stringify(ev) + '\n'
              totalEventsStored++
            }
          }
        }

        if (linesToAppend.length > 0) {
          fs.appendFileSync(filePath, linesToAppend, 'utf8')
        }

        const upToSeq = computeHighestContiguous(sessionId)
        const ackMessage = {
          type: 'ack',
          sessionId,
          upToSeq,
        }

        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify(ackMessage))
        }
      }
    } catch (err) {
      console.error('[telemetry-server] Error processing batch:', err)
    }
  })
})

// Chaos simulation: forcibly close connections every ~20 seconds.
if (isChaos) {
  setInterval(() => {
    wss.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.close(1000, 'Chaos disconnect test')
      }
    })
  }, 20000)
}

// Diagnostic summary log printed every 5 seconds.
setInterval(() => {
  const sessionCount = storedSeqs.size
  let acksSummary = []
  for (const [sess, ack] of highestContiguousSeq.entries()) {
    acksSummary.push(`${sess}:${ack}`)
  }
  const summaryStr = acksSummary.slice(-3).join(', ')
  console.log(
    `[telemetry-server] status: sessions=${sessionCount} total_events=${totalEventsStored} recent_acks=[${summaryStr}]`,
  )
}, 5000)
