import { useMemo, useState } from 'react'
import Editor from '@monaco-editor/react'
import { Link, useParams } from 'react-router-dom'
import { MasteryBars } from '../components/MasteryBars'
import { editorFont, editorTheme } from '../monaco-setup'
import { mockData } from '../mock/data'
import { dayMonthTime, mastery } from './format'
import type { KnowledgeComponent, KnowledgeComponentId, MasteryPoint, MasteryTrace, SessionEvent, Submission } from '../types'

type ConceptBar = {
  kc: KnowledgeComponent
  trace: MasteryTrace
  current: MasteryPoint
}

type TimelineLab = {
  labId: string
  label: string
  events: SessionEvent[]
}

const EVENT_CLASS: Record<SessionEvent['kind'], string> = {
  edit_burst: 'edit',
  idle: 'idle',
  paste: 'paste',
  compile: 'compile',
  run: 'run',
  hint_shown: 'hint',
}

function latest(values: MasteryPoint[]) {
  return values[values.length - 1]
}

function xFor(index: number, total: number) {
  if (total <= 1) return 40
  return 40 + (index / (total - 1)) * 600
}

function yFor(value: number) {
  return 260 - value * 210
}

function pointsFor(points: MasteryPoint[]) {
  return points.map((point, index) => `${xFor(index, points.length)},${yFor(point.value)}`).join(' ')
}

function areaFor(top: MasteryPoint[], bottom: MasteryPoint[], startIndex: number) {
  const upper = top.slice(startIndex).map((point, index) => `${xFor(index + startIndex, top.length)},${yFor(point.value)}`)
  const lower = bottom
    .slice(startIndex)
    .reverse()
    .map((point, index) => `${xFor(bottom.length - 1 - index, bottom.length)},${yFor(point.value)}`)
  return [...upper, ...lower].join(' ')
}

function selectedTrace(traces: MasteryTrace[], selectedKc: KnowledgeComponentId) {
  return traces.find((trace) => trace.kcId === selectedKc) ?? traces[0]
}

function buildTestOutput(submission: Submission) {
  const compile = submission.compileOk ? 'compile: ok' : 'compile: needs attention'
  return [compile, `tests passed: ${submission.testsPassed}`, `tests needing review: ${submission.testsFailed}`].join('\n')
}

function MasteryChart({ traces, selectedKc, divergent }: { traces: MasteryTrace[]; selectedKc: KnowledgeComponentId; divergent: boolean }) {
  const trace = selectedTrace(traces, selectedKc)
  const kc = mockData.knowledgeComponents.find((item) => item.id === trace.kcId)
  const correctness = trace.correctnessOnly
  const adjusted = trace.telemetryAdjusted

  return (
    <section className="detail-region mastery-chart" data-testid="mastery-region">
      <div className="region-title">
        <div>
          <p className="instructor-eyebrow">Mastery over time</p>
          <h2>{kc?.name ?? trace.kcId}</h2>
        </div>
        <div className="chart-legend">
          <span className="accent-line">estimated from correctness</span>
          {divergent && <span className="amber-line">adjusted for how the work was done</span>}
        </div>
      </div>
      <svg viewBox="0 0 680 300" role="img" aria-label="Mastery trace chart" data-testid="mastery-chart">
        <defs>
          <linearGradient id="gapShade" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" className="gap-shade-top" />
            <stop offset="1" className="gap-shade-bottom" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((value) => (
          <g key={value}>
            <line x1="40" x2="640" y1={yFor(value)} y2={yFor(value)} className="chart-grid" />
            <text x="12" y={yFor(value) + 4} className="chart-axis">{mastery(value)}</text>
          </g>
        ))}
        {mockData.labs.map((lab, index) => (
          <g key={lab.id}>
            <text x={xFor(index, mockData.labs.length)} y="286" className="chart-axis">L{lab.number}</text>
          </g>
        ))}
        {divergent && <polygon points={areaFor(correctness, adjusted, 3)} className="gap-area" />}
        <polyline points={pointsFor(correctness)} className="chart-line correctness-line" />
        {divergent && <polyline points={pointsFor(adjusted)} className="chart-line adjusted-line" />}
        {correctness.map((point, index) => (
          <circle key={point.labId} cx={xFor(index, correctness.length)} cy={yFor(point.value)} r="4" className="correctness-dot">
            <title>{`${point.labId}: ${mastery(point.value)}`}</title>
          </circle>
        ))}
        {divergent && adjusted.map((point, index) => (
          <circle key={point.labId} cx={xFor(index, adjusted.length)} cy={yFor(point.value)} r="4" className="adjusted-dot">
            <title>{`${point.labId}: ${mastery(point.value)}`}</title>
          </circle>
        ))}
        {divergent && (
          <g data-testid="gap-annotation">
            <line x1="236" x2="504" y1="84" y2="104" className="annotation-line" />
            <text x="56" y="74" className="annotation-text">gap opens after Lab 4</text>
            <text x="56" y="92" className="annotation-note">correctness keeps climbing;</text>
            <text x="56" y="108" className="annotation-note">the adjusted estimate does not</text>
          </g>
        )}
      </svg>
    </section>
  )
}

function ConceptBars({ bars }: { bars: ConceptBar[] }) {
  return (
    <section className="detail-region" data-testid="concept-bars">
      <div className="region-title">
        <div>
          <p className="instructor-eyebrow">Concept bars</p>
          <h2>Weakest first</h2>
        </div>
        <span>hatched band = uncertainty</span>
      </div>
      <MasteryBars
        items={bars.map(({ kc, current }) => ({
          id: kc.id,
          label: kc.name,
          value: current.value,
          low: current.uncertaintyLow,
          high: current.uncertaintyHigh,
        }))}
      />
    </section>
  )
}

