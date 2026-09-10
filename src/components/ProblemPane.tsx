import { MasteryBars, type MasteryBarItem } from './MasteryBars'
import type { Problem } from '../data/problems'
import type { LabPolicy, ManualMeta } from '../types'

export function ProblemPane({
  p,
  collapsed,
  lite = false,
  manuals = [],
  policy = null,
  mastery = [],
  recording = false,
}: {
  p: Problem
  collapsed: boolean
  lite?: boolean
  manuals?: ManualMeta[]
  policy?: LabPolicy | null
  mastery?: MasteryBarItem[]
  recording?: boolean
}) {
  return (
    <aside className={'pane problem' + (collapsed ? ' collapsed' : '')} aria-label="Problem">
      <div className="rail">{p.id} · {p.title}</div>
      <h1>{p.title}</h1>
      <p>{p.statement}</p>
      {manuals.length > 0 && (
        <>
          <div className="sec">Reference material</div>
          <ul className="reference-list">
            {manuals.map((manual) => (
              <li key={manual.id}>
                <a href={`#manual-${manual.id}`}>{manual.name}</a>
              </li>
            ))}
          </ul>
        </>
      )}
      {policy && (
        <>
          <div className="sec">Hint policy</div>
          <p className="hint-policy-note">Hints capped at Level {policy.maxHintLevel}</p>
        </>
      )}
      {p.examples.length > 0 && (
        <>
          <div className="sec">Examples</div>
          {p.examples.map((e) => <div className="ex" key={e}>{e}</div>)}
        </>
      )}
      <div className="sec">Constraints</div>
      <ul>{p.constraints.map((c) => <li key={c}>{c}</li>)}</ul>
      {mastery.length > 0 && (
        <div className="concepts">
          <div className="sec">Your concepts</div>
          <MasteryBars items={mastery} compact />
          <p className="pane-note">
            The bar is the current estimate; the hatched band is how sure the estimate is. A wide
            band means the system does not know yet, and it will offer less, not more.
          </p>
        </div>
      )}
      {!lite && mastery.length === 0 && <div className="concepts">
        <div className="sec">Concepts here</div>
        {p.concepts.map((c) => (
          <div className="row" key={c.name}>
            <span>{c.name}</span>
            <div className="segs" aria-label={`${c.name} mastery`}>
              {[0, 1, 2, 3].map((i) => <i key={i} className={c.mastery > i / 4 + 0.05 ? 'on' : ''} />)}
            </div>
          </div>
        ))}
      </div>}
      {recording && (
        <details className="telemetry-note" data-testid="telemetry-note">
          <summary>This session is being recorded for your progress estimate</summary>
          <p>What is collected while you work on this lab:</p>
          <ul>
            <li>edit bursts and idle gaps, as timings only</li>
            <li>each compile and test run, with the result</li>
            <li>paste events, stored as a size and a hash of the pasted text</li>
            <li>every hint you ask for, with the level that was released</li>
            <li>your submitted code, when you submit it</li>
          </ul>
          <p>
            No keystroke log, no screen recording, and nothing leaves the campus network. Your
            instructor sees these signals under a pseudonym, next to your concept estimates.
          </p>
        </details>
      )}
    </aside>
  )
}
