import type { LabQuestion } from '../mock/labQuestions'
import type { Submission } from '../types'

type Props = {
  questions: LabQuestion[]
  activeId: string
  attempts: Submission[]
  onSelect: (questionId: string) => void
}

function state(question: LabQuestion, attempts: Submission[]) {
  const mine = attempts.filter((row) => row.questionId === question.id)
  if (!mine.length) return { label: 'not started', tone: 'idle' as const }
  if (mine.some((row) => row.status === 'passed')) return { label: 'passing', tone: 'pass' as const }
  return { label: `${mine.length} attempt${mine.length === 1 ? '' : 's'}`, tone: 'review' as const }
}

// One question expands, the rest stay collapsed. Switching question switches the
// whole workspace with it: the editor, the run output and the conversation.
export function QuestionList({ questions, activeId, attempts, onSelect }: Props) {
  return (
    <ol className="question-list" data-testid="question-list">
      {questions.map((question) => {
        const open = question.id === activeId
        const status = state(question, attempts)
        return (
          <li key={question.id} className={open ? 'is-open' : undefined}>
            <button
              className="question-head"
              onClick={() => onSelect(question.id)}
              aria-expanded={open}
              data-testid="question-head"
              data-question-id={question.id}
            >
              <span className="question-number">Q{question.number}</span>
              <span className="question-title">{question.title}</span>
              <em className={`question-state is-${status.tone}`}>{status.label}</em>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
