import * as monaco from 'monaco-editor'
import { loader } from '@monaco-editor/react'
import EditorWorker from 'monaco-editor/editor/editor.worker.js?worker'

;(self as unknown as { MonacoEnvironment: unknown }).MonacoEnvironment = {
  getWorker: () => new EditorWorker(),
}
loader.config({ monaco })

// Cursor-inspired dark theme. Low-chroma neutrals, pastel syntax, no teal or mint
// anywhere in the syntax set so the tutor accent stays unambiguous.
monaco.editor.defineTheme('scaffold-dark', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: '', foreground: 'D6D6DD' },
    { token: 'comment', foreground: '6C6C74' },
    { token: 'keyword', foreground: 'AA9BF5' },
    { token: 'keyword.directive', foreground: 'AA9BF5' },
    { token: 'string', foreground: 'E394DC' },
    { token: 'string.include.identifier', foreground: 'E394DC' },
    { token: 'number', foreground: 'EBC88D' },
    { token: 'annotation', foreground: 'EBC88D' },
    { token: 'type', foreground: '87C3FF' },
    { token: 'identifier', foreground: 'D6D6DD' },
    { token: 'delimiter', foreground: 'A0A0A8' },
    { token: 'delimiter.angle', foreground: 'A0A0A8' },
  ],
  colors: {
    'editor.background': '#181818',
    'editor.foreground': '#D6D6DD',
    'editorLineNumber.foreground': '#4E4E55',
    'editorLineNumber.activeForeground': '#A0A0A8',
    'editor.lineHighlightBackground': '#1E1E1E',
    'editor.lineHighlightBorder': '#1E1E1E',
    'editor.selectionBackground': '#2E3438',
    'editor.inactiveSelectionBackground': '#252A2D',
    'editorCursor.foreground': '#D6D6DD',
    'editorIndentGuide.background1': '#242424',
    'editorIndentGuide.activeBackground1': '#333333',
    'editorBracketMatch.background': '#2A2A2A',
    'editorBracketMatch.border': '#3A3A3A',
    'editorWidget.background': '#1B1B1B',
    'editorWidget.border': '#2A2A2A',
    'editorHoverWidget.background': '#1B1B1B',
    'editorHoverWidget.border': '#2A2A2A',
    'scrollbarSlider.background': '#FFFFFF12',
    'scrollbarSlider.hoverBackground': '#FFFFFF20',
    'scrollbarSlider.activeBackground': '#FFFFFF28',
    'scrollbar.shadow': '#00000000',
    'focusBorder': '#3A3A3A',
    'editorOverviewRuler.border': '#00000000',
  },
})

// One editor identity for every Monaco instance in the app — the student IDE and
// the instructor's read-only submission viewer — so both shells read as one product.
export const editorTheme = import.meta.env.VITE_UI === 'full' ? 'scaffold-dark' : 'vs-dark'
export const editorFont = import.meta.env.VITE_UI === 'full'
  ? "'JetBrains Mono', ui-monospace, Menlo, monospace"
  : 'Menlo, Consolas, monospace'

export { monaco }
