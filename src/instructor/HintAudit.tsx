import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockData } from '../mock/data'
import { dayMonthTime, percent } from './format'
import { hintEvents, labShort, studentName } from './selectors'
import { useCourse } from '../state/useCourse'
import type { HintAuditEvent } from '../types'

function Expanded({ event }: { event: HintAuditEvent }) {
  const navigate = useNavigate()
  return (
    <div className="submission-expanded" data-testid="hint-expanded">
      <div>
        <p className="form-label">Prompt context summary</p>
        <p className="quiet-block">{event.promptContextSummary}</p>
        <p className="form-label">Measured disclosure</p>
        <ul className="fact-list">
          <li><span>level released</span><strong>Level {event.level}</strong></li>
          <li><span>similarity to reference solution</span><strong>{event.similarity.toFixed(2)}</strong></li>
          <li><span>lab threshold</span><strong>{event.threshold.toFixed(2)}</strong></li>
          <li><span>decision</span><strong className={event.blocked ? 'is-blocked' : undefined}>{event.blocked ? 'withheld' : 'shown'}</strong></li>
        </ul>
      </div>
      <div>
        <p className="form-label">Text shown to the student</p>
        <p className="quiet-block">{event.shownText}</p>
        <p className="form-label">Text withheld by the guardrail</p>
        {event.withheldText
          ? <p className="quiet-block is-withheld">{event.withheldText}</p>
          : <p className="sentence-empty">Nothing was withheld for this request.</p>}
        <button className="secondary-action" onClick={() => navigate(`/instructor/students/${event.studentId}`)}>
          Open {studentName(event.studentId)}
        </button>
      </div>
    </div>
  )
}

export function HintAudit() {
  const { sessionHints } = useCourse()
  const events = useMemo(() => hintEvents(sessionHints), [sessionHints])
  const [labId, setLabId] = useState('all')
  const [blockedOnly, setBlockedOnly] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)

  const filtered = useMemo(() => events.filter((event) => (
    (labId === 'all' || event.labId === labId) && (!blockedOnly || event.blocked)
  )), [events, labId, blockedOnly])

  const blocked = events.filter((event) => event.blocked).length

  return (
    <section className="table-page" data-testid="hint-audit-page">
      <div className="overview-heading">
        <div>
          <p className="instructor-eyebrow">Hint policy</p>
          <h1>Hint Audit</h1>
        </div>
        <p>{blocked} of {events.length} requests withheld ({percent(blocked / Math.max(events.length, 1))})</p>
      </div>

      <div className="filter-bar" data-testid="hint-filters">
        <label>
          <span>Lab</span>
          <select className="sel" value={labId} onChange={(event) => setLabId(event.target.value)}>
            <option value="all">All labs</option>
            {mockData.labs.filter((lab) => lab.status !== 'draft').map((lab) => (
              <option key={lab.id} value={lab.id}>Lab {lab.number}: {lab.title}</option>
            ))}
          </select>
        </label>
        <label className="toggle-line">
          <input
            type="checkbox"
            checked={blockedOnly}
            onChange={(event) => setBlockedOnly(event.target.checked)}
            data-testid="blocked-only"
          />
          <span>Withheld only</span>
        </label>
        <p className="filter-note">
          The guardrail compares the drafted reply with the reference solution. The model never sees
          that solution. Rows marked <em>this session</em> are requests made from the student view in
          this browser; every other row is seeded.
        </p>
      </div>

      {filtered.length ? (
        <div className="data-table" data-testid="hint-table">
          <div className="data-head hint-grid">
            <span>Student</span>
            <span>Lab</span>
            <span>Requested</span>
            <span>Level</span>
            <span>Similarity</span>
            <span>Decision</span>
          </div>
          <div className="data-body">
            {filtered.map((event) => (
              <div key={event.id}>
                <button
                  className={'data-row hint-grid' + (openId === event.id ? ' active' : '')}
                  data-testid="hint-row"
                  data-blocked={event.blocked ? 'true' : 'false'}
                  onClick={() => setOpenId((current) => (current === event.id ? null : event.id))}
                >
                  <span>{studentName(event.studentId)}</span>
                  <span>{labShort(event.labId)}</span>
                  <span>{dayMonthTime(event.timestamp)}</span>
                  <span>Level {event.level}</span>
                  <span>{event.similarity.toFixed(2)} / {event.threshold.toFixed(2)}</span>
                  <span className={event.blocked ? 'is-blocked' : 'is-pass'}>
                    {event.blocked ? `withheld / ${event.reason}` : 'shown'}{event.id.startsWith('session-') ? ' · this session' : ''}
                  </span>
                </button>
                {openId === event.id && <Expanded event={event} />}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="sentence-empty">No request matches this filter. Clear the lab filter or turn off withheld-only.</p>
      )}
    </section>
  )
}
