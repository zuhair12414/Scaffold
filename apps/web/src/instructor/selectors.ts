// Derived views over the seeded dataset. Every instructor screen reads its
// numbers from here, so a figure that appears on two screens is the same
// computation — not two that drifted apart.
import { mockData } from '../mock/data'
import { mastery, percent } from './format'
import { questionsForLab, type LabQuestion } from '../mock/labQuestions'
import type {
  ChatTurn,
  HintAuditEvent,
  SessionEvent,
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

// ---------------------------------------------------------------------------
// Per question
// ---------------------------------------------------------------------------

export function questionsOf(lab: Lab) {
  return questionsForLab(lab)
}

export function questionById(questionId: string, labs: Lab[] = mockData.labs): LabQuestion | undefined {
  for (const lab of labs) {
    const found = questionsForLab(lab).find((question) => question.id === questionId)
    if (found) return found
  }
  return undefined
}

export function questionLabel(questionId: string, labs: Lab[] = mockData.labs) {
  const question = questionById(questionId, labs)
  return question ? `Q${question.number} · ${question.title}` : questionId
}

export type QuestionStat = {
  question: LabQuestion
  rows: SubmissionRow[]
  stats: SubmissionStats
  passRate: number
  assistance: number
  withheld: number
  lowVerified: number
  insight: string
}

export function questionStats(lab: Lab, live: Submission[] = [], hints: HintAuditEvent[] = mockData.hintAudit): QuestionStat[] {
  const rows = submissionRows(live, [lab], hints).filter((row) => row.submission.labId === lab.id)
  const classMedian = submissionStats(rows).medianMinutes
  return questionsForLab(lab).map((question) => {
    const questionRows = rows.filter((row) => row.submission.questionId === question.id)
    const stats = submissionStats(questionRows)
    const assistance = hints.filter((hint) => hint.questionId === question.id).length
    const withheld = hints.filter((hint) => hint.questionId === question.id && hint.blocked).length
    const lowVerified = questionRows.filter((row) => verifiedMasteryVerdict(row, classMedian).flagged).length
    const passRate = stats.attempts ? stats.passed / stats.attempts : 0
    const insight = !stats.attempts
      ? 'No attempts yet.'
      : lowVerified
        ? `${stats.passed} of ${stats.attempts} pass, but ${lowVerified} ${lowVerified === 1 ? 'attempt pairs a pass with' : 'attempts pair a pass with'} low verified mastery. Worth reading beside the telemetry.`
        : passRate < 0.5
          ? `Only ${stats.passed} of ${stats.attempts} pass and the median run is ${stats.medianMinutes} minutes. This is where the section is stuck.`
          : `${stats.passed} of ${stats.attempts} pass at a median of ${stats.medianMinutes} minutes. ${withheld} requests were withheld by the guardrail.`
    return { question, rows: questionRows, stats, passRate, assistance, withheld, lowVerified, insight }
  })
}

// ---------------------------------------------------------------------------
// Correct submission, low verified mastery
// ---------------------------------------------------------------------------

export type MasteryVerdict = {
  flagged: boolean
  headline: string
  reasons: string[]
  verifiedMean: number
  correctnessMean: number
  classMedianMinutes: number
  minutes: number
  ratio: number
}

// The rule, stated once and applied everywhere. It reads three measured things
// and never reads intent: a pass, an adjusted estimate that has not moved, and a
// session much shorter than the section's. It surfaces evidence for a human. It
// is not an accusation and it is never shown as one (GLOSSARY, D9).
export function verifiedMasteryVerdict(row: SubmissionRow, classMedianMinutes: number): MasteryVerdict {
  const student = studentRow(row.student.id)
  const question = questionById(row.submission.questionId)
  const kcIds = question?.kcIds ?? row.lab.kcIds
  const verified = student
    ? mean(kcIds.map((kcId) => student.masteryByKc[kcId] ?? 0))
    : 0
  const correctness = student?.correctnessMean ?? 0
  const minutes = row.submission.timeOnTaskMin
  const ratio = classMedianMinutes ? minutes / classMedianMinutes : 1
  const passed = row.submission.status === 'passed'
  const pasted = mockData.sessionEvents.find((event) => (
    event.studentId === row.student.id && event.questionId === row.submission.questionId && event.kind === 'paste'
  ))

  const reasons: string[] = []
  if (passed) reasons.push(`All ${row.submission.testsPassed} tests passed on this attempt.`)
  if (verified < 0.45) reasons.push(`Adjusted mastery across this question's concepts is ${verified.toFixed(2)}, against a correctness-only estimate of ${correctness.toFixed(2)}.`)
  if (ratio <= 0.5) reasons.push(`Time on task was ${minutes} minutes against a class median of ${classMedianMinutes} for this lab.`)
  if (pasted) reasons.push(`A paste event was recorded before the first compile: ${pasted.detail}`)

  const flagged = passed && verified < 0.45 && ratio <= 0.5
  return {
    flagged,
    headline: flagged
      ? 'Correct submission, low verified mastery'
      : passed
        ? 'Correct submission, mastery estimate agrees'
        : 'Attempt still in progress',
    reasons,
    verifiedMean: verified,
    correctnessMean: correctness,
    classMedianMinutes,
    minutes,
    ratio,
  }
}

export function telemetryFor(studentId: string, questionId: string): SessionEvent[] {
  return mockData.sessionEvents
    .filter((event) => event.studentId === studentId && event.questionId === questionId)
    .sort((a, b) => a.at.localeCompare(b.at))
}

export function chatFor(studentId: string, questionId: string, live: ChatTurn[] = []): ChatTurn[] {
  return [...mockData.chats, ...live]
    .filter((turn) => turn.studentId === studentId && turn.questionId === questionId)
    .sort((a, b) => a.at.localeCompare(b.at))
}

// ---------------------------------------------------------------------------
// Class-level views, for the Overview's easy mode
// ---------------------------------------------------------------------------

export type ClassPoint = {
  lab: Lab
  correctness: number
  adjusted: number
}

// The thesis at class scale: what correctness says the section knows, against
// what the adjusted estimate says, lab by lab.
export function classSeries(scope?: SelectorScope, studentIds?: string[]): ClassPoint[] {
  const labs = scopedLabs(scope)
  const traces = studentIds
    ? mockData.masteryTraces.filter((trace) => studentIds.includes(trace.studentId))
    : mockData.masteryTraces
  return mockData.labs.map((lab, index) => ({
    lab: labs.find((item) => item.id === lab.id) ?? lab,
    correctness: mean(traces.map((trace) => trace.correctnessOnly[index].value)),
    adjusted: mean(traces.map((trace) => trace.telemetryAdjusted[index].value)),
  }))
}

export type LabProgress = {
  lab: Lab
  attempts: number
  passed: number
  needReview: number
  compileIssues: number
  medianMinutes: number
  withheld: number
  lowVerified: number
}

export function labProgress(scope?: SelectorScope): LabProgress[] {
  const labs = scopedLabs(scope).filter((lab) => lab.status !== 'draft')
  const hints = scopedHints(scope)
  const live = scope?.submissions ?? []
  return labs.map((lab) => {
    const rows = submissionRows(live, labs, hints).filter((row) => row.submission.labId === lab.id)
    const stats = submissionStats(rows)
    const lowVerified = rows.filter((row) => verifiedMasteryVerdict(row, stats.medianMinutes).flagged).length
    return {
      lab,
      attempts: stats.attempts,
      passed: stats.passed,
      needReview: stats.needReview,
      compileIssues: stats.compileIssues,
      medianMinutes: stats.medianMinutes,
      withheld: hints.filter((hint) => hint.labId === lab.id && hint.blocked).length,
      lowVerified,
    }
  })
}

export type AssistanceSplit = {
  total: number
  shown: number
  withheld: number
  students: number
}

export function assistanceSplit(scope?: SelectorScope): AssistanceSplit {
  const hints = scopedHints(scope)
  return {
    total: hints.length,
    shown: hints.filter((hint) => !hint.blocked).length,
    withheld: hints.filter((hint) => hint.blocked).length,
    students: new Set(hints.map((hint) => hint.studentId)).size,
  }
}

// The one-line read on a concept, shown wherever that concept is opened.
export function suggestedAction(kcId: KnowledgeComponentId) {
  const stat = kcStat(kcId)
  const ranked = kcMeans()
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
