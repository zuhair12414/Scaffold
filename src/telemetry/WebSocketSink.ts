// Network telemetry sink buffering and transmitting events over WebSocket with at-least-once delivery.
// Implements reconnect backoff, unacked event replay, capacity overflow caps, and student opt-out filtering.

import {
  BEHAVIOURAL_TYPES,
  type TelemetryBatchMessage,
  type TelemetryEventRecord,
} from './events'
import type { TelemetrySink } from './sink'

export type SinkConnectionStatus = 'connected' | 'connecting' | 'buffering'

export interface SinkStatus {
  status: SinkConnectionStatus
  pendingEvents: number
  bufferOverflowCount: number
}

// LocalStorage key for persisting the student opt-out preference.
const OPT_OUT_STORAGE_KEY = 'scaffold_telemetry_opt_out'

// Maximum number of unacknowledged events retained in memory before dropping oldest.
const MAX_BUFFER_CAPACITY = 20000

// Batch dispatch interval in milliseconds.
const FLUSH_INTERVAL_MS = 500

// Batch dispatch size threshold for early flushing.
const BATCH_SIZE_THRESHOLD = 50

export class WebSocketSink implements TelemetrySink {
  private url: string
  private socket: WebSocket | null = null
  private statusState: SinkConnectionStatus = 'buffering'
  private unackedQueue: TelemetryEventRecord[] = []
  private overflowCount = 0
  private flushTimer: ReturnType<typeof setInterval> | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectDelayMs = 1000
  private isOptedOut = false
  private listeners = new Set<(status: SinkStatus) => void>()
  private disposed = false

  constructor(serverUrl?: string) {
    // Read from Vite environment variable or fall back to local test server default.
    this.url = serverUrl || import.meta.env.VITE_TELEMETRY_URL || 'ws://localhost:8787'

    // Load persisted opt-out choice from browser local storage.
    try {
      this.isOptedOut = localStorage.getItem(OPT_OUT_STORAGE_KEY) === 'true'
    } catch {
      // Local storage unavailable (private mode or restricted).
      this.isOptedOut = false
    }

    // Connect to WebSocket endpoint.
    this.connect()

    // Start periodic batch flush timer.
    this.flushTimer = setInterval(() => {
      this.flushBatch()
    }, FLUSH_INTERVAL_MS)

    // Attempt final batch delivery before page unloads.
    if (typeof window !== 'undefined') {
      window.addEventListener('pagehide', this.handlePageHide)
    }
  }

  // Submits a new event record into the transmission pipeline.
  emit(event: TelemetryEventRecord): void {
    // Drop behavioural events immediately if opt-out is enabled.
    if (this.isOptedOut && (BEHAVIOURAL_TYPES as readonly string[]).includes(event.type)) {
      return
    }

    // Check buffer limit to prevent uncontrolled memory exhaustion.
    if (this.unackedQueue.length >= MAX_BUFFER_CAPACITY) {
      // Drop the oldest unacknowledged event to keep fresh telemetry.
      this.unackedQueue.shift()
      this.overflowCount++
    }

    this.unackedQueue.push(event)
    this.notifyStatus()

    // Trigger immediate flush if queue exceeds batch threshold.
    if (this.unackedQueue.length >= BATCH_SIZE_THRESHOLD) {
      this.flushBatch()
    }
  }

  // Returns current connection state and queue metrics.
  status(): SinkStatus {
    return {
      status: this.statusState,
      pendingEvents: this.unackedQueue.length,
      bufferOverflowCount: this.overflowCount,
    }
  }

  // Registers a subscriber callback for telemetry status changes.
  subscribe(fn: (status: SinkStatus) => void): () => void {
    this.listeners.add(fn)
    fn(this.status())
    return () => {
      this.listeners.delete(fn)
    }
  }

