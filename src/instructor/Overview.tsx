import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockData } from '../mock/data'
import { useCourse } from '../state/useCourse'
import { mastery } from './format'
import { attentionRows, currentLab as selectCurrentLab, overviewStats, studentRows, type SelectorScope } from './selectors'
import type { KnowledgeComponentId } from '../types'

// The cell tint is mixed from the theme accent, so the heatmap follows whatever
// palette the shell is running (lite or full) instead of a second hard-coded one.
function masteryCellStyle(value: number) {
  const strength = Math.round((0.16 + value * 0.74) * 100)
  return {
    backgroundColor: `color-mix(in srgb, var(--accent) ${strength}%, var(--base))`,
    color: value > 0.58 ? 'var(--base)' : 'var(--text)',
  }
}

export function InstructorOverview() {
  const navigate = useNavigate()
  const { labs, currentLab, sessionSubmissions, sessionHints } = useCourse()
  const scope = useMemo<SelectorScope>(() => ({
    labs,
    currentLab,
    submissions: sessionSubmissions,
    hints: sessionHints,
  }), [labs, currentLab, sessionSubmissions, sessionHints])
  const [sortKc, setSortKc] = useState<KnowledgeComponentId>('bst-invariants')
  const rows = useMemo(() => studentRows(scope), [scope])
  const stats = useMemo(() => overviewStats(scope), [scope])
  const openLab = useMemo(() => selectCurrentLab(scope), [scope])
  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => a.masteryByKc[sortKc] - b.masteryByKc[sortKc] || a.student.displayName.localeCompare(b.student.displayName)),
    [rows, sortKc],
  )

  const divergentRows = useMemo(() => attentionRows(scope), [scope])
  const weakestKc = stats.weakest
  const activeRows = [...rows]
    .sort((a, b) => b.activeLabMinutes - a.activeLabMinutes)
    .slice(0, 8)

  return (
    <section className="overview-page">
      <div className="overview-heading">
        <div>
          <p className="instructor-eyebrow">Course pulse</p>
          <h1>Instructor Overview</h1>
        </div>
        <p>FAST NUCES Islamabad / DSA lab section / seeded frontend data</p>
      </div>

      <section className="overview-stats" aria-label="Overview stats" data-testid="overview-stats">
        <div>
          <span>Students in section</span>
          <strong>{stats.students}</strong>
        </div>
        <div>
          <span>Struggling now</span>
          <strong>{stats.struggling}</strong>
        </div>
        <div>
          <span>Correct submissions, low verified mastery</span>
          <strong>{divergentRows.length}</strong>
        </div>
        <div>
          <span>Weakest KC mean</span>
          <strong>{weakestKc ? `${weakestKc.kc.shortName} ${mastery(weakestKc.value)}` : 'not measured yet'}</strong>
        </div>
        <div>
          <span>Labs graded</span>
          <strong>{stats.gradedLabs}</strong>
        </div>
      </section>

      <div className="overview-grid">
        <section className="overview-region heatmap-region" data-testid="overview-heatmap">
          <div className="region-title">
            <div>
              <p className="instructor-eyebrow">Class concept heatmap</p>
              <h2>Students x knowledge components</h2>
            </div>
            <span>Sorted by {mockData.knowledgeComponents.find((kc) => kc.id === sortKc)?.shortName}</span>
          </div>
          {rows.length ? (
            <div className="heatmap-table">
              <div className="heatmap-header">
                <span>Student</span>
                {mockData.knowledgeComponents.map((kc) => (
                  <button key={kc.id} className={sortKc === kc.id ? 'active' : undefined} onClick={() => setSortKc(kc.id)}>
                    {kc.shortName}
                  </button>
                ))}
              </div>
              <div className="heatmap-body">
                {sortedRows.map((row) => (
                  <button
                    key={row.student.id}
                    className="heatmap-row"
                    data-testid="heatmap-row"
                    data-student-id={row.student.id}
                    onClick={() => navigate(`/instructor/students/${row.student.id}`)}
                  >
                    <span>{row.student.displayName}</span>
                    {mockData.knowledgeComponents.map((kc) => (
                      <i key={kc.id} style={masteryCellStyle(row.masteryByKc[kc.id])}>
                        {mastery(row.masteryByKc[kc.id])}
                      </i>
                    ))}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="sentence-empty">The roster has not loaded any students yet.</p>
          )}
        </section>

        <section className="overview-region attention-region" data-testid="overview-attention">
          <div className="region-title">
            <div>
              <p className="instructor-eyebrow">Correct submissions, low verified mastery</p>
              <h2>Students to review</h2>
            </div>
          </div>
          {divergentRows.length ? (
            <div className="attention-list">
              {divergentRows.map((row) => (
                <button key={row.student.id} onClick={() => navigate(`/instructor/students/${row.student.id}`)}>
                  <span>{row.student.displayName}</span>
                  <strong>gap {mastery(row.gap)}</strong>
                  <small>correctness {mastery(row.correctnessMean)} / verified {mastery(row.verifiedMean)}</small>
                </button>
              ))}
            </div>
          ) : (
            <p className="sentence-empty">Every student currently has aligned correctness and verified mastery traces.</p>
          )}
        </section>

        <section className="overview-region live-region" data-testid="overview-live">
          <div className="region-title">
            <div>
              <p className="instructor-eyebrow">Live strip</p>
              <h2>Current lab activity</h2>
            </div>
          </div>
          {activeRows.length ? (
            <div className="live-strip">
              {activeRows.map((row) => (
                <button key={row.student.id} onClick={() => navigate(`/instructor/students/${row.student.id}`)}>
                  <span>{row.student.displayName}</span>
                  <strong>{row.student.status}</strong>
                  <small>{row.activeLabMinutes} min on {openLab ? `Lab ${openLab.number}` : 'the selected lab'}</small>
                </button>
              ))}
            </div>
          ) : (
            <p className="sentence-empty">No students are active in the current lab window.</p>
          )}
        </section>
      </div>
    </section>
  )
}
