// Telemetry sink interfaces and event envelope factory.
// Enforces monotonically increasing sequence numbers and uniform metadata.

import type {
  PayloadMap,
  TelemetryEventRecord,
  TelemetryEventType,
} from './events'

// Destination interface for consuming telemetry events.
export interface TelemetrySink {
  emit(event: TelemetryEventRecord): void
}

// Development sink that outputs formatted telemetry events to the browser console.
export class ConsoleSink implements TelemetrySink {
  emit(event: TelemetryEventRecord): void {
    // Log directly to console for testing and verification without network transport.
    console.log('[telemetry]', event)
  }
}

// Context provider supplying dynamic runtime metadata for envelope headers.
export interface TelemetryContext {
  sessionId: string
  studentId: string
  labId: string
  questionId: string
}

// Creates an emit helper that enriches events with sequence numbers and context headers.
export function createEmitter(
  getContext: () => TelemetryContext,
  sink: TelemetrySink = new ConsoleSink(),
) {
  // Sequence counter begins at 1 and increases monotonically.
  let currentSeq = 1

  return function emit<K extends TelemetryEventType>(
    type: K,
    payload: PayloadMap[K],
  ): void {
    const ctx = getContext()
    const event = {
      sessionId: ctx.sessionId,
      seq: currentSeq++,
      t: Date.now(),
      studentId: ctx.studentId,
      labId: ctx.labId,
      questionId: ctx.questionId,
      type,
      payload,
    } as TelemetryEventRecord

    sink.emit(event)
  }
}
