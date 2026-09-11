import { useMemo, useState, type DragEvent, type FormEvent } from 'react'
import { ManualViewer } from '../components/ManualViewer'
import { Markdown } from '../components/Markdown'
import { mockData } from '../mock/data'
import { count, dayMonth, dayMonthTime, fileSize } from './format'
import { labStats } from './selectors'
import { notify } from '../state/toast'
import { useCourse } from '../state/useCourse'
import type { KnowledgeComponentId, Lab, ManualMeta } from '../types'

type PendingUpload = {
  fileName: string
  progress: number
}

const emptyStarter = `#include <iostream>

int main() {
    return 0;
}
`

const STATUS_NOTE: Record<Lab['status'], string> = {
  draft: 'Students cannot see this lab yet.',
  open: 'Students can work on this lab and submit attempts.',
  closed: 'Students can still read it and ask for hints; attempts are no longer collected.',
}

function fileKind(name: string) {
  if (name.endsWith('.pdf')) return 'pdf'
  if (name.endsWith('.docx')) return 'docx'
  if (name.endsWith('.md')) return 'md'
  return null
}

function LabRow({ lab, manuals, submissions, selected, onSelect }: {
  lab: Lab
  manuals: ManualMeta[]
  submissions: number
  selected: boolean
  onSelect: () => void
}) {
  const attachedManuals = manuals.filter((manual) => manual.labId === lab.id)

  return (
    <button className={selected ? 'lab-row active' : 'lab-row'} onClick={onSelect} data-testid="lab-row">
      <span>Lab {lab.number}: {lab.title}</span>
      <em className={`status-chip is-${lab.status}`}>{lab.status}</em>
      <small>due {dayMonth(lab.dueAt)} · {count(submissions, 'submission')} · {count(attachedManuals.length, 'manual')}</small>
    </button>
  )
}

