import { useEffect, useRef } from 'react'
import Editor, { type OnMount } from '@monaco-editor/react'
import { monaco } from '../monaco-setup'

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
}

export function CodeEditor({ value, onChange, onCursor, highlight, actions, lite = false }: Props) {
  const edRef = useRef<Ed | null>(null)
  const decos = useRef<ReturnType<Ed['createDecorationsCollection']> | null>(null)

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
        theme={lite ? "vs-dark" : "scaffold-dark"}
        path="main.cpp"
        value={value}
        onChange={(v) => onChange(v ?? '')}
        onMount={onMount}
        loading={<div className="empty" style={{ padding: 16 }}>Loading editor</div>}
        options={{
          fontFamily: lite ? 'Menlo, Consolas, monospace' : "'JetBrains Mono', ui-monospace, Menlo, monospace",
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
