import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { dayMonthTime } from './format'
import {
  chatFor, hintEvents, labShort, questionLabel, submissionRows, submissionStats,
  telemetryFor, verifiedMasteryVerdict, type SubmissionRow,
} from './selectors'
import { useCourse } from '../state/useCourse'
import { notify } from '../state/toast'
import type { ChatTurn, SubmissionStatus } from '../types'

type SortKey = 'student' | 'lab' | 'timestamp' | 'tests' | 'time' | 'status'

const STATUS_LABEL: Record<SubmissionStatus, string> = {
  passed: 'tests passed',
  tests_failing: 'tests need review',
  compile_issue: 'compile needs attention',
}

const columns: { key: SortKey; label: string }[] = [
  { key: 'student', label: 'Student' },
  { key: 'lab', label: 'Lab' },
  { key: 'timestamp', label: 'Submitted' },
  { key: 'tests', label: 'Tests passed' },
  { key: 'time', label: 'Time on task' },
  { key: 'status', label: 'Outcome' },
]

function sortValue(row: SubmissionRow, key: SortKey): string | number {
  if (key === 'student') return row.student.displayName
  if (key === 'lab') return row.lab.number
  if (key === 'timestamp') return row.submission.timestamp
  if (key === 'tests') return row.submission.testsPassed
  if (key === 'time') return row.submission.timeOnTaskMin
  return STATUS_LABEL[row.submission.status]
}