export function LabsManuals() {
  const {
    labs, manuals, manualFiles, policies, currentLab, sessionSubmissions, sessionHints,
    createLab, addManual, removeManual, updatePolicy, setCurrentLab, setLabStatus, deleteLab,
  } = useCourse()
  const [openManual, setOpenManual] = useState<ManualMeta | null>(null)
  const [selectedLabId, setSelectedLabId] = useState(currentLab?.id ?? labs[0]?.id ?? '')
  const selectedLab = labs.find((lab) => lab.id === selectedLabId) ?? labs[0] ?? mockData.labs[0]
  // Read this lab's own policy, not whichever lab happens to be in the student view.
  const selectedPolicy = policies.find((policy) => policy.labId === selectedLab.id)
    ?? { labId: selectedLab.id, maxHintLevel: 4 as const, similarityThreshold: 0.6, escalationAllowed: true }
  const selectedManuals = manuals.filter((manual) => manual.labId === selectedLab.id)
  const [title, setTitle] = useState('')
  const [statement, setStatement] = useState('')
  const [dueAt, setDueAt] = useState('2026-10-21T17:00')
  const [starterCode, setStarterCode] = useState(emptyStarter)
  const [kcIds, setKcIds] = useState<KnowledgeComponentId[]>(['bst-invariants'])
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null)
  const missing = [
    !title.trim() && 'a title',
    !statement.trim() && 'a statement',
    !starterCode.trim() && 'starter code',
    !kcIds.length && 'at least one knowledge component',
  ].filter(Boolean) as string[]
  const canCreate = missing.length === 0

  const labOptions = useMemo(() => [...labs].sort((a, b) => b.number - a.number), [labs])
  const stats = useMemo(() => labStats(selectedLab.id, sessionSubmissions, labs, sessionHints), [labs, selectedLab.id, sessionHints, sessionSubmissions])
  const isSeeded = mockData.labs.some((lab) => lab.id === selectedLab.id)
  const isInStudentView = currentLab?.id === selectedLab.id

  const toggleKc = (id: KnowledgeComponentId) => {
    setKcIds((current) => (
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    ))
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canCreate) return
    const lab = createLab({
      title: title.trim(),
      statement: statement.trim(),
      kcIds,
      dueAt: new Date(dueAt).toISOString(),
      starterCode,
    })
    setSelectedLabId(lab.id)
    setTitle('')
    setStatement('')
    setStarterCode(emptyStarter)
    notify(`Lab ${lab.number} created and opened in the student view`)
  }

  const handleFile = (file: File | undefined) => {
    if (!file) return
    if (!fileKind(file.name)) {
      notify('That file type is not accepted. Attach a .pdf, .md or .docx.')
      return
    }
    setPendingUpload({ fileName: file.name, progress: 0 })
    window.setTimeout(() => setPendingUpload({ fileName: file.name, progress: 48 }), 180)
    window.setTimeout(() => {
      addManual({ labId: selectedLab.id, file })
      setPendingUpload({ fileName: file.name, progress: 100 })
      notify(`${file.name} attached to Lab ${selectedLab.number}`)
      window.setTimeout(() => setPendingUpload(null), 350)
    }, 420)
  }

  const drop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    handleFile(event.dataTransfer.files[0])
  }

  return (
    <section className="labs-page" data-testid="labs-page">
      <div className="overview-heading">
        <div>
          <p className="instructor-eyebrow">Course material</p>
          <h1>Labs &amp; Manuals</h1>
        </div>
        <p>
          {currentLab
            ? `Student view is on Lab ${currentLab.number}: ${currentLab.title}`
            : 'Students pick from their own lab list'}
        </p>
      </div>

      <div className="labs-grid">
        <section className="detail-region lab-list-region">
          <div className="region-title">
            <div>
              <p className="instructor-eyebrow">Lab list</p>
              <h2>{labs.length} labs</h2>
            </div>
          </div>
          <div className="lab-list">
            {labOptions.map((lab) => (
              <LabRow
                key={lab.id}
                lab={lab}
                manuals={manuals}
                submissions={
                  mockData.submissions.filter((row) => row.labId === lab.id).length
                  + sessionSubmissions.filter((row) => row.labId === lab.id).length
                }
                selected={lab.id === selectedLab.id}
                onSelect={() => setSelectedLabId(lab.id)}
              />
            ))}
          </div>
        </section>

        <div className="lab-detail-column">
          <section className="detail-region stats-region" data-testid="lab-stats">
            <div className="region-title">
              <div>
                <p className="instructor-eyebrow">Lab {selectedLab.number}</p>
                <h2>{selectedLab.title}</h2>
              </div>
              <button
                className="secondary-action"
                onClick={() => {
                  setCurrentLab(selectedLab.id)
                  notify(`Students now open Lab ${selectedLab.number}: ${selectedLab.title}`)
                }}
                disabled={isInStudentView}
                data-testid="set-current-lab"
              >
                {isInStudentView ? 'In the student view' : 'Use in student view'}
              </button>
            </div>
            <div className="lab-stat-grid">
              <div><span>attempts</span><strong>{stats.attempts}</strong></div>
              <div><span>all tests passed</span><strong>{stats.passed}</strong></div>
              <div><span>tests need review</span><strong>{stats.needReview}</strong></div>
              <div><span>compile needs attention</span><strong>{stats.compileIssues}</strong></div>
              <div><span>median time on task</span><strong>{stats.medianMinutes} min</strong></div>
              <div><span>assistance withheld</span><strong>{stats.withheldHints}</strong></div>
            </div>
            {stats.fastestPass && (
              <p className="quiet-block">
                Fastest pass: {stats.fastestPass.student.displayName} at {stats.fastestPass.submission.timeOnTaskMin} minutes
                on {dayMonth(stats.fastestPass.submission.timestamp)}.
              </p>
            )}
            <div className="lab-controls">
              <label>
                <span className="form-label">Status</span>
                <select
                  className="sel"
                  value={selectedLab.status}
                  onChange={(event) => {
                    const status = event.target.value as Lab['status']
                    setLabStatus(selectedLab.id, status)
                    notify(`Lab ${selectedLab.number} is now ${status}`)
                  }}
                  data-testid="lab-status"
                >
                  <option value="draft">draft</option>
                  <option value="open">open</option>
                  <option value="closed">closed</option>
                </select>
              </label>
              <p className="quiet-block">{STATUS_NOTE[selectedLab.status]}</p>
              <button
                className="secondary-action danger"
                data-testid="remove-lab"
                onClick={() => {
                  deleteLab(selectedLab.id)
                  notify(`Lab ${selectedLab.number} removed. Reset demo brings it back.`)
                }}
                disabled={labs.length <= 1}
              >
                {isSeeded ? 'Hide from the demo' : 'Delete this lab'}
              </button>
            </div>
          </section>

          <section className="detail-region upload-region">
            <div className="region-title">
              <div>
                <p className="instructor-eyebrow">Reference material</p>
                <h2>{count(selectedManuals.length, 'manual')} attached</h2>
              </div>
            </div>
            <label className="drop-zone" onDragOver={(event) => event.preventDefault()} onDrop={drop}>
              <input type="file" accept=".pdf,.md,.docx" onChange={(event) => handleFile(event.target.files?.[0])} />
              <span>Drop .pdf, .md or .docx here</span>
              <small>or click to choose a file</small>
              <small>Files stay in memory; only metadata is saved.</small>
            </label>
            {pendingUpload && (
              <div className="upload-progress" data-testid="upload-progress">
                <span>{pendingUpload.fileName}</span>
                <i><b style={{ width: `${pendingUpload.progress}%` }} /></i>
                <strong>{pendingUpload.progress}%</strong>
              </div>
            )}
            <div className="manual-cards" data-testid="manual-cards">
              {selectedManuals.length ? selectedManuals.map((manual) => (
                <div key={manual.id} className="manual-card">
                  <span>{manual.name}</span>
                  <small>{manual.type} / {fileSize(manual.sizeBytes)} / {dayMonthTime(manual.uploadedAt)}</small>
                  <div className="manual-actions">
                    <button className="linkbtn" onClick={() => setOpenManual(manual)} data-testid="view-manual">View</button>
                    <button
                      className="linkbtn"
                      onClick={() => {
                        removeManual(manual.id)
                        notify(`${manual.name} removed from Lab ${selectedLab.number}`)
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )) : <p className="sentence-empty">Nothing attached yet. Students see reference material in their problem pane.</p>}
            </div>
          </section>

          <section className="detail-region policy-region">
            <div className="region-title">
              <div>
                <p className="instructor-eyebrow">Disclosure policy</p>
                <h2>Lab {selectedLab.number}</h2>
              </div>
            </div>
            <label>
              <span>Max hint level: {selectedPolicy.maxHintLevel}</span>
              <input
                type="range"
                min="1"
                max="4"
                value={selectedPolicy.maxHintLevel}
                onChange={(event) => updatePolicy(selectedLab.id, { maxHintLevel: Number(event.target.value) as 1 | 2 | 3 | 4 })}
                data-testid="max-level"
              />
            </label>
            <label>
              <span>Similarity threshold: {selectedPolicy.similarityThreshold.toFixed(2)}</span>
              <input
                type="range"
                min="0.4"
                max="0.8"
                step="0.01"
                value={selectedPolicy.similarityThreshold}
                onChange={(event) => updatePolicy(selectedLab.id, { similarityThreshold: Number(event.target.value) })}
              />
            </label>
            <label className="toggle-line">
              <input
                type="checkbox"
                checked={selectedPolicy.escalationAllowed}
                onChange={(event) => updatePolicy(selectedLab.id, { escalationAllowed: event.target.checked })}
              />
              <span>Allow students to request escalation</span>
            </label>
            <p className="quiet-block">
              The policy chooses the level. The guardrail then measures what came back and withholds
              anything scoring above {selectedPolicy.similarityThreshold.toFixed(2)} against the reference solution.
            </p>
          </section>
        </div>

        <form className="detail-region lab-form-region" onSubmit={submit}>
          <div className="region-title">
            <div>
              <p className="instructor-eyebrow">Create lab</p>
              <h2>Authoring form</h2>
            </div>
          </div>
          <label>
            <span>Title</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="BST rotations practice" />
          </label>
          <label>
            <span>Statement</span>
            <textarea value={statement} onChange={(event) => setStatement(event.target.value)} placeholder="Describe the task, constraints and expected behavior." rows={6} />
          </label>
          <div>
            <span className="form-label">Knowledge components</span>
            <div className="kc-select">
              {mockData.knowledgeComponents.map((kc) => (
                <label key={kc.id}>
                  <input type="checkbox" checked={kcIds.includes(kc.id)} onChange={() => toggleKc(kc.id)} />
                  <span>{kc.shortName}</span>
                </label>
              ))}
            </div>
          </div>
          <label>
            <span>Due date</span>
            <input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} />
          </label>
          <label>
            <span>Starter code</span>
            <textarea value={starterCode} onChange={(event) => setStarterCode(event.target.value)} rows={6} />
          </label>
          <div>
            <span className="form-label">Statement preview</span>
            <div className="markdown-preview">
              <Markdown text={statement} empty="The statement preview will appear as you type." />
            </div>
          </div>
          <button className="primary-action" disabled={!canCreate} type="submit" data-testid="create-lab">
            Create lab
          </button>
          <p className="quiet-block">
            {canCreate
              ? 'The lab opens immediately and becomes the student view. It borrows the built-in hint ladder until it has one of its own.'
              : `Still needed: ${missing.join(', ')}.`}
          </p>
        </form>
      </div>
      {openManual && (
        <ManualViewer
          manual={openManual}
          file={manualFiles[openManual.id]}
          onClose={() => setOpenManual(null)}
        />
      )}
    </section>
  )
}