  // Updates opt-out status, saves preference, and drops or accepts behavioural events.
  setOptOut(optOut: boolean): void {
    this.isOptedOut = optOut
    try {
      localStorage.setItem(OPT_OUT_STORAGE_KEY, optOut ? 'true' : 'false')
    } catch {
      // Ignore storage access errors.
    }

    if (optOut) {
      // Prune any existing behavioural events waiting in the queue.
      this.unackedQueue = this.unackedQueue.filter(
        (e) => !(BEHAVIOURAL_TYPES as readonly string[]).includes(e.type),
      )
    }
    this.notifyStatus()
  }

  // Reports whether opt-out is currently enabled.
  getOptOut(): boolean {
    return this.isOptedOut
  }

  // Cleans up active socket, timers, and event listeners.
  dispose(): void {
    this.disposed = true
    if (this.flushTimer) clearInterval(this.flushTimer)
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    if (typeof window !== 'undefined') {
      window.removeEventListener('pagehide', this.handlePageHide)
    }
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
  }

  // Initializes WebSocket connection and attaches lifecycle handlers.
  private connect(): void {
    if (this.disposed) return
    this.statusState = 'connecting'
    this.notifyStatus()

    try {
      this.socket = new WebSocket(this.url)
    } catch {
      // Construction failed (e.g. malformed URL or security policy).
      this.scheduleReconnect()
      return
    }

    this.socket.onopen = () => {
      this.statusState = 'connected'
      this.reconnectDelayMs = 1000 // Reset exponential backoff on successful connection.
      this.notifyStatus()

      // Immediately resend all unacknowledged events upon reconnection.
      this.flushBatch()
    }

    this.socket.onmessage = (event) => {
      this.handleServerMessage(event.data)
    }

    this.socket.onerror = () => {
      // Socket error will also trigger onclose, where reconnection is scheduled.
    }

    this.socket.onclose = () => {
      this.socket = null
      this.statusState = 'buffering'
      this.notifyStatus()
      this.scheduleReconnect()
    }
  }

  // Parses server response and trims acknowledged sequence numbers.
  private handleServerMessage(data: unknown): void {
    if (typeof data !== 'string') return
    try {
      const msg = JSON.parse(data)
      if (msg && msg.type === 'ack' && typeof msg.upToSeq === 'number') {
        const upToSeq = msg.upToSeq
        // Remove every event whose seq is less than or equal to upToSeq.
        this.unackedQueue = this.unackedQueue.filter((e) => e.seq > upToSeq)
        this.notifyStatus()
      }
    } catch {
      // Ignore unparseable control packets.
    }
  }

  // Schedules reconnect with exponential backoff capped at 10 seconds.
  private scheduleReconnect(): void {
    if (this.disposed || this.reconnectTimer) return
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      // Double the reconnect delay up to 10 seconds maximum.
      this.reconnectDelayMs = Math.min(this.reconnectDelayMs * 2, 10000)
      this.connect()
    }, this.reconnectDelayMs)
  }

  // Sends queued events in a batch message if the socket is open.
  private flushBatch(): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return
    }

    if (this.unackedQueue.length === 0) {
      return
    }

    const firstEvent = this.unackedQueue[0]
    const batchMessage: TelemetryBatchMessage = {
      type: 'batch',
      sessionId: firstEvent ? firstEvent.sessionId : '',
      // Clone array to send current unacked list.
      events: [...this.unackedQueue],
    }

    try {
      this.socket.send(JSON.stringify(batchMessage))
    } catch {
      // Socket write failure; retained in unackedQueue for next retry.
    }
  }

  // Best-effort flush on page unload using WebSocket or Beacon if available.
  private handlePageHide = () => {
    this.flushBatch()
  }

  // Notifies all subscribed listeners of status updates.
  private notifyStatus(): void {
    const s = this.status()
    for (const listener of this.listeners) {
      try {
        listener(s)
      } catch {
        // Listener error ignored.
      }
    }
  }
}
