import { useState } from 'react'
import { Link } from 'react-router-dom'
import { mockData } from '../mock/data'
import { applyProjector, projectorOn } from '../state/demo'
import { useCourse } from '../state/useCourse'
import { dayMonthTime } from './format'
import { overviewStats } from './selectors'

export function Settings() {
  const { labs, manuals, policies, sessionSubmissions, sessionHints, resetCourse } = useCourse()
  const [projector, setProjector] = useState(projectorOn)
  const [resetAt, setResetAt] = useState<string | null>(null)
  const stats = overviewStats()
  const localLabs = labs.length - mockData.labs.length
  const localManuals = manuals.length - mockData.manuals.length
  const changedPolicies = policies.filter((policy) => (
    policy.maxHintLevel !== 4 || policy.similarityThreshold !== 0.6 || !policy.escalationAllowed
  )).length

  const toggleProjector = (on: boolean) => {
    setProjector(on)
    applyProjector(on)
  }

  return (
    <section className="settings-page" data-testid="settings-page">
      <div className="overview-heading">
        <div>
          <p className="instructor-eyebrow">Demo controls</p>
          <h1>Settings</h1>
        </div>
        <p>Frontend only / no backend, no model call</p>
      </div>

      <div className="settings-grid">
        <section className="detail-region">
          <div className="region-title">
            <div>
              <p className="instructor-eyebrow">Room</p>
              <h2>Projector mode</h2>
            </div>
          </div>
          <label className="toggle-line settings-toggle">
            <input
              type="checkbox"
              checked={projector}
              onChange={(event) => toggleProjector(event.target.checked)}
              data-testid="projector-toggle"
            />
            <span>Larger type and denser contrast for a projected screen</span>
          </label>
          <p className="quiet-block">
            Raises the base size across the console and thickens hairlines. Test it at the
            resolution of the room, not the laptop.
          </p>
        </section>

        <section className="detail-region">
          <div className="region-title">
            <div>
              <p className="instructor-eyebrow">Rails</p>
              <h2>Reset demo</h2>
            </div>
          </div>
          <p className="quiet-block">
            Drops labs, manuals and policy edits made during a walkthrough and returns every
            screen to the seeded state. The dataset itself never changes: it is regenerated
            from seed {mockData.seed} on every load.
          </p>
          <ul className="fact-list">
            <li><span>labs added in this session</span><strong>{localLabs}</strong></li>
            <li><span>manuals uploaded in this session</span><strong>{localManuals}</strong></li>
            <li><span>labs with an edited policy</span><strong>{changedPolicies}</strong></li>
            <li><span>attempts submitted from the student view</span><strong>{sessionSubmissions.length}</strong></li>
            <li><span>assistance requests made in the student view</span><strong>{sessionHints.length}</strong></li>
          </ul>
          <button
            className="primary-action"
            data-testid="reset-demo"
            onClick={() => {
              resetCourse()
              setResetAt(new Date().toISOString())
            }}
          >
            Reset demo
          </button>
          {resetAt && <p className="sentence-empty" data-testid="reset-confirmation">Reset at {dayMonthTime(resetAt)}. Every screen is back to the seeded state.</p>}
          <p className="quiet-block">
            <Link to="/instructor/overview?demo=1">/instructor/overview?demo=1</Link> does the same thing on load,
            so the walkthrough can start from a known screen.
          </p>
        </section>

        <section className="detail-region">
          <div className="region-title">
            <div>
              <p className="instructor-eyebrow">Honesty</p>
              <h2>What is on these screens</h2>
            </div>
          </div>
          <p className="quiet-block">
            Every figure in this console is generated from a fixed seed and is labelled
            <strong> demo data</strong> in the header. Nothing here is a measurement of a real
            class, and no number on these screens should be quoted as a result.
          </p>
          <ul className="fact-list">
            <li><span>seed</span><strong>{mockData.seed}</strong></li>
            <li><span>generated at</span><strong>{dayMonthTime(mockData.generatedAt)}</strong></li>
            <li><span>students</span><strong>{stats.students}</strong></li>
            <li><span>submissions</span><strong>{mockData.submissions.length}</strong></li>
            <li><span>assistance requests</span><strong>{stats.hintEvents}</strong></li>
            <li><span>requests withheld</span><strong>{stats.blockedHints}</strong></li>
            <li><span>session events</span><strong>{mockData.sessionEvents.length}</strong></li>
            <li><span>concept traces</span><strong>{mockData.masteryTraces.length}</strong></li>
          </ul>
          <p className="quiet-block">
            The measured leakage numbers live in <code>docs/EVIDENCE.md</code> and are produced by
            <code> spike/</code>, not by this app.
          </p>
        </section>
      </div>
    </section>
  )
}
