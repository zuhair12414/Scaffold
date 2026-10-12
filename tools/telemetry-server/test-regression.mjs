// Permanent regression test suite for Scaffold telemetry protocol and verification tooling.
// Uses Node.js built-in test runner ('node --test') and assert module (zero external dependencies).
//
// Tests:
// 1. Opt-out transition: verifies that behavioural events while opted out do not allocate sequence numbers,
//    operational events continue, server contiguous prefix acks advance, and client queue completely drains.
// 2. Empty directory detection: asserts that verify.mjs fails (exit code 1) on empty directory, and passes with --allow-empty.
// 3. Missing session detection: asserts that verify.mjs fails (exit code 1) when a manifest session is absent.
// 4. Missing event detection: asserts that verify.mjs fails (exit code 1) when manifest event count does not match actual.
// 5. Sequence gap detection: asserts that verify.mjs fails (exit code 1) on non-contiguous sequence numbers.
// 6. Duplicate sequence detection: asserts that verify.mjs fails (exit code 1) when duplicate sequence numbers occur.

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { spawn, spawnSync } from 'node:child_process'

const VERIFY_PATH = path.resolve('tools/telemetry-server/verify.mjs')
const SERVER_PATH = path.resolve('tools/telemetry-server/server.mjs')

describe('Telemetry Protocol & Verifier Regression Tests', () => {

  it('1. Opt-out/opt-in transition produces contiguous sequences and drains client queue', async () => {
    const testDir = path.resolve('data/test_reg_optout_' + Date.now())
    fs.mkdirSync(testDir, { recursive: true })

    const port = 8792
    const srv = spawn('node', [SERVER_PATH, '--dir', testDir], {
      env: { ...process.env, PORT: String(port) },
    })

    // Minimal browser environment emulation for production WebSocketSink in Node.js
    if (!globalThis.localStorage) {
      const store = {}
      globalThis.localStorage = {
        getItem: (k) => store[k] ?? null,
        setItem: (k, v) => { store[k] = String(v) },
        removeItem: (k) => { delete store[k] },
        clear: () => {},
      }
    }

    // Load actual production modules via Vite SSR environment (no extra test dependencies)
    const { createServer } = await import('vite')
    const vite = await createServer()
    let WebSocketSink
    let createEmitter

    try {
      const wsSinkModule = await vite.ssrLoadModule('./src/telemetry/WebSocketSink.ts')
      const sinkModule = await vite.ssrLoadModule('./src/telemetry/sink.ts')
      WebSocketSink = wsSinkModule.WebSocketSink
      createEmitter = sinkModule.createEmitter
    } catch (err) {
      await vite.close()
      srv.kill()
      throw err
    }

    const sessionId = 'test-optout-regression'

    try {
      // Exercise actual production WebSocketSink and createEmitter instances
      const sink = new WebSocketSink(`ws://localhost:${port}`)
      const emit = createEmitter({
        sessionId,
        studentId: 'st-reg-optout',
        labId: 'lab-01',
        questionId: 'p01',
      }, sink)

      // Allow initial connection to establish
      await new Promise((r) => setTimeout(r, 600))
      assert.equal(sink.status().status, 'connected', 'Sink must connect to server')

      // Step A: Emit initial operational & behavioural events while sharing
      emit('session_start', {}) // seq 1
      emit('edit', { versionId: 1, ins: 5, del: 0 }) // seq 2
      emit('edit', { versionId: 2, ins: 3, del: 0 }) // seq 3

      await new Promise((r) => setTimeout(r, 600))
      assert.equal(sink.status().pendingEvents, 0, 'Initial events should be acknowledged and drained')

      // Step B: Student opts out via production sink.setOptOut
      sink.setOptOut(true)
      assert.equal(sink.getOptOut(), true, 'Sink opt-out state should be true')
      emit('opt_out', {}) // seq 4

      // Step C: Editor interactions occur while opted out
      // Production createEmitter checks sink.shouldDrop: must NOT allocate seq numbers or enter queue
      emit('edit', { versionId: 3, ins: 10, del: 0 })
      emit('cursor', { line: 10, col: 4 })
      emit('edit', { versionId: 4, ins: 2, del: 0 })

      // Step D: Student compiles code while opted out (operational milestone emitted)
      emit('compile', { ok: true, errorCount: 0, warningCount: 0, errorClasses: [] }) // seq 5

      await new Promise((r) => setTimeout(r, 600))
      assert.equal(sink.status().pendingEvents, 0, 'Compile event should be acknowledged without seq gap')

      // Step E: Student opts back in and submits
      sink.setOptOut(false)
      assert.equal(sink.getOptOut(), false, 'Sink opt-out state should be false')
      emit('opt_in', {}) // seq 6
      emit('edit', { versionId: 5, ins: 1, del: 0 }) // seq 7
      emit('submit', { testsPassed: 5 }) // seq 8

      await new Promise((r) => setTimeout(r, 800))
      assert.equal(sink.status().pendingEvents, 0, 'Client unacked queue must completely drain')

      sink.dispose()
      await vite.close()
      srv.kill()

      // Step F: Verify stored file integrity with real verify.mjs
      const vRes = spawnSync('node', [VERIFY_PATH, testDir], { encoding: 'utf8' })
      assert.equal(vRes.status, 0, `Verifier must pass with 0 gaps. Output: ${vRes.stdout}`)
    } finally {
      srv.kill()
      await vite.close().catch(() => {})
      if (fs.existsSync(testDir)) {
        for (const f of fs.readdirSync(testDir)) fs.unlinkSync(path.join(testDir, f))
        fs.rmdirSync(testDir)
      }
    }
  })

  it('2. Verifier fails on empty directory without --allow-empty, passes with --allow-empty', () => {
    const emptyDir = path.resolve('data/test_reg_empty_' + Date.now())
    fs.mkdirSync(emptyDir, { recursive: true })

    try {
      const failRes = spawnSync('node', [VERIFY_PATH, emptyDir], { encoding: 'utf8' })
      assert.equal(failRes.status, 1, 'Verifier must exit with code 1 on empty directory by default')
      assert.match(failRes.stderr, /FAIL: No \.jsonl files found/, 'Must output clear failure message')

      const passRes = spawnSync('node', [VERIFY_PATH, emptyDir, '--allow-empty'], { encoding: 'utf8' })
      assert.equal(passRes.status, 0, 'Verifier must pass with code 0 when --allow-empty is set')
    } finally {
      if (fs.existsSync(emptyDir)) fs.rmdirSync(emptyDir)
    }
  })

  it('3. Verifier fails when an expected session from manifest is missing', () => {
    const missingDir = path.resolve('data/test_reg_missing_sess_' + Date.now())
    fs.mkdirSync(missingDir, { recursive: true })

    try {
      fs.writeFileSync(
        path.join(missingDir, 'sess-A.jsonl'),
        JSON.stringify({ sessionId: 'sess-A', seq: 1, t: 1000, type: 'session_start' }) + '\n'
      )

      const manifest = {
        sessions: {
          'sess-A': { totalEvents: 1, maxSeq: 1 },
          'sess-B': { totalEvents: 3, maxSeq: 3 }
        }
      }
      const manifestPath = path.join(missingDir, 'manifest.json')
      fs.writeFileSync(manifestPath, JSON.stringify(manifest))

      const res = spawnSync('node', [VERIFY_PATH, missingDir, `--manifest=${manifestPath}`], { encoding: 'utf8' })
      assert.equal(res.status, 1, 'Verifier must fail when expected session is missing')
      assert.match(res.stderr, /Expected session 'sess-B' is completely missing/, 'Must name missing session')
    } finally {
      if (fs.existsSync(missingDir)) {
        for (const f of fs.readdirSync(missingDir)) fs.unlinkSync(path.join(missingDir, f))
        fs.rmdirSync(missingDir)
      }
    }
  })

  it('4. Verifier fails when an event is missing from an expected session', () => {
    const mismatchDir = path.resolve('data/test_reg_mismatch_event_' + Date.now())
    fs.mkdirSync(mismatchDir, { recursive: true })

    try {
      fs.writeFileSync(
        path.join(mismatchDir, 'sess-A.jsonl'),
        JSON.stringify({ sessionId: 'sess-A', seq: 1, t: 1000, type: 'session_start' }) + '\n'
      )

      const manifest = {
        sessions: {
          'sess-A': { totalEvents: 2, maxSeq: 2 }
        }
      }
      const manifestPath = path.join(mismatchDir, 'manifest.json')
      fs.writeFileSync(manifestPath, JSON.stringify(manifest))

      const res = spawnSync('node', [VERIFY_PATH, missingDirFile(mismatchDir, 'sess-A.jsonl'), `--manifest=${manifestPath}`], { encoding: 'utf8' })
      assert.equal(res.status, 1, 'Verifier must fail when stored event count does not match expected')
      assert.match(res.stdout, /Manifest mismatch: expected 2 events, but stored 1/, 'Must output count mismatch')
    } finally {
      if (fs.existsSync(mismatchDir)) {
        for (const f of fs.readdirSync(mismatchDir)) fs.unlinkSync(path.join(mismatchDir, f))
        fs.rmdirSync(mismatchDir)
      }
    }
  })

  it('5. Verifier detects sequence gaps and duplicate sequence numbers', () => {
    const gapDir = path.resolve('data/test_reg_gaps_' + Date.now())
    fs.mkdirSync(gapDir, { recursive: true })

    try {
      // Gap session: seq 1, then seq 3 (missing seq 2)
      fs.writeFileSync(
        path.join(gapDir, 'sess-gap.jsonl'),
        JSON.stringify({ sessionId: 'sess-gap', seq: 1, t: 1000, type: 'session_start' }) + '\n' +
        JSON.stringify({ sessionId: 'sess-gap', seq: 3, t: 1002, type: 'compile', payload: { ok: true } }) + '\n'
      )

      const gapRes = spawnSync('node', [VERIFY_PATH, path.join(gapDir, 'sess-gap.jsonl')], { encoding: 'utf8' })
      assert.equal(gapRes.status, 1, 'Verifier must fail on sequence gap')
      assert.match(gapRes.stdout, /Sequence gaps detected: missing seq\(s\) 2/, 'Must identify missing sequence 2')

      // Dupe session: seq 1, seq 2, seq 2
      fs.writeFileSync(
        path.join(gapDir, 'sess-dupe.jsonl'),
        JSON.stringify({ sessionId: 'sess-dupe', seq: 1, t: 1000, type: 'session_start' }) + '\n' +
        JSON.stringify({ sessionId: 'sess-dupe', seq: 2, t: 1001, type: 'edit', payload: { versionId: 1 } }) + '\n' +
        JSON.stringify({ sessionId: 'sess-dupe', seq: 2, t: 1002, type: 'edit', payload: { versionId: 2 } }) + '\n'
      )

      const dupeRes = spawnSync('node', [VERIFY_PATH, path.join(gapDir, 'sess-dupe.jsonl')], { encoding: 'utf8' })
      assert.equal(dupeRes.status, 1, 'Verifier must fail on duplicate sequence')
      assert.match(dupeRes.stdout, /Duplicate sequence numbers: 2/, 'Must identify duplicate sequence 2')
    } finally {
      if (fs.existsSync(gapDir)) {
        for (const f of fs.readdirSync(gapDir)) fs.unlinkSync(path.join(gapDir, f))
        fs.rmdirSync(gapDir)
      }
    }
  })
})

function missingDirFile(dir, file) {
  return path.join(dir, file)
}
