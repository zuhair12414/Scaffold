// Derived views over the seeded dataset. Every instructor screen reads its
// numbers from here, so a figure that appears on two screens is the same
// computation — not two that drifted apart.
import { mockData } from '../mock/data'
import type {
  HintAuditEvent,
  KnowledgeComponent,
  KnowledgeComponentId,
  Lab,
  MasteryPoint,
  Student,
  Submission,
} from '../types'

export const LOW_MASTERY = 0.35

export type StudentRow = {
  student: Student
  masteryByKc: Record<KnowledgeComponentId, number>
  correctnessMean: number
  verifiedMean: number
  gap: number
  submissions: number
  labsPassed: number
  minutesOnTask: number
  activeLabMinutes: number
  lastActivity: string
}

function last(points: MasteryPoint[]) {
  return points[points.length - 1]
}

export function currentLab(): Lab {
  return mockData.labs.find((lab) => lab.status === 'open') ?? mockData.labs[mockData.labs.length - 1]
}

export function labById(labId: string) {
  return mockData.labs.find((lab) => lab.id === labId)
}

export function labLabel(labId: string) {
  const lab = labById(labId)
  return lab ? `Lab ${lab.number}: ${lab.title}` : labId
}

export function labShort(labId: string) {
  const lab = labById(labId)
  return lab ? `Lab ${lab.number}` : labId
}

export function kcById(kcId: KnowledgeComponentId) {
  return mockData.knowledgeComponents.find((kc) => kc.id === kcId) as KnowledgeComponent
}

export function studentById(studentId: string) {
  return mockData.students.find((student) => student.id === studentId)
}

export function studentName(studentId: string) {
  return studentById(studentId)?.displayName ?? studentId
}

