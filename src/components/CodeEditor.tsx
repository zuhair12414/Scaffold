import { useEffect, useRef } from 'react'
import Editor, { type OnMount } from '@monaco-editor/react'
import { editorFont, editorTheme, monaco } from '../monaco-setup'
import { attachEditorCapture, type TelemetryEmitFn } from '../telemetry/captureEditor'

type Ed = Parameters<OnMount>[0]
export type EditorActions = {
  run: () => void; toggleTutor: () => void; requestHint: () => void; escalate: () => void
  toggleProblem: () => void; toggleOutput: () => void; snooze: () => void
}
type Props = {
  value: string
  onChange: (v: string) => void
  onCursor: (ln: number, col: number) => void
  highlight: { lines: number[]; message: string } | null
  actions: React.MutableRefObject<EditorActions>
  lite?: boolean
  // One Monaco model per question: switching questions switches the buffer and
  // its undo history instead of writing the old text into the new question.
  path?: string
  // Optional telemetry emitter for capturing student editor interactions.
  telemetry?: TelemetryEmitFn
  // Flag indicating if behavioral capture is opted out.
  optedOut?: boolean
}

export function CodeEditor({ value, onChange, onCursor, highlight, actions, lite = false, path = 'main.cpp', telemetry, optedOut = false }: Props) {
  const edRef = useRef<Ed | null>(null)
  const decos = useRef<ReturnType<Ed['createDecorationsCollection']> | null>(null)
  const captureCleanup = useRef<(() => void) | null>(null)
  // Track value received from user onChange versus value injected from props.
  const lastUserValue = useRef<string>(value)
  const parentValue = useRef<string>(value)

  useEffect(() => {
    parentValue.current = value
  }, [value])

  const onMount: OnMount = (ed) => {
    edRef.current = ed
    decos.current = ed.createDecorationsCollection([])
    ed.onDidChangeCursorPosition((e) => onCursor(e.position.lineNumber, e.position.column))
    const K = monaco.KeyMod, C = monaco.KeyCode
    ed.addCommand(K.CtrlCmd | C.Enter, () => actions.current.run())
    ed.addCommand(K.CtrlCmd | C.KeyI, () => actions.current.toggleTutor())
    ed.addCommand(K.CtrlCmd | K.Shift | C.KeyI, () => actions.current.requestHint())
    ed.addCommand(K.CtrlCmd | C.Period, () => actions.current.escalate())
    ed.addCommand(K.CtrlCmd | C.KeyB, () => actions.current.toggleProblem())
    ed.addCommand(K.CtrlCmd | C.KeyJ, () => actions.current.toggleOutput())
    ed.addCommand(K.CtrlCmd | K.Shift | C.KeyS, () => actions.current.snooze())
    ed.focus()
  }

  // Reactively attach or dispose telemetry capture when opt-out preference or telemetry callback changes.
  useEffect(() => {
    const ed = edRef.current
    // Clean up existing capture listeners if any
    if (captureCleanup.current) {
      captureCleanup.current()
      captureCleanup.current = null
    }

    // Attach listeners ONLY when telemetry is provided AND student has NOT opted out
    if (ed && telemetry && !optedOut) {
      const isProgramEdit = () => {
        const model = ed.getModel()
        const currentModelText = model ? model.getValue() : ''
        return currentModelText === parentValue.current && currentModelText !== lastUserValue.current
      }
      const capture = attachEditorCapture(ed, monaco, telemetry, isProgramEdit)
      captureCleanup.current = capture.dispose
    }

    return () => {
      if (captureCleanup.current) {
        captureCleanup.current()
        captureCleanup.current = null
      }
    }
  }, [telemetry, optedOut])

  useEffect(() => {
    if (!decos.current) return
    if (!highlight) { decos.current.clear(); return }
    decos.current.set(
      highlight.lines.map((ln) => ({
        range: new monaco.Range(ln, 1, ln, 1),
        options: {
          isWholeLine: true,
          className: 'hint-line',
          linesDecorationsClassName: 'hint-gutter',
          hoverMessage: { value: highlight.message },
        },
      })),
    )
  }, [highlight])

  return (
    <div className="editor-wrap">
      <Editor
        height="100%"
        language="cpp"
        theme={editorTheme}
        path={path}
        value={value}
        onChange={(v) => {
          const nextVal = v ?? ''
          lastUserValue.current = nextVal
          onChange(nextVal)
        }}
        onMount={onMount}
        loading={<div className="empty" style={{ padding: 16 }}>Loading editor</div>}
        options={{
          fontFamily: editorFont,
          fontSize: lite ? 13 : 13,
          lineHeight: lite ? 19 : 22,
          fontLigatures: !lite,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          renderLineHighlight: lite ? 'none' : 'line',
          cursorBlinking: lite ? 'blink' : 'smooth',
          cursorSmoothCaretAnimation: lite ? 'off' : 'on',
          smoothScrolling: !lite,
          padding: lite ? { top: 4, bottom: 4 } : { top: 14, bottom: 14 },
          lineNumbersMinChars: 4,
          lineDecorationsWidth: 12,
          glyphMargin: false,
          folding: false,
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          overviewRulerBorder: false,
          scrollbar: { vertical: 'auto', horizontal: 'auto', verticalScrollbarSize: 8, horizontalScrollbarSize: 8, useShadows: false },
          quickSuggestions: false,
          wordBasedSuggestions: 'off',
          suggestOnTriggerCharacters: false,
          bracketPairColorization: { enabled: false },
          guides: { indentation: true, bracketPairs: false },
          renderWhitespace: 'none',
          tabSize: 4,
          automaticLayout: true,
          stickyScroll: { enabled: false },
          contextmenu: true,
        }}
      />
    </div>
  )
}
