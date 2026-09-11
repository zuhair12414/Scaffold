import { useNavigate } from 'react-router-dom'
import { mastery } from './format'
import { kcStat, LOW_MASTERY, suggestedAction } from './selectors'
import type { KnowledgeComponentId } from '../types'

const BINS = 10

function histogram(values: number[]) {
  const counts = Array.from({ length: BINS }, () => 0)
  for (const value of values) counts[Math.min(BINS - 1, Math.floor(value * BINS))] += 1
  return counts
}

// The per-concept detail that used to be its own screen. It opens in place when a
// concept is picked on the Overview, so nothing was lost when the tab went.
export function ConceptDetail({ kcId, onClose }: { kcId: KnowledgeComponentId; onClose: () => void }) {
  const navigate = useNavigate()
  const stat = kcStat(kcId)
  const counts = histogram(stat.values)
  const peak = Math.max(...counts, 1)
  const step = Math.max(1, Math.ceil(peak / 4))
  const ticks = Array.from({ length: Math.floor(peak / step) + 1 }, (_, index) => index * step)
  const trend = stat.meanByLab

  return (
    <section className="detail-region concept-detail" data-testid="concept-detail">
      <div className="region-title">
        <div>
          <p className="instructor-eyebrow">{stat.kc.name}</p>
          <h2>Class mean {mastery(stat.mean)}</h2>
        </div>
        <button className="linkbtn" onClick={onClose} data-testid="close-concept">Close</button>
      </div>

      <p className="suggested-action">{suggestedAction(kcId)}</p>

      <div className="concept-detail-grid">
        <div>
          <p className="form-label">Distribution across the section</p>
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
            <line x1={50 + LOW_MASTERY * 552} x2={50 + LOW_MASTERY * 552} y1="16" y2="206" className="threshold-line" />
            <text x={50 + LOW_MASTERY * 552 + 6} y="24" className="chart-axis">below {LOW_MASTERY.toFixed(2)}</text>
            <text x="50" y="242" className="chart-axis">students per tenth of adjusted mastery</text>
          </svg>
        </div>

        <div>
          <p className="form-label">Class mean, lab by lab</p>
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
            <li><span>assistance on those labs</span><strong>{stat.assistanceEvents} requests</strong></li>
          </ul>
        </div>

        <div>
          <p className="form-label">Students below {LOW_MASTERY.toFixed(2)}</p>
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
        </div>
      </div>
    </section>
  )
}
