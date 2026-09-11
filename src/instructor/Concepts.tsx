import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockData } from '../mock/data'
import { useCourse } from '../state/useCourse'
import { mastery, percent } from './format'
import { hintEvents, kcMeans, kcStat, LOW_MASTERY, type SelectorScope } from './selectors'
import type { KnowledgeComponentId } from '../types'

const BINS = 10

function histogram(values: number[]) {
  const counts = Array.from({ length: BINS }, () => 0)
  for (const value of values) {
    const index = Math.min(BINS - 1, Math.floor(value * BINS))
    counts[index] += 1
  }
  return counts
}

function suggestedAction(kcId: KnowledgeComponentId, scope: SelectorScope) {
  const stat = kcStat(kcId, scope)
  const ranked = kcMeans(scope)
  const rank = ranked.findIndex((entry) => entry.kc.id === kcId) + 1
  const labs = stat.labs.map((lab) => `Lab ${lab.number}`).join(' and ')
  const position = rank === 1
    ? 'Weakest concept in the section'
    : rank <= 3
      ? `${rank}${rank === 2 ? 'nd' : 'rd'} weakest concept in the section`
      : `Ranked ${rank} of ${ranked.length} by class mean`
  const pressure = stat.labs.length
    ? `${labs} ${stat.labs.length === 1 ? 'exercises' : 'exercise'} it, and ${stat.labs.length === 1 ? 'that lab carries' : 'those labs carry'} ${percent(stat.assistanceShare)} of all assistance requests`
    : 'No lab exercises it yet, so there is no assistance signal to read'
  const people = stat.below.length === 1
    ? `One student sits below ${LOW_MASTERY.toFixed(2)} on the adjusted estimate`
    : stat.below.length
      ? `${stat.below.length} students sit below ${LOW_MASTERY.toFixed(2)} on the adjusted estimate`
      : `No student sits below ${LOW_MASTERY.toFixed(2)} on the adjusted estimate`
  return `${position}, class mean ${mastery(stat.mean)}. ${pressure}. ${people}.`
}