export function mean(values: number[]) {
  if (!values.length) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

let cachedRows: StudentRow[] | null = null

export function studentRows(): StudentRow[] {
  if (cachedRows) return cachedRows
  const openLab = currentLab()
  cachedRows = mockData.students.map((student) => {
    const traces = mockData.masteryTraces.filter((trace) => trace.studentId === student.id)
    const masteryByKc = Object.fromEntries(
      traces.map((trace) => [trace.kcId, last(trace.telemetryAdjusted).value]),
    ) as Record<KnowledgeComponentId, number>
    const submissions = mockData.submissions.filter((submission) => submission.studentId === student.id)
    return {
      student,
      masteryByKc,
      correctnessMean: mean(traces.map((trace) => last(trace.correctnessOnly).value)),
      verifiedMean: mean(traces.map((trace) => last(trace.telemetryAdjusted).value)),
      gap: mean(traces.map((trace) => last(trace.correctnessOnly).value - last(trace.telemetryAdjusted).value)),
      submissions: submissions.length,
      labsPassed: submissions.filter((submission) => submission.status === 'passed').length,
      minutesOnTask: submissions.reduce((sum, submission) => sum + submission.timeOnTaskMin, 0),
      activeLabMinutes: submissions
        .filter((submission) => submission.labId === openLab.id)
        .reduce((sum, submission) => sum + submission.timeOnTaskMin, 0),
      lastActivity: submissions.reduce((latest, submission) => (
        submission.timestamp > latest ? submission.timestamp : latest
      ), ''),
    }
  })
  return cachedRows
}

export function studentRow(studentId: string) {
  return studentRows().find((row) => row.student.id === studentId)
}

export function attentionRows() {
  return studentRows()
    .filter((row) => row.student.divergent)
    .sort((a, b) => b.gap - a.gap)
}

export type KcStat = {
  kc: KnowledgeComponent
  values: number[]
  mean: number
  below: StudentRow[]
  labs: Lab[]
  meanByLab: { lab: Lab; value: number }[]
  assistanceShare: number
  assistanceEvents: number
}

export function kcStat(kcId: KnowledgeComponentId): KcStat {
  const rows = studentRows()
  const kc = kcById(kcId)
  const values = rows.map((row) => row.masteryByKc[kcId])
  const labs = mockData.labs.filter((lab) => lab.kcIds.includes(kcId))
  const labIds = new Set(labs.map((lab) => lab.id))
  const assistanceEvents = mockData.hintAudit.filter((event) => labIds.has(event.labId)).length
  const traces = mockData.masteryTraces.filter((trace) => trace.kcId === kcId)
  return {
    kc,
    values,
    mean: mean(values),
    below: rows.filter((row) => row.masteryByKc[kcId] < LOW_MASTERY).sort((a, b) => a.masteryByKc[kcId] - b.masteryByKc[kcId]),
    labs,
    meanByLab: mockData.labs.map((lab, index) => ({
      lab,
      value: mean(traces.map((trace) => trace.telemetryAdjusted[index].value)),
    })),
    assistanceEvents,
    assistanceShare: mockData.hintAudit.length ? assistanceEvents / mockData.hintAudit.length : 0,
  }
}

export function kcMeans() {
  return mockData.knowledgeComponents
    .map((kc) => ({ kc, value: mean(studentRows().map((row) => row.masteryByKc[kc.id])) }))
    .sort((a, b) => a.value - b.value)
}

export type SubmissionRow = {
  submission: Submission
  student: Student
  lab: Lab
  hints: HintAuditEvent[]
  live: boolean
}

let cachedSubmissionRows: SubmissionRow[] | null = null

function toRow(submission: Submission, live: boolean): SubmissionRow {
  return {
    submission,
    student: studentById(submission.studentId) as Student,
    lab: labById(submission.labId) as Lab,
    hints: mockData.hintAudit.filter((event) => (
      event.studentId === submission.studentId && event.labId === submission.labId
    )),
    live,
  }
}

// `live` rows are attempts submitted from the student view in this browser. They
// are the only rows that did not come from the seed, and every screen labels them.
export function submissionRows(live: Submission[] = []): SubmissionRow[] {
  if (!cachedSubmissionRows) cachedSubmissionRows = mockData.submissions.map((row) => toRow(row, false))
  if (!live.length) return cachedSubmissionRows
  return [...cachedSubmissionRows, ...live.filter((row) => labById(row.labId) && studentById(row.studentId)).map((row) => toRow(row, true))]
}

export type SubmissionStats = {
  attempts: number
  passed: number
  needReview: number
  compileIssues: number
  meanMinutes: number
  medianMinutes: number
  fastestPass: SubmissionRow | null
  withheldHints: number
}

export function submissionStats(rows: SubmissionRow[]): SubmissionStats {
  const minutes = rows.map((row) => row.submission.timeOnTaskMin).sort((a, b) => a - b)
  const passes = rows.filter((row) => row.submission.status === 'passed')
  return {
    attempts: rows.length,
    passed: passes.length,
    needReview: rows.filter((row) => row.submission.status === 'tests_failing').length,
    compileIssues: rows.filter((row) => row.submission.status === 'compile_issue').length,
    meanMinutes: Math.round(mean(minutes)),
    medianMinutes: minutes.length ? minutes[Math.floor(minutes.length / 2)] : 0,
    fastestPass: passes.reduce<SubmissionRow | null>((best, row) => (
      !best || row.submission.timeOnTaskMin < best.submission.timeOnTaskMin ? row : best
    ), null),
    withheldHints: rows.reduce((sum, row) => sum + row.hints.filter((hint) => hint.blocked).length, 0),
  }
}

export function labStats(labId: string, live: Submission[] = []) {
  return submissionStats(submissionRows(live).filter((row) => row.submission.labId === labId))
}

export function hintEvents(live: HintAuditEvent[] = []) {
  return [...mockData.hintAudit, ...live].sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}

export function overviewStats() {
  const rows = studentRows()
  const weakest = kcMeans()[0]
  return {
    students: rows.length,
    struggling: rows.filter((row) => row.student.status === 'struggling').length,
    divergent: attentionRows().length,
    weakest,
    gradedLabs: mockData.labs.filter((lab) => lab.status === 'closed').length,
    blockedHints: mockData.hintAudit.filter((event) => event.blocked).length,
    hintEvents: mockData.hintAudit.length,
  }
}
