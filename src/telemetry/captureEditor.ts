// Captures editor interaction telemetry: edits, pastes, cursor motion, focus, and idle periods.
// Excludes student code content, hashes paste payloads, and skips programmatic buffer changes.

import type { OnMount } from '@monaco-editor/react'
import type { monaco as MonacoNamespace } from '../monaco-setup'
import type { PayloadMap, TelemetryEventType } from './events'

type MonacoEditor = Parameters<OnMount>[0]
type Monaco = typeof MonacoNamespace

export type TelemetryEmitFn = <K extends TelemetryEventType>(
  type: K,
  payload: PayloadMap[K],
) => void

// Idle inactivity duration in milliseconds before emitting idle_start.
export const IDLE_MS = 30000

// Maximum number of clipboard hashes retained to identify internal copy/cut actions.
const CLIPBOARD_CACHE_LIMIT = 10

// Fast fallback hash (FNV-1a 32-bit hex) when Web Crypto is unavailable.
function fallbackHash(str: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

// Computes SHA-1 hash via crypto.subtle or falls back if context is not secure.
async function hashText(text: string): Promise<{ hash: string; hashAlg: 'sha1' | 'fallback' }> {
  // Web Crypto is only available in secure contexts (HTTPS or localhost).
  if (typeof crypto !== 'undefined' && crypto.subtle && typeof TextEncoder !== 'undefined') {
    try {
      const buffer = new TextEncoder().encode(text)
      const digest = await crypto.subtle.digest('SHA-1', buffer)
      const hex = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
      return { hash: hex, hashAlg: 'sha1' }
    } catch {
      // Fallback if crypto.subtle.digest fails.
      return { hash: fallbackHash(text), hashAlg: 'fallback' }
    }
  }
  return { hash: fallbackHash(text), hashAlg: 'fallback' }
}

export function attachEditorCapture(
  editor: MonacoEditor,
  _monaco: Monaco,
  emit: TelemetryEmitFn,
  isProgramEdit: () => boolean,
  idleThresholdMs: number = IDLE_MS,
): { dispose: () => void } {
  const disposables: { dispose: () => void }[] = []

  // Ring buffer holding hashes of recent copy and cut actions inside this editor.
  const recentCopyHashes: string[] = []

  // Tracks paste ranges so the ensuing onDidChangeModelContent event is not logged as typing.
  let pendingPasteRanges: {
    startLineNumber: number
    startColumn: number
    endLineNumber: number
    endColumn: number
  }[] = []

  // 1. Paste source detection via DOM copy/cut listeners on the editor container.
  const domNode = editor.getDomNode()
  const handleCopyOrCut = () => {
    // Read selected text from editor model to hash it before clipboard transfer.
    const selection = editor.getSelection()
    const model = editor.getModel()
    if (!selection || !model) return
    const selectedText = model.getValueInRange(selection)
    if (!selectedText) return

    hashText(selectedText).then(({ hash }) => {
      recentCopyHashes.push(hash)
      if (recentCopyHashes.length > CLIPBOARD_CACHE_LIMIT) {
        recentCopyHashes.shift()
      }
    })
  }

  if (domNode) {
    domNode.addEventListener('copy', handleCopyOrCut)
    domNode.addEventListener('cut', handleCopyOrCut)
    disposables.push({
      dispose: () => {
        domNode.removeEventListener('copy', handleCopyOrCut)
        domNode.removeEventListener('cut', handleCopyOrCut)
      },
    })
  }

  // 2. Paste capture via Monaco editor.onDidPaste.
  const pasteDisposable = editor.onDidPaste((e) => {
    resetIdleTimer()

    const model = editor.getModel()
    if (!model) return

    // Record range to filter out subsequent edit event for the same insertion.
    pendingPasteRanges.push({
      startLineNumber: e.range.startLineNumber,
      startColumn: e.range.startColumn,
      endLineNumber: e.range.endLineNumber,
      endColumn: e.range.endColumn,
    })

    const pastedText = model.getValueInRange(e.range)
    const chars = pastedText.length
    const lines = e.range.endLineNumber - e.range.startLineNumber + 1
    const versionId = model.getVersionId()

    hashText(pastedText).then(({ hash, hashAlg }) => {
      const source = recentCopyHashes.includes(hash) ? 'inside_editor' : 'outside'
      emit('paste', {
        versionId,
        chars,
        lines,
        hash,
        hashAlg,
        source,
      })
    })
  })
  disposables.push(pasteDisposable)

  // 3. Edit capture via editor.onDidChangeModelContent.
  const contentDisposable = editor.onDidChangeModelContent((e) => {
    resetIdleTimer()

    // Skip entire buffer flushes or changes initiated programmatically (demo fill, question switch).
    if (e.isFlush || isProgramEdit()) {
      return
    }

    const model = editor.getModel()
    const versionId = model ? model.getVersionId() : 0

    // Check if this edit corresponds to a pending paste insertion.
    for (const change of e.changes) {
      const isPasteChange = pendingPasteRanges.some((r) =>
        r.startLineNumber === change.range.startLineNumber &&
        r.startColumn === change.range.startColumn,
      )

      if (isPasteChange) {
        // Clear matching paste range and skip logging as typing.
        pendingPasteRanges = pendingPasteRanges.filter(
          (r) =>
            !(r.startLineNumber === change.range.startLineNumber &&
              r.startColumn === change.range.startColumn),
        )
        continue
      }

      emit('edit', {
        versionId,
        ins: change.text.length,
        del: change.rangeLength,
        startLine: change.range.startLineNumber,
        isUndo: Boolean(e.isUndoing),
      })
    }
  })
  disposables.push(contentDisposable)

  // 4. Cursor position throttle (~4 Hz / at most once every 250ms).
  let lastCursorEmit = 0
  let pendingCursorTimeout: ReturnType<typeof setTimeout> | null = null
  let latestCursorPos: { line: number; col: number } | null = null

  const flushCursor = () => {
    if (!latestCursorPos) return
    lastCursorEmit = Date.now()
    emit('cursor', latestCursorPos)
    latestCursorPos = null
    pendingCursorTimeout = null
  }

  const cursorDisposable = editor.onDidChangeCursorPosition((e) => {
    resetIdleTimer()

    const now = Date.now()
    latestCursorPos = { line: e.position.lineNumber, col: e.position.column }

    if (now - lastCursorEmit >= 250) {
      if (pendingCursorTimeout) {
        clearTimeout(pendingCursorTimeout)
        pendingCursorTimeout = null
      }
      flushCursor()
    } else if (!pendingCursorTimeout) {
      const wait = 250 - (now - lastCursorEmit)
      pendingCursorTimeout = setTimeout(flushCursor, wait)
    }
  })
  disposables.push({
    dispose: () => {
      cursorDisposable.dispose()
      if (pendingCursorTimeout) clearTimeout(pendingCursorTimeout)
    },
  })

  // 5. Focus and blur tracking across window and tab visibility changes.
  let isFocused = editor.hasTextFocus()

  const handleFocus = () => {
    resetIdleTimer()
    if (!isFocused) {
      isFocused = true
      emit('focus', undefined)
    }
  }

  const handleBlur = () => {
    if (isFocused) {
      isFocused = false
      emit('blur', undefined)
    }
  }

  const handleVisibilityChange = () => {
    if (document.hidden) {
      handleBlur()
    } else {
      handleFocus()
    }
  }

  window.addEventListener('focus', handleFocus)
  window.addEventListener('blur', handleBlur)
  document.addEventListener('visibilitychange', handleVisibilityChange)

  disposables.push({
    dispose: () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    },
  })

  // 6. Idle detection: timer fires after IDLE_MS of inactivity.
  let isIdle = false
  let idleStartTime = 0
  let idleTimer: ReturnType<typeof setTimeout> | null = null

  function resetIdleTimer() {
    const now = Date.now()
    if (isIdle) {
      // Inactivity period ended on student input.
      const idleMs = now - idleStartTime
      isIdle = false
      emit('idle_end', { idleMs })
    }

    if (idleTimer) clearTimeout(idleTimer)
    idleTimer = setTimeout(() => {
      isIdle = true
      idleStartTime = Date.now()
      emit('idle_start', { thresholdMs: idleThresholdMs })
    }, idleThresholdMs)
  }

  // Activity listeners across editor DOM for mouse and key actions to reset idle timer.
  const handleUserActivity = () => {
    resetIdleTimer()
  }

  if (domNode) {
    domNode.addEventListener('keydown', handleUserActivity, { passive: true })
    domNode.addEventListener('mousedown', handleUserActivity, { passive: true })
    domNode.addEventListener('mousemove', handleUserActivity, { passive: true })
    disposables.push({
      dispose: () => {
        domNode.removeEventListener('keydown', handleUserActivity)
        domNode.removeEventListener('mousedown', handleUserActivity)
        domNode.removeEventListener('mousemove', handleUserActivity)
      },
    })
  }

  // Start idle timer immediately upon mount.
  resetIdleTimer()
  disposables.push({
    dispose: () => {
      if (idleTimer) clearTimeout(idleTimer)
    },
  })

  return {
    dispose: () => {
      for (const d of disposables) {
        d.dispose()
      }
    },
  }
}