export function Concepts() {
  const navigate = useNavigate()
  const { labs, currentLab, sessionSubmissions, sessionHints } = useCourse()
  const scope = useMemo<SelectorScope>(() => ({
    labs,
    currentLab,
    submissions: sessionSubmissions,
    hints: sessionHints,
  }), [labs, currentLab, sessionSubmissions, sessionHints])
  const allHints = useMemo(() => hintEvents(sessionHints, labs), [labs, sessionHints])
  const [kcId, setKcId] = useState<KnowledgeComponentId>('in-order-successor')
  const stat = useMemo(() => kcStat(kcId, scope), [kcId, scope])
  const counts = useMemo(() => histogram(stat.values), [stat.values])
  const peak = Math.max(...counts, 1)
  // Whole-student ticks: a count axis with 11.5 students on it is not a count axis.
  const step = Math.max(1, Math.ceil(peak / 4))
  const ticks = Array.from({ length: Math.floor(peak / step) + 1 }, (_, index) => index * step)
  const trend = stat.meanByLab

  return (
    <section className="concepts-page" data-testid="concepts-page">
      <div className="overview-heading">
        <div>
          <p className="instructor-eyebrow">Knowledge components</p>
          <h1>Concepts</h1>
        </div>
        <p>Adjusted for how the work was done / {mockData.students.length} students / {labs.length} labs</p>
      </div>

      <p className="suggested-action" data-testid="kc-action">{suggestedAction(kcId, scope)}</p>

      <div className="kc-toggle-row" aria-label="Knowledge component picker">
        {mockData.knowledgeComponents.map((kc) => (
          <button
            key={kc.id}
            className={kc.id === kcId ? 'active' : undefined}
            onClick={() => setKcId(kc.id)}
            data-testid="kc-pick"
          >
            {kc.shortName}
          </button>
        ))}
      </div>

      <div className="concepts-grid">
        <section className="detail-region" data-testid="kc-histogram">
          <div className="region-title">
            <div>
              <p className="instructor-eyebrow">Distribution</p>
              <h2>{stat.kc.name}</h2>
            </div>
            <span>class mean {mastery(stat.mean)}</span>
          </div>
          <svg viewBox="0 0 620 250" role="img" aria-label={`Mastery distribution for ${stat.kc.name}`} preserveAspectRatio="none">
            {ticks.map((value) => {
              const y = 206 - (value / peak) * 180
              return (
                <g key={value}>
                  <line x1="44" x2="606" y1={y} y2={y} className="chart-grid" />
                  <text x="12" y={y + 4} className="chart-axis">{value}</text>
                </g>
              )
            })}
            {counts.map((count, index) => {
              const width = 552 / BINS
              const x = 50 + index * width
              const height = (count / peak) * 180
              const low = index / BINS
              return (
                <g key={index}>
                  <rect
                    x={x}
                    y={206 - height}
                    width={width - 7}
                    height={Math.max(height, count ? 2 : 0)}
                    className={low + 0.001 < LOW_MASTERY ? 'hist-bar is-low' : 'hist-bar'}
                  >
                    <title>{`${count} students between ${low.toFixed(1)} and ${(low + 1 / BINS).toFixed(1)}`}</title>
                  </rect>
                  <text x={x + (width - 7) / 2} y="222" className="chart-axis" textAnchor="middle">{low.toFixed(1)}</text>
                </g>
              )
            })}
            <line
              x1={50 + LOW_MASTERY * 552}
              x2={50 + LOW_MASTERY * 552}
              y1="16"
              y2="206"
              className="threshold-line"
            />
            <text x={50 + LOW_MASTERY * 552 + 6} y="24" className="chart-axis">below {LOW_MASTERY.toFixed(2)}</text>
            <text x="50" y="242" className="chart-axis">students per tenth of adjusted mastery</text>
          </svg>
        </section>

        <section className="detail-region" data-testid="kc-trend">
          <div className="region-title">
            <div>
              <p className="instructor-eyebrow">Class mean over time</p>
              <h2>Lab by lab</h2>
            </div>
          </div>
          <svg viewBox="0 0 380 230" role="img" aria-label={`Class mean for ${stat.kc.name} by lab`} preserveAspectRatio="none">
            {[0, 0.5, 1].map((value) => (
              <g key={value}>
                <line x1="36" x2="360" y1={190 - value * 160} y2={190 - value * 160} className="chart-grid" />
                <text x="8" y={194 - value * 160} className="chart-axis">{value.toFixed(1)}</text>
              </g>
            ))}
            <polyline
              className="chart-line adjusted-line"
              points={trend.map((entry, index) => `${44 + (index / Math.max(trend.length - 1, 1)) * 306},${190 - entry.value * 160}`).join(' ')}
            />
            {trend.map((entry, index) => (
              <g key={entry.lab.id}>
                <circle
                  cx={44 + (index / Math.max(trend.length - 1, 1)) * 306}
                  cy={190 - entry.value * 160}
                  r="4"
                  className={stat.labs.some((lab) => lab.id === entry.lab.id) ? 'adjusted-dot' : 'idle-dot'}
                >
                  <title>{`Lab ${entry.lab.number}: ${mastery(entry.value)}`}</title>
                </circle>
                <text x={44 + (index / Math.max(trend.length - 1, 1)) * 306} y="212" className="chart-axis">L{entry.lab.number}</text>
              </g>
            ))}
            <text x="36" y="228" className="chart-axis">filled points are labs that exercise this concept</text>
          </svg>
          <ul className="fact-list">
            <li><span>exercised by</span><strong>{stat.labs.map((lab) => `Lab ${lab.number}`).join(', ') || 'no lab yet'}</strong></li>
            <li><span>assistance requests on those labs</span><strong>{stat.assistanceEvents} / {allHints.length}</strong></li>
          </ul>
        </section>

        <section className="detail-region" data-testid="kc-below">
          <div className="region-title">
            <div>
              <p className="instructor-eyebrow">Students below {LOW_MASTERY.toFixed(2)}</p>
              <h2>{stat.below.length} to review</h2>
            </div>
          </div>
          {stat.below.length ? (
            <div className="attention-list">
              {stat.below.map((row) => (
                <button key={row.student.id} onClick={() => navigate(`/instructor/students/${row.student.id}`)}>
                  <span>{row.student.displayName}</span>
                  <strong>{mastery(row.masteryByKc[kcId])}</strong>
                  <small>verified mean {mastery(row.verifiedMean)} / {row.labsPassed} labs passed</small>
                </button>
              ))}
            </div>
          ) : (
            <p className="sentence-empty">Every student in the section is above {LOW_MASTERY.toFixed(2)} on this concept.</p>
          )}
        </section>
      </div>

    </section>
  )
}
