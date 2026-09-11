import { useState } from 'react'
import { mastery, percent } from './format'
import {
  assistanceSplit, attentionRows, classSeries, kcMeans, labProgress, LOW_MASTERY, type SelectorScope,
} from './selectors'
import { kcStat } from './selectors'
import type { KnowledgeComponentId } from '../types'

// Easy mode: the section and its labs as pictures. No per-student grid — that is
// what complex mode is for. Everything here is class scale, and the one place a
// student appears is the attention panel beside it.
const mockStudents = 47

export function OverviewEasy({ scope, selectedKc, onSelectKc }: {
  scope: SelectorScope
  selectedKc: KnowledgeComponentId | null
  onSelectKc: (kcId: KnowledgeComponentId) => void
}) {
  // Across 47 students the gap is small, because only six of them produce it.
  // Both readings are true and the switch says which one is on screen.
  const [cohort, setCohort] = useState<'section' | 'review'>('section')
  const reviewIds = attentionRows(scope).map((row) => row.student.id)
  const series = classSeries(scope, cohort === 'review' ? reviewIds : undefined)
  const labs = labProgress(scope)
  const concepts = kcMeans(scope)
  const assistance = assistanceSplit(scope)
  const widest = series.reduce((top, point) => Math.max(top, point.correctness - point.adjusted), 0)
  const gapLab = series.find((point) => point.correctness - point.adjusted === widest)

  const x = (index: number) => 52 + (index / Math.max(series.length - 1, 1)) * 560
  const y = (value: number) => 208 - value * 168

  return (
    <div className="easy-grid">
      <section className="overview-region easy-trend" data-testid="class-trend">
        <div className="region-title">
          <div>
            <p className="instructor-eyebrow">Class mastery over the labs</p>
            <h2>What correctness says, against what the work says</h2>
          </div>
          <div className="trend-controls">
            <div className="mode-switch" role="group" aria-label="Which students">
              <button className={cohort === 'section' ? 'on' : undefined} onClick={() => setCohort('section')} data-testid="cohort-section">
                Whole section
              </button>
              <button className={cohort === 'review' ? 'on' : undefined} onClick={() => setCohort('review')} data-testid="cohort-review">
                The {reviewIds.length} to review
              </button>
            </div>
            <div className="chart-legend">
              <span className="accent-line">estimated from correctness</span>
              <span className="amber-line">adjusted for how the work was done</span>
            </div>
          </div>
        </div>
        <svg viewBox="0 0 640 250" role="img" aria-label="Class mean mastery per lab, both estimates" preserveAspectRatio="none">
          <defs>
            <linearGradient id="classGap" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" className="gap-shade-top" />
              <stop offset="1" className="gap-shade-bottom" />
            </linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((value) => (
            <g key={value}>
              <line x1="52" x2="612" y1={y(value)} y2={y(value)} className="chart-grid" />
              <text x="16" y={y(value) + 4} className="chart-axis">{value.toFixed(2)}</text>
            </g>
          ))}
          <polygon
            className="class-gap-area"
            points={[
              ...series.map((point, index) => `${x(index)},${y(point.correctness)}`),
              ...[...series].reverse().map((point, index) => `${x(series.length - 1 - index)},${y(point.adjusted)}`),
            ].join(' ')}
          />
          <polyline className="chart-line correctness-line" points={series.map((point, index) => `${x(index)},${y(point.correctness)}`).join(' ')} />
          <polyline className="chart-line adjusted-line" points={series.map((point, index) => `${x(index)},${y(point.adjusted)}`).join(' ')} />
          {series.map((point, index) => (
            <g key={point.lab.id}>
              <circle cx={x(index)} cy={y(point.correctness)} r="4" className="correctness-dot">
                <title>{`Lab ${point.lab.number} correctness ${mastery(point.correctness)}`}</title>
              </circle>
              <circle cx={x(index)} cy={y(point.adjusted)} r="4" className="adjusted-dot">
                <title>{`Lab ${point.lab.number} adjusted ${mastery(point.adjusted)}`}</title>
              </circle>
              <text x={x(index)} y="232" className="chart-axis" textAnchor="middle">L{point.lab.number}</text>
            </g>
          ))}
        </svg>
        {gapLab && (
          <p className="chart-caption">
            {cohort === 'section'
              ? `Across all ${mockStudents} students the two estimates separate most at Lab ${gapLab.lab.number} — correctness ${mastery(gapLab.correctness)} against adjusted ${mastery(gapLab.adjusted)}. A section mean hides it, which is the point: switch to the students under review.`
              : `For these ${reviewIds.length} students the estimates separate at Lab ${gapLab.lab.number} and stay apart — correctness ${mastery(gapLab.correctness)} against adjusted ${mastery(gapLab.adjusted)}. Every student model in the literature reads only the first line.`}
          </p>
        )}
      </section>

      <section className="overview-region easy-concepts" data-testid="concept-strength">
        <div className="region-title">
          <div>
            <p className="instructor-eyebrow">Concept strength</p>
            <h2>Weakest first</h2>
          </div>
          <span>pick one for its detail</span>
        </div>
        <div className="concept-strength">
          {concepts.map((entry) => {
            const stat = kcStat(entry.kc.id, scope)
            return (
              <button
                key={entry.kc.id}
                className={selectedKc === entry.kc.id ? 'is-open' : undefined}
                onClick={() => onSelectKc(entry.kc.id)}
                data-testid="concept-bar"
              >
                <span>{entry.kc.name}</span>
                <i>
                  <b style={{ width: `${entry.value * 100}%` }} />
                  <u style={{ left: `${LOW_MASTERY * 100}%` }} />
                </i>
                <strong>{mastery(entry.value)}</strong>
                <small>{stat.below.length ? `${stat.below.length} below ${LOW_MASTERY.toFixed(2)}` : 'none below threshold'}</small>
              </button>
            )
          })}
        </div>
      </section>

      <section className="overview-region easy-labs" data-testid="lab-progress">
        <div className="region-title">
          <div>
            <p className="instructor-eyebrow">Labs</p>
            <h2>Attempts and outcomes</h2>
          </div>
        </div>
        <div className="lab-progress">
          {labs.map((entry) => (
            <div key={entry.lab.id}>
              <span>Lab {entry.lab.number}</span>
              <i aria-label={`${entry.passed} passed, ${entry.needReview} need review, ${entry.compileIssues} compile issues`}>
                <b className="is-pass" style={{ width: `${(entry.passed / Math.max(entry.attempts, 1)) * 100}%` }} />
                <b className="is-review" style={{ width: `${(entry.needReview / Math.max(entry.attempts, 1)) * 100}%` }} />
                <b className="is-compile" style={{ width: `${(entry.compileIssues / Math.max(entry.attempts, 1)) * 100}%` }} />
              </i>
              <strong>{percent(entry.passed / Math.max(entry.attempts, 1))}</strong>
              <small>
                {entry.attempts} attempts · {entry.medianMinutes} min median · {entry.withheld} withheld
                {entry.lowVerified ? ` · ${entry.lowVerified} low verified mastery` : ''}
              </small>
            </div>
          ))}
        </div>
        <ul className="fact-list">
          <li><span>assistance requests</span><strong>{assistance.total} from {assistance.students} students</strong></li>
          <li><span>withheld by the guardrail</span><strong className="is-blocked">{assistance.withheld} ({percent(assistance.withheld / Math.max(assistance.total, 1))})</strong></li>
        </ul>
      </section>
    </div>
  )
}
