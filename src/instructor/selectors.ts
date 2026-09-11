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

export type SelectorScope = {
  labs?: Lab[]
  submissions?: Submission[]
  hints?: HintAuditEvent[]
  currentLab?: Lab | null
}

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

function scopedLabs(scope?: SelectorScope) {
  return scope?.labs ?? mockData.labs
}

function scopedHints(scope?: SelectorScope) {
  const labs = scopedLabs(scope)
  const labIds = new Set(labs.map((lab) => lab.id))
  const live = scope?.hints ?? []
  return [...mockData.hintAudit, ...live].filter((event) => labIds.has(event.labId) && studentById(event.studentId))
}

function scopedSubmissions(scope?: SelectorScope) {
  const labs = scopedLabs(scope)
  const labIds = new Set(labs.map((lab) => lab.id))
  return [...mockData.submissions, ...(scope?.submissions ?? [])].filter((submission) => labIds.has(submission.labId))
}

export function currentLab(scope?: SelectorScope): Lab {
  const labs = scopedLabs(scope)
  if (scope?.currentLab && labs.some((lab) => lab.id === scope.currentLab?.id)) return scope.currentLab
  return labs.find((lab) => lab.status === 'open') ?? labs[labs.length - 1] ?? mockData.labs[mockData.labs.length - 1]
}

export function labById(labId: string, labs: Lab[] = mockData.labs) {
  return labs.find((lab) => lab.id === labId)
}

export function labLabel(labId: string, labs: Lab[] = mockData.labs) {
  const lab = labById(labId, labs)
  return lab ? `Lab ${lab.number}: ${lab.title}` : labId
}

export function labShort(labId: string, labs: Lab[] = mockData.labs) {
  const lab = labById(labId, labs)
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

export function studentRows(scope?: SelectorScope): StudentRow[] {
  const openLab = currentLab(scope)
  const submissionsSource = scopedSubmissions(scope)
  return mockData.students.map((student) => {
    const traces = mockData.masteryTraces.filter((trace) => trace.studentId === student.id)
    const masteryByKc = Object.fromEntries(
      traces.map((trace) => [trace.kcId, last(trace.telemetryAdjusted).value]),
    ) as Record<KnowledgeComponentId, number>
    const submissions = submissionsSource.filter((submission) => submission.studentId === student.id)
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
}

export function studentRow(studentId: string, scope?: SelectorScope) {
  return studentRows(scope).find((row) => row.student.id === studentId)
}

export function attentionRows(scope?: SelectorScope) {
  return studentRows(scope)
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

export function kcStat(kcId: KnowledgeComponentId, scope?: SelectorScope): KcStat {
  const rows = studentRows(scope)
  const kc = kcById(kcId)
  const values = rows.map((row) => row.masteryByKc[kcId])
  const labs = scopedLabs(scope)
  const allHints = scopedHints(scope)
  const exercisedLabs = labs.filter((lab) => lab.kcIds.includes(kcId))
  const labIds = new Set(exercisedLabs.map((lab) => lab.id))
  const assistanceEvents = allHints.filter((event) => labIds.has(event.labId)).length
  const traces = mockData.masteryTraces.filter((trace) => trace.kcId === kcId)
  return {
    kc,
    values,
    mean: mean(values),
    below: rows.filter((row) => row.masteryByKc[kcId] < LOW_MASTERY).sort((a, b) => a.masteryByKc[kcId] - b.masteryByKc[kcId]),
    labs: exercisedLabs,
    meanByLab: labs.flatMap((lab, index) => {
      const valuesForLab = traces.flatMap((trace) => {
        const point = trace.telemetryAdjusted[index]
        return point ? [point.value] : []
      })
      return valuesForLab.length ? [{ lab, value: mean(valuesForLab) }] : []
    }),
    assistanceEvents,
    assistanceShare: allHints.length ? assistanceEvents / allHints.length : 0,
  }
}

export function kcMeans(scope?: SelectorScope) {
  return mockData.knowledgeComponents
    .map((kc) => ({ kc, value: mean(studentRows(scope).map((row) => row.masteryByKc[kc.id])) }))
    .sort((a, b) => a.value - b.value)
}

export type SubmissionRow = {
  submission: Submission
  student: Student
  lab: Lab
  hints: HintAuditEvent[]
  live: boolean
}

function toRow(submission: Submission, live: boolean, labs: Lab[], hints: HintAuditEvent[]): SubmissionRow {
  return {
    submission,
    student: studentById(submission.studentId) as Student,
    lab: labById(submission.labId, labs) as Lab,
    hints: hints.filter((event) => (
      event.studentId === submission.studentId && event.labId === submission.labId
    )),
    live,
  }
}

// `live` rows are attempts submitted from the student view in this browser. They
// are the only rows that did not come from the seed, and every screen labels them.
export function submissionRows(live: Submission[] = [], labs: Lab[] = mockData.labs, hints: HintAuditEvent[] = mockData.hintAudit): SubmissionRow[] {
  const labIds = new Set(labs.map((lab) => lab.id))
  const seedRows = mockData.submissions
    .filter((row) => labIds.has(row.labId) && studentById(row.studentId))
    .map((row) => toRow(row, false, labs, hints))
  const liveRows = live
    .filter((row) => labIds.has(row.labId) && studentById(row.studentId))
    .map((row) => toRow(row, true, labs, hints))
  return [...seedRows, ...liveRows]
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

export function labStats(labId: string, live: Submission[] = [], labs: Lab[] = mockData.labs, hints: HintAuditEvent[] = mockData.hintAudit) {
  return submissionStats(submissionRows(live, labs, hints).filter((row) => row.submission.labId === labId))
}

export function hintEvents(live: HintAuditEvent[] = [], labs: Lab[] = mockData.labs) {
  const labIds = new Set(labs.map((lab) => lab.id))
  return [...mockData.hintAudit, ...live]
    .filter((event) => labIds.has(event.labId) && studentById(event.studentId))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}

export function overviewStats(scope?: SelectorScope) {
  const labs = scopedLabs(scope)
  const rows = studentRows(scope)
  const hints = hintEvents(scope?.hints ?? [], labs)
  const weakest = kcMeans(scope)[0]
  return {
    students: rows.length,
    struggling: rows.filter((row) => row.student.status === 'struggling').length,
    divergent: attentionRows(scope).length,
    weakest,
    gradedLabs: labs.filter((lab) => lab.status === 'closed').length,
    blockedHints: hints.filter((event) => event.blocked).length,
    hintEvents: hints.length,
  }
}
