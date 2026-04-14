import { useMemo, useState } from 'react'
import AttendanceTable from '../utils/AttendanceTable.jsx'
import Cards from '../components/cards.jsx'


function Attendance({ attendance, session, sessionLoading, sessionMessage, setPage, setAttendance }) {
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
      <h1>Attendance</h1>

      <div className="session-summary card">
        <p><strong>Session:</strong> {session?.session_id ?? 'No active session'}</p>
        <p><strong>Status:</strong> {session?.status ?? 'inactive'}</p>
        <p><strong>Updated:</strong> {sessionLoading ? 'Refreshing...' : 'Live every 5 seconds'}</p>
        {sessionMessage ? <p className="session-message">{sessionMessage}</p> : null}
      </div>

      <Cards text="Total Students" num={totals.total} />
      <Cards text="Present Today" num={totals.present} />
      <Cards text="Awaiting Confirm" num={totals.awaitingConfirm} />
      <Cards text="Pending" num={totals.absent} />

      <div className="search-container">
        <input
          className="search"
          placeholder="Search by student name or number"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <button className="manage-button" onClick ={() => setMode(mode === 'manage' ? 'view' : 'manage')}>
        {mode === 'view' ? 'Manage Attendance' : 'Finish'}
      </button>

      <AttendanceTable students={filteredAttendance} mode={mode} setAttendance={setAttendance} />
    </div>
  )
}

export default Attendance
