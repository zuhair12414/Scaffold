import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockData } from '../mock/data'
import { questionsForLab } from '../mock/labQuestions'
import { useCourse } from '../state/useCourse'
import type { Lab } from '../types'

const DEMO_STUDENT_ID = 'student-31'

function dueLabel(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// The screen a student actually lands on: which lab, how much of it is done, and
// what is still open. Choosing one opens its workspace.
export function LabChooser() {
  const navigate = useNavigate()
  const { labs, currentLab, sessionSubmissions } = useCourse()

  const rows = useMemo(() => {
    const attempts = [...mockData.submissions, ...sessionSubmissions].filter((row) => row.studentId === DEMO_STUDENT_ID)
    return labs
      .filter((lab) => lab.status !== 'draft')
      .sort((a, b) => b.number - a.number)
      .map((lab: Lab) => {
        const questions = questionsForLab(lab)
        const done = questions.filter((question) => (
          attempts.some((row) => row.questionId === question.id && row.status === 'passed')
        )).length
        return { lab, questions, done }
      })
  }, [labs, sessionSubmissions])

  return (
    <section className="chooser-page" data-testid="lab-chooser">
      <div className="overview-heading">
        <div>
          <p className="instructor-eyebrow">CS2 Data Structures / lab section CS2-B</p>
          <h1>Your labs</h1>
        </div>
        <p>Signed in as Student #31</p>
      </div>

      <div className="chooser-grid">
        {rows.map(({ lab, questions, done }) => (
          <button
            key={lab.id}
            className={'chooser-card' + (lab.id === currentLab?.id ? ' is-current' : '')}
            onClick={() => navigate(`/student/${lab.id}`)}
            data-testid="chooser-card"
          >
            <header>
              <span className="chooser-number">Lab {lab.number}</span>
              <em className={`status-chip is-${lab.status}`}>{lab.status}</em>
            </header>
            <h2>{lab.title}</h2>
            <p>{lab.statement}</p>
            <ul className="chooser-questions">
              {questions.map((question) => (
                <li key={question.id}>
                  <span>Q{question.number}</span>
                  {question.title}
                </li>
              ))}
            </ul>
            <footer>
              <span className="chooser-progress" aria-label={`${done} of ${questions.length} questions passing`}>
                <i style={{ width: `${(done / questions.length) * 100}%` }} />
              </span>
              <small>{done} of {questions.length} passing · due {dueLabel(lab.dueAt)}</small>
            </footer>
          </button>
        ))}
      </div>
      <p className="table-note">
        A closed lab stays readable and the tutor still answers; attempts are no longer collected.
      </p>
    </section>
  )
}
