import type { Diagnostic, TestResult } from '../types'

type Props = {
  tab: 'diagnostics' | 'tests'
  setTab: (t: 'diagnostics' | 'tests') => void
  diagnostics: Diagnostic[]
  explanations: Record<string, string>
  tests: TestResult[]
  onClose: () => void
  onJump: (line: number, col: number) => void
  lite?: boolean
}

function insight(d: Diagnostic) {
  if (d.severity === 'error') {
    return {
      title: 'Syntax or signature issue',
      text: 'The code did not compile. Check the function name, parameters and syntax at the highlighted line first.',
    }
  }

  return {
    title: 'Syntax OK, implementation incomplete',
    text: explanationsText(d),
  }
}

function explanationsText(d: Diagnostic) {
  if (d.cls.includes('no-swap')) return 'Your loops are present, but the array never changes because the adjacent values are not swapped yet.'
  if (d.cls.includes('no-min')) return 'The scan is started, but it does not yet select the smallest remaining value before the swap.'
  if (d.cls.includes('no-shift')) return 'The key is saved, but larger values are not shifted and the key is not inserted back into the open slot.'
  return 'The program compiles, but the required algorithm step is still missing, so the tests cannot pass yet.'
}

export function OutputPanel({ tab, setTab, diagnostics, explanations, tests, onClose, onJump, lite = false }: Props) {
  const passed = tests.filter((t) => t.passed).length
  const hidden = tests.filter((t) => t.hidden)
  const shown = tests.filter((t) => !t.hidden)
  return (
    <section className="output" aria-label="Output">
      <div className="tabs">
        <button className={'tab' + (tab === 'diagnostics' ? ' on' : '')} onClick={() => setTab('diagnostics')}>
          Diagnostics<em>{diagnostics.length}</em>
        </button>
        {!lite && <button className={'tab' + (tab === 'tests' ? ' on' : '')} onClick={() => setTab('tests')}>
          Tests<em>{passed}/{tests.length}</em>
        </button>}
        <span className="sp" />
        <button className="iconbtn" onClick={onClose} aria-label="Hide output" title="Hide output ⌘J">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8" /></svg>
        </button>
      </div>
      <div className="body">
        {tab === 'diagnostics' && (diagnostics.length === 0
          ? <div className="empty">{lite ? 'Compiled. No diagnostics.' : 'No diagnostics. Compiled cleanly.'}</div>
          : diagnostics.map((d, i) => (
            <div className={'diag' + (lite ? ' raw-only' : '')} key={i}>
              {(() => {
                const note = insight(d)
                return (
                  <div className="run-insight">
                    <span>{note.title}</span>
                    <p>{note.text}</p>
                  </div>
                )
              })()}
              <div className="raw">
                <i className={'dot ' + (d.severity === 'error' ? 'fail' : 'warn')} />
                <div>
                  <button className="loc" onClick={() => onJump(d.line, d.col)} title="Go to line">main.cpp:{d.line}:{d.col}</button>
                  <span style={{ color: 'var(--muted)' }}> {d.severity}: </span>{d.raw}
                </div>
              </div>
              {!lite && <div className="explain">
                <span className="lbl">Explanation</span>
                {explanations[d.cls] ?? <span style={{ color: 'var(--muted)' }}>Explaining</span>}
              </div>}
            </div>
          )))}
        {tab === 'tests' && (
          <>
            {shown.map((t) => (
              <div className="test" key={t.name}>
                <i className={'dot ' + (t.passed ? 'pass' : 'fail')} />
                <span className="name">{t.name}</span>
                <span className="detail">
                  {t.passed ? `= ${t.actual}` : <>expected {t.expected}, got <b>{t.actual}</b></>}
                </span>
              </div>
            ))}
            {hidden.length > 0 && (
              <div className="test">
                <i className={'dot ' + (hidden.every((t) => t.passed) ? 'pass' : 'fail')} />
                <span className="name">{hidden.length} hidden tests</span>
                <span className="detail">{hidden.filter((t) => t.passed).length} passed</span>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
