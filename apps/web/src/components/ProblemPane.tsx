import { Link } from 'react-router-dom'
import { DemoPanel } from './DemoPanel'
import { Markdown } from './Markdown'
import { MasteryBars, type MasteryBarItem } from './MasteryBars'
import { QuestionList } from './QuestionList'
import type { Problem } from '../data/problems'
import type { DemoStage, LabQuestion } from '../mock/labQuestions'
import type { Lab, ManualMeta, Submission } from '../types'

function when(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return `${date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
}

const OUTCOME: Record<Submission['status'], string> = {
  passed: 'all tests passed',
  tests_failing: 'tests need review',
  compile_issue: 'did not compile',
}

type Props = {
  p: Problem
  collapsed: boolean
  lite?: boolean
  lab: Lab
  questions: LabQuestion[]
  activeQuestionId: string
  onSelectQuestion: (questionId: string) => void
  questionAttempts: Submission[]
  attempts: Submission[]
  manuals?: ManualMeta[]
  mastery?: MasteryBarItem[]
  recording?: boolean
  onOpenManual?: (manual: ManualMeta) => void
  closed?: boolean
  demoQuestion: LabQuestion
  demoStage: DemoStage
  onDemoFill: (stage: DemoStage) => void
  onDemoAsk: (text: string) => void
}

export function ProblemPane({
  p,
  collapsed,
  lite = false,
  lab,
  questions,
  activeQuestionId,
  onSelectQuestion,
  questionAttempts,
  attempts,
  manuals = [],
  mastery = [],
  recording = false,
  onOpenManual,
  closed = false,
  demoQuestion,
  demoStage,
  onDemoFill,
  onDemoAsk,
}: Props) {
  const best = attempts.reduce((top, attempt) => Math.max(top, attempt.testsPassed), 0)
  const minutes = attempts.reduce((sum, attempt) => sum + attempt.timeOnTaskMin, 0)

  return (
    <aside className={'pane problem' + (collapsed ? ' collapsed' : '')} aria-label="Problem">
      <div className="rail">{p.lab} · {p.title}</div>

      <div className="pane-lab-head">
        <Link to="/student" className="back-link">All labs</Link>
        <h2>Lab {lab.number}: {lab.title}</h2>
      </div>

      <QuestionList
        questions={questions}
        activeId={activeQuestionId}
        attempts={questionAttempts}
        onSelect={onSelectQuestion}
      />

      {closed && (
        <p className="closed-note" data-testid="closed-note">
          This lab is closed. You can still read it and ask for hints; new attempts are no longer
          collected.
        </p>
      )}

      <h1>{p.title}</h1>
      <Markdown text={p.statement} />

      {manuals.length > 0 && (
        <>
          <div className="sec">Reference material</div>
          <ul className="reference-list">
            {manuals.map((manual) => (
              <li key={manual.id}>
                <button className="linkbtn" onClick={() => onOpenManual?.(manual)} data-testid="open-manual">
                  {manual.name}
                </button>
              </li>
            ))}
          </ul>
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

      <DemoPanel question={demoQuestion} stage={demoStage} onFill={onDemoFill} onAsk={onDemoAsk} />

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

      {!lite && mastery.length === 0 && (
        <div className="concepts">
          <div className="sec">Concepts here</div>
          {p.concepts.map((c) => (
            <div className="row" key={c.name}>
              <span>{c.name}</span>
              <div className="segs" aria-label={`${c.name} mastery`}>
                {[0, 1, 2, 3].map((i) => <i key={i} className={c.mastery > i / 4 + 0.05 ? 'on' : ''} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {attempts.length > 0 && (
        <div className="attempts" data-testid="student-attempts">
          <div className="sec">Your attempts on this question</div>
          <p className="attempt-summary">
            {attempts.length} submitted · best {best} of {attempts[0].testsPassed + attempts[0].testsFailed} tests · {minutes} min on task
          </p>
          <ul className="attempt-list">
            {[...attempts].reverse().map((attempt) => (
              <li key={attempt.id} className={attempt.status === 'passed' ? 'is-pass' : 'is-review'}>
                <span>{when(attempt.timestamp)}</span>
                <strong>{attempt.testsPassed} / {attempt.testsPassed + attempt.testsFailed}</strong>
                <small>{OUTCOME[attempt.status]} · {attempt.timeOnTaskMin} min{attempt.id.startsWith('session-') ? ' · this session' : ''}</small>
              </li>
            ))}
          </ul>
        </div>
      )}

      {recording && (
        <details className="telemetry-note" data-testid="telemetry-note">
          <summary>This session is being recorded for your progress estimate</summary>
          <p>What is collected while you work on this question:</p>
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
