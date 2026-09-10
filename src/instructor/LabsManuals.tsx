import { useMemo, useState, type DragEvent, type FormEvent } from 'react'
import { ManualViewer } from '../components/ManualViewer'
import { mockData } from '../mock/data'
import { count, dayMonth, dayMonthTime, fileSize } from './format'
import { labStats } from './selectors'
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

function fileKind(name: string) {
  if (name.endsWith('.pdf')) return 'pdf'
  if (name.endsWith('.docx')) return 'docx'
  if (name.endsWith('.md')) return 'md'
  return null
}

function MarkdownPreview({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).filter((block) => block.trim())
  if (!blocks.length) return <p className="sentence-empty">The statement preview will appear as you type.</p>
  return (
    <div className="markdown-preview">
      {blocks.map((block, index) => (
        block.trim().startsWith('```')
          ? <pre key={index}>{block.replaceAll('```', '').trim()}</pre>
          : <p key={index}>{block.trim()}</p>
      ))}
    </div>
  )
}

function LabRow({ lab, manuals, submissions, selected, onSelect }: { lab: Lab; manuals: ManualMeta[]; submissions: number; selected: boolean; onSelect: () => void }) {
  const attachedManuals = manuals.filter((manual) => manual.labId === lab.id)

  return (
    <button className={selected ? 'lab-row active' : 'lab-row'} onClick={onSelect} data-testid="lab-row">
      <span>Lab {lab.number}: {lab.title}</span>
      <small>{lab.status} / due {dayMonth(lab.dueAt)}</small>
      <strong>{count(submissions, 'submission')} / {count(attachedManuals.length, 'manual')}</strong>
    </button>
  )
}

export function LabsManuals() {
  const {
    labs, manuals, manualFiles, currentLab, currentPolicy, sessionSubmissions,
    createLab, addManual, removeManual, updatePolicy, setCurrentLab, setLabStatus, deleteLab,
  } = useCourse()
  const [openManual, setOpenManual] = useState<ManualMeta | null>(null)
  const [selectedLabId, setSelectedLabId] = useState(currentLab?.id ?? labs[0].id)
  const selectedLab = labs.find((lab) => lab.id === selectedLabId) ?? labs[0]
  const selectedPolicy = currentPolicy?.labId === selectedLab.id
    ? currentPolicy
    : { labId: selectedLab.id, maxHintLevel: 4 as const, similarityThreshold: 0.6, escalationAllowed: true }
  const selectedManuals = manuals.filter((manual) => manual.labId === selectedLab.id)
  const [title, setTitle] = useState('')
  const [statement, setStatement] = useState('')
  const [dueAt, setDueAt] = useState('2026-10-21T17:00')
  const [starterCode, setStarterCode] = useState(emptyStarter)
  const [kcIds, setKcIds] = useState<KnowledgeComponentId[]>(['bst-invariants'])
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null)
  const canCreate = title.trim() && statement.trim() && starterCode.trim() && kcIds.length
  const currentLabLabel = currentLab
    ? `Student view is on Lab ${currentLab.number}: ${currentLab.title}`
    : 'Students pick from their own lab list'

  const labOptions = useMemo(() => [...labs].sort((a, b) => b.number - a.number), [labs])
  const stats = useMemo(() => labStats(selectedLab.id, sessionSubmissions), [selectedLab.id, sessionSubmissions])
  const isSeeded = mockData.labs.some((lab) => lab.id === selectedLab.id)

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
  }

  const handleFile = (file: File | undefined) => {
    if (!file || !fileKind(file.name)) return
    setPendingUpload({ fileName: file.name, progress: 0 })
    window.setTimeout(() => setPendingUpload({ fileName: file.name, progress: 48 }), 180)
    window.setTimeout(() => {
      addManual({ labId: selectedLab.id, file })
      setPendingUpload({ fileName: file.name, progress: 100 })
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
          <h1>Labs & Manuals</h1>
        </div>
        <p>{currentLabLabel}</p>
      </div>

      <div className="labs-grid">
        <section className="detail-region lab-list-region">
          <div className="region-title">
            <div>
              <p className="instructor-eyebrow">Lab list</p>
              <h2>Status and submissions</h2>
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
            <textarea value={statement} onChange={(event) => setStatement(event.target.value)} placeholder="Describe the task, constraints and expected behavior." rows={7} />
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
            <textarea value={starterCode} onChange={(event) => setStarterCode(event.target.value)} rows={7} />
          </label>
          <div>
            <span className="form-label">Markdown preview</span>
            <MarkdownPreview text={statement} />
          </div>
          <button className="primary-action" disabled={!canCreate} type="submit" data-testid="create-lab">
            Create lab
          </button>
        </form>

        <section className="detail-region stats-region" data-testid="lab-stats">
          <div className="region-title">
            <div>
              <p className="instructor-eyebrow">This lab</p>
              <h2>Submissions and assistance</h2>
            </div>
          </div>
          <ul className="fact-list">
            <li><span>attempts</span><strong>{stats.attempts}</strong></li>
            <li><span>all tests passed</span><strong>{stats.passed}</strong></li>
            <li><span>tests need review</span><strong>{stats.needReview}</strong></li>
            <li><span>compile needs attention</span><strong>{stats.compileIssues}</strong></li>
            <li><span>median time on task</span><strong>{stats.medianMinutes} min</strong></li>
            <li><span>assistance withheld</span><strong>{stats.withheldHints}</strong></li>
            {stats.fastestPass && (
              <li>
                <span>fastest pass</span>
                <strong>{stats.fastestPass.student.displayName} / {stats.fastestPass.submission.timeOnTaskMin} min</strong>
              </li>
            )}
          </ul>
          <label className="status-row">
            <span className="form-label">Status</span>
            <select
              className="sel"
              value={selectedLab.status}
              onChange={(event) => setLabStatus(selectedLab.id, event.target.value as Lab['status'])}
              data-testid="lab-status"
            >
              <option value="draft">draft — students cannot see it</option>
              <option value="open">open — students can work on it</option>
              <option value="closed">closed — visible, no longer collected</option>
            </select>
          </label>
          <button
            className="secondary-action danger"
            data-testid="remove-lab"
            onClick={() => deleteLab(selectedLab.id)}
          >
            {isSeeded ? 'Hide from the demo' : 'Delete this lab'}
          </button>
          <p className="quiet-block">
            Removing is reversible: Settings → Reset demo, or a reload with ?demo=1, brings the
            seeded labs back.
          </p>
        </section>

        <section className="detail-region upload-region">
          <div className="region-title">
            <div>
              <p className="instructor-eyebrow">Upload manual</p>
              <h2>{selectedLab.title}</h2>
            </div>
          </div>
          <button className="secondary-action" onClick={() => setCurrentLab(selectedLab.id)} data-testid="set-current-lab">
            Use in student view
          </button>
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
                  <button className="linkbtn" onClick={() => removeManual(manual.id)}>Remove</button>
                </div>
              </div>
            )) : <p className="sentence-empty">Attach a reference manual for this lab.</p>}
          </div>
        </section>

        <section className="detail-region policy-region">
          <div className="region-title">
            <div>
              <p className="instructor-eyebrow">Disclosure policy</p>
              <h2>{selectedLab.title}</h2>
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
            <span>Similarity threshold: {selectedPolicy.similarityThreshold}</span>
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
            <span>Allow student to request escalation</span>
          </label>
        </section>
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
