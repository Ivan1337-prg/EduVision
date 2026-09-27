import { useMemo, useState } from 'react'
import AttendanceTable from '../utils/AttendanceTable.jsx'
import Cards from '../components/cards.jsx'

function Attendance({ attendance, session, sessionLoading, sessionMessage, setAttendance }) {
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState('view')


  const filteredAttendance = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) {
      return attendance
    }

    return attendance.filter(student => {
      return (
        student.student_name.toLowerCase().includes(normalizedQuery) ||
        student.student_code.toLowerCase().includes(normalizedQuery)
      )
    })
  }, [attendance, query])

  const totals = useMemo(() => {
    return attendance.reduce(
      (summary, student) => {
        summary.total += 1
        if (student.status === 'confirmed' || student.status === 'present') {
          summary.present += 1
        }
        if (student.status === 'pending') {
          summary.absent += 1
        }
        if (student.status === 'present') {
          summary.awaitingConfirm += 1
        }
        return summary
      },
      { total: 0, present: 0, absent: 0, awaitingConfirm: 0 },
    )
  }, [attendance])

 

  return (
    <div>
      <div className="page-heading">
        <div><p className="eyebrow">Every student, accounted for</p><h1>Attendance Dashboard</h1><p className="page-copy">Follow your class check-ins as they happen.</p></div>
        <button className="manage-button" onClick={() => setMode(mode === 'manage' ? 'view' : 'manage')} aria-pressed={mode === 'manage'}>
          {mode === 'view' ? 'Manage Attendance' : 'Finish editing'}
        </button>
      </div>

      <div className="session-summary card">
        <p><strong>Session:</strong> {session?.session_id ?? 'No active session'}</p>
        <p><strong>Status:</strong> {session?.status ?? 'inactive'}</p>
        <p><strong>Updates:</strong> {sessionLoading ? 'Refreshing...' : session ? 'Live every 5 seconds' : 'Start a session to receive check-ins'}</p>
        {sessionMessage ? <p className="session-message">{sessionMessage}</p> : null}
      </div>

      <div className="stats-grid">
        <Cards text="Total Students" num={totals.total} />
        <Cards text="Present Today" num={totals.present} />
        <Cards text="Awaiting Confirm" num={totals.awaitingConfirm} />
        <Cards text="Pending" num={totals.absent} />
      </div>

      <section className="roster-panel" aria-label="Student attendance">
        <div className="search-container">
          <div><h2>Student roster</h2><p className="page-copy">{filteredAttendance.length} of {attendance.length} students</p></div>
          <label className="roster-search"><span className="sr-only">Search students</span>
          <input
            className="search"
            placeholder="Search by student name or number"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          </label>
        </div>
        {mode === 'manage' && <p className="edit-note" role="status">Status edits are temporary and may be replaced by the next live update.</p>}

        <AttendanceTable students={filteredAttendance} mode={mode} setAttendance={setAttendance}
          emptyMessage={query ? 'No students match your search.' : session ? 'Student records will appear here when available.' : 'Start a session from the dashboard to see your student roster.'} />
      </section>
    </div>
  )
}

export default Attendance
