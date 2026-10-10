import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCourse } from '../state/useCourse'
import { dayMonth, mastery } from './format'
import { studentRows, type SelectorScope, type StudentRow } from './selectors'
import type { StudentStatus } from '../types'

type SortKey = 'student' | 'status' | 'verified' | 'gap' | 'labs' | 'minutes'

const columns: { key: SortKey; label: string }[] = [
  { key: 'student', label: 'Student' },
  { key: 'status', label: 'Status' },
  { key: 'verified', label: 'Verified mean' },
  { key: 'gap', label: 'Gap' },
  { key: 'labs', label: 'Labs passed' },
  { key: 'minutes', label: 'Minutes on task' },
]

const STATUS_ORDER: Record<StudentStatus, number> = { struggling: 0, active: 1, reviewing: 2, offline: 3 }

function sortValue(row: StudentRow, key: SortKey): string | number {
  if (key === 'student') return row.student.displayName
  if (key === 'status') return STATUS_ORDER[row.student.status]
  if (key === 'verified') return row.verifiedMean
  if (key === 'gap') return row.gap
  if (key === 'labs') return row.labsPassed
  return row.minutesOnTask
}

export function Roster() {
  const navigate = useNavigate()
  const { labs, currentLab, sessionSubmissions, sessionHints } = useCourse()
  const scope = useMemo<SelectorScope>(() => ({
    labs,
    currentLab,
    submissions: sessionSubmissions,
    hints: sessionHints,
  }), [labs, currentLab, sessionSubmissions, sessionHints])
  const rows = useMemo(() => studentRows(scope), [scope])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'student', dir: 'asc' })

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const kept = rows.filter((row) => (
      (status === 'all' || row.student.status === status)
      && (!needle || row.student.displayName.toLowerCase().includes(needle))
    ))
    const direction = sort.dir === 'asc' ? 1 : -1
    return kept.sort((a, b) => {
      const left = sortValue(a, sort.key)
      const right = sortValue(b, sort.key)
      if (left === right) return a.student.displayName.localeCompare(b.student.displayName)
      return (left > right ? 1 : -1) * direction
    })
  }, [rows, query, status, sort])

  const toggleSort = (key: SortKey) => {
    setSort((current) => (
      current.key === key ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
    ))
  }

  return (
    <section className="table-page" data-testid="roster-page">
      <div className="overview-heading">
        <div>
          <p className="instructor-eyebrow">Students</p>
          <h1>Roster</h1>
        </div>
        <p>{filtered.length} of {rows.length} students shown / section CS2-B</p>
      </div>

      <div className="filter-bar">
        <label>
          <span>Find a student</span>
          <input
            className="text-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Student #12"
            data-testid="roster-search"
          />
        </label>
        <label>
          <span>Status</span>
          <select className="sel" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">Any status</option>
            <option value="struggling">struggling</option>
            <option value="active">active</option>
            <option value="reviewing">reviewing</option>
            <option value="offline">offline</option>
          </select>
        </label>
        <p className="filter-note">Names are pseudonymous. Status is a live signal, never a judgement.</p>
      </div>

      {filtered.length ? (
        <div className="data-table" data-testid="roster-table">
          <div className="data-head roster-grid">
            {columns.map((column) => (
              <button
                key={column.key}
                className={sort.key === column.key ? 'active' : undefined}
                onClick={() => toggleSort(column.key)}
              >
                {column.label}{sort.key === column.key ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : ''}
              </button>
            ))}
            <span>Last submission</span>
          </div>
          <div className="data-body">
            {filtered.map((row) => (
              <button
                key={row.student.id}
                className="data-row roster-grid"
                data-testid="roster-row"
                onClick={() => navigate(`/instructor/students/${row.student.id}`)}
              >
                <span>{row.student.displayName}</span>
                <span className={row.student.status === 'struggling' ? 'is-review' : undefined}>{row.student.status}</span>
                <span>{mastery(row.verifiedMean)}</span>
                <span className={row.student.divergent ? 'is-review' : undefined}>{mastery(row.gap)}</span>
                <span>{row.labsPassed} / {row.submissions}</span>
                <span>{row.minutesOnTask}</span>
                <span>{row.lastActivity ? dayMonth(row.lastActivity) : 'no submission yet'}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="sentence-empty">No student matches that search. Clear the box to see the whole section.</p>
      )}
    </section>
  )
}
