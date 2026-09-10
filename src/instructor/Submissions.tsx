import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockData } from '../mock/data'
import { dayMonthTime } from './format'
import { labShort, submissionRows, submissionStats, type SubmissionRow } from './selectors'
import { useCourse } from '../state/useCourse'
import type { SubmissionStatus } from '../types'

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
}

function ExpandedRow({ row }: { row: SubmissionRow }) {
  const navigate = useNavigate()
  return (
    <div className="submission-expanded" data-testid="submission-expanded">
      <div>
        <p className="form-label">Submitted code</p>
        <pre className="code-block">{row.submission.code}</pre>
      </div>
      <div>
        <p className="form-label">Test run</p>
        <ul className="fact-list">
          <li><span>compile</span><strong>{row.submission.compileOk ? 'ok' : 'needs attention'}</strong></li>
          <li><span>tests passed</span><strong>{row.submission.testsPassed} of {row.submission.testsPassed + row.submission.testsFailed}</strong></li>
          <li><span>time on task</span><strong>{row.submission.timeOnTaskMin} min</strong></li>
        </ul>
        <p className="form-label">Assistance during this lab</p>
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
  const { sessionSubmissions } = useCourse()
  const rows = useMemo(() => submissionRows(sessionSubmissions), [sessionSubmissions])
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

      <section className="overview-stats" aria-label="Submission stats" data-testid="submission-stats">
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
            {mockData.labs.filter((lab) => lab.status !== 'draft').map((lab) => (
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
                  <span>{labShort(row.submission.labId)}</span>
                  <span>{dayMonthTime(row.submission.timestamp)}</span>
                  <span>{row.submission.testsPassed} / {row.submission.testsPassed + row.submission.testsFailed}</span>
                  <span>{row.submission.timeOnTaskMin} min</span>
                  <span className={row.submission.status === 'passed' ? 'is-pass' : 'is-review'}>
                    {STATUS_LABEL[row.submission.status]}{row.live ? ' · this session' : ''}
                  </span>
                </button>
                {openId === row.submission.id && <ExpandedRow row={row} />}
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