function Timeline({ labs }: { labs: TimelineLab[] }) {
  return (
    <section className="detail-region timeline-region" data-testid="timeline-region">
      <div className="region-title">
        <div>
          <p className="instructor-eyebrow">Session timeline</p>
          <h2>Lab activity tracks</h2>
        </div>
      </div>
      <div className="timeline-list">
        {labs.map((lab) => (
          <div key={lab.labId} className="timeline-lab">
            <span>{lab.label}</span>
            <div className="timeline-track">
              {lab.events.map((event, index) => (
                <i
                  key={event.id}
                  className={`event-dot ${EVENT_CLASS[event.kind]}`}
                  style={{ left: `${8 + (index / Math.max(lab.events.length - 1, 1)) * 84}%` }}
                  title={`${event.label}: ${event.detail}`}
                  data-testid={event.kind === 'paste' ? 'paste-event' : undefined}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function SubmissionViewer({ submissions, selected, onSelect }: { submissions: Submission[]; selected: Submission; onSelect: (submission: Submission) => void }) {
  return (
    <section className="detail-region submissions-region" data-testid="submissions-region">
      <div className="region-title">
        <div>
          <p className="instructor-eyebrow">Submissions</p>
          <h2>Code and test output</h2>
        </div>
      </div>
      <div className="submission-workspace">
        <div className="submission-list">
          {submissions.map((submission) => {
            const lab = mockData.labs.find((item) => item.id === submission.labId)
            return (
              <button
                key={submission.id}
                className={submission.id === selected.id ? 'active' : undefined}
                onClick={() => onSelect(submission)}
              >
                <span>{lab ? `Lab ${lab.number}: ${lab.title}` : submission.labId}</span>
                <strong>{dayMonthTime(submission.timestamp)}</strong>
                <small>{submission.testsPassed} passed / {submission.testsFailed} need review / {submission.timeOnTaskMin} min</small>
              </button>
            )
          })}
        </div>
        <div className="code-reviewer" data-testid="code-viewer">
          <div className="readonly-editor">
            <Editor
              height="100%"
              language="cpp"
              theme={editorTheme}
              path={`${selected.id}.cpp`}
              value={selected.code}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontFamily: editorFont,
                fontSize: 13,
                lineHeight: 20,
                lineNumbersMinChars: 4,
                lineDecorationsWidth: 12,
                glyphMargin: false,
                folding: false,
                overviewRulerLanes: 0,
                overviewRulerBorder: false,
                scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8, useShadows: false },
                automaticLayout: true,
              }}
            />
          </div>
          <pre>{buildTestOutput(selected)}</pre>
        </div>
      </div>
    </section>
  )
}

export function StudentDetail() {
  const { studentId } = useParams()
  const student = mockData.students.find((item) => item.id === studentId)
  const traces = useMemo(
    () => mockData.masteryTraces.filter((trace) => trace.studentId === student?.id),
    [student?.id],
  )
  const [selectedKc, setSelectedKc] = useState<KnowledgeComponentId>('in-order-successor')
  const submissions = useMemo(
    () => mockData.submissions.filter((submission) => submission.studentId === student?.id),
    [student?.id],
  )
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null)
  const selectedSubmission = submissions.find((submission) => submission.id === selectedSubmissionId) ?? submissions[submissions.length - 1]

  if (!student || !selectedSubmission) {
    return (
      <section className="student-detail">
        <Link to="/instructor/overview" className="back-link">Back to overview</Link>
        <p className="sentence-empty">This student record is not available in the seeded dataset.</p>
      </section>
    )
  }

  const completedLabs = submissions.filter((submission) => submission.status === 'passed').length
  const conceptBars = mockData.knowledgeComponents
    .map((kc) => {
      const trace = traces.find((item) => item.kcId === kc.id)
      if (!trace) return null
      return { kc, trace, current: latest(trace.telemetryAdjusted) }
    })
    .filter((item): item is ConceptBar => Boolean(item))
    .sort((a, b) => a.current.value - b.current.value)
  const timelineLabs = mockData.labs
    .filter((lab) => lab.status !== 'draft')
    .map((lab) => ({
      labId: lab.id,
      label: `Lab ${lab.number}`,
      events: mockData.sessionEvents.filter((event) => event.studentId === student.id && event.labId === lab.id),
    }))
  const selectedTraceId = traces.some((trace) => trace.kcId === selectedKc) ? selectedKc : traces[0].kcId

  return (
    <section className="student-detail">
      <Link to="/instructor/overview" className="back-link">Back to overview</Link>
      <header className="student-detail-header">
        <div>
          <p className="instructor-eyebrow">{student.section}</p>
          <h1>{student.displayName}</h1>
        </div>
        <div className="student-header-stats">
          <span>{completedLabs} labs completed</span>
          <strong>{student.status}</strong>
        </div>
      </header>

      <div className="kc-toggle-row" aria-label="Knowledge component toggles">
        {mockData.knowledgeComponents.map((kc) => (
          <button key={kc.id} className={selectedTraceId === kc.id ? 'active' : undefined} onClick={() => setSelectedKc(kc.id)}>
            {kc.shortName}
          </button>
        ))}
      </div>

      <div className="student-detail-grid">
        <MasteryChart traces={traces} selectedKc={selectedTraceId} divergent={student.divergent} />
        <ConceptBars bars={conceptBars} />
        <Timeline labs={timelineLabs} />
        <SubmissionViewer submissions={submissions} selected={selectedSubmission} onSelect={(submission) => setSelectedSubmissionId(submission.id)} />
      </div>
    </section>
  )
}