function toCsv(rows: SubmissionRow[]) {
  const header = ['student', 'lab', 'submitted', 'tests_passed', 'tests_needing_review', 'time_on_task_min', 'outcome', 'hints_shown', 'hints_withheld']
  const body = rows.map((row) => [
    row.student.displayName,
    `Lab ${row.lab.number}: ${row.lab.title}`,
    row.submission.timestamp,
    row.submission.testsPassed,
    row.submission.testsFailed,
    row.submission.timeOnTaskMin,
    STATUS_LABEL[row.submission.status],
    row.hints.filter((hint) => !hint.blocked).length,
    row.hints.filter((hint) => hint.blocked).length,
  ])
  return [header, ...body]
    .map((line) => line.map((cell) => (/[",\n]/.test(String(cell)) ? `"${String(cell).replaceAll('"', '""')}"` : String(cell))).join(','))
    .join('\n')
}

function download(rows: SubmissionRow[]) {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `scaffold-submissions-${rows.length}-rows.csv`
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
  notify(`${rows.length} rows exported to CSV`)
}

function ExpandedRow({ row, classMedian, liveChat }: { row: SubmissionRow; classMedian: number; liveChat: ChatTurn[] }) {
  const navigate = useNavigate()
  const verdict = verifiedMasteryVerdict(row, classMedian)
  const telemetry = telemetryFor(row.student.id, row.submission.questionId)
  const chat = chatFor(row.student.id, row.submission.questionId, liveChat)
  const start = telemetry.length ? new Date(telemetry[0].at).getTime() : 0
  const offset = (at: string) => (start ? `+${Math.max(0, Math.round((new Date(at).getTime() - start) / 60_000))} min` : '')
  const scale = Math.max(classMedian * 2, verdict.minutes, 1)

  return (
    <div className="submission-expanded is-wide" data-testid="submission-expanded">
      <div>
        <p className={verdict.flagged ? 'verdict is-flagged' : 'verdict'} data-testid="verdict">
          {verdict.headline}
        </p>
        <ul className="reason-list">
          {verdict.reasons.length
            ? verdict.reasons.map((reason) => <li key={reason}>{reason}</li>)
            : <li>Nothing on this attempt separates it from the rest of the section.</li>}
        </ul>
        <p className="form-label">This attempt against the section</p>
        <div className="compare-bars">
          <div>
            <span>this attempt</span>
            <i className={verdict.ratio <= 0.5 ? 'is-flagged' : undefined} style={{ width: `${(verdict.minutes / scale) * 100}%` }} />
            <strong>{verdict.minutes} min</strong>
          </div>
          <div>
            <span>class median, this lab</span>
            <i style={{ width: `${(classMedian / scale) * 100}%` }} />
            <strong>{classMedian} min</strong>
          </div>
        </div>
        <p className="form-label">Submitted code</p>
        <pre className="code-block">{row.submission.code}</pre>
      </div>

      <div>
        <p className="form-label">Telemetry for this attempt</p>
        {telemetry.length ? (
          <ol className="telemetry-log" data-testid="telemetry-log">
            {telemetry.map((event) => (
              <li key={event.id}>
                <i className={`event-dot ${event.kind === 'edit_burst' ? 'edit' : event.kind === 'hint_shown' ? 'hint' : event.kind}`} aria-hidden="true" />
                <span>{event.label}</span>
                <em>{offset(event.at)}</em>
                <small>{event.detail}</small>
              </li>
            ))}
          </ol>
        ) : <p className="sentence-empty">No telemetry was captured for this attempt.</p>}

        <p className="form-label">Conversation on this question</p>
        {chat.length ? (
          <div className="chat-log" data-testid="chat-log">
            {chat.map((turn) => (
              <p key={turn.id} className={turn.role === 'student' ? 'chat-student' : 'chat-tutor'}>
                <span>{turn.role === 'student'
                  ? row.student.displayName
                  : `Tutor${turn.level != null ? ` · Level ${turn.level}` : ''}${turn.blocked ? ' · withheld' : ''}`}</span>
                {turn.text}
              </p>
            ))}
          </div>
        ) : <p className="sentence-empty">This student did not open the tutor on this question.</p>}

        <p className="form-label">Assistance decisions</p>
        {row.hints.length ? (
          <ul className="fact-list">
            {row.hints.map((hint) => (
              <li key={hint.id}>
                <span>Level {hint.level} / {dayMonthTime(hint.timestamp)}</span>
                <strong className={hint.blocked ? 'is-blocked' : undefined}>
                  {hint.blocked ? `withheld / ${hint.reason}` : 'shown'}
                </strong>
              </li>
            ))}
          </ul>
        ) : <p className="sentence-empty">No assistance was requested during this lab.</p>}
        <button className="secondary-action" onClick={() => navigate(`/instructor/students/${row.student.id}`)}>
          Open {row.student.displayName}
        </button>
      </div>
    </div>
  )
}

export function Submissions() {
  const { labs, sessionSubmissions, sessionHints, sessionChat } = useCourse()
  const rows = useMemo(() => submissionRows(sessionSubmissions, labs, hintEvents(sessionHints, labs)), [labs, sessionHints, sessionSubmissions])
  const [labId, setLabId] = useState('all')
  const [status, setStatus] = useState('all')
  const [minTests, setMinTests] = useState(0)
  const [maxMinutes, setMaxMinutes] = useState(120)
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'timestamp', dir: 'desc' })
  const [openId, setOpenId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const kept = rows.filter((row) => (
      (labId === 'all' || row.submission.labId === labId)
      && (status === 'all' || row.submission.status === status)
      && row.submission.testsPassed >= minTests
      && row.submission.timeOnTaskMin <= maxMinutes
    ))
    const direction = sort.dir === 'asc' ? 1 : -1
    return kept.sort((a, b) => {
      const left = sortValue(a, sort.key)
      const right = sortValue(b, sort.key)
      if (left === right) return a.student.displayName.localeCompare(b.student.displayName)
      return (left > right ? 1 : -1) * direction
    })
  }, [rows, labId, status, minTests, maxMinutes, sort])

  const stats = useMemo(() => submissionStats(filtered), [filtered])
  // Compare an attempt with the section that sat the same lab, not with everyone.
  const labMedians = useMemo(() => {
    const byLab: Record<string, number> = {}
    for (const lab of labs) {
      byLab[lab.id] = submissionStats(rows.filter((row) => row.submission.labId === lab.id)).medianMinutes
    }
    return byLab
  }, [rows, labs])

  const toggleSort = (key: SortKey) => {
    setSort((current) => (
      current.key === key
        ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: key === 'timestamp' ? 'desc' : 'asc' }
    ))
  }

  return (
    <section className="table-page" data-testid="submissions-page">
      <div className="overview-heading">
        <div>
          <p className="instructor-eyebrow">Work events</p>
          <h1>Submissions</h1>
        </div>
        <p>{filtered.length} of {rows.length} attempts shown</p>
      </div>

      <section className="overview-stats stat-strip" aria-label="Submission stats" data-testid="submission-stats">
        <div>
          <span>Attempts shown</span>
          <strong>{stats.attempts}</strong>
        </div>
        <div>
          <span>All tests passed</span>
          <strong>{stats.passed}</strong>
        </div>
        <div>
          <span>Tests need review</span>
          <strong>{stats.needReview}</strong>
        </div>
        <div>
          <span>Compile needs attention</span>
          <strong>{stats.compileIssues}</strong>
        </div>
        <div>
          <span>Median time on task</span>
          <strong>{stats.medianMinutes} min</strong>
        </div>
        <div>
          <span>Assistance withheld</span>
          <strong>{stats.withheldHints}</strong>
        </div>
      </section>

      <div className="filter-bar" data-testid="submission-filters">
        <label>
          <span>Lab</span>
          <select className="sel" value={labId} onChange={(event) => setLabId(event.target.value)}>
            <option value="all">All labs</option>
            {labs.filter((lab) => lab.status !== 'draft').map((lab) => (
              <option key={lab.id} value={lab.id}>Lab {lab.number}: {lab.title}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Outcome</span>
          <select className="sel" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">Any outcome</option>
            <option value="passed">{STATUS_LABEL.passed}</option>
            <option value="tests_failing">{STATUS_LABEL.tests_failing}</option>
            <option value="compile_issue">{STATUS_LABEL.compile_issue}</option>
          </select>
        </label>
        <label>
          <span>Tests passed at least {minTests}</span>
          <input type="range" min="0" max="6" value={minTests} onChange={(event) => setMinTests(Number(event.target.value))} />
        </label>
        <label>
          <span>Time on task up to {maxMinutes} min</span>
          <input type="range" min="10" max="120" step="5" value={maxMinutes} onChange={(event) => setMaxMinutes(Number(event.target.value))} />
        </label>
        <button className="secondary-action" onClick={() => download(filtered)} data-testid="export-csv">
          Export {filtered.length} rows to CSV
        </button>
      </div>

      {filtered.length ? (
        <div className="data-table" data-testid="submission-table">
          <div className="data-head submission-grid">
            {columns.map((column) => (
              <button
                key={column.key}
                className={sort.key === column.key ? 'active' : undefined}
                onClick={() => toggleSort(column.key)}
              >
                {column.label}{sort.key === column.key ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : ''}
              </button>
            ))}
          </div>
          <div className="data-body">
            {filtered.map((row) => (
              <div key={row.submission.id}>
                <button
                  className={'data-row submission-grid' + (openId === row.submission.id ? ' active' : '')}
                  data-testid="submission-row"
                  onClick={() => setOpenId((current) => (current === row.submission.id ? null : row.submission.id))}
                >
                  <span>{row.student.displayName}</span>
                  <span>{labShort(row.submission.labId, labs)}<em className="row-question">{questionLabel(row.submission.questionId, labs).split(' · ')[0]}</em></span>
                  <span>{dayMonthTime(row.submission.timestamp)}</span>
                  <span>{row.submission.testsPassed} / {row.submission.testsPassed + row.submission.testsFailed}</span>
                  <span>{row.submission.timeOnTaskMin} min</span>
                  <span className={row.submission.status === 'passed' ? 'is-pass' : 'is-review'}>
                    {STATUS_LABEL[row.submission.status]}{row.live ? ' · this session' : ''}
                    {verifiedMasteryVerdict(row, labMedians[row.submission.labId] ?? stats.medianMinutes).flagged && (
                      <em className="flag-chip" data-testid="low-verified-chip">low verified mastery</em>
                    )}
                  </span>
                </button>
                {openId === row.submission.id && (
                  <ExpandedRow row={row} classMedian={labMedians[row.submission.labId] ?? stats.medianMinutes} liveChat={sessionChat} />
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="sentence-empty">No attempt matches these filters. Widen the time-on-task range or clear the outcome filter.</p>
      )}
      <p className="table-note">
        Mean time on task in this selection: {stats.meanMinutes} minutes.
        {stats.fastestPass && ` Fastest pass: ${stats.fastestPass.student.displayName} at ${stats.fastestPass.submission.timeOnTaskMin} minutes.`}
        {' '}Rows marked <em>this session</em> were submitted from the student view in this browser; every other row is seeded.
      </p>
    </section>
  )
}
