import { useEffect, useRef } from 'react'
import { BrowserRouter, Navigate, NavLink, Outlet, Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import StudentIde from './StudentIde'
import { ToastHost } from './components/ToastHost'
import { Concepts } from './instructor/Concepts'
import { HintAudit } from './instructor/HintAudit'
import { LabsManuals } from './instructor/LabsManuals'
import { InstructorOverview } from './instructor/Overview'
import { Roster } from './instructor/Roster'
import { Settings } from './instructor/Settings'
import { StudentDetail } from './instructor/StudentDetail'
import { Submissions } from './instructor/Submissions'
import { CourseProvider } from './state/CourseState'
import { useCourse } from './state/useCourse'

const instructorNav = [
  { key: 'overview', label: 'Overview', path: '/instructor/overview' },
  { key: 'roster', label: 'Roster', path: '/instructor/roster' },
  { key: 'labs', label: 'Labs & Manuals', path: '/instructor/labs' },
  { key: 'submissions', label: 'Submissions', path: '/instructor/submissions' },
  { key: 'concepts', label: 'Concepts', path: '/instructor/concepts' },
  { key: 'hint-audit', label: 'Hint Audit', path: '/instructor/hint-audit' },
  { key: 'settings', label: 'Settings', path: '/instructor/settings' },
] as const

// ?demo=1 puts the console back on the rails: local labs, manuals and policy
// edits are dropped so a walkthrough always starts from the seeded state.
function DemoGate() {
  const [params, setParams] = useSearchParams()
  const { resetCourse } = useCourse()
  const applied = useRef(false)

  useEffect(() => {
    if (params.get('demo') !== '1' || applied.current) return
    applied.current = true
    resetCourse()
    const next = new URLSearchParams(params)
    next.delete('demo')
    setParams(next, { replace: true })
  }, [params, resetCourse, setParams])

  return null
}

function RoleShell() {
  const location = useLocation()
  const isInstructor = location.pathname.startsWith('/instructor')

  useEffect(() => {
    try {
      localStorage.setItem('scaffold:lastRoute', location.pathname)
    } catch {
      // storage can be unavailable; the route is not worth failing a render over
    }
  }, [location.pathname])

  return (
    <div className="role-shell" data-role={isInstructor ? 'instructor' : 'student'}>
      <DemoGate />
      <header className="role-header">
        <div className="role-brand">
          <strong>Scaffold</strong>
          <span>{isInstructor ? 'Instructor console' : 'Student IDE'}</span>
          <em className="demo-badge" title="Every figure on screen comes from the seeded mock dataset">Demo data</em>
        </div>
        <nav className="role-switch" aria-label="Demo role switcher">
          <span>Demo: view as</span>
          <NavLink to="/student" className={({ isActive }) => (isActive ? 'active' : undefined)}>
            Student
          </NavLink>
          <NavLink to="/instructor/overview" className={isInstructor ? 'active' : undefined}>
            Instructor
          </NavLink>
        </nav>
      </header>
      <div className="role-body">
        {isInstructor && (
          <aside className="instructor-nav" aria-label="Instructor navigation">
            {instructorNav.map((item) => (
              <NavLink key={item.key} to={item.path} className={({ isActive }) => (isActive ? 'active' : undefined)}>
                {item.label}
              </NavLink>
            ))}
          </aside>
        )}
        <main className="role-main">
          <Outlet />
        </main>
        <ToastHost />
      </div>
    </div>
  )
}

function NotFound() {
  const navigate = useNavigate()
  return (
    <section className="instructor-page">
      <p className="instructor-eyebrow">Nothing here</p>
      <h1>That screen is not part of the demo</h1>
      <p className="instructor-summary">
        The console has seven screens, all reachable from the left nav. Head back to the
        Overview and start again.
      </p>
      <button className="primary-action" onClick={() => navigate('/instructor/overview')}>Back to Overview</button>
    </section>
  )
}

export default function App() {
  return (
    <CourseProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/student" replace />} />
          <Route element={<RoleShell />}>
            <Route path="/student/*" element={<StudentIde />} />
            <Route path="/instructor" element={<Navigate to="/instructor/overview" replace />} />
            <Route path="/instructor/overview" element={<InstructorOverview />} />
            <Route path="/instructor/roster" element={<Roster />} />
            <Route path="/instructor/labs" element={<LabsManuals />} />
            <Route path="/instructor/submissions" element={<Submissions />} />
            <Route path="/instructor/concepts" element={<Concepts />} />
            <Route path="/instructor/hint-audit" element={<HintAudit />} />
            <Route path="/instructor/settings" element={<Settings />} />
            <Route path="/instructor/students/:studentId" element={<StudentDetail />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </CourseProvider>
  )
}
