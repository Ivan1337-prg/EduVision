import Session from '../utils/Session.jsx'

function Dashboard({ onEndSession, onStartSession, session, sessionLoading, sessionMessage }) {
  return (
    <>
      <div className="page-heading">
        <div><p className="eyebrow">Your classroom at a glance</p><h1>Dashboard</h1><p className="page-copy">Set up your session. We’ll help you keep track.</p></div>
        <span className={`session-pill ${session ? 'is-active' : ''}`}><span aria-hidden="true">●</span> {session ? 'Session active' : 'No active session'}</span>
      </div>

      <div className="class-info">
        <span className="eyebrow">Current class</span>
        <h3 className="class-name">CSCE 4901 - Software Engineering Capstone</h3>
        <p className="class-copy">Start a session and share its ID with your students to open check-in.</p>
      </div>

      <Session
        session={session}
        sessionLoading={sessionLoading}
        sessionMessage={sessionMessage}
        onEndSession={onEndSession}
        onStartSession={onStartSession}
      />
    </>
  )
}

export default Dashboard
