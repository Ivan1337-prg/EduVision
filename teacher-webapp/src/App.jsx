import { useState } from 'react'
import './App.css'

const initialStudents = [
  { id: 1, name: 'Eneojo Unwuchola', status: 'Verified', firstCheck: true, secondCheck: true },
  { id: 2, name: 'Bryce Smith', status: 'Waiting', firstCheck: true, secondCheck: false },
  { id: 3, name: 'Taras Glushko', status: 'Waiting', firstCheck: false, secondCheck: false },
  { id: 4, name: 'Roman Macias', status: 'Late', firstCheck: false, secondCheck: false },
  { id: 5, name: 'Taron Osifo', status: 'Verified', firstCheck: true, secondCheck: true },
  { id: 6, name: 'Jordan Christopher Black', status: 'Waiting', firstCheck: true, secondCheck: false },
]

const navItems = ['Dashboard', 'Attendance', 'Logs', 'Settings']

function App() {
  const [students, setStudents] = useState(initialStudents)
  const [sessionActive, setSessionActive] = useState(true)

  const markCheck = (studentId, field) => {
    setStudents((currentStudents) =>
      currentStudents.map((student) => {
        if (student.id !== studentId) {
          return student
        }

        const updatedStudent = { ...student, [field]: !student[field] }

        if (!updatedStudent.firstCheck && updatedStudent.secondCheck) {
          updatedStudent.secondCheck = false
        }

        if (updatedStudent.firstCheck && updatedStudent.secondCheck) {
          updatedStudent.status = 'Verified'
        } else if (updatedStudent.firstCheck) {
          updatedStudent.status = 'Waiting'
        } else {
          updatedStudent.status = 'Late'
        }

        return updatedStudent
      }),
    )
  }

  const presentCount = students.filter((student) => student.firstCheck).length
  const verifiedCount = students.filter(
    (student) => student.firstCheck && student.secondCheck,
  ).length

  return (
    <main className="wireframe-shell">
      <header className="topbar">
        <div className="logo-box">
          <span className="logo-mark">EV</span>
          <div className="logo-copy">
            <strong>Eduvision</strong>
            <span>Smart attendance</span>
          </div>
        </div>
        <div className="welcome-box">Welcome back, Diana Rabah</div>
      </header>

      <div className="dashboard-layout">
        <aside className="sidebar">
          <p className="sidebar-note">Instructor workspace</p>
          <nav className="sidebar-nav" aria-label="Primary">
            {navItems.map((item) => (
              <button
                key={item}
                type="button"
                className={`nav-button ${item === 'Attendance' ? 'active' : ''}`}
              >
                {item}
              </button>
            ))}
          </nav>
        </aside>

        <section className="content-panel">
          <div className="page-header">
            <h1>Instructor Dashboard</h1>
            <p>Monitor live check-ins and keep attendance verified in one place.</p>
          </div>

          <section className="course-banner">
            <span className="course-label">Current Class</span>
            <strong>CSCE 2100</strong>
          </section>

          <section className="session-grid">
            <div className="session-controls">
              <div className="status-box">
                <span className="status-label">Session Status:</span>
                <strong>{sessionActive ? 'Active' : 'Inactive'}</strong>
              </div>

              <div className="action-box">
                <p>Open the live check-in window so attendance tracking begins for this class.</p>
                <button
                  type="button"
                  className="session-button"
                  onClick={() => setSessionActive(true)}
                >
                  Session Start
                </button>
              </div>

              <div className="action-box">
                <p>Close the session once attendance has been finalized for the roster.</p>
                <button
                  type="button"
                  className="session-button"
                  onClick={() => setSessionActive(false)}
                >
                  Session End
                </button>
              </div>
            </div>
          </section>

          <section className="attendance-section">
            <div className="attendance-summary">
              <span>Present: {presentCount}</span>
              <span>Verified: {verifiedCount}</span>
              <span>Roster: {students.length}</span>
            </div>

            <div className="attendance-table" role="table" aria-label="Attendance grid">
              <div className="table-head" role="row">
                <span role="columnheader">Student</span>
                <span role="columnheader">1st check</span>
                <span role="columnheader">15 min check</span>
                <span role="columnheader">Status</span>
              </div>

              {students.map((student) => (
                <div className="table-row" role="row" key={student.id}>
                  <div className="student-cell">
                    <span className="student-avatar" aria-hidden="true">
                      {student.name
                        .split(' ')
                        .map((part) => part[0])
                        .join('')}
                    </span>
                    <strong>{student.name}</strong>
                  </div>

                  <button
                    type="button"
                    className={`check-button ${student.firstCheck ? 'checked' : ''}`}
                    onClick={() => markCheck(student.id, 'firstCheck')}
                    aria-pressed={student.firstCheck}
                  >
                    {student.firstCheck ? '✓' : '○'}
                  </button>

                  <button
                    type="button"
                    className={`check-button ${student.secondCheck ? 'checked' : ''}`}
                    onClick={() => markCheck(student.id, 'secondCheck')}
                    aria-pressed={student.secondCheck}
                    disabled={!student.firstCheck}
                  >
                    {student.secondCheck ? '✓' : '○'}
                  </button>

                  <span className={`status-pill status-${student.status.toLowerCase()}`}>
                    {student.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  )
}

export default App
